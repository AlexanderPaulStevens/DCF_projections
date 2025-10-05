"""
Structured response schemas for AI agents.

This module defines Pydantic models for structured LLM responses,
ensuring consistent and parseable output from AI agents.
"""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class RecommendationType(str, Enum):
    """Investment recommendation types."""

    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


class RiskLevel(str, Enum):
    """Risk assessment levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


class AnalystResponse(BaseModel):
    """Structured response from the analyst agent."""

    recommendation: RecommendationType = Field(
        description="Investment recommendation: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL"
    )

    confidence_score: int = Field(
        ge=0, le=100, description="Confidence level from 0-100%"
    )

    risk_level: RiskLevel = Field(
        description="Risk assessment: LOW, MEDIUM, HIGH, or VERY_HIGH"
    )

    target_price: float = Field(gt=0, description="Target price for the stock")

    reasoning: List[str] = Field(
        description="List of key reasoning points supporting the recommendation"
    )

    analyst_notes: str = Field(description="Detailed analysis and commentary")

    key_risks: List[str] = Field(
        default_factory=list, description="List of key risks identified"
    )

    key_opportunities: List[str] = Field(
        default_factory=list, description="List of key opportunities identified"
    )
