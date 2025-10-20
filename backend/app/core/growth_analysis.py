"""
Growth Analysis - Pure calculation functions for growth rates and trends

This module contains pure business logic for calculating:
- CAGR (Compound Annual Growth Rate)
- YoY (Year-over-Year) growth
- Growth volatility (standard deviation)
- Revenue growth categorization
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class GrowthAnalysis:
    """Pure calculation functions for growth analysis (no I/O)."""

    @staticmethod
    def calculate_growth_rates(
        historical_data: Dict[int, float], metric_name: str
    ) -> Dict[str, Any]:
        """
        Calculate growth rates from historical data.

        Args:
            historical_data: Dictionary of year -> value
            metric_name: Name of the metric being analyzed

        Returns:
            Dictionary of growth calculations including CAGR, YoY growth, volatility
        """
        try:
            if not historical_data or len(historical_data) < 2:
                return {"error": "Insufficient data for growth analysis"}

            # Sort years
            years = sorted(historical_data.keys())
            values = [historical_data[year] for year in years]

            # Calculate basic growth metrics
            growth_analysis = {
                "metric_name": metric_name,
                "years_analyzed": len(years),
                "start_year": years[0],
                "end_year": years[-1],
                "start_value": values[0],
                "end_value": values[-1],
            }

            # Calculate 1-year growth
            if len(values) >= 2:
                one_year_growth = (
                    ((values[-1] - values[-2]) / values[-2]) * 100 if values[-2] != 0 else 0
                )
                growth_analysis["one_year_growth"] = round(one_year_growth, 2)

            # Calculate CAGR
            if len(values) >= 2 and values[0] != 0:
                periods = len(values) - 1
                cagr = ((values[-1] / values[0]) ** (1 / periods) - 1) * 100
                growth_analysis["cagr"] = round(cagr, 2)

            # Calculate year-over-year growth rates
            yoy_growth = []
            for i in range(1, len(values)):
                if values[i - 1] != 0:
                    growth = ((values[i] - values[i - 1]) / values[i - 1]) * 100
                    yoy_growth.append(growth)

            if yoy_growth:
                growth_analysis["average_yoy_growth"] = round(sum(yoy_growth) / len(yoy_growth), 2)
                growth_analysis["growth_volatility"] = round(
                    GrowthAnalysis._calculate_std_dev(yoy_growth), 2
                )

            return growth_analysis

        except Exception as e:
            logger.error(f"Error calculating growth rates: {e}")
            return {"error": str(e)}

    @staticmethod
    def analyze_revenue_growth(ticker: str, revenue_data: Dict[int, float]) -> Dict[str, Any]:
        """
        Analyze revenue growth for a company with categorization.

        Args:
            ticker: Company ticker symbol
            revenue_data: Historical revenue data by year

        Returns:
            Revenue growth analysis with growth category (High/Moderate/Slow/Declining)
        """
        try:
            growth_analysis = GrowthAnalysis.calculate_growth_rates(revenue_data, "Revenue")
            growth_analysis["ticker"] = ticker

            # Add revenue-specific insights
            if "cagr" in growth_analysis:
                cagr = growth_analysis["cagr"]
                if cagr > 20:
                    growth_analysis["growth_category"] = "High Growth"
                elif cagr > 10:
                    growth_analysis["growth_category"] = "Moderate Growth"
                elif cagr > 0:
                    growth_analysis["growth_category"] = "Slow Growth"
                else:
                    growth_analysis["growth_category"] = "Declining"

            return growth_analysis

        except Exception as e:
            logger.error(f"Error analyzing revenue growth for {ticker}: {e}")
            return {"ticker": ticker, "error": str(e)}

    @staticmethod
    def _calculate_std_dev(values: List[float]) -> float:
        """
        Calculate standard deviation of a list of values.

        Args:
            values: List of numeric values

        Returns:
            Standard deviation
        """
        if len(values) < 2:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance**0.5
