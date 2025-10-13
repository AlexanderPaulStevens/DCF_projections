"""helper calculations functions for DCF calculations"""


def calculate_cost_of_debt(risk_free_rate: float) -> float:
    """
    Calculate cost of debt with fallback.

    Args:
        risk_free_rate: Risk-free rate as a decimal (e.g., 0.04 for 4%)

    Returns:
        Cost of debt as a decimal (e.g., 0.05 for 5%)
    """
    return risk_free_rate + 0.01


def calculate_wacc(
    cost_of_equity: float,
    cost_of_debt: float,
    tax_rate: float,
    total_debt: float,
    market_cap: float,
) -> float:
    """Calculate Weighted Average Cost of Capital (WACC)."""

    after_tax_cost_of_debt = cost_of_debt * (1 - tax_rate)

    # For debt-free companies, WACC equals cost of equity
    if total_debt == 0:
        return cost_of_equity

    # Use market cap if available, otherwise use debt/equity ratio assumption
    if market_cap > 0:
        total_value = market_cap + total_debt
        equity_weight = market_cap / total_value
        debt_weight = total_debt / total_value
    else:
        # Default to 20% debt, 80% equity
        equity_weight = 0.8
        debt_weight = 0.2

    return (equity_weight * cost_of_equity) + (debt_weight * after_tax_cost_of_debt)
