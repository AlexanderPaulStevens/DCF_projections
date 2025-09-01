#!/usr/bin/env python3
"""
Main entry point for DCF Projections application.

This module provides a thin entry point that delegates to the CLI service.
Works only with cached data from the company_data folder.

To scrape new data, use the scripts in company_data/ folder:
- python company_data/scrape_company.py TICKER
- python company_data/scrape_sp500.py
"""

from app.services.cli_service import CLIService


def main():
    """Main entry point."""
    cli_service = CLIService()
    cli_service.parse_arguments()
    cli_service.execute_command()


if __name__ == "__main__":
    main()
