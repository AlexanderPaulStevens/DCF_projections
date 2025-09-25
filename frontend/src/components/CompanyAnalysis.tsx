import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Chip,
  Switch,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Search,
  Assessment,
  ShowChart,
  Business,
  Timeline,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis } from '../services/api';
import { StockChart } from './StockChart';
import { generateCompetitiveAdvantageContent } from '../utils/competitiveAnalysis';

// Floating animation keyframes
const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(45deg);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-20px) rotate(45deg);
    opacity: 0.4;
  }
`;

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showForecast, setShowForecast] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [lines, setLines] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);

  // Initialize moving lines
  useEffect(() => {
    const initialLines = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setLines(initialLines);

    const interval = setInterval(() => {
      setLines(prevLines =>
        prevLines.map(line => ({
          ...line,
          y: line.y + line.speed,
          x: line.x + Math.sin(Date.now() * 0.001 + line.id) * 0.5,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    if (!ticker) return;

    try {
      setLoading(true);
      console.log('🚀 Starting to fetch comprehensive analysis for:', ticker);
      const data = await APIService.getComprehensiveAnalysis(ticker);
      console.log('✅ Comprehensive analysis data received:', data);
      setComprehensiveData(data);
      setError(null);
    } catch (err) {
        console.error('❌ Error fetching comprehensive analysis:', err);

        // Check if we're on ngrok and provide helpful message
        const isNgrok = window.location.hostname.includes('ngrok');
        if (isNgrok) {
          setError('Company analysis features are not available when accessing through ngrok. To use all features including company analysis, DCF calculations, and financial data, please access the app locally at http://localhost:3000');
        } else {
          setError(`Failed to load company analysis: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    } finally {
      setLoading(false);
    }
  };

    fetchData();
  }, [ticker]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/company/${query.toUpperCase()}/analysis`);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Generate dynamic competitive advantage content
  const competitiveContent = generateCompetitiveAdvantageContent(ticker || '', comprehensiveData);

  // Theme configuration
  const theme = {
    background: darkMode
      ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    cardBackground: darkMode
      ? 'rgba(0, 0, 0, 0.8)'
      : 'rgba(255, 255, 255, 0.9)',
    contentBackground: darkMode
      ? 'rgba(0, 212, 255, 0.05)'
      : 'rgba(49, 130, 206, 0.05)',
    textPrimary: darkMode ? '#ffffff' : '#1a202c',
    textSecondary: darkMode ? '#b0b0b0' : '#4a5568',
    accent: darkMode ? '#00d4ff' : '#3182ce',
    border: darkMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(49, 130, 206, 0.2)',
    cardShadow: darkMode
      ? '0 8px 32px rgba(0, 212, 255, 0.2)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
    contentShadow: darkMode
      ? '0 4px 20px rgba(0, 212, 255, 0.1)'
      : '0 4px 20px rgba(49, 130, 206, 0.1)',
    topBar: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    logoPath: darkMode ? '/logo_horizon.png' : '/logo_horizon_light.png',
  };

  // Helper function for content box styling
  const getContentBoxStyle = () => ({
    p: 4,
    background: theme.contentBackground,
    borderRadius: 3,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.contentShadow,
    mb: 4,
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.background,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Lines */}
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: 'absolute',
            width: '2px',
            height: '100px',
            background: 'linear-gradient(45deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.3))',
            left: `${line.x}px`,
            top: `${line.y}px`,
              opacity: line.opacity,
            animation: `${float} 3s ease-in-out infinite`,
            animationDelay: `${line.id * 0.1}s`,
            zIndex: 0,
            }}
          />
        ))}

      {/* Top Bar */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: theme.topBar,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.border}`,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
      }}>
        {/* Logo in top bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img
            src={theme.logoPath}
            alt="Horizon Logo"
            style={{
              height: '40px',
              width: 'auto',
            }}
          />
        </Box>

        {/* Theme Toggle Button */}
        <Button
          onClick={() => setDarkMode(!darkMode)}
          sx={{
            minWidth: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: darkMode ? 'rgba(0, 212, 255, 0.1)' : 'rgba(49, 130, 206, 0.1)',
            border: `1px solid ${theme.border}`,
            color: theme.accent,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(49, 130, 206, 0.2)',
              transform: 'scale(1.05)',
              boxShadow: `0 0 20px ${theme.accent}40`,
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {darkMode ? <LightMode /> : <DarkMode />}
        </Button>
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 10 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 3,
          mb: 4
        }}>
          {/* Company Name */}
          <Box sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease-in-out',
              }
            }}
            onClick={() => navigate('/')}
          >
            <img
              src="/logo_horizon.png"
              alt="Horizon"
              style={{
                height: '40px',
                marginRight: '12px',
                filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))',
              }}
            />
            <Typography
              variant="h5"
                sx={{
                color: theme.accent,
                fontWeight: 700,
                textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              }}
            >
              Horizon
            </Typography>
          </Box>


          {/* Search Bar */}
          <Box sx={{ maxWidth: 400, width: '100%' }}>
            <TextField
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  handleSearch(searchQuery);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.accent }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  height: 48,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.border}`,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    border: `1px solid ${theme.accent}80`,
                    boxShadow: `0 0 20px ${theme.accent}50`,
                  },
                  '&.Mui-focused': {
                    border: `1px solid ${theme.accent}`,
                    boxShadow: `0 0 30px ${theme.accent}80`,
                  },
                },
                '& .MuiInputBase-input': {
                  color: theme.textPrimary,
                  fontSize: '1rem',
                  '&::placeholder': {
                    color: theme.textSecondary,
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 800,
              background: darkMode
                ? 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)'
                : 'linear-gradient(135deg, #3182ce 0%, #2c5aa0 50%, #1a202c 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              textShadow: darkMode ? '0 0 30px rgba(0, 212, 255, 0.3)' : '0 0 30px rgba(49, 130, 206, 0.3)',
            }}
          >
            {comprehensiveData?.company_name || 'Company Name'}
          </Typography>
        </Box>

        {/* Main Content Layout */}
      <Box sx={{ mb: 6 }}>
        {/* Tabbed Interface */}
        <Paper sx={{
          background: theme.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.border}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.cardShadow,
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: `1px solid ${theme.border}`,
              '& .MuiTab-root': {
                color: theme.textSecondary,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                minHeight: 60,
                '&.Mui-selected': {
                  color: theme.accent,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.accent,
                height: 3,
              },
            }}
          >
            <Tab
              icon={<ShowChart />}
              label="Chart"
              iconPosition="start"
            />
            <Tab
              icon={<Assessment />}
              label="Analysis"
              iconPosition="start"
            />
            <Tab
              icon={<Business />}
              label="Competitive"
              iconPosition="start"
            />
            <Tab
              icon={<Timeline />}
              label="Financials"
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 0 }}>
            {/* Chart Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 4 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.accent,
                      mb: 3,
                      fontWeight: 700,
                      textShadow: `0 0 20px ${theme.accent}50`,
                    }}
                  >
                    {ticker} Stock Price & Forecast
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.textSecondary }}>Show Forecast</Typography>
                  <Switch
                      checked={showForecast}
                      onChange={(e) => setShowForecast(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                      color: theme.accent,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: theme.accent,
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: `${theme.accent}50`,
                      },
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ height: '500px', width: '100%' }}>
                  <StockChart
                    stockData={{
                      symbol: ticker || '',
                      price: comprehensiveData?.current_price || 0,
                      change: comprehensiveData?.price_change || 0,
                      changePercent: comprehensiveData?.price_change_percent || 0,
                    }}
                    showForecast={showForecast}
                    onForecastToggle={setShowForecast}
                  />
                  </Box>
              </Box>
            )}

            {/* Analysis Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 4 }}>
                {/* Analysis Summary */}
                <Box sx={getContentBoxStyle()}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.accent,
                      mb: 3,
                      fontWeight: 700,
                      textShadow: `0 0 20px ${theme.accent}50`,
                    }}
                  >
                    Analysis Summary
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                        DCF Value
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        ${comprehensiveData?.summary?.dcf_value?.toFixed(2) || 'N/A'}
                </Typography>
              </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                        Current Price
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        ${comprehensiveData?.current_price?.toFixed(2) || 'N/A'}
                    </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                        Upside/Downside
                        </Typography>
                <Typography
                  variant="h6"
                  sx={{
                          color: comprehensiveData?.summary?.dcf_value && comprehensiveData?.current_price
                            ? (comprehensiveData.summary.dcf_value > comprehensiveData.current_price ? '#4caf50' : '#f44336')
                            : '#b0b0b0',
                          fontWeight: 600
                        }}
                      >
                        {comprehensiveData?.summary?.dcf_value && comprehensiveData?.current_price
                          ? `${((comprehensiveData.summary.dcf_value - comprehensiveData.current_price) / comprehensiveData.current_price * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                        Moat Strength
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        {comprehensiveData?.summary?.moat_strength_score?.toFixed(1) || 'N/A'}/100
                      </Typography>
                    </Box>
          </Box>
      </Box>

                {/* Investment Recommendation */}
          <Box sx={getContentBoxStyle()}>
            <Typography
              variant="h5"
              sx={{
                color: theme.accent,
                      mb: 3,
                fontWeight: 700,
                textShadow: `0 0 20px ${theme.accent}50`,
              }}
            >
              Investment Recommendation
            </Typography>
                  {comprehensiveData?.summary?.investment_recommendation ? (
                    <Box>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, mb: 2, fontWeight: 600 }}>
                        {comprehensiveData.summary.investment_recommendation}
                </Typography>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                        Based on DCF analysis showing {comprehensiveData.summary.dcf_value && comprehensiveData.current_price
                          ? (comprehensiveData.summary.dcf_value > comprehensiveData.current_price ? 'upside potential' : 'downside risk')
                          : 'mixed signals'
                        } and competitive moat analysis.
                </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ color: theme.textSecondary }}>
                      Loading recommendation...
                </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Competitive Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 4 }}>
                {/* Competitive Advantage Card */}
              <Box sx={getContentBoxStyle()}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.accent,
                      mb: 3,
                      fontWeight: 700,
                      textShadow: `0 0 20px ${theme.accent}50`,
                    }}
                  >
                    Competitive Advantage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                      {comprehensiveData?.competitive?.moat_level || 'N/A'}
                  </Typography>
                    <Chip
                      label={`${comprehensiveData?.competitive?.overall_moat_score?.toFixed(1) || 'N/A'}/100`}
                      sx={{
                        backgroundColor: `${theme.accent}20`,
                        color: theme.accent,
                        border: `1px solid ${theme.accent}80`,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 3, lineHeight: 1.6 }}>
                    Top Advantage: <strong style={{ color: theme.accent }}>{comprehensiveData?.competitive?.top_advantage || 'N/A'}</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                    Weakest Area: <strong style={{ color: '#ff9800' }}>{comprehensiveData?.competitive?.weakest_area || 'N/A'}</strong>
                </Typography>
            </Box>

                {/* Detailed Competitive Analysis */}
            <Box sx={{
              ...getContentBoxStyle(),
              mb: 0,
            }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.accent,
                    mb: 3,
                    fontWeight: 700,
                    textShadow: `0 0 20px ${theme.accent}50`,
                  }}
                >
                  {competitiveContent.title}
                </Typography>
                  <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 3, lineHeight: 1.6 }}>
                    {competitiveContent.introduction}
                  </Typography>

                  {competitiveContent.advantages.map((advantage, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ color: theme.accent, mb: 2, fontWeight: 600 }}>
                        {advantage.title}
                      </Typography>
                      {advantage.points.map((point, pointIndex) => (
                        <Typography key={pointIndex} variant="body2" sx={{ color: theme.textSecondary, mb: 2, lineHeight: 1.6 }}>
                          • {point}
                        </Typography>
                      ))}
                    </Box>
                  ))}

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: theme.accent, mb: 2, fontWeight: 600 }}>
                      {competitiveContent.competitorAnalysis.title}
                    </Typography>
                    {competitiveContent.competitorAnalysis.points.map((point, index) => (
                      <Typography key={index} variant="body2" sx={{ color: theme.textSecondary, mb: 2, lineHeight: 1.6 }}>
                        • {point}
                      </Typography>
                    ))}
                  </Box>

                  <Box sx={{
                    p: 3,
                    background: darkMode ? 'rgba(0, 212, 255, 0.1)' : 'rgba(49, 130, 206, 0.1)',
                    borderRadius: 2,
                    border: `1px solid ${theme.accent}50`,
                    mt: 3
                  }}>
                    <Typography variant="h6" sx={{ color: theme.accent, mb: 2, fontWeight: 600 }}>
                      📌 In Summary
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.textPrimary, lineHeight: 1.6 }}>
                      {competitiveContent.summary}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Financials Tab */}
            {activeTab === 3 && (
              <Box sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ color: theme.accent, mb: 3, fontWeight: 700 }}>
                  Financial Data
                </Typography>
                <Typography variant="body1" sx={{ color: theme.textSecondary }}>
                  Financial data and metrics will be displayed here. This tab can be expanded to show detailed financial statements, ratios, and historical performance data.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      </Container>
    </Box>
  );
};

export default CompanyAnalysis;
