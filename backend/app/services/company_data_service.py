"""
Company Data Service Layer - Orchestrates company data fetching and caching operations.

This service handles the coordination between Yahoo Finance data fetching, caching,
and data aggregation. It follows clean architecture principles by keeping business
logic separate from HTTP concerns.
"""

import json
import logging
from typing import Any, Dict, List, Optional

import requests
from fastapi import HTTPException

from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class CompanyDataService:
    """
    Service layer for company data operations.
    Handles caching, data fetching, and data aggregation.
    """

    def __init__(self):
        self.cloud_storage_service = CloudStorageService()
        self.yahoo_service = YahooFinanceService()

    async def get_companies_list(self) -> List[Dict[str, Any]]:
        """
        Get list of S&P 500 companies from cloud storage.

        Returns:
            List of company data
        """
        try:
            # Read the comprehensive S&P 500 companies data from Google Cloud Storage
            blob_path = "sp500_companies_comprehensive.json"
            url = f"{self.cloud_storage_service.download_url}/{blob_path}"
            headers = self.cloud_storage_service._get_headers()

            logger.debug(f"Reading comprehensive S&P 500 companies from: {url}")
            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 200:
                companies_dict = response.json()

                # Convert dictionary to list format with ticker included
                companies_list = []
                for ticker, company_data in companies_dict.items():
                    company_entry = {
                        "ticker": ticker,
                        "name": company_data.get("name", ""),
                        "sector": company_data.get("sector", ""),
                        "cik": company_data.get("cik", ""),
                    }
                    companies_list.append(company_entry)

                logger.info(
                    f"Successfully loaded {len(companies_list)} companies from cloud storage"
                )
                return companies_list
            else:
                logger.error(f"Failed to load companies from cloud storage: {response.status_code}")
                raise HTTPException(
                    status_code=500, detail="Failed to load companies list from storage"
                )

        except (requests.RequestException, ValueError, KeyError) as e:
            logger.error(f"Error fetching companies list: {e!s}")
            raise HTTPException(
                status_code=500, detail=f"Error fetching companies list: {e!s}"
            ) from e

    async def get_company_info(self, ticker: str) -> Dict[str, Any]:
        """
        Get company information for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Company information data
        """
        try:
            # Get comprehensive data from Yahoo Finance
            stock_info = self.yahoo_service.get_stock_info(ticker.upper())

            if not stock_info:
                raise HTTPException(
                    status_code=404,
                    detail=f"Company information not found for {ticker}",
                )

            # Build company info response using service method
            company_data = self.yahoo_service.build_company_info_response(
                stock_info, ticker.upper()
            )

            return company_data

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
        Get raw financial data for a company with caching.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Raw financial data
        """
        try:
            # Try to get cached data first
            cached_data = self._get_cached_raw_data(ticker)
            if cached_data:
                return cached_data

            # If no cached data, fetch from Yahoo Finance
            logger.info(f"Fetching fresh raw data from Yahoo Finance for {ticker}")
            raw_data = self.yahoo_service.get_comprehensive_data(ticker.upper())

            if not raw_data:
                raise HTTPException(
                    status_code=404, detail=f"Financial data not found for {ticker}"
                )

            # Cache the data
            self._cache_raw_data(ticker, raw_data)

            return raw_data

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error fetching raw data for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching raw data for {ticker}: {e!s}",
            ) from e

    async def get_stock_data(self, ticker: str, period: str = "1d") -> Dict[str, Any]:
        """
        Get stock data for a company with caching.

        Args:
            ticker: Stock ticker symbol
            period: Time period for historical data

        Returns:
            Stock data
        """
        try:
            # Try to get cached raw data first
            raw_data = self._get_cached_raw_data(ticker)

            # If no cached data, fetch from Yahoo Finance
            if not raw_data:
                logger.info(f"Fetching fresh raw data from Yahoo Finance for stock data {ticker}")
                raw_data = self.yahoo_service.get_comprehensive_data(ticker.upper())

                if not raw_data:
                    raise HTTPException(
                        status_code=404, detail=f"Financial data not found for {ticker}"
                    )

                # Cache the data
                self._cache_raw_data(ticker, raw_data)

            # Build stock data response using service method
            stock_data = self.yahoo_service.build_stock_data_response(raw_data, period)

            return stock_data

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error fetching stock data for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching stock data for {ticker}: {e!s}",
            ) from e

    def _get_cached_raw_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get cached raw data if available.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Cached data if available, None otherwise
        """
        try:
            cached_data = self.cloud_storage_service.read_json_file(
                ticker.upper(), "raw_data_cache.json"
            )
            if cached_data:
                logger.info(f"Using cached raw data for {ticker}")
                return cached_data
        except (OSError, ValueError, KeyError) as e:
            logger.debug(f"No cached raw data found for {ticker}: {e!s}")

        return None

    def _cache_raw_data(self, ticker: str, raw_data: Dict[str, Any]) -> None:
        """
        Cache raw data to cloud storage.

        Args:
            ticker: Stock ticker symbol
            raw_data: Data to cache
        """
        try:
            cache_content = json.dumps(raw_data, indent=2, default=str)
            success = self.cloud_storage_service.upload_file_content(
                ticker.upper(),
                "raw_data_cache.json",
                cache_content,
                content_type="application/json",
            )
            if success:
                logger.info(f"Successfully cached raw data for {ticker}")
            else:
                logger.warning(f"Failed to cache raw data for {ticker}")
        except (OSError, ValueError, TypeError) as e:
            logger.warning(f"Error caching raw data for {ticker}: {e!s}")
            # Don't fail the request if caching fails
