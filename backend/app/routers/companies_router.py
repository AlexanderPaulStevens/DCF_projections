import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import (
    get_company_data_service,
    get_financial_ratios_service,
)
from app.schemas.company_data import CompanyInfo, StockData
from app.schemas.financial_analysis import FinancialRatios
from app.services.company_data_service import CompanyDataService
from app.services.financial_ratios_service import FinancialRatiosService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/list")
async def get_companies_list(
    company_data_service: CompanyDataService = Depends(get_company_data_service),
) -> List[Dict[str, Any]]:
    """
    Get list of S&P 500 companies.

    Returns:
        List of S&P 500 companies with their data
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


@router.get("/{ticker}/stock-data", response_model=StockData)
async def get_stock_data(
    ticker: str,
    period: str = "1d",
    company_data_service: CompanyDataService = Depends(get_company_data_service),
):
    """
    Get stock data (current day + historical periods) for a company.

    Args:
        ticker: Company ticker symbol
        period: Time period for historical data

    Returns:
        Stock data including current price and historical data
    """
    try:
        stock_data = await company_data_service.get_stock_data(ticker, period)
        return StockData(**stock_data)
    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Unexpected error in stock data endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching stock data for {ticker}",
        ) from e


@router.get("/{ticker}/financial-ratios", response_model=FinancialRatios)
async def get_financial_ratios(
    ticker: str,
    financial_ratios_service: FinancialRatiosService = Depends(get_financial_ratios_service),
):
    """
    Get financial ratios calculated from Yahoo Finance data.

    Args:
        ticker: Company ticker symbol

    Returns:
        Financial ratios data calculated from Yahoo Finance raw data
    """
    try:
        result = await financial_ratios_service.calculate_financial_ratios(ticker)
        return FinancialRatios(**result)
    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Unexpected error in financial ratios endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while calculating financial ratios for {ticker}",
        ) from e
