"""
Application configuration settings
"""

import os
from typing import Any, Dict


class Settings:
    """Application settings with environment variable support."""

    # DCF Calculation Defaults
    DEFAULT_TAX_RATE = 0.25
    DEFAULT_TERMINAL_GROWTH_RATE = 0.025
    DEFAULT_WACC = 0.10
    DEFAULT_PROJECTION_YEARS = 5

    # Growth Rate Defaults
    DEFAULT_EARNINGS_GROWTH_RATE = 0.15
    DEFAULT_CAP_EX_GROWTH_RATE = 0.04

    # Sensitivity Analysis Defaults
    DEFAULT_SENSITIVITY_STEPS = 11
    DEFAULT_SENSITIVITY_RANGE = 0.50

    # Financial Data Defaults
    DEFAULT_HISTORICAL_YEARS = 3
    DEFAULT_SHARES_OUTSTANDING = 15_400_000_000  # Apple's approximate

    # API and Scraping Settings
    REQUEST_DELAY = 1.0  # seconds between requests
    MAX_RETRIES = 3
    TIMEOUT = 30

    # File Paths
    DATA_DIR = "company_data"
    CHARTS_DIR = "charts"

    # Matplotlib Configuration
    MATPLOTLIB_BACKEND = "Agg"  # Non-interactive backend for testing/CI

    @classmethod
    def get_dcf_defaults(cls) -> Dict[str, Any]:
        """Get DCF calculation default parameters."""
        return {
            "tax_rate": cls.DEFAULT_TAX_RATE,
            "terminal_growth_rate": cls.DEFAULT_TERMINAL_GROWTH_RATE,
            "wacc": cls.DEFAULT_WACC,
            "projection_years": cls.DEFAULT_PROJECTION_YEARS,
            "earnings_growth_rate": cls.DEFAULT_EARNINGS_GROWTH_RATE,
            "cap_ex_growth_rate": cls.DEFAULT_CAP_EX_GROWTH_RATE,
        }

    @classmethod
    def get_sensitivity_defaults(cls) -> Dict[str, Any]:
        """Get sensitivity analysis default parameters."""
        return {
            "steps": cls.DEFAULT_SENSITIVITY_STEPS,
            "range": cls.DEFAULT_SENSITIVITY_RANGE,
        }

    @classmethod
    def get_matplotlib_config(cls) -> Dict[str, Any]:
        """Get matplotlib configuration parameters."""
        return {
            "backend": cls.MATPLOTLIB_BACKEND,
        }


# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    Settings.REQUEST_DELAY = 2.0  # More conservative in production
    Settings.MAX_RETRIES = 5

# Allow matplotlib backend override via environment variable
if os.getenv("MATPLOTLIB_BACKEND"):
    Settings.MATPLOTLIB_BACKEND = os.getenv("MATPLOTLIB_BACKEND")
