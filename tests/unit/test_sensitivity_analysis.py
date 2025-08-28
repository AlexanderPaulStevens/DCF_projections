"""
Unit tests for sensitivity analysis
"""

import pytest
import sys
import os

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../..", "src"))

from app.features.sensitivity_analysis import SensitivityAnalyzer, SensitivityVariable
from app.features.DCF_calculations import DCFCalculator


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
        results = self.analyzer.run_comprehensive_sensitivity_analysis(steps=5)

        assert "earnings_growth_rate" in results
        assert "discount_rate" in results
        assert "cap_ex_growth_rate" in results
        assert "perpetual_growth_rate" in results


if __name__ == "__main__":
    pytest.main([__file__])
