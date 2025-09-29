import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  CircularProgress,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  Business,
  Assessment,
  Warning,
  Error,
  Info,
  Star,
  StarBorder
} from '@mui/icons-material';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { APIService, ComprehensiveAnalysis } from '../../services/api';

interface StockData {
  price: number;
  symbol: string;
}

interface CompetitiveTabProps {
  stockData: StockData;
}

export function CompetitiveTab({ stockData }: CompetitiveTabProps) {
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComprehensiveData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await APIService.getComprehensiveAnalysis(stockData.symbol);
      setComprehensiveData(data);
    } catch (err) {
      console.error('Error loading comprehensive data:', err);
      setError('Failed to load comprehensive analysis data');
    } finally {
      setLoading(false);
    }
  }, [stockData.symbol]);

  useEffect(() => {
    loadComprehensiveData();
  }, [loadComprehensiveData]);

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

  if (!comprehensiveData) {
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
          Comprehensive analysis of {comprehensiveData.company_name} competitive advantage and market position
        </Typography>

        {/* Competitive Position Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip
            label={comprehensiveData.competitive.moat_level}
            sx={{
              backgroundColor: getPositionColor(comprehensiveData.competitive.moat_level),
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              px: 2,
              py: 1
            }}
          />
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Moat Strength Score: {comprehensiveData.competitive.overall_moat_score.toFixed(1)}/100
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
                  Overall Moat Strength
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={comprehensiveData.competitive.overall_moat_score}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#333333',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getPositionColor(comprehensiveData.competitive.moat_level),
                      borderRadius: 6,
                    },
                  }}
                />
                <Typography variant="h6" sx={{ color: '#ffffff', mt: 1, textAlign: 'center' }}>
                  {comprehensiveData.competitive.overall_moat_score.toFixed(1)}/100
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              {/* Key Metrics */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Top Advantage
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {comprehensiveData.competitive.top_advantage}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Weakest Area
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {comprehensiveData.competitive.weakest_area}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Industry Attractiveness
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {comprehensiveData.summary.industry_attractiveness}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Competitive Advantage Radar Chart */}
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
                  Competitive Advantage Breakdown
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
                  <RadarChart data={[
                    {
                      advantage: 'Ecosystem',
                      score: comprehensiveData.competitive.ecosystem_score ?? 0,
                      fullMark: 100
                    },
                    {
                      advantage: 'Brand Power',
                      score: comprehensiveData.competitive.brand_score ?? 0,
                      fullMark: 100
                    },
                    {
                      advantage: 'Integration',
                      score: comprehensiveData.competitive.integration_score ?? 0,
                      fullMark: 100
                    },
                    {
                      advantage: 'Supply Chain',
                      score: comprehensiveData.competitive.supply_chain_score ?? 0,
                      fullMark: 100
                    },
                    {
                      advantage: 'Strategic',
                      score: comprehensiveData.competitive.strategic_score ?? 0,
                      fullMark: 100
                    }
                  ]}>
                    <PolarGrid stroke="#333333" />
                    <PolarAngleAxis dataKey="advantage" tick={{ fill: '#b0b0b0', fontSize: 12 }} />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: '#b0b0b0', fontSize: 10 }}
                      tickCount={6}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#00d4ff"
                      fill="#00d4ff"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Competitive Advantage Details */}
      <Box sx={{ mt: 3 }}>
          <Card sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 3
          }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Competitive Advantage Details
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
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Advantage</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Score</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Evidence</TableCell>
                      <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Sustainability</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(comprehensiveData.competitive_advantage.competitive_advantages).map(([key, advantage]) => (
                      <TableRow key={key} sx={{ '&:hover': { backgroundColor: 'rgba(0, 212, 255, 0.05)' } }}>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {advantage.category}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {advantage.strength_score.toFixed(1)}/100
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={advantage.strength_score}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#333333',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: advantage.strength_score >= 60 ? '#4caf50' : advantage.strength_score >= 40 ? '#ff9800' : '#f44336',
                                  borderRadius: 3,
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {advantage.description}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {advantage.evidence.slice(0, 2).join('; ')}
                            {advantage.evidence.length > 2 && '...'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          <Chip
                            label={advantage.sustainability}
                            size="small"
                            sx={{
                              backgroundColor: advantage.sustainability === 'High' ? '#4caf50' :
                                             advantage.sustainability === 'Medium' ? '#ff9800' : '#f44336',
                              color: '#ffffff',
                              fontSize: '0.75rem'
                            }}
                          />
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
                  Investment Thesis
                </Typography>
                <Typography variant="body2" sx={{ color: '#ffffff', mb: 2 }}>
                  {comprehensiveData.competitive_advantage.investment_thesis.thesis}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                  Recommendation: {comprehensiveData.competitive_advantage.investment_thesis.recommendation}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              <Box>
                <Typography variant="subtitle1" sx={{ color: '#00d4ff', fontWeight: 600, mb: 2 }}>
                  Growth Opportunities
                </Typography>
                <List dense>
                  {comprehensiveData.opportunities.growth_opportunities.map((opportunity, index) => (
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
                  Risk Factors
                </Typography>
                <List dense>
                  {comprehensiveData.competitive_advantage.investment_thesis.risk_factors.map((risk, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={risk}
                        primaryTypographyProps={{ color: '#ffffff', fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#333333' }} />

              <Box>
                <Typography variant="subtitle1" sx={{ color: '#f44336', fontWeight: 600, mb: 2 }}>
                  Porter's Five Forces
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Industry Attractiveness: {comprehensiveData.competitive_advantage.porters_five_forces.overall_industry_attractiveness}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Supplier Power: {comprehensiveData.competitive_advantage.porters_five_forces.supplier_power}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Buyer Power: {comprehensiveData.competitive_advantage.porters_five_forces.buyer_power}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Competitive Rivalry: {comprehensiveData.competitive_advantage.porters_five_forces.competitive_rivalry}
                  </Typography>
                </Box>
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
                {comprehensiveData.competitive_advantage.sector_insights.recommendations.map((recommendation, index) => (
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
