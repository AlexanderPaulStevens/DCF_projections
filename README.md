# DCF Projections

[![Code Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen)](https://github.com/AlexanderPaulStevens/DCF_projections)
[![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit&logoColor=white)](https://github.com/pre-commit/pre-commit)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

A comprehensive financial analysis tool for S&P 500 companies using Discounted Cash Flow (DCF) calculations and sensitivity analysis.

## Features

- **S&P 500 Data Scraping**: Automated collection of financial data from SEC EDGAR
- **DCF Analysis**: Multi-scenario discounted cash flow calculations
- **Sensitivity Analysis**: Comprehensive sensitivity analysis with customizable parameters
- **Company Overview**: Detailed financial metrics and company information
- **CLI Interface**: Command-line interface for batch processing and automation
- **Data Export**: JSON export of all analysis results

## Quick Start

1. **Install dependencies**:
   ```bash
   uv sync
   ```

2. **Set up pre-commit hooks** (required for development):
   ```bash
   pre-commit install
   ```

3. **Verify setup**:
   ```bash
   # Check that pre-commit hooks are working
   pre-commit run --all-files

   # Verify test coverage
   uv run coverage run -m pytest tests/
   uv run coverage report
   ```

4. **Run analysis**:
   ```bash
   # Basic company analysis
   python src/main.py --ticker AAPL

   # DCF analysis
   python src/main.py --ticker AAPL --dcf --y 3 --eg 0.15 --steps 2 --s 0.10

   # Sensitivity analysis
   python src/main.py --ticker AAPL --sensitivity --sensitivity-steps 11
   ```

## Usage Examples

```bash
# Company overview
python src/main.py --ticker AAPL --overview

# List available companies
python src/main.py --list

# Analyze all companies
python src/main.py --all

# DCF analysis with custom parameters
python src/main.py --ticker AAPL --dcf --y 5 --eg 0.20 --steps 3 --s 0.05
```

## Development

### Code Quality & Testing

This project enforces high code quality standards through automated checks:

#### **Pre-commit Hooks**
```bash
# Install pre-commit hooks
pre-commit install

# Run all pre-commit checks
pre-commit run --all-files

# Run specific checks
pre-commit run ruff-check
pre-commit run coverage-check
```

#### **Code Coverage Requirements**
- **Minimum Coverage: 80%** (enforced by pre-commit)

```bash
# Check coverage
uv run coverage run -m pytest tests/
uv run coverage report --show-missing

# Generate HTML coverage report
uv run coverage html
open htmlcov/index.html
```

#### **Code Quality Tools**
```bash
# Format code
ruff format .

# Lint code
ruff check .

# Run tests
uv run pytest tests/
```

## Project Structure

```
DCF_projections/
├── src/                          # Source code
│   ├── app/                      # Main application
│   │   ├── core/                 # Core business logic
│   │   ├── services/             # Business logic layer
│   │   └── __init__.py
│   └── main.py                   # CLI entry point
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── config/                       # Configuration
│   └── settings.py               # App settings
├── .pre-commit-config.yaml       # Pre-commit hooks
└── pyproject.toml                # Project configuration
```

## Configuration

Edit `config/settings.py` to customize:
- DCF parameters (growth rates, discount rates)
- SEC API settings
- File naming patterns
- Logging configuration

## Testing Strategy

### **Test Coverage Goals**
- **Minimum Coverage: 80%** (enforced by pre-commit hooks)
- **Target Coverage: 90%** (stretch goal)
- **Coverage Areas**: Core DCF logic, configuration, business services

### **Test Types**
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Coverage Tests**: Automated coverage enforcement

### **Running Tests**
```bash
# Run all tests
uv run pytest

# Run with coverage
uv run coverage run -m pytest tests/
uv run coverage report

# Run specific test files
uv run pytest tests/unit/test_dcf_calculations.py
uv run pytest tests/unit/test_sensitivity_analysis.py
```

**Note**: The UI file is excluded from the repository via `.gitignore` to keep it focused on CLI functionality.

## Disclaimer

This tool is for educational and research purposes only. Financial decisions should not be based solely on automated analysis.
