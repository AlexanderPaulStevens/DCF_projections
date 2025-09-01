import enum
import numpy as np
import matplotlib
import json
from datetime import datetime
from pathlib import Path
from config.settings import Settings
from .DCF_calculations import DCFCalculator

# Use non-interactive backend for testing and non-GUI environments
matplotlib.use(Settings.MATPLOTLIB_BACKEND)
import matplotlib.pyplot as plt


class SensitivityVariable(enum.Enum):
    EARNINGS_GROWTH_RATE = "earnings_growth_rate"
    DISCOUNT_RATE = "discount_rate"
    CAP_EX_GROWTH_RATE = "cap_ex_growth_rate"
    PERPETUAL_GROWTH_RATE = "perpetual_growth_rate"


class SensitivityAnalyzer:
    """
    Comprehensive sensitivity analysis for DCF calculations.
    """

    def __init__(self, dcf_calculator):
        """
        Initialize sensitivity analyzer.

        Args:
            dcf_calculator: DCFCalculator instance
        """
        self.dcf_calculator = dcf_calculator
        self.base_values = {
            "earnings_growth_rate": 0.15,
            "discount_rate": 0.10,
            "cap_ex_growth_rate": 0.04,
            "perpetual_growth_rate": 0.025,
        }

    def run_sensitivity_analysis(
        self, variable, base_value=None, min_change=-0.50, max_change=0.50, steps=11
    ):
        """
        Run sensitivity analysis for a specific variable.

        Args:
            variable (SensitivityVariable): Variable to analyze
            base_value (float): Base value for the variable
            min_change (float): Minimum percentage change from base
            max_change (float): Maximum percentage change from base
            steps (int): Number of steps in the analysis

        Returns:
            dict: Sensitivity analysis results
        """
        if base_value is None:
            base_value = self.base_values.get(variable.value, 0.15)

        # Generate range of values
        changes = np.linspace(min_change, max_change, steps)
        values = [base_value * (1 + change) for change in changes]

        results = {
            "variable": variable.value,
            "base_value": base_value,
            "changes": changes.tolist(),
            "values": values,
            "enterprise_values": [],
            "equity_values": [],
            "per_share_values": [],
            "percentage_changes": [],
        }

        # Calculate DCF for each value
        for value in values:
            # Create a copy of the DCF calculator with modified parameters
            modified_calculator = self._create_modified_calculator(variable, value)

            # Run DCF calculation
            projections = modified_calculator.project_financials()
            enterprise_value = modified_calculator.calculate_enterprise_value(
                projections
            )
            equity_value = modified_calculator.calculate_equity_value(enterprise_value)
            per_share_value = modified_calculator.calculate_per_share_value(
                equity_value
            )

            results["enterprise_values"].append(enterprise_value)
            results["equity_values"].append(equity_value)
            results["per_share_values"].append(per_share_value)

            # Calculate percentage change from base case
            if len(results["enterprise_values"]) == 1:
                base_enterprise_value = enterprise_value
                percentage_change = 0.0
            else:
                percentage_change = (
                    (enterprise_value - base_enterprise_value) / base_enterprise_value
                ) * 100

            results["percentage_changes"].append(percentage_change)

        return results

    def _create_modified_calculator(self, variable, value):
        """
        Create a modified DCF calculator with the specified variable value.

        Args:
            variable (SensitivityVariable): Variable to modify
            value (float): New value for the variable

        Returns:
            DCFCalculator: Modified calculator instance
        """
        # Create a copy of the original calculator
        modified_calculator = DCFCalculator(
            self.dcf_calculator.ticker,
            self.dcf_calculator.financial_data,
            self.dcf_calculator.base_year,
        )

        # Copy all attributes
        modified_calculator.tax_rate = self.dcf_calculator.tax_rate
        modified_calculator.terminal_growth_rate = (
            self.dcf_calculator.terminal_growth_rate
        )
        modified_calculator.wacc = self.dcf_calculator.wacc
        modified_calculator.projection_years = self.dcf_calculator.projection_years

        # Modify the specific variable
        if variable == SensitivityVariable.EARNINGS_GROWTH_RATE:
            # Store the earnings growth rate to use in project_financials
            modified_calculator._earnings_growth_rate = value
            # Override the project_financials method to use our stored value
            original_method = modified_calculator.project_financials

            def modified_project_financials(years=5, cap_ex_growth_rate=None):
                return original_method(
                    earnings_growth_rate=value,
                    years=years,
                    cap_ex_growth_rate=cap_ex_growth_rate,
                )

            modified_calculator.project_financials = modified_project_financials
        elif variable == SensitivityVariable.DISCOUNT_RATE:
            modified_calculator.wacc = value
        elif variable == SensitivityVariable.CAP_EX_GROWTH_RATE:
            modified_calculator._cap_ex_growth_rate = value
            # Override the project_financials method to use our stored cap ex growth rate
            original_method = modified_calculator.project_financials

            def modified_project_financials(
                earnings_growth_rate=0.15, years=5, cap_ex_growth_rate=None
            ):
                return original_method(
                    earnings_growth_rate=earnings_growth_rate,
                    years=years,
                    cap_ex_growth_rate=value,
                )

            modified_calculator.project_financials = modified_project_financials
        elif variable == SensitivityVariable.PERPETUAL_GROWTH_RATE:
            modified_calculator.terminal_growth_rate = value

        return modified_calculator

    def run_comprehensive_sensitivity_analysis(self, steps=11):
        """
        Run sensitivity analysis for all variables.

        Args:
            steps (int): Number of steps in each analysis

        Returns:
            dict: Comprehensive sensitivity analysis results
        """
        comprehensive_results = {}

        for variable in SensitivityVariable:
            print(f"Running sensitivity analysis for {variable.value}...")
            results = self.run_sensitivity_analysis(variable, steps=steps)
            comprehensive_results[variable.value] = results

        return comprehensive_results

    def plot_sensitivity_analysis(self, results, save_path=None):
        """
        Create sensitivity analysis plots.

        Args:
            results (dict): Sensitivity analysis results
            save_path (str): Path to save the plot
        """
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(
            f"Sensitivity Analysis for {self.dcf_calculator.ticker} DCF Model",
            fontsize=16,
            fontweight="bold",
        )

        # Flatten axes for easier iteration
        axes = axes.flatten()

        for i, (variable, data) in enumerate(results.items()):
            if i >= len(axes):
                break

            ax = axes[i]

            # Create primary y-axis for enterprise value
            ax2 = ax.twinx()

            # Plot enterprise value on primary axis
            line1 = ax.plot(
                data["changes"],
                data["enterprise_values"],
                "b-",
                linewidth=2,
                label="Enterprise Value",
            )
            ax.set_ylabel("Enterprise Value ($)", color="b")
            ax.tick_params(axis="y", labelcolor="b")

            # Plot percentage change on secondary axis
            line2 = ax2.plot(
                data["changes"],
                data["percentage_changes"],
                "r--",
                linewidth=2,
                label="% Change",
            )
            ax2.set_ylabel("% Change from Base", color="r")
            ax2.tick_params(axis="y", labelcolor="r")

            # Add grid and labels
            ax.grid(True, alpha=0.3)
            ax.set_xlabel(f"{variable.replace('_', ' ').title()} Change (%)")
            ax.set_title(f"{variable.replace('_', ' ').title()}", fontweight="bold")

            # Add legend
            lines = line1 + line2
            labels = [line.get_label() for line in lines]
            ax.legend(lines, labels, loc="upper left")

            # Add base value annotation
            base_value = data["base_value"]
            if "rate" in variable:
                ax.axvline(
                    x=0,
                    color="g",
                    linestyle=":",
                    alpha=0.7,
                    label=f"Base: {base_value:.1%}",
                )
            else:
                ax.axvline(
                    x=0,
                    color="g",
                    linestyle=":",
                    alpha=0.7,
                    label=f"Base: {base_value:.3f}",
                )

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches="tight")
            print(f"Sensitivity analysis plot saved to {save_path}")

        plt.show()

    def print_sensitivity_summary(self, results):
        """
        Print a comprehensive summary of sensitivity analysis results.

        Args:
            results (dict): Sensitivity analysis results
        """
        print(f"\n{'=' * 80}")
        print(f"SENSITIVITY ANALYSIS SUMMARY FOR {self.dcf_calculator.ticker.upper()}")
        print(f"{'=' * 80}")

        for variable, data in results.items():
            print(f"\n{'-' * 60}")
            print(f"Variable: {variable.replace('_', ' ').title()}")
            print(f"Base Value: {data['base_value']:.3f}")
            print(f"{'-' * 60}")

            print(
                f"{'Change %':<10} | {'Value':<12} | {'Enterprise Value':<18} | {'% Change':<10}"
            )
            print("-" * 60)

            for i, (change, value) in enumerate(zip(data["changes"], data["values"])):
                enterprise_value = data["enterprise_values"][i]
                percentage_change = data["percentage_changes"][i]

                # Format the value display
                if "rate" in variable:
                    value_str = f"{value:.1%}"
                else:
                    value_str = f"{value:.3f}"

                print(
                    f"{change:>8.1%} | {value_str:<12} | ${enterprise_value:>16,.0f} | {percentage_change:>8.1f}%"
                )

            # Calculate sensitivity metrics
            max_increase = max(data["percentage_changes"])
            max_decrease = min(data["percentage_changes"])

            print("\nSensitivity Metrics:")
            print(f"  Maximum Increase: {max_increase:.1f}%")
            print(f"  Maximum Decrease: {max_decrease:.1f}%")
            print(f"  Range: {max_increase - max_decrease:.1f}%")

        print(f"\n{'=' * 80}")

    def export_sensitivity_results(self, results, filename=None):
        """
        Export sensitivity analysis results to JSON.

        Args:
            results (dict): Sensitivity analysis results
            filename (str): Output filename

        Returns:
            str: Path to saved file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = (
                f"sensitivity_analysis_{self.dcf_calculator.ticker}_{timestamp}.json"
            )

        # Ensure company directory exists
        company_dir = Path("company_data") / self.dcf_calculator.ticker
        company_dir.mkdir(exist_ok=True)

        file_path = company_dir / filename

        output_data = {
            "timestamp": datetime.now().isoformat(),
            "ticker": self.dcf_calculator.ticker,
            "base_year": self.dcf_calculator.base_year,
            "sensitivity_analysis": results,
            "metadata": {
                "description": "Comprehensive sensitivity analysis for DCF model",
                "variables_analyzed": list(results.keys()),
                "base_values": self.base_values,
            },
        }

        with open(file_path, "w") as f:
            json.dump(output_data, f, indent=2, default=str)

        print(f"Sensitivity analysis results exported to {file_path}")
        return str(file_path)
