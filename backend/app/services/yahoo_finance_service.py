"""
Yahoo Finance service for fetching real-time stock data.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class YahooFinanceService:
    """Service for fetching real-time stock data from Yahoo Finance."""

    def __init__(self):
        self.cache = {}
        self.cache_duration = 300  # 5 minutes cache

    def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive stock information for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing stock information
        """
        try:
            # Check cache first
            cache_key = f"stock_info_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            # Fetch from Yahoo Finance
            stock = yf.Ticker(ticker)
            info = stock.info

            # Extract key information
            stock_data = {
                "ticker": ticker,
                "name": info.get("longName", ticker),
                "current_price": info.get(
                    "currentPrice", info.get("regularMarketPrice", 0)
                ),
                "previous_close": info.get("previousClose", 0),
                "open": info.get("open", 0),
                "day_low": info.get("dayLow", 0),
                "day_high": info.get("dayHigh", 0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
                "volume": info.get("volume", 0),
                "avg_volume": info.get("averageVolume", 0),
                "market_cap": info.get("marketCap", 0),
                "shares_outstanding": info.get("sharesOutstanding", 0),
                "beta": info.get("beta", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "forward_pe": info.get("forwardPE", 0),
                "eps": info.get("trailingEps", 0),
                "forward_eps": info.get("forwardEps", 0),
                "dividend_yield": info.get("dividendYield", 0),
                "ex_dividend_date": self._convert_timestamp(info.get("exDividendDate")),
                "earnings_date": self._convert_timestamp(info.get("earningsDate")),
                "target_price": info.get("targetMeanPrice", 0),
                "recommendation": info.get("recommendationKey", "hold"),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", ""),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "website": info.get("website", ""),
                "description": info.get("longBusinessSummary", ""),
                "employees": info.get("fullTimeEmployees", 0),
                "city": info.get("city", ""),
                "state": info.get("state", ""),
                "country": info.get("country", ""),
                "last_updated": datetime.now().isoformat(),
            }

            # Calculate price change
            if stock_data["current_price"] and stock_data["previous_close"]:
                price_change = (
                    stock_data["current_price"] - stock_data["previous_close"]
                )
                price_change_percent = (
                    price_change / stock_data["previous_close"]
                ) * 100
                stock_data["price_change"] = round(price_change, 2)
                stock_data["price_change_percent"] = round(price_change_percent, 2)
            else:
                stock_data["price_change"] = 0
                stock_data["price_change_percent"] = 0

            # Cache the result
            self._cache_data(cache_key, stock_data)

            return stock_data

        except Exception as e:
            logger.error(f"Error fetching stock info for {ticker}: {str(e)}")
            return None

    def get_historical_data(
        self, ticker: str, period: str = "1y", interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        Get historical stock data.

        Args:
            ticker: Stock ticker symbol
            period: Period for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            DataFrame with historical data
        """
        try:
            cache_key = f"historical_{ticker}_{period}_{interval}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)

            # For 1d period, try different intervals to get the best available data
            if period == "1d":
                # Try 1-minute data first (most detailed)
                hist = stock.history(period="1d", interval="1m")
                if hist.empty:
                    # Fallback to 5-minute data
                    hist = stock.history(period="1d", interval="5m")
                if hist.empty:
                    # Fallback to 15-minute data
                    hist = stock.history(period="1d", interval="15m")
                if hist.empty:
                    # Fallback to 1-hour data
                    hist = stock.history(period="1d", interval="1h")
                if hist.empty:
                    # Final fallback to daily data
                    hist = stock.history(period="1d", interval="1d")
            else:
                # For other periods, use daily data
                hist = stock.history(period=period, interval=interval)

            if hist.empty:
                return None

            # Reset index to make date a column
            hist = hist.reset_index()

            # Cache the result
            self._cache_data(cache_key, hist)

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {str(e)}")
            return None

    def build_company_info_response(
        self, stock_info: Dict[str, Any], ticker: str
    ) -> Dict[str, Any]:
        """
        Build CompanyInfo response from Yahoo Finance stock info.

        Args:
            stock_info: Yahoo Finance stock info data
            ticker: Company ticker symbol

        Returns:
            Formatted company info response
        """
        return {
            "ticker": ticker.upper(),
            "name": stock_info.get("name", f"{ticker.upper()} Inc."),
            "sector": stock_info.get("sector", "Unknown"),
            "industry": stock_info.get("industry", "Unknown"),
            "website": stock_info.get("website", ""),
            "description": stock_info.get("description", ""),
            "employees": stock_info.get("employees", 0),
            "city": stock_info.get("city", "Unknown"),
            "state": stock_info.get("state", "Unknown"),
            "country": stock_info.get("country", "USA"),
            "exchange": stock_info.get("exchange", "NASDAQ"),
            "currency": stock_info.get("currency", "USD"),
            "founded_year": None,  # Yahoo Finance doesn't provide this
            "ceo": None,  # Yahoo Finance doesn't provide this
            "headquarters": f"{stock_info.get('city', 'Unknown')}, {stock_info.get('state', 'Unknown')}",
            "last_updated": stock_info.get("last_updated", ""),
        }

    def format_historical_data_for_stock_data(
        self, hist_data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Format historical data DataFrame for StockData schema.

        Args:
            hist_data: Historical data DataFrame

        Returns:
            List of formatted data points
        """
        if hist_data is None or hist_data.empty:
            return []

        data_points = []
        for _, row in hist_data.iterrows():
            # Handle date - it's now a column after reset_index()
            date_value = row["Date"] if "Date" in row else row.name
            if hasattr(date_value, "strftime"):
                date_str = date_value.strftime("%Y-%m-%d")
            else:
                date_str = str(date_value).split(" ")[0]  # Extract date part

            data_points.append(
                {
                    "date": date_str,
                    "open": float(row["Open"]) if pd.notna(row["Open"]) else None,
                    "high": float(row["High"]) if pd.notna(row["High"]) else None,
                    "low": float(row["Low"]) if pd.notna(row["Low"]) else None,
                    "close": float(row["Close"]) if pd.notna(row["Close"]) else None,
                    "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else None,
                }
            )

        return data_points

    def build_stock_data_response(
        self, raw_data: Dict[str, Any], period: str = "1d"
    ) -> Dict[str, Any]:
        """
        Build StockData response from raw data and period.

        Args:
            raw_data: Raw Yahoo Finance data
            period: Time period for historical data

        Returns:
            Formatted stock data response
        """
        # Base stock data from raw data
        stock_data = {
            "ticker": raw_data["ticker"],
            "current_price": raw_data["current_price"],
            "previous_close": raw_data["previous_close"],
            "open": raw_data["open"],
            "day_low": raw_data["day_low"],
            "day_high": raw_data["day_high"],
            "fifty_two_week_low": raw_data["fifty_two_week_low"],
            "fifty_two_week_high": raw_data["fifty_two_week_high"],
            "volume": raw_data["volume"],
            "avg_volume": raw_data["avg_volume"],
            "market_cap": raw_data["market_cap"],
            "beta": raw_data["beta"],
            "pe_ratio": raw_data["pe_ratio"],
            "forward_pe": raw_data["forward_pe"],
            "eps": raw_data["eps"],
            "forward_eps": raw_data["forward_eps"],
            "dividend_yield": raw_data["dividend_yield"],
            "ex_dividend_date": raw_data["ex_dividend_date"],
            "earnings_date": raw_data["earnings_date"],
            "target_price": raw_data["target_price"],
            "recommendation": raw_data["recommendation"],
            "price_change": raw_data["price_change"],
            "price_change_percent": raw_data["price_change_percent"],
            "last_updated": raw_data["timestamp"],
            "historical_data": None,
            "period": None,
        }

        # Add historical data if period is not "1d"
        if period != "1d":
            hist_data = self.get_historical_data(raw_data["ticker"], period, "1d")
            if hist_data is not None and not hist_data.empty:
                stock_data["historical_data"] = (
                    self.format_historical_data_for_stock_data(hist_data)
                )
                stock_data["period"] = period

        return stock_data

    def get_dividend_data(self, ticker: str) -> Optional[pd.DataFrame]:
        """
        Get dividend data for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            DataFrame with dividend data
        """
        try:
            cache_key = f"dividends_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            dividends = stock.dividends

            if dividends.empty:
                return None

            # Convert to DataFrame
            div_df = dividends.reset_index()
            div_df.columns = ["date", "dividend"]

            # Cache the result
            self._cache_data(cache_key, div_df)

            return div_df

        except Exception as e:
            logger.error(f"Error fetching dividend data for {ticker}: {str(e)}")
            return None

    def get_financial_statements(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get financial statements (Income Statement, Balance Sheet, Cash Flow) for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing financial statements data organized by year
        """
        try:
            cache_key = f"financial_statements_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)

            # Get financial statements
            income_stmt = stock.financials
            balance_sheet = stock.balance_sheet
            cash_flow = stock.cashflow

            if income_stmt.empty and balance_sheet.empty and cash_flow.empty:
                logger.warning(f"No financial statements found for {ticker}")
                return None

            # Process financial data by year
            financial_data = {}

            # Get all available years from income statement
            years = income_stmt.columns.tolist() if not income_stmt.empty else []

            for year in years:
                year_data = {}

                # Income Statement data
                if not income_stmt.empty:
                    try:
                        income_data = income_stmt[year]
                        year_data.update(
                            {
                                "Total Revenue": self._safe_get_value(
                                    income_data, "Total Revenue"
                                ),
                                "Cost of Revenue": self._safe_get_value(
                                    income_data, "Cost of Revenue"
                                ),
                                "Gross Profit": self._safe_get_value(
                                    income_data, "Gross Profit"
                                ),
                                "Operating Income": self._safe_get_value(
                                    income_data, "Operating Income"
                                ),
                                "Net Income": self._safe_get_value(
                                    income_data, "Net Income"
                                ),
                                "Research Development": self._safe_get_value(
                                    income_data, "Research Development"
                                ),
                                "Selling General Administrative": self._safe_get_value(
                                    income_data, "Selling General Administrative"
                                ),
                                "Income Tax Expense": self._safe_get_value(
                                    income_data, "Income Tax Expense"
                                ),
                            }
                        )
                    except Exception as e:
                        logger.warning(
                            f"Error processing income statement for year {year}: {str(e)}"
                        )
                        continue

                # Balance Sheet data
                if not balance_sheet.empty:
                    balance_data = balance_sheet[year]

                    # Calculate Net Working Capital = Current Assets - Current Liabilities
                    current_assets = balance_data.get("Current Assets", 0)
                    current_liabilities = balance_data.get("Current Liabilities", 0)
                    net_working_capital = current_assets - current_liabilities

                    year_data.update(
                        {
                            "Total Stockholder Equity": balance_data.get(
                                "Stockholders Equity", 0
                            ),
                            "Total Assets": balance_data.get("Total Assets", 0),
                            "Total Debt": balance_data.get("Total Debt", 0),
                            "Cash and Cash Equivalents": balance_data.get(
                                "Cash And Cash Equivalents", 0
                            ),
                            "Net Working Capital": net_working_capital,
                        }
                    )

                # Cash Flow data
                if not cash_flow.empty:
                    cash_data = cash_flow[year]
                    year_data.update(
                        {
                            "Depreciation": cash_data.get(
                                "Depreciation And Amortization", 0
                            ),
                            "Free Cash Flow": cash_data.get("Free Cash Flow", 0),
                            "Operating Cash Flow": cash_data.get(
                                "Operating Cash Flow", 0
                            ),
                        }
                    )

                # Calculate derived metrics
                year_data = self._calculate_derived_metrics(year_data)

                # Convert to millions if values are too large
                year_data = self._convert_to_millions(year_data)

                # Map financial statement fields to DCF expected field names
                year_data = self._map_financial_fields(year_data)

                # Add real market data from stock info
                stock_info = self.get_stock_info(ticker)
                if stock_info:
                    # Add shares outstanding (convert to millions)
                    if stock_info.get("shares_outstanding"):
                        shares_outstanding = stock_info["shares_outstanding"]
                        year_data["Shares Outstanding"] = shares_outstanding / 1_000_000

                    # Add real beta
                    if stock_info.get("beta"):
                        year_data["Beta"] = stock_info["beta"]

                    # Add real tax rate calculation
                    if stock_info.get("income_tax_expense") and stock_info.get(
                        "income_before_tax"
                    ):
                        tax_rate = (
                            stock_info["income_tax_expense"]
                            / stock_info["income_before_tax"]
                        )
                        if 0 <= tax_rate <= 0.5:  # Sanity check
                            year_data["Effective Tax Rate"] = tax_rate

                    # Add cost of debt calculation with fallback
                    # Cost of debt = Interest Expense / Total Debt
                    interest_expense = year_data.get(
                        "Interest and other income (expense), net", 0
                    )
                    total_debt = year_data.get("Long-term debt", 0)
                    if total_debt > 0:
                        # Use absolute value for interest expense (it might be negative for income)
                        cost_of_debt = abs(interest_expense) / total_debt
                        # Sanity check: cost of debt should be reasonable (0% to 20%)
                        if 0 <= cost_of_debt <= 0.20:
                            year_data["Cost of Debt"] = cost_of_debt
                        else:
                            # Use fallback for unreasonable cost of debt
                            year_data["Cost of Debt"] = 0.055  # 5.5% fallback
                    else:
                        # For debt-free companies, use risk-free rate + premium
                        year_data["Cost of Debt"] = 0.055  # 5.5% fallback

                financial_data[year.year] = year_data

            # Cache the result
            self._cache_data(cache_key, financial_data)

            logger.info(
                f"Successfully fetched financial statements for {ticker}: {list(financial_data.keys())}"
            )
            return financial_data

        except Exception as e:
            logger.error(f"Error fetching financial statements for {ticker}: {str(e)}")
            return None

    def _calculate_derived_metrics(self, year_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate derived financial metrics from raw data.

        Args:
            year_data: Raw financial data for a year

        Returns:
            Enhanced financial data with derived metrics
        """
        try:
            # Calculate EBIT (Operating Income)
            operating_income = year_data.get("Operating Income", 0)
            year_data["EBIT (Operating Income + Other Income/Expense)"] = (
                operating_income
            )

            # Calculate EBITDA (EBIT + Depreciation)
            depreciation = year_data.get("Depreciation", 0)
            ebitda = operating_income + depreciation
            year_data["EBITDA (from EBIT)"] = ebitda

            # Calculate Total Net Sales (use Total Revenue)
            total_revenue = year_data.get("Total Revenue", 0)
            year_data["Total net sales"] = total_revenue

            # Calculate Total Cost of Sales
            cost_of_revenue = year_data.get("Cost of Revenue", 0)
            year_data["Total cost of sales"] = cost_of_revenue

            # Calculate Gross Margin
            gross_profit = year_data.get("Gross Profit", 0)
            year_data["Gross margin"] = gross_profit

            # Calculate Depreciation and Amortization
            year_data["Depreciation and amortization"] = depreciation

            # Calculate Research and Development
            rd = year_data.get("Research Development", 0)
            year_data["Research and development"] = rd

            # Calculate Selling, General and Administrative
            sga = year_data.get("Selling General Administrative", 0)
            year_data["Selling, general and administrative"] = sga

            # Calculate Provision for Income Taxes
            income_tax = year_data.get("Income Tax Expense", 0)
            year_data["Provision for income taxes"] = income_tax

            # Calculate Other Income/Expense (simplified)
            year_data["Other income/(expense), net"] = 0

            return year_data

        except Exception as e:
            logger.error(f"Error calculating derived metrics: {str(e)}")
            return year_data

    def _safe_get_value(self, data, key: str, default: float = 0) -> float:
        """
        Safely get a value from pandas Series, handling NaN and infinity.

        Args:
            data: Pandas Series or dictionary
            key: Key to look up
            default: Default value if key not found or invalid

        Returns:
            Safe numeric value
        """
        try:
            import math

            if hasattr(data, "get"):
                value = data.get(key, default)
            else:
                value = default

            if isinstance(value, (int, float)):
                if math.isnan(value) or math.isinf(value):
                    return default
                return value
            else:
                return default

        except Exception:
            return default

    def get_comprehensive_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive data from Yahoo Finance in a single call.
        This is the single source of truth for all other endpoints.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing all available data from Yahoo Finance
        """
        try:
            cache_key = f"comprehensive_data_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)

            # Get all available data
            info = stock.info
            hist_data = stock.history(period="1y")  # Get 1 year of historical data

            if not info and hist_data.empty:
                logger.warning(f"No comprehensive data found for {ticker}")
                return None

            # Build comprehensive data structure
            comprehensive_data = {
                "ticker": ticker,
                "timestamp": datetime.now().isoformat(),
                # Real-time stock data
                "current_price": info.get(
                    "currentPrice", info.get("regularMarketPrice", 0)
                ),
                "previous_close": info.get("previousClose", 0),
                "open": info.get("open", 0),
                "day_low": info.get("dayLow", 0),
                "day_high": info.get("dayHigh", 0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
                "volume": info.get("volume", 0),
                "avg_volume": info.get("averageVolume", 0),
                # Market metrics
                "market_cap": info.get("marketCap", 0),
                "beta": info.get("beta", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "forward_pe": info.get("forwardPE", 0),
                "eps": info.get("trailingEps", 0),
                "forward_eps": info.get("forwardEps", 0),
                "dividend_yield": info.get("dividendYield", 0),
                "ex_dividend_date": self._convert_timestamp(info.get("exDividendDate")),
                "earnings_date": self._convert_timestamp(info.get("earningsDate")),
                "target_price": info.get("targetMeanPrice", 0),
                "recommendation": info.get("recommendationKey", "hold"),
                # Company information
                "name": info.get("longName", ticker),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", ""),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "website": info.get("website", ""),
                "description": info.get("longBusinessSummary", ""),
                "employees": info.get("fullTimeEmployees", 0),
                "city": info.get("city", ""),
                "state": info.get("state", ""),
                "country": info.get("country", ""),
                # Financial ratios raw data
                "book_value": info.get("bookValue", 0),
                "earnings_growth": info.get("earningsGrowth", 0),
                "free_cashflow": info.get("freeCashflow", 0),
                "shares_outstanding": info.get("sharesOutstanding", 0),
                "income_tax_expense": info.get("incomeTaxExpense", 0),
                "income_before_tax": info.get("incomeBeforeTax", 0),
                "total_debt": info.get("totalDebt", 0),
                "total_cash": info.get("totalCash", 0),
                "revenue": info.get("totalRevenue", 0),
                "net_income": info.get("netIncomeToCommon", 0),
                # Historical data (last 1 year)
                "historical_data": self._process_historical_data(hist_data),
                # Price change calculations
                "price_change": 0,
                "price_change_percent": 0,
            }

            # Calculate price changes
            if (
                comprehensive_data["current_price"] is not None
                and comprehensive_data["previous_close"] is not None
            ):
                comprehensive_data["price_change"] = (
                    comprehensive_data["current_price"]
                    - comprehensive_data["previous_close"]
                )
                if comprehensive_data["previous_close"] != 0:
                    comprehensive_data["price_change_percent"] = (
                        comprehensive_data["price_change"]
                        / comprehensive_data["previous_close"]
                    ) * 100
                else:
                    comprehensive_data["price_change_percent"] = 0

            # Cache the result
            self._cache_data(cache_key, comprehensive_data)

            logger.info(f"Successfully fetched comprehensive data for {ticker}")
            return comprehensive_data

        except Exception as e:
            logger.error(f"Error fetching comprehensive data for {ticker}: {str(e)}")
            return None

    def _process_historical_data(self, hist_data) -> List[Dict[str, Any]]:
        """
        Process historical data DataFrame into list of dictionaries.

        Args:
            hist_data: Pandas DataFrame with historical data

        Returns:
            List of historical data points
        """
        try:
            if hist_data.empty:
                return []

            data_points = []

            # Check if Date is a column (after reset_index) or in the index
            if "Date" in hist_data.columns:
                # Date is a column
                for _, row in hist_data.iterrows():
                    date = row["Date"]
                    # Handle different date formats
                    if hasattr(date, "strftime"):
                        date_str = date.strftime("%Y-%m-%d")
                    else:
                        # Convert to datetime if it's not already
                        try:
                            date_str = pd.to_datetime(date).strftime("%Y-%m-%d")
                        except:
                            date_str = str(date)

                    data_points.append(
                        {
                            "date": date_str,
                            "open": (
                                float(row["Open"]) if pd.notna(row["Open"]) else None
                            ),
                            "high": (
                                float(row["High"]) if pd.notna(row["High"]) else None
                            ),
                            "low": float(row["Low"]) if pd.notna(row["Low"]) else None,
                            "close": (
                                float(row["Close"]) if pd.notna(row["Close"]) else None
                            ),
                            "volume": (
                                int(row["Volume"]) if pd.notna(row["Volume"]) else None
                            ),
                        }
                    )
            else:
                # Date is in the index
                for date, row in hist_data.iterrows():
                    # Handle different date formats
                    if hasattr(date, "strftime"):
                        date_str = date.strftime("%Y-%m-%d")
                    else:
                        # Convert to datetime if it's not already
                        try:
                            date_str = pd.to_datetime(date).strftime("%Y-%m-%d")
                        except:
                            date_str = str(date)

                    data_points.append(
                        {
                            "date": date_str,
                            "open": (
                                float(row["Open"]) if pd.notna(row["Open"]) else None
                            ),
                            "high": (
                                float(row["High"]) if pd.notna(row["High"]) else None
                            ),
                            "low": float(row["Low"]) if pd.notna(row["Low"]) else None,
                            "close": (
                                float(row["Close"]) if pd.notna(row["Close"]) else None
                            ),
                            "volume": (
                                int(row["Volume"]) if pd.notna(row["Volume"]) else None
                            ),
                        }
                    )

            return data_points

        except Exception as e:
            logger.error(f"Error processing historical data: {str(e)}")
            return []

    def _convert_to_millions(self, year_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert financial values to millions if they're too large.
        Also handle NaN, infinity, and other invalid values.

        Args:
            year_data: Financial data for a year

        Returns:
            Financial data with values converted to millions and cleaned
        """
        try:
            import math

            converted_data = {}

            for key, value in year_data.items():
                if isinstance(value, (int, float)):
                    # Handle NaN, infinity, and other invalid values
                    if math.isnan(value) or math.isinf(value):
                        converted_data[key] = 0
                    elif value != 0:
                        # If value is greater than 1 million, convert to millions
                        if abs(value) > 1000000:
                            converted_data[key] = value / 1000000
                        else:
                            converted_data[key] = value
                    else:
                        converted_data[key] = 0
                else:
                    converted_data[key] = value

            return converted_data

        except Exception as e:
            logger.error(f"Error converting to millions: {str(e)}")
            return year_data

    def get_analyst_recommendations(
        self, ticker: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get analyst recommendations for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of analyst recommendations
        """
        try:
            cache_key = f"recommendations_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            recommendations = stock.recommendations

            if recommendations is None or recommendations.empty:
                return None

            # Convert to list of dictionaries
            rec_list = recommendations.reset_index().to_dict("records")

            # Cache the result
            self._cache_data(cache_key, rec_list)

            return rec_list

        except Exception as e:
            logger.error(f"Error fetching recommendations for {ticker}: {str(e)}")
            return None

    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and not expired."""
        if key not in self.cache:
            return False

        cache_time = self.cache[key]["timestamp"]
        return (datetime.now() - cache_time).seconds < self.cache_duration

    def _cache_data(self, key: str, data: Any) -> None:
        """Cache data with timestamp."""
        self.cache[key] = {"data": data, "timestamp": datetime.now()}

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self.cache.clear()

    def _convert_timestamp(self, timestamp) -> Optional[str]:
        """Convert timestamp to ISO string format."""
        if timestamp is None:
            return None

        try:
            if isinstance(timestamp, (int, float)):
                # Convert Unix timestamp to datetime
                dt = datetime.fromtimestamp(timestamp)
                return dt.isoformat()
            elif isinstance(timestamp, str):
                # Already a string, return as is
                return timestamp
            else:
                return None
        except (ValueError, TypeError, OSError):
            return None

    def _map_financial_fields(self, year_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map Yahoo Finance field names to DCF calculator expected field names.

        Args:
            year_data: Raw financial data from Yahoo Finance

        Returns:
            Financial data with standardized field names
        """
        # Field mapping from Yahoo Finance to DCF expected names
        field_mapping = {
            # Revenue
            "Revenue": "Total net sales",
            "Total Revenue": "Total net sales",
            # Operating Income
            "Income from operations": "EBIT (Operating Income + Other Income/Expense)",
            "Operating Income": "EBIT (Operating Income + Other Income/Expense)",
            "EBIT (Net Income + Interest + Tax)": "EBIT (Operating Income + Other Income/Expense)",
            # Debt
            "Long-term debt": "Total Debt",
            "Total Debt": "Total Debt",
            # Cash
            "Cash, cash equivalents, and restricted cash at beginning of the period": "Cash and Cash Equivalents",
            "Cash And Cash Equivalents": "Cash and Cash Equivalents",
            # Working Capital (calculate from current assets - current liabilities)
            "Total current assets": "Current Assets",
            "Total current liabilities": "Current Liabilities",
            # Depreciation
            "Depreciation and amortization": "Depreciation and amortization",
            # Tax
            "Provision for income taxes": "Provision for income taxes",
            # CapEx
            "Purchases of property and equipment": "Capital Expenditure",
        }

        # Apply field mapping
        mapped_data = {}
        for yahoo_field, dcf_field in field_mapping.items():
            if yahoo_field in year_data and year_data[yahoo_field] is not None:
                mapped_data[dcf_field] = year_data[yahoo_field]

        # Calculate Net Working Capital if we have current assets and liabilities
        if "Current Assets" in mapped_data and "Current Liabilities" in mapped_data:
            current_assets = mapped_data["Current Assets"]
            current_liabilities = mapped_data["Current Liabilities"]
            mapped_data["Net Working Capital"] = current_assets - current_liabilities

        # Keep original data as well
        mapped_data.update(year_data)

        return mapped_data
