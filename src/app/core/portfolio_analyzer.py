"""
Portfolio Analyzer Feature - Handles portfolio analysis and calculations
"""

import pandas as pd
from typing import Dict, Any, List
from app.services.portfolio_service import PortfolioService


class PortfolioAnalyzer:
    """
    Portfolio analysis and calculation component.
    """

    def __init__(self, portfolio_service: PortfolioService):
        self.portfolio_service = portfolio_service

    def create_portfolio(
        self,
        companies: List[str],
        weights: List[float],
        total_investment: float,
        strategy: str = "Equal Weight",
    ) -> Dict[str, Any]:
        """
        Create a portfolio configuration.

        Args:
            companies: List of company tickers
            weights: List of weights (should sum to 1.0)
            total_investment: Total investment amount
            strategy: Investment strategy used

        Returns:
            Portfolio configuration
        """
        if len(companies) != len(weights):
            raise ValueError("Number of companies must match number of weights")

        if abs(sum(weights) - 1.0) > 0.001:
            raise ValueError("Weights must sum to 1.0")

        portfolio_config = {
            "companies": companies,
            "weights": weights,
            "total_investment": total_investment,
            "strategy": strategy,
            "created_at": pd.Timestamp.now().isoformat(),
        }

        return portfolio_config

    def analyze_portfolio(self, portfolio_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a portfolio and return results.

        Args:
            portfolio_config: Portfolio configuration from create_portfolio

        Returns:
            Portfolio analysis results
        """
        companies = portfolio_config["companies"]
        weights = portfolio_config["weights"]
        total_investment = portfolio_config["total_investment"]

        # Get financial data for each company
        portfolio_data = []
        total_value = 0

        for ticker, weight in zip(companies, weights):
            try:
                # Get company financial data
                company_data = self.portfolio_service.get_company_financial_data(ticker)

                if company_data:
                    investment_amount = total_investment * weight
                    company_analysis = {
                        "ticker": ticker,
                        "weight": weight,
                        "investment_amount": investment_amount,
                        "financial_data": company_data,
                    }
                    portfolio_data.append(company_analysis)
                    total_value += investment_amount

            except Exception as e:
                # Log error but continue with other companies
                print(f"Error analyzing {ticker}: {e}")
                continue

        # Calculate portfolio metrics
        portfolio_metrics = self._calculate_portfolio_metrics(
            portfolio_data, total_investment
        )

        return {
            "portfolio_config": portfolio_config,
            "portfolio_data": portfolio_data,
            "portfolio_metrics": portfolio_metrics,
            "total_companies": len(portfolio_data),
            "total_value": total_value,
            "analysis_date": pd.Timestamp.now().isoformat(),
        }

    def _calculate_portfolio_metrics(
        self, portfolio_data: List[Dict], total_investment: float
    ) -> Dict[str, Any]:
        """
        Calculate portfolio-level metrics.

        Args:
            portfolio_data: List of company analysis data
            total_investment: Total investment amount

        Returns:
            Portfolio metrics
        """
        if not portfolio_data:
            return {}

        # Calculate weighted averages
        weighted_metrics = {}

        for company in portfolio_data:
            weight = company["weight"]
            financial_data = company.get("financial_data", {})

            # Add weighted contributions to metrics
            for metric, value in financial_data.items():
                if isinstance(value, (int, float)) and not pd.isna(value):
                    if metric not in weighted_metrics:
                        weighted_metrics[metric] = 0
                    weighted_metrics[metric] += value * weight

        # Calculate portfolio diversification metrics
        weights = [company["weight"] for company in portfolio_data]
        herfindahl_index = sum(w**2 for w in weights)  # Concentration measure

        return {
            "weighted_metrics": weighted_metrics,
            "herfindahl_index": herfindahl_index,
            "diversification_score": 1 - herfindahl_index,  # Higher is more diversified
            "effective_companies": 1 / herfindahl_index if herfindahl_index > 0 else 0,
        }

    def get_portfolio_recommendations(
        self, portfolio_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get recommendations for portfolio optimization.

        Args:
            portfolio_config: Portfolio configuration

        Returns:
            Portfolio recommendations
        """
        companies = portfolio_config["companies"]
        weights = portfolio_config["weights"]

        recommendations = {
            "diversification": [],
            "risk_management": [],
            "optimization": [],
        }

        # Check diversification
        if len(companies) < 5:
            recommendations["diversification"].append(
                "Consider adding more companies for better diversification"
            )

        # Check weight concentration
        max_weight = max(weights)
        if max_weight > 0.3:
            recommendations["risk_management"].append(
                f"Highest weight is {max_weight:.1%} - consider reducing concentration"
            )

        # Check for sector diversification (basic check)
        if len(companies) >= 3:
            recommendations["optimization"].append(
                "Portfolio size is good for basic diversification"
            )

        return recommendations

    def export_portfolio_data(
        self, portfolio_analysis: Dict[str, Any], format: str = "json"
    ) -> str:
        """
        Export portfolio data in specified format.

        Args:
            portfolio_analysis: Portfolio analysis results
            format: Export format ("json", "csv")

        Returns:
            Exported data as string
        """
        if format.lower() == "json":
            return pd.io.json.dumps(portfolio_analysis, indent=2, default=str)
        elif format.lower() == "csv":
            # Convert to DataFrame and export
            df = pd.DataFrame(portfolio_analysis["portfolio_data"])
            return df.to_csv(index=False)
        else:
            raise ValueError("Unsupported format. Use 'json' or 'csv'")
