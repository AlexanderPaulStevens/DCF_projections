"""
DCF Service Layer - Orchestrates DCF calculations and analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.core.dcf_calculations import DCFCalculator
from app.schemas.dcf_inputs import DCFFinancialData, DCFMarketData, DCFRatioData
from app.services.cloud_storage_service import CloudStorageService
from app.services.financial_data_processor import FinancialDataProcessor
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class DCFService:
    """
    Service layer for DCF analysis operations.
    Handles business logic and coordinates between different components.
    """

    def __init__(self):
        self.dcf_calculator = None
        self.sensitivity_analyzer = None
        self.cloud_storage_service = CloudStorageService()
        self._current_scraping_status = None
        self.yahoo_service = YahooFinanceService()
        self.financial_processor = FinancialDataProcessor()

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
            "terminal_growth_rate": 0.035,  # 3.5% - Long-term GDP growth
            "risk_free_rate": 0.035,  # 3.5% - 10-year Treasury
            "market_risk_premium": 0.050,  # 5.0%
            "capex_to_revenue": 0.035,  # 3.5% - Moderate capital intensity
            "da_to_revenue": 0.035,  # 3.5% - Depreciation & Amortization ratio
            "wc_to_revenue": 0.05,  # 5% - Net Working Capital ratio
        }

        return default_config

    def _load_financial_files_from_cloud(self, ticker: str) -> list[str]:
        """
        List available financial analysis files from cloud storage.

        Args:
            ticker: Company ticker symbol

        Returns:
            List of financial analysis filenames
        """
        return self.cloud_storage_service.list_files(ticker.upper(), "financial_analysis_*.json")

    def _parse_year_from_filename(self, filename: str) -> Optional[int]:
        """
        Extract year from financial analysis filename.

        Args:
            filename: Financial analysis filename (e.g., "financial_analysis_2024.json")

        Returns:
            Year as integer, or None if parsing fails
        """
        if "financial_analysis_" not in filename:
            return None

        year_str = filename.replace("financial_analysis_", "").replace(".json", "")

        # Handle different year formats (e.g., "2024" or "2024-12-31")
        if "-" in year_str:
            year_str = year_str.split("-")[0]

        try:
            return int(year_str)
        except ValueError:
            return None

    def _enrich_with_market_data(self, ticker: str, financial_metrics: dict) -> dict:
        """
        Enrich financial data with market data (shares, beta, debt, cash).

        Args:
            ticker: Company ticker symbol
            financial_metrics: Base financial metrics

        Returns:
            Enriched financial data with market metrics added
        """
        enriched = financial_metrics.copy()

        # Get stock info (shares, beta)
        stock_info = self.yahoo_service.get_stock_info(ticker.upper())
        if stock_info:
            # Add shares outstanding (convert to millions)
            if stock_info.get("shares_outstanding"):
                enriched["Shares Outstanding"] = stock_info["shares_outstanding"] / 1_000_000

            # Add beta
            if stock_info.get("beta"):
                enriched["Beta"] = stock_info["beta"]

        # Add debt and cash if missing
        if not enriched.get("Total Debt") or not enriched.get("Cash and Cash Equivalents"):
            try:
                dcf_market_data = self.yahoo_service.get_dcf_market_data(ticker.upper())

                if not enriched.get("Total Debt") and dcf_market_data.get("total_debt"):
                    enriched["Total Debt"] = dcf_market_data["total_debt"] / 1_000_000

                if not enriched.get("Cash and Cash Equivalents") and dcf_market_data.get(
                    "total_cash"
                ):
                    enriched["Cash and Cash Equivalents"] = (
                        dcf_market_data["total_cash"] / 1_000_000
                    )
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Could not fetch DCF market data: {e}")

        # Calculate cost of debt
        interest_expense = enriched.get("Interest and other income (expense), net", 0)
        total_debt = enriched.get("Total Debt", 0)

        if total_debt > 0:
            cost_of_debt = abs(interest_expense) / total_debt
            # Sanity check: 0% to 20%
            if 0 <= cost_of_debt <= 0.20:
                enriched["Cost of Debt"] = cost_of_debt
            else:
                enriched["Cost of Debt"] = 0.055  # Fallback
        else:
            enriched["Cost of Debt"] = 0.055  # Fallback for debt-free companies

        return enriched

    def _fetch_financial_data(
        self, ticker: str, force_rescrape: bool = False
    ) -> Optional[Dict[int, Dict[str, Any]]]:
        """
        Fetch financial data from cloud storage for multiple years.
        If not found, automatically scrape and process data from SEC filings.

        Args:
            ticker: Company ticker symbol
            force_rescrape: If True, bypass cloud storage and force re-scrape

        Returns:
            Financial data organized by year
        """
        try:
            # Force rescrape if requested
            if force_rescrape:
                logger.info(f"Force re-scraping financial data for {ticker}")
                return self.financial_processor._scrape_financial_data(ticker)

            # Load available files from cloud storage
            files = self._load_financial_files_from_cloud(ticker)
            if not files:
                logger.warning(f"No financial files found for {ticker}, attempting to scrape...")
                return self.financial_processor._scrape_financial_data(ticker)

            # Process each year's file
            financial_data = {}
            for filename in files:
                try:
                    # Extract year from filename
                    year = self._parse_year_from_filename(filename)
                    if year is None:
                        continue

                    # Read file data
                    year_data = self.cloud_storage_service.read_json_file(ticker.upper(), filename)
                    if not year_data or "financial_metrics" not in year_data:
                        continue

                    # Map and enrich financial data
                    mapped_data = self.yahoo_service._map_financial_fields(
                        year_data["financial_metrics"]
                    )
                    enriched_data = self._enrich_with_market_data(ticker, mapped_data)

                    financial_data[year] = enriched_data

                except (ValueError, KeyError, OSError, TypeError) as e:
                    logger.warning(f"Error processing file {filename}: {e!s}")
                    continue

            if not financial_data:
                logger.warning(f"No valid financial data found for {ticker}")
                return None

            logger.info(f"Loaded financial data for {ticker}: years {list(financial_data.keys())}")
            return financial_data

        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.error(f"Error fetching financial data for {ticker}: {e!s}")
            return None

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

    def _find_field_value(self, data: Dict[str, Any], field_names: list[str]) -> tuple[Any, bool]:
        """
        Helper to find first matching field from a list of possible names.

        Args:
            data: Dictionary to search
            field_names: List of possible field names to try

        Returns:
            Tuple of (value, found) where found is True if value was found
        """
        for field in field_names:
            if data.get(field):
                return data[field], True
        return None, False

    def _prepare_financial_data_for_dcf(
        self, financial_data: Dict[str, Any], market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare and standardize financial data for DCF calculator.

        This method handles:
        - Converting raw values to millions
        - Standardizing field names
        - Ensuring all required fields are present

        Args:
            financial_data: Raw financial data (may have flexible field names)
            market_data: Market data from Yahoo Finance (raw values)

        Returns:
            Standardized financial data with all values in millions
        """
        prepared_data = {}

        # Standardize Revenue
        revenue, _ = self._find_field_value(
            financial_data, ["Total net sales", "Revenue", "Net sales", "Total revenue"]
        )
        if revenue:
            prepared_data["Revenue"] = revenue

        # Standardize EBIT
        ebit, _ = self._find_field_value(
            financial_data,
            [
                "EBIT (Operating Income + Other Income/Expense)",
                "EBIT",
                "Operating income",
                "Operating Income",
            ],
        )
        if ebit:
            prepared_data["EBIT"] = ebit

        # Standardize Cash
        cash, cash_found = self._find_field_value(
            financial_data, ["Cash and Cash Equivalents", "Cash", "Cash and cash equivalents"]
        )
        if cash_found:
            prepared_data["Cash and Cash Equivalents"] = cash
        elif market_data.get("total_cash"):
            prepared_data["Cash and Cash Equivalents"] = market_data["total_cash"] / 1_000_000

        # Standardize Shares Outstanding
        shares, shares_found = self._find_field_value(
            financial_data, ["Shares Outstanding", "Diluted", "Basic", "shares_outstanding"]
        )
        if shares_found:
            prepared_data["Shares Outstanding"] = shares
        elif market_data.get("shares_outstanding"):
            prepared_data["Shares Outstanding"] = market_data["shares_outstanding"] / 1_000_000

        # Standardize Total Debt
        if "Total Debt" in financial_data:
            prepared_data["Total Debt"] = financial_data["Total Debt"]
        elif market_data.get("total_debt"):
            prepared_data["Total Debt"] = market_data["total_debt"] / 1_000_000
        else:
            prepared_data["Total Debt"] = 0

        # Pass through optional fields
        if "Cost of Debt" in financial_data:
            prepared_data["Cost of Debt"] = financial_data["Cost of Debt"]

        if "Interest and other income (expense), net" in financial_data:
            prepared_data["Interest and other income (expense), net"] = financial_data[
                "Interest and other income (expense), net"
            ]

        return prepared_data

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

    def get_dcf_analysis(self, ticker: str, force_rescrape: bool = False) -> Dict[str, Any]:
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
        dcf_result = self._compute_dcf(ticker, force_rescrape)

        # Cache the result
        self._save_to_cache(ticker, dcf_result)

        return dcf_result

    def _compute_dcf(self, ticker: str, force_rescrape: bool) -> Dict[str, Any]:
        """
        Compute DCF analysis from scratch.

        Flow: Fetch data → Prepare calculator → Calculate valuation → Format response

        Args:
            ticker: Company ticker symbol
            force_rescrape: Whether to re-scrape financial data

        Returns:
            Complete DCF analysis result
        """
        # Step 1: Fetch financial data
        financial_data = self._fetch_financial_data(ticker, force_rescrape=force_rescrape)

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
        prepared_financial = self._prepare_financial_data_for_dcf(latest_data, market_data)

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

        # Validate with Pydantic schemas
        validated_financial = DCFFinancialData(**prepared_financial)
        validated_market = DCFMarketData(**prepared_market)
        validated_ratios = DCFRatioData(**prepared_ratios)

        # Instantiate calculator
        calculator = DCFCalculator(
            ticker=ticker,
            financial_data=validated_financial,
            market_data=validated_market,
            ratio_data=validated_ratios,
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
