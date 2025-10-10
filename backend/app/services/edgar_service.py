"""
EDGAR Service Layer - Orchestrates EDGAR data fetching and caching operations.

This service handles the coordination between EDGAR data fetching, caching,
and business logic calculations. It follows clean architecture principles
by keeping business logic separate from HTTP concerns.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import pandas as pd
from app.services.cloud_storage_service import CloudStorageService
from edgar import Company, set_identity
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Required by SEC: Identify yourself with your email address
set_identity("alexanderstevens97@gmail.com")


class EdgarService:
    """
    Service layer for EDGAR data operations.
    Handles caching, data fetching, and business logic coordination.
    """

    def __init__(self):
        self.cloud_storage_service = CloudStorageService()

    async def get_annual_ebit(self, ticker: str) -> Dict[str, Any]:
        """
        Get annual EBIT data for a company with caching.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing annual EBIT data
        """
        try:
            # Try to load cached data first
            cached_data = self._get_cached_ebit_data(ticker)
            if cached_data:
                return cached_data

            # If no cached data, fetch from EdgarTools
            logger.info(
                f"Fetching fresh EBIT data for {ticker.upper()} from EdgarTools"
            )
            ebit_data = self._fetch_ebit_data_from_edgar(ticker)

            if not ebit_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"No EBIT data found for {ticker}. Company may not have sufficient 10-K filings.",
                )

            # Calculate CAGR
            cagr_percentage = self._calculate_cagr(ebit_data)

            # Prepare response data
            response_data = {
                "ticker": ticker.upper(),
                "ebit_data": ebit_data,
                "summary": {
                    "latest_ebit": ebit_data[0]["ebit"],
                    "latest_year": ebit_data[0]["year"],
                    "oldest_ebit": ebit_data[-1]["ebit"],
                    "oldest_year": ebit_data[-1]["year"],
                    "average_growth_rate": round(cagr_percentage, 2),
                },
                "metadata": {
                    "total_years": len(ebit_data),
                    "latest_year": ebit_data[0]["year"],
                    "oldest_year": ebit_data[-1]["year"],
                    "average_growth_rate": round(cagr_percentage, 2),
                },
            }

            # Cache the data
            self._cache_ebit_data(ticker, response_data)

            return response_data

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting EBIT data for {ticker}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching EBIT data for {ticker}: {str(e)}",
            )

    def _get_cached_ebit_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get cached EBIT data if available and valid.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Cached data if valid, None otherwise
        """
        try:
            cached_data = self.cloud_storage_service.load_company_data(
                ticker.upper(), "ebit"
            )

            if cached_data and "data" in cached_data:
                # Check if cache is still valid (24 hours for EBIT data)
                cache_timestamp = cached_data.get("timestamp")
                if cache_timestamp:
                    try:
                        cache_time = datetime.fromisoformat(cache_timestamp)
                        if datetime.now() - cache_time < timedelta(hours=24):
                            logger.info(f"Using cached EBIT data for {ticker.upper()}")
                            return cached_data["data"]
                        else:
                            logger.info(
                                f"Cached EBIT data for {ticker.upper()} has expired"
                            )
                    except ValueError:
                        logger.warning(
                            f"Invalid cache timestamp for {ticker.upper()}, using cached data anyway"
                        )
                        return cached_data["data"]
                else:
                    logger.info(
                        f"Using cached EBIT data for {ticker.upper()} (no timestamp)"
                    )
                    return cached_data["data"]

            return None

        except Exception as e:
            logger.debug(f"No cached EBIT data found for {ticker}: {str(e)}")
            return None

    def _fetch_ebit_data_from_edgar(self, ticker: str) -> List[Dict[str, Any]]:
        """
        Fetch EBIT data from EDGAR filings.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of EBIT data by year
        """
        logger.info(f"Starting EDGAR EBIT data fetch for {ticker}")
        company = Company(ticker)

        # Get multiple 10-K filings to get more historical data
        filings = company.get_filings(form="10-K", amendments=False).head(15)
        logger.info(f"Found {len(filings)} 10-K filings for {ticker}")

        all_ebit_data = {}

        for filing in filings:
            try:
                logger.debug(f"Processing filing {filing.filing_date} for {ticker}")

                # Skip amended filings as they often lack XBRL data
                if filing.form.endswith("/A"):
                    logger.info(
                        f"Skipping amended filing {filing.filing_date} for {ticker}"
                    )
                    continue

                # Extract financials from each filing
                logger.info(
                    f"Extracting financials from filing {filing.filing_date} for {ticker}"
                )
                financials = filing.obj().financials

                if not financials:
                    logger.warning(
                        f"No financials found in filing {filing.filing_date} for {ticker}"
                    )
                    continue

                logger.info(f"Financials object type: {type(financials)}")
                logger.info(
                    f"Financials available methods: {[method for method in dir(financials) if not method.startswith('_')]}"
                )

                try:
                    logger.info(
                        f"Attempting to extract income statement from {filing.filing_date}"
                    )
                    income_statement = financials.income_statement().to_dataframe()
                    logger.info(
                        f"Successfully extracted income statement for {filing.filing_date}"
                    )
                    logger.info(f"Income statement shape: {income_statement.shape}")
                    logger.info(
                        f"Income statement columns: {list(income_statement.columns)}"
                    )
                    logger.info(
                        f"Income statement index: {list(income_statement.index)}"
                    )
                except Exception as e:
                    logger.warning(
                        f"No income statement found in filing {filing.filing_date} for {ticker}: {e}"
                    )
                    logger.info(f"Exception type: {type(e)}")
                    logger.info(f"Financials object type: {type(financials)}")
                    logger.info(
                        f"Financials available methods: {[method for method in dir(financials) if not method.startswith('_')]}"
                    )
                    continue

                # Extract EBIT/Operating Income
                ebit_value = self._extract_ebit_from_income_statement(income_statement)

                if ebit_value is not None and ebit_value != 0:
                    filing_year = filing.filing_date.year
                    all_ebit_data[filing_year] = {
                        "year": filing_year,
                        "ebit": ebit_value,
                        "ebit_formatted": f"${ebit_value:,.0f}M",
                        "filing_date": filing.filing_date.isoformat(),
                    }
                    logger.info(
                        f"Successfully extracted EBIT for {ticker} in {filing_year}: ${ebit_value:,.0f}M"
                    )
                else:
                    logger.warning(
                        f"No EBIT value found in filing {filing.filing_date} for {ticker}"
                    )

            except Exception as e:
                logger.warning(
                    f"Error processing filing {filing.filing_date} for {ticker}: {e}"
                )
                continue

        logger.info(f"Total EBIT data points found for {ticker}: {len(all_ebit_data)}")

        # Convert to sorted list
        ebit_data = sorted(
            all_ebit_data.values(), key=lambda x: x["year"], reverse=True
        )

        # Limit to 10 years of data
        return ebit_data[:10]

    def _extract_ebit_from_income_statement(
        self, income_statement: pd.DataFrame
    ) -> Optional[float]:
        """
        Extract EBIT value from income statement DataFrame.

        Args:
            income_statement: Income statement DataFrame

        Returns:
            EBIT value in millions, or None if not found
        """
        # Comprehensive list of EBIT/Operating Income field names
        ebit_fields = [
            "OperatingIncomeLoss",
            "OperatingIncome",
            "OperatingIncomeLossBeforeIncomeTaxes",
            "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
            "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
            "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple",
            "IncomeLossFromContinuingOperationsBeforeIncomeTaxes",
            "OperatingIncomeLossBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest",
            "OperatingIncomeLossBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments",
            "OperatingIncomeLossBeforeIncomeTaxesExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple",
            "OperatingIncomeLossBeforeIncomeTaxesExtraordinaryItems",
            "OperatingIncomeLossBeforeIncomeTaxesMinorityInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndCumulativeEffectOfChangeInAccountingPrinciple",
            "OperatingIncomeLossBeforeIncomeTaxesAndExtraordinaryItems",
            "OperatingIncomeLossBeforeIncomeTaxesAndMinorityInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndNoncontrollingInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpense",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherNonoperatingIncomeExpense",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpense",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNet",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNetOfTax",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNetOfTaxAndMinorityInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterestAndExtraordinaryItems",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherOperatingIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterestAndExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNet",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNetOfTax",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNetOfTaxAndMinorityInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterest",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterestAndExtraordinaryItems",
            "OperatingIncomeLossBeforeIncomeTaxesAndOtherIncomeExpenseNetOfTaxAndMinorityInterestAndNoncontrollingInterestAndExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple",
        ]

        # Log available fields for debugging
        logger.info(f"Income statement shape: {income_statement.shape}")
        logger.info(f"Income statement columns: {list(income_statement.columns)}")

        # Check if we have the 'concept' column (new format)
        if "concept" in income_statement.columns:
            logger.info("Using concept-based field matching")
            concepts = income_statement["concept"].tolist()
            logger.info(f"Available concepts: {concepts}")

            # Try exact concept matches first
            for field in ebit_fields:
                if field in concepts:
                    row_idx = concepts.index(field)
                    # Get the latest year value (first column after concept/label)
                    value_cols = [
                        col
                        for col in income_statement.columns
                        if col
                        not in ["concept", "label", "level", "abstract", "dimension"]
                    ]
                    if value_cols:
                        value = income_statement.iloc[row_idx][value_cols[0]]
                        logger.info(f"Found EBIT field '{field}' with value: {value}")
                        if pd.notna(value) and value != 0:
                            # Convert to millions if needed
                            if (
                                abs(value) > 1000
                            ):  # Assume it's in thousands, convert to millions
                                logger.info(
                                    f"Converting {value} from thousands to millions: {value / 1000}"
                                )
                                return value / 1000
                            logger.info(f"Using EBIT value as-is: {value}")
                            return value

            # Try partial concept matches
            logger.info("No exact EBIT field match found, trying partial matches")
            for i, concept in enumerate(concepts):
                if concept and isinstance(concept, str):
                    concept_str = concept.lower()
                    keywords = [
                        "operating",
                        "income",
                        "loss",
                        "ebit",
                        "profit",
                        "earnings",
                    ]
                    if any(keyword in concept_str for keyword in keywords):
                        value_cols = [
                            col
                            for col in income_statement.columns
                            if col
                            not in [
                                "concept",
                                "label",
                                "level",
                                "abstract",
                                "dimension",
                            ]
                        ]
                        if value_cols:
                            value = income_statement.iloc[i][value_cols[0]]
                            logger.info(
                                f"Partial match concept '{concept}' with value: {value}"
                            )
                            if pd.notna(value) and value != 0:
                                # Convert to millions if needed
                                if abs(value) > 1000:
                                    logger.info(
                                        f"Converting {value} from thousands to millions: {value / 1000}"
                                    )
                                    return value / 1000
                                logger.info(f"Using partial match value as-is: {value}")
                                return value
        else:
            # Old format - field names as index
            logger.info("Using index-based field matching")
            logger.info(
                f"Available income statement fields: {list(income_statement.index)}"
            )

            # Try exact field matches first
            for field in ebit_fields:
                if field in income_statement.index:
                    value = income_statement.loc[field].iloc[0]
                    logger.info(f"Found EBIT field '{field}' with value: {value}")
                    if pd.notna(value) and value != 0:
                        # Convert to millions if needed
                        if (
                            abs(value) > 1000
                        ):  # Assume it's in thousands, convert to millions
                            logger.info(
                                f"Converting {value} from thousands to millions: {value / 1000}"
                            )
                            return value / 1000
                        logger.info(f"Using EBIT value as-is: {value}")
                        return value

            # If no exact match, try partial matches with more comprehensive keywords
            logger.info("No exact EBIT field match found, trying partial matches")
            for field in income_statement.index:
                # Convert field to string and check for keywords
                field_str = str(field).lower()
                keywords = ["operating", "income", "loss", "ebit", "profit", "earnings"]
                if any(keyword in field_str for keyword in keywords):
                    value = income_statement.loc[field].iloc[0]
                    logger.info(f"Partial match field '{field}' with value: {value}")
                    if pd.notna(value) and value != 0:
                        # Convert to millions if needed
                        if abs(value) > 1000:
                            logger.info(
                                f"Converting {value} from thousands to millions: {value / 1000}"
                            )
                            return value / 1000
                        logger.info(f"Using partial match value as-is: {value}")
                        return value

        logger.warning("No EBIT/Operating Income field found in income statement")
        return None

    def _calculate_cagr(self, ebit_data: List[Dict[str, Any]]) -> float:
        """
        Calculate Compound Annual Growth Rate for EBIT data.

        Args:
            ebit_data: List of EBIT data by year

        Returns:
            CAGR as a percentage
        """
        if len(ebit_data) < 2:
            return 0.0

        latest_ebit = ebit_data[0]["ebit"]
        oldest_ebit = ebit_data[-1]["ebit"]
        years = ebit_data[0]["year"] - ebit_data[-1]["year"]

        if years <= 0 or oldest_ebit <= 0:
            return 0.0

        cagr = ((latest_ebit / oldest_ebit) ** (1 / years)) - 1
        return cagr * 100

    def _cache_ebit_data(self, ticker: str, data: Dict[str, Any]) -> None:
        """
        Cache EBIT data to cloud storage.

        Args:
            ticker: Stock ticker symbol
            data: Data to cache
        """
        try:
            self.cloud_storage_service.save_company_data(
                ticker.upper(),
                "ebit",
                data,
                metadata=data.get("metadata", {}),
            )
            logger.info(f"Cached EBIT data for {ticker.upper()}")
        except Exception as cache_error:
            logger.warning(
                f"Failed to cache EBIT data for {ticker.upper()}: {cache_error}"
            )
            # Don't fail the request if caching fails
