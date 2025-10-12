"""
Pydantic data models - API request/response validation

This module contains all Pydantic schemas used for API validation,
data serialization, and type safety throughout the application.

SCHEMA CATEGORIES:
- Company Data: CompanyInfo, CompanySearchResult, StockData
- Financial Analysis: FinancialRatios, DCFAnalysis

SCHEMA BENEFITS:
- Automatic validation of incoming API requests
- Type safety and IDE autocompletion
- Automatic API documentation generation
- Data serialization/deserialization
- Clear data contracts between frontend and backend

USAGE:
- API endpoints use these schemas for request/response validation
- Services use these schemas for data transformation
- Frontend TypeScript interfaces should match these schemas
"""

from .analyst_recommendations import (
    AnalystRecommendation,
    RecommendationType,
    RiskLevel,
)

# Import all schemas for easy access
from .company_data import CompanyInfo, CompanySearchResult, StockData
from .financial_analysis import DCFAnalysis, FinancialRatios

__all__ = [
    "AnalystRecommendation",
    "CompanyInfo",
    "CompanySearchResult",
    "DCFAnalysis",
    "FinancialRatios",
    "RecommendationType",
    "RiskLevel",
    "StockData",
]
