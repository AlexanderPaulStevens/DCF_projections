"""
Yahoo Finance Service - Simplified data fetching
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class YahooFinanceService:
    """Simplified service for fetching stock data from Yahoo Finance."""

    def __init__(self):
        self.cache = {}
        self.cache_duration = 300  # 5 minutes

    def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get basic stock information."""
        try:
            cache_key = f"stock_info_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            info = stock.info

            stock_data = {
                "ticker": ticker,
                "name": info.get("longName", ticker),
                "current_price": info.get("currentPrice", info.get("regularMarketPrice", 0)),
                "previous_close": info.get("previousClose", 0),
                "market_cap": info.get("marketCap", 0),
                "shares_outstanding": info.get("sharesOutstanding", 0),
                "beta": info.get("beta", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "eps": info.get("trailingEps", 0),
                "dividend_yield": info.get("dividendYield", 0),
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

            self._cache_data(cache_key, stock_data)
            return stock_data

        except Exception as e:
            logger.error(f"Error fetching stock info for {ticker}: {e}")
            return None

    def get_financial_statements(self, ticker: str) -> Optional[Dict[int, Dict[str, Any]]]:
        """Get financial statements for multiple years."""
        try:
            cache_key = f"financial_statements_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)

            # Get financial statements
            income_stmt = stock.financials
            balance_sheet = stock.balance_sheet
            cash_flow = stock.cashflow

            if income_stmt.empty:
                return None

            # Convert to dict format by year (starting from 2021)
            financial_data = {}
            for year in income_stmt.columns:
                year_int = year.year
                # Skip years before 2021 due to data quality issues
                if year_int < 2021:
                    continue
                financial_data[year_int] = {
                    # Income Statement
                    "Total Revenue": self._safe_get(income_stmt, year, "Total Revenue"),
                    "Cost of Revenue": self._safe_get(income_stmt, year, "Cost Of Revenue"),
                    "Gross Profit": self._safe_get(income_stmt, year, "Gross Profit"),
                    "Research Development": self._safe_get(
                        income_stmt, year, "Research Development"
                    ),
                    "Selling General Administrative": self._safe_get(
                        income_stmt, year, "Selling General Administrative"
                    ),
                    "Operating Income": self._safe_get(income_stmt, year, "Operating Income"),
                    "Interest and other income (expense), net": self._safe_get(
                        income_stmt, year, "Interest And Other Income (Expense), Net"
                    ),
                    "Income Tax Expense": self._safe_get(income_stmt, year, "Income Tax Expense"),
                    "Net Income": self._safe_get(income_stmt, year, "Net Income"),
                    # Balance Sheet
                    "Cash and Cash Equivalents": self._safe_get(
                        balance_sheet, year, "Cash And Cash Equivalents"
                    ),
                    "Current Assets": self._safe_get(balance_sheet, year, "Current Assets"),
                    "Current Liabilities": self._safe_get(
                        balance_sheet, year, "Current Liabilities"
                    ),
                    "Short Term Debt": self._safe_get(balance_sheet, year, "Short Term Debt"),
                    "Long Term Debt": self._safe_get(balance_sheet, year, "Long Term Debt"),
                    "Total Debt": self._safe_get(balance_sheet, year, "Total Debt"),
                    "Inventory": self._safe_get(balance_sheet, year, "Inventory"),
                    "Accounts Receivable": self._safe_get(balance_sheet, year, "Net Receivables"),
                    "Total Assets": self._safe_get(balance_sheet, year, "Total Assets"),
                    "Total Liabilities": self._safe_get(balance_sheet, year, "Total Liabilities"),
                    "Total Stockholder Equity": self._safe_get(
                        balance_sheet, year, "Total Stockholder Equity"
                    ),
                    # Cash Flow Statement
                    "Operating Cash Flow": self._safe_get(cash_flow, year, "Operating Cash Flow"),
                    "Capital Expenditure": self._safe_get(cash_flow, year, "Capital Expenditure"),
                    "Depreciation": self._safe_get(
                        cash_flow, year, "Depreciation And Amortization"
                    ),
                    # Market Data (from stock info)
                    "Shares Outstanding": self._safe_get_market_data(ticker, "sharesOutstanding"),
                    "Beta": self._safe_get_market_data(ticker, "beta"),
                    "Current Price": self._safe_get_market_data(ticker, "currentPrice"),
                    "Market Cap": self._safe_get_market_data(ticker, "marketCap"),
                    "PE Ratio": self._safe_get_market_data(ticker, "trailingPE"),
                    "PB Ratio": self._safe_get_market_data(ticker, "priceToBook"),
                    "PS Ratio": self._safe_get_market_data(ticker, "priceToSalesTrailing12Months"),
                }

            self._cache_data(cache_key, financial_data)
            return financial_data

        except Exception as e:
            logger.error(f"Error fetching financial statements for {ticker}: {e}")
            return None

    def get_dcf_market_data(self, ticker: str) -> Dict[str, Any]:
        """Get market data needed for DCF calculations."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            return {
                "beta": info.get("beta", 1.0),
                "tax_rate": 0.24,  # Default corporate tax rate
                "market_cap": info.get("marketCap", 0),
                "total_cash": info.get("totalCash", 0),
                "total_debt": info.get("totalDebt", 0),
                "shares_outstanding": info.get("sharesOutstanding", 0),
            }

        except Exception as e:
            logger.error(f"Error fetching DCF market data for {ticker}: {e}")
            return {
                "beta": 1.0,
                "tax_rate": 0.24,
                "market_cap": 0,
                "total_cash": 0,
                "total_debt": 0,
                "shares_outstanding": 0,
            }

    def get_historical_data(self, ticker: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """Get historical price data."""
        try:
            cache_key = f"historical_data_{ticker}_{period}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            hist_df = stock.history(period=period)

            if hist_df.empty:
                return None

            self._cache_data(cache_key, hist_df)
            return hist_df

        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {e}")
            return None

    def _process_historical_data(self, hist_df: pd.DataFrame) -> list:
        """Process historical data DataFrame into list of dictionaries."""
        try:
            historical_data = []
            for date, row in hist_df.iterrows():
                historical_data.append(
                    {
                        "date": date.strftime("%Y-%m-%d"),
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": int(row["Volume"]),
                    }
                )
            return historical_data
        except Exception as e:
            logger.error(f"Error processing historical data: {e}")
            return []

    def get_comprehensive_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive company data."""
        try:
            stock_info = self.get_stock_info(ticker)
            if not stock_info:
                return None

            # Add additional data
            stock_info["timestamp"] = datetime.now().isoformat()
            return stock_info

        except Exception as e:
            logger.error(f"Error getting comprehensive data for {ticker}: {e}")
            return None

    def build_stock_data_response(
        self,
        raw_data: Dict[str, Any],
        period: str = "1d",  # noqa: ARG002
    ) -> Dict[str, Any]:
        """Build standardized stock data response from raw data."""
        try:
            # Extract key fields from raw data
            response = {
                "ticker": raw_data.get("ticker", ""),
                "name": raw_data.get("name", ""),
                "current_price": raw_data.get("current_price", 0),
                "previous_close": raw_data.get("previous_close", 0),
                "market_cap": raw_data.get("market_cap", 0),
                "shares_outstanding": raw_data.get("shares_outstanding", 0),
                "beta": raw_data.get("beta", 1.0),
                "pe_ratio": raw_data.get("pe_ratio", 0),
                "eps": raw_data.get("eps", 0),
                "dividend_yield": raw_data.get("dividend_yield", 0),
                "currency": raw_data.get("currency", "USD"),
                "exchange": raw_data.get("exchange", ""),
                "sector": raw_data.get("sector", ""),
                "industry": raw_data.get("industry", ""),
                "website": raw_data.get("website", ""),
                "description": raw_data.get("description", ""),
                "employees": raw_data.get("employees", 0),
                "city": raw_data.get("city", ""),
                "state": raw_data.get("state", ""),
                "country": raw_data.get("country", ""),
                "last_updated": raw_data.get("last_updated", datetime.now().isoformat()),
            }

            # Calculate price change if we have both current and previous close
            if response["current_price"] and response["previous_close"]:
                price_change = response["current_price"] - response["previous_close"]
                price_change_percent = (price_change / response["previous_close"]) * 100
                response["price_change"] = price_change
                response["price_change_percent"] = price_change_percent
            else:
                response["price_change"] = 0
                response["price_change_percent"] = 0

            return response

        except Exception as e:
            logger.error(f"Error building stock data response: {e}")
            # Return minimal response on error
            return {
                "ticker": raw_data.get("ticker", ""),
                "name": raw_data.get("name", ""),
                "current_price": raw_data.get("current_price", 0),
                "previous_close": raw_data.get("previous_close", 0),
                "price_change": 0,
                "price_change_percent": 0,
                "market_cap": raw_data.get("market_cap", 0),
                "beta": raw_data.get("beta", 1.0),
                "pe_ratio": raw_data.get("pe_ratio", 0),
                "last_updated": datetime.now().isoformat(),
            }

    def _map_financial_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Map financial fields to standard names."""
        # This is a simplified mapping - the data should already be in the right format
        return data

    def _safe_get(self, df: pd.DataFrame, year: pd.Timestamp, field: str) -> Optional[float]:
        """Safely get value from DataFrame."""
        try:
            if field in df.index and year in df.columns:
                value = df.loc[field, year]
                if value is not None and not pd.isna(value):
                    return float(value)
            return None
        except Exception:
            return None

    def _safe_get_market_data(self, ticker: str, field: str) -> Optional[float]:
        """Safely get market data value."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            value = info.get(field, 0)

            # Special handling for PE ratio - return None if missing/invalid instead of 0
            if field == "trailingPE" and (value is None or value == 0):
                return None

            return float(value) if value is not None else 0.0
        except Exception:
            # Special handling for PE ratio - return None on exception instead of 0
            if field == "trailingPE":
                return None
            return 0.0

    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid."""
        if key not in self.cache:
            return False

        cache_time = self.cache[key]["timestamp"]
        age = datetime.now() - cache_time
        return age.total_seconds() < self.cache_duration

    def _cache_data(self, key: str, data: Any) -> None:
        """Cache data with timestamp."""
        self.cache[key] = {"data": data, "timestamp": datetime.now()}
