"""
Unified Financial Statement Schemas

This module defines comprehensive Pydantic schemas for financial statements
that serve as the single source of truth for all financial data processing.
These schemas ensure data consistency across EDGAR, Yahoo Finance, and other sources.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, computed_field, field_validator


class FilingMetadata(BaseModel):
    """Metadata about the source and filing information."""

    source: str = Field(..., description="Data source: 'edgar', 'yahoo_finance', 'manual'")
    source_fidelity: str = Field(..., description="Data quality: 'high', 'medium', 'low'")
    filing_date: Optional[datetime] = Field(None, description="Date the filing was submitted")
    period_end_date: datetime = Field(..., description="End date of the reporting period")
    form_type: Optional[str] = Field(None, description="SEC form type: '10-K', '10-Q', '6-K'")
    accession_number: Optional[str] = Field(None, description="SEC accession number")
    last_updated: datetime = Field(default_factory=datetime.now)

    @field_validator("source_fidelity")
    @classmethod
    def validate_source_fidelity(cls, v: str) -> str:
        """Validate source fidelity is one of the allowed values."""
        allowed = {"high", "medium", "low"}
        if v not in allowed:
            raise ValueError(f"source_fidelity must be one of {allowed}")
        return v


class IncomeStatement(BaseModel):
    """Income Statement with calculated fields and metadata."""

    # Metadata
    metadata: FilingMetadata

    # Core Revenue Fields
    total_revenue: Decimal = Field(..., description="Total revenue in millions", ge=0)
    cost_of_revenue: Optional[Decimal] = Field(
        None, description="Cost of goods sold in millions", ge=0
    )
    gross_profit: Optional[Decimal] = Field(None, description="Gross profit in millions")

    # Operating Expenses
    research_development: Optional[Decimal] = Field(
        None, description="R&D expenses in millions", ge=0
    )
    selling_general_administrative: Optional[Decimal] = Field(
        None, description="SG&A expenses in millions", ge=0
    )
    operating_income: Optional[Decimal] = Field(
        None, description="Operating income (EBIT) in millions"
    )

    # Non-Operating Items
    interest_income: Optional[Decimal] = Field(None, description="Interest income in millions")
    interest_expense: Optional[Decimal] = Field(None, description="Interest expense in millions")
    other_income_expense: Optional[Decimal] = Field(
        None, description="Other income/expense in millions"
    )

    # Tax and Net Income
    # Note: income_tax_expense can be negative (tax benefit/credit)
    income_tax_expense: Optional[Decimal] = Field(
        None, description="Income tax expense in millions (can be negative for tax benefits)"
    )
    net_income: Optional[Decimal] = Field(None, description="Net income in millions")

    # Calculated Fields
    @computed_field
    @property
    def gross_margin(self) -> Optional[Decimal]:
        """Calculate gross margin percentage."""
        if self.gross_profit and self.total_revenue:
            return (self.gross_profit / self.total_revenue) * 100
        return None

    @computed_field
    @property
    def operating_margin(self) -> Optional[Decimal]:
        """Calculate operating margin percentage."""
        if self.operating_income and self.total_revenue:
            return (self.operating_income / self.total_revenue) * 100
        return None

    @computed_field
    @property
    def net_margin(self) -> Optional[Decimal]:
        """Calculate net margin percentage."""
        if self.net_income and self.total_revenue:
            return (self.net_income / self.total_revenue) * 100
        return None

    @computed_field
    @property
    def ebit(self) -> Optional[Decimal]:
        """Earnings Before Interest and Taxes."""
        return self.operating_income

    @computed_field
    @property
    def ebitda(self) -> Optional[Decimal]:
        """Earnings Before Interest, Taxes, Depreciation, and Amortization."""
        # This will be calculated when we have depreciation data from cash flow
        return None

    @computed_field
    @property
    def effective_tax_rate(self) -> Optional[Decimal]:
        """Calculate effective tax rate."""
        if self.income_tax_expense is not None and self.net_income is not None:
            # Approximate: Tax Rate = Tax Expense / (Net Income + Tax Expense)
            pre_tax_income = self.net_income + self.income_tax_expense
            if pre_tax_income != 0:
                # Can be negative if there's a tax benefit
                return (self.income_tax_expense / pre_tax_income) * 100
        return None


class BalanceSheet(BaseModel):
    """Balance Sheet with calculated fields and metadata."""

    # Metadata
    metadata: FilingMetadata

    # Assets
    cash_and_equivalents: Optional[Decimal] = Field(
        None, description="Cash and cash equivalents in millions", ge=0
    )
    short_term_investments: Optional[Decimal] = Field(
        None, description="Short-term investments in millions", ge=0
    )
    accounts_receivable: Optional[Decimal] = Field(
        None, description="Accounts receivable in millions", ge=0
    )
    inventory: Optional[Decimal] = Field(None, description="Inventory in millions", ge=0)
    current_assets: Optional[Decimal] = Field(
        None, description="Total current assets in millions", ge=0
    )

    property_plant_equipment: Optional[Decimal] = Field(None, description="PP&E in millions", ge=0)
    intangible_assets: Optional[Decimal] = Field(
        None, description="Intangible assets in millions", ge=0
    )
    goodwill: Optional[Decimal] = Field(None, description="Goodwill in millions", ge=0)
    total_assets: Optional[Decimal] = Field(None, description="Total assets in millions", ge=0)

    # Liabilities
    accounts_payable: Optional[Decimal] = Field(
        None, description="Accounts payable in millions", ge=0
    )
    short_term_debt: Optional[Decimal] = Field(
        None, description="Short-term debt in millions", ge=0
    )
    current_liabilities: Optional[Decimal] = Field(
        None, description="Total current liabilities in millions", ge=0
    )

    long_term_debt: Optional[Decimal] = Field(None, description="Long-term debt in millions", ge=0)
    total_debt: Optional[Decimal] = Field(None, description="Total debt in millions", ge=0)

    # Equity
    common_stock: Optional[Decimal] = Field(None, description="Common stock in millions", ge=0)
    retained_earnings: Optional[Decimal] = Field(None, description="Retained earnings in millions")
    total_equity: Optional[Decimal] = Field(
        None, description="Total shareholders' equity in millions"
    )

    # Calculated Fields
    @computed_field
    @property
    def net_working_capital(self) -> Optional[Decimal]:
        """Calculate net working capital."""
        if self.current_assets and self.current_liabilities:
            return self.current_assets - self.current_liabilities
        return None

    @computed_field
    @property
    def invested_capital(self) -> Optional[Decimal]:
        """Calculate invested capital (equity + debt)."""
        if self.total_equity and self.total_debt:
            return self.total_equity + self.total_debt
        return None

    @computed_field
    @property
    def net_debt(self) -> Optional[Decimal]:
        """Calculate net debt (total debt - cash)."""
        if self.total_debt and self.cash_and_equivalents:
            return self.total_debt - self.cash_and_equivalents
        return None


class CashFlowStatement(BaseModel):
    """Cash Flow Statement with calculated fields and metadata."""

    # Metadata
    metadata: FilingMetadata

    # Operating Cash Flow
    operating_cash_flow: Optional[Decimal] = Field(
        None, description="Operating cash flow in millions"
    )

    # Investing Cash Flow
    capital_expenditures: Optional[Decimal] = Field(
        None, description="Capital expenditures in millions", le=0
    )
    depreciation_amortization: Optional[Decimal] = Field(
        None, description="Depreciation and amortization in millions", ge=0
    )

    # Financing Cash Flow
    dividends_paid: Optional[Decimal] = Field(None, description="Dividends paid in millions", le=0)
    stock_repurchases: Optional[Decimal] = Field(
        None, description="Stock repurchases in millions", le=0
    )
    debt_issuance: Optional[Decimal] = Field(None, description="Debt issuance in millions")
    debt_repayment: Optional[Decimal] = Field(None, description="Debt repayment in millions", le=0)

    # Calculated Fields
    @computed_field
    @property
    def free_cash_flow(self) -> Optional[Decimal]:
        """Calculate free cash flow."""
        if self.operating_cash_flow and self.capital_expenditures:
            return self.operating_cash_flow + self.capital_expenditures  # CapEx is negative
        return None

    @computed_field
    @property
    def capex_to_revenue_ratio(self) -> Optional[Decimal]:
        """Calculate CAPEX to revenue ratio (requires income statement)."""
        # This will be calculated when we combine with income statement
        return None

    @computed_field
    @property
    def da_to_revenue_ratio(self) -> Optional[Decimal]:
        """Calculate D&A to revenue ratio (requires income statement)."""
        # This will be calculated when we combine with income statement
        return None


class MarketData(BaseModel):
    """Market data with metadata."""

    # Metadata
    metadata: FilingMetadata

    # Market Metrics
    current_price: Optional[Decimal] = Field(None, description="Current stock price", gt=0)
    market_cap: Optional[Decimal] = Field(
        None, description="Market capitalization in millions", gt=0
    )
    shares_outstanding: Optional[Decimal] = Field(
        None, description="Shares outstanding in millions", ge=0
    )

    # Valuation Metrics
    pe_ratio: Optional[Decimal] = Field(None, description="Price-to-earnings ratio")
    pb_ratio: Optional[Decimal] = Field(None, description="Price-to-book ratio", gt=0)
    ps_ratio: Optional[Decimal] = Field(None, description="Price-to-sales ratio", gt=0)

    # Risk Metrics
    beta: Optional[Decimal] = Field(None, description="Beta coefficient", ge=0)

    # Calculated Fields
    @computed_field
    @property
    def book_value_per_share(self) -> Optional[Decimal]:
        """Calculate book value per share (requires balance sheet)."""
        # This will be calculated when we combine with balance sheet
        return None


class FinancialStatements(BaseModel):
    """Complete financial statements package."""

    ticker: str = Field(..., description="Company ticker symbol")
    income_statement: IncomeStatement
    balance_sheet: BalanceSheet
    cash_flow_statement: CashFlowStatement
    market_data: MarketData

    # Cross-statement calculated fields
    @computed_field
    @property
    def ebitda(self) -> Optional[Decimal]:
        """Calculate EBITDA using income statement and cash flow data."""
        if self.income_statement.ebit and self.cash_flow_statement.depreciation_amortization:
            return self.income_statement.ebit + self.cash_flow_statement.depreciation_amortization
        return None

    @computed_field
    @property
    def nopat(self) -> Optional[Decimal]:
        """Calculate NOPAT."""
        if self.income_statement.ebit and self.income_statement.effective_tax_rate:
            tax_rate_decimal = self.income_statement.effective_tax_rate / 100
            return self.income_statement.ebit * (1 - tax_rate_decimal)
        return None

    @computed_field
    @property
    def roe(self) -> Optional[Decimal]:
        """Calculate Return on Equity."""
        if (
            self.income_statement.net_income
            and self.balance_sheet.total_equity
            and self.balance_sheet.total_equity > 0
        ):
            return (self.income_statement.net_income / self.balance_sheet.total_equity) * 100
        return None

    @computed_field
    @property
    def roic(self) -> Optional[Decimal]:
        """Calculate Return on Invested Capital."""
        if (
            self.nopat
            and self.balance_sheet.invested_capital
            and self.balance_sheet.invested_capital > 0
        ):
            return (self.nopat / self.balance_sheet.invested_capital) * 100
        return None

    @computed_field
    @property
    def debt_to_equity(self) -> Optional[Decimal]:
        """Calculate debt-to-equity ratio."""
        if (
            self.balance_sheet.total_debt
            and self.balance_sheet.total_equity
            and self.balance_sheet.total_equity > 0
        ):
            return self.balance_sheet.total_debt / self.balance_sheet.total_equity
        return None

    @computed_field
    @property
    def interest_coverage(self) -> Optional[Decimal]:
        """Calculate interest coverage ratio."""
        if (
            self.income_statement.ebit
            and self.income_statement.interest_expense
            and self.income_statement.interest_expense > 0
        ):
            return self.income_statement.ebit / self.income_statement.interest_expense
        return None

    @computed_field
    @property
    def net_debt_to_ebitda(self) -> Optional[Decimal]:
        """Calculate net debt to EBITDA ratio."""
        if self.balance_sheet.net_debt and self.ebitda and self.ebitda > 0:
            return self.balance_sheet.net_debt / self.ebitda
        return None

    @computed_field
    @property
    def free_cash_flow_yield(self) -> Optional[Decimal]:
        """Calculate free cash flow yield."""
        if (
            self.cash_flow_statement.free_cash_flow
            and self.market_data.market_cap
            and self.market_data.market_cap > 0
        ):
            return (self.cash_flow_statement.free_cash_flow / self.market_data.market_cap) * 100
        return None


class HistoricalFinancialData(BaseModel):
    """Historical financial data organized by year."""

    ticker: str = Field(..., description="Company ticker symbol")
    statements: dict[int, FinancialStatements] = Field(
        ..., description="Financial statements by year"
    )

    def get_latest_year(self) -> int:
        """Get the most recent year with data."""
        return max(self.statements.keys()) if self.statements else 0

    def get_latest_statements(self) -> Optional[FinancialStatements]:
        """Get the most recent financial statements."""
        latest_year = self.get_latest_year()
        return self.statements.get(latest_year) if latest_year > 0 else None

    def get_revenue_history(self) -> dict[int, Decimal]:
        """Get historical revenue data."""
        return {
            year: stmt.income_statement.total_revenue
            for year, stmt in self.statements.items()
            if stmt.income_statement.total_revenue
        }

    def get_net_income_history(self) -> dict[int, Decimal]:
        """Get historical net income data."""
        return {
            year: stmt.income_statement.net_income
            for year, stmt in self.statements.items()
            if stmt.income_statement.net_income
        }


__all__ = [
    "BalanceSheet",
    "CashFlowStatement",
    "FilingMetadata",
    "FinancialStatements",
    "HistoricalFinancialData",
    "IncomeStatement",
    "MarketData",
]
