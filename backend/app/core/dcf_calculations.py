import datetime
from typing import Any, Dict

from app.core.helper_functions.calculations import calculate_cost_of_debt, calculate_wacc


class DCFCalculator:
    """
    Discounted Cash Flow (DCF) Calculator - Fundamental equity valuation tool.

    ═══════════════════════════════════════════════════════════════════════════════
    REFERENCE DCF ASSUMPTIONS (Example values - MSFT as of Oct 2025)
    ═══════════════════════════════════════════════════════════════════════════════

    These values are provided as reference for typical DCF assumptions.
    Actual values are passed via DCFMarketData and DCFRatioData schemas.

    Market Assumptions:
        TERMINAL_GROWTH_RATE = 0.035     # 3.5% - Long-run perpetual growth rate
        MARKET_RISK_PREMIUM  = 0.050     # 5.0% - Equity risk premium over risk-free rate
        RISK_FREE_RATE       = 0.035     # 3.5% - 10-year US Treasury yield

    Operating Ratios (% of Revenue):
        CAPEX_TO_REVENUE = 0.035         # 3.5% - Capital expenditure ratio
        DA_TO_REVENUE    = 0.035         # 3.5% - Depreciation & Amortization ratio
        NWC_TO_REVENUE   = 0.05          # 5.0% - Net Working Capital ratio

    Growth Projections:
        PROJECTION_YEARS     = 5         # Number of years in explicit forecast period
        ANNUAL_GROWTH_RATE   = 0.20      # 20.0% - Constant annual revenue growth rate

    NOTE: Adjust these based on:
        - Company maturity (growth vs mature)
        - Industry dynamics (tech vs utilities)
        - Economic conditions (rates, inflation)
        - Company-specific factors (margins, capital intensity)

    ═══════════════════════════════════════════════════════════════════════════════
    """

    def __init__(
        self,
        ticker: str,
        financial_data: Dict[str, Any],
        market_data: Dict[str, Any],
        ratio_data: Dict[str, Any],
    ):
        """
        Initialize DCF calculator with raw financial, market, and ratio data.

        Args:
            ticker: Company ticker symbol (e.g., "AAPL", "MSFT")
            financial_data: Raw financial data (revenue, EBIT, debt, cash, shares)
            market_data: Raw market data (beta, tax rate, market cap, rates,
                and growth assumptions)
            ratio_data: Company-specific operating ratios (WC, CapEx, D&A as % of revenue)
        """
        self.ticker = ticker

        # Extract financial data
        self.financial_data = financial_data
        self.total_debt = financial_data.get("Total Debt", 0)
        self.cash = financial_data.get("Cash and Cash Equivalents", 0)
        self.shares_outstanding_mm = financial_data.get("Shares Outstanding", 0)

        # Extract market data and DCF assumptions
        self.beta = market_data.get("beta", 1.0)
        self.tax_rate = market_data.get("tax_rate", 0.24)
        self.market_cap = market_data.get("market_cap", 0)
        self.terminal_growth_rate = market_data.get("terminal_growth_rate", 0.025)
        self.market_risk_premium = market_data.get("market_risk_premium", 0.055)
        self.risk_free_rate = market_data.get("risk_free_rate", 0.035)

        # Extract company-specific operating ratios
        self.wc_to_revenue_ratio = ratio_data.get("wc_to_revenue_ratio", 0.05)
        self.capex_to_revenue_ratio = ratio_data.get("capex_to_revenue_ratio", 0.035)
        self.da_to_revenue_ratio = ratio_data.get("da_to_revenue_ratio", 0.035)

        # EBIT margin (will be calculated from historical data)
        self.ebit_margin = None

        # Calculate derived values
        self.cost_of_debt = calculate_cost_of_debt(self.risk_free_rate)
        self.cost_of_equity = self.risk_free_rate + (self.beta * self.market_risk_premium)

        # Base year for projections (can be overridden for testing)
        self.base_year = None

    def project_financials(self, years: int, annual_growth_rate: float):
        """
        Project future financials using constant annual growth rate.

        Methodology:
        1. Project revenue with constant annual growth rate for all years
        2. Apply EBIT margin to get future EBIT
        3. Calculate EBIAT (EBIT after tax)
        4. Add back D&A, subtract CapEx and Change in NWC to get Free Cash Flow

        Args:
            years (int): Number of years to project in explicit forecast period
            annual_growth_rate (float): Constant annual growth rate for all projection years
                (e.g., 0.12 for 12%)

        Returns:
            dict: Projected financial metrics by year
        """
        # Get base financial data
        base_revenue = self.financial_data.get("Revenue", 0)
        base_ebit = self.financial_data.get("EBIT", 0)

        if base_revenue == 0:
            raise ValueError("Revenue cannot be zero for DCF projections")

        # Calculate EBIT margin from historical data
        # In a full implementation, this would use multiple years of data with weights
        # For now, use the most recent year's margin
        if self.ebit_margin is None:
            self.ebit_margin = base_ebit / base_revenue if base_revenue > 0 else 0.15

        projections = {}
        # Use base_year if set (for testing), otherwise use current year + 1
        if self.base_year:
            start_year = self.base_year + 1
        else:
            start_year = datetime.datetime.now().year + 1

        prev_revenue = base_revenue
        prev_wc = base_revenue * self.wc_to_revenue_ratio

        for i in range(years):
            year = start_year + i

            # Use constant growth rate for all years
            projected_revenue = prev_revenue * (1 + annual_growth_rate)

            # Project EBIT using historical margin
            projected_ebit = projected_revenue * self.ebit_margin

            # Calculate EBIAT (EBIT After Tax) - also called NOPAT
            ebiat = projected_ebit * (1 - self.tax_rate)

            # Project D&A, CapEx, and NWC as % of revenue
            projected_da = projected_revenue * self.da_to_revenue_ratio
            projected_capex = projected_revenue * self.capex_to_revenue_ratio

            # Calculate change in Net Working Capital
            projected_wc = projected_revenue * self.wc_to_revenue_ratio
            wc_change = projected_wc - prev_wc

            # Free Cash Flow = EBIAT + D&A - CapEx - Change in NWC
            fcf = ebiat + projected_da - projected_capex - wc_change

            projections[year] = {
                "Growth_Rate": annual_growth_rate,
                "Revenue": projected_revenue,
                "EBIT": projected_ebit,
                "EBIAT": ebiat,  # EBIT After Tax
                "NOPAT": ebiat,  # Same as EBIAT, kept for backward compatibility
                "D&A": projected_da,
                "CAPEX": projected_capex,
                "NWC": projected_wc,
                "CWC": wc_change,  # Change in Working Capital
                "FCF": fcf,
            }

            # Update for next iteration
            prev_revenue = projected_revenue
            prev_wc = projected_wc

        return projections

    def calculate_enterprise_value(self, projections: dict) -> float:
        """
        Calculate enterprise value using discounted cash flow method with mid-year convention.

        Mid-year discounting convention:
        - Assumes cash flows occur in the middle of each year (not at year end)
        - Discounts by (0.5 + i) instead of (i + 1)
        - More accurate than end-of-year convention

        Args:
            projections: Dictionary of projected financial metrics by year

        Returns:
            Enterprise value (present value of all future cash flows + terminal value)
        """
        # Calculate WACC (Weighted Average Cost of Capital)
        wacc = calculate_wacc(
            self.cost_of_equity,
            self.cost_of_debt,
            self.tax_rate,
            self.total_debt,
            self.market_cap,
        )
        self.wacc = wacc  # Store for reference

        if wacc <= self.terminal_growth_rate:
            raise ValueError(
                f"WACC ({wacc:.2%}) must be greater than terminal growth rate "
                f"({self.terminal_growth_rate:.2%}) for DCF to be valid"
            )

        years = sorted(projections.keys())
        pv_fcf = 0

        # Calculate present value of projected free cash flows
        # Using mid-year convention: discount by (0.5 + i) instead of (i + 1)
        for i, year in enumerate(years):
            fcf = projections[year]["FCF"]
            # Mid-year discounting: (1 + WACC)^(0.5 + i)
            discount_factor = (1 + wacc) ** (0.5 + i)
            pv_fcf += fcf / discount_factor

        # Calculate terminal value using Gordon Growth Model
        final_year_fcf = projections[years[-1]]["FCF"]
        terminal_fcf = final_year_fcf * (1 + self.terminal_growth_rate)

        # Terminal value = Terminal Year FCF / (WACC - Terminal Growth Rate)
        terminal_value = terminal_fcf / (wacc - self.terminal_growth_rate)

        # Discount terminal value to present using end-of-year discounting
        # Terminal value occurs at end of final projection year
        terminal_discount_factor = (1 + wacc) ** len(years)
        pv_terminal_value = terminal_value / terminal_discount_factor

        enterprise_value = pv_fcf + pv_terminal_value

        return enterprise_value

    def calculate_equity_value(self, enterprise_value: float) -> float:
        """
        Calculate equity value from enterprise value.

        Args:
            enterprise_value: Enterprise value from DCF

        Returns:
            Equity value (what shareholders own)
        """
        net_debt = self.total_debt - self.cash
        return enterprise_value - net_debt

    def calculate_per_share_value(self, equity_value: float) -> float:
        """
        Calculate intrinsic value per share.

        Args:
            equity_value: Total equity value

        Returns:
            Intrinsic value per share
        """
        if self.shares_outstanding_mm == 0:
            return 0.0
        return equity_value / self.shares_outstanding_mm
