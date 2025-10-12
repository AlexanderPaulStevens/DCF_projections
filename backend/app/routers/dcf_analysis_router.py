"""
DCF Analysis API endpoints - discounted cash flow analysis and valuation.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import get_dcf_service
from app.schemas.financial_analysis import DCFAnalysis
from app.services.dcf_service import DCFService
from app.services.financial_data_processor import FinancialDataProcessor

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/companies", tags=["dcf-analysis"])


@router.get("/{ticker}/DCF", response_model=DCFAnalysis)
async def get_dcf_analysis(ticker: str, dcf_service: DCFService = Depends(get_dcf_service)):
    """
    Get DCF analysis for a company using real financial data.

    Args:
        ticker: Company ticker symbol

    Returns:
        DCF analysis data calculated from real financial data
    """
    try:
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

        # Use the enhanced DCF service to get real calculations
        dcf_results = dcf_service.get_dcf_analysis(ticker.upper())

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


@router.post("/{ticker}/DCF/overwrite")
async def overwrite_dcf_analysis(ticker: str, dcf_service: DCFService = Depends(get_dcf_service)):
    """
    Force overwrite DCF analysis by re-scraping financial data and recalculating.
    This bypasses all cached data and forces a fresh analysis.

    Args:
        ticker: Company ticker symbol

    Returns:
        Fresh DCF analysis results with scraping status
    """
    try:
        logger.info(f"Force overwriting DCF analysis for {ticker}")

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

        # 1. Force re-scrape financial data (bypass cloud storage)
        processor = FinancialDataProcessor()

        logger.info(f"Re-scraping financial data for {ticker}...")
        financial_data = processor.process_company_financial_data(ticker.upper())

        if not financial_data:
            raise HTTPException(
                status_code=404, detail=f"Could not scrape financial data for {ticker}"
            )

        # 2. Create DCF calculator with fresh scraped data
        dcf_service.create_dcf_calculator(ticker.upper(), financial_data)

        # 3. Run DCF analysis
        dcf_results = dcf_service.run_dcf_analysis()

        # 4. Get current stock price for comparison
        current_price = dcf_service._get_current_stock_price(ticker.upper())

        # 5. Build comprehensive response
        dcf_analysis = dcf_service._build_dcf_response(ticker.upper(), dcf_results, current_price)
        dcf_analysis["cache_status"] = "overwritten"
        dcf_analysis["cache_warning"] = True
        dcf_analysis["scraping_status"] = (
            f"Successfully re-scraped and recalculated DCF for {ticker}"
        )

        # 6. Cache the new results
        dcf_service._cache_dcf_analysis(ticker.upper(), dcf_analysis)

        # 7. Validate intrinsic value
        intrinsic_value = dcf_analysis.get("base_results", {}).get("intrinsic_value", 0)
        if intrinsic_value == 0:
            logger.warning(f"DCF analysis for {ticker} resulted in zero intrinsic value")
            warning_msg = (
                "DCF analysis resulted in zero intrinsic value. "
                "This may indicate issues with financial data extraction or calculation parameters."
            )
            dcf_analysis["analysis_warning"] = warning_msg

        info_msg = (
            f"Successfully overwrote DCF analysis for {ticker}. "
            f"Intrinsic value: ${intrinsic_value:.2f}"
        )
        logger.info(info_msg)

        return dcf_analysis

    except HTTPException:
        raise
    except (ValueError, KeyError, AttributeError) as e:
        logger.error(f"Error overwriting DCF analysis for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Error overwriting DCF analysis for {ticker}: {e!s}",
        ) from e
