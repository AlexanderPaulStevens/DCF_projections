"""
Company data API endpoints - core company information and financial data.
"""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from app.schemas.company_data import CompanyInfo, StockData
from app.schemas.financial_analysis import FinancialRatios
from app.services.cloud_storage_service import CloudStorageService
from app.services.financial_ratios_service import FinancialRatiosService
from app.services.yahoo_finance_service import YahooFinanceService
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/companies", tags=["companies"])

# Initialize services
yahoo_service = YahooFinanceService()


@router.get("/list")
async def get_companies_list():
    """
    Get list of available companies from S&P 500 stored in Google Cloud Storage.

    Returns:
        List of companies with ticker, name, and sector information
    """
    try:
        import json

        # Use Cloud Storage Service to read from Google Cloud Storage
        cloud_storage_service = CloudStorageService()

        # Read the comprehensive S&P 500 companies data from Google Cloud Storage
        try:
            blob_path = "sp500_companies_comprehensive.json"
            url = f"{cloud_storage_service.download_url}/{blob_path}"
            headers = cloud_storage_service._get_headers()

            logger.debug(f"Reading comprehensive S&P 500 companies from: {url}")
            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 200:
                sp500_data = response.json()
            else:
                logger.warning(
                    f"Failed to read comprehensive S&P 500 companies file: {response.status_code}"
                )
                sp500_data = None
        except Exception as e:
            logger.error(
                f"Error reading comprehensive S&P 500 companies from cloud storage: {str(e)}"
            )
            sp500_data = None

        if not sp500_data:
            raise HTTPException(
                status_code=404,
                detail="S&P 500 companies data not found in cloud storage",
            )

        # Convert to the expected format
        companies = []
        for ticker, data in sp500_data.items():
            companies.append(
                {"ticker": ticker, "name": data["name"], "sector": data["sector"]}
            )

        return {"companies": companies}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching companies list: {str(e)}"
        )


@router.get("/{ticker}/company-info", response_model=CompanyInfo)
async def get_company_info(ticker: str):
    """
    Get company demographic and business information from Yahoo Finance.

    Args:
        ticker: Company ticker symbol

    Returns:
        Company demographic information
    """
    try:
        # Get comprehensive data from Yahoo Finance
        yahoo_service = YahooFinanceService()
        stock_info = yahoo_service.get_stock_info(ticker.upper())

        if not stock_info:
            raise HTTPException(
                status_code=404, detail=f"Company data not found for {ticker}"
            )

        # Build company info response using service method
        company_data = yahoo_service.build_company_info_response(
            stock_info, ticker.upper()
        )

        return CompanyInfo(**company_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching company info for {ticker}: {str(e)}",
        )


@router.get("/{ticker}/raw-data")
async def get_raw_data(ticker: str):
    """
    Get comprehensive raw data from Yahoo Finance in a single call.
    This is the single source of truth for all other endpoints.

    Flow:
    1. Try cloud storage first (fast cached data)
    2. If not found, fetch from Yahoo Finance (real-time)
    3. Upload Yahoo Finance data to cloud storage for future requests

    Args:
        ticker: Company ticker symbol

    Returns:
        Comprehensive data from Yahoo Finance including price, metrics, and historical data
    """
    try:
        # Initialize services
        yahoo_service = YahooFinanceService()
        cloud_storage_service = CloudStorageService()

        # Try to get cached data first
        cached_data = None
        try:
            cached_data = cloud_storage_service.read_json_file(
                ticker.upper(), "raw_data_cache.json"
            )
            if cached_data:
                logger.info(f"Using cached raw data for {ticker}")
                return cached_data
        except Exception as e:
            logger.debug(f"No cached data found for {ticker}: {str(e)}")

        # If no cached data, fetch from Yahoo Finance
        logger.info(f"Fetching fresh raw data from Yahoo Finance for {ticker}")
        raw_data = yahoo_service.get_comprehensive_data(ticker.upper())

        if not raw_data:
            raise HTTPException(
                status_code=404, detail=f"Raw data not found for {ticker}"
            )

        # Cache the data for future requests
        try:
            import json

            cache_content = json.dumps(raw_data, indent=2, default=str)
            success = cloud_storage_service.upload_file_content(
                ticker.upper(),
                "raw_data_cache.json",
                cache_content,
                content_type="application/json",
            )
            if success:
                logger.info(f"Successfully cached raw data for {ticker}")
            else:
                logger.warning(f"Failed to cache raw data for {ticker}")
        except Exception as e:
            logger.warning(f"Error caching raw data for {ticker}: {str(e)}")
            # Don't fail the request if caching fails

        return raw_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching raw data for {ticker}: {str(e)}"
        )


@router.get("/{ticker}/stock-data", response_model=StockData)
async def get_stock_data(ticker: str, period: str = "1d"):
    """
    Get stock data (current day + historical periods) from cached or fresh data.

    Flow:
    1. Try to get cached raw data from cloud storage first
    2. If not found, fetch fresh data from Yahoo Finance
    3. Cache the data for future requests

    Args:
        ticker: Company ticker symbol
        period: Time period for data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

    Returns:
        Stock data including current day metrics and historical data
    """
    try:
        # Initialize services
        yahoo_service = YahooFinanceService()
        cloud_storage_service = CloudStorageService()

        # Try to get cached raw data first
        raw_data = None
        try:
            raw_data = cloud_storage_service.read_json_file(
                ticker.upper(), "raw_data_cache.json"
            )
            if raw_data:
                logger.info(f"Using cached raw data for stock data {ticker}")
        except Exception as e:
            logger.debug(f"No cached raw data found for {ticker}: {str(e)}")

        # If no cached data, fetch from Yahoo Finance
        if not raw_data:
            logger.info(
                f"Fetching fresh raw data from Yahoo Finance for stock data {ticker}"
            )
            raw_data = yahoo_service.get_comprehensive_data(ticker.upper())

            if not raw_data:
                raise HTTPException(
                    status_code=404, detail=f"Stock data not found for {ticker}"
                )

            # Cache the data for future requests
            try:
                import json

                cache_content = json.dumps(raw_data, indent=2, default=str)
                success = cloud_storage_service.upload_file_content(
                    ticker.upper(),
                    "raw_data_cache.json",
                    cache_content,
                    content_type="application/json",
                )
                if success:
                    logger.info(f"Successfully cached raw data for stock data {ticker}")
                else:
                    logger.warning(f"Failed to cache raw data for stock data {ticker}")
            except Exception as e:
                logger.warning(
                    f"Error caching raw data for stock data {ticker}: {str(e)}"
                )
                # Don't fail the request if caching fails

        # Build stock data response using service method
        stock_data = yahoo_service.build_stock_data_response(raw_data, period)

        return StockData(**stock_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching stock data for {ticker}: {str(e)}"
        )


@router.get("/{ticker}/financial-ratios", response_model=FinancialRatios)
async def get_financial_ratios(ticker: str):
    """
    Get financial ratios calculated from Yahoo Finance data.

    Args:
        ticker: Company ticker symbol

    Returns:
        Financial ratios data calculated from Yahoo Finance raw data
    """
    try:
        # Use the financial ratios service
        ratios_service = FinancialRatiosService()
        result = await ratios_service.calculate_financial_ratios(ticker)

        return FinancialRatios(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating financial ratios for {ticker}: {str(e)}",
        )
