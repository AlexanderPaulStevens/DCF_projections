"""
Core business logic modules for Horizon financial analysis

This module contains the fundamental business logic for financial analysis:

ACTIVE MODULES:
- DCF_calculations.py: Core DCF (Discounted Cash Flow) calculation engine
- financial_ratios.py: Financial ratio calculations and analysis
- companies.py: Company data management and processing
- paths.py: File path utilities
- config.py: Core configuration management

ARCHITECTURE:
- Yahoo Finance API: Primary data source for real-time financial data
- Google Cloud Storage: S&P 500 companies list persistence
- No external scraping: Reliable, fast data access
"""

from app.core.companies import Company_historical_data

# Import only the core DCF classes to avoid dependency issues
from app.core.DCF_calculations import DCFCalculator

__all__ = ["DCFCalculator", "Company_historical_data"]
