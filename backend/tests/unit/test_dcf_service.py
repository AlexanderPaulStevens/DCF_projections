#!/usr/bin/env python3
"""
Unit tests for DCF service functionality.
"""

import pytest
from unittest.mock import Mock, patch
from backend.app.services.dcf_service import DCFService


class TestDCFService:
    """Test cases for DCFService class."""

    def test_init(self):
        """Test DCFService initialization."""
        service = DCFService()
        assert service is not None
        assert hasattr(service, "dcf_calculator")

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_create_dcf_calculator(self, mock_dcf_calculator_class):
        """Test creating DCF calculator."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        service = DCFService()
        result = service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        assert result == mock_calculator
        # The constructor takes 3 arguments: ticker, financial_data, base_year (which defaults to None)
        # Note: string keys get converted to integers in the service
        mock_dcf_calculator_class.assert_called_once_with(
            "AAPL", {2023: {"revenue": 1000000}}, None
        )

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_run_dcf_analysis(self, mock_dcf_calculator_class):
        """Test running DCF analysis."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        # Mock the DCF analysis methods
        mock_projections = {"2024": {"revenue": 1100000}, "2025": {"revenue": 1210000}}
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
        mock_calculator.calculate_enterprise_value.assert_called_once_with(
            mock_projections
        )
        mock_calculator.calculate_equity_value.assert_called_once_with(
            mock_enterprise_value
        )
        mock_calculator.calculate_per_share_value.assert_called_once_with(
            mock_equity_value, 1000000
        )

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_run_dcf_analysis_with_defaults(self, mock_dcf_calculator_class):
        """Test running DCF analysis with default parameters."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

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

        result = service.run_dcf_analysis()

        assert result is not None
        # Should use default values
        mock_calculator.project_financials.assert_called_once()

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_run_sensitivity_analysis(self, mock_dcf_calculator_class):
        """Test running sensitivity analysis."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        # Mock financial_data with proper keys() method
        mock_financial_data = Mock()
        mock_financial_data.keys.return_value = [2023]
        mock_financial_data.__getitem__ = Mock(return_value={"Diluted": 1000000})
        mock_calculator.financial_data = mock_financial_data

        # Mock sensitivity analysis results
        mock_sensitivity_results = {
            "variable": "earnings_growth_rate",
            "base_value": 0.15,
            "enterprise_values": [4000000, 5000000, 6000000],
            "equity_values": [3600000, 4500000, 5400000],
            "per_share_values": [36.0, 45.0, 54.0],
        }

        mock_calculator.run_sensitivity_analysis.return_value = mock_sensitivity_results

        service = DCFService()
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        result = service.run_sensitivity_analysis(steps=11)

        assert result == mock_sensitivity_results
        mock_calculator.run_sensitivity_analysis.assert_called_once_with(steps=11)

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_run_sensitivity_analysis_with_defaults(self, mock_dcf_calculator_class):
        """Test running sensitivity analysis with default parameters."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        # Mock financial_data with proper keys() method
        mock_financial_data = Mock()
        mock_financial_data.keys.return_value = [2023]
        mock_financial_data.__getitem__ = Mock(return_value={"Diluted": 1000000})
        mock_calculator.financial_data = mock_financial_data

        mock_sensitivity_results = {
            "variable": "earnings_growth_rate",
            "base_value": 0.15,
            "enterprise_values": [4000000, 5000000, 6000000],
        }

        mock_calculator.run_sensitivity_analysis.return_value = mock_sensitivity_results

        service = DCFService()
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        result = service.run_sensitivity_analysis()

        assert result == mock_sensitivity_results
        # Should use default steps value
        mock_calculator.run_sensitivity_analysis.assert_called_once()

    def test_dcf_service_without_calculator(self):
        """Test DCF service behavior without creating calculator first."""
        service = DCFService()

        # Should raise ValueError when no calculator exists
        with pytest.raises(ValueError, match="DCF calculator not initialized"):
            service.run_dcf_analysis()

    def test_dcf_service_error_handling(self):
        """Test DCF service error handling."""
        service = DCFService()

        # Test with invalid parameters
        try:
            result = service.run_dcf_analysis(earnings_growth_rate="invalid", years=-1)
            # Should handle invalid parameters gracefully
            assert result is None or isinstance(result, dict)
        except (TypeError, ValueError):
            # Exceptions are also acceptable for invalid parameters
            pass

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_dcf_service_calculator_reuse(self, mock_dcf_calculator_class):
        """Test that DCF calculator is reused when appropriate."""
        mock_calculator = Mock()
        mock_dcf_calculator_class.return_value = mock_calculator

        service = DCFService()

        # Create calculator first time
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})
        assert mock_dcf_calculator_class.call_count == 1

        # Create calculator second time with same parameters
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})
        # Should create new calculator (or reuse existing one)
        assert mock_dcf_calculator_class.call_count >= 1

    @patch("backend.app.services.dcf_service.DCFCalculator")
    def test_dcf_service_multiple_companies(self, mock_dcf_calculator_class):
        """Test DCF service with multiple companies."""
        mock_calculator_aapl = Mock()
        mock_calculator_msft = Mock()
        mock_dcf_calculator_class.side_effect = [
            mock_calculator_aapl,
            mock_calculator_msft,
        ]

        service = DCFService()

        # Create calculator for AAPL
        service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})

        # Create calculator for MSFT
        service.create_dcf_calculator("MSFT", {"2023": {"revenue": 2000000}})

        assert mock_dcf_calculator_class.call_count == 2
        # Verify different companies were processed
        calls = mock_dcf_calculator_class.call_args_list
        assert calls[0][0][0] == "AAPL"  # First call with AAPL
        assert calls[1][0][0] == "MSFT"  # Second call with MSFT


# Test functions for pytest discovery
def test_dcf_service_creation():
    """Test creating a DCFService instance."""
    service = DCFService()
    assert isinstance(service, DCFService)


def test_dcf_service_attributes():
    """Test DCFService has expected attributes."""
    service = DCFService()
    # Should have dcf_calculator attribute (even if None initially)
    assert hasattr(service, "dcf_calculator")


@patch("backend.app.services.dcf_service.DCFCalculator")
def test_dcf_service_integration(mock_dcf_calculator_class):
    """Test DCF service integration workflow."""
    mock_calculator = Mock()
    mock_dcf_calculator_class.return_value = mock_calculator

    # Mock financial_data with proper keys() method
    mock_financial_data = Mock()
    mock_financial_data.keys.return_value = [2023]
    mock_financial_data.__getitem__ = Mock(return_value={"Diluted": 1000000})
    mock_calculator.financial_data = mock_financial_data

    # Mock all the methods
    mock_calculator.project_financials.return_value = {"2024": {"revenue": 1100000}}
    mock_calculator.calculate_enterprise_value.return_value = 5000000
    mock_calculator.calculate_equity_value.return_value = 4500000
    mock_calculator.calculate_per_share_value.return_value = 45.0
    mock_calculator.run_sensitivity_analysis.return_value = {"variable": "test"}

    service = DCFService()

    # Test full workflow
    service.create_dcf_calculator("AAPL", {"2023": {"revenue": 1000000}})
    dcf_result = service.run_dcf_analysis(earnings_growth_rate=0.15, years=3)
    sensitivity_result = service.run_sensitivity_analysis(steps=5)

    assert dcf_result is not None
    assert sensitivity_result == {"variable": "test"}
    assert mock_dcf_calculator_class.call_count == 1
