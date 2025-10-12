"""
Simplified companies router tests - focused on core functionality.
"""

from unittest.mock import Mock, patch


class TestCompaniesRouter:
    """Simplified test cases for companies router endpoints."""

    def test_companies_list_endpoint(self, client):
        """Test the companies list endpoint."""
        with (
            patch("app.routers.companies_router.CloudStorageService") as mock_service_class,
            patch("app.routers.companies_router.requests.get") as mock_get,
        ):
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            mock_service.download_url = "https://example.com"
            mock_service._get_headers.return_value = {}

            # Mock the requests.get response
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "AAPL": {"name": "Apple Inc.", "sector": "Technology"}
            }
            mock_get.return_value = mock_response

            response = client.get("/companies/list")
            assert response.status_code == 200
            data = response.json()
            assert "companies" in data
            assert isinstance(data["companies"], list)
            assert len(data["companies"]) > 0

    def test_company_info_endpoint(self, client):
        """Test company info endpoint."""
        with patch("app.routers.companies_router.YahooFinanceService") as mock_service_class:
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            mock_service.get_stock_info.return_value = {
                "ticker": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology",
            }
            mock_service.build_company_info_response.return_value = {
                "ticker": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology",
                "industry": "Consumer Electronics",
                "website": "https://www.apple.com",
                "description": """Apple Inc. designs, manufactures, and markets smartphones,
                personal computers, tablets, wearables, and accessories worldwide.""",
                "employees": 164000,
                "city": "Cupertino",
                "state": "California",
                "country": "United States",
                "exchange": "NASDAQ",
                "currency": "USD",
                "last_updated": "2024-01-01T00:00:00Z",
            }

            response = client.get("/companies/AAPL/company-info")
            assert response.status_code == 200
            data = response.json()
            assert data["ticker"] == "AAPL"

    def test_stock_data_endpoint(self, client):
        """Test stock data endpoint."""
        with (
            patch("app.routers.companies_router.YahooFinanceService") as mock_service_class,
            patch("app.routers.companies_router.CloudStorageService") as mock_cloud_service_class,
        ):
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            mock_service.get_comprehensive_data.return_value = {
                "ticker": "AAPL",
                "current_price": 150.0,
                "change": 2.5,
            }
            mock_service.build_stock_data_response.return_value = {
                "ticker": "AAPL",
                "current_price": 150.0,
                "previous_close": 147.5,
                "open": 148.0,
                "day_low": 147.0,
                "day_high": 151.0,
                "fifty_two_week_low": 120.0,
                "fifty_two_week_high": 200.0,
                "volume": 50000000,
                "avg_volume": 45000000,
                "market_cap": 2500000000000,
                "beta": 1.2,
                "pe_ratio": 25.0,
                "forward_pe": 24.0,
                "eps": 6.0,
                "forward_eps": 6.5,
                "dividend_yield": 0.5,
                "target_price": 160.0,
                "recommendation": "Buy",
                "price_change": 2.5,
                "price_change_percent": 1.69,
                "last_updated": "2024-01-01T00:00:00Z",
            }

            # Mock cloud storage service
            mock_cloud_service = Mock()
            mock_cloud_service_class.return_value = mock_cloud_service
            mock_cloud_service.read_json_file.side_effect = Exception("No cached data")

            response = client.get("/companies/AAPL/stock-data")
            assert response.status_code == 200
            data = response.json()
            assert data["ticker"] == "AAPL"
            assert "current_price" in data

    def test_financial_ratios_endpoint(self, client):
        """Test financial ratios endpoint."""
        with patch("app.routers.companies_router.FinancialRatiosService") as mock_service_class:
            mock_service = Mock()
            mock_service_class.return_value = mock_service

            # Mock the async method properly
            async def mock_calculate_financial_ratios(_ticker):
                return {
                    "ticker": "AAPL",
                    "ratios": {"pe_ratio": 25.0, "pb_ratio": 5.0},
                    "raw_data": {"current_price": 150.0, "book_value": 30.0},
                }

            mock_service.calculate_financial_ratios = mock_calculate_financial_ratios

            response = client.get("/companies/AAPL/financial-ratios")
            assert response.status_code == 200
            data = response.json()
            assert "ticker" in data
            assert "ratios" in data

    def test_invalid_ticker_returns_404(self, client):
        """Test invalid ticker returns 404."""
        with patch("app.routers.companies_router.YahooFinanceService") as mock_service_class:
            mock_service = Mock()
            mock_service_class.return_value = mock_service
            mock_service.get_stock_info.return_value = None

            response = client.get("/companies/INVALID/company-info")
            assert response.status_code == 404
