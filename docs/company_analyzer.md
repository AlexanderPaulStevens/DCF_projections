# Company Analyzer

This module provides comprehensive company analysis capabilities, including share price visualization, company overviews, and financial data presentation.

## Overview

The Company Analyzer is a multi-purpose tool that combines data from multiple sources to provide a complete picture of a company's financial health, market performance, and business characteristics. It integrates Yahoo Finance data with SEC filing information to deliver comprehensive insights.

## Features

### 1. Share Price Analysis
- **Historical Price Data**: Retrieve and analyze historical stock prices
- **Chart Generation**: Create professional share price charts
- **Volume Analysis**: Include trading volume in price analysis
- **Period Flexibility**: Support for multiple time periods (1y, 5y, 10y, max)

### 2. Company Overview
- **Business Information**: Company name, sector, industry, and description
- **Market Metrics**: Market cap, enterprise value, and current price
- **Performance Indicators**: 52-week high/low, beta, and volatility
- **Financial Ratios**: P/E, P/B, PEG, and other key ratios

### 3. Financial Performance
- **Profitability Metrics**: ROE, ROA, profit margins, and operating margins
- **Growth Indicators**: Revenue growth and earnings growth rates
- **Valuation Metrics**: Price ratios and dividend information
- **Risk Measures**: Beta coefficient and market risk indicators

### 4. Data Visualization
- **Price Charts**: Professional stock price charts with volume
- **Custom Styling**: Configurable chart appearance and formatting
- **Export Capabilities**: Save charts as high-resolution images
- **Interactive Elements**: Grid lines, legends, and annotations

## Core Components

### CompanyAnalyzer Class

The main class that orchestrates all company analysis operations.

#### Key Methods

- `get_share_price_data(period)`: Retrieve historical price data
- `plot_share_price(period, save_path)`: Generate and display price charts
- `get_company_overview()`: Retrieve comprehensive company information
- `print_company_overview_table()`: Display formatted overview table

#### Parameters

- `ticker`: Company stock symbol
- `yf_ticker`: Yahoo Finance ticker object
- `financial_data`: Optional SEC filing data for enhanced analysis

## Usage

### Command Line Interface

```bash
# Show company overview
python src/main.py --ticker AAPL --overview

# Display share price chart
python src/main.py --ticker AAPL --chart

# Save chart to file
python src/main.py --ticker AAPL --chart --save-chart charts/AAPL_price.png

# Custom chart period
python src/main.py --ticker AAPL --chart --period 2y
```

### Makefile Commands

```bash
# Run company overview for AAPL
make run-demo
```

### Programmatic Usage

```python
from app.features.company_analyzer import CompanyAnalyzer

# Create analyzer
analyzer = CompanyAnalyzer("AAPL")

# Get share price data
price_data = analyzer.get_share_price_data(period="5y")

# Generate price chart
analyzer.plot_share_price(period="5y", save_path="charts/AAPL_5y.png")

# Get company overview
overview = analyzer.get_company_overview()

# Display overview table
analyzer.print_company_overview_table()
```

## Data Sources

### Yahoo Finance

Primary source for real-time and historical market data:

- **Stock Prices**: Real-time and historical price data
- **Volume Data**: Trading volume and liquidity metrics
- **Market Metrics**: Market cap, enterprise value, and beta
- **Financial Ratios**: P/E, P/B, PEG, and other ratios

### SEC Filings (Optional)

Enhanced analysis when SEC data is available:

- **Financial Statements**: Revenue, earnings, and balance sheet data
- **Business Description**: Company operations and strategy
- **Risk Factors**: Business and financial risk information
- **Management Discussion**: Executive insights and analysis

## Chart Generation

### Price Chart Features

- **Line Charts**: Smooth price trend visualization
- **Volume Bars**: Secondary chart showing trading volume
- **Grid Lines**: Reference lines for price levels
- **Custom Styling**: Professional appearance and formatting

### Chart Configuration

```python
# Basic chart generation
analyzer.plot_share_price(period="5y")

# Save chart to file
analyzer.plot_share_price(
    period="5y",
    save_path="charts/AAPL_5y.png"
)

# Custom time periods
periods = ["1y", "2y", "5y", "10y", "max"]
for period in periods:
    analyzer.plot_share_price(period=period)
```

### Chart Customization

- **Figure Size**: Configurable chart dimensions
- **Color Schemes**: Customizable line and bar colors
- **Font Sizing**: Adjustable text and label sizes
- **Grid Styling**: Customizable grid appearance
- **Legend Positioning**: Flexible legend placement

## Company Overview Data

### Business Information

- **Company Name**: Official company name and branding
- **Sector**: Primary business sector classification
- **Industry**: Specific industry within the sector
- **Country**: Company's country of incorporation
- **Website**: Official company website URL

### Market Metrics

- **Market Cap**: Total market value of equity
- **Enterprise Value**: Total company value including debt
- **Current Price**: Latest stock price
- **52-Week Range**: High and low prices over the past year
- **Beta**: Stock volatility relative to market

### Financial Performance

- **P/E Ratio**: Price-to-earnings ratio
- **Forward P/E**: Projected P/E ratio
- **PEG Ratio**: P/E ratio adjusted for growth
- **Price to Book**: Price-to-book value ratio
- **Price to Sales**: Price-to-sales ratio

### Profitability Metrics

- **ROE**: Return on equity
- **ROA**: Return on assets
- **Profit Margin**: Net profit margin
- **Operating Margin**: Operating profit margin
- **Gross Margin**: Gross profit margin

### Growth Indicators

- **Revenue Growth**: Year-over-year revenue growth
- **Earnings Growth**: Year-over-year earnings growth
- **Dividend Yield**: Annual dividend yield
- **Payout Ratio**: Dividend payout ratio

## Data Formatting

### Number Formatting

The analyzer automatically formats different types of data:

- **Large Numbers**: Convert to billions/millions (e.g., $1.5B, $750M)
- **Percentages**: Convert decimals to percentages (e.g., 0.15 → 15.00%)
- **Currency**: Add dollar signs to monetary values
- **Ratios**: Format to appropriate decimal places

### Table Presentation

Overview data is presented in a professional table format:

```
================================================================================
COMPANY OVERVIEW: AAPL
================================================================================
+------------------------+------------------------+
| Metric                 | Value                 |
+========================+========================+
| Company Name           | Apple Inc.            |
| Sector                 | Technology            |
| Industry               | Consumer Electronics  |
| Market Cap             | $3.65T               |
| Current Price          | $232.42              |
| P/E Ratio              | 35.27                |
| ROE                    | 147.25%              |
| Revenue Growth         | 8.10%                |
+------------------------+------------------------+
================================================================================
```

## Integration

The Company Analyzer integrates with other system components:

- **Financial Ratios**: Provides context for ratio analysis
- **DCF Calculator**: Supplies company overview for valuation
- **SEC Scraper**: Enhances analysis with filing data
- **Sensitivity Analysis**: Offers company context for scenarios

## Error Handling

The analyzer includes robust error handling for:

- **Data Retrieval**: Network and API failures
- **Missing Information**: Incomplete company data
- **Chart Generation**: File system and plotting errors
- **Data Formatting**: Invalid or unexpected data types

## Performance Considerations

### Data Caching

- **Price Data**: Cache historical price information
- **Company Info**: Store company overview data
- **Chart Images**: Save generated charts for reuse
- **API Limits**: Respect data provider rate limits

### Optimization Strategies

- **Lazy Loading**: Load data only when needed
- **Batch Processing**: Process multiple companies efficiently
- **Memory Management**: Optimize data structure usage
- **Async Operations**: Non-blocking data retrieval

## Future Enhancements

Potential improvements include:

- **Real-time Updates**: Live data streaming capabilities
- **Advanced Charts**: Technical indicators and analysis tools
- **Comparative Analysis**: Side-by-side company comparisons
- **Export Formats**: PDF reports and Excel spreadsheets
- **Mobile Optimization**: Responsive chart design
- **Interactive Charts**: Zoom, pan, and hover capabilities
- **Custom Indicators**: User-defined technical analysis tools

## Use Cases

### Investment Analysis

- **Stock Research**: Comprehensive company overview
- **Technical Analysis**: Price chart and volume analysis
- **Valuation Support**: Context for DCF and ratio analysis
- **Risk Assessment**: Beta and volatility analysis

### Business Intelligence

- **Competitive Analysis**: Industry and sector positioning
- **Market Research**: Market cap and enterprise value
- **Performance Tracking**: Growth and profitability metrics
- **Strategic Planning**: Business model insights

### Academic Research

- **Financial Studies**: Data for research projects
- **Case Studies**: Company analysis examples
- **Market Analysis**: Sector and industry trends
- **Risk Modeling**: Volatility and correlation studies
