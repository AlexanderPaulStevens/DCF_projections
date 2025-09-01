"""
Portfolio Service Layer - Handles portfolio analysis and projections
"""

from typing import Dict, Any, List, Optional
import numpy as np
from datetime import datetime


class PortfolioService:
    """
    Service layer for portfolio analysis operations.
    Handles portfolio construction, growth projections, and risk analysis.
    """

    def __init__(self, dcf_service):
        self.dcf_service = dcf_service
        self.portfolio_data = {}
        self.portfolio_weights = {}
        self.initial_investment = 0

    def create_portfolio(
        self,
        companies: List[Dict[str, Any]],
        weights: Optional[List[float]] = None,
        initial_investment: float = 1000,
    ) -> Dict[str, Any]:
        """
        Create a portfolio with specified companies and weights.

        Args:
            companies: List of company dictionaries with ticker and investment amount
            weights: Optional list of weights (if not provided, equal weight is assumed)
            initial_investment: Total initial investment amount

        Returns:
            Portfolio configuration
        """
        if not companies:
            raise ValueError("At least one company must be specified")

        # Calculate weights if not provided
        if weights is None:
            weights = [1.0 / len(companies)] * len(companies)

        # Validate weights
        if len(weights) != len(companies):
            raise ValueError("Number of weights must match number of companies")

        if abs(sum(weights) - 1.0) > 0.01:
            raise ValueError("Weights must sum to 1.0")

        # Store portfolio configuration
        self.portfolio_data = {
            "companies": companies,
            "weights": weights,
            "initial_investment": initial_investment,
            "created_at": datetime.now(),
        }

        # Calculate individual investments
        for i, company in enumerate(companies):
            company["weight"] = weights[i]
            company["investment"] = initial_investment * weights[i]

        return self.portfolio_data

    def project_portfolio_growth(
        self,
        projection_years: int = 10,
        earnings_growth_rates: Optional[Dict[str, float]] = None,
        wacc: float = 0.10,
        terminal_growth: float = 0.02,
    ) -> Dict[str, Any]:
        """
        Project portfolio growth over time using DCF analysis.

        Args:
            projection_years: Number of years to project
            earnings_growth_rates: Dictionary of company-specific growth rates
            wacc: Weighted average cost of capital
            terminal_growth: Terminal growth rate

        Returns:
            Portfolio growth projections
        """
        if not self.portfolio_data:
            raise ValueError("Portfolio not created. Call create_portfolio first.")

        portfolio_projections = {}
        total_portfolio_value = 0
        company_values = {}

        # Project growth for each company
        for company in self.portfolio_data["companies"]:
            ticker = company["ticker"]

            # Get company financial data
            try:
                # This would need to be implemented to get actual financial data
                # For now, we'll use placeholder data and growth rates
                growth_rate = (
                    earnings_growth_rates.get(ticker, 0.15)
                    if earnings_growth_rates
                    else 0.15
                )

                # Simulate company value growth
                company_value = self._project_company_value(
                    company, growth_rate, projection_years, wacc, terminal_growth
                )

                company_values[ticker] = company_value
                total_portfolio_value += company_value["total_value"]

                portfolio_projections[ticker] = company_value

            except Exception as e:
                print(f"Could not analyze {ticker}: {str(e)}")
                continue

        # Calculate portfolio metrics
        portfolio_metrics = self._calculate_portfolio_metrics(
            company_values, total_portfolio_value
        )

        return {
            "portfolio_projections": portfolio_projections,
            "portfolio_metrics": portfolio_metrics,
            "total_portfolio_value": total_portfolio_value,
            "projection_years": projection_years,
        }

    def _project_company_value(
        self,
        company: Dict[str, Any],
        growth_rate: float,
        years: int,
        wacc: float,
        terminal_growth: float,
    ) -> Dict[str, Any]:
        """
        Project individual company value over time.

        Args:
            company: Company data
            growth_rate: Expected growth rate
            years: Number of years to project
            wacc: Weighted average cost of capital
            terminal_growth: Terminal growth rate

        Returns:
            Company value projections
        """
        initial_value = company["investment"]
        ticker = company["ticker"]

        # Project value growth year by year
        yearly_values = []
        yearly_growth = []
        cumulative_return = []

        current_value = initial_value

        for year in range(1, years + 1):
            # Apply growth rate with some volatility
            annual_growth = growth_rate + np.random.normal(
                0, 0.05
            )  # Add some randomness
            annual_growth = max(annual_growth, -0.3)  # Cap losses at 30%

            new_value = current_value * (1 + annual_growth)
            yearly_values.append(new_value)
            yearly_growth.append(annual_growth)
            cumulative_return.append((new_value - initial_value) / initial_value)

            current_value = new_value

        # Calculate terminal value
        terminal_value = (
            current_value * (1 + terminal_growth) / (wacc - terminal_growth)
        )

        return {
            "ticker": ticker,
            "initial_value": initial_value,
            "yearly_values": yearly_values,
            "yearly_growth": yearly_growth,
            "cumulative_return": cumulative_return,
            "final_value": current_value,
            "terminal_value": terminal_value,
            "total_value": current_value + terminal_value,
            "growth_rate": growth_rate,
        }

    def _calculate_portfolio_metrics(
        self, company_values: Dict[str, Any], total_portfolio_value: float
    ) -> Dict[str, Any]:
        """
        Calculate portfolio-level metrics.

        Args:
            company_values: Individual company values
            total_portfolio_value: Total portfolio value

        Returns:
            Portfolio metrics
        """
        # Calculate portfolio weights
        portfolio_weights = {}
        for ticker, company_data in company_values.items():
            portfolio_weights[ticker] = (
                company_data["total_value"] / total_portfolio_value
            )

        # Calculate portfolio return
        initial_investment = self.portfolio_data["initial_investment"]
        total_return = (total_portfolio_value - initial_investment) / initial_investment

        # Calculate volatility (simplified)
        returns = []
        for company_data in company_values.values():
            returns.extend(company_data["yearly_growth"])

        volatility = np.std(returns) if returns else 0

        return {
            "portfolio_weights": portfolio_weights,
            "total_return": total_return,
            "volatility": volatility,
            "sharpe_ratio": total_return / volatility if volatility > 0 else 0,
            "initial_investment": initial_investment,
            "final_value": total_portfolio_value,
        }

    def get_portfolio_summary(self) -> Dict[str, Any]:
        """
        Get a summary of the current portfolio.

        Returns:
            Portfolio summary
        """
        if not self.portfolio_data:
            return {}

        return {
            "num_companies": len(self.portfolio_data["companies"]),
            "total_investment": self.portfolio_data["initial_investment"],
            "companies": [
                {
                    "ticker": c["ticker"],
                    "weight": c["weight"],
                    "investment": c["investment"],
                }
                for c in self.portfolio_data["companies"]
            ],
            "created_at": self.portfolio_data["created_at"],
        }
