"""
CLI Service - Handles command-line interface logic and flow control
Works only with cached data from company_data folder
"""

import argparse
import sys
import json
from backend.app.core.paths import get_company_data_dir
from typing import Dict, Any, Optional
from backend.app.services.dcf_service import DCFService
from backend.app.core.financial_ratios import FinancialRatiosAnalyzer
from backend.app.utils.logger import get_logger

logger = get_logger(__name__)


class CLIService:
    """Service for handling CLI operations and flow control using cached data only."""

    def __init__(self):
        self.dcf_service = DCFService()
        self.args = None
        self.company_data_dir = get_company_data_dir()

    def setup_argument_parser(self) -> argparse.ArgumentParser:
        """Set up and configure the argument parser."""
        parser = argparse.ArgumentParser(
            description="S&P 500 Financial Data Analysis using Cached Data",
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

Note: This tool only works with cached data. To scrape new data, use the scripts in company_data/ folder.
            """,
        )

        # Basic arguments
        parser.add_argument(
            "--ticker", "-t", type=str, help="Company ticker symbol to analyze"
        )
        parser.add_argument(
            "--list",
            "-l",
            action="store_true",
            help="List all available cached companies",
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
            help="Years of historical data to use (default: 3)",
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

    def parse_arguments(self) -> argparse.Namespace:
        """Parse command line arguments."""
        parser = self.setup_argument_parser()
        self.args = parser.parse_args()
        return self.args

    def execute_command(self) -> None:
        """Execute the parsed command."""
        try:
            if self.args.list:
                self._handle_list_cached_companies()
            elif self.args.ticker:
                self._handle_analyze_company(self.args.ticker)
            else:
                self._handle_show_help()

        except KeyboardInterrupt:
            logger.info("Analysis interrupted by user.")
            sys.exit(0)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            sys.exit(1)

    def _handle_list_cached_companies(self) -> None:
        """Handle list cached companies command."""
        logger.info("Listing cached companies...")

        if not self.company_data_dir.exists():
            print("❌ No company_data folder found!")
            print("Run the scraping scripts in company_data/ folder first.")
            return

        # Get all company directories
        company_dirs = [
            d
            for d in self.company_data_dir.iterdir()
            if d.is_dir() and d.name.isupper()
        ]

        if not company_dirs:
            print("❌ No cached company data found!")
            print("Run the scraping scripts in company_data/ folder first.")
            return

        print(f"\nCached Companies ({len(company_dirs)} total):")
        print("=" * 60)

        for company_dir in sorted(company_dirs)[:20]:  # Show first 20
            ticker = company_dir.name
            # Check if company has financial data
            analysis_files = list(company_dir.glob("financial_analysis_*.json"))
            if analysis_files:
                print(f"{ticker:<8} | ✅ Has financial data")
            else:
                print(f"{ticker:<8} | ❌ No financial data")

        if len(company_dirs) > 20:
            print(f"... and {len(company_dirs) - 20} more companies")

        print(
            "\nTo scrape new data, use: cd company_data && python scrape_company.py TICKER"
        )

    def _handle_analyze_company(self, ticker: str) -> None:
        """Handle analyze company command using cached data."""
        logger.info(f"Analyzing company: {ticker} (using cached data)")

        # Check if company data exists
        if not self._company_data_exists(ticker):
            logger.error(f"No cached data found for {ticker}")
            logger.info(
                f"To scrape data for {ticker}, run: cd company_data && python scrape_company.py {ticker}"
            )
            return

        # Load cached financial data
        financial_data = self._load_cached_financial_data(ticker)
        if not financial_data:
            logger.error(f"Could not load cached data for {ticker}")
            return

        # Financial ratios (works independently of scraper)
        if self.args.ratios:
            self._handle_financial_ratios(ticker)

        # Company overview (requires financial data from cache)
        if self.args.overview:
            self._handle_company_overview(ticker, financial_data)

        # DCF analysis (requires financial data from cache)
        if self.args.dcf:
            self._handle_dcf_analysis(ticker, financial_data)

        # Sensitivity analysis (requires financial data from cache)
        if self.args.sensitivity:
            self._handle_sensitivity_analysis(ticker, financial_data)

        # Chart
        if self.args.chart:
            self._handle_price_chart(ticker)

    def _company_data_exists(self, ticker: str) -> bool:
        """Check if cached data exists for a company."""
        company_dir = self.company_data_dir / ticker
        if not company_dir.exists():
            return False

        # Check for financial analysis files
        analysis_files = list(company_dir.glob("financial_analysis_*.json"))
        return len(analysis_files) > 0

    def _load_cached_financial_data(
        self, ticker: str
    ) -> Optional[Dict[int, Dict[str, Any]]]:
        """Load cached financial data for a company."""
        company_dir = self.company_data_dir / ticker

        # Find the most recent financial analysis file
        analysis_files = list(company_dir.glob("financial_analysis_*.json"))
        if not analysis_files:
            return None

        # Get the most recent file
        latest_file = max(analysis_files, key=lambda x: x.stat().st_mtime)

        try:
            with open(latest_file, "r") as f:
                data = json.load(f)

            # Convert to the expected format
            financial_data = {}
            if "financial_metrics" in data:
                # Extract year from filename or use current year
                year = 2024  # Default year
                financial_data[year] = data["financial_metrics"]

                # Add calculated metrics if available
                if "calculated_metrics" in data:
                    financial_data[year].update(data["calculated_metrics"])

            return financial_data

        except Exception as e:
            logger.error(f"Error loading cached data for {ticker}: {e}")
            return None

    def _handle_show_help(self) -> None:
        """Handle show help command."""
        parser = self.setup_argument_parser()
        parser.print_help()

    def _handle_financial_ratios(self, ticker: str) -> None:
        """Handle financial ratios analysis."""
        logger.info(f"Calculating financial ratios for {ticker}")

        ratios_analyzer = FinancialRatiosAnalyzer(ticker)
        ratios_analyzer.print_financial_ratios_table()

        # Save to CSV if requested
        if self.args.save_ratios:
            if self.args.save_ratios == "default":
                ratios_analyzer.save_ratios_to_csv()
            else:
                ratios_analyzer.save_ratios_to_csv(self.args.save_ratios)

    def _handle_company_overview(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ) -> None:
        """Handle company overview analysis using cached data."""
        logger.info(f"Company overview for {ticker}")
        print(f"\n=== {ticker} Company Overview ===")
        print(f"Financial data available: {len(financial_data)} years")
        print(
            f"Latest year data: {max(financial_data.keys()) if financial_data else 'N/A'}"
        )
        print("Use the web interface for detailed analysis.")

    def _handle_dcf_analysis(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ) -> None:
        """Handle DCF analysis using cached data."""
        self._run_dcf_analysis(ticker, financial_data)

    def _handle_sensitivity_analysis(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ) -> None:
        """Handle sensitivity analysis using cached data."""
        self._run_sensitivity_analysis(ticker, financial_data)

    def _handle_price_chart(self, ticker: str) -> None:
        """Handle price chart display."""
        logger.info(f"Fetching price chart for {ticker}")
        print(f"Chart functionality for {ticker} - period: {self.args.period}")

        if self.args.save_chart:
            print(f"Chart would be saved to: {self.args.save_chart}")

    def _run_dcf_analysis(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ) -> None:
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
            self._run_additional_scenarios(dcf_calculator, base_results)

    def _run_additional_scenarios(self, dcf_calculator, base_results) -> None:
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

    def _run_sensitivity_analysis(
        self, ticker: str, financial_data: Dict[int, Dict[str, Any]]
    ) -> None:
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
