import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Avatar,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
} from '@mui/material';
import { ArrowBack, TrendingUp, TrendingDown, TrendingFlat, Assessment, ShowChart, Timeline } from '@mui/icons-material';
import { APIService, SensitivityAnalysis as SensitivityAnalysisType } from '../services/api';

const SensitivityAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [sensitivityData, setSensitivityData] = useState<SensitivityAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState(11);

  const loadSensitivityAnalysis = useCallback(async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getSensitivityAnalysis(companyTicker, steps);
      setSensitivityData(data);
    } catch (err) {
      setError('Failed to load sensitivity analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [steps]);

  useEffect(() => {
    if (ticker) {
      loadSensitivityAnalysis(ticker);
    }
  }, [ticker, loadSensitivityAnalysis]);

  const handleStepsChange = (event: Event, newValue: number | number[]) => {
    setSteps(newValue as number);
  };

  const formatCurrency = (value: any) => {
    if (typeof value === 'number') {
      if (value > 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
      if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value > 1000) return `$${(value / 1000).toFixed(2)}K`;
      return `$${value.toFixed(2)}`;
    }
    return value;
  };

  const formatPercentage = (value: any) => {
    if (typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value;
  };

  const getSensitivityColor = (value: number, baseValue: number) => {
    const change = Math.abs((value - baseValue) / baseValue);
    if (change < 0.1) return 'success';
    if (change < 0.25) return 'warning';
    return 'error';
  };

  const getSensitivityIcon = (value: number, baseValue: number) => {
    const change = (value - baseValue) / baseValue;
    if (change > 0.05) return <TrendingUp />;
    if (change < -0.05) return <TrendingDown />;
    return <TrendingFlat />;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={80} sx={{ mb: 3, color: '#00d4ff' }} />
            <Typography variant="h5" sx={{ color: '#b0b0b0' }}>
              Running Sensitivity Analysis...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !sensitivityData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
          {error || 'Sensitivity analysis not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Back Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/company/${ticker}`)}
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          ← Back to Company Overview
        </Button>

        {/* Company Header Card */}
        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid #333333',
          borderRadius: 2,
          mb: 4,
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mr: 3,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)',
                }}
              >
                {ticker?.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    letterSpacing: '-0.025em',
                  }}
                >
                  Sensitivity Analysis
                </Typography>
                <Typography variant="h5" sx={{ color: '#b0b0b0', mb: 2 }}>
                  {ticker} - Risk & Sensitivity Assessment
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    icon={<Timeline />}
                    label="Risk Analysis"
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                      color: 'white',
                      fontWeight: 500,
                      '& .MuiChip-icon': {
                        color: '#ffffff',
                        fontSize: '1rem',
                      }
                    }}
                  />
                  <Chip
                    label="Scenario Testing"
                    variant="outlined"
                    sx={{
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Analysis Parameters */}
      <Card sx={{ mb: 4, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}>
            Analysis Parameters
          </Typography>

          <Box sx={{ maxWidth: 400 }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 2, color: '#b0b0b0' }}>
              Number of sensitivity steps: {steps}
            </Typography>
            <Slider
              value={steps}
              onChange={handleStepsChange}
              min={3}
              max={21}
              step={2}
              marks={[
                { value: 3, label: '3' },
                { value: 11, label: '11' },
                { value: 21, label: '21' },
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: '#00d4ff',
                },
                '& .MuiSlider-track': {
                  backgroundColor: '#00d4ff',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: '#444444',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: '#00d4ff',
                },
                '& .MuiSlider-markLabel': {
                  color: '#b0b0b0',
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: '#00d4ff',
                  color: '#ffffff',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#666666' }}>
              More steps provide higher resolution but take longer to compute
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Sensitivity Results Summary */}
      <Card sx={{ mb: 4, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}>
            Sensitivity Results Summary
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(25, 25, 25, 0.6)', border: '1px solid #444444' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b0b0b0' }}>
                Variable Tested
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                {sensitivityData.variable}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(25, 25, 25, 0.6)', border: '1px solid #444444' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b0b0b0' }}>
                Base Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                {formatPercentage(sensitivityData.base_value)}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(25, 25, 25, 0.6)', border: '1px solid #444444' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b0b0b0' }}>
                Analysis Steps
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                {sensitivityData.steps.length}
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Detailed Sensitivity Table */}
      <Card sx={{ mb: 4, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{
            fontWeight: 600,
            background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}>
            Detailed Sensitivity Analysis
          </Typography>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', background: 'rgba(25, 25, 25, 0.6)', border: '1px solid #444444' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#b0b0b0', backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                    Step
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#b0b0b0', backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                    Parameter Value
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#b0b0b0', backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                    Enterprise Value
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#b0b0b0', backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                    Change from Base
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#b0b0b0', backgroundColor: 'rgba(40, 40, 40, 0.8)' }}>
                    Sensitivity
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensitivityData.steps.map((step, index) => (
                  <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'rgba(0, 212, 255, 0.05)' } }}>
                    <TableCell sx={{ fontWeight: 500, color: '#ffffff' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {formatPercentage(step.parameter_value)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {formatCurrency(step.enterprise_value)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {formatPercentage(step.change_from_base)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getSensitivityIcon(step.enterprise_value, sensitivityData.base_value)}
                        label={getSensitivityColor(step.enterprise_value, sensitivityData.base_value) === 'success' ? 'Low' : getSensitivityColor(step.enterprise_value, sensitivityData.base_value) === 'warning' ? 'Medium' : 'High'}
                        size="small"
                        color={getSensitivityColor(step.enterprise_value, sensitivityData.base_value) as any}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => navigate(`/company/${ticker}/ratios`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            minWidth: 180,
            border: '2px solid',
            borderColor: '#00d4ff',
            color: '#00d4ff',
            '&:hover': {
              background: 'rgba(0, 212, 255, 0.1)',
              borderColor: '#4ddfff',
              transform: 'translateY(-1px)',
            }
          }}
        >
          Financial Ratios
        </Button>
        <Button
          variant="contained"
          startIcon={<ShowChart />}
          onClick={() => navigate(`/company/${ticker}/dcf`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            borderRadius: 2,
            minWidth: 180,
            '&:hover': {
              background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          DCF Analysis
        </Button>
      </Box>
    </Container>
  );
};

export default SensitivityAnalysis;
