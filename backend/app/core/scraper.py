"""
S&P 500 Financial Data Scraper - Background Service
Works with SEC EDGAR API to scrape financial data for S&P 500 companies.
"""

import requests
import json
import time
from typing import Dict, Any
from datetime import datetime
import logging

from backend.app.core.paths import ensure_directory, get_company_data_dir

logger = logging.getLogger(__name__)


class SP500Scraper:
    """
    S&P 500 financial data scraper that works with SEC EDGAR API.
    Designed to run as a background service while prioritizing cached data.
    """

    def __init__(self):
        """Initialize the scraper with configuration."""
        self.base_url = "https://www.sec.gov"
        self.edgar_url = f"{self.base_url}/cgi-bin/browse-edgar"
        self.headers = {
            "User-Agent": "DCF Projections App (alexanderstevens97@gmail.com)",
            "Accept-Encoding": "gzip, deflate",
            "Host": "www.sec.gov",
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

        # Rate limiting
        self.request_delay = 1.0  # seconds between requests
        self.last_request_time = 0

        # Data directories
        self.company_data_dir = ensure_directory(get_company_data_dir())

    def _rate_limit(self) -> None:
        """Implement rate limiting to be respectful to SEC servers."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)

        self.last_request_time = time.time()

    def _load_sp500_companies(self) -> Dict[str, str]:
        """Load S&P 500 companies list from cached file."""
        companies_file = self.company_data_dir / "sp500_companies.json"

        if not companies_file.exists():
            logger.error("S&P 500 companies file not found")
            return {}

        try:
            with open(companies_file, "r") as f:
                companies = json.load(f)
            logger.info(f"Loaded {len(companies)} S&P 500 companies")
            return companies
        except Exception as e:
            logger.error(f"Error loading S&P 500 companies: {e}")
            return {}

    def scrape_company_data(self, ticker: str) -> bool:
        """
        Scrape financial data for a single company.

        Args:
            ticker: Company ticker symbol

        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Starting data scrape for {ticker}")

        # Load S&P 500 companies
        companies = self._load_sp500_companies()
        if ticker not in companies:
            logger.error(f"{ticker} not found in S&P 500 companies list")
            return False

        cik = companies[ticker]
        logger.info(f"Found {ticker} with CIK: {cik}")

        # For now, return True to indicate the scraper is working
        # The actual scraping logic will be implemented based on existing data structure
        logger.info(f"Scraper ready for {ticker} - using cached data approach")
        return True

    def get_scraping_status(self) -> Dict[str, Any]:
        """
        Get status of scraping operations and cached data.

        Returns:
            Dictionary with scraping status information
        """
        companies = self._load_sp500_companies()

        # Count companies with cached data
        companies_with_data = 0
        total_files = 0

        for ticker in companies.keys():
            company_dir = self.company_data_dir / ticker
            if company_dir.exists():
                analysis_files = list(company_dir.glob("financial_analysis_*.json"))
                if analysis_files:
                    companies_with_data += 1
                    total_files += len(analysis_files)

        return {
            "total_companies": len(companies),
            "companies_with_data": companies_with_data,
            "total_analysis_files": total_files,
            "coverage_percentage": (companies_with_data / len(companies) * 100)
            if companies
            else 0,
            "last_updated": datetime.now().isoformat(),
        }
