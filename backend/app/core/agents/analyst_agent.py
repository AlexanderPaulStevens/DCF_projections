"""
Analyst Agent - AI-powered investment recommendations.

This module implements an analyst agent that provides investment recommendations
based on DCF analysis and current stock price data.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict

import google.generativeai as genai

from app.config import settings
from app.core.prompts import prompt_manager
from app.schemas.analyst_recommendations import (
    AnalystRecommendation,
    RecommendationType,
    RiskLevel,
)
from app.schemas.structured_responses import AnalystResponse
from app.services.dcf_service import DCFService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class AnalystAgent:
    """
    Analyst Agent for AI-powered investment recommendations.

    This agent analyzes DCF results and stock price data to provide investment
    recommendations with confidence scores and risk assessments.
    """

    def __init__(self):
        """Initialize the Analyst Agent."""
        self.name = "Analyst Agent"
        self.description = (
            "AI-powered investment recommendations based on DCF analysis and stock price data"
        )
        self.llm_client = None  # Will be initialized when needed
        self.llm_provider = None
        self._initialize_llm_client()

    def _initialize_llm_client(self):
        """Initialize the LLM."""
        try:
            # Set API key via settings
            api_key = settings.GOOGLE_API_KEY
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not configured in settings")
            genai.configure(api_key=api_key)
            self.llm_client = genai.GenerativeModel("gemini-2.0-flash")
            self.llm_provider = "gemini"
            logger.info("Google AI (Gemini) client initialized successfully")
        except ImportError:
            logger.warning(
                "Google Generative AI package not installed. "
                "Install with: pip install google-generativeai"
            )
            self.llm_client = None
            self.llm_provider = None
        except (ValueError, OSError) as e:
            logger.error(f"Google AI initialization failed: {e!s}")
            self.llm_client = None
            self.llm_provider = None

        if not self.llm_client:
            logger.warning(
                "No LLM client available. "
                "Analyst recommendations will fail without Google AI API key."
            )

    def _get_llm_recommendation(
        self, ticker: str, dcf_data: Dict[str, Any], stock_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get recommendation from LLM based on financial data."""
        if not self.llm_client:
            self._initialize_llm_client()

        if not self.llm_client:
            raise ValueError(
                "Google AI client not available. Please check your API key and internet connection."
            )

        # Prepare the prompt for Gemini
        prompt = self._build_llm_prompt(ticker, dcf_data, stock_data)

        # Call Gemini with JSON mode for structured output
        system_prompt = (
            "You are a professional financial analyst. "
            "Provide investment recommendations based on DCF analysis and market data. "
            "Always be conservative and cite specific metrics."
        )
        response = self.llm_client.generate_content(
            f"{system_prompt}\n\n{prompt}",
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 2000,
                "response_mime_type": "application/json",
            },
        )

        # Check if response is valid and handle errors properly
        try:
            llm_text = response.text.strip()
            if not llm_text:
                finish_reason = (
                    response.candidates[0].finish_reason if response.candidates else "unknown"
                )
                error_msg = f"Empty response from Gemini API. Finish reason: {finish_reason}"
                logger.error(error_msg)
                raise ValueError(error_msg)
        except (AttributeError, IndexError, KeyError) as text_error:
            finish_reason = (
                response.candidates[0].finish_reason if response.candidates else "unknown"
            )
            error_msg = (
                f"Error accessing Gemini API response text: {text_error!s}. "
                f"Finish reason: {finish_reason}"
            )
            logger.error(error_msg)
            raise ValueError(error_msg) from text_error

        # Parse the LLM response with structured validation
        try:
            return self._parse_llm_response(llm_text, ticker, dcf_data, stock_data)
        except ValueError as parse_error:
            # Re-raise parsing errors with context
            error_msg = f"Failed to parse structured response for {ticker}: {parse_error!s}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    def _build_llm_prompt(
        self, ticker: str, dcf_data: Dict[str, Any], stock_data: Dict[str, Any]
    ) -> str:
        """Build a comprehensive prompt for the LLM using Jinja2 template."""
        base_results = dcf_data.get("base_results", {})

        # Prepare template variables
        template_vars = {
            "ticker": ticker,
            "current_price": stock_data.get("current_price", 0),
            "pe_ratio": stock_data.get("pe_ratio"),
            "beta": stock_data.get("beta"),
            "market_cap": stock_data.get("market_cap", 0),
            "intrinsic_value": base_results.get("intrinsic_value", 0),
            "revenue_growth_rate": base_results.get("revenue_growth_rate", 0),
            "net_profit_margin": base_results.get("net_profit_margin", 0),
            "wacc": base_results.get("wacc", 0),
        }

        # Render the template
        return prompt_manager.render_template("analyst_recommendation.j2", **template_vars)

    def _parse_llm_response(
        self,
        llm_text: str,
        ticker: str,  # noqa: ARG002
        dcf_data: Dict[str, Any],  # noqa: ARG002
        stock_data: Dict[str, Any],  # noqa: ARG002
    ) -> Dict[str, Any]:
        """Parse the LLM JSON response into structured format using Pydantic."""
        try:
            # Parse JSON response
            json_data = json.loads(llm_text)

            # Validate with Pydantic model
            analyst_response = AnalystResponse(**json_data)

            # Convert to the expected format for the API
            return {
                "recommendation": analyst_response.recommendation,
                "confidence_score": analyst_response.confidence_score,
                "risk_level": analyst_response.risk_level,
                "reasoning": analyst_response.reasoning,
                "target_price": analyst_response.target_price,
                "analyst_notes": analyst_response.analyst_notes,
                "key_risks": analyst_response.key_risks,
                "key_opportunities": analyst_response.key_opportunities,
            }

        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse JSON response from LLM: {e!s}"
            logger.error(error_msg)
            logger.error(f"Raw LLM response: {llm_text}")
            raise ValueError(error_msg) from e

        except (ValueError, KeyError, TypeError) as e:
            error_msg = f"Failed to validate structured response: {e!s}"
            logger.error(error_msg)
            logger.error(f"Raw LLM response: {llm_text}")
            raise ValueError(error_msg) from e

    def get_analyst_recommendation(self, ticker: str) -> AnalystRecommendation:
        """
        Get comprehensive analyst recommendation for a company.

        Args:
            ticker: Company ticker symbol

        Returns:
            Complete analyst recommendation with reasoning and metrics
        """
        try:
            ticker = ticker.upper()
            logger.info(f"Generating analyst recommendation for {ticker}")

            # 1. Get DCF analysis using the service directly
            dcf_analysis = self._get_dcf_analysis_from_service(ticker)
            if not dcf_analysis:
                raise ValueError(f"No DCF analysis available for {ticker}")

            # 2. Get current stock data using the service directly
            stock_data = self._get_stock_data_from_service(ticker)

            # 3. Get AI recommendation using LLM
            ai_output = self._get_llm_recommendation(ticker, dcf_analysis, stock_data)

            # 4. Build comprehensive recommendation
            recommendation = self._build_recommendation(ticker, dcf_analysis, stock_data, ai_output)

            logger.info(f"Generated {recommendation.recommendation} recommendation for {ticker}")
            return recommendation

        except ValueError as e:
            # For structured response errors, propagate the error with context
            logger.error(f"Structured response error for {ticker}: {e!s}")
            raise ValueError(
                f"Failed to generate structured analyst recommendation for {ticker}: {e!s}"
            ) from e
        except (KeyError, OSError, TypeError) as e:
            # For other errors, log and propagate
            logger.error(f"Unexpected error generating analyst recommendation for {ticker}: {e!s}")
            raise ValueError(
                f"Unexpected error generating analyst recommendation for {ticker}: {e!s}"
            ) from e

    def _get_dcf_analysis_from_service(self, ticker: str) -> Dict[str, Any]:
        """Get DCF analysis using the DCF service directly."""
        try:
            dcf_service = DCFService()
            return dcf_service.get_dcf_analysis(ticker)
        except (ValueError, KeyError, OSError) as e:
            logger.error(f"Error getting DCF analysis for {ticker}: {e!s}")
            raise ValueError(f"Failed to get DCF analysis for {ticker}: {e!s}") from e

    def _get_stock_data_from_service(self, ticker: str) -> Dict[str, Any]:
        """Get stock data using the Yahoo Finance service directly."""
        try:
            yahoo_service = YahooFinanceService()
            raw_data = yahoo_service.get_comprehensive_data(ticker)
            if not raw_data:
                raise ValueError(f"No stock data available for {ticker}")
            return yahoo_service.build_stock_data_response(raw_data, "1d")
        except (ValueError, KeyError, OSError, TypeError) as e:
            logger.error(f"Error getting stock data for {ticker}: {e!s}")
            raise ValueError(f"Failed to get stock data for {ticker}: {e!s}") from e

    def _build_recommendation(
        self,
        ticker: str,
        dcf_analysis: Dict[str, Any],
        stock_data: Dict[str, Any],
        ai_output: Dict[str, Any],
    ) -> AnalystRecommendation:
        """Build comprehensive analyst recommendation."""
        base_results = dcf_analysis.get("base_results", {})
        current_price = stock_data.get("current_price", 0)
        intrinsic_value = base_results.get("intrinsic_value", 0)
        price_to_intrinsic = current_price / intrinsic_value if intrinsic_value > 0 else 0

        # Calculate upside potential
        target_price = ai_output["target_price"]
        upside_potential = (
            ((target_price - current_price) / current_price) * 100 if current_price > 0 else 0
        )

        # Extract key metrics for display
        key_metrics = {
            "current_price": current_price,
            "intrinsic_value": intrinsic_value,
            "price_to_intrinsic_ratio": price_to_intrinsic,
            "pe_ratio": stock_data.get("pe_ratio", 0),
            "beta": stock_data.get("beta", 1.0),
            "market_cap": stock_data.get("market_cap", 0),
            "revenue_growth_rate": base_results.get("revenue_growth_rate", 0),
            "net_profit_margin": base_results.get("net_profit_margin", 0),
            "wacc": base_results.get("wacc", 0.1),
        }

        return AnalystRecommendation(
            ticker=ticker,
            recommendation=RecommendationType(ai_output["recommendation"]),
            target_price=target_price,
            current_price=current_price,
            upside_potential=upside_potential,
            confidence_score=ai_output["confidence_score"],
            risk_level=RiskLevel(ai_output["risk_level"]),
            reasoning=ai_output["reasoning"],
            key_metrics=key_metrics,
            dcf_intrinsic_value=intrinsic_value,
            price_to_intrinsic_ratio=price_to_intrinsic,
            analysis_timestamp=datetime.now().isoformat(),
            analyst_notes=ai_output["analyst_notes"],
        )


# Create a global instance for use in services
analyst_agent = AnalystAgent()
