"""
Pydantic data models - API request/response validation

This module contains all Pydantic schemas used for API validation,
data serialization, and type safety throughout the application.

SCHEMA CATEGORIES:
- Company Data: CompanyInfo, CompanySearchResult, StockData
- Financial Analysis: FinancialRatios, DCFAnalysis
- Unified Financial Statements: FinancialStatements, IncomeStatement, BalanceSheet, etc.

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

MIGRATION:
- Legacy schemas (DCFFinancialData, etc.) are deprecated but kept for compatibility
- Use new unified schemas (FinancialStatements) for new development
- Migration helpers are provided for backward compatibility
"""

from .analyst_recommendations import (
    AnalystRecommendation,
    RecommendationType,
    RiskLevel,
)

# Import all schemas for easy access
from .company_data import CompanyInfo, CompanySearchResult, StockData
from .financial_analysis import DCFAnalysis, RatioEvaluationData, ValuationAnalysis
from .financial_statements import (
    BalanceSheet,
    CashFlowStatement,
    FilingMetadata,
    FinancialStatements,
    HistoricalFinancialData,
    IncomeStatement,
    MarketData,
)

__all__ = [
    # Unified financial statement schemas
    "BalanceSheet",
    "CashFlowStatement",
    "FilingMetadata",
    "FinancialStatements",
    "HistoricalFinancialData",
    "IncomeStatement",
    "MarketData",
    # API response schemas
    "AnalystRecommendation",
    "CompanyInfo",
    "CompanySearchResult",
    "DCFAnalysis",
    "RatioEvaluationData",
    "RecommendationType",
    "RiskLevel",
    "StockData",
    "ValuationAnalysis",
]
