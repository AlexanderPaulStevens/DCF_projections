"""
Minimal test script to run FinancialRatiosCalculator and log the responses.
"""

import logging
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.utils.logger import get_logger
from app.core.financial_ratios import FinancialRatiosCalculator

logger = get_logger(__name__)

def main() -> None:
    """Run financial ratios analysis for a company."""

    # Sample financial data for a healthy company
    raw_data = {
        "current_price": 150.0,
        "eps": 8.50,
        "book_value": 45.0,
        "earnings_growth": 0.12,  # 12% growth
        "free_cashflow": 5_000_000_000.0,  # $5B
        "shares_outstanding": 1_000_000_000.0,  # 1B shares
        "market_cap": 150_000_000_000.0,  # $150B
        "total_debt": 20_000_000_000.0,  # $20B
        "total_cash": 10_000_000_000.0,  # $10B
        "revenue": 80_000_000_000.0,  # $80B
        "net_income": 8_500_000_000.0,  # $8.5B
    }

    ticker = "SAMPLE"

    # Initialize calculator
    calculator = FinancialRatiosCalculator()

    # Calculate ratios
    print(f"\n{'='*60}")
    print(f"Financial Ratios Analysis for {ticker}")
    print(f"{'='*60}\n")

    ratios = calculator.calculate_ratios(raw_data)
    
    print("Raw Ratios:")
    print("-" * 60)
    for category, category_ratios in ratios.items():
        print(f"\n{category.upper()}:")
        for metric, value in category_ratios.items():
            print(f"  {metric}: {value:.4f}")

    # Format with evaluation
    print(f"\n{'='*60}")
    print("Ratios with Evaluation:")
    print("-" * 60)
    
    formatted_ratios = calculator.format_ratios_with_evaluation(ratios)
    
    for category, category_ratios in formatted_ratios.items():
        print(f"\n{category.upper()}:")
        for metric, data in category_ratios.items():
            value = data["value"]
            evaluation = data["evaluation"]
            emoji = "✅" if evaluation == "good" else "❌" if evaluation == "bad" else "❓"
            print(f"  {emoji} {metric}: {value:.4f} ({evaluation})")

    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    main()

