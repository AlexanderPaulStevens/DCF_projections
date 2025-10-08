import logging
from datetime import datetime, timedelta
from typing import Any, Dict

import pandas as pd
from app.services.cloud_storage_service import CloudStorageService
from edgar import Company, set_identity
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

# Required by SEC: Identify yourself with your email address
set_identity("alexanderstevens97@gmail.com")

router = APIRouter(prefix="/edgar", tags=["edgar"])

# Initialize cloud storage service
cloud_storage_service = CloudStorageService()


@router.get("/revenue/{ticker}")
async def get_annual_revenue(ticker: str) -> Dict[str, Any]:
    """
    Get annual revenue data for a company using EdgarTools.
    Fetches data from multiple 10-K filings to get up to 10 years of historical data.
    Caches the data to Google Cloud Storage for future requests.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dictionary containing annual revenue data
    """
    try:
        # Try to load cached data first
        cached_data = cloud_storage_service.load_company_data(ticker.upper(), "revenue")

        if cached_data and "data" in cached_data:
            # Check if cache is still valid (24 hours for revenue data)
            cache_timestamp = cached_data.get("timestamp")
            if cache_timestamp:
                try:
                    cache_time = datetime.fromisoformat(cache_timestamp)
                    if datetime.now() - cache_time < timedelta(hours=24):
                        logger.info(f"Using cached revenue data for {ticker.upper()}")
                        return cached_data["data"]
                    else:
                        logger.info(
                            f"Cached revenue data for {ticker.upper()} has expired"
                        )
                except ValueError:
                    logger.warning(
                        f"Invalid cache timestamp for {ticker.upper()}, using cached data anyway"
                    )
                    return cached_data["data"]
            else:
                logger.info(
                    f"Using cached revenue data for {ticker.upper()} (no timestamp)"
                )
                return cached_data["data"]

        # If no cached data, fetch from EdgarTools
        logger.info(f"Fetching fresh revenue data for {ticker.upper()} from EdgarTools")
        company = Company(ticker)

        # Get multiple 10-K filings to get more historical data
        # Exclude amended filings as they often lack full XBRL data
        filings = company.get_filings(form="10-K", amendments=False).head(
            15
        )  # Get last 15 filings, exclude amendments

        all_revenue_data = {}

        for filing in filings:
            try:
                # Skip amended filings as they often lack XBRL data
                if filing.form.endswith("/A"):
                    logger.info(
                        f"Skipping amended filing {filing.filing_date} for {ticker}"
                    )
                    continue

                # Extract financials from each filing
                financials = filing.obj().financials

                # Check if financials exist and have income statement
                if not financials:
                    logger.warning(
                        f"No financials found in filing {filing.filing_date} for {ticker}"
                    )
                    continue

                try:
                    income_statement = financials.income_statement().to_dataframe()
                except Exception as e:
                    logger.warning(
                        f"No income statement found in filing {filing.filing_date} for {ticker}: {e}"
                    )
                    continue

                if income_statement.empty:
                    logger.warning(
                        f"Empty income statement in filing {filing.filing_date} for {ticker}"
                    )
                    continue

                # Look for total revenue concept - try multiple revenue concepts
                revenue_concepts = [
                    "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
                    "us-gaap_Revenues",
                    "us-gaap_SalesRevenueNet",
                    "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax",
                ]

                total_revenue_concept = None
                for concept in revenue_concepts:
                    concept_data = income_statement[
                        (income_statement["concept"] == concept)
                        & (income_statement["abstract"] == False)
                        & (income_statement["dimension"] == False)
                    ]
                    if not concept_data.empty:
                        total_revenue_concept = concept_data
                        logger.debug(f"Found revenue data using concept: {concept}")
                        break

                if (
                    total_revenue_concept is not None
                    and not total_revenue_concept.empty
                ):
                    revenue_row = total_revenue_concept.iloc[0]

                    # Extract year columns from this filing
                    year_columns = [
                        col for col in income_statement.columns if col.startswith("20")
                    ]

                    for year_col in year_columns:
                        try:
                            # Handle empty strings and other non-numeric values
                            value = revenue_row[year_col]

                            # More robust validation
                            if (
                                pd.notna(value)
                                and value != 0
                                and value != ""
                                and str(value).strip() != ""
                                and str(value).strip() != "nan"
                                and str(value).strip() != "None"
                            ):

                                year = int(year_col.split("-")[0])
                                revenue = float(value)

                                # Only add if we don't already have this year (prefer more recent filings)
                                if year not in all_revenue_data and revenue > 0:
                                    all_revenue_data[year] = {
                                        "year": year,
                                        "revenue": revenue,
                                        "revenue_formatted": (
                                            f"${revenue:,.0f}M"
                                            if revenue >= 1
                                            else f"${revenue:,.2f}M"
                                        ),
                                    }
                        except (ValueError, TypeError) as e:
                            logger.debug(
                                f"Error parsing revenue value for {year_col}: {value}, error: {e}"
                            )
                            continue
                else:
                    logger.debug(
                        f"No revenue concept found in filing {filing.filing_date} for {ticker}"
                    )

            except Exception as e:
                logger.warning(
                    f"Error processing filing {filing.filing_date} for {ticker}: {e}"
                )
                continue

        if all_revenue_data:
            # Convert to sorted list
            revenue_data = sorted(
                all_revenue_data.values(), key=lambda x: x["year"], reverse=True
            )

            # Limit to 10 years
            revenue_data = revenue_data[:10]

            # Calculate growth rates (corrected for reverse chronological order)
            for i in range(1, len(revenue_data)):
                current_revenue = revenue_data[i - 1][
                    "revenue"
                ]  # Newer year (e.g., 2024)
                previous_revenue = revenue_data[i]["revenue"]  # Older year (e.g., 2023)

                if previous_revenue > 0:
                    growth_rate = (
                        (current_revenue - previous_revenue) / previous_revenue
                    ) * 100
                    revenue_data[i - 1]["growth_rate"] = round(growth_rate, 2)
                else:
                    revenue_data[i - 1]["growth_rate"] = 0

            # Calculate average growth rate
            growth_rates = [
                item["growth_rate"]
                for item in revenue_data[:-1]
                if "growth_rate" in item
            ]
            avg_growth_rate = (
                sum(growth_rates) / len(growth_rates) if growth_rates else 0
            )

            logger.info(
                f"Retrieved {len(revenue_data)} years of revenue data for {ticker}"
            )

            # Prepare the response data
            response_data = {
                "ticker": ticker.upper(),
                "revenue_data": revenue_data,
                "summary": {
                    "latest_revenue": revenue_data[0]["revenue"],
                    "latest_year": revenue_data[0]["year"],
                    "oldest_revenue": revenue_data[-1]["revenue"],
                    "oldest_year": revenue_data[-1]["year"],
                    "average_growth_rate": round(avg_growth_rate, 2),
                    "total_years": len(revenue_data),
                },
                "source": "SEC EdgarTools (Multiple Filings)",
                "cache_timestamp": datetime.now().isoformat(),
            }

            # Cache the data to Google Cloud Storage
            try:
                cloud_storage_service.save_company_data(
                    ticker.upper(),
                    "revenue",
                    response_data,
                    metadata={
                        "total_years": len(revenue_data),
                        "latest_year": revenue_data[0]["year"],
                        "oldest_year": revenue_data[-1]["year"],
                        "average_growth_rate": round(avg_growth_rate, 2),
                    },
                )
                logger.info(f"Cached revenue data for {ticker.upper()}")
            except Exception as cache_error:
                logger.warning(
                    f"Failed to cache revenue data for {ticker.upper()}: {cache_error}"
                )
                # Don't fail the request if caching fails

            return response_data

        # Fallback: try the built-in get_revenue method for latest year
        try:
            latest_10k = company.get_filings(form="10-K").latest()
            financials = latest_10k.obj().financials
            latest_revenue = financials.get_revenue()
            if latest_revenue and latest_revenue > 0:
                logger.info(
                    f"Using built-in get_revenue method for {ticker}: ${latest_revenue:,.0f}"
                )

                # Prepare the response data
                response_data = {
                    "ticker": ticker.upper(),
                    "revenue_data": [
                        {
                            "year": 2024,  # Current year
                            "revenue": latest_revenue,
                            "revenue_formatted": f"${latest_revenue:,.0f}M",
                        }
                    ],
                    "summary": {
                        "latest_revenue": latest_revenue,
                        "latest_year": 2024,
                        "oldest_revenue": latest_revenue,
                        "oldest_year": 2024,
                        "average_growth_rate": 0,
                        "total_years": 1,
                    },
                    "source": "SEC EdgarTools (built-in method)",
                    "cache_timestamp": datetime.now().isoformat(),
                }

                # Cache the fallback data
                try:
                    cloud_storage_service.save_company_data(
                        ticker.upper(),
                        "revenue",
                        response_data,
                        metadata={
                            "total_years": 1,
                            "latest_year": 2024,
                            "oldest_year": 2024,
                            "average_growth_rate": 0,
                            "fallback_method": True,
                        },
                    )
                    logger.info(f"Cached fallback revenue data for {ticker.upper()}")
                except Exception as cache_error:
                    logger.warning(
                        f"Failed to cache fallback revenue data for {ticker.upper()}: {cache_error}"
                    )

                return response_data
        except Exception as e:
            logger.error(f"Built-in get_revenue also failed: {e}")

        raise HTTPException(
            status_code=404, detail=f"No revenue data found for ticker {ticker}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving data for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching revenue data for {ticker}",
        )


def get_company_revenue_data(ticker: str, years: int = 10):
    """
    Get annual revenue data for a company using EdgarTools.

    Args:
        ticker: Company ticker symbol
        years: Number of years to retrieve (default: 10)

    Returns:
        Dictionary containing revenue data
    """
    try:
        company = Company(ticker)

        # Get the latest 10-K filing
        latest_10k = company.get_filings(form="10-K").latest()

        # Extract financials
        financials = latest_10k.obj().financials

        # Get income statement data and convert to DataFrame
        income_statement = financials.income_statement().to_dataframe()

        print(f"✅ Successfully retrieved financial data for {ticker}")

        # Look for total revenue concept
        total_revenue_concept = income_statement[
            (
                income_statement["concept"]
                == "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax"
            )
            & (income_statement["abstract"] == False)
            & (income_statement["dimension"] == False)
        ]

        if not total_revenue_concept.empty:
            # Get the first row (should be total revenue)
            revenue_row = total_revenue_concept.iloc[0]

            # Extract year columns (they are date strings)
            year_columns = [
                col for col in income_statement.columns if col.startswith("20")
            ]
            year_columns.sort(reverse=True)  # Most recent first

            revenue_data = []
            for year_col in year_columns[:years]:
                if pd.notna(revenue_row[year_col]) and revenue_row[year_col] != 0:
                    year = int(year_col.split("-")[0])  # Extract year from date
                    revenue = float(revenue_row[year_col])
                    revenue_data.append(
                        {
                            "year": year,
                            "revenue": revenue,
                            "revenue_formatted": (
                                f"${revenue:,.0f}M"
                                if revenue >= 1
                                else f"${revenue:,.2f}M"
                            ),
                        }
                    )

            if revenue_data:
                print(f"Revenue data for {ticker}:")
                for item in revenue_data:
                    print(f"  {item['year']}: {item['revenue_formatted']}")

                return {
                    "ticker": ticker,
                    "revenue_data": revenue_data,
                    "source": "SEC EdgarTools",
                }

        # Fallback: try the built-in get_revenue method for latest year
        try:
            latest_revenue = financials.get_revenue()
            if latest_revenue and latest_revenue > 0:
                print(
                    f"✅ Using built-in get_revenue method for {ticker}: ${latest_revenue:,.0f}"
                )
                return {
                    "ticker": ticker,
                    "revenue_data": [
                        {
                            "year": 2024,  # Current year
                            "revenue": latest_revenue,
                            "revenue_formatted": f"${latest_revenue:,.0f}M",
                        }
                    ],
                    "source": "SEC EdgarTools (built-in method)",
                }
        except Exception as e:
            print(f"❌ Built-in get_revenue also failed: {e}")

        print(f"❌ No revenue data found for {ticker}")
        return None

    except Exception as e:
        print(f"❌ Error retrieving data for {ticker}: {str(e)}")
        return None


# Test the function
if __name__ == "__main__":
    print("🧪 Testing EdgarTools integration...")

    # Test with Microsoft
    result = get_company_revenue_data("MSFT", years=5)

    if result:
        print("🎉 EdgarTools test successful!")
        print(f"Retrieved {len(result['revenue_data'])} years of data")
    else:
        print("❌ EdgarTools test failed")
