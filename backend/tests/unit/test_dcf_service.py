"""
Simplified DCF service tests - focused on core functionality.
"""

from unittest.mock import Mock, patch

import pytest
from app.services.dcf_service import DCFService


class TestDCFService:
    """Simplified test cases for DCFService class."""

    def test_init(self):
        """Test DCFService initialization."""
        service = DCFService()
        assert service is not None
        assert hasattr(service, "dcf_calculator")

    @patch("app.services.dcf_service.DCFCalculator")
    def test_create_dcf_calculator(self, mock_dcf_calculator_class):
        """Test creating DCF calculator."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        service = DCFService()
        result = service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        assert result == mock_calculator
        mock_dcf_calculator_class.assert_called_once_with(
            "AAPL", {2023: {"revenue": 1000000}}, None
        )

    @patch("app.services.dcf_service.DCFCalculator")
    def test_run_dcf_analysis(self, mock_dcf_calculator_class):
        """Test running DCF analysis."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        # Mock the DCF analysis methods
        mock_projections = {"2024": {"revenue": 1100000}}
        mock_enterprise_value = 5000000
        mock_equity_value = 4500000
        mock_per_share_value = 45.0

        # Mock financial_data with proper keys() method
        mock_financial_data = Mock()
        mock_financial_data.keys.return_value = [2023]
        mock_financial_data.__getitem__ = Mock(return_value={"Diluted": 1000000})
        mock_calculator.financial_data = mock_financial_data

        mock_calculator.project_financials.return_value = mock_projections
        mock_calculator.calculate_enterprise_value.return_value = mock_enterprise_value
        mock_calculator.calculate_equity_value.return_value = mock_equity_value
        mock_calculator.calculate_per_share_value.return_value = mock_per_share_value

        service = DCFService()
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        result = service.run_dcf_analysis(earnings_growth_rate=0.15, years=3)

        assert result is not None
        mock_calculator.project_financials.assert_called_once()

    def test_dcf_service_without_calculator(self):
        """Test DCF service behavior without creating calculator first."""
        service = DCFService()

        # Should raise ValueError when no calculator exists
        with pytest.raises(ValueError, match="DCF calculator not initialized"):
            service.run_dcf_analysis()
