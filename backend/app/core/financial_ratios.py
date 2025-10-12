"""
Financial Ratios Calculator - Core business logic for calculating financial ratios.

This module contains the core business logic for calculating various financial ratios
from raw financial data. It follows the principle that all business logic belongs in
the core layer, not in services.
"""

import logging
from enum import Enum
from typing import Any, Dict

logger = logging.getLogger(__name__)


class RatioEvaluation(Enum):
    """Enum for ratio evaluation levels."""

    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    UNKNOWN = "unknown"


class RatioEvaluationData:
    """Data class for ratio evaluation results."""

    def __init__(self, value: float, evaluation: RatioEvaluation, color: str, icon: str):
        self.value = value
        self.evaluation = evaluation
        self.color = color
        self.icon = icon


class FinancialRatiosCalculator:
    """
    Core business logic for calculating financial ratios from raw data.

    This class contains all the calculation logic and business rules for
    computing various financial ratios used in investment analysis.
    """

    def __init__(self):
        """Initialize the financial ratios calculator."""

    def calculate_ratios(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive financial ratios from raw financial data.

        Args:
            raw_data: Raw financial data containing metrics like price, earnings, etc.

        Returns:
            Dictionary of calculated financial ratios organized by category
        """
        try:
            # Extract financial metrics
            financial_metrics = self._extract_financial_metrics(raw_data)

            # Calculate ratios by category
            ratios = {}

            profitability = self._calculate_profitability_ratios(financial_metrics)
            if profitability:
                ratios["profitability"] = profitability

            leverage = self._calculate_leverage_ratios(financial_metrics)
            if leverage:
                ratios["leverage"] = leverage

            efficiency = self._calculate_efficiency_ratios(financial_metrics)
            if efficiency:
                ratios["efficiency"] = efficiency

            valuation = self._calculate_valuation_ratios(financial_metrics)
            if valuation:
                ratios["valuation"] = valuation

            return ratios

        except (ValueError, KeyError, TypeError, ZeroDivisionError) as e:
            logger.error(f"Error calculating financial ratios: {e!s}")
            return {}

    def _extract_financial_metrics(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract and validate financial metrics from raw data.

        Args:
            raw_data: Raw financial data

        Returns:
            Dictionary of validated financial metrics
        """
        metrics = {
            "current_price": raw_data.get("current_price", 0),
            "eps": raw_data.get("eps", 0),
            "book_value": raw_data.get("book_value", 0),
            "earnings_growth": raw_data.get("earnings_growth", 0),
            "free_cashflow": raw_data.get("free_cashflow", 0),
            "shares_outstanding": raw_data.get("shares_outstanding", 0),
            "market_cap": raw_data.get("market_cap", 0),
            "total_debt": raw_data.get("total_debt", 0),
            "total_cash": raw_data.get("total_cash", 0),
            "revenue": raw_data.get("revenue", 0),
            "net_income": raw_data.get("net_income", 0),
        }

        # Calculate derived metrics
        metrics["equity"] = self._calculate_equity(metrics)

        return metrics

    def _calculate_equity(self, metrics: Dict[str, Any]) -> float:
        """
        Calculate shareholders' equity from available metrics.

        Args:
            metrics: Financial metrics dictionary

        Returns:
            Calculated equity value
        """
        market_cap = metrics.get("market_cap", 0)
        total_debt = metrics.get("total_debt", 0)
        total_cash = metrics.get("total_cash", 0)

        if market_cap and total_debt and total_cash:
            return market_cap - total_debt + total_cash
        return 0

    def _calculate_profitability_ratios(self, metrics: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate profitability ratios - measures of company's ability to generate profits.

        Args:
            metrics: Financial metrics dictionary

        Returns:
            Dictionary of profitability ratios
        """
        profitability = {}

        net_income = metrics.get("net_income", 0)
        equity = metrics.get("equity", 0)
        market_cap = metrics.get("market_cap", 0)
        revenue = metrics.get("revenue", 0)
        earnings_growth = metrics.get("earnings_growth", 0)
        free_cashflow = metrics.get("free_cashflow", 0)
        total_debt = metrics.get("total_debt", 0)
        total_cash = metrics.get("total_cash", 0)

        # ROE: Return on Equity = Net Income / Shareholders' Equity
        if net_income and equity and equity != 0:
            profitability["ROE"] = net_income / equity

        # ROA: Return on Assets = Net Income / Total Assets (using market cap as proxy)
        if net_income and market_cap and market_cap != 0:
            profitability["ROA"] = net_income / market_cap

        # ROIC: Return on Invested Capital = Net Income / Invested Capital
        if net_income and market_cap and market_cap != 0:
            if total_debt and total_debt > 0:
                # Invested Capital = Total Debt + Total Equity - Cash
                invested_capital = (
                    total_debt + equity - total_cash if total_cash else total_debt + equity
                )
                profitability["ROIC"] = (
                    net_income / invested_capital if invested_capital != 0 else 0
                )
            else:
                # No debt company - ROIC ≈ ROA for debt-free companies
                profitability["ROIC"] = net_income / market_cap

        # Operating Margin = Operating Income / Revenue (using net income as proxy)
        if net_income and revenue and revenue != 0:
            profitability["operating_margin"] = net_income / revenue

        # Net Margin = Net Income / Revenue
        if net_income and revenue and revenue != 0:
            profitability["net_margin"] = net_income / revenue

        # Revenue Growth (EBIT) - using earnings growth as proxy for EBIT growth
        if earnings_growth:
            profitability["revenue_growth_ebit"] = earnings_growth

        # Operating Income Growth - using earnings growth as proxy
        if earnings_growth:
            profitability["operating_income_growth"] = earnings_growth

        # Earnings Quality Ratio = Free Cash Flow / Net Income
        if free_cashflow and net_income and net_income != 0:
            profitability["earnings_quality_ratio"] = free_cashflow / net_income

        return profitability

    def _calculate_leverage_ratios(self, metrics: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate leverage ratios - measures of company's debt levels and financial risk.

        Args:
            metrics: Financial metrics dictionary

        Returns:
            Dictionary of leverage ratios
        """
        leverage = {}

        total_debt = metrics.get("total_debt", 0)
        equity = metrics.get("equity", 0)
        market_cap = metrics.get("market_cap", 0)
        free_cashflow = metrics.get("free_cashflow", 0)
        net_income = metrics.get("net_income", 0)

        # Debt-to-Equity = Total Debt / Shareholders' Equity
        if total_debt and equity and equity != 0:
            leverage["debt_to_equity"] = total_debt / equity

        # Debt-to-Assets = Total Debt / Total Assets (using market cap as proxy)
        if total_debt and market_cap and market_cap != 0:
            leverage["debt_to_assets"] = total_debt / market_cap

        # Debt to Free Cash Ratio = Total Debt / Free Cash Flow
        if total_debt and free_cashflow and free_cashflow != 0:
            leverage["debt_to_free_cash_ratio"] = total_debt / free_cashflow

        # Interest Coverage Ratio = EBIT / Interest Expense
        # Using net income as proxy for EBIT, and estimating interest expense from debt
        if net_income and total_debt and total_debt > 0:
            # Estimate interest expense as 5% of total debt (typical corporate rate)
            estimated_interest_expense = total_debt * 0.05
            if estimated_interest_expense != 0:
                leverage["interest_coverage_ratio"] = net_income / estimated_interest_expense

        return leverage

    def _calculate_efficiency_ratios(self, metrics: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate efficiency ratios - measures of how effectively company uses its assets.

        Args:
            metrics: Financial metrics dictionary

        Returns:
            Dictionary of efficiency ratios
        """
        efficiency = {}

        revenue = metrics.get("revenue", 0)
        market_cap = metrics.get("market_cap", 0)

        # Asset Turnover = Revenue / Total Assets (using market cap as proxy)
        if revenue and market_cap and market_cap != 0:
            efficiency["asset_turnover"] = revenue / market_cap

        return efficiency

    def _calculate_valuation_ratios(self, metrics: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate valuation ratios - measures of company's market valuation
        relative to fundamentals.

        Args:
            metrics: Financial metrics dictionary

        Returns:
            Dictionary of valuation ratios
        """
        valuation = {}

        current_price = metrics.get("current_price", 0)
        eps = metrics.get("eps", 0)
        book_value = metrics.get("book_value", 0)
        market_cap = metrics.get("market_cap", 0)
        revenue = metrics.get("revenue", 0)
        earnings_growth = metrics.get("earnings_growth", 0)

        # P/E Ratio = Stock Price / Earnings Per Share
        if current_price and eps and eps != 0:
            valuation["pe_ratio"] = current_price / eps

        # P/B Ratio = Stock Price / Book Value Per Share
        if current_price and book_value and book_value != 0:
            valuation["pb_ratio"] = current_price / book_value

        # P/S Ratio = Market Cap / Revenue
        if market_cap and revenue and revenue != 0:
            valuation["ps_ratio"] = market_cap / revenue

        # PEG Ratio = P/E Ratio / Earnings Growth Rate
        if current_price and eps and earnings_growth and eps != 0 and earnings_growth != 0:
            valuation["peg_ratio"] = (current_price / eps) / earnings_growth

        return valuation

    def evaluate_ratio(self, value: float, metric_name: str) -> RatioEvaluationData:
        """
        Evaluate a financial ratio and determine if it's good, fair, or poor.

        Args:
            value: The ratio value to evaluate
            metric_name: The name of the metric being evaluated

        Returns:
            RatioEvaluationData with evaluation results
        """
        evaluation = self._get_ratio_evaluation(value, metric_name)
        color = self._get_ratio_color(evaluation)
        icon = self._get_ratio_icon(evaluation)

        return RatioEvaluationData(value, evaluation, color, icon)

    def _get_ratio_evaluation(  # noqa: PLR0911
        self, value: float, metric_name: str
    ) -> RatioEvaluation:
        """
        Determine the evaluation level for a financial ratio based on specific criteria.
        Green (GOOD) if meets criteria, Red (POOR) otherwise.

        Args:
            value: The ratio value
            metric_name: The name of the metric

        Returns:
            RatioEvaluation enum value
        """
        metric_lower = metric_name.lower()

        # Revenue growth > 5%
        if "revenue_growth" in metric_lower:
            return RatioEvaluation.GOOD if value > 0.05 else RatioEvaluation.POOR

        # Operating income growth > 7%
        if "operating_income_growth" in metric_lower:
            return RatioEvaluation.GOOD if value > 0.07 else RatioEvaluation.POOR

        # Earnings quality ratio (FCF/net income) > 80%
        if "earnings_quality" in metric_lower:
            return RatioEvaluation.GOOD if value > 0.80 else RatioEvaluation.POOR

        # ROIC > 15%
        if "roic" in metric_lower:
            return RatioEvaluation.GOOD if value > 0.15 else RatioEvaluation.POOR

        # Debt to free cash ratio < 5%
        if "debt_to_free_cash" in metric_lower:
            return RatioEvaluation.GOOD if value < 5.0 else RatioEvaluation.POOR

        # Interest coverage ratio > 5%
        if "interest_coverage" in metric_lower:
            return RatioEvaluation.GOOD if value > 5.0 else RatioEvaluation.POOR

        # Default case - unknown evaluation
        return RatioEvaluation.UNKNOWN

    def _get_ratio_color(self, evaluation: RatioEvaluation) -> str:
        """
        Get the color code for a ratio evaluation.
        Simplified to green (success) or red (error).

        Args:
            evaluation: The ratio evaluation

        Returns:
            Color string for frontend display
        """
        color_map = {
            RatioEvaluation.GOOD: "green",  # Green
            RatioEvaluation.POOR: "red",  # Red
            RatioEvaluation.UNKNOWN: "grey",  # Gray
        }
        return color_map.get(evaluation, "default")

    def _get_ratio_icon(self, evaluation: RatioEvaluation) -> str:
        """
        Get the icon name for a ratio evaluation.
        Simplified to up arrow (good) or down arrow (poor).

        Args:
            evaluation: The ratio evaluation

        Returns:
            Icon name for frontend display
        """
        icon_map = {
            RatioEvaluation.GOOD: "trending_up",  # Up arrow for good
            RatioEvaluation.POOR: "trending_down",  # Down arrow for poor
            RatioEvaluation.UNKNOWN: "trending_flat",  # Flat for unknown
        }
        return icon_map.get(evaluation, "trending_flat")

    def calculate_ratios_with_evaluation(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate financial ratios with evaluation data included.

        Args:
            raw_data: Raw financial data containing metrics like price, earnings, etc.

        Returns:
            Dictionary of calculated financial ratios with evaluation data
        """
        try:
            # Calculate base ratios
            ratios = self.calculate_ratios(raw_data)

            # Add evaluation data to each ratio
            evaluated_ratios = {}

            for category, category_ratios in ratios.items():
                evaluated_category = {}
                for metric_name, value in category_ratios.items():
                    if value is not None:
                        evaluation_data = self.evaluate_ratio(value, metric_name)
                        evaluated_category[metric_name] = {
                            "value": value,
                            "evaluation": evaluation_data.evaluation.value,
                            "color": evaluation_data.color,
                            "icon": evaluation_data.icon,
                        }
                    else:
                        evaluated_category[metric_name] = {
                            "value": None,
                            "evaluation": RatioEvaluation.UNKNOWN.value,
                            "color": "default",
                            "icon": "trending_flat",
                        }
                evaluated_ratios[category] = evaluated_category

            return evaluated_ratios

        except (ValueError, KeyError, TypeError, ZeroDivisionError) as e:
            logger.error(f"Error calculating financial ratios with evaluation: {e!s}")
            return {}
