"""
DCF Service Layer - Orchestrates DCF calculations and analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.core.dcf_calculations import DCFCalculator
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

    def get_dcf_analysis(self, ticker: str) -> Dict[str, Any]:
        """
        Get complete DCF analysis for a company using cached data or real-time calculation.
        Orchestrates the overall DCF analysis flow.

        Args:
            ticker: Company ticker symbol

        Returns:
            Complete DCF analysis results with cache status
        """
        # Try to get cached analysis first
        cached_result = self._try_get_cached_analysis(ticker)
        if cached_result:
            return cached_result

        # No cache - calculate fresh DCF
        dcf_analysis = self._calculate_fresh_dcf(ticker)

        # Cache the results for future use
        self._cache_dcf_analysis(ticker, dcf_analysis)

        return dcf_analysis

    def _try_get_cached_analysis(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Try to retrieve and validate cached DCF analysis.

        Args:
            ticker: Company ticker symbol

        Returns:
            Validated cached analysis or None if not available
        """
        try:
            cached_dcf = self._get_cached_dcf_analysis(ticker)
            if not cached_dcf:
                return None

            logger.info(f"Using cached DCF analysis for {ticker}")
            cached_dcf["cache_status"] = "cached"
            cached_dcf["cache_warning"] = False
            cached_dcf["analysis_warning"] = None

            # Validate cached intrinsic value
            intrinsic_value = cached_dcf.get("base_results", {}).get("intrinsic_value", 0)
            if intrinsic_value == 0:
                logger.warning(f"Cached DCF analysis for {ticker} has zero intrinsic value")
                cached_dcf["analysis_warning"] = (
                    "Cached DCF analysis shows zero intrinsic value. "
                    "Consider using the overwrite endpoint to re-scrape and recalculate."
                )

            return cached_dcf

        except ValueError as cache_error:
            logger.warning(f"Cache retrieval failed for {ticker}: {cache_error!s}")
            return None

    def _calculate_fresh_dcf(self, ticker: str) -> Dict[str, Any]:
        """
        Calculate fresh DCF analysis from financial data.

        Args:
            ticker: Company ticker symbol

        Returns:
            Complete DCF analysis results
        """
        logger.info(f"No cached DCF found for {ticker}, performing real-time calculation")

        # Fetch financial data from cloud storage
        financial_data = self._fetch_financial_data(ticker)
        if not financial_data:
            raise ValueError(f"No financial data found for {ticker}")

        # Create DCF calculator and run analysis
        self.create_dcf_calculator(ticker, financial_data)
        dcf_results = self.run_dcf_analysis()

        # Get current stock price for comparison
        current_price = self._get_current_stock_price(ticker)

        # Build and finalize response
        dcf_analysis = self._build_dcf_response(ticker, dcf_results, current_price)
        dcf_analysis = self._finalize_dcf_response(
            ticker,
            dcf_analysis,
            warning="Analysis completed - data was recalculated (no cached data available).",
        )

        return dcf_analysis

    def _finalize_dcf_response(
        self, ticker: str, dcf_analysis: Dict[str, Any], warning: str
    ) -> Dict[str, Any]:
        """
        Finalize DCF response with metadata and validation.

        Args:
            ticker: Company ticker symbol
            dcf_analysis: DCF analysis data
            warning: Warning message to display

        Returns:
            Finalized DCF analysis with metadata
        """
        dcf_analysis["cache_status"] = "calculated"
        dcf_analysis["cache_warning"] = True
        dcf_analysis["scraping_status"] = self._current_scraping_status or "completed"

        # Validate intrinsic value
        intrinsic_value = dcf_analysis.get("base_results", {}).get("intrinsic_value", 0)
        if intrinsic_value == 0:
            logger.warning(f"DCF analysis for {ticker} resulted in zero intrinsic value")
            dcf_analysis["analysis_warning"] = (
                "DCF analysis resulted in zero intrinsic value. "
                "This may indicate issues with financial data extraction "
                "or calculation parameters. "
                "Consider using the overwrite endpoint to re-scrape data."
            )
        else:
            dcf_analysis["analysis_warning"] = warning

        return dcf_analysis

    def _fetch_financial_data(  # noqa: PLR0912, PLR0915
        self, ticker: str
    ) -> Optional[Dict[int, Dict[str, Any]]]:
        """
        Fetch financial data from cloud storage for multiple years.
        If not found, automatically scrape and process data from SEC filings.

        Args:
            ticker: Company ticker symbol

        Returns:
            Financial data organized by year
        """
        try:
            # List available financial analysis files
            files = self.cloud_storage_service.list_files(
                ticker.upper(), "financial_analysis_*.json"
            )

            if not files:
                logger.warning(
                    f"No financial analysis files found for {ticker}, attempting to scrape data..."
                )

                # Try to scrape and process financial data automatically
                try:
                    processor = FinancialDataProcessor()

                    # Set scraping status for frontend
                    self._current_scraping_status = (
                        f"Scraping financial data for {ticker} from Yahoo Finance..."
                    )

                    financial_data = processor.process_company_financial_data(ticker.upper())

                    if financial_data:
                        logger.info(
                            f"Successfully scraped and processed financial data for {ticker}"
                        )
                        self._current_scraping_status = (
                            f"Successfully scraped financial data for {ticker}"
                        )
                        return financial_data
                    else:
                        logger.warning(f"Could not scrape financial data for {ticker}")
                        self._current_scraping_status = (
                            f"Failed to scrape financial data for {ticker}"
                        )
                        return None

                except (ValueError, OSError, KeyError) as scrape_error:
                    logger.error(f"Error scraping financial data for {ticker}: {scrape_error!s}")
                    self._current_scraping_status = (
                        f"Error scraping financial data for {ticker}: {scrape_error!s}"
                    )
                    return None

            financial_data = {}

            # Process each year's financial data
            for filename in files:
                try:
                    # Extract year from filename (e.g., "financial_analysis_2024.json" -> 2024)
                    if "financial_analysis_" in filename:
                        year_str = filename.replace("financial_analysis_", "").replace(".json", "")

                        # Handle different year formats
                        if "-" in year_str:
                            year_str = year_str.split("-")[0]  # Take first part if date format

                        try:
                            year = int(year_str)
                        except ValueError:
                            continue

                        # Read financial data for this year
                        year_data = self.cloud_storage_service.read_json_file(
                            ticker.upper(), filename
                        )

                        if year_data and "financial_metrics" in year_data:
                            # Apply field mapping to cached data
                            yahoo_service = self.yahoo_service
                            mapped_data = yahoo_service._map_financial_fields(
                                year_data["financial_metrics"]
                            )

                            # Add shares outstanding and other market data
                            stock_info = yahoo_service.get_stock_info(ticker.upper())
                            if stock_info:
                                # Add shares outstanding (convert to millions)
                                if stock_info.get("shares_outstanding"):
                                    shares_outstanding = stock_info["shares_outstanding"]
                                    mapped_data["Shares Outstanding"] = (
                                        shares_outstanding / 1_000_000
                                    )

                                # Add real beta
                                if stock_info.get("beta"):
                                    mapped_data["Beta"] = stock_info["beta"]

                                # Add total debt and cash from market data if missing
                                if not mapped_data.get("Total Debt"):
                                    # Get from balance sheet via DCF market data
                                    dcf_market_data = yahoo_service.get_dcf_market_data(
                                        ticker.upper()
                                    )
                                    if dcf_market_data and dcf_market_data.get("total_debt"):
                                        # Convert from dollars to millions
                                        mapped_data["Total Debt"] = (
                                            dcf_market_data["total_debt"] / 1_000_000
                                        )

                                    if dcf_market_data and dcf_market_data.get("total_cash"):
                                        # Convert from dollars to millions
                                        if not mapped_data.get("Cash and Cash Equivalents"):
                                            mapped_data["Cash and Cash Equivalents"] = (
                                                dcf_market_data["total_cash"] / 1_000_000
                                            )

                            # Add cost of debt calculation with fallback
                            interest_expense = mapped_data.get(
                                "Interest and other income (expense), net", 0
                            )
                            # Use "Total Debt" (consistent with field mapping)
                            total_debt = mapped_data.get("Total Debt", 0)
                            if total_debt > 0:
                                cost_of_debt = abs(interest_expense) / total_debt
                                # Sanity check: cost of debt should be reasonable (0% to 20%)
                                if 0 <= cost_of_debt <= 0.20:
                                    mapped_data["Cost of Debt"] = cost_of_debt
                                else:
                                    # Use fallback for unreasonable cost of debt
                                    mapped_data["Cost of Debt"] = 0.055  # 5.5% fallback
                            else:
                                # For debt-free companies, use risk-free rate + premium
                                mapped_data["Cost of Debt"] = 0.055  # 5.5% fallback

                            financial_data[year] = mapped_data

                except (ValueError, KeyError, OSError, TypeError) as e:
                    logger.warning(f"Error processing file {filename}: {e!s}")
                    continue

            if not financial_data:
                logger.warning(f"No valid financial data found for {ticker}")
                return None

            years_list = list(financial_data.keys())
            logger.info(f"Successfully loaded financial data for {ticker} for years: {years_list}")
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

    def _build_dcf_response(
        self, ticker: str, dcf_results: Dict[str, Any], current_price: Optional[float]
    ) -> Dict[str, Any]:
        """
        Build comprehensive DCF response with scenarios.

        Args:
            ticker: Company ticker symbol
            dcf_results: DCF calculation results
            current_price: Current stock price

        Returns:
            Complete DCF analysis response
        """
        per_share_value = dcf_results.get("per_share_value", 0)
        enterprise_value = dcf_results.get("enterprise_value", 0)
        equity_value = dcf_results.get("equity_value", 0)
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

    def create_dcf_calculator(
        self,
        ticker: str,
        financial_data: Dict[Any, Dict[str, Any]],
        base_year: Optional[Any] = None,
    ) -> DCFCalculator:
        """
        Create and configure a DCF calculator instance.

        Args:
            ticker: Company ticker symbol
            financial_data: Historical financial data by year (can have string or int keys)
            base_year: Base year for projections (can be string or int)

        Returns:
            Configured DCFCalculator instance
        """
        # Convert string keys to integers if needed for compatibility
        if financial_data and isinstance(next(iter(financial_data.keys())), str):
            converted_financial_data = {}
            for key, value in financial_data.items():
                try:
                    converted_key = int(key)
                    converted_financial_data[converted_key] = value
                except (ValueError, TypeError):
                    # If we can't convert to int, keep the original key
                    converted_financial_data[key] = value

            # Convert base_year if it's a string
            if base_year and isinstance(base_year, str):
                try:
                    base_year = int(base_year)
                except (ValueError, TypeError):
                    pass

            financial_data = converted_financial_data

        # Fetch market data from Yahoo Finance service (separation of concerns)
        try:
            market_data = self.yahoo_service.get_dcf_market_data(ticker)
            logger.info(f"Fetched market data for DCF: {market_data}")
        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.warning(f"Could not fetch market data for {ticker}: {e}. Using defaults.")
            market_data = {
                "beta": 1.0,
                "tax_rate": 0.24,
                "market_cap": 0,
                "total_cash": 0,
                "shares_outstanding": 0,
            }

        # Get the latest financial data (DCFCalculator expects a single year's data)
        if base_year is None:
            base_year = max(financial_data.keys())

        # Store base_year for reference
        self.base_year = base_year

        latest_financial_data = financial_data.get(base_year, {})

        # Create DCF calculator with all required data
        self.dcf_calculator = DCFCalculator(
            ticker=ticker,
            financial_data=latest_financial_data,
            beta=market_data["beta"],
            tax_rate=market_data["tax_rate"],
            market_cap=market_data["market_cap"],
            total_cash=market_data["total_cash"],
            shares_outstanding=market_data["shares_outstanding"],
        )

        # Store base_year in the calculator for test access
        self.dcf_calculator.base_year = base_year

        # Apply Apple-specific parameters if ticker is AAPL
        if ticker.upper() == "AAPL":
            self.dcf_calculator.wacc = 0.09  # 9% WACC for Apple
            self.dcf_calculator.terminal_growth_rate = 0.035  # 3.5% terminal growth
            self.dcf_calculator.tax_rate = 0.24  # Apple's effective tax rate

        return self.dcf_calculator

    def run_dcf_analysis(
        self, earnings_growth_rate: float = None, years: int = 5
    ) -> Dict[str, Any]:
        """
        Run complete DCF analysis.

        Args:
            earnings_growth_rate: Expected earnings growth rate
                (if None, uses company-specific default)
            years: Number of years to project

        Returns:
            DCF analysis results
        """
        if not self.dcf_calculator:
            raise ValueError("DCF calculator not initialized. Call create_dcf_calculator first.")

        # Use company-specific growth rate if not provided
        if earnings_growth_rate is None:
            if self.dcf_calculator.ticker.upper() == "AAPL":
                earnings_growth_rate = 0.06  # 6% growth for Apple
            else:
                earnings_growth_rate = 0.15  # Default 15% growth

        projections = self.dcf_calculator.project_financials(
            growth_rate=earnings_growth_rate, years=years
        )

        enterprise_value = self.dcf_calculator.calculate_enterprise_value(projections)
        equity_value = self.dcf_calculator.calculate_equity_value(enterprise_value)

        # Calculate per share value using DCF calculator's internal shares outstanding
        per_share_value = self.dcf_calculator.calculate_per_share_value(equity_value)

        return {
            "projections": projections,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "per_share_value": per_share_value,
            "growth_rate": earnings_growth_rate,
        }

    def _get_cached_dcf_analysis(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get cached DCF analysis from cloud storage.

        Args:
            ticker: Company ticker symbol

        Returns:
            Cached DCF analysis data or None if not found/expired
        """
        try:
            cached_data = self.cloud_storage_service.load_company_data(ticker.upper(), "dcf")

            if cached_data and "data" in cached_data:
                dcf_data = cached_data["data"]

                # Check if cache is still valid (24 hours)
                cache_timestamp = dcf_data.get("cache_timestamp")
                if cache_timestamp:
                    cache_time = datetime.fromisoformat(cache_timestamp)
                    if datetime.now() - cache_time < timedelta(hours=24):
                        logger.info(f"Found valid cached DCF analysis for {ticker}")
                        return dcf_data
                    else:
                        logger.info(f"Cached DCF analysis for {ticker} has expired")
                        return None
                else:
                    logger.info(f"Using cached DCF analysis for {ticker} (no timestamp)")
                    return dcf_data

            return None

        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.error(f"Error retrieving cached DCF analysis for {ticker}: {e!s}")
            # Re-raise the exception so the calling method can handle it appropriately
            raise ValueError(f"Failed to retrieve cached data for {ticker}: {e!s}") from e

    def _cache_dcf_analysis(self, ticker: str, dcf_analysis: Dict[str, Any]) -> None:
        """
        Cache DCF analysis results to cloud storage.

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
