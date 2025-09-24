import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Business,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  Security,
  Speed,
  Psychology,
  Lightbulb,
  ExpandMore
} from '@mui/icons-material';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { APIService, BusinessStrategyAnalysis, StrategyInsight, SurvivalMetrics } from '../../services/api';

interface StockData {
  price: number;
  symbol: string;
}

interface BusinessStrategyTabProps {
  stockData: StockData;
}

export function BusinessStrategyTab({ stockData }: BusinessStrategyTabProps) {
  const [strategyData, setStrategyData] = useState<BusinessStrategyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStrategyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await APIService.getBusinessStrategyAnalysis(stockData.symbol);
      setStrategyData(data);
    } catch (err) {
      console.error('Error loading strategy data:', err);
      setError('Failed to load business strategy analysis data');
    } finally {
      setLoading(false);
    }
  }, [stockData.symbol]);

  useEffect(() => {
    loadStrategyData();
  }, [loadStrategyData]);

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 500,
        backgroundColor: 'rgba(17, 17, 17, 0.8)',
        borderRadius: 2,
        border: '1px solid #333333'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={64} sx={{ mb: 3, color: '#00d4ff' }} />
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
            Loading Business Strategy Analysis...
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Analyzing business model and survival prospects
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 500,
        backgroundColor: 'rgba(17, 17, 17, 0.8)',
        borderRadius: 2,
        border: '1px solid #f44336'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Error sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#f44336', mb: 1 }}>
            Analysis Error
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!strategyData) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 500,
        backgroundColor: 'rgba(17, 17, 17, 0.8)',
        borderRadius: 2,
        border: '1px solid #333333'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Info sx={{ fontSize: 64, color: '#00d4ff', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
            No Data Available
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Business strategy analysis data not found
          </Typography>
        </Box>
      </Box>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low Risk': return '#4caf50';
      case 'Moderate Risk': return '#ff9800';
      case 'High Risk': return '#ff5722';
      case 'Very High Risk': return '#f44336';
      default: return '#b0b0b0';
    }
  };

  const getStrategyCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'innovation': return <Lightbulb sx={{ color: '#00d4ff' }} />;
      case 'market_expansion': return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'acquisition': return <Business sx={{ color: '#ff9800' }} />;
      case 'cost_optimization': return <Speed sx={{ color: '#9c27b0' }} />;
      case 'sustainability': return <Security sx={{ color: '#4caf50' }} />;
      case 'digital_transformation': return <Psychology sx={{ color: '#00d4ff' }} />;
      case 'customer_focus': return <CheckCircle sx={{ color: '#4caf50' }} />;
      default: return <Info sx={{ color: '#b0b0b0' }} />;
    }
  };

  const getStrategyCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'innovation': return '#00d4ff';
      case 'market_expansion': return '#4caf50';
      case 'acquisition': return '#ff9800';
      case 'cost_optimization': return '#9c27b0';
      case 'sustainability': return '#4caf50';
      case 'digital_transformation': return '#00d4ff';
      case 'customer_focus': return '#4caf50';
      default: return '#b0b0b0';
    }
  };

  // Prepare data for charts
  const businessModelData = [
    { name: 'Revenue Diversification', value: strategyData.business_model_analysis.revenue_diversification, fill: '#00d4ff' },
    { name: 'Profitability Trends', value: strategyData.business_model_analysis.profitability_trends, fill: '#4caf50' },
    { name: 'Market Position', value: strategyData.business_model_analysis.market_position, fill: '#ff9800' },
    { name: 'Innovation Level', value: strategyData.business_model_analysis.innovation_level, fill: '#9c27b0' }
  ];

  const survivalMetricsData = [
    { name: 'Current Ratio', value: strategyData.survival_metrics.current_ratio || 0, fill: '#00d4ff' },
    { name: 'Debt to Equity', value: strategyData.survival_metrics.debt_to_equity || 0, fill: '#ff5722' },
    { name: 'Interest Coverage', value: strategyData.survival_metrics.interest_coverage || 0, fill: '#4caf50' },
    { name: 'Cash Ratio', value: strategyData.survival_metrics.cash_ratio || 0, fill: '#ff9800' }
  ];

  // Group strategy insights by category
  const insightsByCategory = strategyData.strategy_insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, StrategyInsight[]>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ fontSize: 32, color: '#00d4ff', mr: 2 }} />
          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Business Strategy & Survival Analysis - {stockData.symbol}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3 }}>
          Comprehensive analysis of business strategy, model sustainability, and long-term survival prospects
        </Typography>

        {/* Survival Risk Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip
            label={strategyData.survival_metrics.risk_level}
            sx={{
              backgroundColor: getRiskLevelColor(strategyData.survival_metrics.risk_level),
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              px: 2,
              py: 1
            }}
          />
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Survival Probability: {strategyData.survival_metrics.survival_probability.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Business Model Analysis */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3,
            height: '100%'
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1, color: '#00d4ff' }} />
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Business Model Analysis
                  </Typography>
                </Box>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Overall Sustainability Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={strategyData.business_model_analysis.sustainability_score}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#333333',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#00d4ff',
                      borderRadius: 6,
                    },
                  }}
                />
                <Typography variant="h6" sx={{ color: '#ffffff', mt: 1, textAlign: 'center' }}>
                  {strategyData.business_model_analysis.sustainability_score.toFixed(1)}/100
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              {/* Business Model Metrics */}
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessModelData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#b0b0b0"
                      fontSize={12}
                      tick={{ fill: '#b0b0b0' }}
                      axisLine={{ stroke: '#333333' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#b0b0b0"
                      fontSize={12}
                      tick={{ fill: '#b0b0b0' }}
                      axisLine={{ stroke: '#333333' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #00d4ff',
                        borderRadius: '12px',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)'
                      }}
                      formatter={(value: any) => [`${value.toFixed(1)}/100`, 'Score']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Survival Metrics */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3,
            height: '100%'
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ mr: 1, color: '#00d4ff' }} />
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Survival Metrics
                  </Typography>
                </Box>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Survival Probability
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={strategyData.survival_metrics.survival_probability}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#333333',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getRiskLevelColor(strategyData.survival_metrics.risk_level),
                      borderRadius: 6,
                    },
                  }}
                />
                <Typography variant="h6" sx={{ color: '#ffffff', mt: 1, textAlign: 'center' }}>
                  {strategyData.survival_metrics.survival_probability.toFixed(1)}%
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              {/* Key Survival Metrics */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Altman Z-Score
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {strategyData.survival_metrics.altman_z_score?.toFixed(2) || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                  {strategyData.survival_metrics.altman_z_score ?
                    (strategyData.survival_metrics.altman_z_score > 2.99 ? 'Safe Zone' :
                     strategyData.survival_metrics.altman_z_score > 1.81 ? 'Grey Zone' : 'Distress Zone') :
                    'Not Available'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Current Ratio
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {strategyData.survival_metrics.current_ratio?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Debt-to-Equity Ratio
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {strategyData.survival_metrics.debt_to_equity?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Interest Coverage Ratio
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {strategyData.survival_metrics.interest_coverage?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Strategy Insights */}
      <Box sx={{ mt: 3 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Strategy Insights from SEC Filings
                </Typography>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              {Object.keys(insightsByCategory).length > 0 ? (
                <Box>
                  {Object.entries(insightsByCategory).map(([category, insights]) => (
                    <Accordion key={category} sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid #333333',
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}>
                      <AccordionSummary
                        expandIcon={<ExpandMore sx={{ color: '#00d4ff' }} />}
                        sx={{
                          backgroundColor: 'rgba(0, 212, 255, 0.05)',
                          '& .MuiAccordionSummary-content': {
                            alignItems: 'center'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getStrategyCategoryIcon(category)}
                        </Box>
                        <Typography sx={{
                          color: getStrategyCategoryColor(category),
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {category.replace('_', ' ')} ({insights.length} insights)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <List dense>
                          {insights.map((insight, index) => (
                            <ListItem key={index} sx={{ px: 0, py: 1 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Info sx={{ color: getStrategyCategoryColor(category), fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={insight.insight}
                                secondary={`Confidence: ${(insight.confidence * 100).toFixed(0)}% | Source: ${insight.source}`}
                                primaryTypographyProps={{
                                  color: '#ffffff',
                                  fontSize: '0.9rem',
                                  sx: { mb: 0.5 }
                                }}
                                secondaryTypographyProps={{
                                  color: '#b0b0b0',
                                  fontSize: '0.8rem'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Info sx={{ fontSize: 48, color: '#b0b0b0', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
                    No strategy insights available from SEC filings
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Strategic Recommendations */}
        <Box sx={{ mt: 3 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3
          }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Lightbulb sx={{ mr: 1, color: '#00d4ff' }} />
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Strategic Recommendations
                  </Typography>
                </Box>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              <List>
                {strategyData.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle sx={{ color: '#00d4ff', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation}
                      primaryTypographyProps={{ color: '#ffffff', fontSize: '1rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
    </Box>
  );
}
