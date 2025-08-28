#!/usr/bin/env python3
"""
Main entry point for DCF Projections application.

This module provides a command-line interface for analyzing S&P 500 companies
using DCF calculations and sensitivity analysis.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Dict, Any, Optional

import argparse
import time

from app.features.sensitivity_analysis import SensitivityAnalyzer
from app.features.scraper import SP500Scraper
from app.features.company_analyzer import CompanyAnalyzer
from app.features.DCF_calculations import DCFCalculator


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DCFProjectionsCLI:
    """Command-line interface for DCF Projections application."""

    def __init__(self):
        self.scraper = SP500Scraper()
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
        dcf_group.add_argument(
            "--v",
            type=str,
            default="earnings_growth",
            choices=["earnings_growth"],
            help="Variable to increment (default: earnings_growth)",
        )

        # Sensitivity Analysis arguments
        sensitivity_group = parser.add_argument_group("Sensitivity Analysis Options")
        sensitivity_group.add_argument(
            "--sensitivity",
            action="store_true",
            help="Perform comprehensive sensitivity analysis",
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
            help="Range for sensitivity analysis as percentage (default: 0.50 = ±50%%)",
        )
        sensitivity_group.add_argument(
            "--plot-sensitivity",
            action="store_true",
            help="Generate sensitivity analysis plots",
        )
        sensitivity_group.add_argument(
            "--save-sensitivity-plot",
            type=str,
            help="Save sensitivity analysis plot to specified file path",
        )

        # Visualization and Overview arguments
        viz_group = parser.add_argument_group("Visualization Options")
        viz_group.add_argument(
            "--overview", action="store_true", help="Show company overview table"
        )
        viz_group.add_argument(
            "--chart", action="store_true", help="Display share price chart"
        )
        viz_group.add_argument(
            "--period",
            type=str,
            default="5y",
            choices=["1y", "2y", "5y", "10y", "max"],
            help="Time period for share price chart (default: 5y)",
        )
        viz_group.add_argument(
            "--save-chart", type=str, help="Save chart to specified file path"
        )

        return parser

    def list_companies(self) -> None:
        """List all available S&P 500 companies."""
        print("Available S&P 500 companies:")
        for ticker in sorted(self.scraper.sp500_companies.keys()):
            print(f"  {ticker}")

    def analyze_all_companies(self) -> None:
        """Analyze all S&P 500 companies with rate limiting."""
        print("Analyzing all S&P 500 companies...")
        print("Note: This will take a very long time and may hit SEC rate limits.")

        confirm = input("Are you sure you want to continue? (y/N): ")
        if confirm.lower() != "y":
            print("Operation cancelled.")
            return

        for ticker in self.scraper.sp500_companies.keys():
            try:
                logger.info(f"Analyzing {ticker}...")
                self.scraper.analyze_company(ticker)
                print(f"\n{'=' * 60}\n")
                time.sleep(1)  # Rate limiting
            except Exception as e:
                logger.error(f"Error analyzing {ticker}: {e}")
                continue

    def validate_ticker(self, ticker: str) -> bool:
        """Validate that the ticker exists in S&P 500 companies."""
        if ticker not in self.scraper.sp500_companies:
            logger.error(f"Error: {ticker} not found in S&P 500 companies list")
            return False
        return True

    def get_historical_data(
        self, ticker: str, years_back: int
    ) -> Optional[Dict[str, Any]]:
        """Fetch historical financial data for a ticker."""
        cik = self.scraper.sp500_companies[ticker]
        logger.info(f"Fetching {years_back} years of historical data for {ticker}...")

        try:
            historical_data = self.scraper.get_historical_financial_data(
                cik, years_back
            )
            if historical_data:
                logger.info(
                    f"✓ Historical data collected for years: {sorted(historical_data.keys())}"
                )
                return historical_data
            else:
                logger.error(f"Could not fetch historical data for {ticker}")
                return None
        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {e}")
            return None

    def perform_dcf_analysis(
        self, ticker: str, args: argparse.Namespace
    ) -> Optional[DCFCalculator]:
        """Perform DCF analysis for a given ticker."""
        if not self.validate_ticker(ticker):
            return None

        cik = self.scraper.sp500_companies[ticker]
        logger.info(f"Performing DCF analysis for {ticker} (CIK: {cik})...")
        logger.info(
            f"Parameters: {args.y} years back, base growth {args.eg:.1%}, {args.steps} steps of {args.s:.1%}"
        )

        # Get historical financial data
        historical_data = self.get_historical_data(ticker, args.y)
        if not historical_data:
            return None

        # Initialize DCF calculator
        dcf_calculator = DCFCalculator(ticker, historical_data)

        # Calculate DCF scenarios
        logger.info("Calculating DCF scenarios...")
        scenarios = dcf_calculator.calculate_dcf_scenarios(
            base_growth=args.eg, steps=args.steps, step_size=args.s
        )

        # Print results for each scenario
        for scenario_name, scenario_data in scenarios.items():
            dcf_calculator.print_dcf_summary(scenario_name, scenario_data)

        # Save DCF results
        self._save_dcf_results(ticker, args, historical_data, scenarios)

        return dcf_calculator

    def _save_dcf_results(
        self,
        ticker: str,
        args: argparse.Namespace,
        historical_data: Dict[str, Any],
        scenarios: Dict[str, Any],
    ) -> None:
        """Save DCF analysis results to file."""
        try:
            company_dir = self.scraper.company_data_dir / ticker
            company_dir.mkdir(exist_ok=True)

            dcf_filename = f"dcf_analysis_{datetime.now().strftime('%Y-%m-%d')}.json"
            dcf_file_path = company_dir / dcf_filename

            dcf_output = {
                "timestamp": datetime.now().isoformat(),
                "ticker": ticker,
                "parameters": {
                    "years_back": args.y,
                    "base_growth": args.eg,
                    "steps": args.steps,
                    "step_size": args.s,
                    "variable": args.v,
                },
                "historical_data": historical_data,
                "scenarios": scenarios,
            }

            with open(dcf_file_path, "w") as f:
                json.dump(dcf_output, f, indent=2, default=str)

            logger.info(f"DCF analysis saved to {dcf_file_path}")
        except Exception as e:
            logger.error(f"Error saving DCF results: {e}")

    def perform_sensitivity_analysis(
        self,
        ticker: str,
        args: argparse.Namespace,
        dcf_calculator: Optional[DCFCalculator] = None,
    ) -> None:
        """Perform sensitivity analysis for a given ticker."""
        logger.info(f"{'=' * 60}")
        logger.info(f"RUNNING COMPREHENSIVE SENSITIVITY ANALYSIS FOR {ticker}")
        logger.info(f"{'=' * 60}")

        # Initialize DCF calculator if not already done
        if not dcf_calculator:
            if not self.validate_ticker(ticker):
                return

            historical_data = self.get_historical_data(ticker, args.y)
            if not historical_data:
                return

            dcf_calculator = DCFCalculator(ticker, historical_data)

        # Initialize sensitivity analyzer
        sensitivity_analyzer = SensitivityAnalyzer(dcf_calculator)

        # Update base values based on command line arguments
        sensitivity_analyzer.base_values["earnings_growth_rate"] = args.eg
        sensitivity_analyzer.base_values["discount_rate"] = dcf_calculator.wacc
        sensitivity_analyzer.base_values["perpetual_growth_rate"] = (
            dcf_calculator.terminal_growth_rate
        )

        # Run comprehensive sensitivity analysis
        logger.info(
            f"Running sensitivity analysis with {args.sensitivity_steps} steps and ±{args.sensitivity_range:.1%} range..."
        )

        try:
            sensitivity_results = (
                sensitivity_analyzer.run_comprehensive_sensitivity_analysis(
                    steps=args.sensitivity_steps
                )
            )

            # Print comprehensive summary
            sensitivity_analyzer.print_sensitivity_summary(sensitivity_results)

            # Generate plots if requested
            if args.plot_sensitivity:
                logger.info("Generating sensitivity analysis plots...")
                save_path = args.save_sensitivity_plot
                sensitivity_analyzer.plot_sensitivity_analysis(
                    sensitivity_results, save_path
                )

            # Export results
            export_path = sensitivity_analyzer.export_sensitivity_results(
                sensitivity_results
            )
            logger.info(
                f"Sensitivity analysis complete! Results exported to: {export_path}"
            )

        except Exception as e:
            logger.error(f"Error during sensitivity analysis: {e}")

    def show_company_overview(self, ticker: str) -> None:
        """Show company overview table."""
        try:
            company_analyzer = CompanyAnalyzer(ticker)
            company_analyzer.print_company_overview_table()
        except Exception as e:
            logger.error(f"Error showing company overview for {ticker}: {e}")

    def show_share_price_chart(self, ticker: str, args: argparse.Namespace) -> None:
        """Display share price chart for a ticker."""
        try:
            logger.info(f"Generating share price chart for {ticker}...")
            company_analyzer = CompanyAnalyzer(ticker)
            save_path = args.save_chart
            company_analyzer.plot_share_price(period=args.period, save_path=save_path)
        except Exception as e:
            logger.error(f"Error generating share price chart for {ticker}: {e}")

    def analyze_single_company(self, ticker: str, args: argparse.Namespace) -> None:
        """Analyze a single company based on the provided arguments."""
        ticker = ticker.upper()

        # Show company overview if requested
        if args.overview:
            self.show_company_overview(ticker)

        # Show share price chart if requested
        if args.chart:
            self.show_share_price_chart(ticker, args)

        # Perform DCF analysis if requested
        dcf_calculator = None
        if args.dcf:
            dcf_calculator = self.perform_dcf_analysis(ticker, args)

        # Run sensitivity analysis if requested
        if args.sensitivity:
            self.perform_sensitivity_analysis(ticker, args, dcf_calculator)

        # Regular company analysis (only if no other options selected)
        if not any([args.overview, args.chart, args.dcf, args.sensitivity]):
            try:
                self.scraper.analyze_company(ticker)
            except Exception as e:
                logger.error(f"Error during regular company analysis for {ticker}: {e}")

    def run(self) -> int:
        """Main execution method."""
        try:
            parser = self.setup_argument_parser()
            self.args = parser.parse_args()

            # Handle list command
            if self.args.list:
                self.list_companies()
                return 0

            # Handle analyze all command
            if self.args.all:
                self.analyze_all_companies()
                return 0

            # Handle single ticker analysis
            if self.args.ticker:
                self.analyze_single_company(self.args.ticker, self.args)
                return 0

            # No valid arguments provided
            parser.print_help()
            return 1

        except KeyboardInterrupt:
            logger.info("Operation cancelled by user.")
            return 1
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return 1


def main() -> int:
    """Main entry point."""
    cli = DCFProjectionsCLI()
    return cli.run()


if __name__ == "__main__":
    sys.exit(main())
