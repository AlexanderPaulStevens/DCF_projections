.PHONY: help install run clean

# Default target
help:
	@echo "DCF Projections - Available Commands:"
	@echo "  install     Install dependencies"
	@echo "  run         Start the application (frontend + backend)"
	@echo "  clean       Clean up generated files and caches"

# Installation
install:
	uv sync
	cd frontend && npm install

# Run application
run:
	./run.sh

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
	rm -rf build/ dist/ .eggs/
	# Frontend cache cleanup
	rm -rf frontend/node_modules/.cache/
	rm -rf frontend/build/
	# Additional cleanup
	find . -name "*.log" -delete
	find . -name ".eslintcache" -delete
	find . -name ".stylelintcache" -delete
	find . -name ".DS_Store" -delete
	find . -name "Thumbs.db" -delete
	find . -name "*.swp" -delete
	find . -name "*.swo" -delete
	find . -name "*~" -delete
	rm -rf tmp/ temp/ logs/
	rm -rf coverage/ .nyc_output/
	rm -rf .parcel-cache/ .turbo/
	rm -rf .vscode-test/
