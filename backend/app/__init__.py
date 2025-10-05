"""
DCF Projections Application Package

This is the main application package for the DCF (Discounted Cash Flow) analysis system.

ARCHITECTURE OVERVIEW:
├── core/           # Core business logic (DCF calculations, financial analysis)
├── routers/        # FastAPI API endpoints (REST API layer)
├── services/       # Business logic services (data processing, external APIs)
├── schemas/        # Pydantic data models (request/response validation)
├── dtos/           # Data Transfer Objects (currently unused)
├── exceptions/     # Custom exception classes (currently unused)
├── models/         # Database models (currently unused)
├── repositories/   # Data access layer (currently unused)
└── utils/          # Utility functions (logging, helpers)

CURRENT ACTIVE MODULES:
- core/: DCF calculations, financial analysis
- routers/: API endpoints for companies, DCF analysis, data scraping
- services/: Yahoo Finance integration, cloud storage, DCF processing
- schemas/: Pydantic models for API validation
- utils/: Logging and utility functions

UNUSED MODULES (for future expansion):
- dtos/, exceptions/, models/, repositories/: Reserved for future database integration
"""

__version__ = "1.0.0"
__author__ = "Alexander Stevens"
