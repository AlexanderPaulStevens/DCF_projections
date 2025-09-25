import yfinance as yf
import pandas as pd
from tabulate import tabulate
from typing import Dict, Any, Optional

from backend.app.core.paths import ensure_directory, get_company_data_dir


class FinancialRatiosAnalyzer:
    """
    Analyzer for calculating and displaying key financial ratios for companies.
    """

    def __init__(self, ticker: str):
        """
        Initialize financial ratios analyzer.

        Args:
            ticker (str): Company ticker symbol
        """
        self.ticker = ticker
        self.yf_ticker = yf.Ticker(ticker)

    def get_financial_ratios(self) -> Dict[str, Any]:
        """
        Calculate key financial ratios for the company.

        Returns:
            dict: Dictionary containing all calculated ratios
        """
        try:
            # Get company info from Yahoo Finance
            info = self.yf_ticker.info

            # Get current stock price
            current_price = info.get("currentPrice")
            if not current_price:
                # Try to get from regular market price
                current_price = info.get("regularMarketPrice")

            # Get earnings per share (trailing twelve months)
            eps_ttm = info.get("trailingEps")

            # Get book value per share
            book_value = info.get("bookValue")

            # Get earnings growth rate (yearly)
            earnings_growth = info.get("earningsGrowth")

            # Get free cash flow per share
            fcf_per_share = info.get("freeCashflow")
            shares_outstanding = info.get("sharesOutstanding")

            # Calculate ratios
            ratios = {}

            # Price-Earnings Ratio
            if current_price and eps_ttm and eps_ttm != 0:
                ratios["Price-Earnings Ratio"] = current_price / eps_ttm
            else:
                ratios["Price-Earnings Ratio"] = None

            # Earnings Yield
            if current_price and eps_ttm and current_price != 0:
                ratios["Earnings Yield"] = eps_ttm / current_price
            else:
                ratios["Earnings Yield"] = None

            # Price to Book Ratio
            if current_price and book_value and book_value != 0:
                ratios["Price to Book Ratio"] = current_price / book_value
            else:
                ratios["Price to Book Ratio"] = None

            # PEG Ratio
            if (
                current_price
                and eps_ttm
                and earnings_growth
                and eps_ttm != 0
                and earnings_growth != 0
            ):
                pe_ratio = current_price / eps_ttm
                ratios["PEG Ratio"] = pe_ratio / earnings_growth
            else:
                ratios["PEG Ratio"] = None

            # Free Cash Flow Yield
            if (
                fcf_per_share
                and shares_outstanding
                and current_price
                and current_price != 0
                and shares_outstanding != 0
            ):
                # Calculate FCF per share if the value is total FCF
                if (
                    fcf_per_share > 1000000
                ):  # If it's a very large number, it's likely total FCF
                    fcf_per_share = fcf_per_share / shares_outstanding
                ratios["Free Cash Flow Yield"] = fcf_per_share / current_price
            else:
                ratios["Free Cash Flow Yield"] = None

            # Store raw values for reference
            ratios["_raw_data"] = {
                "Current Price": current_price,
                "EPS (TTM)": eps_ttm,
                "Book Value per Share": book_value,
                "Earnings Growth (Yearly)": earnings_growth,
                "Free Cash Flow per Share": fcf_per_share,
                "Shares Outstanding": shares_outstanding,
            }

            return ratios

        except Exception as e:
            print(f"Error calculating financial ratios for {self.ticker}: {e}")
            return {}

    def format_ratio_value(self, value: Any, ratio_name: str) -> str:
        """
        Format ratio values for display.

        Args:
            value: The ratio value to format
            ratio_name: Name of the ratio for context

        Returns:
            str: Formatted value string
        """
        if value is None:
            return "N/A"

        if isinstance(value, (int, float)):
            if "Yield" in ratio_name:
                # Convert to percentage for yield ratios
                return f"{value * 100:.2f}%"
            elif "Ratio" in ratio_name:
                # Format ratios to 2 decimal places
                return f"{value:.2f}"
            else:
                return f"{value:.2f}"

        return str(value)

    def print_financial_ratios_table(self):
        """
        Print financial ratios in a nicely formatted table.
        """
        ratios = self.get_financial_ratios()

        if not ratios:
            print(f"Could not calculate financial ratios for {self.ticker}")
            return

        # Remove raw data from display
        raw_data = ratios.pop("_raw_data", {})

        # Format the data for display
        formatted_data = []
        for ratio_name, value in ratios.items():
            formatted_value = self.format_ratio_value(value, ratio_name)
            formatted_data.append([ratio_name, formatted_value])

        # Print the table
        print(f"\n{'=' * 80}")
        print(f"FINANCIAL RATIOS: {self.ticker.upper()}")
        print(f"{'=' * 80}")
        print(tabulate(formatted_data, headers=["Ratio", "Value"], tablefmt="grid"))
        print(f"{'=' * 80}")

        # Print raw data for reference
        print(f"\nRaw Data for {self.ticker}:")
        print("-" * 40)
        for key, value in raw_data.items():
            if isinstance(value, (int, float)):
                if "Price" in key or "Value" in key:
                    formatted_value = f"${value:.2f}" if value else "N/A"
                elif "Growth" in key:
                    formatted_value = f"{value * 100:.2f}%" if value else "N/A"
                else:
                    formatted_value = f"{value:,.0f}" if value else "N/A"
            else:
                formatted_value = str(value) if value else "N/A"
            print(f"{key}: {formatted_value}")

    def save_ratios_to_csv(self, filename: Optional[str] = None) -> str:
        """
        Save financial ratios to a CSV file.

        Args:
            filename (str, optional): Custom filename. If None, generates default name.

        Returns:
            str: Path to the saved file
        """
        ratios = self.get_financial_ratios()

        if not ratios:
            print(f"Could not calculate financial ratios for {self.ticker}")
            return ""

        # Remove raw data for CSV
        ratios.pop("_raw_data", {})

        # Create DataFrame
        df = pd.DataFrame(list(ratios.items()), columns=["Ratio", "Value"])

        # Generate filename if not provided
        if not filename:
            from datetime import datetime

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"financial_ratios_{self.ticker}_{timestamp}.csv"

        # Ensure it's saved in the shared company data directory
        company_dir = ensure_directory(get_company_data_dir() / self.ticker)
        file_path = company_dir / filename

        # Save to CSV
        df.to_csv(file_path, index=False)
        print(f"Financial ratios saved to: {file_path}")

        return str(file_path)

    def get_ratios_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all ratios for programmatic use.

        Returns:
            dict: Dictionary with ratio names as keys and values
        """
        ratios = self.get_financial_ratios()

        if not ratios:
            return {}

        # Remove raw data
        ratios.pop("_raw_data", {})

        return ratios
