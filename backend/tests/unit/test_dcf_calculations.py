"""
Unit tests for DCF calculations
"""

import os
import sys

import pytest

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../..", "backend"))

from app.core.DCF_calculations import DCFCalculator


class TestDCFCalculator:
    """Test cases for DCFCalculator class."""

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
        self.calculator = DCFCalculator("TEST", self.sample_data, 2023)

    def test_initialization(self):
        """Test DCF calculator initialization."""
        assert self.calculator.ticker == "TEST"
        assert self.calculator.base_year == 2023
        assert self.calculator.financial_data == self.sample_data

    def test_get_historical_metrics(self):
        """Test historical metrics retrieval."""
        historical = self.calculator.get_historical_metrics(years_back=2)
        assert len(historical) == 2
        assert 2023 in historical
        assert 2022 in historical

    def test_calculate_growth_rates(self):
        """Test growth rate calculations."""
        growth_rates = self.calculator.calculate_growth_rates(
            "Total net sales", years_back=2
        )
        assert len(growth_rates) == 1  # One year-over-year comparison
        # (5M - 4.5M) / 4.5M = 0.5M / 4.5M = 1/9 ≈ 0.111111...
        assert growth_rates[0] == pytest.approx(1 / 9, rel=1e-10)

    def test_project_financials(self):
        """Test financial projections."""
        projections = self.calculator.project_financials(
            earnings_growth_rate=0.10, years=3
        )
        assert len(projections) == 3
        assert 2024 in projections
        assert 2025 in projections
        assert 2026 in projections

    def test_calculate_enterprise_value(self):
        """Test enterprise value calculation."""
        projections = self.calculator.project_financials(
            earnings_growth_rate=0.10, years=3
        )
        enterprise_value = self.calculator.calculate_enterprise_value(projections)
        assert enterprise_value > 0
        assert isinstance(enterprise_value, (int, float))

    def test_calculate_equity_value(self):
        """Test equity value calculation."""
        enterprise_value = 1000000
        equity_value = self.calculator.calculate_equity_value(enterprise_value)
        assert equity_value < enterprise_value  # Should be less due to net debt
        assert equity_value > 0

    def test_calculate_per_share_value(self):
        """Test per share value calculation."""
        equity_value = 1000000
        per_share_value = self.calculator.calculate_per_share_value(equity_value)
        assert per_share_value > 0
        assert isinstance(per_share_value, (int, float))

    def test_calculate_dcf_scenarios(self):
        """Test running multiple growth scenarios."""
        scenarios = self.calculator.calculate_dcf_scenarios(
            base_growth=0.10, step_size=0.10, steps=2
        )

        assert len(scenarios) == 3  # base + 2 steps
        assert "Scenario_1_Growth_10.0%" in scenarios
        assert "Scenario_2_Growth_20.0%" in scenarios
        assert "Scenario_3_Growth_30.0%" in scenarios

        # Check scenario structure
        for scenario_name, scenario_data in scenarios.items():
            assert "growth_rate" in scenario_data
            assert "projections" in scenario_data
            assert "enterprise_value" in scenario_data
            assert "equity_value" in scenario_data
            assert "per_share_value" in scenario_data

    def test_calculate_enterprise_value_edge_cases(self):
        """Test enterprise value calculation edge cases."""
        # Test with very close WACC and growth rate
        self.calculator.wacc = 0.025
        self.calculator.terminal_growth_rate = 0.025

        projections = self.calculator.project_financials(
            earnings_growth_rate=0.10, years=3
        )
        enterprise_value = self.calculator.calculate_enterprise_value(projections)

        assert enterprise_value > 0
        assert isinstance(enterprise_value, (int, float))

    def test_print_dcf_summary(self):
        """Test DCF summary printing."""
        projections = self.calculator.project_financials(
            earnings_growth_rate=0.10, years=3
        )
        enterprise_value = self.calculator.calculate_enterprise_value(projections)
        equity_value = self.calculator.calculate_equity_value(enterprise_value)
        per_share_value = self.calculator.calculate_per_share_value(equity_value)

        scenario_data = {
            "projections": projections,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "per_share_value": per_share_value,
            "growth_rate": 0.10,
        }

        # This should not raise an error
        self.calculator.print_dcf_summary("Test Scenario", scenario_data)


if __name__ == "__main__":
    pytest.main([__file__])
