"""
DCF Analysis API endpoints - discounted cash flow analysis and valuation.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import get_dcf_service
from app.schemas.financial_analysis import DCFAnalysis
from app.services.dcf_service import DCFService

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/companies", tags=["dcf-analysis"])


@router.get("/{ticker}/DCF", response_model=DCFAnalysis)
async def get_dcf_analysis_endpoint(
    ticker: str,
    force_rescrape: bool = False,
    dcf_service: DCFService = Depends(get_dcf_service),
):
    """
    Get DCF analysis for a company using real financial data.

    Args:
        ticker: Company ticker symbol
        force_rescrape: If True, bypass cache and force re-scraping of financial data

    Returns:
        DCF analysis data calculated from real financial data
    """
    try:
        if force_rescrape:
            logger.info(f"Force re-scraping DCF analysis for {ticker}")

        # Check if cloud storage is available before proceeding
        if not dcf_service.cloud_storage_service.is_available():
            detail_msg = (
                "Cloud Storage is not available. DCF analysis requires "
                "cloud storage for financial data and caching."
            )
            raise HTTPException(
                status_code=503,
                detail=detail_msg,
            )

        # Get DCF analysis (with automatic caching)
        dcf_results = dcf_service.get_dcf_analysis(ticker.upper(), force_rescrape=force_rescrape)

        if force_rescrape:
            intrinsic_value = dcf_results.get("base_results", {}).get("intrinsic_value", 0)
            logger.info(
                f"Successfully re-scraped DCF analysis for {ticker}. "
                f"Intrinsic value: ${intrinsic_value:.2f}"
            )

        # Convert to DCFAnalysis schema
        return DCFAnalysis(
            ticker=dcf_results["ticker"],
            base_results=dcf_results["base_results"],
            analysis_warning=dcf_results.get("analysis_warning"),
            cache_status=dcf_results.get("cache_status"),
            cache_warning=dcf_results.get("cache_warning"),
        )

    except HTTPException:
        raise
    except ValueError as e:
        # No financial data available - return error instead of mock data
        logger.warning(f"No financial data for {ticker}: {e!s}")
        detail_msg = (
            f"No financial data available for {ticker}. "
            "Please ensure the company has been scraped and financial analysis files are available."
        )
        raise HTTPException(
            status_code=404,
            detail=detail_msg,
        ) from e
    except (KeyError, AttributeError) as e:
        logger.error(f"Error in DCF analysis for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500, detail=f"Error calculating DCF for {ticker}: {e!s}"
        ) from e
