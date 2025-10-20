"""
Data Transformation Core Module

This module contains pure business logic for transforming raw data into structured schemas.
All functions are pure - no I/O, no side effects, just data transformations.
"""

from typing import Any, Dict, Tuple


class DataTransformation:
    """Core business logic for transforming raw data into structured schemas."""

    @staticmethod
    def transform_to_company_info_dict(raw_data: Dict[str, Any], ticker: str) -> Dict[str, Any]:
        """
        Transform raw Yahoo Finance data into CompanyInfo dictionary format.

        Args:
            raw_data: Raw data from Yahoo Finance API
            ticker: Company ticker symbol

        Returns:
            Dictionary with CompanyInfo schema fields
        """
        return {
            "ticker": raw_data.get("ticker", ticker.upper()),
            "name": raw_data.get("name", ""),
            "sector": raw_data.get("sector", ""),
            "industry": raw_data.get("industry", ""),
            "website": raw_data.get("website", ""),
            "description": raw_data.get("description", ""),
            "employees": raw_data.get("employees", 0),
            "city": raw_data.get("city", ""),
            "state": raw_data.get("state", ""),
            "country": raw_data.get("country", ""),
            "exchange": raw_data.get("exchange", ""),
            "currency": raw_data.get("currency", "USD"),
            "founded_year": None,  # Not available in Yahoo Finance data
            "ceo": None,  # Not available in Yahoo Finance data
            "headquarters": None,  # Not available in Yahoo Finance data
            "business_summary": raw_data.get("description", ""),
            "last_updated": raw_data.get("timestamp", ""),  # Map timestamp to last_updated
        }

    @staticmethod
    def find_field_value(data: Dict[str, Any], field_names: list[str]) -> Tuple[Any, bool]:
        """
        Helper to find first matching field from a list of possible names.

        Args:
            data: Dictionary to search
            field_names: List of possible field names to try

        Returns:
            Tuple of (value, found) where found is True if value was found
        """
        for field in field_names:
            if data.get(field):
                return data[field], True
        return None, False

    @staticmethod
    def standardize_financial_data_for_dcf(
        financial_data: Dict[str, Any], market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepare and standardize financial data for DCF calculator.

        This method handles:
        - Converting raw values to millions
        - Standardizing field names
        - Ensuring all required fields are present

        Args:
            financial_data: Raw financial data (may have flexible field names)
            market_data: Market data from Yahoo Finance (raw values)

        Returns:
            Standardized financial data with all values in millions
        """
        prepared_data = {}

        # Standardize Revenue (convert to millions)
        revenue, _ = DataTransformation.find_field_value(
            financial_data,
            ["Total Revenue", "Total net sales", "Revenue", "Net sales", "Total revenue"],
        )
        if revenue:
            prepared_data["Revenue"] = revenue / 1_000_000

        # Standardize EBIT (convert to millions)
        ebit, _ = DataTransformation.find_field_value(
            financial_data,
            [
                "EBIT (Operating Income + Other Income/Expense)",
                "EBIT",
                "Operating income",
                "Operating Income",
            ],
        )
        if ebit:
            prepared_data["EBIT"] = ebit / 1_000_000

        # Standardize Cash (convert to millions)
        cash, cash_found = DataTransformation.find_field_value(
            financial_data, ["Cash and Cash Equivalents", "Cash", "Cash and cash equivalents"]
        )
        if cash_found:
            prepared_data["Cash and Cash Equivalents"] = cash / 1_000_000
        elif market_data.get("total_cash"):
            prepared_data["Cash and Cash Equivalents"] = market_data["total_cash"] / 1_000_000

        # Standardize Shares Outstanding (convert to millions)
        shares, shares_found = DataTransformation.find_field_value(
            financial_data, ["Shares Outstanding", "Diluted", "Basic", "shares_outstanding"]
        )
        if shares_found:
            prepared_data["Shares Outstanding"] = shares / 1_000_000
        elif market_data.get("shares_outstanding"):
            prepared_data["Shares Outstanding"] = market_data["shares_outstanding"] / 1_000_000

        # Standardize Total Debt (convert to millions)
        if "Total Debt" in financial_data:
            prepared_data["Total Debt"] = financial_data["Total Debt"] / 1_000_000
        elif market_data.get("total_debt"):
            prepared_data["Total Debt"] = market_data["total_debt"] / 1_000_000
        else:
            prepared_data["Total Debt"] = 0

        # Pass through optional fields (convert to millions)
        if "Cost of Debt" in financial_data:
            prepared_data["Cost of Debt"] = financial_data["Cost of Debt"]

        if "Interest and other income (expense), net" in financial_data:
            interest_value = financial_data["Interest and other income (expense), net"]
            if interest_value is not None:
                prepared_data["Interest and other income (expense), net"] = (
                    interest_value / 1_000_000
                )

        return prepared_data

    @staticmethod
    def calculate_cost_of_debt(interest_expense: float, total_debt: float) -> float:
        """
        Calculate cost of debt from interest expense and total debt.

        Args:
            interest_expense: Interest expense (can be negative for interest income)
            total_debt: Total debt

        Returns:
            Cost of debt as decimal (e.g., 0.055 for 5.5%)
        """
        if total_debt > 0:
            cost_of_debt = abs(interest_expense) / total_debt
            # Sanity check: 0% to 20%
            if 0 <= cost_of_debt <= 0.20:
                return cost_of_debt
            else:
                return 0.055  # Fallback
        else:
            return 0.055  # Fallback for debt-free companies
