# DCF Projections

A comprehensive financial analysis tool for S&P 500 companies using Discounted Cash Flow (DCF) calculations and sensitivity analysis.

## Features

- **S&P 500 Data Scraping**: Automated collection of financial data from SEC EDGAR
- **DCF Analysis**: Multi-scenario discounted cash flow calculations
- **Sensitivity Analysis**: Comprehensive sensitivity analysis with customizable parameters
- **Company Overview**: Detailed financial metrics and company information
- **Share Price Visualization**: Interactive charts with multiple time periods
- **Data Export**: JSON export of all analysis results

## Quick Start

1. **Install dependencies**:
   ```bash
   uv sync
   ```

2. **Set up pre-commit hooks**:
   ```bash
   pre-commit install
   ```

3. **Run analysis**:
   ```bash
   # Basic company analysis
   python main.py --ticker AAPL

   # DCF analysis
   python main.py --ticker AAPL --dcf --y 3 --eg 0.15 --steps 2 --s 0.10

   # Sensitivity analysis
   python main.py --ticker AAPL --sensitivity --plot-sensitivity
   ```

## Usage Examples

```bash
# Company overview
python main.py --ticker AAPL --overview

# Share price chart
python main.py --ticker AAPL --chart --period 5y --save-chart charts/AAPL_price.png

# List available companies
python main.py --list

# Analyze all companies
python main.py --all
```

## Development

```bash
# Run code quality checks
pre-commit run --all-files

# Format code
ruff format .

# Lint code
ruff check .
```

## Configuration

Edit `config.py` to customize:
- DCF parameters (growth rates, discount rates)
- SEC API settings
- File naming patterns
- Logging configuration

## Disclaimer

This tool is for educational and research purposes only. Financial decisions should not be based solely on automated analysis.
