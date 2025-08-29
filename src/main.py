#!/usr/bin/env python3
"""
Main entry point for DCF Projections application.

This module provides a command-line interface for analyzing S&P 500 companies
using DCF calculations and sensitivity analysis.
"""

import logging
import sys
from typing import Dict, Any

import argparse

from app.services.dcf_service import DCFService
from app.features.scraper import SP500Scraper
from app.features.company_analyzer import CompanyAnalyzer
from app.features.financial_ratios import FinancialRatiosAnalyzer


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DCFProjectionsCLI:
    """Command-line interface for DCF Projections application."""

    def __init__(self):
        self.scraper = SP500Scraper()
        self.dcf_service = DCFService()
        self.args = None

    def setup_argument_parser(self) -> argparse.ArgumentParser:
        """Set up and configure the argument parser."""
        parser = argparse.ArgumentParser(
            description="S&P 500 Financial Data Scraper with DCF Analysis",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  Regular analysis:     python main.py --ticker AAPL
  DCF analysis:         python main.py --ticker AAPL --dcf --y 3 --eg 0.15 --steps 2 --s 0.10
  Sensitivity analysis: python main.py --ticker AAPL --sensitivity --sensitivity-steps 11 --sensitivity-range 0.50
  Company overview:     python main.py --ticker AAPL --overview
  Financial ratios:     python main.py --ticker AAPL --ratios
  Save ratios to CSV:   python main.py --ticker AAPL --ratios --save-ratios default
  Share price chart:    python main.py --ticker AAPL --chart --period 5y
  Save chart:           python main.py --ticker AAPL --chart --save-chart charts/AAPL_price.png
            """,
        )

        # Basic arguments
        parser.add_argument(
            "--ticker", "-t", type=str, help="Company ticker symbol to analyze"
        )
        parser.add_argument(
            "--all", "-a", action="store_true", help="Analyze all S&P 500 companies"
        )
        parser.add_argument(
            "--list",
            "-l",
            action="store_true",
            help="List all available S&P 500 companies",
        )

        # DCF Analysis arguments
        dcf_group = parser.add_argument_group("DCF Analysis Options")
        dcf_group.add_argument(
            "--dcf", action="store_true", help="Perform DCF analysis"
        )
        dcf_group.add_argument(
            "--y",
            type=int,
            default=3,
            help="Years of historical data to fetch (default: 3)",
        )
        dcf_group.add_argument(
            "--eg",
            type=float,
            default=0.15,
            help="Base earnings growth rate (default: 0.15 = 15%%)",
        )
        dcf_group.add_argument(
            "--steps",
            type=int,
            default=2,
            help="Number of additional growth scenarios (default: 2)",
        )
        dcf_group.add_argument(
            "--s",
            type=float,
            default=0.10,
            help="Step size for growth rate increments (default: 0.10 = 10%%)",
        )

        # Sensitivity Analysis arguments
        sensitivity_group = parser.add_argument_group("Sensitivity Analysis Options")
        sensitivity_group.add_argument(
            "--sensitivity", action="store_true", help="Run sensitivity analysis"
        )
        sensitivity_group.add_argument(
            "--sensitivity-steps",
            type=int,
            default=11,
            help="Number of steps in sensitivity analysis (default: 11)",
        )
        sensitivity_group.add_argument(
            "--sensitivity-range",
            type=float,
            default=0.50,
            help="Range for sensitivity analysis (default: 0.50 = ±50%%)",
        )

        # Additional Analysis Options
        parser.add_argument(
            "--overview", action="store_true", help="Show company overview"
        )
        parser.add_argument(
            "--ratios", action="store_true", help="Show financial ratios"
        )
        parser.add_argument(
            "--save-ratios",
            type=str,
            help="Save financial ratios to CSV file (specify filename or use default)",
        )
        parser.add_argument(
            "--chart", action="store_true", help="Display share price chart"
        )
        parser.add_argument(
            "--period",
            type=str,
            default="1y",
            help="Chart period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)",
        )
        parser.add_argument(
            "--save-chart",
            type=str,
            help="Save chart to specified file path",
        )

        return parser

    def run(self):
        """Main execution method."""
        parser = self.setup_argument_parser()
        self.args = parser.parse_args()

        try:
            if self.args.list:
                self.list_companies()
            elif self.args.all:
                self.analyze_all_companies()
            elif self.args.ticker:
                self.analyze_company(self.args.ticker)
            else:
                parser.print_help()

        except KeyboardInterrupt:
            logger.info("Analysis interrupted by user.")
            sys.exit(0)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            sys.exit(1)

    def list_companies(self):
        """List all available S&P 500 companies."""
        logger.info("Fetching S&P 500 companies...")
        companies = self.scraper.get_sp500_companies()

        print(f"\nS&P 500 Companies ({len(companies)} total):")
        print("=" * 60)

        for company in companies[:20]:  # Show first 20
            print(f"{company['ticker']:<8} | {company['name']}")

        if len(companies) > 20:
            print(f"... and {len(companies) - 20} more companies")

    def analyze_company(self, ticker: str):
        """Analyze a specific company."""
        logger.info(f"Analyzing company: {ticker}")

        # Financial ratios (works independently of scraper)
        if self.args.ratios:
            self.show_financial_ratios(ticker)

        # Company overview (requires financial data from scraper)
        if self.args.overview:
            financial_data = self.scraper.analyze_company(ticker)
            if financial_data:
                self.show_company_overview(ticker, financial_data)
            else:
                logger.error(f"Could not fetch data for {ticker}")

        # DCF analysis (requires financial data from scraper)
        if self.args.dcf:
            financial_data = self.scraper.analyze_company(ticker)
            if financial_data:
                self.run_dcf_analysis(ticker, financial_data)
            else:
                logger.error(f"Could not fetch data for {ticker}")

        # Sensitivity analysis (requires financial data from scraper)
        if self.args.sensitivity:
            financial_data = self.scraper.analyze_company(ticker)
            if financial_data:
                self.run_sensitivity_analysis(ticker, financial_data)
            else:
                logger.error(f"Could not fetch data for {ticker}")

        # Chart
        if self.args.chart:
            self.show_price_chart(ticker)

    def show_company_overview(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ):
        """Display company overview."""
        if financial_data:
            analyzer = CompanyAnalyzer(ticker, financial_data)
            analyzer.print_company_overview()
        else:
            logger.error(f"No financial data available for {ticker}")

    def show_financial_ratios(self, ticker: str):
        """Display financial ratios."""
        logger.info(f"Calculating financial ratios for {ticker}")

        ratios_analyzer = FinancialRatiosAnalyzer(ticker)
        ratios_analyzer.print_financial_ratios_table()

        # Save to CSV if requested
        if self.args.save_ratios:
            if self.args.save_ratios == "default":
                # Use default filename
                ratios_analyzer.save_ratios_to_csv()
            else:
                # Use custom filename
                ratios_analyzer.save_ratios_to_csv(self.args.save_ratios)

    def run_dcf_analysis(self, ticker: str, financial_data: Dict[int, Dict[str, Any]]):
        """Run DCF analysis."""
        logger.info("Running DCF analysis...")

        # Create DCF calculator through service
        dcf_calculator = self.dcf_service.create_dcf_calculator(ticker, financial_data)

        # Run base case
        base_results = self.dcf_service.run_dcf_analysis(
            earnings_growth_rate=self.args.eg, years=self.args.y
        )

        # Print results
        dcf_calculator.print_dcf_summary("Base Case", base_results)

        # Run additional scenarios if requested
        if self.args.steps > 0:
            self.run_additional_scenarios(dcf_calculator, base_results)

    def run_additional_scenarios(self, dcf_calculator, base_results):
        """Run additional growth rate scenarios."""
        base_growth = self.args.eg
        step_size = self.args.s

        for i in range(1, self.args.steps + 1):
            growth_rate = base_growth + (i * step_size)
            scenario_name = f"Scenario {i} (+{i * step_size:.1%})"

            scenario_results = self.dcf_service.run_dcf_analysis(
                earnings_growth_rate=growth_rate, years=self.args.y
            )

            dcf_calculator.print_dcf_summary(scenario_name, scenario_results)

    def run_sensitivity_analysis(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ):
        """Run sensitivity analysis."""
        logger.info("Running sensitivity analysis...")

        # Create DCF calculator through service
        self.dcf_service.create_dcf_calculator(ticker, financial_data)

        # Run sensitivity analysis
        results = self.dcf_service.run_sensitivity_analysis(
            steps=self.args.sensitivity_steps
        )

        # Print results (simplified for CLI)
        print(f"\nSensitivity Analysis Results for {ticker}:")
        print("=" * 50)
        print(f"Variable: {results.get('variable', 'N/A')}")
        print(f"Base Value: {results.get('base_value', 'N/A')}")
        print(f"Steps: {len(results.get('enterprise_values', []))}")

    def show_price_chart(self, ticker: str):
        """Display or save price chart."""
        logger.info(f"Fetching price chart for {ticker}")

        # This would integrate with your charting functionality
        print(f"Chart functionality for {ticker} - period: {self.args.period}")

        if self.args.save_chart:
            print(f"Chart would be saved to: {self.args.save_chart}")

    def analyze_all_companies(self):
        """Analyze all S&P 500 companies."""
        logger.info("This feature is not yet implemented for performance reasons.")
        logger.info("Use --ticker to analyze individual companies.")


def main():
    """Main entry point."""
    cli = DCFProjectionsCLI()
    cli.run()


if __name__ == "__main__":
    main()
