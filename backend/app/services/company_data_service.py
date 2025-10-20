"""
Company Data Service Layer - Orchestrates company data fetching and caching operations.

This service handles the coordination between Yahoo Finance data fetching, caching,
and data aggregation. It follows clean architecture principles by keeping business
logic separate from HTTP concerns.
"""

import json
import logging
import os
from typing import Any, Dict

from fastapi import HTTPException

from app.core.data_transformation import DataTransformation
from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class CompanyDataService:
    """
    Service layer for company data operations.

    Responsibilities:
    - Fetch company data from Yahoo Finance (I/O)
    - Retrieve from Google Cloud Storage (I/O)
    - Call core layer for data transformation

    Note: No local caching - GCS is the single source of truth.
    Frontend handles caching for performance.
    """

    def __init__(self):
        self.cloud_storage_service = CloudStorageService()
        self.yahoo_service = YahooFinanceService()

    async def get_companies_list(self) -> Dict[str, Any]:
        """
        Get list of S&P 500 companies from local JSON file.

        Returns:
            Dictionary of company data with ticker symbols as keys
        """
        try:
            # Get the path to the local JSON file
            # The file is in the project root directory
            # From backend/app/services/company_data_service.py, go up 3 levels to reach project root
            current_dir = os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            )
            json_file_path = os.path.join(current_dir, "companies_comprehensive.json")

            # Check if file exists
            if not os.path.exists(json_file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Companies list file not found at {json_file_path}",
                )

            # Read the JSON file
            with open(json_file_path, "r", encoding="utf-8") as file:
                companies_dict = json.load(file)

            if not companies_dict:
                raise HTTPException(
                    status_code=404,
                    detail="Companies list is empty",
                )

            logger.info(f"Successfully loaded {len(companies_dict)} companies from local file")
            return companies_dict

        except (OSError, ValueError, KeyError) as e:
            logger.error(f"Error loading companies list: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error loading companies list: {e!s}",
            )

    async def get_company_info(self, ticker: str) -> Dict[str, Any]:
        """
        Get company information for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Company information data
        """
        try:
            # Reuse get_raw_data to avoid duplicate file reads
            company_data = await self.get_raw_data(ticker)

            # Use core transformation to map data to CompanyInfo schema
            return DataTransformation.transform_to_company_info_dict(company_data, ticker)

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error fetching company info for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching company info for {ticker}: {e!s}",
            ) from e

    async def get_raw_data(self, ticker: str) -> Dict[str, Any]:
        """
        Get raw financial data for a company.

        First checks GCS, then fetches from Yahoo Finance if not found.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Raw financial data
        """
        try:
            # Check GCS first
            filename = "raw_data.json"
            cached_data = self.cloud_storage_service.read_json_file(ticker.upper(), filename)

            if cached_data:
                logger.debug(f"Retrieved raw data for {ticker} from GCS")
                return cached_data

            # Not in GCS, fetch from Yahoo Finance
            logger.info(f"Fetching fresh raw data from Yahoo Finance for {ticker}")
            raw_data = self.yahoo_service.get_comprehensive_data(ticker.upper())

            if not raw_data:
                raise HTTPException(
                    status_code=404, detail=f"Financial data not found for {ticker}"
                )

            # Note: Could upload to GCS here for future requests, but currently
            # we let the processing pipeline handle GCS uploads

            return raw_data

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error fetching raw data for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching raw data for {ticker}: {e!s}",
            ) from e
