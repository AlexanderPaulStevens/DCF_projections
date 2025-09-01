# Portfolio Analysis Feature

## Overview

The Portfolio Analysis feature allows you to create and analyze portfolios of multiple companies, projecting their growth over time using DCF (Discounted Cash Flow) methodology.

## Features

- **Portfolio Creation**: Build portfolios with up to 10 companies
- **Flexible Weighting**: Equal weight, custom weights, or market cap weighting
- **Growth Projections**: Project portfolio value over 5-20 years
- **Risk Analysis**: Calculate volatility, returns, and Sharpe ratio
- **Company-Specific Growth Rates**: Set different growth expectations for each company
- **Visualization**: Interactive charts showing portfolio and individual company growth

## How to Use

### 1. Access Portfolio Analysis

1. Open the DCF Projections application
2. In the sidebar, select "Portfolio Analysis" from the "Analysis Type" dropdown
3. Click "Run Analysis" to start

### 2. Create Your Portfolio

#### Portfolio Configuration
- **Number of Companies**: Choose 1-10 companies
- **Total Investment**: Set your total investment amount
- **Investment Strategy**:
  - Equal Weight: Automatically divides investment equally
  - Custom Weights: Manually set percentage for each company
  - Market Cap Weight: Weight by company market capitalization

#### Company Selection
- Enter ticker symbols for each company (e.g., AAPL, NVDA, GOOGL)
- For custom weights, ensure total equals 100%

### 3. Configure Analysis Parameters

- **Projection Years**: How many years to project (5-20)
- **WACC**: Weighted Average Cost of Capital (5-20%)
- **Terminal Growth**: Long-term growth rate (1-5%)
- **Company Growth Rates**: Individual growth expectations for each company

### 4. Run Analysis

Click "Analyze Portfolio" to generate projections and analysis.

## Example Portfolio

**Tech Growth Portfolio:**
- **AAPL** (Apple): 33.3% - Consumer electronics and services
- **NVDA** (NVIDIA): 33.3% - AI and semiconductor technology
- **GOOGL** (Alphabet): 33.3% - Digital advertising and cloud services

**Total Investment:** $3,000 ($1,000 per company)

## Understanding Results

### Portfolio Summary
- **Initial Investment**: Your starting amount
- **Final Value**: Projected portfolio value after projection period
- **Total Return**: Percentage gain/loss
- **Volatility**: Risk measure based on growth rate variations
- **Sharpe Ratio**: Risk-adjusted return metric

### Portfolio Composition
- **Initial Weights**: How you originally allocated your investment
- **Current Weights**: How the portfolio composition changes over time
- **Individual Performance**: Each company's contribution to total value

### Growth Projections
- **Portfolio Value Over Time**: Total portfolio value year by year
- **Individual Company Growth**: How each company grows individually
- **Performance Metrics**: Detailed breakdown of each company's performance

## Key Insights

1. **Diversification Benefits**: Different growth rates create natural rebalancing
2. **Growth Rate Impact**: Higher growth companies become larger portfolio components
3. **Terminal Value**: Long-term value beyond the projection period
4. **Risk Management**: Volatility helps understand portfolio risk profile

## Tips for Better Analysis

1. **Realistic Growth Rates**: Use 5-20% for most companies, 20-50% for high-growth tech
2. **Sector Diversification**: Mix different sectors to reduce concentration risk
3. **Growth vs. Value**: Balance high-growth and stable companies
4. **Regular Review**: Reassess growth assumptions and portfolio composition

## Technical Details

- Uses Monte Carlo simulation for growth projections
- Incorporates volatility in growth rates for realistic modeling
- Calculates terminal value using Gordon Growth Model
- Provides downloadable results in JSON format

## Example Output

```
📈 Portfolio Performance:
   Initial Investment: $3,000
   Final Value: $227,600
   Total Return: 7486.7%
   Volatility: 7.3%
   Sharpe Ratio: 1032.39

🏗️ Portfolio Composition Changes:
   AAPL: 33.3% → 21.9%
   NVDA: 33.3% → 57.5%
   GOOGL: 33.4% → 20.7%
```

This shows how NVIDIA's higher growth rate (25% vs 15% for Apple, 12% for Google) caused it to become the dominant position in the portfolio over time.

## Getting Started

1. Run the application: Use the React frontend or API endpoints
2. Select "Portfolio Analysis" mode
3. Create your first portfolio with 2-3 companies
4. Experiment with different growth rates and time horizons
5. Download and save your analysis results

The portfolio analysis feature provides powerful insights into how your investments might grow over time, helping you make informed decisions about asset allocation and risk management.
