import React from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useFinancialRatios } from "../hooks/queries";
import type {
  ProfitabilityRatios,
  LeverageRatios,
  EfficiencyRatios,
  ValuationRatios,
  LiquidityRatios,
} from "../types/api";

const FinancialRatios: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();

  // Use React Query hooks
  const {
    data: ratios,
    isLoading: ratiosLoading,
    error: ratiosError,
    refetch: refetchRatios,
  } = useFinancialRatios(ticker || "");

  // Combined loading and error states
  const loading = ratiosLoading;
  const error = ratiosError?.message || null;

  // Refetch query
  const handleRetry = () => {
    refetchRatios();
  };

  const formatRatio = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      if (value > 100) return `${value.toFixed(0)}%`;
      if (value > 1) return value.toFixed(2);
      return `${(value * 100).toFixed(1)}%`;
    }
    return "N/A";
  };

  const formatRatioName = (key: string) => {
    // Define mapping for common financial ratios that should be fully capitalized
    const ratioMappings: { [key: string]: string } = {
      'roe': 'ROE',
      'roa': 'ROA',
      'roic': 'ROIC',
      'pe_ratio': 'P/E Ratio',
      'forward_pe': 'Forward P/E',
      'peg_ratio': 'PEG Ratio',
      'pb_ratio': 'P/B Ratio',
      'ps_ratio': 'P/S Ratio',
      'ev_to_ebitda': 'EV/EBITDA',
      'price_to_fcf': 'Price/FCF',
      'debt_to_equity': 'Debt/Equity',
      'debt_to_assets': 'Debt/Assets',
      'net_debt_to_ebitda': 'Net Debt/EBITDA',
      'interest_coverage': 'Interest Coverage',
      'asset_turnover': 'Asset Turnover',
      'inventory_turnover': 'Inventory Turnover',
      'receivables_turnover': 'Receivables Turnover',
      'working_capital_turnover': 'Working Capital Turnover',
      'current_ratio': 'Current Ratio',
      'quick_ratio': 'Quick Ratio',
      'cash_ratio': 'Cash Ratio',
      'operating_margin': 'Operating Margin',
      'net_margin': 'Net Margin',
      'gross_margin': 'Gross Margin',
      'earnings_quality_ratio': 'Earnings Quality Ratio'
    };

    // Return mapped name if exists, otherwise capitalize first letter of each word
    return ratioMappings[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRatioColor = (value: number | null | undefined, type: string) => {
    if (value === null || value === undefined) return "default";

    switch (type) {
      case "profitability":
        return value > 0.1 ? "success" : value > 0.05 ? "warning" : "error";
      case "leverage":
        return value < 0.3 ? "success" : value < 0.6 ? "warning" : "error";
      case "efficiency":
        return value > 1 ? "success" : value > 0.5 ? "warning" : "error";
      case "valuation":
        return value < 15 ? "success" : value < 25 ? "warning" : "error";
      case "liquidity":
        return value > 2 ? "success" : value > 1 ? "warning" : "error";
      default:
        return "default";
    }
  };


  const renderRatioTable = (
    title: string,
    ratios: ProfitabilityRatios | LeverageRatios | EfficiencyRatios | ValuationRatios | LiquidityRatios | undefined,
    type: string
  ) => {
    console.log(`renderRatioTable called for ${title}:`, ratios);

    if (!ratios) {
      console.log(`No ratios data for ${title}`);
      return null;
    }

    const ratioEntries = Object.entries(ratios).filter(([_, value]) => value !== null && value !== undefined);
    console.log(`Filtered entries for ${title}:`, ratioEntries);

    if (ratioEntries.length === 0) {
      console.log(`No valid entries for ${title}`);
      return null;
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "primary.main" }}>
            {title}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ratioEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatRatioName(key)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatRatio(value)}
                        color={getRatioColor(value, type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };


  const renderSummaryMetrics = () => {
    if (!ratios) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "primary.main" }}>
            Financial Ratios Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Latest Year: {ratios.latest_year}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Years Available: {ratios.years_available.join(', ')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box display="flex" justifyContent="center">
          <Button variant="contained" onClick={handleRetry}>
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  if (!ratios) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No financial ratios data available for {ticker}.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Financial Ratios Analysis
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          {ticker?.toUpperCase()}
        </Typography>
        {ratios.cache_status && (
          <Chip
            label={`Data Status: ${ratios.cache_status}`}
            color={ratios.cache_warning ? "warning" : "success"}
            size="small"
            sx={{ mb: 2 }}
          />
        )}
      </Box>

      {/* Summary Metrics */}
      {renderSummaryMetrics()}

      {/* Financial Ratios */}
      {(() => {
        if (!ratios || !ratios.ratios) {
          console.log('No ratios data:', { ratios });
          return <Typography>No financial ratios data available</Typography>;
        }

        const latestYearData = ratios.ratios[ratios.latest_year.toString()];
        console.log('Debug - ratios object:', ratios);
        console.log('Debug - latest year:', ratios.latest_year);
        console.log('Debug - latest year data:', latestYearData);
        console.log('Debug - available years:', Object.keys(ratios.ratios));

        if (!latestYearData) {
          console.log('No data for latest year:', ratios.latest_year);
          return <Typography>No data available for year {ratios.latest_year}</Typography>;
        }

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                {renderRatioTable("Profitability Ratios", latestYearData.profitability, "profitability")}
                {renderRatioTable("Leverage Ratios", latestYearData.leverage, "leverage")}
              </Box>
              <Box sx={{ flex: 1 }}>
                {renderRatioTable("Efficiency Ratios", latestYearData.efficiency, "efficiency")}
                {renderRatioTable("Valuation Ratios", latestYearData.valuation, "valuation")}
              </Box>
            </Box>
            <Box>
              {renderRatioTable("Liquidity Ratios", latestYearData.liquidity, "liquidity")}
            </Box>
          </Box>
        );
      })()}

      {/* Analysis Warning */}
      {ratios.analysis_warning && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          {ratios.analysis_warning}
        </Alert>
      )}
    </Container>
  );
};

export default FinancialRatios;
