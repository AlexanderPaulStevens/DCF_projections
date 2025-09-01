#!/usr/bin/env python3
"""
Integration tests for Portfolio functionality.
"""

import pytest
from unittest.mock import patch
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from app.services.portfolio_service import PortfolioService
from app.services.dcf_service import DCFService


class TestPortfolioIntegration:
    """Integration tests for portfolio functionality."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.dcf_service = DCFService()
        self.portfolio_service = PortfolioService(self.dcf_service)

    @patch("numpy.random.normal")
    def test_full_portfolio_workflow(self, mock_normal):
        """Test the complete portfolio workflow from creation to analysis."""
        # Mock numpy.random.normal to return predictable values
        mock_normal.return_value = 0.0

        # Step 1: Create portfolio
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}, {"ticker": "GOOGL"}]
        weights = [0.4, 0.35, 0.25]
        total_investment = 10000

        portfolio_config = self.portfolio_service.create_portfolio(
            companies=companies, weights=weights, initial_investment=total_investment
        )

        # Verify portfolio creation
        assert portfolio_config["initial_investment"] == total_investment
        assert len(portfolio_config["companies"]) == 3
        assert portfolio_config["weights"] == weights

        # Step 2: Get portfolio summary
        summary = self.portfolio_service.get_portfolio_summary()
        assert summary["num_companies"] == 3
        assert summary["total_investment"] == total_investment

        # Verify individual company investments
        for i, company in enumerate(companies):
            company_summary = next(
                c for c in summary["companies"] if c["ticker"] == company["ticker"]
            )
            expected_investment = total_investment * weights[i]
            assert company_summary["investment"] == expected_investment
            assert company_summary["weight"] == weights[i]

        # Step 3: Run portfolio analysis
        earnings_growth_rates = {
            "AAPL": 0.15,  # 15% growth for Apple
            "NVDA": 0.25,  # 25% growth for NVIDIA
            "GOOGL": 0.12,  # 12% growth for Google
        }

        results = self.portfolio_service.project_portfolio_growth(
            projection_years=10,
            earnings_growth_rates=earnings_growth_rates,
            wacc=0.10,
            terminal_growth=0.02,
        )

        # Verify analysis results
        assert results is not None
        assert "portfolio_projections" in results
        assert "portfolio_metrics" in results
        assert "total_portfolio_value" in results
        assert results["projection_years"] == 10

        # Verify individual company projections
        for ticker in ["AAPL", "NVDA", "GOOGL"]:
            assert ticker in results["portfolio_projections"]
            company_data = results["portfolio_projections"][ticker]

            # Check required fields
            required_fields = [
                "initial_value",
                "final_value",
                "terminal_value",
                "total_value",
                "growth_rate",
            ]
            for field in required_fields:
                assert field in company_data

            # Check that values make sense
            assert company_data["initial_value"] > 0
            assert company_data["final_value"] > company_data["initial_value"]
            assert company_data["terminal_value"] > 0
            assert company_data["total_value"] > company_data["final_value"]

        # Verify portfolio metrics
        metrics = results["portfolio_metrics"]
        assert metrics["initial_investment"] == total_investment
        assert metrics["final_value"] > total_investment
        assert metrics["total_return"] > 0
        assert "portfolio_weights" in metrics
        assert "volatility" in metrics
        assert "sharpe_ratio" in metrics

        # Verify portfolio weights sum to 1.0
        total_weight = sum(metrics["portfolio_weights"].values())
        assert abs(total_weight - 1.0) < 0.01

    def test_portfolio_with_equal_weights(self):
        """Test portfolio creation and analysis with equal weights."""
        companies = [{"ticker": "MSFT"}, {"ticker": "TSLA"}]
        total_investment = 5000

        # Create portfolio without specifying weights (should default to equal)
        portfolio_config = self.portfolio_service.create_portfolio(
            companies=companies, initial_investment=total_investment
        )

        # Verify equal weights
        expected_weights = [0.5, 0.5]
        assert portfolio_config["weights"] == expected_weights

        # Verify equal investments
        for i, company in enumerate(companies):
            expected_investment = total_investment * expected_weights[i]
            assert company["investment"] == expected_investment

        # Run analysis
        with patch("numpy.random.normal", return_value=0.0):
            results = self.portfolio_service.project_portfolio_growth(
                projection_years=5,
                earnings_growth_rates={"MSFT": 0.18, "TSLA": 0.22},
                wacc=0.12,
                terminal_growth=0.03,
            )

        assert results is not None
        assert len(results["portfolio_projections"]) == 2

    def test_portfolio_error_handling(self):
        """Test portfolio error handling scenarios."""
        # Test with invalid company data
        with pytest.raises(ValueError):
            self.portfolio_service.create_portfolio(companies=[])

        # Test with mismatched weights
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        with pytest.raises(ValueError):
            self.portfolio_service.create_portfolio(
                companies=companies,
                weights=[0.6, 0.3],  # Sum < 1.0
            )

        # Test portfolio analysis without creating portfolio first
        with pytest.raises(ValueError):
            self.portfolio_service.project_portfolio_growth()

    def test_portfolio_summary_edge_cases(self):
        """Test portfolio summary edge cases."""
        # Test summary before portfolio creation
        summary = self.portfolio_service.get_portfolio_summary()
        assert summary == {}

        # Test summary after portfolio creation
        companies = [{"ticker": "AAPL"}]
        self.portfolio_service.create_portfolio(
            companies=companies, weights=[1.0], initial_investment=1000
        )

        summary = self.portfolio_service.get_portfolio_summary()
        assert summary["num_companies"] == 1
        assert summary["total_investment"] == 1000
        assert len(summary["companies"]) == 1
        assert summary["companies"][0]["ticker"] == "AAPL"
        assert summary["companies"][0]["weight"] == 1.0
        assert summary["companies"][0]["investment"] == 1000
