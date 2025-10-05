"""
Unit tests for companies router endpoints with unified data architecture.
"""

from unittest.mock import AsyncMock, Mock, patch

import pandas as pd
import pytest
from app.routers.companies import _calculate_ratios_from_raw_data, router
from app.services.yahoo_finance_service import YahooFinanceService
from fastapi import FastAPI
from fastapi.testclient import TestClient


class TestCompaniesRouterUnifiedData:
    """Test cases for companies router with unified data architecture."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        self.app.include_router(router)
        self.client = TestClient(self.app)
        self.ticker = "AAPL"

        # Mock comprehensive data
        self.mock_raw_data = {
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
                }
            ],
            "price_change": 2.0,
            "price_change_percent": 1.35,
        }

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_raw_data_success(self, mock_yahoo_service_class):
        """Test successful raw data retrieval."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data

        # Test
        response = self.client.get(f"/companies/{self.ticker}/raw-data")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == self.ticker
        assert data["current_price"] == 150.0
        assert data["market_cap"] == 2500000000000
        assert len(data["historical_data"]) == 1

        # Verify service was called correctly
        mock_service.get_comprehensive_data.assert_called_once_with(self.ticker.upper())

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_raw_data_not_found(self, mock_yahoo_service_class):
        """Test raw data retrieval when data is not found."""
        # Mock YahooFinanceService to return None
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = None

        # Test
        response = self.client.get(f"/companies/{self.ticker}/raw-data")

        # Assertions
        assert response.status_code == 404
        assert "Raw data not found" in response.json()["detail"]

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_raw_data_exception(self, mock_yahoo_service_class):
        """Test raw data retrieval with exception."""
        # Mock YahooFinanceService to raise exception
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.side_effect = Exception("Network error")

        # Test
        response = self.client.get(f"/companies/{self.ticker}/raw-data")

        # Assertions
        assert response.status_code == 500
        assert "Error fetching raw data" in response.json()["detail"]

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_stock_data_current_day(self, mock_yahoo_service_class):
        """Test stock data retrieval for current day."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data

        # Test
        response = self.client.get(f"/companies/{self.ticker}/stock-data?period=1d")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == self.ticker
        assert data["current_price"] == 150.0
        assert data["previous_close"] == 148.0
        assert data["price_change"] == 2.0
        assert data["price_change_percent"] == pytest.approx(1.35, rel=1e-2)
        assert (
            "historical_data" not in data
        )  # Should not include historical data for 1d

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_stock_data_historical_period(self, mock_yahoo_service_class):
        """Test stock data retrieval for historical period."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data

        # Mock historical data
        mock_hist_data = pd.DataFrame(
            {
                "Open": [149.0, 150.0],
                "High": [152.0, 153.0],
                "Low": [147.0, 148.0],
                "Close": [150.0, 151.0],
                "Volume": [1000000, 1100000],
            },
            index=[pd.Timestamp("2024-01-01"), pd.Timestamp("2024-01-02")],
        )
        mock_service.get_historical_data.return_value = mock_hist_data

        # Test
        response = self.client.get(f"/companies/{self.ticker}/stock-data?period=6mo")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == self.ticker
        assert data["current_price"] == 150.0
        assert "historical_data" in data
        assert len(data["historical_data"]) == 2
        assert data["period"] == "6mo"

        # Verify historical data was fetched
        mock_service.get_historical_data.assert_called_once_with(
            self.ticker.upper(), "6mo", "1d"
        )

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_stock_data_historical_not_found(self, mock_yahoo_service_class):
        """Test stock data retrieval when historical data is not found."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data
        mock_service.get_historical_data.return_value = None

        # Test
        response = self.client.get(f"/companies/{self.ticker}/stock-data?period=6mo")

        # Assertions
        assert response.status_code == 404
        assert "Historical data not found" in response.json()["detail"]

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_financial_ratios_success(self, mock_yahoo_service_class):
        """Test successful financial ratios calculation."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data

        # Test
        response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["ticker"] == self.ticker
        assert "ratios" in data
        assert "raw_data" in data

        # Check specific ratios
        ratios = data["ratios"]
        assert ratios["price_earnings_ratio"] == pytest.approx(25.0, rel=1e-2)
        assert ratios["earnings_yield"] == pytest.approx(0.04, rel=1e-2)
        assert ratios["price_to_book_ratio"] == pytest.approx(37.5, rel=1e-2)

    @patch("app.routers.companies.YahooFinanceService")
    def test_get_financial_ratios_no_data(self, mock_yahoo_service_class):
        """Test financial ratios when no raw data is available."""
        # Mock YahooFinanceService to return None
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = None

        # Test
        response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        # Assertions
        assert response.status_code == 404
        assert "Financial data not found" in response.json()["detail"]

    def test_calculate_ratios_from_raw_data_success(self):
        """Test ratio calculation from raw data."""
        # Test
        ratios = _calculate_ratios_from_raw_data(self.mock_raw_data)

        # Assertions
        assert ratios["price_earnings_ratio"] == pytest.approx(25.0, rel=1e-2)
        assert ratios["earnings_yield"] == pytest.approx(0.04, rel=1e-2)
        assert ratios["price_to_book_ratio"] == pytest.approx(37.5, rel=1e-2)
        assert ratios["peg_ratio"] == pytest.approx(166.67, rel=1e-2)
        assert ratios["free_cash_flow_yield"] == pytest.approx(0.0444, rel=1e-2)
        assert ratios["price_to_sales_ratio"] == pytest.approx(6.25, rel=1e-2)

    def test_calculate_ratios_from_raw_data_zero_values(self):
        """Test ratio calculation with zero values."""
        # Raw data with zero values
        raw_data_zero = self.mock_raw_data.copy()
        raw_data_zero["eps"] = 0
        raw_data_zero["book_value"] = 0
        raw_data_zero["earnings_growth"] = 0

        # Test
        ratios = _calculate_ratios_from_raw_data(raw_data_zero)

        # Assertions
        assert ratios["price_earnings_ratio"] is None
        assert ratios["price_to_book_ratio"] is None
        assert ratios["peg_ratio"] is None

    def test_calculate_ratios_from_raw_data_missing_values(self):
        """Test ratio calculation with missing values."""
        # Raw data with missing values
        raw_data_missing = {
            "current_price": 150.0,
            "eps": 6.0,
            # Missing other values
        }

        # Test
        ratios = _calculate_ratios_from_raw_data(raw_data_missing)

        # Assertions
        assert ratios["price_earnings_ratio"] == pytest.approx(25.0, rel=1e-2)
        assert ratios["earnings_yield"] == pytest.approx(0.04, rel=1e-2)
        assert ratios["price_to_book_ratio"] is None  # Missing book_value
        assert ratios["peg_ratio"] is None  # Missing earnings_growth

    def test_calculate_ratios_from_raw_data_exception(self):
        """Test ratio calculation with missing data."""
        # Raw data with missing values
        raw_data_error = {"invalid": "data"}

        # Test
        ratios = _calculate_ratios_from_raw_data(raw_data_error)

        # Assertions - should return ratios with None values
        assert ratios["price_earnings_ratio"] is None
        assert ratios["earnings_yield"] is None
        assert ratios["price_to_book_ratio"] is None

    @patch("app.routers.companies.YahooFinanceService")
    def test_endpoints_use_same_data_source(self, mock_yahoo_service_class):
        """Test that all endpoints use the same data source (raw-data)."""
        # Mock YahooFinanceService
        mock_service = Mock()
        mock_yahoo_service_class.return_value = mock_service
        mock_service.get_comprehensive_data.return_value = self.mock_raw_data

        # Test all endpoints
        raw_response = self.client.get(f"/companies/{self.ticker}/raw-data")
        stock_response = self.client.get(f"/companies/{self.ticker}/stock-data")
        ratios_response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

        # Assertions
        assert raw_response.status_code == 200
        assert stock_response.status_code == 200
        assert ratios_response.status_code == 200

        # Verify get_comprehensive_data was called for all endpoints
        assert mock_service.get_comprehensive_data.call_count == 3

    def test_stock_data_schema_validation(self):
        """Test that stock data response matches expected schema."""
        with patch(
            "app.routers.companies.YahooFinanceService"
        ) as mock_yahoo_service_class:
            mock_service = Mock()
            mock_yahoo_service_class.return_value = mock_service
            mock_service.get_comprehensive_data.return_value = self.mock_raw_data

            response = self.client.get(f"/companies/{self.ticker}/stock-data")

            assert response.status_code == 200
            data = response.json()

            # Check required fields are present
            required_fields = [
                "ticker",
                "current_price",
                "previous_close",
                "open",
                "day_low",
                "day_high",
                "fifty_two_week_low",
                "fifty_two_week_high",
                "volume",
                "avg_volume",
                "market_cap",
                "beta",
                "pe_ratio",
                "forward_pe",
                "eps",
                "forward_eps",
                "dividend_yield",
                "target_price",
                "recommendation",
                "price_change",
                "price_change_percent",
                "last_updated",
            ]

            for field in required_fields:
                assert field in data, f"Missing required field: {field}"

    def test_financial_ratios_schema_validation(self):
        """Test that financial ratios response matches expected schema."""
        with patch(
            "app.routers.companies.YahooFinanceService"
        ) as mock_yahoo_service_class:
            mock_service = Mock()
            mock_yahoo_service_class.return_value = mock_service
            mock_service.get_comprehensive_data.return_value = self.mock_raw_data

            response = self.client.get(f"/companies/{self.ticker}/financial-ratios")

            assert response.status_code == 200
            data = response.json()

            # Check required fields are present
            assert "ticker" in data
            assert "ratios" in data
            assert "raw_data" in data

            # Check ratios structure
            ratios = data["ratios"]
            expected_ratios = [
                "price_earnings_ratio",
                "earnings_yield",
                "price_to_book_ratio",
                "peg_ratio",
                "free_cash_flow_yield",
                "price_to_sales_ratio",
                "debt_to_equity_ratio",
                "return_on_equity",
                "net_profit_margin",
            ]

            for ratio in expected_ratios:
                assert ratio in ratios, f"Missing ratio: {ratio}"
