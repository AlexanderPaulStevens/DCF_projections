"""
Financial Data Service - Unified service for financial data operations

This service consolidates all financial data operations:
- Fetching from Yahoo Finance
- Processing and calculating ratios
- Storing to and retrieving from GCS
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.financial_ratios import FinancialRatiosCalculator
from app.schemas.financial_statements import (
    BalanceSheet,
    CashFlowStatement,
    FilingMetadata,
    FinancialStatements,
    HistoricalFinancialData,
    IncomeStatement,
    MarketData,
)
from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class FinancialDataService:
    """
    Service for orchestrating financial data operations.

    Responsibilities:
    - Fetch data from Yahoo Finance (I/O)
    - Store/retrieve from Google Cloud Storage (I/O)
    - Call core layer for business logic

    Note: No local caching - GCS is the single source of truth.
    Frontend handles caching for performance.
    """

    def __init__(self):
        self.yahoo_service = YahooFinanceService()
        self.cloud_storage = CloudStorageService()

    async def get_financial_statements(
        self, ticker: str, year: int
    ) -> Optional[FinancialStatements]:
        """
        Get financial statements for a specific year.

        First checks GCS for processed data, if not found fetches from Yahoo Finance.
        """
        try:
            # Check GCS first (processed data)
            filename = f"financial_statements_{year}.json"
            cached_data = self.cloud_storage.read_json_file(ticker.upper(), filename)

            if cached_data:
                logger.debug(f"Retrieved financial statements for {ticker} {year} from GCS")
                return FinancialStatements(**cached_data)

            # Not in GCS, fetch from Yahoo Finance
            logger.info(f"Fetching financial statements for {ticker} {year} from Yahoo Finance")
            raw_data = self.yahoo_service.get_financial_statements(ticker)

            if not raw_data or year not in raw_data:
                return None

            year_data = raw_data[year]

            # Create metadata for all statements
            metadata = FilingMetadata(
                source="yahoo_finance",
                source_fidelity="medium",
                period_end_date=datetime(year, 12, 31),
                form_type="10-K",
                last_updated=datetime.now(),
            )

            # Create income statement
            income_statement = IncomeStatement(
                metadata=metadata,
                total_revenue=year_data.get("Total Revenue", 0),
                cost_of_revenue=year_data.get("Cost of Revenue"),
                gross_profit=year_data.get("Gross Profit"),
                research_development=year_data.get("Research Development"),
                selling_general_administrative=year_data.get("Selling General Administrative"),
                operating_income=year_data.get("Operating Income"),
                interest_expense=year_data.get("Interest and other income (expense), net"),
                income_tax_expense=year_data.get("Income Tax Expense"),
                net_income=year_data.get("Net Income"),
            )

            # Create balance sheet
            balance_sheet = BalanceSheet(
                metadata=metadata,
                cash_and_equivalents=year_data.get("Cash and Cash Equivalents"),
                current_assets=year_data.get("Current Assets"),
                current_liabilities=year_data.get("Current Liabilities"),
                short_term_debt=year_data.get("Short Term Debt"),
                long_term_debt=year_data.get("Long Term Debt"),
                total_debt=year_data.get("Total Debt"),
                total_equity=year_data.get("Total Stockholder Equity"),
                total_assets=year_data.get("Total Assets"),
                inventory=year_data.get("Inventory"),
                accounts_receivable=year_data.get("Accounts Receivable"),
            )

            # Create cash flow statement
            cash_flow_statement = CashFlowStatement(
                metadata=metadata,
                operating_cash_flow=year_data.get("Operating Cash Flow"),
                capital_expenditures=year_data.get("Capital Expenditure"),
                depreciation_amortization=year_data.get("Depreciation"),
            )

            # Create market data
            market_data = MarketData(
                metadata=metadata,
                shares_outstanding=year_data.get("Shares Outstanding"),
                beta=year_data.get("Beta"),
                current_price=year_data.get("Current Price"),
                market_cap=year_data.get("Market Cap"),
                pe_ratio=year_data.get("PE Ratio"),
                pb_ratio=year_data.get("PB Ratio"),
                ps_ratio=year_data.get("PS Ratio"),
            )

            # Create complete financial statements
            return FinancialStatements(
                ticker=ticker.upper(),
                income_statement=income_statement,
                balance_sheet=balance_sheet,
                cash_flow_statement=cash_flow_statement,
                market_data=market_data,
            )

        except Exception as e:
            logger.error(f"Error getting financial statements for {ticker} {year}: {e}")
            return None

    async def get_historical_financial_data(
        self, ticker: str, years: Optional[List[int]] = None
    ) -> Optional[HistoricalFinancialData]:
        """Get historical financial data for multiple years."""
        try:
            if not years:
                years = [datetime.now().year - i for i in range(5)]  # Last 5 years

            statements = {}
            for year in years:
                year_statements = await self.get_financial_statements(ticker, year)
                if year_statements:
                    statements[year] = year_statements

            if not statements:
                return None

            return HistoricalFinancialData(ticker=ticker, statements=statements)

        except Exception as e:
            logger.error(f"Error getting historical data for {ticker}: {e}")
            return None

    def _extract_income_statement(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract income statement data."""
        return {
            "revenue": data.get("Total Revenue", 0),
            "net_income": data.get("Net Income", 0),
            "operating_income": data.get("Operating Income", 0),
            "gross_profit": data.get("Gross Profit", 0),
        }

    def _extract_balance_sheet(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract balance sheet data."""
        return {
            "total_assets": data.get("Total Assets", 0),
            "total_liabilities": data.get("Total Liabilities", 0),
            "total_equity": data.get("Total Equity", 0),
            "cash": data.get("Cash and Cash Equivalents", 0),
        }

    def _extract_cash_flow(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract cash flow data."""
        return {
            "operating_cash_flow": data.get("Operating Cash Flow", 0),
            "investing_cash_flow": data.get("Investing Cash Flow", 0),
            "financing_cash_flow": data.get("Financing Cash Flow", 0),
        }

    async def get_cached_processed_financial_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached processed financial data with ratios from cloud storage.

        Args:
            ticker: Company ticker symbol

        Returns:
            Dictionary containing processed financial data with ratios for all available years
        """
        try:
            # List all financial analysis files for this ticker
            files = self.cloud_storage.list_files(ticker, "financial_analysis_*.json")

            if not files:
                logger.info(f"No cached financial data found for {ticker}")
                return None

            # Read all files and organize by year
            financial_statements = {}
            years = []

            for filename in files:
                try:
                    # Extract year from filename (financial_analysis_2023.json -> 2023)
                    year = int(filename.replace("financial_analysis_", "").replace(".json", ""))
                    years.append(year)

                    # Read the file from cloud storage
                    data = self.cloud_storage.read_json_file(ticker, filename)

                    if data:
                        financial_statements[year] = {
                            "financial_metrics": data.get("financial_metrics", {}),
                            "calculated_ratios": data.get("financial_ratios", {}),
                            "timestamp": data.get("timestamp"),
                            "source": data.get("source", "yahoo_finance"),
                        }
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error parsing file {filename} for {ticker}: {e}")
                    continue

            # Filter out years before 2021 due to data quality issues
            filtered_statements = {}
            for year, year_data in financial_statements.items():
                if year >= 2021:
                    filtered_statements[year] = year_data

            if not filtered_statements:
                logger.info(
                    f"No valid financial data found for {ticker} (after filtering years >= 2021)"
                )
                return None

            # Update years list to only include 2021+
            years = sorted(filtered_statements.keys(), reverse=True)

            return {
                "ticker": ticker,
                "years_available": years,
                "latest_year": years[0] if years else None,
                "financial_statements": filtered_statements,
            }

        except Exception as e:
            logger.error(f"Error retrieving cached financial data for {ticker}: {e}")
            return None

    async def scrape_and_process_financial_data(self, ticker: str) -> Dict[int, Dict[str, Any]]:
        """
        Scrape financial data from Yahoo Finance, process it, calculate ratios, and store to GCS.

        This method consolidates the full workflow:
        1. Fetch raw data from Yahoo Finance
        2. Validate data quality
        3. Calculate financial ratios using core layer
        4. Upload processed data to GCS

        Args:
            ticker: Company ticker symbol

        Returns:
            Dictionary of financial data organized by year
        """
        try:
            logger.info(f"Processing financial data for {ticker} using Yahoo Finance")

            # Fetch financial statements from Yahoo Finance
            financial_data = self.yahoo_service.get_financial_statements(ticker.upper())

            if not financial_data:
                raise ValueError(f"Could not fetch financial data from Yahoo Finance for {ticker}")

            # Process and upload financial data for each year
            for year, year_data in financial_data.items():
                try:
                    # Calculate financial ratios for this year
                    ratios = self._calculate_ratios_for_year(ticker, year, year_data)

                    financial_analysis = {
                        "timestamp": datetime.now().isoformat(),
                        "year": year,
                        "financial_metrics": year_data,
                        "financial_ratios": ratios,
                        "source": "yahoo_finance",
                    }

                    # Upload to cloud storage
                    self._upload_financial_analysis(ticker, year, financial_analysis)

                except (OSError, ValueError, TypeError) as e:
                    logger.warning(
                        f"Error uploading financial data for {ticker} year {year}: {e!s}"
                    )
                    continue

            logger.info(
                f"Successfully processed financial data for {ticker}: {list(financial_data.keys())}"
            )
            return financial_data

        except Exception as e:
            logger.error(f"Error processing financial data for {ticker}: {e!s}")
            raise

    async def validate_and_clean_financial_data(
        self, ticker: str, processed_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Validate and clean financial data.

        Args:
            ticker: Company ticker symbol
            processed_data: The processed financial data to validate

        Returns:
            Validated and cleaned data, or None if data is invalid
        """
        try:
            if not processed_data or not processed_data.get("financial_statements"):
                logger.warning(f"No financial statements data to validate for {ticker}")
                return None

            # Basic validation - ensure we have some valid years
            financial_statements = processed_data.get("financial_statements", {})

            if not financial_statements:
                logger.warning(f"Empty financial statements for {ticker}")
                return None

            # Validate each year has required data
            validated_statements = {}
            for year, year_data in financial_statements.items():
                if not year_data.get("financial_metrics"):
                    logger.warning(f"Missing financial metrics for {ticker} year {year}")
                    continue

                # Check for minimum required fields
                metrics = year_data.get("financial_metrics", {})
                if metrics.get("Total Revenue") is None:
                    logger.warning(f"Missing revenue data for {ticker} year {year}")
                    continue

                validated_statements[year] = year_data

            if not validated_statements:
                logger.warning(f"No valid financial statements found for {ticker}")
                return None

            # Update years list
            years = sorted(validated_statements.keys(), reverse=True)

            return {
                "ticker": ticker,
                "years_available": years,
                "latest_year": years[0] if years else None,
                "financial_statements": validated_statements,
            }

        except Exception as e:
            logger.error(f"Error validating financial data for {ticker}: {e}")
            return None

    def _upload_financial_analysis(
        self, ticker: str, year: int, financial_analysis: Dict[str, Any]
    ) -> None:
        """
        Upload financial analysis data to cloud storage.

        Args:
            ticker: Company ticker symbol
            year: Year of the financial data
            financial_analysis: Financial analysis data to upload
        """
        try:
            filename = f"financial_analysis_{year}.json"

            # Convert Decimal objects to float for JSON serialization
            def convert_decimals(obj: Any) -> Any:
                if isinstance(obj, dict):
                    return {k: convert_decimals(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_decimals(item) for item in obj]
                elif hasattr(obj, "__class__") and obj.__class__.__name__ == "Decimal":
                    return float(obj)
                else:
                    return obj

            # Convert all Decimal objects to float
            serializable_data = convert_decimals(financial_analysis)
            content = json.dumps(serializable_data, indent=2)

            self.cloud_storage.upload_file_content(
                ticker.upper(), filename, content, content_type="application/json"
            )

            logger.info(f"Uploaded financial analysis for {ticker} year {year}")

        except Exception as e:
            logger.error(f"Error uploading financial analysis for {ticker} year {year}: {e!s}")
            raise

    def _calculate_ratios_for_year(
        self, ticker: str, year: int, year_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate financial ratios for a specific year's data.

        Args:
            ticker: Company ticker symbol
            year: Year of the financial data
            year_data: Raw financial data for the year

        Returns:
            Dictionary containing calculated financial ratios
        """
        try:
            # Debug logging to see what data we have
            logger.info(f"Processing {ticker} {year} with data keys: {list(year_data.keys())}")
            logger.info(
                f"Revenue data for {ticker} {year}: {year_data.get('Total Revenue', 'MISSING')}"
            )

            # Validate data quality before processing
            if not self._validate_year_data_quality(ticker, year, year_data):
                logger.error(
                    f"Skipping ratio calculation for {ticker} {year} due to data quality issues"
                )
                return {
                    "profitability": None,
                    "leverage": None,
                    "efficiency": None,
                    "valuation": None,
                    "liquidity": None,
                }

            # Transform raw data into standardized financial statements format
            # Create metadata
            metadata = FilingMetadata(
                source="yahoo_finance",
                source_fidelity="medium",
                period_end_date=datetime(year, 12, 31),
                form_type="10-K",
                last_updated=datetime.now(),
            )

            # Build income statement
            income_stmt = IncomeStatement(
                metadata=metadata,
                total_revenue=year_data.get("Total Revenue", 0),
                cost_of_revenue=year_data.get("Cost of Revenue"),
                gross_profit=year_data.get("Gross Profit"),
                research_development=year_data.get("Research Development"),
                selling_general_administrative=year_data.get("Selling General Administrative"),
                operating_income=year_data.get("Operating Income"),
                interest_expense=year_data.get("Interest and other income (expense), net"),
                income_tax_expense=year_data.get("Income Tax Expense"),
                net_income=year_data.get("Net Income"),
            )

            # Build balance sheet
            balance_sheet = BalanceSheet(
                metadata=metadata,
                cash_and_equivalents=year_data.get("Cash and Cash Equivalents"),
                current_assets=year_data.get("Current Assets"),
                current_liabilities=year_data.get("Current Liabilities"),
                short_term_debt=year_data.get("Short Term Debt"),
                long_term_debt=year_data.get("Long Term Debt"),
                total_debt=year_data.get("Total Debt"),
                total_equity=year_data.get("Total Stockholder Equity"),
                total_assets=year_data.get("Total Assets"),
                inventory=year_data.get("Inventory"),
                accounts_receivable=year_data.get("Accounts Receivable"),
                net_working_capital=year_data.get("Net Working Capital"),
            )

            # Build cash flow statement
            cash_flow = CashFlowStatement(
                metadata=metadata,
                operating_cash_flow=year_data.get("Operating Cash Flow"),
                capital_expenditures=year_data.get("Capital Expenditure"),
                depreciation_amortization=year_data.get("Depreciation"),
            )

            # Build market data
            logger.info(f"Creating MarketData for {ticker} {year} with values:")
            logger.info(f"  Current Price: {year_data.get('Current Price')}")
            logger.info(f"  Market Cap: {year_data.get('Market Cap')}")
            logger.info(f"  PE Ratio: {year_data.get('PE Ratio')}")
            logger.info(f"  PB Ratio: {year_data.get('PB Ratio')}")
            logger.info(f"  PS Ratio: {year_data.get('PS Ratio')}")

            market_data = MarketData(
                metadata=metadata,
                shares_outstanding=year_data.get("Shares Outstanding"),
                beta=year_data.get("Beta"),
                current_price=year_data.get("Current Price"),
                market_cap=year_data.get("Market Cap"),
                pe_ratio=year_data.get("PE Ratio"),
                pb_ratio=year_data.get("PB Ratio"),
                ps_ratio=year_data.get("PS Ratio"),
            )

            # Create financial statements object
            statements = FinancialStatements(
                ticker=ticker,
                income_statement=income_stmt,
                balance_sheet=balance_sheet,
                cash_flow_statement=cash_flow,
                market_data=market_data,
            )

            # Calculate ratios using the core calculator
            ratios_result = FinancialRatiosCalculator.calculate_all_ratios(statements)

            # Return the ratios (already in the correct format)
            return ratios_result

        except Exception as e:
            logger.warning(f"Error calculating ratios for {ticker} {year}: {e}")
            # Return empty ratios if calculation fails
            return {
                "profitability": None,
                "leverage": None,
                "efficiency": None,
                "valuation": None,
                "liquidity": None,
            }

    def _validate_year_data_quality(
        self, ticker: str, year: int, year_data: Dict[str, Any]
    ) -> bool:
        """
        Validate the quality of financial data for a specific year.

        Args:
            ticker: Company ticker symbol
            year: Year of the data
            year_data: Raw financial data for the year

        Returns:
            True if data is valid, False if corrupted
        """
        try:
            # Check for revenue using multiple possible field names
            revenue_fields = [
                "Total Revenue",
                "Total net sales",
                "Revenue",
                "Net sales",
                "Total revenue",
            ]
            total_revenue = None
            for field in revenue_fields:
                if year_data.get(field) is not None:
                    total_revenue = year_data[field]
                    break

            # Require valid revenue data - skip years with missing core financial data
            if total_revenue is None:
                logger.warning(
                    f"Skipping {ticker} {year}: missing revenue data (Yahoo Finance data incomplete)"
                )
                return False

            # Check for negative revenue (shouldn't happen for normal companies)
            if total_revenue < 0:
                logger.error(
                    f"Invalid financial data: negative revenue detected for {ticker} {year}"
                )
                return False

            # Log zero revenue cases but don't fail validation
            if total_revenue == 0:
                logger.info(
                    f"Zero revenue detected for {ticker} {year} - this may be valid for certain companies/years"
                )

            # Check for reasonable revenue range (not too small or too large) - but allow zero
            if (
                total_revenue > 0 and total_revenue < 1000
            ):  # Less than $1M seems too small for most public companies
                logger.warning(
                    f"Suspiciously low revenue for {ticker} {year}: ${total_revenue:,.0f}"
                )
                return False

            # Check for missing critical fields
            critical_fields = ["Total Revenue", "Net Income", "Total Assets"]
            missing_fields = [field for field in critical_fields if year_data.get(field) is None]

            if missing_fields:
                logger.warning(f"Missing critical fields for {ticker} {year}: {missing_fields}")
                # Don't fail completely, but log the issue

            # Check for reasonable ratios (only if revenue > 0)
            net_income = year_data.get("Net Income", 0)
            if net_income and total_revenue > 0:
                net_margin = net_income / total_revenue
                if abs(net_margin) > 2.0:  # Net margin > 200% or < -200% seems unreasonable
                    logger.warning(f"Suspicious net margin for {ticker} {year}: {net_margin:.1%}")
                    return False

            logger.info(f"Data quality validation passed for {ticker} {year}")
            return True

        except Exception as e:
            logger.error(f"Error validating data quality for {ticker} {year}: {e}")
            return False
