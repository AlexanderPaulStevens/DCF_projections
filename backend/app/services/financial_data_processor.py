"""
Financial Data Processor Service
Extracts and processes financial metrics from Yahoo Finance for DCF analysis.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict

from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class FinancialDataProcessor:
    """
    Service for processing financial data from Yahoo Finance and generating
    financial analysis files in the required format for DCF analysis.
    """

    def __init__(self):
        self.cloud_storage_service = CloudStorageService()

    def process_company_financial_data(self, ticker: str) -> Dict[int, Dict[str, Any]]:
        """
        Process financial data for a company using Yahoo Finance API.

        Args:
            ticker: Company ticker symbol

        Returns:
            Dictionary of financial data organized by year
        """
        try:
            logger.info(f"Processing financial data for {ticker} using Yahoo Finance")

            # Use Yahoo Finance service to get financial statements
            yahoo_service = YahooFinanceService()

            financial_data = yahoo_service.get_financial_statements(ticker.upper())

            if not financial_data:
                raise ValueError(f"Could not fetch financial data from Yahoo Finance for {ticker}")

            # Upload financial data to cloud storage for each year
            for year, year_data in financial_data.items():
                try:
                    financial_analysis = {
                        "timestamp": datetime.now().isoformat(),
                        "year": year,
                        "financial_metrics": year_data,
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
            content = json.dumps(financial_analysis, indent=2)

            self.cloud_storage_service.upload_file_content(
                ticker.upper(), filename, content, content_type="application/json"
            )

            logger.info(f"Uploaded financial analysis for {ticker} year {year}")

        except Exception as e:
            logger.error(f"Error uploading financial analysis for {ticker} year {year}: {e!s}")
            raise
