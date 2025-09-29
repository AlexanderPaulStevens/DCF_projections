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
  Chip,
  LinearProgress,
} from '@mui/material';
import { Assessment, TrendingUp, TrendingDown, Star } from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis } from '../services/api';

const InvestmentAnalysisPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        setError(null);
        const data = await APIService.getComprehensiveAnalysis(ticker);
        setComprehensiveData(data);
      } catch (err) {
        console.error('Error fetching comprehensive analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis data');
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

  const { summary, valuation, risks, opportunities } = comprehensiveData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Assessment sx={{ fontSize: 32, color: '#0078d4', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Investment Analysis - {ticker}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Comprehensive investment analysis and recommendations for {comprehensiveData.company_name}
        </Typography>
      </Box>

      {/* Investment Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Investment Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Star sx={{ mr: 1, color: '#ffc107' }} />
                  Recommendation
                </Typography>
                <Chip
                  label={summary.investment_recommendation}
                  color={summary.investment_recommendation === 'Buy' ? 'success' :
                         summary.investment_recommendation === 'Hold' ? 'warning' : 'error'}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Risk Level: {summary.risk_level}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Upside Potential
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: (summary.upside_potential || 0) >= 0 ? '#107c10' : '#d83b01'
                  }}
                >
                  {summary.upside_potential ? `${summary.upside_potential.toFixed(1)}%` : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on DCF analysis
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Valuation Analysis */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Valuation Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">DCF Value per Share</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ${valuation.dcf_per_share?.toFixed(2) || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Current Price</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ${valuation.current_price?.toFixed(2) || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Price Target</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ${valuation.price_target?.toFixed(2) || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Moat Analysis */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Competitive Moat Analysis
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Moat Strength</Typography>
            <Typography variant="body2">{summary.moat_strength_score}/10</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={summary.moat_strength_score * 10}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Moat Level: {summary.moat_level}
        </Typography>
      </Paper>

      {/* Risks and Opportunities */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#d83b01' }}>
              Key Risks
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Competitive Risks:</Typography>
              {risks.competitive_risks.slice(0, 3).map((risk, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Financial Risks:</Typography>
              {risks.financial_risks.slice(0, 2).map((risk, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#107c10' }}>
              Growth Opportunities
            </Typography>
            {opportunities.growth_opportunities.slice(0, 5).map((opportunity, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                • {opportunity}
              </Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvestmentAnalysisPage;
