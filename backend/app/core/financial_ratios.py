"""
Financial Ratios Core Module

This module contains the core business logic for financial ratio calculations.
All ratio calculations should be performed here to ensure consistency across the platform.
"""

import logging
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class RatioEvaluation(Enum):
    """Enum for ratio evaluation levels."""

    GOOD = "good"
    BAD = "bad"
    UNKNOWN = "unknown"


class RatioEvaluationData:
    """Data class for ratio evaluation results."""

    def __init__(self, value: float, evaluation: RatioEvaluation):
        self.value = value
        self.evaluation = evaluation


class FinancialRatiosCalculator:
    """
    Core business logic for calculating financial ratios.

    This class contains all the calculation methods for financial ratios,
    ensuring consistency and accuracy across the platform.
    """

    @staticmethod
    def calculate_all_ratios(financial_statements: Any) -> Dict[str, Any]:
        """
        Calculate all financial ratios from a FinancialStatements object.

        This is a convenience method that orchestrates all ratio calculations
        and returns them in a structured format.

        Args:
            financial_statements: FinancialStatements Pydantic model

        Returns:
            Dictionary with categorized ratios:
            {
                "profitability": {...},
                "leverage": {...},
                "efficiency": {...},
                "valuation": {...},
                "liquidity": {...}
            }
        """
        try:
            income = financial_statements.income_statement
            balance = financial_statements.balance_sheet
            cash_flow = financial_statements.cash_flow_statement
            market = financial_statements.market_data

            # Profitability ratios
            profitability = {}
            if income.net_margin is not None:
                profitability["net_margin"] = float(income.net_margin)
            if income.operating_margin is not None:
                profitability["operating_margin"] = float(income.operating_margin)
            if income.gross_margin is not None:
                profitability["gross_margin"] = float(income.gross_margin)
            if financial_statements.roe is not None:
                profitability["roe"] = float(financial_statements.roe)
            if income.net_income and balance.total_assets and balance.total_assets > 0:
                profitability["roa"] = float((income.net_income / balance.total_assets) * 100)
            if financial_statements.roic is not None:
                profitability["roic"] = float(financial_statements.roic)
            if (
                financial_statements.cash_flow_statement.free_cash_flow
                and income.net_income
                and income.net_income > 0
            ):
                profitability["earnings_quality_ratio"] = float(
                    financial_statements.cash_flow_statement.free_cash_flow / income.net_income
                )

            # Leverage ratios
            leverage = {}
            if financial_statements.debt_to_equity is not None:
                leverage["debt_to_equity"] = float(financial_statements.debt_to_equity)
            if balance.total_debt and balance.total_assets and balance.total_assets > 0:
                leverage["debt_to_assets"] = float(balance.total_debt / balance.total_assets)
            if balance.total_equity and balance.total_assets and balance.total_assets > 0:
                leverage["equity_ratio"] = float(balance.total_equity / balance.total_assets)
            if financial_statements.interest_coverage is not None:
                leverage["interest_coverage"] = float(financial_statements.interest_coverage)
            if financial_statements.net_debt_to_ebitda is not None:
                leverage["net_debt_to_ebitda"] = float(financial_statements.net_debt_to_ebitda)

            # Efficiency ratios
            efficiency = {}
            if income.total_revenue and balance.total_assets and balance.total_assets > 0:
                efficiency["asset_turnover"] = float(income.total_revenue / balance.total_assets)
            if income.cost_of_revenue and balance.inventory and balance.inventory > 0:
                efficiency["inventory_turnover"] = float(income.cost_of_revenue / balance.inventory)
            if (
                income.total_revenue
                and balance.accounts_receivable
                and balance.accounts_receivable > 0
            ):
                efficiency["receivables_turnover"] = float(
                    income.total_revenue / balance.accounts_receivable
                )
            if balance.net_working_capital is not None and balance.net_working_capital != 0:
                efficiency["working_capital_turnover"] = float(
                    income.total_revenue / abs(balance.net_working_capital)
                )

            # Valuation ratios
            valuation = {}
            if market.pe_ratio is not None:
                valuation["pe_ratio"] = float(market.pe_ratio)
            if market.pb_ratio is not None:
                valuation["pb_ratio"] = float(market.pb_ratio)
            if market.ps_ratio is not None:
                valuation["ps_ratio"] = float(market.ps_ratio)
            if financial_statements.ebitda and financial_statements.ebitda > 0:
                enterprise_value = (
                    (market.market_cap or 0)
                    + (balance.total_debt or 0)
                    - (balance.cash_and_equivalents or 0)
                )
                valuation["ev_to_ebitda"] = float(enterprise_value / financial_statements.ebitda)
            if financial_statements.free_cash_flow_yield is not None:
                valuation["free_cash_flow_yield"] = float(financial_statements.free_cash_flow_yield)

            # Liquidity ratios
            liquidity = {}
            if (
                balance.current_assets
                and balance.current_liabilities
                and balance.current_liabilities > 0
            ):
                liquidity["current_ratio"] = float(
                    balance.current_assets / balance.current_liabilities
                )
            if (
                balance.current_assets
                and balance.inventory
                and balance.current_liabilities
                and balance.current_liabilities > 0
            ):
                quick_assets = balance.current_assets - balance.inventory
                liquidity["quick_ratio"] = float(quick_assets / balance.current_liabilities)
            if (
                balance.cash_and_equivalents
                and balance.current_liabilities
                and balance.current_liabilities > 0
            ):
                liquidity["cash_ratio"] = float(
                    balance.cash_and_equivalents / balance.current_liabilities
                )
            if (
                cash_flow.operating_cash_flow
                and balance.current_liabilities
                and balance.current_liabilities > 0
            ):
                liquidity["operating_cash_flow_ratio"] = float(
                    cash_flow.operating_cash_flow / balance.current_liabilities
                )

            return {
                "profitability": profitability if profitability else None,
                "leverage": leverage if leverage else None,
                "efficiency": efficiency if efficiency else None,
                "valuation": valuation if valuation else None,
                "liquidity": liquidity if liquidity else None,
            }

        except Exception as e:
            logger.error(f"Error calculating all ratios: {e}")
            return {
                "profitability": None,
                "leverage": None,
                "efficiency": None,
                "valuation": None,
                "liquidity": None,
            }

    @staticmethod
    def calculate_roe(
        net_income: Optional[Decimal], total_equity: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Return on Equity (ROE)."""
        if net_income and total_equity and total_equity > 0:
            return (net_income / total_equity) * 100
        return None

    @staticmethod
    def calculate_roa(
        net_income: Optional[Decimal], total_assets: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Return on Assets (ROA)."""
        if net_income and total_assets and total_assets > 0:
            return (net_income / total_assets) * 100
        return None

    @staticmethod
    def calculate_roic(
        net_income: Optional[Decimal],
        interest_expense: Optional[Decimal],
        tax_rate: Optional[Decimal],
        total_debt: Optional[Decimal],
        total_equity: Optional[Decimal],
    ) -> Optional[Decimal]:
        """Calculate Return on Invested Capital (ROIC)."""
        if not all([net_income, total_debt, total_equity]):
            return None

        # Calculate NOPAT (Net Operating Profit After Tax)
        if interest_expense and tax_rate:
            nopat = net_income + (interest_expense * (1 - tax_rate))
        else:
            nopat = net_income

        invested_capital = total_debt + total_equity
        if invested_capital > 0:
            return (nopat / invested_capital) * 100
        return None

    @staticmethod
    def calculate_operating_margin(
        operating_income: Optional[Decimal], total_revenue: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Operating Margin."""
        if operating_income and total_revenue and total_revenue > 0:
            return (operating_income / total_revenue) * 100
        return None

    @staticmethod
    def calculate_net_margin(
        net_income: Optional[Decimal], total_revenue: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Net Margin."""
        if net_income and total_revenue and total_revenue > 0:
            return (net_income / total_revenue) * 100
        return None

    @staticmethod
    def calculate_gross_margin(
        gross_profit: Optional[Decimal], total_revenue: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Gross Margin."""
        if gross_profit and total_revenue and total_revenue > 0:
            return (gross_profit / total_revenue) * 100
        return None

    @staticmethod
    def calculate_debt_to_equity(
        total_debt: Optional[Decimal], total_equity: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Debt-to-Equity Ratio."""
        if total_debt and total_equity and total_equity > 0:
            return total_debt / total_equity
        return None

    @staticmethod
    def calculate_debt_to_assets(
        total_debt: Optional[Decimal], total_assets: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Debt-to-Assets Ratio."""
        if total_debt and total_assets and total_assets > 0:
            return total_debt / total_assets
        return None

    @staticmethod
    def calculate_interest_coverage(
        operating_income: Optional[Decimal], interest_expense: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Interest Coverage Ratio."""
        if operating_income and interest_expense is not None and interest_expense != 0:
            # Only calculate if there's actual interest expense (positive value)
            # Companies with interest income (negative) don't need interest coverage
            if interest_expense > 0:
                return operating_income / interest_expense
        return None

    @staticmethod
    def calculate_equity_ratio(
        total_equity: Optional[Decimal], total_assets: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Equity Ratio."""
        if total_equity and total_assets and total_assets > 0:
            return total_equity / total_assets
        return None

    @staticmethod
    def calculate_current_ratio(
        current_assets: Optional[Decimal], current_liabilities: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Current Ratio."""
        if current_assets and current_liabilities and current_liabilities > 0:
            return current_assets / current_liabilities
        return None

    @staticmethod
    def calculate_quick_ratio(
        current_assets: Optional[Decimal],
        inventory: Optional[Decimal],
        current_liabilities: Optional[Decimal],
    ) -> Optional[Decimal]:
        """Calculate Quick Ratio."""
        if current_assets and current_liabilities and current_liabilities > 0:
            quick_assets = current_assets - (inventory or 0)
            return quick_assets / current_liabilities
        return None

    @staticmethod
    def calculate_cash_ratio(
        cash_and_equivalents: Optional[Decimal], current_liabilities: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Cash Ratio."""
        if cash_and_equivalents and current_liabilities and current_liabilities > 0:
            return cash_and_equivalents / current_liabilities
        return None

    @staticmethod
    def calculate_asset_turnover(
        total_revenue: Optional[Decimal], total_assets: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Asset Turnover Ratio."""
        if total_revenue and total_assets and total_assets > 0:
            return total_revenue / total_assets
        return None

    @staticmethod
    def calculate_inventory_turnover(
        cost_of_revenue: Optional[Decimal], inventory: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Inventory Turnover Ratio."""
        if cost_of_revenue and inventory and inventory > 0:
            return cost_of_revenue / inventory
        return None

    @staticmethod
    def calculate_receivables_turnover(
        total_revenue: Optional[Decimal], accounts_receivable: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Receivables Turnover Ratio."""
        if total_revenue and accounts_receivable and accounts_receivable > 0:
            return total_revenue / accounts_receivable
        return None

    @staticmethod
    def calculate_working_capital_turnover(
        total_revenue: Optional[Decimal], net_working_capital: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Working Capital Turnover Ratio."""
        if total_revenue and net_working_capital is not None and net_working_capital != 0:
            return total_revenue / abs(net_working_capital)
        return None

    @staticmethod
    def calculate_pe_ratio(
        current_price: Optional[Decimal],
        shares_outstanding: Optional[Decimal],
        net_income: Optional[Decimal],
    ) -> Optional[Decimal]:
        """Calculate Price-to-Earnings Ratio."""
        if current_price and shares_outstanding and net_income and net_income > 0:
            eps = net_income / shares_outstanding
            return current_price / eps
        return None

    @staticmethod
    def calculate_pb_ratio(
        current_price: Optional[Decimal],
        shares_outstanding: Optional[Decimal],
        total_equity: Optional[Decimal],
    ) -> Optional[Decimal]:
        """Calculate Price-to-Book Ratio."""
        if current_price and shares_outstanding and total_equity and total_equity > 0:
            book_value_per_share = total_equity / shares_outstanding
            return current_price / book_value_per_share
        return None

    @staticmethod
    def calculate_ps_ratio(
        market_cap: Optional[Decimal], total_revenue: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Price-to-Sales Ratio."""
        if market_cap and total_revenue and total_revenue > 0:
            return market_cap / total_revenue
        return None

    @staticmethod
    def calculate_ev_to_ebitda(
        market_cap: Optional[Decimal],
        total_debt: Optional[Decimal],
        cash_and_equivalents: Optional[Decimal],
        ebitda: Optional[Decimal],
    ) -> Optional[Decimal]:
        """Calculate EV/EBITDA Ratio."""
        if market_cap and ebitda and ebitda > 0:
            enterprise_value = market_cap + (total_debt or 0) - (cash_and_equivalents or 0)
            return enterprise_value / ebitda
        return None

    @staticmethod
    def calculate_earnings_quality_ratio(
        free_cash_flow: Optional[Decimal], net_income: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Earnings Quality Ratio (FCF/Net Income)."""
        if free_cash_flow and net_income and net_income > 0:
            return free_cash_flow / net_income
        return None

    @staticmethod
    def calculate_operating_cash_flow_ratio(
        operating_cash_flow: Optional[Decimal], current_liabilities: Optional[Decimal]
    ) -> Optional[Decimal]:
        """Calculate Operating Cash Flow Ratio."""
        if operating_cash_flow and current_liabilities and current_liabilities > 0:
            return operating_cash_flow / current_liabilities
        return None


__all__ = [
    "FinancialRatiosCalculator",
    "RatioEvaluation",
    "RatioEvaluationData",
]
