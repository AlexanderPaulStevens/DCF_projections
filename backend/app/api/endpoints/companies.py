"""
Company analysis API endpoints.
Works only with cached data from company_data folder.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.core.paths import get_company_data_dir
from backend.app.schemas.company import (
    BusinessStrategyAnalysis,
    CompanyOverview,
    CompanySearchResult,
    CompetitiveAdvantageAnalysis,
    CompetitiveAnalysis,
    ComprehensiveAnalysis,
    DCFAnalysis,
    FinancialRatios,
    ForecastAnalysis,
    SensitivityAnalysis,
    StockData,
)
import json
from datetime import datetime

from backend.app.core.financial_ratios import FinancialRatiosAnalyzer
from backend.app.core.competitive_analyzer import CompetitiveAnalyzer
from backend.app.core.business_strategy_analyzer import BusinessStrategyAnalyzer
from backend.app.core.competitive_advantage_analyzer import CompetitiveAdvantageAnalyzer
from backend.app.services.dcf_service import DCFService
from backend.app.services.yahoo_finance_service import YahooFinanceService

# Initialize router
router = APIRouter(prefix="/api/companies", tags=["companies"])

# Initialize services
dcf_service = DCFService()
yahoo_service = YahooFinanceService()


# Shared company data directory
company_data_dir = get_company_data_dir()


def get_cached_companies() -> List[Dict[str, Any]]:
    """Get list of companies with cached data."""
    if not company_data_dir.exists():
        return []

    companies = []
    for company_dir in company_data_dir.iterdir():
        if company_dir.is_dir() and company_dir.name.isupper():
            ticker = company_dir.name

            # Check if company has financial data
            analysis_files = list(company_dir.glob("financial_analysis_*.json"))
            if analysis_files:
                companies.append(
                    {
                        "ticker": ticker,
                        "name": ticker,  # Use ticker as name for now
                        "sector": None,
                        "has_data": True,
                    }
                )

    return companies


def get_cached_financial_data(ticker: str) -> Optional[Dict[str, Any]]:
    """Get cached financial data for a company."""
    company_dir = company_data_dir / ticker
    if not company_dir.exists():
        return None

    # Find financial analysis files with various naming patterns
    analysis_files = []

    # Look for different possible patterns
    patterns = [
        "financial_analysis_*.json",
        "financial_analysis_*.json",
        "*financial_analysis*.json",
    ]

    for pattern in patterns:
        files = list(company_dir.glob(pattern))
        analysis_files.extend(files)

    # Remove duplicates and filter for actual financial data files
    analysis_files = list(set(analysis_files))
    analysis_files = [
        f for f in analysis_files if f.name.startswith("financial_analysis")
    ]

    if not analysis_files:
        return None

    # Get the most recent file
    latest_file = max(analysis_files, key=lambda x: x.stat().st_mtime)

    try:
        with open(latest_file, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"Error reading financial data file {latest_file}: {e}")
        return None


@router.get("/search", response_model=List[CompanySearchResult])
async def search_companies(
    query: str = Query(
        ..., min_length=1, description="Search query for company name or ticker"
    ),
):
    """
    Search for companies by name or ticker (cached data only).

    Args:
        query: Search query (company name or ticker)

    Returns:
        List of matching companies with cached data
    """
    try:
        # Get cached companies
        companies = get_cached_companies()

        # Filter by query
        query_lower = query.lower()
        matching_companies = []

        for company in companies:
            if (
                query_lower in company.get("ticker", "").lower()
                or query_lower in company.get("name", "").lower()
            ):
                matching_companies.append(
                    CompanySearchResult(
                        ticker=company.get("ticker", ""),
                        name=company.get("name", ""),
                        sector=company.get("sector"),
                    )
                )

        return matching_companies[:20]  # Limit results

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error searching companies: {str(e)}"
        )


@router.get("/list", response_model=List[CompanySearchResult])
async def list_companies(
    limit: int = Query(
        50, ge=1, le=500, description="Maximum number of companies to return"
    ),
):
    """
    Get list of companies with cached data.

    Args:
        limit: Maximum number of companies to return

    Returns:
        List of companies with cached data
    """
    try:
        companies = get_cached_companies()

        # Convert to response model
        company_list = []
        for company in companies[:limit]:
            company_list.append(
                CompanySearchResult(
                    ticker=company.get("ticker", ""),
                    name=company.get("name", ""),
                    sector=company.get("sector"),
                )
            )

        return company_list

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error listing companies: {str(e)}"
        )


@router.get("/{ticker}/overview", response_model=CompanyOverview)
async def get_company_overview(ticker: str):
    """
    Get company overview (cached data only).

    Args:
        ticker: Company ticker symbol

    Returns:
        Company overview data
    """
    try:
        # Check if company data exists
        if not company_data_dir.exists():
            raise HTTPException(
                status_code=404,
                detail="No company data found. Run scraping scripts first.",
            )

        company_dir = company_data_dir / ticker
        if not company_dir.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Company {ticker} not found. Run scraping script first.",
            )

        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Get overview (this would need to be implemented in CompanyAnalyzer)
        overview = {
            "ticker": ticker,
            "has_financial_data": True,
            "data_source": "cached",
        }

        return CompanyOverview(
            ticker=ticker, overview=overview, financial_data=financial_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting company overview: {str(e)}"
        )


@router.get("/{ticker}/ratios", response_model=FinancialRatios)
async def get_financial_ratios(ticker: str):
    """
    Get financial ratios (cached data only).

    Args:
        ticker: Company ticker symbol

    Returns:
        Financial ratios data
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Look for existing financial ratios CSV files
        company_dir = company_data_dir / ticker
        ratios_files = list(company_dir.glob("financial_ratios_*.csv"))

        if ratios_files:
            # Get the most recent ratios file
            latest_ratios_file = max(ratios_files, key=lambda x: x.stat().st_mtime)

            try:
                import pandas as pd

                df = pd.read_csv(latest_ratios_file)
                ratios_dict = {}

                for _, row in df.iterrows():
                    ratio_name = row["Ratio"]
                    ratio_value = row["Value"]

                    # Convert to float if possible and format properly
                    try:
                        ratio_value = float(ratio_value)

                        # Format ratios appropriately
                        if "Yield" in ratio_name:
                            # Convert decimal to percentage (e.g., 0.028 -> 2.8%)
                            ratio_value = f"{ratio_value * 100:.2f}%"
                        elif "Ratio" in ratio_name:
                            # Format ratios to 2 decimal places
                            ratio_value = f"{ratio_value:.2f}"
                        else:
                            # Default formatting
                            ratio_value = f"{ratio_value:.2f}"
                    except (ValueError, TypeError):
                        # Keep original value if conversion fails
                        ratio_value = str(ratio_value)

                    ratios_dict[ratio_name] = ratio_value

                # Don't add metadata fields - keep only the ratios

            except Exception:
                # Fallback to calculating ratios from financial data
                ratios_analyzer = FinancialRatiosAnalyzer(ticker)
                ratios_dict = ratios_analyzer.get_ratios_summary()
        else:
            # Calculate ratios from financial data if no CSV exists
            ratios_analyzer = FinancialRatiosAnalyzer(ticker)
            ratios_dict = ratios_analyzer.get_ratios_summary()

        return FinancialRatios(
            ticker=ticker, ratios=ratios_dict, raw_data=financial_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting financial ratios: {str(e)}"
        )


@router.get("/{ticker}/dcf", response_model=DCFAnalysis)
async def get_dcf_analysis(ticker: str):
    """
    Get DCF analysis (cached data only).

    Args:
        ticker: Company ticker symbol

    Returns:
        DCF analysis results
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Look for existing DCF analysis files
        company_dir = company_data_dir / ticker
        dcf_files = list(company_dir.glob("*dcf_analysis*.json"))

        if dcf_files:
            # Get the most recent DCF analysis file
            latest_dcf_file = max(dcf_files, key=lambda x: x.stat().st_mtime)

            try:
                with open(latest_dcf_file, "r") as f:
                    dcf_data = json.load(f)

                # Extract the DCF analysis data
                if "dcf_results" in dcf_data:
                    dcf_results = dcf_data["dcf_results"]

                    # Create the response format
                    base_results = {
                        "enterprise_value": dcf_results.get("enterprise_value", 0),
                        "equity_value": dcf_results.get("equity_value", 0),
                        "per_share_value": dcf_results.get("per_share_value", 0),
                        "growth_rate": dcf_results.get("growth_rate", 0.15),
                    }

                    scenarios = []
                    if "scenarios" in dcf_results:
                        for scenario in dcf_results["scenarios"]:
                            scenarios.append(
                                {
                                    "growth_rate": scenario.get("growth_rate", 0.15),
                                    "enterprise_value": scenario.get(
                                        "enterprise_value", 0
                                    ),
                                    "equity_value": scenario.get("equity_value", 0),
                                    "per_share_value": scenario.get(
                                        "per_share_value", 0
                                    ),
                                }
                            )

                    parameters = dcf_data.get("parameters", {})

                    return DCFAnalysis(
                        ticker=ticker,
                        base_results=base_results,
                        scenarios=scenarios,
                        parameters=parameters,
                    )
                else:
                    # Fallback to calculating DCF from financial data
                    return await calculate_dcf_from_data(ticker, financial_data)

            except Exception:
                # Fallback to calculating DCF from financial data
                return await calculate_dcf_from_data(ticker, financial_data)
        else:
            # Calculate DCF from financial data if no analysis file exists
            return await calculate_dcf_from_data(ticker, financial_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting DCF analysis: {str(e)}"
        )


async def calculate_dcf_from_data(
    ticker: str, financial_data: Dict[str, Any]
) -> DCFAnalysis:
    """
    Calculate DCF analysis from cached financial data.

    Args:
        ticker: Company ticker symbol
        financial_data: Cached financial data

    Returns:
        DCF analysis results
    """
    try:
        # Use the real DCF service for calculations
        from backend.app.services.dcf_service import DCFService

        # Convert financial data to the format expected by DCFCalculator
        # The financial_data structure from get_cached_financial_data is: {timestamp, financial_metrics, calculated_metrics, analysis_notes}
        converted_financial_data = {}

        # Extract financial_metrics from the data structure
        if "financial_metrics" in financial_data:
            # Assume this is the latest year's data
            latest_year = 2024  # Default to 2024
            converted_financial_data[latest_year] = financial_data["financial_metrics"]
        else:
            # Check if this is the expected multi-year format
            if any(
                isinstance(key, str) and key.isdigit() for key in financial_data.keys()
            ):
                # Multi-year format: {year: {financial_metrics: {...}}}
                for year, data in financial_data.items():
                    if isinstance(year, str) and year.isdigit():
                        converted_financial_data[int(year)] = data.get(
                            "financial_metrics", {}
                        )

        # Create DCF service and calculator
        dcf_service = DCFService()
        dcf_service.create_dcf_calculator(ticker, converted_financial_data)

        # Run DCF analysis
        dcf_results = dcf_service.run_dcf_analysis()

        # Create response format
        base_results = {
            "enterprise_value": dcf_results.get("enterprise_value", 0),
            "equity_value": dcf_results.get("equity_value", 0),
            "per_share_value": dcf_results.get("per_share_value", 0),
            "growth_rate": dcf_results.get("growth_rate", 0.15),
        }

        # Create scenarios (empty for now, can be expanded later)
        scenarios = []

        parameters = {
            "base_growth_rate": dcf_results.get("growth_rate", 0.15),
            "projection_years": 5,
            "data_source": "cached",
            "calculation_method": "dcf_calculator",
        }

        return DCFAnalysis(
            ticker=ticker,
            base_results=base_results,
            scenarios=scenarios,
            parameters=parameters,
        )

    except Exception as e:
        # Add more detailed error logging
        import traceback

        error_details = f"Error calculating DCF analysis: {str(e)}\nTraceback: {traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_details)


@router.get("/{ticker}/sensitivity", response_model=SensitivityAnalysis)
async def get_sensitivity_analysis(
    ticker: str,
    steps: int = Query(11, ge=3, le=21, description="Number of sensitivity steps"),
):
    """
    Get sensitivity analysis (cached data only).

    Args:
        ticker: Company ticker symbol
        steps: Number of sensitivity steps (3-21)

    Returns:
        Sensitivity analysis results
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Look for sensitivity analysis files
        company_dir = company_data_dir / ticker
        sensitivity_files = list(company_dir.glob("*sensitivity*.json"))

        if not sensitivity_files:
            raise HTTPException(
                status_code=404,
                detail=f"No sensitivity analysis data found for {ticker}. Run sensitivity analysis first.",
            )

        # Get the most recent sensitivity analysis file
        latest_file = max(sensitivity_files, key=lambda x: x.stat().st_mtime)

        try:
            with open(latest_file, "r") as f:
                sensitivity_data = json.load(f)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error reading sensitivity data: {str(e)}"
            )

        # Extract the sensitivity analysis data
        if "sensitivity_analysis" not in sensitivity_data:
            raise HTTPException(
                status_code=500, detail="Invalid sensitivity analysis data format"
            )

        # Get the first variable analyzed (usually earnings_growth_rate)
        variables = list(sensitivity_data["sensitivity_analysis"].keys())
        if not variables:
            raise HTTPException(
                status_code=500, detail="No variables found in sensitivity analysis"
            )

        variable_name = variables[0]  # Use the first variable
        variable_data = sensitivity_data["sensitivity_analysis"][variable_name]

        # Create the response format
        base_value = variable_data.get("base_value", 0.15)
        changes = variable_data.get("changes", [-0.5, 0, 0.5])
        enterprise_values = variable_data.get(
            "enterprise_values", [4000000, 5000000, 6000000]
        )

        # Create sensitivity steps
        sensitivity_steps = []
        for i, change in enumerate(changes):
            if i < len(enterprise_values):
                sensitivity_steps.append(
                    {
                        "step": i + 1,
                        "variable_value": base_value + change,
                        "enterprise_value": enterprise_values[i],
                        "percentage_change": (
                            (enterprise_values[i] / enterprise_values[1]) - 1
                        )
                        * 100
                        if len(enterprise_values) > 1
                        else 0,
                    }
                )

        return SensitivityAnalysis(
            ticker=ticker,
            variable=variable_name,
            base_value=base_value,
            steps=sensitivity_steps,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting sensitivity analysis: {str(e)}"
        )


@router.get("/{ticker}/forecast", response_model=ForecastAnalysis)
async def get_forecast_analysis(ticker: str):
    """
    Get live stock price forecast using Prophet.

    Args:
        ticker: Company ticker symbol

    Returns:
        Live Prophet forecast analysis results
    """
    try:
        # Import Prophet service
        from app.services.prophet_service import ProphetService

        # Create Prophet service instance
        prophet_service = ProphetService()

        # Generate live forecast
        forecast_data = prophet_service.get_forecast(ticker, periods=365)

        # Set the ticker
        forecast_data["ticker"] = ticker

        return ForecastAnalysis(
            ticker=ticker,
            current_price=forecast_data.get("current_price", 0),
            forecast_price=forecast_data.get("forecast_price", 0),
            forecast_trend=forecast_data.get("forecast_trend", 0),
            confidence_lower=forecast_data.get("confidence_lower", 0),
            confidence_upper=forecast_data.get("confidence_upper", 0),
            forecast_dates=forecast_data.get("forecast_dates", []),
            forecast_values=forecast_data.get("forecast_values", []),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating live forecast: {str(e)}"
        )


@router.get("/{ticker}/stock-data", response_model=StockData)
async def get_stock_data(ticker: str):
    """
    Get real-time stock data from Yahoo Finance.

    Args:
        ticker: Company ticker symbol

    Returns:
        Real-time stock data
    """
    try:
        stock_data = yahoo_service.get_stock_info(ticker)

        if not stock_data:
            raise HTTPException(
                status_code=404,
                detail=f"Could not fetch stock data for {ticker}",
            )

        return StockData(**stock_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting stock data: {str(e)}"
        )


@router.get("/{ticker}/historical-data")
async def get_historical_data(
    ticker: str,
    period: str = Query(
        "1y",
        description="Period for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)",
    ),
    include_forecast: bool = Query(
        False,
        description="Whether to include forecast data extending the historical data",
    ),
):
    """
    Get historical stock data from Yahoo Finance, optionally extended with forecast data.

    Args:
        ticker: Company ticker symbol
        period: Period for historical data
        include_forecast: Whether to include forecast data extending the historical data

    Returns:
        Historical stock data, optionally extended with forecast data
    """
    try:
        hist_data = yahoo_service.get_historical_data(ticker, period)

        if hist_data is None or hist_data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Could not fetch historical data for {ticker}",
            )

        # Convert DataFrame to list of dictionaries
        result = {
            "ticker": ticker,
            "period": period,
            "data": hist_data.to_dict("records"),
        }

        # If forecast is requested, extend the data
        if include_forecast:
            try:
                # Import Prophet service
                from backend.app.services.prophet_service import ProphetService

                # Create Prophet service instance
                prophet_service = ProphetService()

                # Generate forecast (default 90 days to extend the chart nicely)
                forecast_data = prophet_service.get_forecast(ticker, periods=90)

                # Add forecast data to the result
                result["forecast"] = {
                    "forecast_dates": forecast_data.get("forecast_dates", []),
                    "forecast_values": forecast_data.get("forecast_values", []),
                    "confidence_lower": forecast_data.get("confidence_lower", 0),
                    "confidence_upper": forecast_data.get("confidence_upper", 0),
                    "current_price": forecast_data.get("current_price", 0),
                    "forecast_price": forecast_data.get("forecast_price", 0),
                    "forecast_trend": forecast_data.get("forecast_trend", 0),
                }

            except Exception as forecast_error:
                # If forecast fails, just return historical data without forecast
                print(f"Forecast generation failed for {ticker}: {forecast_error}")
                result["forecast_error"] = str(forecast_error)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting historical data: {str(e)}"
        )


@router.get("/{ticker}/competitive-analysis", response_model=CompetitiveAnalysis)
async def get_competitive_analysis(
    ticker: str,
    max_competitors: int = Query(
        5, ge=1, le=10, description="Maximum number of competitors to analyze"
    ),
):
    """
    Get competitive analysis comparing the company with its direct competitors.

    Args:
        ticker: Company ticker symbol
        max_competitors: Maximum number of competitors to analyze

    Returns:
        Competitive analysis results
    """
    try:
        # Initialize competitive analyzer
        competitive_analyzer = CompetitiveAnalyzer(ticker)

        # Get competitive insights
        analysis_data = competitive_analyzer.get_competitive_insights(max_competitors)

        if "error" in analysis_data:
            raise HTTPException(status_code=500, detail=analysis_data["error"])

        return CompetitiveAnalysis(**analysis_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting competitive analysis: {str(e)}"
        )


@router.get("/{ticker}/business-strategy", response_model=BusinessStrategyAnalysis)
async def get_business_strategy_analysis(ticker: str):
    """
    Get business strategy analysis and survival metrics.

    Args:
        ticker: Company ticker symbol

    Returns:
        Business strategy analysis results
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Initialize business strategy analyzer
        strategy_analyzer = BusinessStrategyAnalyzer(ticker, financial_data)

        # Get business strategy analysis
        analysis_data = strategy_analyzer.analyze_business_strategy()

        if "error" in analysis_data:
            raise HTTPException(status_code=500, detail=analysis_data["error"])

        return BusinessStrategyAnalysis(**analysis_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting business strategy analysis: {str(e)}",
        )


@router.get("/{ticker}/competitive-analysis-debug")
async def debug_competitive_analysis(ticker: str):
    """
    Debug endpoint for competitive analysis to help troubleshoot issues.

    Args:
        ticker: Company ticker symbol

    Returns:
        Debug information about the competitive analysis process
    """
    try:
        from backend.app.core.competitive_analyzer import CompetitiveAnalyzer

        analyzer = CompetitiveAnalyzer(ticker)

        # Test each step individually
        debug_info = {"ticker": ticker, "steps": {}}

        # Step 1: Get sector info
        try:
            sector, industry = analyzer.get_company_sector_info()
            debug_info["steps"]["sector_info"] = {
                "success": True,
                "sector": sector,
                "industry": industry,
            }
        except Exception as e:
            debug_info["steps"]["sector_info"] = {"success": False, "error": str(e)}

        # Step 2: Identify competitors
        try:
            competitors = analyzer.identify_direct_competitors(5)
            debug_info["steps"]["identify_competitors"] = {
                "success": True,
                "competitors": competitors,
            }
        except Exception as e:
            debug_info["steps"]["identify_competitors"] = {
                "success": False,
                "error": str(e),
            }

        # Step 3: Get target company data
        try:
            target_data = analyzer.get_target_company_data()
            debug_info["steps"]["target_company_data"] = {
                "success": target_data is not None,
                "data": target_data.__dict__ if target_data else None,
            }
        except Exception as e:
            debug_info["steps"]["target_company_data"] = {
                "success": False,
                "error": str(e),
            }

        # Step 4: Test competitor data fetching
        try:
            test_competitors = ["AAPL", "MSFT", "GOOGL"]
            competitor_results = []
            for comp_ticker in test_competitors:
                try:
                    comp_data = analyzer.get_competitor_data(comp_ticker)
                    competitor_results.append(
                        {
                            "ticker": comp_ticker,
                            "success": comp_data is not None,
                            "data": comp_data.__dict__ if comp_data else None,
                        }
                    )
                except Exception as e:
                    competitor_results.append(
                        {"ticker": comp_ticker, "success": False, "error": str(e)}
                    )

            debug_info["steps"]["competitor_data_test"] = {
                "success": True,
                "results": competitor_results,
            }
        except Exception as e:
            debug_info["steps"]["competitor_data_test"] = {
                "success": False,
                "error": str(e),
            }

        return debug_info

    except Exception as e:
        return {"error": f"Debug analysis failed: {str(e)}", "ticker": ticker}


@router.get(
    "/{ticker}/competitive-advantage", response_model=CompetitiveAdvantageAnalysis
)
async def get_competitive_advantage_analysis(ticker: str):
    """
    Get comprehensive competitive advantage (moat) analysis.

    This endpoint provides detailed analysis of why a company is valuable, including:
    - Ecosystem lock-in analysis
    - Brand power assessment
    - Vertical integration evaluation
    - Supply chain mastery analysis
    - Strategic positioning assessment
    - Porter's Five Forces analysis
    - Sector-specific competitive advantage insights
    - Investment thesis generation

    Args:
        ticker: Company ticker symbol

    Returns:
        Comprehensive competitive advantage analysis
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Initialize competitive advantage analyzer
        advantage_analyzer = CompetitiveAdvantageAnalyzer(ticker, financial_data)

        # Perform competitive advantage analysis
        analysis_data = advantage_analyzer.analyze_competitive_advantage()

        if "error" in analysis_data:
            raise HTTPException(status_code=500, detail=analysis_data["error"])

        return CompetitiveAdvantageAnalysis(**analysis_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting competitive advantage analysis: {str(e)}",
        )


@router.get("/{ticker}/analysis", response_model=ComprehensiveAnalysis)
async def get_comprehensive_analysis(ticker: str):
    """
    Get comprehensive analysis combining DCF, competitive advantage, and market data.

    This endpoint provides a dense, Yahoo Finance-style analysis dashboard including:
    - DCF valuation analysis
    - Competitive advantage (moat) analysis
    - Financial ratios
    - Market data and price information
    - Risk and opportunity assessment
    - Investment recommendation

    Args:
        ticker: Company ticker symbol

    Returns:
        Comprehensive analysis in dense format
    """
    try:
        # Get cached financial data
        financial_data = get_cached_financial_data(ticker)
        if not financial_data:
            raise HTTPException(
                status_code=404,
                detail=f"No financial data found for {ticker}. Run scraping script first.",
            )

        # Initialize analyzers
        dcf_service_instance = DCFService()
        advantage_analyzer = CompetitiveAdvantageAnalyzer(ticker, financial_data)
        ratios_analyzer = FinancialRatiosAnalyzer(ticker)

        # Get stock data
        stock_data = yahoo_service.get_stock_info(ticker)

        # Perform analyses
        dcf_analysis = None
        competitive_analysis = None
        financial_ratios = None

        try:
            # DCF Analysis - Convert financial data to the format expected by DCFCalculator
            converted_financial_data = {}

            # Extract financial_metrics from the data structure
            if "financial_metrics" in financial_data:
                # Assume this is the latest year's data
                latest_year = 2024  # Default to 2024
                converted_financial_data[latest_year] = financial_data[
                    "financial_metrics"
                ]
            else:
                # Check if this is the expected multi-year format
                if any(
                    isinstance(key, str) and key.isdigit()
                    for key in financial_data.keys()
                ):
                    # Multi-year format: {year: {financial_metrics: {...}}}
                    for year, data in financial_data.items():
                        if isinstance(year, str) and year.isdigit():
                            converted_financial_data[int(year)] = data.get(
                                "financial_metrics", {}
                            )

            dcf_service_instance.create_dcf_calculator(ticker, converted_financial_data)
            dcf_results = dcf_service_instance.run_dcf_analysis()

            # Handle both dict and object responses
            if isinstance(dcf_results, dict):
                enterprise_value = dcf_results.get("enterprise_value", 0)
                equity_value = dcf_results.get("equity_value", 0)
                per_share_value = dcf_results.get("per_share_value", 0)
                growth_rate = dcf_results.get("growth_rate", 0.15)
            else:
                enterprise_value = getattr(dcf_results, "enterprise_value", 0)
                equity_value = getattr(dcf_results, "equity_value", 0)
                per_share_value = getattr(dcf_results, "per_share_value", 0)
                growth_rate = getattr(dcf_results, "growth_rate", 0.15)

            dcf_analysis = DCFAnalysis(
                ticker=ticker,
                base_results={
                    "enterprise_value": enterprise_value,
                    "equity_value": equity_value,
                    "per_share_value": per_share_value,
                    "growth_rate": growth_rate,
                },
                scenarios=[],
                parameters={},
            )
        except Exception as e:
            print(f"DCF analysis failed for {ticker}: {e}")
            import traceback

            traceback.print_exc()

        try:
            # Competitive Advantage Analysis
            comp_analysis_data = advantage_analyzer.analyze_competitive_advantage()
            if "error" not in comp_analysis_data:
                competitive_analysis = CompetitiveAdvantageAnalysis(
                    **comp_analysis_data
                )
        except Exception as e:
            print(f"Competitive analysis failed for {ticker}: {e}")

        try:
            # Financial Ratios Analysis
            ratios_data = ratios_analyzer.get_financial_ratios()
            if ratios_data and "_raw_data" in ratios_data:
                financial_ratios = FinancialRatios(
                    ticker=ticker,
                    ratios=ratios_data,
                    analysis_date=datetime.now().isoformat(),
                )
        except Exception as e:
            print(f"Financial ratios analysis failed for {ticker}: {e}")

        # Extract key metrics for summary
        current_price = stock_data.get("current_price") if stock_data else None
        dcf_value = (
            dcf_analysis.base_results.get("per_share_value")
            if dcf_analysis and dcf_analysis.base_results
            else None
        )
        upside_potential = None
        if current_price and dcf_value:
            upside_potential = ((dcf_value - current_price) / current_price) * 100

        # Competitive metrics
        moat_score = 0
        moat_level = "Unknown"
        industry_attractiveness = "Unknown"
        investment_recommendation = "Hold"

        if competitive_analysis:
            moat_score = competitive_analysis.overall_moat_strength.score
            moat_level = competitive_analysis.overall_moat_strength.level
            industry_attractiveness = (
                competitive_analysis.porters_five_forces.overall_industry_attractiveness
            )
            investment_recommendation = (
                competitive_analysis.investment_thesis.recommendation
            )

        # Risk assessment
        risk_level = "Medium"
        if moat_score < 30:
            risk_level = "High"
        elif moat_score > 70:
            risk_level = "Low"

        # Build comprehensive response
        analysis_data = {
            "ticker": ticker,
            "company_name": competitive_analysis.company_info.get("name", ticker)
            if competitive_analysis
            else ticker,
            "sector": competitive_analysis.company_info.get("sector", "Unknown")
            if competitive_analysis
            else "Unknown",
            "industry": competitive_analysis.company_info.get("industry", "Unknown")
            if competitive_analysis
            else "Unknown",
            "summary": {
                "dcf_value": dcf_value,
                "current_price": current_price,
                "upside_potential": upside_potential,
                "moat_strength_score": moat_score,
                "moat_level": moat_level,
                "industry_attractiveness": industry_attractiveness,
                "investment_recommendation": investment_recommendation,
                "risk_level": risk_level,
            },
            "valuation": {
                "dcf_per_share": dcf_value,
                "current_price": current_price,
                "price_target": dcf_value,
                "upside_downside": upside_potential,
                "pe_ratio": stock_data.get("pe_ratio") if stock_data else None,
                "pb_ratio": None,  # Not available in YahooFinanceService
                "market_cap": stock_data.get("market_cap") if stock_data else None,
                "enterprise_value": dcf_analysis.base_results.get("enterprise_value")
                if dcf_analysis and dcf_analysis.base_results
                else None,
            },
            "competitive": {
                "ecosystem_score": competitive_analysis.competitive_advantages[
                    "ecosystem_lock_in"
                ].strength_score
                if competitive_analysis
                and "ecosystem_lock_in" in competitive_analysis.competitive_advantages
                else 0,
                "brand_score": competitive_analysis.competitive_advantages[
                    "brand_power"
                ].strength_score
                if competitive_analysis
                and "brand_power" in competitive_analysis.competitive_advantages
                else 0,
                "integration_score": competitive_analysis.competitive_advantages[
                    "vertical_integration"
                ].strength_score
                if competitive_analysis
                and "vertical_integration"
                in competitive_analysis.competitive_advantages
                else 0,
                "supply_chain_score": competitive_analysis.competitive_advantages[
                    "supply_chain_mastery"
                ].strength_score
                if competitive_analysis
                and "supply_chain_mastery"
                in competitive_analysis.competitive_advantages
                else 0,
                "strategic_score": competitive_analysis.competitive_advantages[
                    "strategic_positioning"
                ].strength_score
                if competitive_analysis
                and "strategic_positioning"
                in competitive_analysis.competitive_advantages
                else 0,
                "overall_moat_score": moat_score,
                "moat_level": moat_level,
                "top_advantage": max(
                    competitive_analysis.competitive_advantages.items(),
                    key=lambda x: x[1].strength_score,
                )[0]
                .replace("_", " ")
                .title()
                if competitive_analysis and competitive_analysis.competitive_advantages
                else "Unknown",
                "weakest_area": min(
                    competitive_analysis.competitive_advantages.items(),
                    key=lambda x: x[1].strength_score,
                )[0]
                .replace("_", " ")
                .title()
                if competitive_analysis and competitive_analysis.competitive_advantages
                else "Unknown",
            },
            "risks": {
                "competitive_risks": competitive_analysis.investment_thesis.risk_factors
                if competitive_analysis
                else [],
                "industry_risks": [],
                "financial_risks": [],
                "overall_risk_level": risk_level,
                "risk_factors_count": len(
                    competitive_analysis.investment_thesis.risk_factors
                )
                if competitive_analysis
                else 0,
            },
            "opportunities": {
                "growth_opportunities": competitive_analysis.investment_thesis.opportunities
                if competitive_analysis
                else [],
                "market_expansion_potential": "High"
                if moat_score > 60
                else "Medium"
                if moat_score > 30
                else "Low",
                "innovation_capability": "High"
                if competitive_analysis
                and any(
                    "innovation" in str(comp).lower()
                    for comp in competitive_analysis.competitive_advantages.values()
                )
                else "Medium",
                "strategic_advantages": competitive_analysis.sector_insights.key_advantages
                if competitive_analysis
                else [],
            },
            "dcf_analysis": dcf_analysis,
            "competitive_advantage": competitive_analysis,
            "financial_ratios": financial_ratios,
            "current_price": current_price,
            "market_cap": stock_data.get("market_cap") if stock_data else None,
            "volume": stock_data.get("volume") if stock_data else None,
            "price_change": None,  # Calculate from current_price and previous_close if needed
            "price_change_percent": None,  # Calculate if needed
            "analysis_date": datetime.now().isoformat(),
            "data_sources": ["SEC Filings", "Yahoo Finance", "Internal Analysis"],
            "confidence_score": min(
                95,
                max(
                    60,
                    moat_score
                    + (20 if dcf_analysis else 0)
                    + (15 if financial_ratios else 0),
                ),
            ),
        }

        return ComprehensiveAnalysis(**analysis_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting comprehensive analysis: {str(e)}"
        )
