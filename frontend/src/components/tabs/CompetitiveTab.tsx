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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Business,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  Star,
  StarBorder
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { APIService, CompetitiveAnalysis, CompetitorData } from '../../services/api';

interface StockData {
  price: number;
  symbol: string;
}

interface CompetitiveTabProps {
  stockData: StockData;
}

export function CompetitiveTab({ stockData }: CompetitiveTabProps) {
  const [competitiveData, setCompetitiveData] = useState<CompetitiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompetitiveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await APIService.getCompetitiveAnalysis(stockData.symbol, 5);
      setCompetitiveData(data);
    } catch (err) {
      console.error('Error loading competitive data:', err);
      setError('Failed to load competitive analysis data');
    } finally {
      setLoading(false);
    }
  }, [stockData.symbol]);

  useEffect(() => {
    loadCompetitiveData();
  }, [loadCompetitiveData]);

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
            Loading Competitive Analysis...
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Analyzing competitors and market position
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

  if (!competitiveData) {
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
            Competitive analysis data not found
          </Typography>
        </Box>
      </Box>
    );
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Market Leader': return '#4caf50';
      case 'Strong Competitor': return '#00d4ff';
      case 'Average Position': return '#ff9800';
      case 'Below Average': return '#ff5722';
      case 'Weak Position': return '#f44336';
      default: return '#b0b0b0';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low Risk': return '#4caf50';
      case 'Moderate Risk': return '#ff9800';
      case 'High Risk': return '#ff5722';
      case 'Very High Risk': return '#f44336';
      default: return '#b0b0b0';
    }
  };

  // Prepare data for charts
  const competitorChartData = competitiveData.competitors.map(comp => ({
    name: comp.ticker,
    marketCap: comp.market_cap / 1e9, // Convert to billions
    peRatio: comp.pe_ratio || 0,
    profitMargin: (comp.profit_margin || 0) * 100,
    roe: (comp.roe || 0) * 100,
    revenueGrowth: (comp.revenue_growth || 0) * 100
  }));

  const radarData = [
    {
      metric: 'Market Cap',
      target: competitiveData.comparison_metrics.market_cap_percentile || 50,
      average: 50
    },
    {
      metric: 'P/E Ratio',
      target: competitiveData.comparison_metrics.pe_ratio_percentile || 50,
      average: 50
    },
    {
      metric: 'Profit Margin',
      target: competitiveData.comparison_metrics.profit_margin_percentile || 50,
      average: 50
    },
    {
      metric: 'ROE',
      target: competitiveData.comparison_metrics.roe_percentile || 50,
      average: 50
    },
    {
      metric: 'Growth',
      target: competitiveData.comparison_metrics.revenue_growth_percentile || 50,
      average: 50
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Business sx={{ fontSize: 32, color: '#00d4ff', mr: 2 }} />
          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Competitive Analysis - {stockData.symbol}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3 }}>
          Comprehensive analysis of {competitiveData.target_company.name} compared to industry competitors
        </Typography>

        {/* Competitive Position Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip
            label={competitiveData.insights.competitive_position}
            sx={{
              backgroundColor: getPositionColor(competitiveData.insights.competitive_position),
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              px: 2,
              py: 1
            }}
          />
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Competitive Position Score: {competitiveData.comparison_metrics.competitive_position_score.toFixed(1)}/100
          </Typography>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Competitive Position Overview */}
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
                    Competitive Position
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
                  Overall Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={competitiveData.comparison_metrics.competitive_position_score}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#333333',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPositionColor(competitiveData.insights.competitive_position),
                      borderRadius: 6,
                    },
                  }}
                />
                <Typography variant="h6" sx={{ color: '#ffffff', mt: 1, textAlign: 'center' }}>
                  {competitiveData.comparison_metrics.competitive_position_score.toFixed(1)}/100
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              {/* Key Metrics */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Market Cap Rank
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  #{competitiveData.comparison_metrics.market_cap_rank || 'N/A'} of {competitiveData.competitors.length + 1}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Profit Margin Percentile
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {competitiveData.comparison_metrics.profit_margin_percentile?.toFixed(1) || 'N/A'}th percentile
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Revenue Growth Rank
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  #{competitiveData.comparison_metrics.revenue_growth_rank || 'N/A'} of {competitiveData.competitors.length + 1}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Competitor Comparison Chart */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3,
            height: '100%'
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Market Cap Comparison
                </Typography>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ height: 300, p: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitorChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#b0b0b0"
                      fontSize={12}
                      tick={{ fill: '#b0b0b0' }}
                      axisLine={{ stroke: '#333333' }}
                    />
                    <YAxis
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
                      formatter={(value: any) => [`$${value.toFixed(2)}B`, 'Market Cap']}
                    />
                    <Bar dataKey="marketCap" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Competitors Table */}
      <Box sx={{ mt: 3 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Competitor Comparison
                </Typography>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Company</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Market Cap</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>P/E Ratio</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Profit Margin</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>ROE</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Revenue Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {competitiveData.competitors.map((competitor, index) => (
                      <TableRow key={competitor.ticker} sx={{ '&:hover': { backgroundColor: 'rgba(0, 212, 255, 0.05)' } }}>
                        <TableCell sx={{ color: '#ffffff' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {competitor.ticker}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#b0b0b0', ml: 1 }}>
                              {competitor.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {formatMarketCap(competitor.market_cap)}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {competitor.pe_ratio ? competitor.pe_ratio.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {competitor.profit_margin ? formatPercentage(competitor.profit_margin) : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {competitor.roe ? formatPercentage(competitor.roe) : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {competitor.revenue_growth ? formatPercentage(competitor.revenue_growth) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* SWOT Analysis */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 3 }}>
          <Box sx={{ flex: 1 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3,
            height: '100%'
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Strengths & Opportunities
                </Typography>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 2 }}>
                  Strengths
                </Typography>
                <List dense>
                  {competitiveData.insights.strengths.map((strength, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={strength}
                        primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              <Box>
                <Typography variant="subtitle1" sx={{ color: '#00d4ff', fontWeight: 600, mb: 2 }}>
                  Opportunities
                </Typography>
                <List dense>
                  {competitiveData.insights.opportunities.map((opportunity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <TrendingUp sx={{ color: '#00d4ff', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={opportunity}
                        primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
          </Box>

          {/* Weaknesses & Threats */}
          <Box sx={{ flex: 1 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3,
            height: '100%'
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Weaknesses & Threats
                </Typography>
              }
              sx={{
                backgroundColor: 'rgba(0, 212, 255, 0.05)',
                borderBottom: '1px solid #333333'
              }}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: '#ff9800', fontWeight: 600, mb: 2 }}>
                  Weaknesses
                </Typography>
                <List dense>
                  {competitiveData.insights.weaknesses.map((weakness, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={weakness}
                        primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              <Box>
                <Typography variant="subtitle1" sx={{ color: '#f44336', fontWeight: 600, mb: 2 }}>
                  Threats
                </Typography>
                <List dense>
                  {competitiveData.insights.threats.map((threat, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Error sx={{ color: '#f44336', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={threat}
                        primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
          </Box>
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
                  <Star sx={{ mr: 1, color: '#00d4ff' }} />
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
                {competitiveData.insights.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <StarBorder sx={{ color: '#00d4ff', fontSize: 20 }} />
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
