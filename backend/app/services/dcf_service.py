"""
DCF Service Layer - Orchestrates DCF calculations and analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.core.data_transformation import DataTransformation
from app.core.dcf_calculations import DCFCalculator
from app.services.cloud_storage_service import CloudStorageService
from app.services.financial_data_service import FinancialDataService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class DCFService:
    """
    Service layer for DCF analysis operations.
    Handles business logic and coordinates between different components.
    """

    def __init__(self):
        self.dcf_calculator = None
        self.cloud_storage_service = CloudStorageService()
        self.data_transformer = DataTransformation()
        self.financial_service = FinancialDataService()
        self.yahoo_service = YahooFinanceService()

    def _get_company_default_config(self) -> dict:
        """
        Get company-specific DCF parameters.

        Different companies have different characteristics that affect DCF assumptions:
        - Growth rates (mature vs growth companies)
        - Terminal growth rates
        - Market assumptions (risk-free rate, MRP)
        - Operating ratios (CapEx, D&A, NWC as % of revenue)

        For now, we are using a default config for all companies.

        Returns:
            Dict with company-specific parameters
        """

        # Default configuration for most companies
        default_config = {
            "growth_rate": 0.20,  # 20% - Higher growth assumption
            "terminal_growth_rate": 0.030,  # 3.0% - Long-term GDP growth
            "risk_free_rate": 0.035,  # 3.5% - 10-year Treasury
            "market_risk_premium": 0.050,  # 5.0%
            "capex_to_revenue": 0.035,  # 3.5% - Moderate capital intensity
            "da_to_revenue": 0.035,  # 3.5% - Depreciation & Amortization ratio
            "wc_to_revenue": 0.05,  # 5% - Net Working Capital ratio
        }

        return default_config

    def _get_current_stock_price(self, ticker: str) -> Optional[float]:
        """
        Get current stock price from Yahoo Finance.

        Args:
            ticker: Company ticker symbol

        Returns:
            Current stock price or None if not available
        """
        try:
            stock_info = self.yahoo_service.get_stock_info(ticker.upper())
            if stock_info and "current_price" in stock_info:
                return stock_info["current_price"]
            return None
        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.warning(f"Could not get current stock price for {ticker}: {e!s}")
            return None

    def _format_response(
        self, ticker: str, valuation: Dict[str, Any], current_price: Optional[float]
    ) -> Dict[str, Any]:
        """
        Format DCF valuation into API response structure.

        Args:
            ticker: Company ticker symbol
            valuation: DCF valuation results
            current_price: Current stock price for comparison

        Returns:
            Formatted DCF analysis response
        """
        per_share_value = valuation.get("per_share_value", 0)
        enterprise_value = valuation.get("enterprise_value", 0)
        equity_value = valuation.get("equity_value", 0)
        current_price = current_price or 0

        # Calculate upside/downside
        upside = (
            ((per_share_value - current_price) / current_price * 100) if current_price > 0 else 0
        )

        # Get DCF calculator values safely
        wacc = getattr(self.dcf_calculator, "wacc", 0.08) if self.dcf_calculator else 0.08
        terminal_growth_rate = (
            getattr(self.dcf_calculator, "terminal_growth_rate", 0.03)
            if self.dcf_calculator
            else 0.03
        )

        # Build base results
        base_results = {
            "intrinsic_value": per_share_value,
            "current_price": current_price,
            "upside": upside,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "wacc": wacc,
            "terminal_growth_rate": terminal_growth_rate,
        }

        return {
            "ticker": ticker.upper(),
            "base_results": base_results,
            # Warning should only be set during analysis, not after completion
            "analysis_warning": None,
        }

    def _get_from_cache(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve and validate cached DCF analysis.

        Args:
            ticker: Company ticker symbol

        Returns:
            Cached DCF analysis with metadata, or None if unavailable/expired
        """
        try:
            cached_data = self.cloud_storage_service.load_company_data(ticker.upper(), "dcf")

            if not cached_data or "data" not in cached_data:
                return None

            dcf_data = cached_data["data"]

            # Check if cache is still valid (24 hours)
            cache_timestamp = dcf_data.get("cache_timestamp")
            if cache_timestamp:
                cache_time = datetime.fromisoformat(cache_timestamp)
                if datetime.now() - cache_time < timedelta(hours=24):
                    logger.info(f"Using valid cached DCF analysis for {ticker}")
                else:
                    logger.info(f"Cached DCF analysis for {ticker} has expired")
                    return None
            else:
                logger.info(f"Using cached DCF analysis for {ticker} (no timestamp)")

            # Add cache metadata
            dcf_data["cache_status"] = "cached"
            dcf_data["cache_warning"] = False
            dcf_data["analysis_warning"] = None

            # Validate cached intrinsic value
            intrinsic_value = dcf_data.get("base_results", {}).get("intrinsic_value", 0)
            if intrinsic_value == 0:
                logger.warning(f"Cached DCF analysis for {ticker} has zero intrinsic value")
                dcf_data["analysis_warning"] = (
                    "Cached DCF analysis shows zero intrinsic value. "
                    "Consider using force_rescrape=true to re-scrape and recalculate."
                )

            return dcf_data

        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.warning(f"Cache retrieval failed for {ticker}: {e!s}")
            return None

    def _save_to_cache(self, ticker: str, dcf_analysis: Dict[str, Any]) -> None:
        """
        Save DCF analysis to cloud storage cache.

        Args:
            ticker: Company ticker symbol
            dcf_analysis: DCF analysis results to cache
        """
        try:
            # Add cache timestamp
            dcf_analysis["cache_timestamp"] = datetime.now().isoformat()

            # Use unified helper to save DCF data
            success = self.cloud_storage_service.save_company_data(
                ticker.upper(),
                "dcf",
                dcf_analysis,
                metadata={
                    "analysis_type": "dcf",
                    "cache_timestamp": dcf_analysis["cache_timestamp"],
                },
            )

            if success:
                logger.info(f"Successfully cached DCF analysis for {ticker}")
            else:
                logger.error(f"Failed to cache DCF analysis for {ticker}")

        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.error(f"Error caching DCF analysis for {ticker}: {e!s}")
            # Don't raise exception - caching failure shouldn't break the main flow

    async def get_dcf_analysis(self, ticker: str, force_rescrape: bool = False) -> Dict[str, Any]:
        """
        Main entry point: Get DCF analysis with automatic caching.

        Flow: Check cache → If miss/force: compute → Cache result → Return

        Args:
            ticker: Company ticker symbol
            force_rescrape: If True, bypass cache and re-scrape financial data

        Returns:
            Complete DCF analysis with cache status
        """
        # Try cache first (unless forcing rescrape)
        if not force_rescrape:
            cached = self._get_from_cache(ticker)
            if cached:
                return cached

        # Cache miss or forced rescrape: compute fresh DCF
        logger.info(f"Computing fresh DCF for {ticker} (force_rescrape={force_rescrape})")
        dcf_result = await self._compute_dcf(ticker, force_rescrape)

        # Cache the result
        self._save_to_cache(ticker, dcf_result)

        return dcf_result

    async def _compute_dcf(self, ticker: str, force_rescrape: bool) -> Dict[str, Any]:
        """
        Compute DCF analysis from scratch.

        Flow: Fetch data → Prepare calculator → Calculate valuation → Format response

        Args:
            ticker: Company ticker symbol
            force_rescrape: Whether to re-scrape financial data

        Returns:
            Complete DCF analysis result
        """
        # Step 1: Get financial data using FinancialDataService
        financial_data = await self._get_financial_data_for_dcf(ticker, force_rescrape)

        # Step 2: Prepare calculator with data
        calculator = self._prepare_calculator(ticker, financial_data)

        # Step 3: Calculate valuation
        valuation = self._calculate_valuation(calculator)

        # Step 4: Get current price for comparison
        current_price = self._get_current_stock_price(ticker)

        # Step 5: Format final response
        result = self._format_response(ticker, valuation, current_price)

        # Add cache status
        result["cache_status"] = "overwritten" if force_rescrape else "calculated"

        return result

    async def _get_financial_data_for_dcf(
        self, ticker: str, force_rescrape: bool
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get financial data for DCF analysis with fallback mechanism.

        Flow:
        1. Try cached processed financial data
        2. If not found, scrape and process financial data
        3. Extract financial metrics for DCF calculation

        Args:
            ticker: Company ticker symbol
            force_rescrape: Whether to force refresh from source

        Returns:
            Financial data organized by year
        """
        try:
            # Step 1: Try to get cached processed financial data (unless forcing rescrape)
            processed_data = None
            if not force_rescrape:
                processed_data = await self.financial_service.get_cached_processed_financial_data(
                    ticker
                )

            if not processed_data or not processed_data.get("financial_statements"):
                action = (
                    "Force rescraping" if force_rescrape else "No cached financial data found for"
                )
                logger.info(f"{action} {ticker}, attempting to scrape and process")

                # Step 2: Scrape and process financial data
                try:
                    await self.financial_service.scrape_and_process_financial_data(ticker)
                    # Try to get the data again after scraping
                    processed_data = (
                        await self.financial_service.get_cached_processed_financial_data(ticker)
                    )
                except Exception as scrape_error:
                    logger.error(f"Failed to scrape financial data for {ticker}: {scrape_error}")
                    if force_rescrape:
                        raise ValueError(
                            f"Rescraping failed for {ticker}: {scrape_error}"
                        ) from scrape_error
                    else:
                        raise ValueError(
                            f"Failed to get financial data for {ticker}: {scrape_error}"
                        ) from scrape_error

                if not processed_data or not processed_data.get("financial_statements"):
                    if force_rescrape:
                        raise ValueError(
                            f"Rescraping completed but no financial data found for {ticker}"
                        )
                    else:
                        raise ValueError(f"No financial data available for {ticker} after scraping")

            # Step 3: Convert cached data to the format expected by DCF calculator
            financial_data = {}
            for year, year_data in processed_data["financial_statements"].items():
                # Extract financial metrics from cached data
                financial_metrics = year_data.get("financial_metrics", {})
                logger.info(
                    f"Processing year {year} for {ticker}: {list(financial_metrics.keys())}"
                )
                financial_data[year] = financial_metrics

            if not financial_data:
                raise ValueError(f"No valid financial data found for {ticker}")

            logger.info(f"Loaded financial data for {ticker}: years {list(financial_data.keys())}")
            return financial_data

        except Exception as e:
            logger.error(f"Error getting financial data for {ticker}: {e}")
            raise ValueError(f"Failed to get financial data for {ticker}: {e}") from e

    def _prepare_calculator(self, ticker: str, financial_data: dict) -> DCFCalculator:
        """
        Prepare data and instantiate DCF calculator.

        Flow: Get base year → Fetch market data → Standardize fields → Validate → Create calculator

        Args:
            ticker: Company ticker symbol
            financial_data: Historical financial data by year

        Returns:
            Configured DCFCalculator instance ready for calculations
        """

        base_year = max(financial_data.keys())  # most recent year
        latest_data = financial_data[base_year]

        # Fetch market data (beta, tax rate, market cap)
        try:
            market_data = self.yahoo_service.get_dcf_market_data(ticker)
            logger.info(
                f"Fetched market data: beta={market_data['beta']}, "
                f"tax_rate={market_data['tax_rate']}"
            )
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Using default market data for {ticker}: {e}")
            market_data = {
                "beta": 1.0,
                "tax_rate": 0.24,
                "market_cap": 0,
                "total_cash": 0,
                "shares_outstanding": 0,
            }

        # Get company-specific config
        config = self._get_company_default_config()

        # Standardize financial data field names and units
        logger.info(
            f"Standardizing financial data for {ticker}: "
            f"available fields: {list(latest_data.keys())}"
        )
        prepared_financial = self.data_transformer.standardize_financial_data_for_dcf(
            latest_data, market_data
        )
        logger.info(f"Prepared financial data for {ticker}: {list(prepared_financial.keys())}")

        # Prepare market data with DCF assumptions (convert to millions for consistency)
        prepared_market = {
            "beta": market_data["beta"],
            "tax_rate": market_data["tax_rate"],
            "market_cap": market_data["market_cap"] / 1_000_000,
            "terminal_growth_rate": config["terminal_growth_rate"],
            "market_risk_premium": config["market_risk_premium"],
            "risk_free_rate": config["risk_free_rate"],
        }

        # Prepare ratio data
        prepared_ratios = {
            "wc_to_revenue_ratio": config["wc_to_revenue"],
            "capex_to_revenue_ratio": config["capex_to_revenue"],
            "da_to_revenue_ratio": config["da_to_revenue"],
        }

        # Validate with Pydantic schemas (using raw data for compatibility)
        # Note: We bypass the deprecated schemas and pass raw data directly to DCFCalculator
        # The DCFCalculator will handle the data validation internally

        # Instantiate calculator with raw data
        calculator = DCFCalculator(
            ticker=ticker,
            financial_data=prepared_financial,
            market_data=prepared_market,
            ratio_data=prepared_ratios,
        )
        calculator.base_year = base_year

        return calculator

    def _calculate_valuation(
        self, calculator: DCFCalculator, growth_rate: Optional[float] = None, years: int = 5
    ) -> dict:
        """
        Execute DCF calculation to determine valuation.

        Flow: Project financials → Calculate enterprise value
        → Calculate equity value → Per-share value

        Args:
            calculator: Configured DCF calculator
            growth_rate: Constant annual revenue growth rate
            years: Number of years in explicit forecast period

        Returns:
            Valuation results (enterprise value, equity value, per-share value, projections)
        """
        # Use company-specific growth rate if not provided
        if growth_rate is None:
            config = self._get_company_default_config()
            growth_rate = config["growth_rate"]

        # Project future financials with constant growth rate
        projections = calculator.project_financials(years=years, annual_growth_rate=growth_rate)

        # Calculate values
        enterprise_value = calculator.calculate_enterprise_value(projections)
        equity_value = calculator.calculate_equity_value(enterprise_value)
        intrinsic_value_per_share = calculator.calculate_per_share_value(equity_value)

        return {
            "projections": projections,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "per_share_value": intrinsic_value_per_share,
            "growth_rate": growth_rate,
        }

    async def get_fcf_per_share(self, ticker: str, force_rescrape: bool = False) -> Dict[str, Any]:
        """
        Get Free Cash Flow per share data for a company.

        Args:
            ticker: Company ticker symbol
            force_rescrape: If True, bypass cache and re-scrape financial data

        Returns:
            FCF per share data including total FCF, shares outstanding, and FCF per share
        """
        try:
            # Get financial data using the same service as DCF
            financial_data = await self._get_financial_data_for_dcf(ticker, force_rescrape)

            if not financial_data:
                raise ValueError(f"No financial data available for {ticker}")

            # Get the most recent year's data
            most_recent_year = max(financial_data.keys())

            # Get market data for shares outstanding
            market_data = self.yahoo_service.get_dcf_market_data(ticker)

            # Get FCF data from processed financial data
            processed_data = await self.financial_service.get_cached_processed_financial_data(
                ticker
            )

            free_cash_flow = None
            shares_outstanding = None
            fcf_per_share = None

            if processed_data and "financial_statements" in processed_data:
                recent_statements = processed_data["financial_statements"].get(most_recent_year, {})

                # Get financial metrics from the processed data
                financial_metrics = recent_statements.get("financial_metrics", {})

                # Try to get FCF from financial metrics (raw field names)
                operating_cash_flow = financial_metrics.get("Operating Cash Flow")
                capital_expenditures = financial_metrics.get("Capital Expenditure")

                # Calculate FCF (CapEx is negative, so we add it)
                if operating_cash_flow is not None and capital_expenditures is not None:
                    # Convert to millions if needed (Yahoo Finance data is typically in raw units)
                    operating_cash_flow_millions = float(operating_cash_flow) / 1_000_000
                    capital_expenditures_millions = float(capital_expenditures) / 1_000_000
                    free_cash_flow = operating_cash_flow_millions + capital_expenditures_millions

                # Get shares outstanding from financial metrics or market data
                shares_outstanding_raw = financial_metrics.get("Shares Outstanding")
                if shares_outstanding_raw:
                    shares_outstanding = float(shares_outstanding_raw) / 1_000_000
                elif market_data.get("shares_outstanding"):
                    shares_outstanding = float(market_data["shares_outstanding"]) / 1_000_000

                # Calculate FCF per share
                if free_cash_flow is not None and shares_outstanding and shares_outstanding > 0:
                    # FCF is in millions, shares are in millions, result is in dollars
                    fcf_per_share = free_cash_flow / shares_outstanding

            return {
                "ticker": ticker.upper(),
                "free_cash_flow": free_cash_flow,
                "shares_outstanding": shares_outstanding,
                "fcf_per_share": fcf_per_share,
                "year": str(most_recent_year),
                "cache_status": "cached" if not force_rescrape else "calculated",
            }

        except Exception as e:
            logger.error(f"Error calculating FCF per share for {ticker}: {e}")
            raise ValueError(f"Failed to calculate FCF per share for {ticker}: {e}") from e
