import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import get_edgar_service
from app.services.edgar_service import EdgarService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/edgar", tags=["edgar"])


@router.get("/ebit/{ticker}")
async def get_annual_ebit(
    ticker: str, edgar_service: EdgarService = Depends(get_edgar_service)
) -> Dict[str, Any]:
    """
    Get annual EBIT (Earnings Before Interest and Taxes) data for a company.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dictionary containing annual EBIT data
    """
    try:
        return await edgar_service.get_annual_ebit(ticker)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in EBIT endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching EBIT data for {ticker}",
        )
