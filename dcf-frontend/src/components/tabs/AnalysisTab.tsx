import React from 'react';
import { Box, Card, CardContent, CardHeader, Typography, Chip, LinearProgress, Grid } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  targetEstimate: number;
}

interface AnalysisTabProps {
  stockData: StockData;
}

export function AnalysisTab({ stockData }: AnalysisTabProps) {
  const analystRecommendations = [
    { firm: "Goldman Sachs", rating: "Buy", target: 200, date: "Dec 10, 2024" },
    { firm: "Morgan Stanley", rating: "Overweight", target: 195, date: "Dec 8, 2024" },
    { firm: "JP Morgan", rating: "Overweight", target: 190, date: "Dec 5, 2024" },
    { firm: "Bank of America", rating: "Buy", target: 205, date: "Dec 3, 2024" },
    { firm: "Wedbush", rating: "Outperform", target: 210, date: "Nov 28, 2024" },
    { firm: "UBS", rating: "Buy", target: 185, date: "Nov 25, 2024" }
  ];

  const recommendations = {
    strongBuy: 8,
    buy: 12,
    hold: 7,
    sell: 2,
    strongSell: 0
  };

  const total = Object.values(recommendations).reduce((a, b) => a + b, 0);

  const scenarioAnalysis = [
    {
      scenario: 'Bull Case',
      probability: 25,
      price: 220,
      factors: ['Strong iPhone sales', 'AI breakthrough', 'Services growth acceleration'],
      color: '#4caf50'
    },
    {
      scenario: 'Base Case',
      probability: 50,
      price: stockData.targetEstimate,
      factors: ['Steady growth', 'Market expansion', 'Innovation pipeline'],
      color: '#00d4ff'
    },
    {
      scenario: 'Bear Case',
      probability: 25,
      price: 160,
      factors: ['Economic slowdown', 'Increased competition', 'Regulatory pressure'],
      color: '#f44336'
    }
  ];

  const keyDrivers = [
    { driver: 'iPhone Revenue', impact: 'High', trend: 'up', description: 'New AI features driving upgrade cycle' },
    { driver: 'Services Growth', impact: 'High', trend: 'up', description: 'App Store and subscription revenue expansion' },
    { driver: 'China Market', impact: 'Medium', trend: 'neutral', description: 'Geopolitical tensions and local competition' },
    { driver: 'AI Integration', impact: 'High', trend: 'up', description: 'Apple Intelligence rollout across devices' },
    { driver: 'Interest Rates', impact: 'Medium', trend: 'down', description: 'Potential rate cuts supporting valuations' },
    { driver: 'Supply Chain', impact: 'Low', trend: 'neutral', description: 'Stable manufacturing partnerships' }
  ];

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'buy':
      case 'outperform':
        return '#4caf50';
      case 'overweight':
        return '#00d4ff';
      case 'hold':
        return '#ff9800';
      case 'sell':
        return '#f44336';
      default:
        return '#b0b0b0';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'buy':
      case 'outperform':
      case 'overweight':
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'hold':
        return <TrendingFlat sx={{ fontSize: 16 }} />;
      case 'sell':
        return <TrendingDown sx={{ fontSize: 16 }} />;
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'down': return <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />;
      default: return <TrendingFlat sx={{ fontSize: 16, color: '#ff9800' }} />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const upside = ((stockData.targetEstimate - stockData.price) / stockData.price * 100);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Scenario Analysis */}
      <Card sx={{ backgroundColor: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
        <CardHeader>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Scenario Analysis
          </Typography>
        </CardHeader>
        <CardContent>
        <Grid container spacing={3}>
          {scenarioAnalysis.map((scenario, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box sx={{
                  p: 2,
                  border: `2px solid ${scenario.color}`,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ color: scenario.color, fontWeight: 600 }}>
                      {scenario.scenario}
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700 }}>
                      ${scenario.price}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        Probability
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        {scenario.probability}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={scenario.probability}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: scenario.color
                        }
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                      Key Factors:
                    </Typography>
                    {scenario.factors.map((factor, factorIndex) => (
                      <Typography key={factorIndex} variant="body2" sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                        • {factor}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

        <Grid container spacing={3}>
          {/* Analyst Recommendations */}
          <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ backgroundColor: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardHeader>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Analyst Recommendations
              </Typography>
            </CardHeader>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {analystRecommendations.map((rec, index) => (
                  <Box key={index} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid #333333',
                    borderRadius: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        {rec.firm}
                      </Typography>
                      <Chip
                        icon={getRatingIcon(rec.rating)}
                        label={rec.rating}
                        sx={{
                          backgroundColor: getRatingColor(rec.rating),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          '& .MuiChip-icon': {
                            color: 'white'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                        ${rec.target}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
                        {rec.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

          {/* Price Target Summary */}
          <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ backgroundColor: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', mb: 3 }}>
            <CardHeader>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Price Target Summary
              </Typography>
            </CardHeader>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>
                ${stockData.targetEstimate.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2 }}>
                Average Price Target
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: upside >= 0 ? '#4caf50' : '#f44336',
                  fontWeight: 600,
                  mb: 3
                }}
              >
                {upside >= 0 ? '+' : ''}{upside.toFixed(1)}% upside
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>High</Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>$210.00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Low</Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>$185.00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Current Price</Typography>
                  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    ${stockData.price.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Recommendation Breakdown */}
          <Card sx={{ backgroundColor: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardHeader>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Recommendation Breakdown
              </Typography>
            </CardHeader>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(recommendations).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#b0b0b0', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {value} ({(value/total*100).toFixed(0)}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Key Drivers */}
      <Card sx={{ backgroundColor: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
        <CardHeader>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Key Drivers & Risk Factors
          </Typography>
        </CardHeader>
        <CardContent>
        <Grid container spacing={2}>
          {keyDrivers.map((driver, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Box sx={{
                  p: 2,
                  border: '1px solid #333333',
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getTrendIcon(driver.trend)}
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {driver.driver}
                    </Typography>
                    <Chip
                      label={driver.impact}
                      size="small"
                      sx={{
                        backgroundColor: getImpactColor(driver.impact),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 20
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                    {driver.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
