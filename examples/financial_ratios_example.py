#!/usr/bin/env python3
"""
Example script demonstrating financial ratios analysis functionality.

This script shows how to:
1. Calculate financial ratios for a company
2. Display ratios in a formatted table
3. Save ratios to CSV
4. Compare ratios across multiple companies
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.append(str(Path(__file__).parent.parent / "src"))

from app.features.financial_ratios import FinancialRatiosAnalyzer


def analyze_single_company(ticker: str, save_csv: bool = False):
    """
    Analyze financial ratios for a single company.

    Args:
        ticker (str): Company ticker symbol
        save_csv (bool): Whether to save results to CSV
    """
    print(f"\n{'=' * 80}")
    print(f"ANALYZING FINANCIAL RATIOS FOR {ticker.upper()}")
    print(f"{'=' * 80}")

    # Create analyzer
    analyzer = FinancialRatiosAnalyzer(ticker)

    # Display ratios table
    analyzer.print_financial_ratios_table()

    # Save to CSV if requested
    if save_csv:
        csv_path = analyzer.save_ratios_to_csv()
        print(f"\nRatios saved to: {csv_path}")

    return analyzer


def compare_companies(tickers: list):
    """
    Compare financial ratios across multiple companies.

    Args:
        tickers (list): List of company ticker symbols
    """
    print(f"\n{'=' * 100}")
    print("COMPARING FINANCIAL RATIOS ACROSS COMPANIES")
    print(f"{'=' * 100}")

    all_ratios = {}

    # Collect ratios for all companies
    for ticker in tickers:
        try:
            analyzer = FinancialRatiosAnalyzer(ticker)
            ratios = analyzer.get_ratios_summary()
            all_ratios[ticker] = ratios
            print(f"✓ Collected ratios for {ticker}")
        except Exception as e:
            print(f"✗ Failed to collect ratios for {ticker}: {e}")
            all_ratios[ticker] = {}

    # Display comparison table
    if all_ratios:
        print("\n" + "=" * 100)
        print("FINANCIAL RATIOS COMPARISON")
        print("=" * 100)

        # Get all unique ratio names
        all_ratio_names = set()
        for ratios in all_ratios.values():
            all_ratio_names.update(ratios.keys())

        # Create comparison table
        ratio_names = sorted(list(all_ratio_names))

        # Header
        header = f"{'Ratio':<25}"
        for ticker in tickers:
            header += f"{ticker:>15}"
        print(header)
        print("-" * (25 + 15 * len(tickers)))

        # Data rows
        for ratio_name in ratio_names:
            row = f"{ratio_name:<25}"
            for ticker in tickers:
                value = all_ratios[ticker].get(ratio_name, "N/A")
                if isinstance(value, (int, float)):
                    if "Yield" in ratio_name:
                        formatted_value = f"{value * 100:.2f}%"
                    else:
                        formatted_value = f"{value:.2f}"
                else:
                    formatted_value = str(value)
                row += f"{formatted_value:>15}"
            print(row)


def main():
    """Main function demonstrating financial ratios functionality."""

    print("FINANCIAL RATIOS ANALYSIS DEMONSTRATION")
    print("=" * 50)

    # Example 1: Analyze single company
    print("\n1. Single Company Analysis")
    print("-" * 30)
    aapl_analyzer = analyze_single_company("AAPL", save_csv=True)

    # Example 2: Compare multiple companies
    print("\n2. Multi-Company Comparison")
    print("-" * 30)
    companies_to_compare = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
    compare_companies(companies_to_compare)

    # Example 3: Show programmatic access
    print("\n3. Programmatic Access Example")
    print("-" * 30)
    ratios = aapl_analyzer.get_ratios_summary()
    print("Accessing ratios programmatically:")
    for ratio_name, value in ratios.items():
        print(f"  {ratio_name}: {value}")

    print("\n" + "=" * 50)
    print("DEMONSTRATION COMPLETED!")
    print("=" * 50)


if __name__ == "__main__":
    main()
