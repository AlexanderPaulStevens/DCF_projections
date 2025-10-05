"""
Integration tests for unified data architecture endpoints.
"""

from unittest.mock import patch

import pytest
from app.main import app
from fastapi.testclient import TestClient


class TestUnifiedDataArchitectureIntegration:
    """Integration tests for the unified data architecture."""

    def setup_method(self):
        """Set up test fixtures."""
        self.client = TestClient(app)
        self.ticker = "AAPL"

        # Mock comprehensive data for integration tests
        self.mock_comprehensive_data = {
            "ticker": "AAPL",
            "timestamp": "2024-01-01T12:00:00",
            "current_price": 150.0,
            "previous_close": 148.0,
            "open": 149.0,
            "day_low": 147.0,
            "day_high": 152.0,
            "fifty_two_week_low": 120.0,
            "fifty_two_week_high": 180.0,
            "volume": 1000000,
            "avg_volume": 800000,
            "market_cap": 2500000000000,
            "beta": 1.2,
            "pe_ratio": 25.0,
            "forward_pe": 23.0,
            "eps": 6.0,
            "forward_eps": 6.5,
            "dividend_yield": 0.02,
            "ex_dividend_date": "2024-01-15",
            "earnings_date": "2024-01-25",
            "target_price": 160.0,
            "recommendation": "buy",
            "name": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "description": "Apple Inc. designs, manufactures, and markets smartphones",
            "employees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "book_value": 4.0,
            "earnings_growth": 0.15,
            "free_cashflow": 100000000000,
            "shares_outstanding": 15000000000,
            "total_debt": 100000000000,
            "total_cash": 50000000000,
            "revenue": 400000000000,
            "net_income": 100000000000,
            "historical_data": [
                {
                    "date": "2024-01-01",
                    "open": 149.0,
                    "high": 152.0,
                    "low": 147.0,
                    "close": 150.0,
                    "volume": 1000000,
                },
                {
                    "date": "2024-01-02",
                    "open": 150.0,
                    "high": 153.0,
                    "low": 148.0,
                    "close": 151.0,
                    "volume": 1100000,
                },
            ],
            "price_change": 2.0,
            "price_change_percent": 1.35,
        }

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_raw_data_endpoint_integration(self, mock_ticker_class):
        """Test raw-data endpoint with real yfinance integration."""
        # Mock yfinance Ticker
        mock_ticker = mock_ticker_class.return_value
        mock_ticker.info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,
            "earningsDate": [1706140800],
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }

        # Mock historical data
        mock_ticker.history.return_value = (
            Mock()
        )  # Simple mock instead of pandas DataFrame

        # Test
        response = self.client.get(f"/companies/{self.ticker}/raw-data")

        # Assertions
        assert response.status_code == 200
        data = response.json()

        # Verify comprehensive data structure
        assert data["ticker"] == self.ticker
        assert data["current_price"] == 150.0
        assert data["previous_close"] == 148.0
        assert data["price_change"] == 2.0
        assert data["price_change_percent"] == pytest.approx(1.35, rel=1e-2)

        # Verify all data categories are present
        assert "current_price" in data  # Real-time data
        assert "market_cap" in data  # Market metrics
        assert "name" in data  # Company info
        assert "book_value" in data  # Financial ratios raw data
        assert "historical_data" in data  # Historical data

        # Verify historical data structure
        assert len(data["historical_data"]) == 2
        assert data["historical_data"][0]["date"] == "2024-01-01"
        assert data["historical_data"][0]["close"] == 150.0

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_stock_data_endpoint_integration(self, mock_ticker_class):
        """Test stock-data endpoint with real yfinance integration."""
        # Mock yfinance Ticker
        mock_ticker = mock_ticker_class.return_value
        mock_ticker.info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,
            "earningsDate": [1706140800],
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }

        # Mock historical data
        mock_ticker.history.return_value = (
            Mock()
        )  # Simple mock instead of pandas DataFrame

        # Test current day data
        response = self.client.get(f"/companies/{self.ticker}/stock-data?period=1d")

        assert response.status_code == 200
        data = response.json()

        # Verify stock data structure
        assert data["ticker"] == self.ticker
        assert data["current_price"] == 150.0
        assert data["previous_close"] == 148.0
        assert data["price_change"] == 2.0
        assert data["price_change_percent"] == pytest.approx(1.35, rel=1e-2)
        assert (
            "historical_data" not in data
        )  # Should not include historical data for 1d

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_financial_ratios_endpoint_integration(self, mock_ticker_class):
        """Test financial-ratios endpoint with real yfinance integration."""
        # Mock yfinance Ticker
        mock_ticker = mock_ticker_class.return_value
        mock_ticker.info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,
            "earningsDate": [1706140800],
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }

        # Mock historical data
        mock_ticker.history.return_value = (
            Mock()
        )  # Simple mock instead of pandas DataFrame

        # Test
        response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        assert response.status_code == 200
        data = response.json()

        # Verify financial ratios structure
        assert data["ticker"] == self.ticker
        assert "ratios" in data
        assert "raw_data" in data

        # Verify calculated ratios
        ratios = data["ratios"]
        assert ratios["price_earnings_ratio"] == pytest.approx(25.0, rel=1e-2)
        assert ratios["earnings_yield"] == pytest.approx(0.04, rel=1e-2)
        assert ratios["price_to_book_ratio"] == pytest.approx(37.5, rel=1e-2)
        assert ratios["peg_ratio"] == pytest.approx(166.67, rel=1e-2)
        assert ratios["free_cash_flow_yield"] == pytest.approx(0.44, rel=1e-2)

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_data_consistency_across_endpoints(self, mock_ticker_class):
        """Test that all endpoints return consistent data from the same source."""
        # Mock yfinance Ticker
        mock_ticker = mock_ticker_class.return_value
        mock_ticker.info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,
            "earningsDate": [1706140800],
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }

        # Mock historical data
        mock_ticker.history.return_value = (
            Mock()
        )  # Simple mock instead of pandas DataFrame

        # Test all endpoints
        raw_response = self.client.get(f"/companies/{self.ticker}/raw-data")
        stock_response = self.client.get(f"/companies/{self.ticker}/stock-data")
        ratios_response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        # Assertions
        assert raw_response.status_code == 200
        assert stock_response.status_code == 200
        assert ratios_response.status_code == 200

        raw_data = raw_response.json()
        stock_data = stock_response.json()
        ratios_data = ratios_response.json()

        # Verify data consistency
        assert raw_data["current_price"] == stock_data["current_price"]
        assert raw_data["market_cap"] == stock_data["market_cap"]
        assert raw_data["pe_ratio"] == stock_data["pe_ratio"]

        # Verify ratios are calculated from the same raw data
        assert ratios_data["raw_data"]["current_price"] == raw_data["current_price"]
        assert ratios_data["raw_data"]["eps"] == raw_data["eps"]
        assert ratios_data["raw_data"]["book_value"] == raw_data["book_value"]

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_error_handling_integration(self, mock_ticker_class):
        """Test error handling across all endpoints."""
        # Mock yfinance Ticker to raise exception
        mock_ticker_class.side_effect = Exception("Network error")

        # Test all endpoints
        raw_response = self.client.get(f"/companies/{self.ticker}/raw-data")
        stock_response = self.client.get(f"/companies/{self.ticker}/stock-data")
        ratios_response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        # Assertions - all should return 500 errors
        assert raw_response.status_code == 500
        assert stock_response.status_code == 500
        assert ratios_response.status_code == 500

        # Verify error messages
        assert "Error fetching raw data" in raw_response.json()["detail"]
        assert "Error fetching stock data" in stock_response.json()["detail"]
        assert "Error calculating financial ratios" in ratios_response.json()["detail"]

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_caching_integration(self, mock_ticker_class):
        """Test that caching works across endpoints."""
        # Mock yfinance Ticker
        mock_ticker = mock_ticker_class.return_value
        mock_ticker.info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,
            "earningsDate": [1706140800],
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }

        # Mock historical data
        mock_ticker.history.return_value = (
            Mock()
        )  # Simple mock instead of pandas DataFrame

        # First call to raw-data endpoint
        response1 = self.client.get(f"/companies/{self.ticker}/raw-data")
        assert response1.status_code == 200

        # Second call to stock-data endpoint (should use cache)
        response2 = self.client.get(f"/companies/{self.ticker}/stock-data")
        assert response2.status_code == 200

        # Third call to financial-ratios endpoint (should use cache)
        response3 = self.client.get(f"/companies/{self.ticker}/financial-ratios")
        assert response3.status_code == 200

        # Verify that yfinance Ticker was only called once due to caching
        assert mock_ticker_class.call_count == 1

        # Verify data consistency across cached calls
        data1 = response1.json()
        data2 = response2.json()
        data3 = response3.json()

        assert data1["current_price"] == data2["current_price"]
        assert data1["current_price"] == data3["raw_data"]["current_price"]
