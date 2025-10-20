import logging
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import (
    get_company_data_service,
    get_financial_data_service,
    get_historical_data_service,
    get_stock_price_service,
)
from app.schemas.company_data import CompanyInfo
from app.services.company_data_service import CompanyDataService
from app.services.financial_data_service import FinancialDataService
from app.services.historical_data_service import HistoricalDataService
from app.services.stock_price_service import StockPriceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/list")
async def get_companies_list(
    company_data_service: CompanyDataService = Depends(get_company_data_service),
) -> Dict[str, Any]:
    """
    Get list of S&P 500 companies.

    Returns:
        Dictionary of S&P 500 companies with ticker symbols as keys
    """
    try:
        return await company_data_service.get_companies_list()
    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Unexpected error in companies list endpoint: {e!s}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching companies list",
        ) from e


@router.get("/{ticker}/company-info", response_model=CompanyInfo)
async def get_company_info(
    ticker: str,
    company_data_service: CompanyDataService = Depends(get_company_data_service),
):
    """
    Get company information for a ticker.

    Args:
        ticker: Company ticker symbol

    Returns:
        Company information data
    """
    try:
        company_data = await company_data_service.get_company_info(ticker)
        return CompanyInfo(**company_data)
    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Unexpected error in company info endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching company info for {ticker}",
        ) from e


@router.get("/{ticker}/raw-data")
async def get_raw_data(
    ticker: str,
    company_data_service: CompanyDataService = Depends(get_company_data_service),
) -> Dict[str, Any]:
    """
    Get raw financial data for a company.

    This is the single source of truth for all other endpoints.

    Args:
        ticker: Company ticker symbol

    Returns:
        Raw financial data from Yahoo Finance
    """
    try:
        return await company_data_service.get_raw_data(ticker)
    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Unexpected error in raw data endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching raw data for {ticker}",
        ) from e


@router.get("/{ticker}/processed-financial-data")
async def get_processed_financial_data(
    ticker: str,
    coordinator: FinancialDataService = Depends(get_financial_data_service),
) -> Dict[str, Any]:
    """
    Get processed financial data including calculated ratios for a company.

    Args:
        ticker: Company ticker symbol

    Returns:
        Processed financial data with ratios for all available years
    """
    try:
        # Get cached processed data with ratios from FinancialDataProcessor
        processed_data = await coordinator.get_cached_processed_financial_data(ticker.upper())

        if not processed_data:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No processed financial data available for {ticker}. "
                    "Please ensure the company has been scraped and processed."
                ),
            )

        return processed_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in processed financial data endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching processed financial data for {ticker}",
        ) from e


@router.get("/{ticker}/financial-ratios")
async def get_financial_ratios(
    ticker: str,
    force_rescrape: bool = False,
    coordinator: FinancialDataService = Depends(get_financial_data_service),
) -> Dict[str, Any]:
    """
    Get cached financial ratios for a company from Google Cloud Storage.

    This endpoint efficiently retrieves pre-calculated financial ratios
    that were computed during the data processing pipeline.

    Args:
        ticker: Company ticker symbol
        force_rescrape: If True, bypass cache and force re-scraping of financial data

    Returns:
        Financial ratios for all available years
    """
    try:
        if force_rescrape:
            logger.info(f"Force re-scraping financial ratios for {ticker}")
            # Scrape and process financial data independently of DCF
            await coordinator.scrape_and_process_financial_data(ticker.upper())
            # Get the freshly scraped data
            processed_data = await coordinator.get_cached_processed_financial_data(ticker.upper())
        else:
            # Get cached processed data with ratios
            processed_data = await coordinator.get_cached_processed_financial_data(ticker.upper())

            # If no data is available, attempt to scrape
            if not processed_data:
                logger.info(
                    f"No cached data found for {ticker}, attempting to scrape financial data"
                )
                try:
                    await coordinator.scrape_and_process_financial_data(ticker.upper())
                    # Try to get the data again after scraping
                    processed_data = await coordinator.get_cached_processed_financial_data(
                        ticker.upper()
                    )
                except Exception as e:
                    logger.error(f"Failed to scrape financial data for {ticker}: {e}")
                    # Continue to return 404 below

        if not processed_data:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No financial ratios available for {ticker}. "
                    "The company may not have sufficient financial data or scraping failed."
                ),
            )

        # Validate data quality and handle corrupted data
        validated_data = await coordinator.validate_and_clean_financial_data(
            ticker.upper(), processed_data
        )

        if not validated_data:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Financial data for {ticker} is corrupted or invalid. "
                    "Use force_rescrape=true to regenerate clean data."
                ),
            )

        # Extract only the financial ratios from the processed data
        ratios_data = {
            "ticker": ticker,
            "years_available": validated_data["years_available"],
            "latest_year": validated_data["latest_year"],
            "ratios": {},
        }

        for year, year_data in validated_data["financial_statements"].items():
            ratios_data["ratios"][year] = year_data["calculated_ratios"]

        return ratios_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in financial ratios endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching financial ratios for {ticker}",
        ) from e


@router.get("/{ticker}/stock-price")
async def get_stock_price(
    ticker: str,
    stock_price_service: StockPriceService = Depends(get_stock_price_service),
) -> Dict[str, Any]:
    """
    Get current stock price data (always fresh from Yahoo Finance).

    This endpoint provides real-time stock price data. No backend caching -
    frontend handles caching with appropriate stale times (e.g., 1 minute).

    Args:
        ticker: Company ticker symbol

    Returns:
        Current stock price data including price, change, volume, etc.
    """
    try:
        stock_price_data = stock_price_service.get_stock_price(ticker.upper())

        if not stock_price_data:
            raise HTTPException(status_code=404, detail=f"Stock price data not found for {ticker}")

        return stock_price_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in stock price endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching stock price for {ticker}",
        ) from e


@router.get("/{ticker}/historical-data")
async def get_historical_data(
    ticker: str,
    period: str = "6mo",
    historical_data_service: HistoricalDataService = Depends(get_historical_data_service),
) -> Dict[str, Any]:
    """
    Get historical stock price data for a specific time period.

    Args:
        ticker: Company ticker symbol
        period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

    Returns:
        Historical price data with date, open, high, low, close, volume
    """
    try:
        historical_data = historical_data_service.get_historical_data(ticker.upper(), period)

        if not historical_data:
            raise HTTPException(
                status_code=404, detail=f"Historical data not found for {ticker} ({period})"
            )

        return {
            "ticker": ticker.upper(),
            "period": period,
            "data": historical_data,
            "count": len(historical_data),
            "last_updated": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in historical data endpoint for {ticker} ({period}): {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching historical data for {ticker} ({period})",
        ) from e
