"""
Configuration settings for DCF Projections application.
"""

from pathlib import Path

# Base directory and paths
BASE_DIR = Path(__file__).parent
COMPANY_DATA_DIR = BASE_DIR / "company_data"

# Default DCF parameters
DEFAULT_DCF_PARAMS = {
    "years_back": 3,
    "base_earnings_growth": 0.15,  # 15%
    "steps": 2,
    "step_size": 0.10,  # 10%
    "tax_rate": 0.25,  # 25%
    "terminal_growth_rate": 0.025,  # 2.5%
    "wacc": 0.10,  # 10%
    "projection_years": 5,
}

# Default sensitivity analysis parameters
DEFAULT_SENSITIVITY_PARAMS = {
    "steps": 11,
    "range": 0.50,  # ±50%
}

# SEC API configuration
SEC_API_CONFIG = {
    "base_url": "https://data.sec.gov",
    "rate_limit_delay": 1,  # seconds between requests
    "user_agent": "DCF Projections App (your-email@domain.com)",
}

# Logging configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
}
