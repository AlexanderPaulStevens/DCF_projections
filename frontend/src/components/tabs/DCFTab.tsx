import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, Calculate, GpsFixed, Warning } from '@mui/icons-material';
import { APIService, DCFAnalysis as DCFAnalysisType } from '../../services/api';

interface DCFTabProps {
  ticker: string;
}

export function DCFTab({ ticker }: DCFTabProps) {
  const [dcfData, setDcfData] = useState<DCFAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDCFAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getDCFAnalysis(ticker);
      setDcfData(data);
    } catch (err) {
      console.error('Error loading DCF analysis:', err);
      setError('Failed to load DCF analysis');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    loadDCFAnalysis();
  }, [loadDCFAnalysis]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2, color: '#00d4ff' }} />
          <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
            Loading DCF Analysis...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !dcfData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Warning sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
        <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
          {error || 'No DCF data available'}
        </Typography>
      </Box>
    );
  }

  // Mock data for visualization - in real app, this would come from the API
  const projectionData = [
    { year: '2024', revenue: 385000, ebitda: 123000, fcf: 95000 },
    { year: '2025', revenue: 420000, ebitda: 135000, fcf: 105000 },
    { year: '2026', revenue: 460000, ebitda: 148000, fcf: 115000 },
    { year: '2027', revenue: 500000, ebitda: 160000, fcf: 125000 },
    { year: '2028', revenue: 540000, ebitda: 172000, fcf: 135000 },
  ];

  const sensitivityData = [
    { growth: '5%', value: 180, color: '#ef4444' },
    { growth: '10%', value: 205, color: '#f97316' },
    { growth: '15%', value: 230, color: '#eab308' },
    { growth: '20%', value: 255, color: '#22c55e' },
    { growth: '25%', value: 280, color: '#10b981' },
  ];

  // Get the base scenario data
  const baseScenario = dcfData.scenarios?.[0] || {};
  const baseResults = dcfData.base_results || {};

  const keyMetrics = [
    { label: 'Current Price', value: `$${baseResults.current_price?.toFixed(2) || 'N/A'}`, icon: AttachMoney },
    { label: 'DCF Value', value: `$${baseScenario.per_share_value?.toFixed(2) || 'N/A'}`, icon: GpsFixed },
    { label: 'Enterprise Value', value: `$${baseScenario.enterprise_value?.toFixed(0) || 'N/A'}M`, icon: TrendingUp },
    { label: 'Equity Value', value: `$${baseScenario.equity_value?.toFixed(0) || 'N/A'}M`, icon: Calculate },
  ];

  const getRecommendation = () => {
    const currentPrice = baseResults.current_price || 0;
    const dcfValue = baseScenario.per_share_value || 0;
    const upside = currentPrice > 0 ? ((dcfValue - currentPrice) / currentPrice) * 100 : 0;

    if (upside > 20) return { text: 'Strong Buy', color: 'bg-green-100 text-green-800' };
    if (upside > 10) return { text: 'Buy', color: 'bg-blue-100 text-blue-800' };
    if (upside > -10) return { text: 'Hold', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Sell', color: 'bg-red-100 text-red-800' };
  };

  const recommendation = getRecommendation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Key Metrics */}
      <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
        <CardHeader>
          <Typography variant="h5" sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#ffffff',
            fontWeight: 600
          }}>
            <Calculate />
            DCF Analysis Summary - {ticker}
          </Typography>
        </CardHeader>
        <CardContent>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3
          }}>
            {keyMetrics.map((metric, index) => (
              <Box key={index} sx={{
                textAlign: 'center',
                p: 2,
                border: '1px solid #333333',
                borderRadius: 2,
                background: 'rgba(25, 25, 25, 0.6)'
              }}>
                <metric.icon sx={{ fontSize: 32, color: '#00d4ff', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  {metric.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Chip
              label={recommendation.text}
              sx={{
                fontSize: '1rem',
                px: 2,
                py: 1,
                backgroundColor: recommendation.color.includes('green') ? '#4caf50' :
                               recommendation.color.includes('blue') ? '#2196f3' :
                               recommendation.color.includes('yellow') ? '#ff9800' : '#f44336',
                color: 'white',
                fontWeight: 600
              }}
            />
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              Recommendation
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Financial Projections Chart */}
        <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
          <CardHeader>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              5-Year Financial Projections
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="year" stroke="#b0b0b0" />
                  <YAxis stroke="#b0b0b0" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`$${(value as number / 1000).toFixed(0)}B`, 'Revenue'];
                      if (name === 'ebitda') return [`$${(value as number / 1000).toFixed(0)}B`, 'EBITDA'];
                      if (name === 'fcf') return [`$${(value as number / 1000).toFixed(0)}B`, 'Free Cash Flow'];
                      return [value, name];
                    }}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #333333',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00d4ff"
                    strokeWidth={3}
                    dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ebitda"
                    stroke="#00ff88"
                    strokeWidth={3}
                    dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fcf"
                    stroke="#ff6b35"
                    strokeWidth={3}
                    dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Sensitivity Analysis */}
        <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
          <CardHeader>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
              Sensitivity Analysis
            </Typography>
          </CardHeader>
          <CardContent>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                  <XAxis dataKey="growth" stroke="#b0b0b0" />
                  <YAxis stroke="#b0b0b0" />
                  <Tooltip
                    formatter={(value) => [`$${value}`, 'DCF Value']}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#111111',
                      border: '1px solid #333333',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#00d4ff" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* DCF Assumptions */}
      <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
        <CardHeader>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            DCF Assumptions
          </Typography>
        </CardHeader>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #333333', borderRadius: 2, background: 'rgba(25, 25, 25, 0.6)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
                Growth Rate
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                {(baseScenario.growth_rate * 100)?.toFixed(1) || 'N/A'}% annually
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #333333', borderRadius: 2, background: 'rgba(25, 25, 25, 0.6)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
                Terminal Growth
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                {(baseResults.terminal_growth_rate * 100)?.toFixed(1) || 'N/A'}%
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #333333', borderRadius: 2, background: 'rgba(25, 25, 25, 0.6)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
                Projection Years
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                {baseResults.projection_years || 'N/A'} years
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Drivers */}
      <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
        <CardHeader>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
            Key Value Drivers
          </Typography>
        </CardHeader>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { driver: 'Revenue Growth', impact: 'High', trend: 'up', description: 'Expected to grow at 15% annually' },
              { driver: 'Margin Expansion', impact: 'High', trend: 'up', description: 'Operating leverage and efficiency gains' },
              { driver: 'Market Share', impact: 'Medium', trend: 'up', description: 'Competitive positioning in core markets' },
              { driver: 'Innovation Pipeline', impact: 'High', trend: 'up', description: 'New products and services driving growth' },
              { driver: 'Economic Conditions', impact: 'Medium', trend: 'neutral', description: 'Macroeconomic factors affecting demand' },
              { driver: 'Regulatory Environment', impact: 'Low', trend: 'neutral', description: 'Minimal regulatory headwinds expected' }
            ].map((driver, index) => (
              <Box key={index} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid #333333',
                borderRadius: 2,
                background: 'rgba(25, 25, 25, 0.6)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {driver.trend === 'up' ? (
                    <TrendingUp sx={{ color: '#4caf50', fontSize: 20 }} />
                  ) : driver.trend === 'down' ? (
                    <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />
                  ) : (
                    <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
                  )}
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {driver.driver}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {driver.description}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={driver.impact}
                  sx={{
                    backgroundColor: driver.impact === 'High' ? '#f44336' :
                                   driver.impact === 'Medium' ? '#ff9800' : '#4caf50',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
