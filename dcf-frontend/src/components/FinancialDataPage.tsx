import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Timeline, TrendingUp, TrendingDown } from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis, FinancialRatios } from '../services/api';

const FinancialDataPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [financialRatios, setFinancialRatios] = useState<FinancialRatios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch both comprehensive analysis and financial ratios
        const [comprehensive, ratios] = await Promise.all([
          APIService.getComprehensiveAnalysis(ticker),
          APIService.getFinancialRatios(ticker).catch(() => null) // Don't fail if ratios are not available
        ]);

        setComprehensiveData(comprehensive);
        setFinancialRatios(ratios);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!comprehensiveData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No data available for {ticker}</Alert>
      </Container>
    );
  }

  const { valuation } = comprehensiveData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Timeline sx={{ fontSize: 32, color: '#0078d4', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Financial Data & Metrics - {ticker}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Comprehensive financial analysis and key metrics for {comprehensiveData.company_name}
        </Typography>
      </Box>

      {/* Key Financial Metrics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Key Financial Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${(valuation.market_cap / 1e9).toFixed(2)}B
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" size={{ xs: 12, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">Enterprise Value</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${valuation.enterprise_value ? (valuation.enterprise_value / 1e9).toFixed(2) + 'B' : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">P/E Ratio</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {valuation.pe_ratio?.toFixed(2) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">P/B Ratio</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {valuation.pb_ratio?.toFixed(2) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Ratios */}
      {financialRatios && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Financial Ratios Analysis
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ratio</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(financialRatios.ratios || financialRatios).slice(0, 8).map(([key, value]: [string, any]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ratio</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(financialRatios.ratios || financialRatios).slice(8).map(([key, value]: [string, any]) => (
                      <TableRow key={key}>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Current Market Data */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Current Market Data
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Current Price</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ${comprehensiveData.current_price?.toFixed(2) || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Volume</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {(comprehensiveData.volume / 1e6).toFixed(2)}M
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Price Change</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {(comprehensiveData.price_change_percent || 0) >= 0 ? (
                  <TrendingUp sx={{ color: '#107c10', mr: 1 }} />
                ) : (
                  <TrendingDown sx={{ color: '#d83b01', mr: 1 }} />
                )}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: (comprehensiveData.price_change_percent || 0) >= 0 ? '#107c10' : '#d83b01'
                  }}
                >
                  {comprehensiveData.price_change_percent?.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Sources and Confidence */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Data Quality & Sources
        </Typography>
        <Grid container spacing={3}>
          <Grid component="div" size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Data Sources
              </Typography>
              {comprehensiveData.data_sources.map((source, index) => (
                <Chip
                  key={index}
                  label={source}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Analysis Confidence
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Confidence Score:
                </Typography>
                <Chip
                  label={`${(comprehensiveData.confidence_score * 100).toFixed(0)}%`}
                  color={comprehensiveData.confidence_score >= 0.8 ? 'success' :
                         comprehensiveData.confidence_score >= 0.6 ? 'warning' : 'error'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Analysis Date: {new Date(comprehensiveData.analysis_date).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default FinancialDataPage;
