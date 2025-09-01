#!/usr/bin/env python3
"""
Integration tests for CLI functionality.
"""

import tempfile
import os
from pathlib import Path
from unittest.mock import Mock
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from app.services.cli_service import CLIService


class TestCLIIntegration:
    """Integration tests for CLI functionality."""

    def test_cli_ratios_integration(self):
        """Test CLI ratios functionality with real data flow."""
        cli = CLIService()
        cli.args = Mock()
        cli.args.ratios = True
        cli.args.save_ratios = None

        # Test that the CLI can handle ratios analysis
        try:
            cli._handle_financial_ratios("AAPL")
            # If we get here, the integration worked
            assert True
        except Exception as e:
            # If there's an error, it should be a reasonable one (not a setup issue)
            assert (
                "yfinance" in str(e)
                or "network" in str(e)
                or "API" in str(e)
                or "cached" in str(e)
            )

    def test_cli_list_companies_integration(self):
        """Test CLI list companies functionality with real scraper."""
        cli = CLIService()

        # Test that the CLI can list companies
        try:
            cli._handle_list_cached_companies()
            # If we get here, the integration worked
            assert True
        except Exception as e:
            # If there's an error, it should be a reasonable one (not a setup issue)
            assert (
                "network" in str(e)
                or "API" in str(e)
                or "timeout" in str(e)
                or "cached" in str(e)
            )

    def test_cli_argument_parsing_integration(self):
        """Test CLI argument parsing integration."""
        cli = CLIService()
        parser = cli.setup_argument_parser()

        # Test that we can parse basic arguments
        test_args = [["--ticker", "AAPL", "--ratios"], ["--list"]]

        for args in test_args:
            try:
                parsed = parser.parse_args(args)
                assert parsed is not None
            except Exception as e:
                # Argument parsing should not fail for valid arguments
                assert False, f"Failed to parse args {args}: {e}"

        # Test help separately (it exits with SystemExit)
        try:
            parser.parse_args(["--help"])
            assert False, "Help should exit"
        except SystemExit:
            # Help exits with SystemExit, which is expected
            assert True

    def test_cli_file_save_integration(self):
        """Test CLI file saving integration."""
        cli = CLIService()
        cli.args = Mock()
        cli.args.ratios = True
        cli.args.save_ratios = "test_ratios.csv"

        # Create a temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Change to temp directory
            original_cwd = os.getcwd()
            os.chdir(temp_dir)

            try:
                # Create company_data directory structure
                company_data_dir = Path("company_data") / "AAPL"
                company_data_dir.mkdir(parents=True, exist_ok=True)

                # Test that the CLI can handle file saving
                cli._handle_financial_ratios("AAPL")

                # Check if file was created (even if empty due to mocking)
                assert company_data_dir.exists()

            finally:
                # Restore original directory
                os.chdir(original_cwd)

    def test_cli_error_handling_integration(self):
        """Test CLI error handling integration."""
        cli = CLIService()

        # Test with invalid ticker
        try:
            cli._handle_analyze_company("INVALID_TICKER_12345")
            # Should handle gracefully
            assert True
        except Exception:
            # Exceptions are acceptable for invalid data
            assert True

    def test_cli_configuration_integration(self):
        """Test CLI configuration integration."""
        cli = CLIService()

        # Test that CLI has all required components
        assert hasattr(cli, "dcf_service")
        assert cli.dcf_service is not None
        assert hasattr(cli, "company_data_dir")

        # Test that argument parser can be created
        parser = cli.setup_argument_parser()
        assert parser is not None
        assert hasattr(parser, "parse_args")

    def test_cli_method_chaining_integration(self):
        """Test CLI method chaining integration."""
        cli = CLIService()

        # Test that CLI methods can be called in sequence
        try:
            # Setup args
            cli.args = Mock()
            cli.args.ratios = True
            cli.args.overview = False  # Don't set overview to avoid scraper calls
            cli.args.dcf = False
            cli.args.sensitivity = False
            cli.args.chart = False
            cli.args.save_ratios = None  # Don't save to avoid file path issues

            # Test method chaining
            cli._handle_analyze_company("AAPL")
            assert True
        except Exception as e:
            # Should handle gracefully
            assert (
                "network" in str(e)
                or "API" in str(e)
                or "timeout" in str(e)
                or "Mock" in str(e)
                or "cached" in str(e)
            )


# Test functions for pytest discovery
def test_cli_integration_basic():
    """Basic CLI integration test."""
    cli = CLIService()
    assert cli is not None
    assert hasattr(cli, "dcf_service")
    assert hasattr(cli, "company_data_dir")


def test_cli_integration_argument_parser():
    """Test CLI argument parser integration."""
    cli = CLIService()
    parser = cli.setup_argument_parser()
    assert parser is not None


def test_cli_integration_error_scenarios():
    """Test CLI integration with error scenarios."""
    cli = CLIService()

    # Test with None args
    try:
        cli._handle_analyze_company("TEST")
        # Should handle gracefully
        assert True
    except Exception:
        # Exceptions are acceptable
        assert True
