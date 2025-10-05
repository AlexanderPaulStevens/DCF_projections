"""
Analyst Recommendations API endpoint - AI-powered investment recommendations.

This module provides a single endpoint for getting AI-powered investment recommendations
based on DCF analysis and current stock price data.
"""

import logging
from typing import Optional

from app.core.agents.analyst_agent import analyst_agent
from app.schemas.analyst_recommendations import AnalystRecommendation
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/companies", tags=["analyst-recommendations"])


@router.get("/{ticker}/analyst-recommendation", response_model=AnalystRecommendation)
async def get_analyst_recommendation(ticker: str):
    """
    Get AI-powered investment recommendation for a company.

    This endpoint uses the Analyst Agent to analyze DCF results and current
    stock price data to provide investment recommendations with confidence scores
    and detailed reasoning.

    Args:
        ticker: Company ticker symbol

    Returns:
        Comprehensive analyst recommendation including:
        - Investment recommendation (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
        - Target price and upside potential
        - Confidence score (0-100)
        - Risk level assessment
        - Detailed reasoning for the recommendation
        - Key financial metrics
        - Analyst notes
    """
    try:
        logger.info(f"Getting analyst recommendation for {ticker}")

        # Get recommendation from analyst agent
        recommendation = analyst_agent.get_analyst_recommendation(ticker.upper())

        logger.info(
            f"Generated {recommendation.recommendation} recommendation for {ticker}"
        )
        return recommendation

    except ValueError as e:
        logger.warning(f"No data available for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"No financial data available for {ticker}. Please ensure the company has DCF analysis and stock data available.",
        )
    except Exception as e:
        logger.error(f"Error generating analyst recommendation for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating analyst recommendation for {ticker}: {str(e)}",
        )
