#!/usr/bin/env python3
"""
Unit tests for Portfolio Service functionality.
"""

import pytest
from unittest.mock import Mock, patch
from src.app.services.portfolio_service import PortfolioService
from src.app.services.dcf_service import DCFService


class TestPortfolioService:
    """Test cases for PortfolioService class."""

    def setup_method(self):
        """Set up test fixtures before each test method."""
        self.mock_dcf_service = Mock(spec=DCFService)
        self.portfolio_service = PortfolioService(self.mock_dcf_service)

    def test_init(self):
        """Test PortfolioService initialization."""
        assert self.portfolio_service.dcf_service == self.mock_dcf_service
        assert self.portfolio_service.portfolio_data == {}
        assert self.portfolio_service.portfolio_weights == {}
        assert self.portfolio_service.initial_investment == 0

    def test_create_portfolio_success(self):
        """Test successful portfolio creation."""
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}, {"ticker": "GOOGL"}]
        weights = [0.4, 0.3, 0.3]
        initial_investment = 10000

        result = self.portfolio_service.create_portfolio(
            companies=companies, weights=weights, initial_investment=initial_investment
        )

        assert result["companies"] == companies
        assert result["weights"] == weights
        assert result["initial_investment"] == initial_investment
        assert "created_at" in result

        # Check individual company data
        for i, company in enumerate(companies):
            assert company["weight"] == weights[i]
            assert company["investment"] == initial_investment * weights[i]

    def test_create_portfolio_equal_weights(self):
        """Test portfolio creation with equal weights."""
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        initial_investment = 1000

        result = self.portfolio_service.create_portfolio(
            companies=companies, initial_investment=initial_investment
        )

        expected_weights = [0.5, 0.5]
        assert result["weights"] == expected_weights
        assert result["initial_investment"] == initial_investment

    def test_create_portfolio_validation_errors(self):
        """Test portfolio creation validation errors."""
        # Empty companies list
        with pytest.raises(ValueError, match="At least one company must be specified"):
            self.portfolio_service.create_portfolio(companies=[])

        # Mismatched weights
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        weights = [0.6, 0.3]  # Sum < 1.0

        with pytest.raises(ValueError, match="Weights must sum to 1.0"):
            self.portfolio_service.create_portfolio(
                companies=companies, weights=weights
            )

        # Wrong number of weights
        weights = [0.5, 0.3, 0.2]  # 3 weights for 2 companies

        with pytest.raises(
            ValueError, match="Number of weights must match number of companies"
        ):
            self.portfolio_service.create_portfolio(
                companies=companies, weights=weights
            )

    @patch("numpy.random.normal")
    def test_project_portfolio_growth_success(self, mock_normal):
        """Test successful portfolio growth projection."""
        # Mock numpy.random.normal to return predictable values
        mock_normal.return_value = 0.0

        # Create portfolio first
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        self.portfolio_service.create_portfolio(
            companies=companies, weights=[0.5, 0.5], initial_investment=1000
        )

        # Test growth projection
        earnings_growth_rates = {"AAPL": 0.15, "NVDA": 0.25}
        result = self.portfolio_service.project_portfolio_growth(
            projection_years=5,
            earnings_growth_rates=earnings_growth_rates,
            wacc=0.10,
            terminal_growth=0.02,
        )

        assert result is not None
        assert "portfolio_projections" in result
        assert "portfolio_metrics" in result
        assert "total_portfolio_value" in result
        assert result["projection_years"] == 5

        # Check individual company projections
        for ticker in ["AAPL", "NVDA"]:
            assert ticker in result["portfolio_projections"]
            company_data = result["portfolio_projections"][ticker]
            assert "initial_value" in company_data
            assert "final_value" in company_data
            assert "terminal_value" in company_data
            assert "total_value" in company_data

    def test_project_portfolio_growth_no_portfolio(self):
        """Test portfolio growth projection without creating portfolio first."""
        with pytest.raises(
            ValueError, match="Portfolio not created. Call create_portfolio first."
        ):
            self.portfolio_service.project_portfolio_growth()

    def test_get_portfolio_summary(self):
        """Test getting portfolio summary."""
        # No portfolio created
        summary = self.portfolio_service.get_portfolio_summary()
        assert summary == {}

        # Create portfolio and get summary
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        self.portfolio_service.create_portfolio(
            companies=companies, weights=[0.6, 0.4], initial_investment=1000
        )

        summary = self.portfolio_service.get_portfolio_summary()
        assert summary["num_companies"] == 2
        assert summary["total_investment"] == 1000
        assert len(summary["companies"]) == 2
        assert "created_at" in summary

        # Check company details
        aapl_company = next(c for c in summary["companies"] if c["ticker"] == "AAPL")
        assert aapl_company["weight"] == 0.6
        assert aapl_company["investment"] == 600

    def test_calculate_portfolio_metrics(self):
        """Test portfolio metrics calculation."""
        # Create portfolio
        companies = [{"ticker": "AAPL"}, {"ticker": "NVDA"}]
        self.portfolio_service.create_portfolio(
            companies=companies, weights=[0.5, 0.5], initial_investment=1000
        )

        # Mock company values
        company_values = {
            "AAPL": {"total_value": 1200, "yearly_growth": [0.1, 0.15, 0.12]},
            "NVDA": {"total_value": 1800, "yearly_growth": [0.2, 0.25, 0.18]},
        }
        total_portfolio_value = 3000

        # Test metrics calculation
        metrics = self.portfolio_service._calculate_portfolio_metrics(
            company_values, total_portfolio_value
        )

        assert metrics["initial_investment"] == 1000
        assert metrics["final_value"] == 3000
        assert metrics["total_return"] == 2.0  # (3000-1000)/1000
        assert "portfolio_weights" in metrics
        assert "volatility" in metrics
        assert "sharpe_ratio" in metrics

        # Check portfolio weights
        expected_weights = {"AAPL": 0.4, "NVDA": 0.6}  # 1200/3000, 1800/3000
        assert metrics["portfolio_weights"] == expected_weights

    def test_project_company_value(self):
        """Test individual company value projection."""
        company = {"ticker": "AAPL", "investment": 1000}
        growth_rate = 0.15
        years = 3
        wacc = 0.10
        terminal_growth = 0.02

        with patch("numpy.random.normal", return_value=0.0):
            result = self.portfolio_service._project_company_value(
                company, growth_rate, years, wacc, terminal_growth
            )

        assert result["ticker"] == "AAPL"
        assert result["initial_value"] == 1000
        assert result["growth_rate"] == 0.15
        assert len(result["yearly_values"]) == 3
        assert len(result["yearly_growth"]) == 3
        assert len(result["cumulative_return"]) == 3
        assert "final_value" in result
        assert "terminal_value" in result
        assert "total_value" in result

        # Check that values are growing
        assert result["final_value"] > result["initial_value"]
        assert result["total_value"] > result["final_value"]
