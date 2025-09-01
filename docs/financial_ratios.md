# Financial Ratios Analysis

This module provides comprehensive financial ratio analysis for companies, calculating key metrics that investors use to evaluate stock valuations and company performance.

## Features

The Financial Ratios Analyzer calculates the following key ratios:

### 1. Price-Earnings Ratio (P/E)
- **Formula**: Stock Price / Earnings Per Share
- **Purpose**: Measures how much investors are willing to pay for each dollar of earnings
- **Interpretation**: Lower ratios may indicate undervaluation, higher ratios may indicate overvaluation

### 2. Earnings Yield
- **Formula**: Earnings Per Share / Stock Price
- **Purpose**: Shows the percentage return on investment from earnings
- **Interpretation**: Higher yields indicate better value relative to earnings

### 3. Price to Book Ratio (P/B)
- **Formula**: Stock Price / Book Value per Share
- **Purpose**: Compares market value to book value
- **Interpretation**: Values below 1 may indicate undervaluation

### 4. PEG Ratio
- **Formula**: P/E Ratio / Yearly Earnings Growth Rate
- **Purpose**: Adjusts P/E ratio for growth expectations
- **Interpretation**: Values below 1 may indicate undervaluation considering growth

### 5. Free Cash Flow Yield
- **Formula**: Free Cash Flow per Share / Stock Price
- **Purpose**: Shows return on investment from free cash flow
- **Interpretation**: Higher yields indicate better cash generation relative to price

## Usage

### Command Line Interface

```bash
# Display financial ratios for a company
python src/main.py --ticker AAPL --ratios

# Save ratios to CSV with default filename
python src/main.py --ticker AAPL --ratios --save-ratios default

# Save ratios to CSV with custom filename
python src/main.py --ticker AAPL --ratios --save-ratios my_ratios.csv
```

### Makefile Commands

```bash
# Run financial ratios analysis for AAPL
make run-ratios
```

### Programmatic Usage

The financial ratios module provides comprehensive analysis of key financial metrics for companies. It allows you to:

- Calculate standard financial ratios (P/E, P/B, PEG, etc.)
- Generate formatted tables for easy reading
- Export results to CSV for further analysis
- Compare ratios across different companies

## Data Sources

The ratios are calculated using data from Yahoo Finance (`yfinance` library), including:

- Current stock price
- Trailing twelve months earnings per share
- Book value per share
- Earnings growth rate
- Free cash flow
- Shares outstanding

## Output Format

### Console Display
The ratios are displayed in a formatted table with:
- Ratio names and calculated values
- Proper formatting (percentages for yields, decimals for ratios)
- Raw data values for reference

### CSV Export
Ratios can be exported to CSV files with:
- Ratio names in the first column
- Calculated values in the second column
- Automatic timestamp-based filenames
- Storage in company-specific directories

## Example Output

```
================================================================================
FINANCIAL RATIOS: AAPL
================================================================================
+------------------------+----------+
| Ratio                  | Value    |
+========================+==========+
| Price-Earnings Ratio   | 28.45    |
| Earnings Yield         | 3.52%    |
| Price to Book Ratio    | 15.67    |
| PEG Ratio              | 1.89     |
| Free Cash Flow Yield   | 2.34%    |
+------------------------+----------+
================================================================================

Raw Data for AAPL:
----------------------------------------
Current Price: $150.25
EPS (TTM): $5.28
Book Value per Share: $9.59
Earnings Growth (Yearly): 15.05%
Free Cash Flow per Share: $3.52
Shares Outstanding: 15,750,000,000
```

## Error Handling

The module includes robust error handling for:
- Missing or invalid financial data
- Network connectivity issues
- Data format inconsistencies
- Division by zero scenarios

When data is unavailable, ratios are marked as "N/A" and the analysis continues with available data.

## Integration

The Financial Ratios Analyzer integrates seamlessly with the existing DCF Projections system:

- Works alongside company overview, DCF analysis, and sensitivity analysis
- Uses the same company data structure
- Follows the same coding patterns and error handling
- Integrates with the command-line interface

## Future Enhancements

Potential improvements include:
- Historical ratio tracking over time
- Industry benchmarking and comparisons
- Custom ratio definitions
- Export to additional formats (Excel, JSON)
- Real-time ratio updates
- Ratio trend analysis and visualization
