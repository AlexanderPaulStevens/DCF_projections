import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


class DCFCalculator:
    """
    Discounted Cash Flow calculator for financial projections.
    """

    # DCF Calculation Defaults
    DEFAULT_TAX_RATE = 0.25
    DEFAULT_TERMINAL_GROWTH_RATE = 0.025
    DEFAULT_WACC = 0.10
    DEFAULT_PROJECTION_YEARS = 5
    DEFAULT_EARNINGS_GROWTH_RATE = 0.15
    DEFAULT_CAP_EX_GROWTH_RATE = 0.04
    DEFAULT_HISTORICAL_YEARS = 3
    DEFAULT_SHARES_OUTSTANDING = 15_400_000_000  # Apple's approximate

    def __init__(self, ticker, financial_data, base_year=None):
        """
        Initialize DCF calculator.

        Args:
            ticker (str): Company ticker symbol
            financial_data (dict): Historical financial data by year
            base_year (int): Base year for projections (defaults to latest year)
        """

        self.ticker = ticker
        self.financial_data = financial_data
        self.base_year = base_year or max(financial_data.keys())
        self.shares_outstanding = None

        # DCF assumptions (can be customized)
        self.tax_rate = self.DEFAULT_TAX_RATE
        self.terminal_growth_rate = self.DEFAULT_TERMINAL_GROWTH_RATE
        self.wacc = self.DEFAULT_WACC
        self.projection_years = self.DEFAULT_PROJECTION_YEARS

    def get_historical_metrics(self, years_back=3):
        """
        Get historical financial metrics for the specified number of years.

        Args:
            years_back (int): Number of years to look back

        Returns:
            dict: Historical metrics by year
        """
        historical = {}
        current_year = self.base_year

        for i in range(years_back):
            year = current_year - i
            if year in self.financial_data:
                historical[year] = self.financial_data[year]

        return historical

    def calculate_growth_rates(self, metric_name, years_back=3):
        """
        Calculate historical growth rates for a specific metric.

        Args:
            metric_name (str): Name of the financial metric
            years_back (int): Number of years to analyze

        Returns:
            list: Growth rates for each year
        """
        historical = self.get_historical_metrics(years_back)
        years = sorted(historical.keys())
        growth_rates = []

        for i in range(1, len(years)):
            prev_year = years[i - 1]
            curr_year = years[i]

            if (
                metric_name in historical[prev_year]
                and metric_name in historical[curr_year]
                and historical[prev_year][metric_name] != 0
            ):
                prev_value = historical[prev_year][metric_name]
                curr_value = historical[curr_year][metric_name]
                growth_rate = (curr_value - prev_value) / abs(prev_value)
                growth_rates.append(growth_rate)

        return growth_rates

    def project_financials(
        self, earnings_growth_rate=0.15, years=5, cap_ex_growth_rate=None
    ):
        """
        Project financial statements for DCF analysis.

        Args:
            earnings_growth_rate (float): Expected earnings growth rate
            years (int): Number of years to project
            cap_ex_growth_rate (float): Capital expenditure growth rate
                (if None, uses earnings growth)

        Returns:
            dict: Projected financial metrics by year
        """
        base_data = self.financial_data.get(self.base_year, {})
        projections = {}

        # Get base year metrics
        base_ebit = base_data.get("EBIT (Operating Income + Other Income/Expense)", 0)
        base_da = base_data.get("Depreciation and amortization", 0)
        base_revenue = base_data.get("Total net sales", 0)

        # Estimate base year working capital and capex as % of revenue
        base_wc_pct = 0.05  # Assume 5% of revenue
        base_capex_pct = 0.04  # Assume 4% of revenue

        # Use provided cap_ex_growth_rate or default to earnings growth
        if cap_ex_growth_rate is None:
            cap_ex_growth_rate = earnings_growth_rate

        start_year = self.base_year + 1

        for i in range(years):
            year = start_year + i
            growth_factor = (1 + earnings_growth_rate) ** (i + 1)

            # Project EBIT with growth
            projected_ebit = base_ebit * growth_factor

            # Project D&A (assume it grows with revenue at a slower rate)
            da_growth_factor = (1 + earnings_growth_rate * 0.7) ** (i + 1)
            projected_da = base_da * da_growth_factor

            # Project revenue (assume it grows with earnings)
            projected_revenue = base_revenue * growth_factor

            # Calculate working capital change (assume it's a % of revenue growth)
            wc_change = (
                projected_revenue * base_wc_pct * (earnings_growth_rate / (1 + i * 0.1))
            )

            # Calculate capex with specified growth rate
            capex_growth_factor = (1 + cap_ex_growth_rate) ** (i + 1)
            capex = projected_revenue * base_capex_pct * capex_growth_factor

            # Calculate NOPAT (Net Operating Profit After Tax)
            nopat = projected_ebit * (1 - self.tax_rate)

            # Calculate Free Cash Flow
            fcf = nopat + projected_da - wc_change - capex

            projections[year] = {
                "EBIT": projected_ebit,
                "D&A": projected_da,
                "NOPAT": nopat,
                "CWC": wc_change,  # Change in Working Capital
                "CAPEX": capex,
                "FCF": fcf,
                "Revenue": projected_revenue,
            }

        return projections

    def calculate_dcf_scenarios(self, base_growth=0.15, steps=2, step_size=0.10):
        """
        Calculate multiple DCF scenarios with different growth rates.

        Args:
            base_growth (float): Base earnings growth rate
            steps (int): Number of additional scenarios
            step_size (float): Increment for each scenario

        Returns:
            dict: DCF results for each scenario
        """
        scenarios = {}

        for i in range(steps + 1):
            growth_rate = base_growth + (i * step_size)
            scenario_name = f"Scenario_{i + 1}_Growth_{growth_rate:.1%}"

            projections = self.project_financials(growth_rate)
            enterprise_value = self.calculate_enterprise_value(projections)
            equity_value = self.calculate_equity_value(enterprise_value)
            per_share_value = self.calculate_per_share_value(
                equity_value, self.shares_outstanding
            )

            scenarios[scenario_name] = {
                "growth_rate": growth_rate,
                "projections": projections,
                "enterprise_value": enterprise_value,
                "equity_value": equity_value,
                "per_share_value": per_share_value,
            }

        return scenarios

    def calculate_enterprise_value(self, projections):
        """
        Calculate enterprise value using DCF method.

        Args:
            projections (dict): Financial projections by year

        Returns:
            float: Enterprise value
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

        # Prevent division by zero when discount rate equals growth rate
        if abs(self.wacc - self.terminal_growth_rate) < 0.0001:
            # If they're very close, use a small adjustment to prevent division by zero
            adjusted_wacc = self.wacc + 0.0001
            terminal_value = terminal_fcf / (adjusted_wacc - self.terminal_growth_rate)
        else:
            terminal_value = terminal_fcf / (self.wacc - self.terminal_growth_rate)

        # Discount terminal value to present
        terminal_discount_factor = (1 + self.wacc) ** len(years)
        pv_terminal_value = terminal_value / terminal_discount_factor

        enterprise_value = pv_fcf + pv_terminal_value
        return enterprise_value

    def calculate_equity_value(self, enterprise_value):
        """
        Calculate equity value from enterprise value.

        Args:
            enterprise_value (float): Enterprise value

        Returns:
            float: Equity value
        """
        # Assume net debt is 5% of enterprise value (simplified)
        net_debt = enterprise_value * 0.05
        equity_value = enterprise_value - net_debt
        return equity_value

    def calculate_per_share_value(self, equity_value, shares_outstanding=None):
        """
        Calculate per share value.

        Args:
            equity_value (float): Total equity value (in millions)
            shares_outstanding (float, optional): Number of shares outstanding.
                                                 If None, uses default from settings.

        Returns:
            float: Per share value
        """
        # Use provided shares outstanding or fall back to default
        if shares_outstanding is None:
            shares_outstanding = self.DEFAULT_SHARES_OUTSTANDING
        else:
            # Convert from thousands to actual shares if needed
            # (financial data often reports shares in thousands)
            if (
                shares_outstanding < 1000000
            ):  # If less than 1 million, likely in thousands
                shares_outstanding = shares_outstanding * 1000

        # Convert equity value from millions to actual dollars
        equity_value_dollars = equity_value * 1_000_000

        # Convert shares outstanding to actual shares
        # Apple's diluted shares: 15,408,095 (in thousands) = 15.4 billion shares
        if (
            shares_outstanding < 1_000_000_000
        ):  # If less than 1 billion, likely in thousands
            shares_outstanding = (
                shares_outstanding * 1_000
            )  # Convert from thousands to actual shares

        per_share_value = equity_value_dollars / shares_outstanding
        return per_share_value

    def print_dcf_summary(self, scenario_name, scenario_data):
        """
        Print DCF summary in the specified format.

        Args:
            scenario_name (str): Name of the scenario
            scenario_data (dict): Scenario calculation results
        """
        projections = scenario_data["projections"]
        years = sorted(projections.keys())

        # Determine base year for forecasting message
        base_year_date = f"{self.base_year}-12-29"

        print(
            f"\nForecasting flows for {len(years)} years out, starting at {base_year_date}."
        )
        print(f"Growth Rate: {scenario_data['growth_rate']:.1%}")
        print(
            f"{'Year':<8} | {'DFCF':<10} | {'EBIT':<10} | {'D&A':<10} | {'CWC':<10} | {'CAP_EX':<11} |"
        )
        print("-" * 75)

        for year in years:
            data = projections[year]
            print(
                f"{year:<8} | {data['FCF']:<10.2E} | {data['EBIT']:<10.2E} | {data['D&A']:<10.2E} | {data['CWC']:<10.2E} | {-data['CAPEX']:<11.2E} |"
            )

        print(
            f"\nEnterprise Value for {self.ticker}: ${scenario_data['enterprise_value']:.2E}."
        )
        print(
            f"Equity Value for {self.ticker}: ${scenario_data['per_share_value']:.2E}."
        )
        print(
            f"Per share value for {self.ticker}: ${scenario_data['per_share_value']:.2E}."
        )
        print("=" * 75)
