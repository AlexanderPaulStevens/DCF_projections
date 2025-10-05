# Horizon - Financial Analysis Platform

A comprehensive financial analysis platform for S&P 500 companies using Discounted Cash Flow (DCF) calculations and real-time market data.

## Features

- **Real-time Data**: Yahoo Finance API integration for live stock data
- **DCF Analysis**: Multi-scenario discounted cash flow calculations
- **Company Search**: Real-time search across S&P 500 companies
- **Modern Web Interface**: React-based frontend with interactive charts
- **REST API**: FastAPI backend with comprehensive financial analysis endpoints

## Quick Start

1. **Install dependencies**:
   ```bash
   make install
   ```

2. **Run the application**:
   ```bash
   ./run.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

## Architecture

- **Yahoo Finance API**: Primary data source for real-time financial data
- **Google Cloud Storage**: S&P 500 companies list persistence
- **FastAPI Backend**: Real-time financial data and DCF calculations
- **React Frontend**: Modern UI with Material-UI components

## Usage

- **Search Companies**: Use the search bar to find any S&P 500 company
- **Stock Analysis**: View detailed stock price charts and metrics
- **DCF Analysis**: Run discounted cash flow calculations with custom parameters
- **Financial Ratios**: Analyze key financial metrics and ratios

## Development

```bash
# Install dependencies
uv sync

# Run tests
uv run pytest backend/tests

# Format code
ruff format .

# Lint code
ruff check .
```

## Project Structure

```
horizon/
├── backend/                          # FastAPI backend
│   ├── app/                         # Application package
│   │   ├── routers/                 # API endpoints
│   │   ├── core/                    # Business logic
│   │   ├── schemas/                 # Data models
│   │   ├── services/                # Service layer
│   │   └── utils/                   # Utilities
│   ├── main.py                      # FastAPI entry point
│   └── tests/                       # Backend tests
├── frontend/                        # React application
├── company_data/                    # S&P 500 companies data
├── run.sh                           # Full-stack launcher
└── pyproject.toml                   # Project configuration
```

## Configuration

Edit `config.env` to customize:
- DCF parameters (growth rates, discount rates)
- API endpoints and timeouts
- Data source configurations

## Disclaimer

This tool is for educational and research purposes only. Financial decisions should not be based solely on automated analysis.
