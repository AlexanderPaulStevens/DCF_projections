"""
Test package for DCF Projections

This module contains all tests for the DCF analysis system.

TEST STRUCTURE:
├── unit/           # Unit tests for individual components
│   ├── test_companies_router_unified.py
│   ├── test_dcf_service.py
│   ├── test_yahoo_finance_comprehensive.py
│   └── ... (other unit tests)
└── integration/    # Integration tests for component interactions
    └── test_unified_data_architecture.py

TESTING STRATEGY:
- Unit tests: Test individual functions/classes in isolation
- Integration tests: Test component interactions and data flow
- Mock external dependencies (Yahoo Finance, Cloud Storage)
- Test both success and error scenarios
- Maintain high test coverage for critical business logic

RUNNING TESTS:
- Unit tests: `pytest tests/unit/`
- Integration tests: `pytest tests/integration/`
- All tests: `pytest tests/`
"""
