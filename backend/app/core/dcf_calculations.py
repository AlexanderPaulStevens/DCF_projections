import datetime


class DCFCalculator:
    """
    DCF calculator
    """

    def __init__(
        self,
        ticker: str,
        financial_data: dict,
        beta: float,
        tax_rate: float,
        market_cap: float,
        total_cash: float,
        shares_outstanding: int,
    ):
        """
        Initialize DCF calculator with all required data.

        Args:
            ticker (str): Company ticker symbol
            financial_data (dict): Latest financial data
            beta (float): Stock beta for WACC calculation
            tax_rate (float): Effective tax rate
            market_cap (float): Market capitalization
            total_cash (float): Total cash and cash equivalents
            shares_outstanding (int): Number of shares outstanding
        """
        self.ticker = ticker
        self.beta = beta
        self.tax_rate = tax_rate
        self.market_cap = market_cap
        self.total_cash = total_cash
        self.shares_outstanding = shares_outstanding

        # Update financial data with provided values if missing
        # Yahoo Finance API returns raw values (dollars and share counts)
        # Our financial_data expects millions, so we convert here
        if total_cash and not financial_data.get("Cash and Cash Equivalents"):
            # Convert from dollars to millions of dollars
            financial_data["Cash and Cash Equivalents"] = total_cash / 1_000_000
        if shares_outstanding and not financial_data.get("Shares Outstanding"):
            # Convert from share count to millions of shares
            # Note: Both info.get() and balance sheet return raw counts
            financial_data["Shares Outstanding"] = shares_outstanding / 1_000_000

        self._validate_financial_data(financial_data)

        # Extract financial data with flexible field names
        self.total_debt = financial_data.get("Total Debt", 0)

        # Store the financial data for later use
        self.financial_data = financial_data

        # Get cash with flexible naming
        self.cash = (
            financial_data.get("Cash and Cash Equivalents")
            or financial_data.get("Cash")
            or financial_data.get("Cash and cash equivalents")
            or 0
        )

        # Get shares outstanding with flexible naming
        self.shares_outstanding_mm = (
            financial_data.get("Shares Outstanding")
            or financial_data.get("Diluted")
            or financial_data.get("Basic")
            or financial_data.get("shares_outstanding")
        )

        # DCF Assumptions
        self.projection_years = 5
        self.initial_growth_rate = 0.10  # 10% initial growth
        self.terminal_growth_rate = 0.025  # 2.5% terminal growth
        self.market_risk_premium = 0.055  # 5.5% market risk premium
        self.risk_free_rate = 0.045  # 4.5% risk-free rate

        # Financial ratios (assumed values)
        self.wc_to_revenue_ratio = 0.05  # Working capital as % of revenue
        self.capex_to_revenue_ratio = 0.04  # CapEx as % of revenue
        self.da_to_revenue_ratio = 0.03  # D&A as % of revenue

        # Calculate derived values
        self.cost_of_debt = self._calculate_cost_of_debt(financial_data)
        self.cost_of_equity = self._calculate_cost_of_equity()
        self.wacc = self._calculate_wacc()

    def _validate_financial_data(self, latest_data):
        """Validate that we have essential financial data."""
        # Check for required fields with flexible naming
        has_revenue = any(
            latest_data.get(field)
            for field in ["Total net sales", "Revenue", "Net sales", "Total revenue"]
        )

        has_ebit = any(
            latest_data.get(field)
            for field in [
                "EBIT (Operating Income + Other Income/Expense)",
                "EBIT",
                "Operating income",
                "Operating Income",
            ]
        )

        # For cash and shares, we'll get them from external data if missing
        has_cash = any(
            latest_data.get(field)
            for field in [
                "Cash and Cash Equivalents",
                "Cash",
                "Cash and cash equivalents",
            ]
        )

        has_shares = any(
            latest_data.get(field)
            for field in [
                "Shares Outstanding",
                "Diluted",
                "Basic",
                "shares_outstanding",
            ]
        )

        if not has_revenue:
            raise ValueError(f"Missing revenue data for {self.ticker}")
        if not has_ebit:
            raise ValueError(f"Missing EBIT data for {self.ticker}")

        # Add missing data from external sources
        if not has_cash:
            latest_data["Cash and Cash Equivalents"] = 0  # Will be updated from external data
        if not has_shares:
            latest_data["Shares Outstanding"] = 0  # Will be updated from parameters

    def _calculate_cost_of_debt(self, latest_data):
        """Calculate cost of debt with fallback."""
        # Try to get from financial data first (pre-calculated by service layer)
        cost_of_debt = latest_data.get("Cost of Debt")
        if cost_of_debt is not None and cost_of_debt > 0:
            print(f"✅ Using pre-calculated Cost of Debt: {cost_of_debt:.4f}")
            return cost_of_debt

        # Calculate from interest expense and total debt
        interest_expense = latest_data.get("Interest and other income (expense), net", 0)
        total_debt = latest_data.get("Total Debt", 0)

        if total_debt > 0:
            cost_of_debt = abs(interest_expense) / total_debt
            if 0 <= cost_of_debt <= 0.20:
                print(f"✅ Calculated Cost of Debt from interest/debt: {cost_of_debt:.4f}")
                return cost_of_debt
            else:
                print(f"⚠️ Calculated cost of debt {cost_of_debt:.4f} outside valid range (0-20%)")

        # Fallback: risk-free rate + 1% premium
        fallback_value = self.risk_free_rate + 0.01
        print(f"❌ Falling back to risk-free rate + 1%: {fallback_value:.4f}")
        print(f"   Reason: interest_expense={interest_expense}, total_debt={total_debt}")
        return fallback_value

    def _calculate_cost_of_equity(self):
        """Calculate Cost of Equity using CAPM."""
        return self.risk_free_rate + (self.beta * self.market_risk_premium)

    def _calculate_wacc(self):
        """Calculate Weighted Average Cost of Capital (WACC)."""
        cost_of_equity = self._calculate_cost_of_equity()
        after_tax_cost_of_debt = self.cost_of_debt * (1 - self.tax_rate)

        # For debt-free companies, WACC equals cost of equity
        if self.total_debt == 0:
            return cost_of_equity

        # Use market cap if available, otherwise use debt/equity ratio assumption
        if self.market_cap > 0:
            total_value = self.market_cap + self.total_debt
            equity_weight = self.market_cap / total_value
            debt_weight = self.total_debt / total_value
        else:
            # Default to 20% debt, 80% equity
            equity_weight = 0.8
            debt_weight = 0.2

        return (equity_weight * cost_of_equity) + (debt_weight * after_tax_cost_of_debt)

    def project_financials(self, growth_rate=None, years=None):
        """
        Simplified financial projections using external data and assumptions.

        Args:
            growth_rate (float): Growth rate (defaults to initial_growth_rate)
            years (int): Number of years to project

        Returns:
            dict: Projected financial metrics by year
        """
        years = years or self.projection_years
        growth_rate = growth_rate or self.initial_growth_rate

        # Use the stored financial data directly (it's already a single year's data)
        base_data = self.financial_data

        # Get revenue with flexible naming
        base_revenue = (
            base_data.get("Total net sales")
            or base_data.get("Revenue")
            or base_data.get("Net sales")
            or base_data.get("Total revenue")
            or 0
        )

        # Get EBIT with flexible naming
        base_ebit = (
            base_data.get("EBIT (Operating Income + Other Income/Expense)")
            or base_data.get("EBIT")
            or base_data.get("Operating income")
            or base_data.get("Operating Income")
            or 0
        )

        projections = {}
        # Use base_year if available, otherwise use current year
        if hasattr(self, "base_year") and self.base_year:
            start_year = self.base_year + 1
        else:
            start_year = datetime.datetime.now().year + 1
        prev_revenue = base_revenue
        prev_wc = base_revenue * self.wc_to_revenue_ratio

        for i in range(years):
            year = start_year + i

            # Linear growth decline to terminal rate
            current_growth = growth_rate - (growth_rate - self.terminal_growth_rate) * (
                i / max(years - 1, 1)
            )

            # Project revenue
            projected_revenue = prev_revenue * (1 + current_growth)

            # Calculate other metrics using ratios from __init__
            ebit_margin = base_ebit / base_revenue if base_revenue > 0 else 0
            projected_ebit = projected_revenue * ebit_margin
            projected_da = projected_revenue * self.da_to_revenue_ratio
            projected_capex = projected_revenue * self.capex_to_revenue_ratio

            # Working capital change
            projected_wc = projected_revenue * self.wc_to_revenue_ratio
            wc_change = projected_wc - prev_wc

            # Calculate FCF
            nopat = projected_ebit * (1 - self.tax_rate)
            fcf = nopat + projected_da - wc_change - projected_capex

            projections[year] = {
                "Growth_Rate": current_growth,
                "Revenue": projected_revenue,
                "EBIT": projected_ebit,
                "D&A": projected_da,
                "NOPAT": nopat,
                "NWC": projected_wc,
                "CWC": wc_change,
                "CAPEX": projected_capex,
                "FCF": fcf,
            }

            prev_revenue = projected_revenue
            prev_wc = projected_wc

        return projections

    def calculate_enterprise_value(self, projections):
        """
        Calculate enterprise value using simplified DCF method.
        """
        years = sorted(projections.keys())
        pv_fcf = 0

        # Calculate present value of projected free cash flows
        for i, year in enumerate(years):
            fcf = projections[year]["FCF"]
            discount_factor = (1 + self.wacc) ** (i + 1)
            pv_fcf += fcf / discount_factor

        # Calculate terminal value
        final_year_fcf = projections[years[-1]]["FCF"]
        terminal_fcf = final_year_fcf * (1 + self.terminal_growth_rate)

        # Simplified terminal value calculation
        terminal_value = terminal_fcf / (self.wacc - self.terminal_growth_rate)

        # Discount terminal value to present
        terminal_discount_factor = (1 + self.wacc) ** len(years)
        pv_terminal_value = terminal_value / terminal_discount_factor

        return pv_fcf + pv_terminal_value

    def calculate_equity_value(self, enterprise_value):
        """Calculate equity value from enterprise value."""
        net_debt = self.total_debt - self.cash
        return enterprise_value - net_debt

    def calculate_per_share_value(self, equity_value):
        """Calculate per share value."""
        if self.shares_outstanding_mm == 0:
            return 0.0
        return equity_value / self.shares_outstanding_mm
