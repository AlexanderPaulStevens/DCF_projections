"""
Core business logic modules for Horizon financial analysis

This module contains the fundamental business logic for financial analysis:

ACTIVE MODULES:
- DCF_calculations.py: Core DCF (Discounted Cash Flow) calculation engine
- financial_ratios.py: Financial ratio calculations and analysis
- paths.py: File path utilities
- config.py: Core configuration management

ARCHITECTURE:
- Yahoo Finance API: Primary data source for real-time financial data
- Google Cloud Storage: S&P 500 companies list persistence
- No external scraping: Reliable, fast data access
"""

# Import only the core DCF classes to avoid dependency issues
from app.core.dcf_calculations import DCFCalculator

__all__ = ["DCFCalculator"]
