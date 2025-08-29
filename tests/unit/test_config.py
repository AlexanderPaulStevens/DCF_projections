"""
Unit tests for configuration settings
"""

import pytest
import sys
import os

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from config.settings import Settings


class TestSettings:
    """Test cases for Settings class."""

    def test_default_values(self):
        """Test default configuration values."""
        assert Settings.DEFAULT_TAX_RATE == 0.25
        assert Settings.DEFAULT_TERMINAL_GROWTH_RATE == 0.025
        assert Settings.DEFAULT_WACC == 0.10
        assert Settings.DEFAULT_PROJECTION_YEARS == 5
        assert Settings.DEFAULT_EARNINGS_GROWTH_RATE == 0.15
        assert Settings.DEFAULT_CAP_EX_GROWTH_RATE == 0.04

    def test_sensitivity_defaults(self):
        """Test sensitivity analysis defaults."""
        assert Settings.DEFAULT_SENSITIVITY_STEPS == 11
        assert Settings.DEFAULT_SENSITIVITY_RANGE == 0.50

    def test_financial_defaults(self):
        """Test financial data defaults."""
        assert Settings.DEFAULT_HISTORICAL_YEARS == 3
        assert Settings.DEFAULT_SHARES_OUTSTANDING == 15_400_000_000

    def test_api_settings(self):
        """Test API and scraping settings."""
        assert Settings.REQUEST_DELAY == 1.0
        assert Settings.MAX_RETRIES == 3
        assert Settings.TIMEOUT == 30

    def test_file_paths(self):
        """Test file path settings."""
        assert Settings.DATA_DIR == "company_data"
        assert Settings.CHARTS_DIR == "charts"

    def test_get_dcf_defaults(self):
        """Test DCF defaults method."""
        defaults = Settings.get_dcf_defaults()
        assert defaults["tax_rate"] == 0.25
        assert defaults["terminal_growth_rate"] == 0.025
        assert defaults["wacc"] == 0.10
        assert defaults["projection_years"] == 5
        assert defaults["earnings_growth_rate"] == 0.15
        assert defaults["cap_ex_growth_rate"] == 0.04

    def test_get_sensitivity_defaults(self):
        """Test sensitivity defaults method."""
        defaults = Settings.get_sensitivity_defaults()
        assert defaults["steps"] == 11
        assert defaults["range"] == 0.50

    def test_environment_overrides(self):
        """Test environment-specific overrides."""
        # Test default values
        assert Settings.REQUEST_DELAY == 1.0
        assert Settings.MAX_RETRIES == 3

        # Test production environment override
        import os

        original_env = os.getenv("ENVIRONMENT")

        try:
            os.environ["ENVIRONMENT"] = "production"
            # Re-import to trigger the override
            import importlib
            import config.settings

            importlib.reload(config.settings)

            # Check if overrides were applied
            assert config.settings.Settings.REQUEST_DELAY == 2.0
            assert config.settings.Settings.MAX_RETRIES == 5

        finally:
            # Restore original environment
            if original_env:
                os.environ["ENVIRONMENT"] = original_env
            else:
                os.environ.pop("ENVIRONMENT", None)

    def test_get_matplotlib_config(self):
        """Test getting matplotlib configuration."""
        config = Settings.get_matplotlib_config()

        assert "backend" in config
        assert config["backend"] == Settings.MATPLOTLIB_BACKEND
        assert config["backend"] == "Agg"  # Should default to non-interactive

    def test_matplotlib_backend_actually_set(self):
        """Test that matplotlib backend is actually set to non-interactive."""
        # Import company_analyzer to trigger matplotlib backend setting

        # Check that matplotlib is using the Agg backend
        import matplotlib

        assert matplotlib.get_backend() == "Agg"

    def test_matplotlib_backend_environment_override(self):
        """Test matplotlib backend environment variable override."""
        import os

        # Test environment variable override
        original_backend = os.getenv("MATPLOTLIB_BACKEND")

        try:
            # Set environment variable
            os.environ["MATPLOTLIB_BACKEND"] = "TkAgg"

            # Re-import to trigger the override
            import importlib
            import config.settings

            importlib.reload(config.settings)

            # Check if override was applied
            assert config.settings.Settings.MATPLOTLIB_BACKEND == "TkAgg"

        finally:
            # Restore original environment
            if original_backend:
                os.environ["MATPLOTLIB_BACKEND"] = original_backend
            else:
                os.environ.pop("MATPLOTLIB_BACKEND", None)


if __name__ == "__main__":
    pytest.main([__file__])
