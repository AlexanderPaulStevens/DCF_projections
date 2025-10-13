"""
Minimal test script to run TesseractWorkflow and log the responses yielded by the workflow.
"""

import logging
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.utils.logger import get_logger
from app.schemas.dcf_inputs import DCFFinancialData, DCFMarketData
from app.core.dcf_calculations import DCFCalculator

logger = get_logger(__name__)

def main() -> None:
    """Run DCF analysis for a company."""

    financial_data = {
        "Revenue": 5000.0,
        "EBIT": 600.0,
        "Cash and Cash Equivalents": 500.0,
        "Shares Outstanding": 1000.0,
        "Total Debt": 1000.0,
    }

    market_data = {
        "beta": 1.2,
        "tax_rate": 0.24,
        "market_cap": 1000.0,
    }

    ticker = "FAKE"

    financial_data = DCFFinancialData(**financial_data)
    market_data = DCFMarketData(**market_data)

    dcf_calculator = DCFCalculator(ticker, financial_data, market_data)

    projections = dcf_calculator.project_financials(years=5, growth_rate=0.10)
    enterprise_value = dcf_calculator.calculate_enterprise_value(projections)
    equity_value = dcf_calculator.calculate_equity_value(enterprise_value)
    per_share_value = dcf_calculator.calculate_per_share_value(equity_value)

    print(f"\n{'='*60}")
    print(f"DCF Analysis for {ticker}")
    print(f"{'='*60}\n")
    
    print("Financial Projections (in millions):")
    print("-" * 60)
    for year, data in projections.items():
        print(f"\nYear {year}:")
        print(f"  Revenue: ${data['Revenue']:,.2f}M")
        print(f"  EBIT: ${data['EBIT']:,.2f}M")
        print(f"  EBIAT: ${data['EBIAT']:,.2f}M")
        print(f"  Free Cash Flow: ${data['FCF']:,.2f}M")
        print(f"  Growth Rate: {data['Growth_Rate']:.2%}")
    
    print(f"\n{'='*60}")
    print("Valuation Results:")
    print("-" * 60)
    print(f"Enterprise Value: ${enterprise_value:,.2f}M")
    print(f"Equity Value: ${equity_value:,.2f}M")
    print(f"Intrinsic Value per Share: ${per_share_value:.2f}")
    print(f"WACC: {dcf_calculator.wacc:.2%}")
    print(f"Terminal Growth Rate: {dcf_calculator.terminal_growth_rate:.2%}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()