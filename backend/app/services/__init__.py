"""
Service layer for business logic - Core business operations

This module contains the main business logic services that handle data processing,
external API integrations, and complex calculations.

ACTIVE SERVICES:
- dcf_service.py: DCF analysis orchestration and calculation management
- financial_ratios_service.py: Financial ratio calculations and analysis
- yahoo_finance_service.py: Yahoo Finance API integration for real-time data
- cloud_storage_service.py: Google Cloud Storage integration for data persistence
- financial_data_processor.py: Financial data processing and transformation

SERVICE PRINCIPLES:
- Pure functions: No side effects, predictable outputs
- Stateless: No internal state, can be called concurrently
- Easy to test: Isolated logic, mockable dependencies
- Easy to understand: Clear interfaces, well-documented
- Single responsibility: Each service has one clear purpose

DATA FLOW:
1. Yahoo Finance Service → Raw financial data
2. Financial Data Processor → Processed financial data
3. DCF Service → DCF calculations and analysis
4. Cloud Storage Service → Data persistence
5. Financial Ratios Service → Ratio calculations
"""
