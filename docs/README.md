# DCF Projections Documentation

Welcome to the comprehensive documentation for the DCF Projections system. This system provides advanced financial analysis capabilities for S&P 500 companies, including DCF calculations, sensitivity analysis, financial ratios, and SEC data scraping.

## System Overview

The DCF Projections system is a comprehensive financial analysis platform that combines multiple data sources and analytical tools to provide deep insights into company valuations and financial performance.

### Key Features

- **DCF Calculations**: Project future cash flows and calculate intrinsic values
- **Sensitivity Analysis**: Test valuation robustness across parameter variations
- **Financial Ratios**: Calculate and analyze key financial metrics
- **SEC Data Scraping**: Extract financial data from SEC filings
- **Company Analysis**: Comprehensive company overviews and visualizations

## Documentation Structure

### Core Features

#### [DCF Calculations](dcf_calculations.md)
Comprehensive Discounted Cash Flow analysis for company valuation
- Financial projections and forecasting
- Enterprise value and equity value calculations
- Growth scenario modeling
- Terminal value calculations

#### [Sensitivity Analysis](sensitivity_analysis.md)
Robust testing of DCF model parameters and assumptions
- Parameter sensitivity testing
- Range analysis and threshold identification
- Visualization and chart generation
- Export capabilities for further analysis

#### [Financial Ratios](financial_ratios.md)
Key financial metrics and ratio analysis
- Price-earnings (P/E) ratio
- Earnings yield and price-to-book ratio
- PEG ratio and free cash flow yield
- CSV export and data comparison

#### [SEC Data Scraper](scraper.md)
Automated extraction of financial data from SEC filings
- S&P 500 company coverage
- 10-K and 10-Q filing analysis
- Financial metric extraction
- EBIT/EBITDA calculations

#### [Company Analyzer](company_analyzer.md)
Comprehensive company analysis and visualization
- Share price charts and analysis
- Company overview and metrics
- Financial performance indicators
- Data visualization and export

### System Architecture

#### Data Flow
```
SEC Filings → Data Scraper → Financial Data → DCF Calculator → Valuation Results
     ↓              ↓              ↓              ↓              ↓
Company Info → Company Analyzer → Financial Ratios → Sensitivity Analysis → Final Analysis
```

#### Integration Points
- **Data Sources**: SEC EDGAR, Yahoo Finance
- **Analysis Tools**: DCF models, ratio calculations, sensitivity testing
- **Output Formats**: Console display, CSV export, chart generation
- **User Interface**: Command-line interface, Makefile integration

## Quick Start Guide

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd DCF_projections

# Install dependencies
make install

# Set up pre-commit hooks
make setup
```

### Basic Usage

```bash
# Company overview
make run-demo

# Financial ratios
make run-ratios

# DCF analysis
make run-dcf

# Sensitivity analysis
make run-sensitivity
```

### Advanced Usage

```bash
# Custom DCF parameters
python src/main.py --ticker AAPL --dcf --y 5 --eg 0.20 --steps 3

# Save financial ratios to CSV
python src/main.py --ticker AAPL --ratios --save-ratios default

# Custom sensitivity analysis
python src/main.py --ticker AAPL --sensitivity --sensitivity-steps 21
```

## Command Line Interface

### Main Commands

- `--ticker`: Specify company ticker symbol
- `--overview`: Show company overview
- `--ratios`: Display financial ratios
- `--dcf`: Run DCF analysis
- `--sensitivity`: Perform sensitivity analysis
- `--chart`: Generate share price charts

### DCF Analysis Options

- `--y`: Years of historical data (default: 3)
- `--eg`: Base earnings growth rate (default: 15%)
- `--steps`: Additional growth scenarios (default: 2)
- `--s`: Growth rate step size (default: 10%)

### Sensitivity Analysis Options

- `--sensitivity-steps`: Number of analysis steps (default: 11)
- `--sensitivity-range`: Parameter variation range (default: ±50%)

### Output Options

- `--save-ratios`: Save ratios to CSV file
- `--save-chart`: Save chart to image file
- `--period`: Chart time period (1y, 5y, 10y, max)

## Examples and Use Cases

### Investment Analysis
- **Stock Research**: Comprehensive company analysis
- **Valuation**: DCF-based intrinsic value calculation
- **Risk Assessment**: Sensitivity analysis and scenario testing
- **Comparison**: Financial ratios across companies

### Financial Modeling
- **Projections**: Future cash flow forecasting
- **Scenarios**: Multiple growth rate assumptions
- **Sensitivity**: Parameter impact analysis
- **Documentation**: Export results for reports

### Academic Research
- **Data Collection**: Automated SEC data extraction
- **Analysis**: Financial ratio calculations
- **Modeling**: DCF valuation models
- **Visualization**: Charts and data presentation

## Configuration

### Environment Setup
- **Python**: 3.11 or higher
- **Dependencies**: See pyproject.toml for complete list
- **Data Storage**: company_data/ directory for local storage
- **Charts**: charts/ directory for generated images

### Makefile Targets
- `install`: Install project dependencies
- `setup`: Set up pre-commit hooks
- `test`: Run all pre-commit checks
- `format`: Format code with ruff
- `lint`: Run linting checks
- `clean`: Clean up generated files

### Pre-commit Hooks
- **Code Formatting**: Automatic code style enforcement
- **Linting**: Code quality and style checks
- **Testing**: Automated test execution
- **Documentation**: Documentation validation

## Troubleshooting

### Common Issues

#### NumPy Compatibility
If you encounter NumPy version conflicts:
```bash
# Reinstall dependencies with correct versions
uv sync --reinstall
```

#### Import Errors
For module import issues:
```bash
# Use uv run for proper environment
uv run python src/main.py --ticker AAPL --ratios
```

#### Data Retrieval Issues
For SEC data access problems:
- Check internet connection
- Verify SEC API availability
- Review rate limiting compliance

### Performance Optimization

#### Large Datasets
- Use appropriate time periods for analysis
- Enable data caching where possible
- Process companies in batches

#### Memory Management
- Monitor memory usage during analysis
- Use efficient data structures
- Clean up temporary files

## Contributing

### Development Setup
```bash
# Install development dependencies
uv sync

# Set up pre-commit hooks
pre-commit install

# Run tests
make test
```

### Code Standards
- **Formatting**: Use ruff for code formatting
- **Linting**: Follow flake8 guidelines
- **Testing**: Maintain test coverage
- **Documentation**: Update docs for new features

### Testing
```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/

# Check coverage
pytest --cov=src tests/
```

## Support and Resources

### Documentation
- **Feature Docs**: Detailed documentation for each module
- **API Reference**: Code-level documentation
- **Examples**: Usage examples and tutorials
- **Troubleshooting**: Common issues and solutions

### Community
- **Issues**: Report bugs and request features
- **Discussions**: Community discussions and questions
- **Contributions**: Guidelines for contributing code
- **Feedback**: Suggestions for improvements

### External Resources
- **SEC EDGAR**: [https://www.sec.gov/edgar](https://www.sec.gov/edgar)
- **Yahoo Finance**: [https://finance.yahoo.com](https://finance.yahoo.com)
- **Financial Modeling**: Best practices and methodologies
- **Python Finance**: Financial analysis libraries and tools

## License and Legal

### Usage Terms
- **SEC Data**: Follow SEC data usage guidelines
- **Yahoo Finance**: Respect API terms of service
- **Academic Use**: Suitable for research and education
- **Commercial Use**: Review licensing requirements

### Attribution
- **SEC**: Securities and Exchange Commission
- **Yahoo Finance**: Market data provider
- **Open Source**: Respect open source licenses
- **Contributors**: Credit code contributors

---

For questions, issues, or contributions, please refer to the project repository or contact the development team.
