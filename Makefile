.PHONY: help install setup test clean format lint run-demo run-dcf run-sensitivity run-ratios

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
	@echo ""
	@echo "Examples:"
	@echo "  run-demo    Run basic analysis for AAPL"
	@echo "  run-dcf     Run DCF analysis for AAPL"
	@echo "  run-sensitivity Run sensitivity analysis for AAPL"
	@echo "  run-ratios  Run financial ratios analysis for AAPL"
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

# Example runs
run-demo:
	uv run python src/main.py --ticker AAPL --overview

run-dcf:
	uv run python src/main.py --ticker AAPL --dcf --y 3 --eg 0.15 --steps 2 --s 0.10

run-sensitivity:
	uv run python src/main.py --ticker AAPL --sensitivity --sensitivity-steps 11

run-ratios:
	uv run python src/main.py --ticker AAPL --ratios

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
