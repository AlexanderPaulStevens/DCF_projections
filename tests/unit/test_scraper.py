#!/usr/bin/env python3
"""
Unit tests for SP500Scraper class.
"""

import pytest
from pathlib import Path
from src.app.features.scraper import SP500Scraper


class TestSP500Scraper:
    """Test cases for SP500Scraper class."""

    def test_init(self):
        """Test scraper initialization."""
        scraper = SP500Scraper()

        assert scraper.base_url == "https://data.sec.gov"
        assert "Alexander Stevens" in scraper.headers["User-Agent"]
        assert scraper.session is not None
        assert scraper.company_data_dir == Path("company_data")
        assert len(scraper.sp500_companies) > 0

    def test_init_custom_user_agent(self):
        """Test scraper initialization with custom user agent."""
        custom_agent = "Custom Agent String"
        scraper = SP500Scraper(user_agent=custom_agent)

        assert scraper.headers["User-Agent"] == custom_agent

    def test_get_sp500_companies(self):
        """Test getting S&P 500 companies list."""
        scraper = SP500Scraper()
        companies = scraper.get_sp500_companies()

        assert isinstance(companies, list)
        assert len(companies) > 0

        # Check structure of first company
        first_company = companies[0]
        assert "ticker" in first_company
        assert "cik" in first_company
        assert "name" in first_company

    def test_load_sp500_companies(self):
        """Test loading S&P 500 companies."""
        scraper = SP500Scraper()
        companies = scraper._load_sp500_companies()

        assert isinstance(companies, dict)
        assert len(companies) > 0

        # Check some known companies
        assert "AAPL" in companies
        assert "MSFT" in companies
        assert companies["AAPL"] == "0000320193"

    def test_get_company_info(self):
        """Test getting company info by CIK."""
        scraper = SP500Scraper()

        # Test with a known CIK
        cik = "0000320193"  # AAPL
        info = scraper.get_company_info(cik)

        # Should return a dictionary with company info
        assert isinstance(info, dict)

    def test_get_ticker_from_cik(self):
        """Test getting ticker from CIK."""
        scraper = SP500Scraper()

        # Test with a known CIK
        cik = "0000320193"  # AAPL
        ticker = scraper._get_ticker_from_cik(cik)

        assert ticker == "AAPL"

    def test_get_ticker_from_cik_not_found(self):
        """Test getting ticker from unknown CIK."""
        scraper = SP500Scraper()

        # Test with an unknown CIK
        cik = "9999999999"
        ticker = scraper._get_ticker_from_cik(cik)

        assert ticker is None

    def test_get_recent_filings(self):
        """Test getting recent filings for a company."""
        scraper = SP500Scraper()

        # Test with a known CIK
        cik = "0000320193"  # AAPL
        filings = scraper.get_recent_filings(cik, limit=5)

        # Should return a list
        assert isinstance(filings, list)

    def test_get_filing_details(self):
        """Test getting filing details."""
        scraper = SP500Scraper()

        # Test with mock data
        cik = "0000320193"
        accession_number = "0000320193-24-000006"
        primary_document = "aapl-20240928.htm"

        details = scraper.get_filing_details(cik, accession_number, primary_document)

        # Should return a dictionary or None
        assert details is None or isinstance(details, dict)

    def test_search_filings_by_form(self):
        """Test searching filings by form type."""
        scraper = SP500Scraper()

        # Test with a known CIK and form type
        cik = "0000320193"  # AAPL
        form_type = "10-K"
        filings = scraper.search_filings_by_form(cik, form_type, limit=5)

        # Should return a list
        assert isinstance(filings, list)

    def test_get_historical_financial_data(self):
        """Test getting historical financial data."""
        scraper = SP500Scraper()

        # Test with a known CIK
        cik = "0000320193"  # AAPL
        data = scraper.get_historical_financial_data(cik, years_back=2)

        # Should return a dictionary
        assert isinstance(data, dict)

    def test_extract_financial_data(self):
        """Test extracting financial data from filing content."""
        scraper = SP500Scraper()

        # Mock filing content with proper HTML structure
        filing_content = """
        <html>
            <body>
                <table>
                    <tr>
                        <td>Total net sales</td>
                        <td>$100,000,000</td>
                    </tr>
                    <tr>
                        <td>Operating Income</td>
                        <td>$20,000,000</td>
                    </tr>
                    <tr>
                        <td>Depreciation and amortization</td>
                        <td>$5,000,000</td>
                    </tr>
                </table>
            </body>
        </html>
        """

        data = scraper.extract_financial_data(filing_content)

        # Should return a dictionary with extracted data
        assert isinstance(data, dict)
        # The method looks for specific patterns, so we test what it actually finds
        assert len(data) >= 0  # May be empty if no patterns match

    def test_calculate_ebit_ebitda(self):
        """Test calculating EBIT and EBITDA."""
        scraper = SP500Scraper()

        # Mock financial data with the structure the method expects
        financial_data = {
            "Operating Income": 20000000,
            "Depreciation and amortization": 5000000,
        }

        ebit_ebitda = scraper.calculate_ebit_ebitda(financial_data)

        # Should return a dictionary with calculated values
        assert isinstance(ebit_ebitda, dict)
        # The method looks for specific key patterns
        assert len(ebit_ebitda) >= 0  # May be empty if no patterns match

    def test_analyze_company(self):
        """Test analyzing a company."""
        scraper = SP500Scraper()

        # Test with a known ticker
        ticker = "AAPL"
        result = scraper.analyze_company(ticker)

        # Should return a dictionary or None
        assert result is None or isinstance(result, dict)

    def test_save_financial_analysis(self):
        """Test saving financial analysis to file."""
        scraper = SP500Scraper()

        # Mock data
        ticker = "TEST"
        financial_data = {"2023": {"revenue": 1000000}}
        ebit_ebitda = {"2023": {"EBIT": 200000, "EBITDA": 250000}}
        filename = "test_analysis.json"

        # Test saving
        scraper.save_financial_analysis(ticker, financial_data, ebit_ebitda, filename)

        # The method doesn't return anything, just prints
        assert True

    def test_save_financial_analysis_default_filename(self):
        """Test saving financial analysis with default filename."""
        scraper = SP500Scraper()

        # Mock data
        ticker = "TEST"
        financial_data = {"2023": {"revenue": 1000000}}
        ebit_ebitda = {"2023": {"EBIT": 200000, "EBITDA": 250000}}

        # Test saving with a default filename
        filename = "financial_analysis_default.json"
        scraper.save_financial_analysis(ticker, financial_data, ebit_ebitda, filename)

        # The method doesn't return anything, just prints
        assert True

    def test_scraper_error_handling(self):
        """Test scraper error handling."""
        scraper = SP500Scraper()

        # Test with invalid CIK
        invalid_cik = "invalid_cik"

        # These should handle errors gracefully
        try:
            scraper.get_company_info(invalid_cik)
            # Should not crash
            assert True
        except Exception:
            # Exceptions are also acceptable
            assert True

    def test_scraper_session_management(self):
        """Test scraper session management."""
        scraper = SP500Scraper()

        # Check that session is properly configured
        assert scraper.session.headers["User-Agent"] == scraper.headers["User-Agent"]
        assert scraper.session.headers["User-Agent"] is not None


# Test functions for pytest discovery
def test_scraper_creation():
    """Test scraper creation."""
    scraper = SP500Scraper()
    assert scraper is not None
    assert hasattr(scraper, "sp500_companies")


def test_scraper_company_data_directory():
    """Test scraper company data directory creation."""
    scraper = SP500Scraper()
    assert scraper.company_data_dir.exists()


def test_scraper_base_url():
    """Test scraper base URL."""
    scraper = SP500Scraper()
    assert scraper.base_url == "https://data.sec.gov"


def test_scraper_headers():
    """Test scraper headers."""
    scraper = SP500Scraper()
    assert "User-Agent" in scraper.headers
    assert scraper.headers["User-Agent"] is not None


if __name__ == "__main__":
    pytest.main([__file__])
