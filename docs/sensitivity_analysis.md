# Sensitivity Analysis

This module provides comprehensive sensitivity analysis for DCF calculations, allowing users to understand how changes in key parameters affect company valuations.

## Overview

The Sensitivity Analyzer tests the robustness of DCF valuations by varying critical input parameters and measuring their impact on final valuation results. This helps identify which assumptions have the greatest influence on valuation outcomes.

## Features

### 1. Parameter Sensitivity Testing
- **Earnings Growth Rate**: Test impact of growth rate variations
- **Discount Rate**: Analyze effect of required return changes
- **Capital Expenditure Growth**: Model capital investment scenarios
- **Perpetual Growth Rate**: Test terminal value assumptions

### 2. Analysis Methods
- **One-Way Sensitivity**: Vary single parameter while holding others constant
- **Range Testing**: Test parameter values across specified ranges
- **Step Analysis**: Incremental parameter changes with configurable steps
- **Threshold Analysis**: Identify critical parameter values

### 3. Output Visualization
- **Tabular Results**: Comprehensive data tables
- **Graphical Charts**: Visual representation of relationships
- **Summary Statistics**: Key metrics and trends
- **Export Capabilities**: CSV and JSON output formats

## Core Components

### SensitivityAnalyzer Class

The main class that performs sensitivity analysis on DCF calculations.

#### Key Methods

- `run_sensitivity_analysis()`: Execute sensitivity analysis for a parameter
- `run_comprehensive_analysis()`: Test multiple parameters simultaneously
- `generate_sensitivity_chart()`: Create visualization charts
- `export_results()`: Save results to various formats
- `get_parameter_impact()`: Calculate parameter sensitivity metrics

#### Parameters

- `dcf_calculator`: DCFCalculator instance for base calculations
- `base_values`: Dictionary of default parameter values
- `analysis_config`: Configuration for analysis parameters

## Usage

### Command Line Interface

```bash
# Basic sensitivity analysis
python src/main.py --ticker AAPL --sensitivity

# Custom sensitivity parameters
python src/main.py --ticker AAPL --sensitivity --sensitivity-steps 21 --sensitivity-range 0.75
```

### Makefile Commands

```bash
# Run sensitivity analysis for AAPL
make run-sensitivity
```

### Programmatic Usage

```python
from app.features.sensitivity_analysis import SensitivityAnalyzer, SensitivityVariable

# Create analyzer
analyzer = SensitivityAnalyzer(dcf_calculator)

# Run earnings growth sensitivity
results = analyzer.run_sensitivity_analysis(
    variable=SensitivityVariable.EARNINGS_GROWTH_RATE,
    base_value=0.15,
    min_change=-0.50,
    max_change=0.50,
    steps=11
)

# Run comprehensive analysis
comprehensive_results = analyzer.run_comprehensive_analysis()
```

## Analysis Variables

### 1. Earnings Growth Rate
- **Impact**: Most significant parameter affecting valuation
- **Range**: Typically -50% to +100% of base value
- **Sensitivity**: High - small changes create large valuation swings

### 2. Discount Rate
- **Impact**: Affects present value of future cash flows
- **Range**: Usually 8% to 15% for most companies
- **Sensitivity**: High - exponential impact on present values

### 3. Capital Expenditure Growth
- **Impact**: Influences free cash flow projections
- **Range**: -20% to +50% of base value
- **Sensitivity**: Medium - affects cash flow timing and amounts

### 4. Perpetual Growth Rate
- **Impact**: Determines terminal value calculation
- **Range**: 1% to 5% (rarely higher)
- **Sensitivity**: High - small changes significantly affect terminal value

## Analysis Configuration

### Parameter Ranges

```python
# Default sensitivity ranges
base_values = {
    "earnings_growth_rate": 0.15,      # 15% base growth
    "discount_rate": 0.10,             # 10% required return
    "cap_ex_growth_rate": 0.04,        # 4% capex growth
    "perpetual_growth_rate": 0.025,    # 2.5% terminal growth
}

# Analysis ranges
analysis_ranges = {
    "earnings_growth_rate": (-0.50, 1.00),    # -50% to +100%
    "discount_rate": (-0.20, 0.50),           # -20% to +50%
    "cap_ex_growth_rate": (-0.50, 1.00),     # -50% to +100%
    "perpetual_growth_rate": (-0.60, 1.00),  # -60% to +100%
}
```

### Step Configuration

- **Default Steps**: 11 steps for most analyses
- **High Precision**: 21+ steps for detailed analysis
- **Custom Ranges**: User-defined step counts and ranges
- **Adaptive Steps**: Automatic step adjustment based on parameter sensitivity

## Output Format

### Console Display

Sensitivity analysis results are displayed in comprehensive tables:

```
================================================================================
SENSITIVITY ANALYSIS: Earnings Growth Rate
================================================================================
Base Value: 15.00%
Analysis Range: -50.00% to +50.00%
Steps: 11

Results Summary:
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Growth Rate     │ Enterprise Value│ Equity Value    │ Per-Share Value │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 7.50% (-50%)   │ $2,145,678M    │ $2,045,678M    │ $138.25        │
│ 11.25% (-25%)  │ $2,645,678M    │ $2,545,678M    │ $171.85        │
│ 15.00% (Base)  │ $3,245,678M    │ $3,145,678M    │ $212.45        │
│ 18.75% (+25%)  │ $3,945,678M    │ $3,845,678M    │ $259.85        │
│ 22.50% (+50%)  │ $4,745,678M    │ $4,645,678M    │ $313.85        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Data Export

Results can be exported in multiple formats:

```python
# Export to CSV
analyzer.export_results(results, format='csv', filename='sensitivity_results.csv')

# Export to JSON
analyzer.export_results(results, format='json', filename='sensitivity_results.json')

# Get results as dictionary
results_dict = analyzer.get_results_summary(results)
```

## Visualization

### Sensitivity Charts

The module generates various chart types:

- **Line Charts**: Parameter vs. valuation relationships
- **Bar Charts**: Parameter impact comparisons
- **Heat Maps**: Multi-parameter sensitivity visualization
- **Tornado Charts**: Parameter importance ranking

### Chart Configuration

```python
# Generate sensitivity chart
analyzer.generate_sensitivity_chart(
    results,
    chart_type='line',
    save_path='sensitivity_chart.png',
    show_grid=True,
    include_annotations=True
)
```

## Integration

The Sensitivity Analyzer integrates with other system components:

- **DCF Calculator**: Uses DCF projections as base case
- **Financial Ratios**: Provides context for ratio analysis
- **Company Analysis**: Works with company overview data
- **Reporting**: Generates comprehensive analysis reports

## Advanced Features

### 1. Monte Carlo Simulation
- **Random Sampling**: Generate parameter combinations randomly
- **Probability Distributions**: Model parameter uncertainty
- **Confidence Intervals**: Calculate valuation confidence ranges
- **Risk Assessment**: Quantify valuation risk

### 2. Scenario Analysis
- **Best Case**: Optimistic parameter assumptions
- **Worst Case**: Pessimistic parameter assumptions
- **Base Case**: Most likely parameter values
- **Custom Scenarios**: User-defined parameter combinations

### 3. Break-Even Analysis
- **Parameter Thresholds**: Identify critical parameter values
- **Valuation Targets**: Find parameters for target valuations
- **Risk Boundaries**: Define acceptable parameter ranges
- **Decision Support**: Guide investment decisions

## Performance Considerations

### Optimization Strategies

- **Parallel Processing**: Multi-threaded parameter testing
- **Caching**: Reuse calculated values where possible
- **Incremental Updates**: Update only changed parameters
- **Memory Management**: Efficient data structure usage

### Scalability

- **Large Parameter Sets**: Handle many parameters efficiently
- **Multiple Companies**: Analyze multiple companies simultaneously
- **Batch Processing**: Process multiple analyses in sequence
- **Resource Management**: Optimize CPU and memory usage

## Error Handling

The module includes robust error handling for:

- **Invalid Parameters**: Parameter range and type validation
- **Calculation Errors**: Mathematical operation error handling
- **Data Inconsistencies**: Input data validation
- **Memory Issues**: Large dataset handling
- **File I/O Errors**: Export operation error handling

## Future Enhancements

Potential improvements include:

- **Machine Learning**: AI-powered parameter optimization
- **Real-time Data**: Live market data integration
- **Advanced Visualization**: Interactive charts and dashboards
- **API Integration**: External data source connections
- **Cloud Computing**: Distributed analysis capabilities
- **Custom Models**: User-defined valuation models
