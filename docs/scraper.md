# SEC Data Scraper

This module provides comprehensive scraping capabilities for SEC (Securities and Exchange Commission) financial data, enabling users to extract detailed financial information from company filings.

## Overview

The SEC Scraper is a robust tool for retrieving and parsing financial data from SEC filings, particularly 10-K annual reports. It automates the process of gathering historical financial metrics, making it easier to perform DCF analysis and financial modeling.

## Features

### 1. SEC Data Retrieval
- **Company Information**: Extract basic company details and metadata
- **Filing Discovery**: Find and retrieve recent SEC filings
- **Document Parsing**: Parse filing content for financial data
- **Data Extraction**: Extract key financial metrics and ratios

### 2. S&P 500 Coverage
- **Comprehensive List**: Pre-loaded S&P 500 companies with CIKs
- **Company Mapping**: Ticker symbol to CIK number mapping
- **Batch Processing**: Analyze multiple companies efficiently
- **Data Caching**: Store and reuse retrieved data

### 3. Financial Data Extraction
- **Revenue Metrics**: Extract revenue and sales data
- **Profitability Metrics**: Parse earnings and margin information
- **Balance Sheet Data**: Extract assets, liabilities, and equity
- **Cash Flow Metrics**: Parse operating and investing cash flows

### 4. Advanced Analysis
- **EBIT/EBITDA Calculation**: Compute key profitability metrics
- **Financial Ratios**: Calculate important financial ratios
- **Trend Analysis**: Identify financial performance trends
- **Data Validation**: Ensure data quality and consistency

## Core Components

### SP500Scraper Class

The main class that handles all SEC data scraping operations.

#### Key Methods

- `get_sp500_companies()`: Retrieve list of S&P 500 companies
- `get_company_info(cik)`: Get company information by CIK
- `get_recent_filings(cik, limit)`: Retrieve recent filing history
- `search_filings_by_form(cik, form_type, limit)`: Find specific filing types
- `get_filing_details(cik, accession_number, document)`: Retrieve filing content
- `extract_financial_data(content)`: Parse financial data from filing text
- `calculate_ebit_ebitda(financial_data)`: Compute EBIT and EBITDA
- `analyze_company(ticker)`: Complete company analysis workflow

#### Parameters

- `user_agent`: User agent string for SEC compliance
- `base_url`: SEC data API base URL
- `company_data_dir`: Directory for storing company data
- `sp500_companies`: Dictionary of S&P 500 ticker to CIK mappings

## Usage

### Command Line Interface

```bash
# Analyze a specific company
python src/main.py --ticker AAPL --overview

# List all available companies
python src/main.py --list

# Analyze all S&P 500 companies
python src/main.py --all
```

### Programmatic Usage

The scraper module provides comprehensive data retrieval capabilities for S&P 500 companies. It allows you to:

- Retrieve the complete list of S&P 500 companies
- Analyze specific companies for financial data
- Get detailed company overviews
- Access SEC filing information

## Data Sources

### SEC EDGAR Database

The scraper retrieves data from the SEC's EDGAR (Electronic Data Gathering, Analysis, and Retrieval) system:

- **Company Filings**: 10-K, 10-Q, 8-K, and other forms
- **Financial Data**: Annual and quarterly financial statements
- **Company Information**: Business descriptions and metadata
- **Filing History**: Complete filing timeline and documents

### Yahoo Finance Integration

For additional financial data and current market information:

- **Real-time Prices**: Current stock prices and market data
- **Financial Ratios**: P/E, P/B, and other key ratios
- **Market Metrics**: Market cap, volume, and trading data
- **Company Overview**: Sector, industry, and business description

## Data Extraction Process

### 1. Filing Discovery

The filing discovery process includes:

- Finding recent filings for companies
- Searching for specific filing types (10-K, 10-Q, etc.)
- Limiting results to manageable numbers
- Organizing filings by date and type

### 2. Content Retrieval

Content retrieval involves:

- Accessing filing documents by accession number
- Retrieving primary document content
- Handling different document formats
- Managing large document sizes

### 3. Data Parsing

Data parsing includes:

- Extracting financial metrics from documents
- Calculating derived financial ratios
- Handling different data formats
- Validating extracted data

### 4. Data Storage

Data storage capabilities include:

- Saving financial analysis results
- Organizing data by company ticker
- Creating structured data files
- Managing file naming conventions

## Financial Metrics Extracted

### Revenue and Sales

- **Total Revenue**: Gross sales and revenue
- **Product Revenue**: Revenue from product sales
- **Service Revenue**: Revenue from services
- **Geographic Revenue**: Revenue by region
- **Segment Revenue**: Revenue by business segment

### Profitability Metrics

- **Gross Profit**: Revenue minus cost of goods sold
- **Operating Income**: Income from core operations
- **Net Income**: Final profit after all expenses
- **EBIT**: Earnings before interest and taxes
- **EBITDA**: Earnings before interest, taxes, depreciation, and amortization

### Balance Sheet Data

- **Total Assets**: Company's total asset base
- **Total Liabilities**: Company's total obligations
- **Shareholders' Equity**: Net worth of the company
- **Cash and Equivalents**: Liquid assets
- **Long-term Debt**: Long-term borrowing obligations

### Cash Flow Metrics

- **Operating Cash Flow**: Cash from core operations
- **Investing Cash Flow**: Cash from investments
- **Financing Cash Flow**: Cash from financing activities
- **Free Cash Flow**: Cash available for distribution
- **Capital Expenditures**: Investment in fixed assets

## Data Quality and Validation

### Data Validation

- **Format Checking**: Ensure data is in expected format
- **Range Validation**: Check for reasonable value ranges
- **Consistency Checks**: Verify logical relationships between metrics
- **Missing Data Handling**: Gracefully handle incomplete information

### Error Handling

- **Network Errors**: Retry mechanisms for failed requests
- **Parsing Errors**: Fallback methods for malformed data
- **Rate Limiting**: Respect SEC API usage limits
- **Data Corruption**: Validate and clean extracted data

## Performance and Optimization

### Caching Strategy

- **Company Data**: Cache frequently accessed company information
- **Filing Content**: Store filing content locally
- **Financial Metrics**: Cache calculated financial ratios
- **Analysis Results**: Store completed analysis results

### Batch Processing

- **Multiple Companies**: Process multiple companies efficiently
- **Parallel Processing**: Concurrent data retrieval where possible
- **Resource Management**: Optimize memory and CPU usage
- **Progress Tracking**: Monitor batch processing progress

## Compliance and Ethics

### SEC Compliance

- **User Agent**: Proper identification in requests
- **Rate Limiting**: Respect API usage guidelines
- **Terms of Service**: Adhere to SEC data usage terms
- **Data Attribution**: Properly attribute data sources

### Ethical Considerations

- **Data Usage**: Use data for legitimate analysis purposes
- **Privacy Protection**: Respect company and investor privacy
- **Fair Use**: Follow fair use guidelines for financial data
- **Attribution**: Credit SEC and other data sources

## Integration

The SEC Scraper integrates with other system components:

- **DCF Calculator**: Provides historical financial data for projections
- **Financial Ratios**: Supplies data for ratio calculations
- **Sensitivity Analysis**: Offers data for scenario modeling
- **Company Analysis**: Enables comprehensive company overviews

## Output Formats

### Console Output

Analysis results are displayed in formatted console output:

```
Analyzing AAPL (CIK: 0000320193)...

1. Fetching company information for AAPL...
Company Name: Apple Inc.

2. Fetching recent filings for AAPL...
Found 10 recent filings:
  - 4 on 2025-08-12: xslF345X05/wk-form4_1755037816.xml
  - 144 on 2025-08-08: xsl144X01/primary_doc.xml
  - 10-Q on 2025-08-01: aapl-20250628.htm

3. Searching for 10-K filings for AAPL...
Found 5 10-K filings:
  - 2024-11-01: aapl-20240928.htm
  - 2023-11-03: aapl-20230930.htm

4. Analyzing financial data from most recent 10-K filing...
Retrieved 1,503,780 characters of content

5. Extracting financial metrics for AAPL...
Extracted 40 financial metrics

Key financial metrics found for AAPL:
  Total net sales: 391,035
  Gross margin: 180,683
  Operating income: 123,216
```

### File Output

Data is saved in multiple formats:

- **JSON Files**: Structured financial analysis data
- **Text Files**: Raw filing content for reference
- **CSV Files**: Tabular financial metrics
- **Log Files**: Processing and error logs

## Error Handling

The scraper includes comprehensive error handling for:

- **Network Issues**: Connection failures and timeouts
- **Data Parsing**: Malformed or unexpected data formats
- **Missing Information**: Incomplete or unavailable data
- **Rate Limiting**: API usage limit enforcement
- **File I/O**: Storage and retrieval errors

## Future Enhancements

Potential improvements include:

- **Real-time Updates**: Live data streaming capabilities
- **Advanced Parsing**: Machine learning-based data extraction
- **Multi-source Integration**: Combine data from multiple sources
- **Interactive Dashboards**: Web-based data visualization
- **API Development**: RESTful API for external access
- **Mobile Support**: Mobile-optimized data access
- **Advanced Analytics**: Statistical analysis and modeling tools
