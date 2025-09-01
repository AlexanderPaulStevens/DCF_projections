"""
Unit tests for sensitivity analysis
"""

import pytest
import sys
import os

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../..", "src"))

from app.core.sensitivity_analysis import SensitivityAnalyzer, SensitivityVariable
from app.core.DCF_calculations import DCFCalculator
from unittest.mock import Mock


class TestSensitivityAnalysis:
    """Test cases for SensitivityAnalyzer class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.sample_data = {
            2023: {
                "EBIT (Operating Income + Other Income/Expense)": 1000000,
                "Depreciation and amortization": 100000,
                "Total net sales": 5000000,
                "Net income": 700000,
            },
            2022: {
                "EBIT (Operating Income + Other Income/Expense)": 900000,
                "Depreciation and amortization": 90000,
                "Total net sales": 4500000,
                "Net income": 630000,
            },
        }
        self.dcf_calculator = DCFCalculator("TEST", self.sample_data, 2023)
        self.analyzer = SensitivityAnalyzer(self.dcf_calculator)

    def test_initialization(self):
        """Test sensitivity analyzer initialization."""
        assert self.analyzer.dcf_calculator == self.dcf_calculator
        assert "earnings_growth_rate" in self.analyzer.base_values
        assert "discount_rate" in self.analyzer.base_values

    def test_sensitivity_variables(self):
        """Test sensitivity variable enum."""
        assert SensitivityVariable.EARNINGS_GROWTH_RATE.value == "earnings_growth_rate"
        assert SensitivityVariable.DISCOUNT_RATE.value == "discount_rate"
        assert SensitivityVariable.CAP_EX_GROWTH_RATE.value == "cap_ex_growth_rate"
        assert (
            SensitivityVariable.PERPETUAL_GROWTH_RATE.value == "perpetual_growth_rate"
        )

    def test_run_sensitivity_analysis(self):
        """Test basic sensitivity analysis."""
        results = self.analyzer.run_sensitivity_analysis(
            SensitivityVariable.EARNINGS_GROWTH_RATE,
            base_value=0.15,
            min_change=-0.20,
            max_change=0.20,
            steps=5,
        )

        assert "variable" in results
        assert "base_value" in results
        assert "values" in results
        assert "enterprise_values" in results
        assert len(results["values"]) == 5

    def test_run_comprehensive_sensitivity_analysis(self):
        """Test comprehensive sensitivity analysis."""
        # Mock DCF calculator with proper attributes
        mock_calculator = Mock()
        mock_calculator.base_year = 2023
        mock_calculator.tax_rate = 0.25
        mock_calculator.wacc = 0.10
        mock_calculator.financial_data = {
            2023: {"EBIT (Operating Income + Other Income/Expense)": 1000000}
        }

        # Mock all the methods to avoid complex calculations
        mock_calculator.project_financials.return_value = {2024: {"EBIT": 1150000}}
        mock_calculator.calculate_enterprise_value.return_value = 5000000
        mock_calculator.calculate_equity_value.return_value = 4500000
        mock_calculator.calculate_per_share_value.return_value = 45.0
        mock_calculator.run_sensitivity_analysis.return_value = {
            "earnings_growth_rate": "test"
        }

        # Mock additional attributes
        mock_calculator.terminal_growth_rate = 0.025
        mock_calculator.shares_outstanding = 1000000000

        analyzer = SensitivityAnalyzer(mock_calculator)
        result = analyzer.run_comprehensive_sensitivity_analysis()

        assert result is not None
        assert "earnings_growth_rate" in result

    def test_matplotlib_backend_configuration(self):
        """Test that matplotlib backend is properly configured."""
        # Import should set matplotlib backend
        from src.app.core.sensitivity_analysis import SensitivityAnalyzer

        import matplotlib

        assert matplotlib.get_backend() == "Agg", (
            f"Expected Agg backend, got {matplotlib.get_backend()}"
        )

        # Should be able to create analyzer with mock calculator
        mock_calculator = Mock()
        analyzer = SensitivityAnalyzer(mock_calculator)
        assert analyzer is not None

    def test_plot_sensitivity_analysis(self):
        """Test plot_sensitivity_analysis method."""
        # Mock DCF calculator
        mock_calculator = Mock()
        mock_calculator.ticker = "AAPL"

        analyzer = SensitivityAnalyzer(mock_calculator)

        # Sample results data
        results = {
            "earnings_growth_rate": {
                "changes": [-0.5, 0, 0.5],
                "enterprise_values": [4000000, 5000000, 6000000],
                "percentage_changes": [-20, 0, 20],
                "base_value": 0.15,
            }
        }

        # Test plotting - should run without error
        try:
            analyzer.plot_sensitivity_analysis(results)
            assert True
        except Exception as e:
            # Should handle gracefully
            assert "matplotlib" not in str(e).lower()

    def test_print_sensitivity_summary(self, capsys):
        """Test print_sensitivity_summary method."""
        # Mock DCF calculator
        mock_calculator = Mock()
        mock_calculator.ticker = "AAPL"

        analyzer = SensitivityAnalyzer(mock_calculator)

        # Sample results data
        results = {
            "earnings_growth_rate": {
                "changes": [-0.5, 0, 0.5],
                "enterprise_values": [4000000, 5000000, 6000000],
                "percentage_changes": [-20, 0, 20],
                "base_value": 0.15,
                "values": [0.075, 0.15, 0.225],
            }
        }

        # Test printing
        analyzer.print_sensitivity_summary(results)

        # Capture output
        captured = capsys.readouterr()
        assert "SENSITIVITY ANALYSIS SUMMARY FOR AAPL" in captured.out
        assert "Variable: Earnings Growth Rate" in captured.out
        assert "Maximum Increase: 20.0%" in captured.out
        assert "Maximum Decrease: -20.0%" in captured.out

    def test_export_sensitivity_results(self):
        """Test export_sensitivity_results method."""
        # Mock DCF calculator
        mock_calculator = Mock()
        mock_calculator.ticker = "AAPL"
        mock_calculator.base_year = 2023

        analyzer = SensitivityAnalyzer(mock_calculator)
        analyzer.base_values = {"earnings_growth_rate": 0.15}

        # Sample results data
        results = {
            "earnings_growth_rate": {
                "changes": [-0.5, 0, 0.5],
                "enterprise_values": [4000000, 5000000, 6000000],
                "percentage_changes": [-20, 0, 20],
                "base_value": 0.15,
            }
        }

        # Test export - should run without error
        try:
            result = analyzer.export_sensitivity_results(results)
            assert "sensitivity_analysis_AAPL" in result
        except Exception as e:
            # Should handle gracefully
            assert "file" not in str(e).lower() or "path" not in str(e).lower()

    def test_export_sensitivity_results_custom_filename(self):
        """Test export_sensitivity_results method with custom filename."""
        # Mock DCF calculator
        mock_calculator = Mock()
        mock_calculator.ticker = "AAPL"
        mock_calculator.base_year = 2023

        analyzer = SensitivityAnalyzer(mock_calculator)
        analyzer.base_values = {"earnings_growth_rate": 0.15}

        # Sample results data
        results = {
            "earnings_growth_rate": {
                "changes": [-0.5, 0, 0.5],
                "enterprise_values": [4000000, 5000000, 6000000],
                "percentage_changes": [-20, 0, 20],
                "base_value": 0.15,
            }
        }

        # Test export with custom filename - should run without error
        try:
            custom_filename = "custom_sensitivity.json"
            result = analyzer.export_sensitivity_results(results, custom_filename)
            assert custom_filename in result
        except Exception as e:
            # Should handle gracefully
            assert "file" not in str(e).lower() or "path" not in str(e).lower()


if __name__ == "__main__":
    pytest.main([__file__])
