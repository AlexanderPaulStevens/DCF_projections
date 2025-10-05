"""
Agent package - AI agents for financial analysis.

This package contains various AI agents that can be used for different
financial analysis tasks using Google AI (Gemini).

AGENTS:
- AnalystAgent: Investment recommendations based on DCF analysis using Google AI (Gemini)

ARCHITECTURE:
- All agents are regular Python classes (no LitServe dependency)
- Use Google AI (Gemini) API for AI inference
- Integrate seamlessly with FastAPI endpoints
- Fallback to rule-based logic when Google AI API is unavailable
"""

from app.core.agents.analyst_agent import AnalystAgent, analyst_agent

__all__ = [
    "AnalystAgent",
    "analyst_agent",
]
