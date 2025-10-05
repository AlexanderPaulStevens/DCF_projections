"""
DCF Service Layer - Orchestrates DCF calculations and analysis
"""

import logging
from typing import Any, Dict, Optional

from app.core.DCF_calculations import DCFCalculator
from app.services.cloud_storage_service import CloudStorageService
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

    def get_DCF_analysis(self, ticker: str) -> Dict[str, Any]:
        """
        Get complete DCF analysis for a company using cached data or real-time calculation.
        Always tries cache first, shows warning if rerunning analysis.

        Args:
            ticker: Company ticker symbol

        Returns:
            Complete DCF analysis results with cache status
        """
        try:
            # 1. Always try to get cached DCF analysis first
            cached_dcf = self._get_cached_dcf_analysis(ticker)
            if cached_dcf:
                logger.info(f"Using cached DCF analysis for {ticker}")
                cached_dcf["cache_status"] = "cached"
                cached_dcf["cache_warning"] = False
                cached_dcf["analysis_warning"] = None

                # Validate cached intrinsic value
                intrinsic_value = cached_dcf.get("base_results", {}).get(
                    "intrinsic_value", 0
                )
                if intrinsic_value == 0:
                    logger.warning(
                        f"Cached DCF analysis for {ticker} has zero intrinsic value"
                    )
                    cached_dcf["analysis_warning"] = (
                        f"Cached DCF analysis shows zero intrinsic value. Consider using the overwrite endpoint to re-scrape and recalculate."
                    )

                return cached_dcf

            # 2. If no cache, perform real-time calculation with warning
            logger.info(
                f"No cached DCF found for {ticker}, performing real-time calculation"
            )

            # 3. Fetch financial data from cloud storage
            financial_data = self._fetch_financial_data(ticker)

            if not financial_data:
                raise ValueError(f"No financial data found for {ticker}")

            # 4. Create DCF calculator with real data
            self.create_dcf_calculator(ticker, financial_data)

            # 5. Run DCF analysis
            dcf_results = self.run_dcf_analysis()

            # 6. Get current stock price for comparison
            current_price = self._get_current_stock_price(ticker)

            # 7. Build comprehensive response with cache warning
            dcf_analysis = self._build_dcf_response(ticker, dcf_results, current_price)
            dcf_analysis["cache_status"] = "calculated"
            dcf_analysis["cache_warning"] = True
            dcf_analysis["scraping_status"] = (
                self._current_scraping_status or "completed"
            )

            # 8. Validate intrinsic value
            intrinsic_value = dcf_analysis.get("base_results", {}).get(
                "intrinsic_value", 0
            )
            if intrinsic_value == 0:
                logger.warning(
                    f"DCF analysis for {ticker} resulted in zero intrinsic value"
                )
                dcf_analysis["analysis_warning"] = (
                    f"DCF analysis resulted in zero intrinsic value. This may indicate issues with financial data extraction or calculation parameters. Consider using the overwrite endpoint to re-scrape data."
                )

            # 9. Cache the results for future use (including cache fields)
            self._cache_dcf_analysis(ticker, dcf_analysis)

            return dcf_analysis

        except Exception as e:
            logger.error(f"Error in DCF analysis for {ticker}: {str(e)}")
            raise

    def _fetch_financial_data(self, ticker: str) -> Optional[Dict[int, Dict[str, Any]]]:
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
                    from app.services.financial_data_processor import (
                        FinancialDataProcessor,
                    )

                    processor = FinancialDataProcessor()

                    # Set scraping status for frontend
                    self._current_scraping_status = (
                        f"Scraping financial data for {ticker} from Yahoo Finance..."
                    )

                    financial_data = processor.process_company_financial_data(
                        ticker.upper()
                    )

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

                except Exception as scrape_error:
                    logger.error(
                        f"Error scraping financial data for {ticker}: {str(scrape_error)}"
                    )
                    self._current_scraping_status = f"Error scraping financial data for {ticker}: {str(scrape_error)}"
                    return None

            financial_data = {}

            # Process each year's financial data
            for filename in files:
                try:
                    # Extract year from filename (e.g., "financial_analysis_2024.json" -> 2024)
                    if "financial_analysis_" in filename:
                        year_str = filename.replace("financial_analysis_", "").replace(
                            ".json", ""
                        )

                        # Handle different year formats
                        if "-" in year_str:
                            year_str = year_str.split("-")[
                                0
                            ]  # Take first part if date format

                        try:
                            year = int(year_str)
                        except ValueError:
                            continue

                        # Read financial data for this year
                        year_data = self.cloud_storage_service.read_json_file(
                            ticker.upper(), filename
                        )

                        if year_data and "financial_metrics" in year_data:
                            financial_data[year] = year_data["financial_metrics"]

                except Exception as e:
                    logger.warning(f"Error processing file {filename}: {str(e)}")
                    continue

            if not financial_data:
                logger.warning(f"No valid financial data found for {ticker}")
                return None

            logger.info(
                f"Successfully loaded financial data for {ticker} for years: {list(financial_data.keys())}"
            )
            return financial_data

        except Exception as e:
            logger.error(f"Error fetching financial data for {ticker}: {str(e)}")
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
        except Exception as e:
            logger.warning(f"Could not get current stock price for {ticker}: {str(e)}")
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
        current_price = current_price or 0

        # Calculate upside/downside
        upside = (
            ((per_share_value - current_price) / current_price * 100)
            if current_price > 0
            else 0
        )

        # Get DCF calculator values safely
        wacc = (
            getattr(self.dcf_calculator, "wacc", 0.08) if self.dcf_calculator else 0.08
        )
        terminal_growth_rate = (
            getattr(self.dcf_calculator, "terminal_growth_rate", 0.03)
            if self.dcf_calculator
            else 0.03
        )
        tax_rate = (
            getattr(self.dcf_calculator, "tax_rate", 0.24)
            if self.dcf_calculator
            else 0.24
        )

        # Build base results
        base_results = {
            "intrinsic_value": per_share_value,
            "current_price": current_price,
            "upside": upside,
            "wacc": wacc,
            "terminal_growth_rate": terminal_growth_rate,
        }

        # Generate scenarios with different growth rates
        scenarios = self._generate_scenarios(
            ticker, dcf_results.get("growth_rate", 0.15)
        )

        # Build parameters
        parameters = {
            "projection_years": 5,
            "wacc": wacc,
            "terminal_growth_rate": terminal_growth_rate,
            "tax_rate": tax_rate,
        }

        return {
            "ticker": ticker.upper(),
            "base_results": base_results,
            "scenarios": scenarios,
            "parameters": parameters,
            "projections": dcf_results.get("projections", {}),
            "enterprise_value": dcf_results.get("enterprise_value", 0),
            "equity_value": dcf_results.get("equity_value", 0),
            "cache_status": "fresh",
            "cache_warning": True,
            "analysis_warning": "Analysis is rerunning - no cached data available. This may take a moment.",
        }

    def _generate_scenarios(self, ticker: str, base_growth_rate: float) -> list:
        """
        Generate DCF scenarios with different growth rates.

        Args:
            ticker: Company ticker symbol
            base_growth_rate: Base growth rate for scenarios

        Returns:
            List of scenario results
        """
        if not self.dcf_calculator:
            return []

        scenarios = []

        # Bull case (higher growth)
        bull_growth = base_growth_rate + 0.05
        bull_projections = self.dcf_calculator.project_financials(
            earnings_growth_rate=bull_growth
        )
        bull_enterprise_value = self.dcf_calculator.calculate_enterprise_value(
            bull_projections
        )
        bull_equity_value = self.dcf_calculator.calculate_equity_value(
            bull_enterprise_value
        )
        bull_per_share = self.dcf_calculator.calculate_per_share_value(
            bull_equity_value, self._get_shares_outstanding()
        )

        scenarios.append(
            {
                "name": "Bull Case",
                "wacc": self.dcf_calculator.wacc,
                "terminal_growth_rate": self.dcf_calculator.terminal_growth_rate + 0.01,
                "intrinsic_value": bull_per_share,
                "upside": 0,  # Will be calculated in response
            }
        )

        # Bear case (lower growth)
        bear_growth = max(0.02, base_growth_rate - 0.05)  # Ensure positive growth
        bear_projections = self.dcf_calculator.project_financials(
            earnings_growth_rate=bear_growth
        )
        bear_enterprise_value = self.dcf_calculator.calculate_enterprise_value(
            bear_projections
        )
        bear_equity_value = self.dcf_calculator.calculate_equity_value(
            bear_enterprise_value
        )
        bear_per_share = self.dcf_calculator.calculate_per_share_value(
            bear_equity_value, self._get_shares_outstanding()
        )

        scenarios.append(
            {
                "name": "Bear Case",
                "wacc": self.dcf_calculator.wacc,
                "terminal_growth_rate": max(
                    0.01, self.dcf_calculator.terminal_growth_rate - 0.01
                ),
                "intrinsic_value": bear_per_share,
                "upside": 0,  # Will be calculated in response
            }
        )

        return scenarios

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

        self.dcf_calculator = DCFCalculator(ticker, financial_data, base_year)

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
            earnings_growth_rate: Expected earnings growth rate (if None, uses company-specific default)
            years: Number of years to project

        Returns:
            DCF analysis results
        """
        if not self.dcf_calculator:
            raise ValueError(
                "DCF calculator not initialized. Call create_dcf_calculator first."
            )

        # Use company-specific growth rate if not provided
        if earnings_growth_rate is None:
            if self.dcf_calculator.ticker.upper() == "AAPL":
                earnings_growth_rate = 0.06  # 6% growth for Apple
            else:
                earnings_growth_rate = 0.15  # Default 15% growth

        projections = self.dcf_calculator.project_financials(
            earnings_growth_rate=earnings_growth_rate, years=years
        )

        enterprise_value = self.dcf_calculator.calculate_enterprise_value(projections)
        equity_value = self.dcf_calculator.calculate_equity_value(enterprise_value)

        # Get shares outstanding from financial data
        shares_outstanding = self._get_shares_outstanding()
        per_share_value = self.dcf_calculator.calculate_per_share_value(
            equity_value, shares_outstanding
        )

        return {
            "projections": projections,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "per_share_value": per_share_value,
            "growth_rate": earnings_growth_rate,
        }

    def _get_shares_outstanding(self) -> Optional[float]:
        """
        Extract shares outstanding from financial data.

        Returns:
            Shares outstanding value or None if not found
        """
        if not self.dcf_calculator or not self.dcf_calculator.financial_data:
            return None

        # Get the most recent year's data
        latest_year = max(self.dcf_calculator.financial_data.keys())
        latest_data = self.dcf_calculator.financial_data[latest_year]

        # Look for shares outstanding in various possible keys
        shares_keys = ["Diluted", "Basic", "shares_outstanding", "Shares Outstanding"]

        for key in shares_keys:
            if key in latest_data:
                return latest_data[key]

        return None

    def _get_cached_dcf_analysis(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get cached DCF analysis from cloud storage.

        Args:
            ticker: Company ticker symbol

        Returns:
            Cached DCF analysis data or None if not found/expired
        """
        try:
            cache_file_path = f"{ticker.upper()}/dcf_analysis_cache.json"
            cached_data = self.cloud_storage_service.read_file_content(
                ticker.upper(), "dcf_analysis_cache.json"
            )

            if cached_data:
                import json
                from datetime import datetime, timedelta

                dcf_data = json.loads(cached_data)

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

            return None

        except Exception as e:
            logger.warning(
                f"Error retrieving cached DCF analysis for {ticker}: {str(e)}"
            )
            return None

    def _cache_dcf_analysis(self, ticker: str, dcf_analysis: Dict[str, Any]) -> None:
        """
        Cache DCF analysis results to cloud storage.

        Args:
            ticker: Company ticker symbol
            dcf_analysis: DCF analysis results to cache
        """
        try:
            import json
            from datetime import datetime

            # Add cache timestamp
            dcf_analysis["cache_timestamp"] = datetime.now().isoformat()

            cache_file_path = f"{ticker.upper()}/dcf_analysis_cache.json"
            cache_content = json.dumps(dcf_analysis, indent=2)

            success = self.cloud_storage_service.upload_file_content(
                ticker.upper(),
                "dcf_analysis_cache.json",
                cache_content,
                content_type="application/json",
            )

            if success:
                logger.info(f"Successfully cached DCF analysis for {ticker}")
            else:
                logger.error(f"Failed to cache DCF analysis for {ticker}")

        except Exception as e:
            logger.error(f"Error caching DCF analysis for {ticker}: {str(e)}")
            # Don't raise exception - caching failure shouldn't break the main flow
