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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Psychology, TrendingUp, TrendingDown, Timeline } from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis, ForecastAnalysis } from '../services/api';

const AIForecastsPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [forecastData, setForecastData] = useState<ForecastAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch both comprehensive analysis and forecast data
        const [comprehensive, forecast] = await Promise.all([
          APIService.getComprehensiveAnalysis(ticker),
          APIService.getForecastAnalysis(ticker).catch(() => null) // Don't fail if forecast is not available
        ]);

        setComprehensiveData(comprehensive);
        setForecastData(forecast);
      } catch (err) {
        console.error('Error fetching analysis data:', err);
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Psychology sx={{ fontSize: 32, color: '#0078d4', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            AI Forecasts - {ticker}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#666666' }}>
          AI-powered price forecasts and trend analysis for {comprehensiveData.company_name}
        </Typography>
      </Box>

      {/* Forecast Summary */}
      {forecastData && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            AI Forecast Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Current Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${forecastData.current_price?.toFixed(2) || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Forecast Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${forecastData.forecast_price?.toFixed(2) || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Forecast Trend</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {forecastData.forecast_trend >= 0 ? (
                      <TrendingUp sx={{ color: '#107c10', mr: 1 }} />
                    ) : (
                      <TrendingDown sx={{ color: '#d83b01', mr: 1 }} />
                    )}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: forecastData.forecast_trend >= 0 ? '#107c10' : '#d83b01'
                      }}
                    >
                      {forecastData.forecast_trend?.toFixed(2)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Confidence Range</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${forecastData.confidence_lower?.toFixed(2)} - ${forecastData.confidence_upper?.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* DCF Analysis Forecast */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          DCF Analysis & Valuation
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">DCF Value per Share</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${comprehensiveData.valuation.dcf_per_share?.toFixed(2) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">Current Price</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${comprehensiveData.valuation.current_price?.toFixed(2) || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">Upside/Downside</Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: (comprehensiveData.valuation.upside_downside || 0) >= 0 ? '#107c10' : '#d83b01'
                  }}
                >
                  {comprehensiveData.valuation.upside_downside ? `${comprehensiveData.valuation.upside_downside.toFixed(1)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Growth Opportunities */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Growth Opportunities & Market Expansion
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Growth Opportunities
              </Typography>
              {comprehensiveData.opportunities.growth_opportunities.map((opportunity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {opportunity}
                </Typography>
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Strategic Advantages
              </Typography>
              {comprehensiveData.opportunities.strategic_advantages.map((advantage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {advantage}
                </Typography>
              ))}
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Market Expansion Potential
          </Typography>
          <Typography variant="body1">
            {comprehensiveData.opportunities.market_expansion_potential}
          </Typography>
        </Box>
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Innovation Capability
          </Typography>
          <Typography variant="body1">
            {comprehensiveData.opportunities.innovation_capability}
          </Typography>
        </Box>
      </Paper>

      {/* Risk Analysis */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Risk Analysis & Forecast Considerations
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#d83b01' }}>
                Competitive Risks
              </Typography>
              {comprehensiveData.risks.competitive_risks.slice(0, 3).map((risk: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#d83b01' }}>
                Industry Risks
              </Typography>
              {comprehensiveData.risks.industry_risks.slice(0, 3).map((risk: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#d83b01' }}>
                Financial Risks
              </Typography>
              {comprehensiveData.risks.financial_risks.slice(0, 3).map((risk: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                  • {risk}
                </Typography>
              ))}
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3cd', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Overall Risk Level: {comprehensiveData.risks.overall_risk_level}
          </Typography>
          <Typography variant="body2">
            {comprehensiveData.risks.risk_factors_count} risk factors identified
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIForecastsPage;
