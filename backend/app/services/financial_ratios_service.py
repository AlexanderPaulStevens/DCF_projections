import json
import logging
from typing import Any, Dict

from fastapi import HTTPException

from app.core.financial_ratios import FinancialRatiosCalculator
from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class FinancialRatiosService:
    def __init__(self):
        self.cloud_storage_service = CloudStorageService()
        self.yahoo_service = YahooFinanceService()
        self.ratios_calculator = FinancialRatiosCalculator()

    async def calculate_financial_ratios(self, ticker: str) -> Dict[str, Any]:
        """
        Calculate financial ratios from Yahoo Finance data.

        Args:
            ticker: Company ticker symbol

        Returns:
            Financial ratios calculated from real Yahoo Finance data
        """
        try:
            # Try to get cached raw data first
            raw_data = None
            try:
                raw_data = self.cloud_storage_service.read_json_file(
                    ticker.upper(), "raw_data_cache.json"
                )
                if raw_data:
                    logger.info(f"Using cached raw data for financial ratios {ticker}")
            except (OSError, ValueError, KeyError) as e:
                logger.debug(f"No cached raw data found for {ticker}: {e!s}")

            # If no cached data, fetch from Yahoo Finance
            if not raw_data:
                logger.info(
                    f"Fetching fresh raw data from Yahoo Finance for financial ratios {ticker}"
                )
                raw_data = self.yahoo_service.get_comprehensive_data(ticker.upper())

                if not raw_data:
                    raise HTTPException(
                        status_code=404, detail=f"Financial data not found for {ticker}"
                    )

                # Cache the data for future requests
                try:
                    cache_content = json.dumps(raw_data, indent=2, default=str)
                    success = self.cloud_storage_service.upload_file_content(
                        ticker.upper(),
                        "raw_data_cache.json",
                        cache_content,
                        content_type="application/json",
                    )
                    if success:
                        logger.info(f"Successfully cached raw data for financial ratios {ticker}")
                    else:
                        logger.warning(f"Failed to cache raw data for financial ratios {ticker}")
                except (OSError, ValueError, TypeError) as e:
                    logger.warning(f"Error caching raw data for financial ratios {ticker}: {e!s}")
                    # Don't fail the request if caching fails

            # Calculate ratios using core business logic with evaluation
            ratios = self.ratios_calculator.calculate_ratios_with_evaluation(raw_data)

            return {
                "ticker": ticker.upper(),
                "ratios": ratios,
            }

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error calculating financial ratios for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Error calculating financial ratios for {ticker}: {e!s}",
            ) from e
