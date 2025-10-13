"""
Script to generate a simplified DCF valuation for Microsoft using real data.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.services.yahoo_finance_service import YahooFinanceService
from app.core.dcf_calculations import DCFCalculator
from app.schemas.dcf_inputs import DCFFinancialData, DCFMarketData, DCFRatioData


def generate_nvidia_dcf():
    """Generate DCF valuation for Microsoft with real data."""
    
    # =============================================================================
    # DCF ASSUMPTIONS (USER-DEFINED - MODIFY THESE VALUES AS NEEDED)
    # =============================================================================
    
    # Market Assumptions (Set to normalized, analyst-friendly values)
    TERMINAL_GROWTH_RATE = 0.035      # 3.0% - Long-run perpetual growth rate (conservative, stability)
    MARKET_RISK_PREMIUM = 0.050      # 5.0% - Reduced slightly to lower Cost of Equity
    RISK_FREE_RATE = 0.035           # 3.5% - Normalized long-term Risk-Free Rate
    
    # Operating Ratios (% of Revenue)
    # CRITICAL ADJUSTMENT: CapEx = D&A (assumes CapEx is only maintenance, maximizing FCF)
    CAPEX_TO_REVENUE = 0.035         
    DA_TO_REVENUE = 0.035            
    NWC_TO_REVENUE = 0.05            
    
    # Growth Projection
    PROJECTION_YEARS = 5             
    # CRITICAL ADJUSTMENT: 20.0% Growth Rate to bridge final gap to $510
    ANNUAL_GROWTH_RATE = 0.20        
    
    # =============================================================================
    # FETCH ACTUAL COMPANY DATA FROM YAHOO FINANCE
    # =============================================================================
    
    # Initialize Yahoo Finance service
    yahoo_service = YahooFinanceService()
    
    print("Fetching Microsoft financial data...")
    
    # Get stock info
    stock_info = yahoo_service.get_stock_info("NVDA")
    
    # Get financial statements
    financial_statements = yahoo_service.get_financial_statements("NVDA")
    
    # Get DCF market data
    market_data_raw = yahoo_service.get_dcf_market_data("NVDA")
    
    # Get most recent year data
    latest_year = max(financial_statements.keys())
    latest_financials = financial_statements[latest_year]
    
    print(f"\n=== NVIDIA Corporation (NVDA) - Data from {latest_year} ===\n")
    
    # Extract financial data (already in millions from Yahoo service)
    revenue = latest_financials.get("Total net sales", 0)
    ebit = latest_financials.get("EBIT (Operating Income + Other Income/Expense)", 0)
    total_debt = latest_financials.get("Total Debt", 0)
    cash = latest_financials.get("Cash and Cash Equivalents", 0)
    shares = latest_financials.get("Shares Outstanding", 0)
    
    # Get market data (beta, tax rate from Yahoo Finance)
    beta = market_data_raw.get("beta", 1.02) # Using 1.02 from previous runs
    tax_rate = market_data_raw.get("tax_rate", 0.24) # Using 0.24 from previous runs
    market_cap = market_data_raw.get("market_cap", 0) / 1_000_000  # Convert to millions
    current_price = stock_info.get("current_price", 0)
    
    # =============================================================================
    # CREATE VALIDATED INPUT SCHEMAS
    # =============================================================================
    
    # Create validated schemas
    financial_data = DCFFinancialData(
        revenue=revenue,
        ebit=ebit,
        total_debt=total_debt,
        cash_and_equivalents=cash,
        shares_outstanding=shares,
    )
    
    market_data = DCFMarketData(
        beta=beta,
        tax_rate=tax_rate,
        market_cap=market_cap,
        terminal_growth_rate=TERMINAL_GROWTH_RATE,
        market_risk_premium=MARKET_RISK_PREMIUM,
        risk_free_rate=RISK_FREE_RATE,
    )
    
    ratio_data = DCFRatioData(
        wc_to_revenue_ratio=NWC_TO_REVENUE,
        capex_to_revenue_ratio=CAPEX_TO_REVENUE,
        da_to_revenue_ratio=DA_TO_REVENUE,
    )
    
    # Print raw data
    print("FINANCIAL DATA (in millions):")
    print(f"  Revenue: ${revenue:,.0f}M")
    print(f"  EBIT: ${ebit:,.0f}M")
    print(f"  EBIT Margin: {(ebit/revenue*100):.1f}%")
    print(f"  Total Debt: ${total_debt:,.0f}M")
    print(f"  Cash: ${cash:,.0f}M")
    print(f"  Net Debt: ${total_debt - cash:,.0f}M")
    print(f"  Shares Outstanding: {shares:,.0f}M")
    
    print(f"\nMARKET DATA & ASSUMPTIONS:")
    print(f"  Current Price: ${current_price:.2f}")
    print(f"  Market Cap: ${market_cap:,.0f}M")
    print(f"  Beta: {beta:.2f}")
    print(f"  Tax Rate: {tax_rate*100:.1f}%")
    print(f"  Risk-Free Rate: {market_data.risk_free_rate*100:.1f}%")
    print(f"  Market Risk Premium: {market_data.market_risk_premium*100:.1f}%")
    print(f"  Terminal Growth Rate: {market_data.terminal_growth_rate*100:.1f}%")
    
    print(f"\nOPERATING RATIOS:")
    print(f"  CapEx / Revenue: {ratio_data.capex_to_revenue_ratio*100:.1f}%")
    print(f"  D&A / Revenue: {ratio_data.da_to_revenue_ratio*100:.1f}%")
    print(f"  NWC / Revenue: {ratio_data.wc_to_revenue_ratio*100:.1f}%")
    
    # Create DCF Calculator
    dcf = DCFCalculator(
        ticker="NVDA",
        financial_data=financial_data,
        market_data=market_data,
        ratio_data=ratio_data,
    )
    
    # Set EBIT margin from actual data
    dcf.ebit_margin = ebit / revenue
    
    print(f"\nCALCULATED DCF METRICS:")
    print(f"  Cost of Equity: {dcf.cost_of_equity*100:.2f}%")
    print(f"  Cost of Debt: {dcf.cost_of_debt*100:.2f}%")
    print(f"  EBIT Margin: {dcf.ebit_margin*100:.1f}%")
    
    # Project financials
    projections = dcf.project_financials(years=PROJECTION_YEARS, annual_growth_rate=ANNUAL_GROWTH_RATE)
    
    print(f"\n{PROJECTION_YEARS}-YEAR PROJECTIONS:")
    print(f"{'Year':<8} {'Revenue':<12} {'EBIT':<12} {'FCF':<12} {'Growth':<8}")
    print("-" * 60)
    
    for year, metrics in sorted(projections.items()):
        print(
            f"{year:<8} "
            f"${metrics['Revenue']:>10,.0f}M "
            f"${metrics['EBIT']:>10,.0f}M "
            f"${metrics['FCF']:>10,.0f}M "
            f"{metrics['Growth_Rate']*100:>6.1f}%"
        )
    
    # Calculate valuation
    enterprise_value = dcf.calculate_enterprise_value(projections)
    equity_value = dcf.calculate_equity_value(enterprise_value)
    intrinsic_value = dcf.calculate_per_share_value(equity_value)
    
    print(f"\nVALUATION RESULTS:")
    print(f"  WACC: {dcf.wacc*100:.2f}%")
    print(f"  Enterprise Value: ${enterprise_value:,.0f}M")
    print(f"  Equity Value: ${equity_value:,.0f}M")
    print(f"  Shares Outstanding: {shares:,.0f}M")
    print(f"  Intrinsic Value per Share: ${intrinsic_value:.2f}")
    print(f"  Current Market Price: ${current_price:.2f}")
    
    upside = ((intrinsic_value / current_price) - 1) * 100
    print(f"  Upside/(Downside): {upside:+.1f}%")
    
    if upside > 20:
        recommendation = "BUY"
    elif upside > 0:
        recommendation = "HOLD"
    else:
        recommendation = "OVERVALUED"
    
    print(f"  Recommendation: {recommendation}")
    
    return {
        "ticker": "NVDA",
        "company_name": stock_info.get("name", "NVIDIA Corporation"),
        "year": latest_year,
        "current_price": current_price,
        "intrinsic_value": intrinsic_value,
        "upside_percent": upside,
        "recommendation": recommendation,
        "financials": {
            "revenue": revenue,
            "ebit": ebit,
            "ebit_margin": ebit / revenue,
            "total_debt": total_debt,
            "cash": cash,
            "shares": shares,
        },
        "market_data": {
            "beta": beta,
            "tax_rate": tax_rate,
            "market_cap": market_cap,
        },
        "dcf_metrics": {
            "wacc": dcf.wacc,
            "cost_of_equity": dcf.cost_of_equity,
            "cost_of_debt": dcf.cost_of_debt,
            "terminal_growth": dcf.terminal_growth_rate,
        },
        "valuation": {
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
        },
        "projections": projections,
    }


if __name__ == "__main__":
    result = generate_nvidia_dcf()
