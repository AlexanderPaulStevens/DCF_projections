# DCF Calculations

This module provides comprehensive Discounted Cash Flow (DCF) analysis for companies, allowing users to project financial performance and calculate intrinsic stock values.

## Overview

The DCF Calculator is the core component for valuing companies based on their projected future cash flows. It takes historical financial data and projects future earnings, applying appropriate discount rates to arrive at present values.

## Features

### 1. Financial Projections
- **Earnings Growth**: Project future earnings based on historical growth rates
- **Revenue Forecasting**: Extrapolate revenue trends with configurable growth scenarios
- **Expense Modeling**: Model operating expenses and capital expenditures
- **Cash Flow Projections**: Calculate projected free cash flows

### 2. Valuation Calculations
- **Enterprise Value**: Calculate total company value including debt
- **Equity Value**: Determine shareholder equity value
- **Per-Share Value**: Compute intrinsic stock price
- **Terminal Value**: Estimate value beyond projection period

### 3. Growth Scenarios
- **Base Case**: Primary growth rate scenario
- **Multiple Scenarios**: Compare different growth rate assumptions
- **Sensitivity Analysis**: Test impact of parameter changes
- **Custom Parameters**: Adjust growth rates, discount rates, and time horizons

## Core Components

### DCFCalculator Class

The main class that orchestrates all DCF calculations.

#### Key Methods

- `project_financials()`: Project future financial statements
- `calculate_enterprise_value()`: Compute enterprise value from projections
- `calculate_equity_value()`: Derive equity value from enterprise value
- `calculate_per_share_value()`: Determine per-share intrinsic value
- `print_dcf_summary()`: Display comprehensive results

#### Parameters

- `ticker`: Company stock symbol
- `financial_data`: Historical financial data dictionary
- `earnings_growth_rate`: Base earnings growth rate (default: 15%)
- `discount_rate`: Required rate of return (default: 10%)
- `projection_years`: Number of years to project (default: 3)

## Usage

### Command Line Interface

```bash
# Basic DCF analysis
python src/main.py --ticker AAPL --dcf

# Custom growth rate and years
python src/main.py --ticker AAPL --dcf --y 5 --eg 0.20

# Multiple growth scenarios
python src/main.py --ticker AAPL --dcf --y 3 --eg 0.15 --steps 3 --s 0.05
```

### Makefile Commands

```bash
# Run DCF analysis for AAPL
make run-dcf
```

### Programmatic Usage

```python
from app.features.DCF_calculations import DCFCalculator

# Create calculator
calculator = DCFCalculator("AAPL", financial_data)

# Project financials
projections = calculator.project_financials()

# Calculate enterprise value
enterprise_value = calculator.calculate_enterprise_value(projections)

# Calculate equity value
equity_value = calculator.calculate_equity_value(enterprise_value)

# Calculate per-share value
per_share_value = calculator.calculate_per_share_value(equity_value)
```

## Calculation Methodology

### 1. Financial Projections

The DCF model projects future financial performance using:

- **Historical Growth Rates**: Based on trailing financial data
- **Growth Decay**: Assumes growth rates gradually decline over time
- **Operating Margins**: Maintains historical profitability ratios
- **Capital Efficiency**: Models capital expenditure requirements

### 2. Discounting

Future cash flows are discounted using:

- **Cost of Equity**: Required return for equity investors
- **Risk-Free Rate**: Based on government bond yields
- **Equity Risk Premium**: Additional return for market risk
- **Company-Specific Risk**: Adjustments for business risk

### 3. Terminal Value

Beyond the projection period, a terminal value is calculated using:

- **Perpetual Growth**: Long-term sustainable growth rate (typically 2-3%)
- **Gordon Growth Model**: Terminal value = Final FCF × (1 + g) / (r - g)

## Output Format

### Console Display

The DCF results are displayed in a comprehensive summary:

```
================================================================================
DCF ANALYSIS SUMMARY: Base Case
================================================================================
Projection Period: 3 years
Earnings Growth Rate: 15.00%
Discount Rate: 10.00%

Financial Projections:
Year 1: Revenue: $450,690M, Earnings: $138,690M
Year 2: Revenue: $518,294M, Earnings: $159,494M
Year 3: Revenue: $596,038M, Earnings: $183,418M

Valuation Results:
Enterprise Value: $3,245,678M
Equity Value: $3,145,678M
Per-Share Value: $212.45
Current Market Price: $232.42
Valuation Status: Undervalued (-8.6%)
```

### Data Export

Results can be exported programmatically for further analysis:

```python
# Get projections
projections = calculator.project_financials()

# Get valuation summary
summary = calculator.get_valuation_summary()

# Access individual components
enterprise_value = summary['enterprise_value']
equity_value = summary['equity_value']
per_share_value = summary['per_share_value']
```

## Integration

The DCF Calculator integrates with other system components:

- **Financial Data**: Uses data from the SEC scraper
- **Sensitivity Analysis**: Provides inputs for scenario testing
- **Company Analysis**: Works with company overview and ratios
- **Reporting**: Generates outputs for further analysis

## Assumptions and Limitations

### Key Assumptions

- **Growth Continuity**: Historical trends continue into the future
- **Market Efficiency**: Current prices reflect available information
- **Stable Margins**: Operating margins remain relatively constant
- **Capital Structure**: Debt-to-equity ratios remain stable

### Limitations

- **Projection Uncertainty**: Future performance is inherently uncertain
- **Market Conditions**: External factors can significantly impact results
- **Data Quality**: Results depend on accuracy of input data
- **Model Simplification**: Complex business dynamics are simplified

## Future Enhancements

Potential improvements include:

- **Industry Benchmarks**: Compare against sector averages
- **Scenario Modeling**: More sophisticated growth scenarios
- **Risk Adjustments**: Dynamic risk premium calculations
- **Real-time Updates**: Live data integration
- **Visualization**: Charts and graphs for results
- **Export Formats**: Excel, PDF, and other output formats

## Error Handling

The module includes robust error handling for:

- **Missing Data**: Graceful handling of incomplete financial information
- **Calculation Errors**: Validation of mathematical operations
- **Invalid Parameters**: Parameter range and type checking
- **Data Inconsistencies**: Logical validation of financial relationships

## Performance Considerations

- **Efficient Calculations**: Optimized mathematical operations
- **Memory Management**: Minimal memory footprint for large datasets
- **Caching**: Reuse of calculated values where appropriate
- **Scalability**: Handles multiple companies and scenarios efficiently
