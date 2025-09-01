"""
DCF Service Layer - Orchestrates DCF calculations and analysis
"""

from typing import Dict, Any, Optional
from app.core.DCF_calculations import DCFCalculator


class DCFService:
    """
    Service layer for DCF analysis operations.
    Handles business logic and coordinates between different components.
    """

    def __init__(self):
        self.dcf_calculator = None
        self.sensitivity_analyzer = None

    def create_dcf_calculator(
        self,
        ticker: str,
        financial_data: Dict[Any, Dict[str, Any]],
        base_year: Optional[Any] = None,
    ) -> DCFCalculator:
        """
        Create and configure a DCF calculator instance.

        Args:
            ticker: Company ticker symbol
            financial_data: Historical financial data by year (can have string or int keys)
            base_year: Base year for projections (can be string or int)

        Returns:
            Configured DCFCalculator instance
        """
        # Convert string keys to integers if needed for compatibility
        if financial_data and isinstance(next(iter(financial_data.keys())), str):
            converted_financial_data = {}
            for key, value in financial_data.items():
                try:
                    converted_key = int(key)
                    converted_financial_data[converted_key] = value
                except (ValueError, TypeError):
                    # If we can't convert to int, keep the original key
                    converted_financial_data[key] = value

            # Convert base_year if it's a string
            if base_year and isinstance(base_year, str):
                try:
                    base_year = int(base_year)
                except (ValueError, TypeError):
                    pass

            financial_data = converted_financial_data

        self.dcf_calculator = DCFCalculator(ticker, financial_data, base_year)
        return self.dcf_calculator

    def run_dcf_analysis(
        self, earnings_growth_rate: float = 0.15, years: int = 5
    ) -> Dict[str, Any]:
        """
        Run complete DCF analysis.

        Args:
            earnings_growth_rate: Expected earnings growth rate
            years: Number of years to project

        Returns:
            DCF analysis results
        """
        if not self.dcf_calculator:
            raise ValueError(
                "DCF calculator not initialized. Call create_dcf_calculator first."
            )

        projections = self.dcf_calculator.project_financials(
            earnings_growth_rate=earnings_growth_rate, years=years
        )

        enterprise_value = self.dcf_calculator.calculate_enterprise_value(projections)
        equity_value = self.dcf_calculator.calculate_equity_value(enterprise_value)
        per_share_value = self.dcf_calculator.calculate_per_share_value(equity_value)

        return {
            "projections": projections,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "per_share_value": per_share_value,
            "growth_rate": earnings_growth_rate,
        }

    def run_sensitivity_analysis(self, steps: int = 11) -> Dict[str, Any]:
        """
        Run sensitivity analysis using the current DCF calculator.

        Args:
            steps: Number of steps in sensitivity analysis

        Returns:
            Sensitivity analysis results
        """
        if not self.dcf_calculator:
            raise ValueError(
                "DCF calculator not initialized. Call create_dcf_calculator first."
            )

        return self.dcf_calculator.run_sensitivity_analysis(steps=steps)
