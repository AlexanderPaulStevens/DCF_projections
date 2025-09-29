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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Business, TrendingUp, TrendingDown } from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis } from '../services/api';

const CompetitiveAnalysisPage: React.FC = () => {
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

  const { competitive_advantage } = comprehensiveData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ fontSize: 32, color: '#0078d4', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Competitive Analysis - {ticker}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Deep dive into competitive advantages and market positioning for {comprehensiveData.company_name}
        </Typography>
      </Box>

      {/* Overall Moat Score */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Overall Competitive Moat Score
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Moat Strength</Typography>
            <Typography variant="body2">{competitive_advantage.overall_moat_strength.score}/10</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={competitive_advantage.overall_moat_strength.score * 10}
            sx={{ height: 12, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {competitive_advantage.overall_moat_strength.description}
        </Typography>
        <Chip
          label={competitive_advantage.overall_moat_strength.level}
          color={competitive_advantage.overall_moat_strength.score >= 7 ? 'success' :
                 competitive_advantage.overall_moat_strength.score >= 4 ? 'warning' : 'error'}
        />
      </Paper>

      {/* Competitive Advantages Breakdown */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Competitive Advantages Breakdown
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(competitive_advantage.competitive_advantages).map(([key, advantage]) => (
            <Grid size={{ xs: 12, md: 6 }} key={key}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {advantage.category}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Strength</Typography>
                      <Typography variant="body2">{advantage.strength_score}/10</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={advantage.strength_score * 10}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {advantage.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Impact: {advantage.impact_on_valuation}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Porter's Five Forces */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Porter's Five Forces Analysis
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(competitive_advantage.porters_five_forces).map(([key, force]) => {
            if (key === 'overall_industry_attractiveness') return null;

            const forceData = force as any;
            const level = forceData.power_level || forceData.rivalry_level || forceData.threat_level || 'Unknown';

            return (
              <Grid size={{ xs: 12, md: 6 }} key={key}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Chip
                      label={level}
                      color={level === 'Low' ? 'success' : level === 'Medium' ? 'warning' : 'error'}
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {forceData.description || 'No description available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Impact: {forceData.impact || 'No impact data available'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Overall Industry Attractiveness
          </Typography>
          <Typography variant="body1">
            {competitive_advantage.porters_five_forces.overall_industry_attractiveness}
          </Typography>
        </Box>
      </Paper>

      {/* Investment Thesis */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Investment Thesis
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {competitive_advantage.investment_thesis.thesis}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#107c10' }}>
                Opportunities
              </Typography>
              {competitive_advantage.investment_thesis.opportunities.map((opportunity, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {opportunity}
                </Typography>
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#d83b01' }}>
                Risk Factors
              </Typography>
              {competitive_advantage.investment_thesis.risk_factors.map((risk, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recommendation
          </Typography>
          <Typography variant="body1">
            {competitive_advantage.investment_thesis.recommendation}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CompetitiveAnalysisPage;
