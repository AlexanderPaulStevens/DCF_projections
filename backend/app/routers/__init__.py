"""
API endpoints package - FastAPI REST API layer

This module contains all the REST API endpoints for the Horizon financial analysis system.

ACTIVE ROUTERS:
- companies.py: Company data endpoints (stock data, financial ratios, raw data, company info)
- dcf_analysis.py: DCF analysis endpoints (calculate DCF, overwrite analysis)

ROUTER RESPONSIBILITIES:
- Validate input data using Pydantic schemas
- Call appropriate services for business logic
- Format output data according to API contracts
- Handle errors and return proper HTTP status codes
- Return structured JSON responses
- Add proper logging for debugging
- Add proper API documentation
- Add proper testing coverage

API STRUCTURE:
- /: API discovery and health check
- /companies/: Company data and financial information
- /companies/{ticker}/DCF: DCF analysis and calculations

DATA SOURCES:
- Yahoo Finance API: Primary data source for real-time financial data
- Google Cloud Storage: S&P 500 companies list persistence
"""
