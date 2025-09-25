.PHONY: help install setup test clean format lint run-demo run-dcf run-sensitivity run-ratios test-coverage coverage-report scrape-company scrape-all

# Default target
help:
	@echo "DCF Projections - Available Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  install     Install dependencies"
	@echo "  setup       Set up pre-commit hooks"
	@echo ""
	@echo "Development:"
	@echo "  format      Format code with ruff"
	@echo "  lint        Run linting checks"
	@echo "  test        Run all pre-commit checks"
	@echo "  test-coverage Run tests with coverage report in terminal"
	@echo "  coverage-report Generate detailed HTML coverage report"
	@echo ""
	@echo "Data Scraping:"
	@echo "  scrape-company  Scrape data for one company (usage: make scrape-company TICKER=AAPL)"
	@echo "  scrape-all      Scrape data for all S&P 500 companies"
	@echo "  scrape-missing  Scrape only companies without data (recommended)"
	@echo "  update-ciks     Update CIK list with current S&P 500 companies"
	@echo "  scrape-wikipedia Scrape current S&P 500 companies from Wikipedia"
	@echo "  check-status    Check data status for all companies"
	@echo ""
	@echo "Examples:"
	@echo "  run-demo    Run basic analysis for AAPL"
	@echo "  run-dcf     Run DCF analysis for AAPL"
	@echo "  run-sensitivity Run sensitivity analysis for AAPL"
	@echo "  run-ratios  Run financial ratios analysis for AAPL"
	@echo "  scrape-company TICKER=AAPL"
	@echo "  scrape-all"
	@echo "  scrape-missing"
	@echo "  update-ciks"
	@echo "  scrape-wikipedia"
	@echo "  check-status"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean       Clean up generated files and caches"

# Installation
install:
	uv sync

setup: install
	pre-commit install

# Code quality
format:
	ruff format .

lint:
	ruff check .

test:
	pre-commit run --all-files

# Testing and coverage
test-coverage:
	python -m pytest backend/tests --cov=backend --cov-report=term-missing

coverage-report:
	python -m pytest backend/tests --cov=backend --cov-report=html
	@echo "Coverage report generated in htmlcov/index.html"
	@echo "Open htmlcov/index.html in your browser to view the report"

# Data scraping
scrape-company:
	@if [ -z "$(TICKER)" ]; then \
		echo "Error: Please specify TICKER=SYMBOL"; \
		echo "Example: make scrape-company TICKER=AAPL"; \
		exit 1; \
	fi
	@echo "Scraping $(TICKER)..."
	cd company_data && PYTHONPATH=.. python scrape_company.py $(TICKER)

scrape-all:
	@echo "Scraping all S&P 500 companies..."
	cd company_data && PYTHONPATH=.. python scrape_sp500.py

check-status:
	@echo "Checking data status for all companies..."
	cd company_data && PYTHONPATH=.. python check_data_status.py

scrape-missing:
	@echo "Scraping only missing companies..."
	cd company_data && PYTHONPATH=.. python scrape_missing.py

update-ciks:
	@echo "Updating CIK list with current S&P 500 companies..."
	cd company_data && PYTHONPATH=.. python update_cik_list.py

scrape-wikipedia:
	@echo "Scraping S&P 500 companies from Wikipedia..."
	cd company_data && PYTHONPATH=.. python scrape_wikipedia_sp500.py

# Example runs
run-demo:
	uv run python -m backend.cli --ticker AAPL --overview

run-dcf:
	uv run python -m backend.cli --ticker AAPL --dcf --y 3 --eg 0.15 --steps 2 --s 0.10

run-sensitivity:
	uv run python -m backend.cli --ticker AAPL --sensitivity --sensitivity-steps 11

run-ratios:
	uv run python -m backend.cli --ticker AAPL --ratios

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf build/ dist/ .eggs/x
