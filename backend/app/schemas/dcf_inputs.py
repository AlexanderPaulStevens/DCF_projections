"""
Pydantic schemas for DCF calculation inputs.

This module defines the data contracts for DCF calculations,
ensuring type safety and automatic validation of financial data.
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DCFFinancialData(BaseModel):
    """
    Standardized financial data for DCF calculations.

    All monetary values should be in millions of dollars.
    All share counts should be in millions of shares.
    """

    revenue: float = Field(
        ...,
        alias="Revenue",
        description="Total revenue in millions of dollars",
        gt=0,
    )
    ebit: float = Field(
        ...,
        alias="EBIT",
        description="Earnings Before Interest and Taxes in millions of dollars",
    )
    cash_and_equivalents: float = Field(
        ...,
        alias="Cash and Cash Equivalents",
        description="Cash and cash equivalents in millions of dollars",
        ge=0,
    )
    shares_outstanding: float = Field(
        ...,
        alias="Shares Outstanding",
        description="Number of shares outstanding in millions",
        gt=0,
    )
    total_debt: float = Field(
        default=0.0,
        alias="Total Debt",
        description="Total debt in millions of dollars",
        ge=0,
    )
    cost_of_debt: Optional[float] = Field(
        default=None,
        alias="Cost of Debt",
        description="Pre-calculated cost of debt as a decimal (e.g., 0.05 for 5%)",
        ge=0,
        le=1,
    )
    interest_expense: Optional[float] = Field(
        default=None,
        alias="Interest and other income (expense), net",
        description="Interest expense in millions of dollars",
    )

    model_config = ConfigDict(
        populate_by_name=True,  # Allow both field name and alias
        json_schema_extra={
            "example": {
                "Revenue": 5000.0,
                "EBIT": 600.0,
                "Cash and Cash Equivalents": 500.0,
                "Shares Outstanding": 1000.0,
                "Total Debt": 1000.0,
                "Cost of Debt": 0.055,
            }
        },
    )

    @field_validator("ebit")
    @classmethod
    def validate_ebit(cls, v: float) -> float:
        """Validate EBIT can be negative but warn if unusually low."""
        # EBIT can be negative for unprofitable companies
        # Just return the value, validation is handled by type system
        return v

    def to_dict(self) -> dict:
        """Convert to dictionary with standardized field names (aliases)."""
        return {
            "Revenue": self.revenue,
            "EBIT": self.ebit,
            "Cash and Cash Equivalents": self.cash_and_equivalents,
            "Shares Outstanding": self.shares_outstanding,
            "Total Debt": self.total_debt,
            "Cost of Debt": self.cost_of_debt,
            "Interest and other income (expense), net": self.interest_expense,
        }


class DCFMarketData(BaseModel):
    """Market data and assumptions required for DCF calculations."""

    beta: float = Field(
        ...,
        description="Stock beta for WACC calculation",
        ge=0,
    )
    tax_rate: float = Field(
        ...,
        description="Effective tax rate as a decimal (e.g., 0.24 for 24%)",
        ge=0,
        le=1,
    )
    market_cap: float = Field(
        ...,
        description="Market capitalization in millions of dollars",
        gt=0,
    )
    terminal_growth_rate: float = Field(
        ...,
        description="Long-run perpetual growth rate as a decimal (e.g., 0.025 for 2.5%)",
        ge=0,
        le=0.10,  # Terminal growth should not exceed 10%
    )
    market_risk_premium: float = Field(
        ...,
        description="Market risk premium as a decimal (e.g., 0.055 for 5.5%)",
        ge=0,
        le=0.20,  # MRP typically between 0-20%
    )
    risk_free_rate: float = Field(
        ...,
        description="Risk-free rate (e.g., 10-year Treasury) as a decimal (e.g., 0.045 for 4.5%)",
        ge=0,
        le=0.15,  # Risk-free rate should not exceed 15%
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "beta": 1.2,
                "tax_rate": 0.24,
                "market_cap": 1000.0,
                "terminal_growth_rate": 0.025,
                "market_risk_premium": 0.055,
                "risk_free_rate": 0.045,
            }
        }
    )


class DCFRatioData(BaseModel):
    """Company-specific operating ratios for DCF projections."""

    wc_to_revenue_ratio: float = Field(
        ...,
        description="Net Working Capital as % of Revenue (e.g., 0.05 for 5%)",
        ge=-0.50,  # Can be negative for some companies
        le=0.50,  # Should not exceed 50% of revenue
    )
    capex_to_revenue_ratio: float = Field(
        ...,
        description="Capital Expenditure as % of Revenue (e.g., 0.10 for 10%)",
        ge=0,
        le=0.50,  # CapEx typically doesn't exceed 50% of revenue
    )
    da_to_revenue_ratio: float = Field(
        ...,
        description="Depreciation & Amortization as % of Revenue (e.g., 0.035 for 3.5%)",
        ge=0,
        le=0.30,  # D&A typically doesn't exceed 30% of revenue
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "wc_to_revenue_ratio": 0.05,
                "capex_to_revenue_ratio": 0.10,
                "da_to_revenue_ratio": 0.035,
            }
        }
    )
