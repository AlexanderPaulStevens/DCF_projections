from datetime import datetime

import yfinance as yf


class DCFCalculator:
    """
    Simplified DCF calculator using external data sources.
    """

    def __init__(self, ticker, financial_data, base_year=None):
        """
        Initialize DCF calculator with external data and assumptions.

        Args:
            ticker (str): Company ticker symbol
            financial_data (dict): Historical financial data by year
            base_year (int): Base year for projections (defaults to latest year)
        """
        self.ticker = ticker
        self.financial_data = financial_data
        self.base_year = base_year or max(financial_data.keys())

        # Fetch external market data
        self._fetch_external_data()

        # Get latest financial data
        latest_data = self.financial_data.get(self.base_year, {})
        self._validate_financial_data(latest_data)

        # Extract financial data with flexible field names
        self.total_debt = latest_data.get("Total Debt", 0)

        # Get cash with flexible naming
        self.cash = (
            latest_data.get("Cash and Cash Equivalents")
            or latest_data.get("Cash")
            or latest_data.get("Cash and cash equivalents")
            or 0
        )

        # Get shares outstanding with flexible naming
        self.shares_outstanding_mm = (
            latest_data.get("Shares Outstanding")
            or latest_data.get("Diluted")
            or latest_data.get("Basic")
            or latest_data.get("shares_outstanding")
        )

        # DCF Assumptions (moved to __init__)
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
        self.cost_of_debt = self._calculate_cost_of_debt(latest_data)
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
            latest_data["Cash and Cash Equivalents"] = (
                0  # Will be updated from external data
            )
        if not has_shares:
            latest_data["Shares Outstanding"] = 0  # Will be updated from external data

    def _fetch_external_data(self):
        """Fetch external market data using yfinance."""
        try:
            ticker_obj = yf.Ticker(self.ticker)
            info = ticker_obj.info

            # Get external data
            self.beta = info.get("beta", 1.0)  # Default beta of 1.0 if not available
            self.tax_rate = info.get("taxRate", 0.24)  # Default 24% tax rate

            # Get market cap for WACC calculation
            self.market_cap = info.get("marketCap", 0)

            # Get cash and shares outstanding from balance sheet
            try:
                balance_sheet = ticker_obj.balance_sheet
                if not balance_sheet.empty:
                    # Get latest balance sheet data
                    latest_bs = balance_sheet.iloc[:, 0]  # Most recent quarter

                    # Cash and cash equivalents (in millions)
                    cash_keys = [
                        "Cash And Cash Equivalents",
                        "Cash And Short Term Investments",
                        "Cash",
                    ]
                    cash_value = 0
                    for key in cash_keys:
                        if key in latest_bs.index:
                            cash_value = (
                                latest_bs[key] / 1_000_000
                            )  # Convert to millions
                            break

                    # Shares outstanding (in millions)
                    shares_keys = [
                        "Ordinary Shares Number",
                        "Common Stock Shares Outstanding",
                    ]
                    shares_value = 0
                    for key in shares_keys:
                        if key in latest_bs.index:
                            shares_value = (
                                latest_bs[key] / 1_000_000
                            )  # Convert to millions
                            break

                    # Update financial data if missing
                    latest_data = self.financial_data.get(self.base_year, {})
                    if not latest_data.get("Cash and Cash Equivalents"):
                        latest_data["Cash and Cash Equivalents"] = cash_value
                    if not latest_data.get("Shares Outstanding"):
                        latest_data["Shares Outstanding"] = shares_value

            except Exception as bs_error:
                print(
                    f"Warning: Could not fetch balance sheet data for {self.ticker}: {bs_error}"
                )

        except Exception as e:
            print(f"Warning: Could not fetch external data for {self.ticker}: {e}")
            # Use defaults
            self.beta = 1.0
            self.tax_rate = 0.24
            self.market_cap = 0

    def _calculate_cost_of_debt(self, latest_data):
        """Calculate cost of debt with fallback."""
        # Try to get from financial data first
        cost_of_debt = latest_data.get("Cost of Debt")
        if cost_of_debt is not None and cost_of_debt > 0:
            return cost_of_debt

        # Calculate from interest expense and total debt
        interest_expense = latest_data.get(
            "Interest and other income (expense), net", 0
        )
        total_debt = latest_data.get("Total Debt", 0)

        if total_debt > 0:
            cost_of_debt = abs(interest_expense) / total_debt
            if 0 <= cost_of_debt <= 0.20:
                return cost_of_debt

        # Fallback: risk-free rate + 1% premium
        return self.risk_free_rate + 0.01

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

        base_data = self.financial_data.get(self.base_year, {})

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
        start_year = self.base_year + 1
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
