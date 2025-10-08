"""
Simplified pytest configuration and fixtures for testing core functionality.
"""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

# Import app with error handling
try:
    from main import app
except ImportError as e:
    print(f"Warning: App not available for testing: {e}")
    app = None


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    if app is None:
        pytest.skip("App not available due to missing dependencies")

    # Mock external services to prevent real API calls
    with (
        patch("app.routers.companies_router.YahooFinanceService") as mock_yahoo,
        patch("app.routers.companies_router.CloudStorageService") as mock_cloud,
    ):

        # Configure basic mocks
        mock_yahoo.return_value = Mock()
        mock_cloud.return_value = Mock()

        return TestClient(app)


# Simple test utilities
def assert_valid_response(response, expected_status: int = 200):
    """Assert that a response is valid."""
    assert response.status_code == expected_status
    assert response.headers["content-type"] == "application/json"


def assert_error_response(response, expected_status: int):
    """Assert that an error response is valid."""
    assert response.status_code == expected_status
    data = response.json()
    assert "detail" in data
