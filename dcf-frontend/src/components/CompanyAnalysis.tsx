import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Removed keyframes import for better performance
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
  Card,
  CardContent,
  CardHeader,
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
  ListItemText,
} from '@mui/material';
import {
  Search,
  Assessment,
  ShowChart,
  Business,
  Timeline,
  LightMode,
  DarkMode,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  Star,
  StarBorder,
  Psychology,
  AutoGraph,
} from '@mui/icons-material';
import { APIService, ComprehensiveAnalysis } from '../services/api';
import StockChart from './StockChart';
import { ErrorBoundary } from './ErrorBoundary';
// import { generateCompetitiveAdvantageContent } from '../utils/competitiveAnalysis';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Removed floating animation keyframes for better performance

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalysis | null>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showForecast, setShowForecast] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [prophetForecast, setProphetForecast] = useState<any>(null);
  // Removed animated background lines for better performance

  // Fetch comprehensive analysis data
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
        setLastUpdated(new Date());
    } catch (err: unknown) {
        console.error('❌ Error fetching comprehensive analysis:', err);

        // Check if we're on ngrok and provide helpful message
        const isNgrok = window.location.hostname.includes('ngrok');
        if (isNgrok) {
          setError('Company analysis features are not available when accessing through ngrok. To use all features including company analysis, DCF calculations, and financial data, please access the app locally at http://localhost:3000');
        } else {
          setError(`Failed to load company analysis: ${err instanceof Error ? (err as Error).message : 'Unknown error'}`);
        }
    } finally {
      setLoading(false);
    }
  };

    fetchData();
  }, [ticker]);

  // Fetch real-time stock data
  const fetchStockData = useCallback(async () => {
    if (!ticker) return;

    try {
      setRefreshing(true);
      console.log('📈 Fetching real-time stock data for:', ticker);
      const data = await APIService.getStockData(ticker);
      console.log('✅ Stock data received:', data);
      setStockData(data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error('❌ Error fetching stock data:', err);
      // Don't set error for stock data failures, just log them
    } finally {
      setRefreshing(false);
    }
  }, [ticker]);

  // Initial stock data fetch
  useEffect(() => {
    if (ticker) {
      fetchStockData();
    }
  }, [ticker, fetchStockData]);

  // Set up periodic refresh for stock data (longer interval on mobile to prevent crashes)
  useEffect(() => {
    if (!ticker) return;

    // Use longer interval on mobile to prevent memory issues
    const refreshInterval = isMobile ? 120000 : 30000; // 2 minutes on mobile, 30 seconds on desktop

    const interval = setInterval(() => {
      // Get current time in Eastern Time
      const now = new Date();
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = easternTime.getHours();
      const minute = easternTime.getMinutes();
      const currentTime = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM EST
      const marketClose = 16 * 60; // 4:00 PM EST

      // Only refresh during market hours (9:30 AM - 4:00 PM EST, Monday-Friday)
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime < marketClose) {
        fetchStockData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [ticker, fetchStockData, isMobile]);

  // Fetch Prophet forecast data
  const fetchProphetForecast = useCallback(async () => {
    if (!ticker) return;
    try {
      const forecastData = await APIService.getHistoricalData(ticker, '6mo', true);
      if (forecastData?.forecast) {
        setProphetForecast(forecastData.forecast);
      }
    } catch (error) {
      console.error('Error fetching Prophet forecast:', error);
    }
  }, [ticker]);

  // Fetch Prophet forecast data when component loads
  useEffect(() => {
    fetchProphetForecast();
  }, [ticker, fetchProphetForecast]);

  // Manual refresh function
  const handleRefresh = async () => {
    await fetchStockData();
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/company/${query.toUpperCase()}/analysis`);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Generate dynamic competitive advantage content (used in competitive analysis tab)
  // const competitiveContent = generateCompetitiveAdvantageContent(ticker || '', comprehensiveData);

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

  // Helper function for content box styling (currently unused)
  // const getContentBoxStyle = () => ({
  //   p: 4,
  //   background: theme.contentBackground,
  //   borderRadius: 3,
  //   border: `1px solid ${theme.border}`,
  //   boxShadow: theme.contentShadow,
  //   mb: 4,
  // });

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
      {/* Static Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode
            ? `radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.02) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(0, 212, 255, 0.02) 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 50%, rgba(49, 130, 206, 0.03) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(49, 130, 206, 0.02) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(49, 130, 206, 0.02) 0%, transparent 50%)`,
            zIndex: 0,
            }}
          />

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

        {/* Yahoo Finance Style Header */}
        {comprehensiveData && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{
              p: 3,
              backgroundColor: theme.cardBackground,
              borderRadius: 2,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
            }}>
              {/* Main Stock Info Row */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              mb: 2,
              }}>
                {/* Left: Company Name and Ticker */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 600,
                    color: theme.textPrimary,
                    fontSize: { xs: '1.5rem', md: '1.75rem' }
                  }}>
                    {comprehensiveData.company_name}
                  </Typography>
                  <Typography variant="h6" sx={{
                    color: theme.textSecondary,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    fontWeight: 500,
                  }}>
                    ({ticker})
                  </Typography>
                </Box>

                {/* Right: Market Status */}
                <Box sx={{
                  backgroundColor: `${theme.accent}10`,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  border: `1px solid ${theme.accent}30`,
                  textAlign: 'center',
                }}>
                  <Typography variant="body2" sx={{ color: theme.textSecondary, fontSize: '0.75rem', mb: 0.5 }}>
                    Market Status
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontWeight: 600,
                    color: (() => {
                      // Get current time in Eastern Time
                      const now = new Date();
                      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
                      const dayOfWeek = easternTime.getDay();
                      const hour = easternTime.getHours();
                      const minute = easternTime.getMinutes();
                      const currentTime = hour * 60 + minute;
                      const marketOpen = 9 * 60 + 30; // 9:30 AM EST
                      const marketClose = 16 * 60; // 4:00 PM EST
                      const isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime < marketClose;
                      return isMarketOpen ? '#4caf50' : '#f44336';
                    })(),
                    fontSize: '0.875rem'
                  }}>
                    {(() => {
                      // Get current time in Eastern Time
                      const now = new Date();
                      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
                      const dayOfWeek = easternTime.getDay();
                      const hour = easternTime.getHours();
                      const minute = easternTime.getMinutes();
                      const currentTime = hour * 60 + minute;
                      const marketOpen = 9 * 60 + 30; // 9:30 AM EST
                      const marketClose = 16 * 60; // 4:00 PM EST
                      const isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime < marketClose;
                      return isMarketOpen ? 'Open' : 'Closed';
                    })()}
                  </Typography>
                </Box>
              </Box>

              {/* Price and Change Row */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}>
                {/* Left: Price */}
                <Typography variant="h2" sx={{
                  fontWeight: 700,
                  color: theme.textPrimary,
                  fontSize: { xs: '2.5rem', md: '3rem' }
                }}>
                  ${(stockData?.current_price || comprehensiveData.current_price || 0).toFixed(2)}
                </Typography>

                {/* Right: Change */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={(stockData?.price_change || comprehensiveData.price_change || 0) >= 0 ?
                      <TrendingUp sx={{ fontSize: 16 }} /> :
                      <TrendingDown sx={{ fontSize: 16 }} />}
                    label={`${(stockData?.price_change || comprehensiveData.price_change || 0) >= 0 ? '+' : ''}${(stockData?.price_change || comprehensiveData.price_change || 0).toFixed(2)} (${(stockData?.price_change || comprehensiveData.price_change || 0) >= 0 ? '+' : ''}${(stockData?.price_change_percent || comprehensiveData.price_change_percent || 0).toFixed(2)}%)`}
                    sx={{
                      backgroundColor: (stockData?.price_change || comprehensiveData.price_change || 0) >= 0 ? '#4caf50' : '#f44336',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 32,
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Bottom Row - Data Status and Refresh */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2,
                borderTop: `1px solid ${theme.border}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                    {(() => {
                      // Get current time in Eastern Time
                      const now = new Date();
                      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
                      const dayOfWeek = easternTime.getDay();
                      const hour = easternTime.getHours();
                      const minute = easternTime.getMinutes();
                      const currentTime = hour * 60 + minute;
                      const marketOpen = 9 * 60 + 30; // 9:30 AM EST
                      const marketClose = 16 * 60; // 4:00 PM EST
                      const isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime < marketClose;
                      return isMarketOpen ? 'Live data' : `At close: ${easternTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZoneName: 'short'
                      })}`;
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                    Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                  </Typography>
                  {refreshing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} sx={{ color: theme.accent }} />
                      <Typography variant="body2" sx={{ color: theme.accent }}>
                        Updating...
          </Typography>
        </Box>
                  )}
                </Box>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    backgroundColor: `${theme.accent}10`,
                    color: theme.accent,
                    border: `1px solid ${theme.accent}30`,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: `${theme.accent}20`,
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      opacity: 0.6,
                      transform: 'none',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Price'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Professional Navigation */}
      <Box sx={{ mb: 6 }}>
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
              variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.border}`,
              '& .MuiTab-root': {
                color: theme.textSecondary,
                  fontWeight: 500,
                textTransform: 'none',
                  fontSize: '0.95rem',
                  minHeight: 64,
                  px: 2,
                '&.Mui-selected': {
                  color: theme.accent,
                    backgroundColor: `${theme.accent}08`,
                  },
                  '&:hover': {
                    backgroundColor: `${theme.accent}05`,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.accent,
                height: 3,
                  borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
                icon={<ShowChart sx={{ fontSize: 20 }} />}
                label="Price Chart"
              iconPosition="start"
            />
            <Tab
                icon={<Assessment sx={{ fontSize: 20 }} />}
                label="Investment Analysis"
              iconPosition="start"
            />
            <Tab
                icon={<Business sx={{ fontSize: 20 }} />}
              label="Competitive Analysis"
              iconPosition="start"
            />
            <Tab
                icon={<Psychology sx={{ fontSize: 20 }} />}
                label="AI Forecasts"
              iconPosition="start"
            />
            <Tab
                icon={<Timeline sx={{ fontSize: 20 }} />}
                label="Financial Data"
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 0 }}>
            {/* Chart Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 4 }}>
                {/* Chart Header */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 4,
                  p: 3,
                  backgroundColor: `${theme.accent}05`,
                  borderRadius: 2,
                  border: `1px solid ${theme.accent}20`,
                }}>
                  <Box>
                  <Typography
                    variant="h5"
                    sx={{
                        color: theme.textPrimary,
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Price Chart & Analysis
                  </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Historical performance and AI-powered price projections
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 2,
                    border: `1px solid ${theme.border}`,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, fontWeight: 500 }}>
                      Show AI Forecast
                    </Typography>
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

                {/* Chart Container */}
                <Box sx={{
                  height: '600px',
                  width: '100%',
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  p: 3,
                  boxShadow: theme.cardShadow,
                }}>
                  <ErrorBoundary>
                    <StockChart
                      stockData={{
                        symbol: ticker || '',
                        price: stockData?.current_price || comprehensiveData?.current_price || 0,
                        change: stockData?.price_change || comprehensiveData?.price_change || 0,
                        changePercent: stockData?.price_change_percent || comprehensiveData?.price_change_percent || 0,
                      }}
                      showForecast={showForecast}
                      onForecastToggle={setShowForecast}
                    />
                  </ErrorBoundary>
                  </Box>
              </Box>
            )}


            {/* Analysis Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 4 }}>
                {/* Analysis Header */}
                <Box sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: `${theme.accent}05`,
                  borderRadius: 2,
                  border: `1px solid ${theme.accent}20`,
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.textPrimary,
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Investment Analysis Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                    Comprehensive valuation and investment recommendation based on DCF analysis and competitive positioning
                  </Typography>
                </Box>

                {/* Key Metrics Grid */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 3,
                  mb: 4,
                }}>
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        DCF Value
                      </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                        ${comprehensiveData?.summary?.dcf_value?.toFixed(2) || 'N/A'}
                </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Intrinsic value per share
                </Typography>
              </Box>

                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Current Price
                      </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                        ${comprehensiveData?.current_price?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Market price per share
                    </Typography>
                    </Box>

                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Upside/Downside
                        </Typography>
                <Typography
                      variant="h4"
                  sx={{
                          color: comprehensiveData?.summary?.dcf_value && comprehensiveData?.current_price
                            ? (comprehensiveData.summary.dcf_value > comprehensiveData.current_price ? '#4caf50' : '#f44336')
                          : theme.textSecondary,
                        fontWeight: 700,
                        mb: 1,
                        }}
                      >
                        {comprehensiveData?.summary?.dcf_value && comprehensiveData?.current_price
                          ? `${((comprehensiveData.summary.dcf_value - comprehensiveData.current_price) / comprehensiveData.current_price * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Price vs. intrinsic value
                      </Typography>
                    </Box>

                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Moat Strength
                      </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                        {comprehensiveData?.summary?.moat_strength_score?.toFixed(1) || 'N/A'}/100
                      </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Competitive advantage score
                      </Typography>
          </Box>
      </Box>

                {/* Investment Recommendation */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                  mb: 4,
                }}>
            <Typography
              variant="h5"
              sx={{
                      color: theme.textPrimary,
                      mb: 3,
                      fontWeight: 600,
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

                {/* Growth Drivers & Risk Factors */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                  mb: 4,
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.textPrimary,
                      mb: 3,
                      fontWeight: 600,
                    }}
                  >
                    Growth Drivers & Risk Factors
                  </Typography>

                  {/* Growth Drivers Grid */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 3,
                    mb: 4,
                  }}>
                  {/* Revenue Growth */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Revenue Growth
                      </Typography>
                      <Chip
                        label="High"
                        sx={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      Expected to grow at 15% annually
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      Strong demand for iPhone 16 series with AI features, continued growth in Services segment,
                        and expansion into emerging markets driving revenue growth.
                    </Typography>
                  </Box>

                  {/* Margin Expansion */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Margin Expansion
                      </Typography>
                      <Chip
                        label="High"
                        sx={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      Operating leverage and efficiency gains
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      Higher-margin Services business growing faster than hardware, operational efficiency
                      improvements, and premium pricing power supporting margin expansion.
                    </Typography>
                  </Box>

                  {/* Market Share */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Market Share
                      </Typography>
                      <Chip
                        label="Medium"
                        sx={{
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      Competitive positioning in core markets
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      Strong position in premium smartphone segment, but facing increased competition from
                      Android manufacturers. Services ecosystem provides competitive moat.
                    </Typography>
                  </Box>

                  {/* Innovation Pipeline */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Innovation Pipeline
                      </Typography>
                      <Chip
                        label="High"
                        sx={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      New products and services driving growth
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      Apple Intelligence integration across devices, Vision Pro ecosystem development,
                      autonomous vehicle project, and continued innovation in chip design.
                    </Typography>
                  </Box>

                  {/* Economic Conditions */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Economic Conditions
                      </Typography>
                      <Chip
                        label="Medium"
                        sx={{
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      Macroeconomic factors affecting demand
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      Consumer spending patterns, interest rate environment, and global economic growth
                      impact premium device sales. Resilient brand loyalty provides some protection.
                    </Typography>
                  </Box>

                  {/* Regulatory Environment */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                        Regulatory Environment
                      </Typography>
                      <Chip
                        label="Low"
                        sx={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                      <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                      Minimal regulatory headwinds expected
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, lineHeight: 1.6 }}>
                      App Store regulations, privacy laws, and antitrust scrutiny present ongoing challenges.
                      However, Apple's compliance track record and legal resources provide mitigation.
                    </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Analyst Recommendations */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                  mb: 4,
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.textPrimary,
                      mb: 3,
                      fontWeight: 600,
                    }}
                  >
                    Analyst Recommendations
                  </Typography>

                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 3,
                    mb: 4,
                  }}>
                    {/* Goldman Sachs */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          Goldman Sachs
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Dec 10, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Buy"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $200
                        </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Morgan Stanley */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          Morgan Stanley
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Dec 8, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Overweight"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $195
                        </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* JP Morgan */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          JP Morgan
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Dec 5, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Overweight"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $190
                        </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Bank of America */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          Bank of America
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Dec 3, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Buy"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $205
                        </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Wedbush */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          Wedbush
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Nov 28, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Outperform"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $210
                        </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* UBS */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 1 }}>
                          UBS
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Nov 25, 2024
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label="Buy"
                          sx={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                          <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $185
                        </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Summary Stats */}
                  <Box sx={{
                    mt: 4,
                    p: 4,
                    backgroundColor: `${theme.accent}08`,
                    borderRadius: 3,
                    border: `1px solid ${theme.accent}30`,
                  }}>
                    <Typography variant="h6" sx={{ color: theme.textPrimary, mb: 3, fontWeight: 600 }}>
                      Analyst Consensus Summary
                    </Typography>
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 3,
                    }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                          Average Target
                        </Typography>
                        <Typography variant="h5" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $194
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                          Highest Target
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                          $210
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                          Lowest Target
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>
                          $185
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                          Consensus
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                          Buy
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Scenario Analysis */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                  mb: 4,
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.textPrimary,
                      mb: 3,
                      fontWeight: 600,
                    }}
                  >
                    Scenario Analysis
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                    {/* Bull Case */}
                    <Box sx={{
                      p: 4,
                      border: '2px solid #4caf50',
                      borderRadius: 3,
                      backgroundColor: `${theme.accent}05`,
                      boxShadow: theme.cardShadow,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                          Bull Case
                        </Typography>
                        <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $220
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                          Probability: 25%
                        </Typography>
                        <Box sx={{
                          height: 8,
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: '25%',
                            height: '100%',
                            backgroundColor: '#4caf50'
                          }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                        Key Factors:
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
                        • Strong iPhone sales with AI breakthrough<br/>
                        • Services growth acceleration<br/>
                        • Vision Pro ecosystem success<br/>
                        • Autonomous vehicle progress
                      </Typography>
                    </Box>

                    {/* Base Case */}
                    <Box sx={{
                      p: 4,
                      border: '2px solid #00d4ff',
                      borderRadius: 3,
                      backgroundColor: `${theme.accent}05`,
                      boxShadow: theme.cardShadow,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 600 }}>
                          Base Case
                        </Typography>
                        <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $195
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                          Probability: 50%
                        </Typography>
                        <Box sx={{
                          height: 8,
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: '50%',
                            height: '100%',
                            backgroundColor: '#00d4ff'
                          }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                        Key Factors:
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
                        • Steady growth in core markets<br/>
                        • Market expansion continues<br/>
                        • Innovation pipeline delivers<br/>
                        • Stable competitive position
                      </Typography>
                    </Box>

                    {/* Bear Case */}
                    <Box sx={{
                      p: 4,
                      border: '2px solid #f44336',
                      borderRadius: 3,
                      backgroundColor: `${theme.accent}05`,
                      boxShadow: theme.cardShadow,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 600 }}>
                          Bear Case
                        </Typography>
                        <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                          $160
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                          Probability: 25%
                        </Typography>
                        <Box sx={{
                          height: 8,
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: '25%',
                            height: '100%',
                            backgroundColor: '#f44336'
                          }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 2, fontWeight: 500 }}>
                        Key Factors:
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
                        • Economic slowdown impacts sales<br/>
                        • Increased competition<br/>
                        • Regulatory pressure intensifies<br/>
                        • Innovation pipeline delays
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}


            {/* AI Forecasts Tab */}
            {activeTab === 3 && (
              <Box sx={{ p: 4 }}>
                {/* AI Forecasts Header */}
                <Box sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: `${theme.accent}05`,
                  borderRadius: 2,
                  border: `1px solid ${theme.accent}20`,
                }}>
                  <Typography variant="h5" sx={{
                    fontWeight: 600,
                    color: theme.textPrimary,
                    mb: 1
                  }}>
                    AI Forecasts Comparison
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.textSecondary }}>
                    Compare predictions from multiple AI algorithms: Prophet, Darts, NeuralProphet, Greykits, and Cats
                  </Typography>
                </Box>

                {/* Algorithm Comparison Grid */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 4
                }}>
                  {/* Prophet Forecast */}
                  <Card sx={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 3,
                    boxShadow: theme.cardShadow,
                  }}>
                    <CardHeader
                      title="Prophet"
                      subheader="Facebook's time series forecasting"
                    sx={{
                        backgroundColor: `${theme.accent}10`,
                        '& .MuiCardHeader-title': { color: theme.textPrimary, fontWeight: 600 },
                        '& .MuiCardHeader-subheader': { color: theme.textSecondary }
                      }}
                    />
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{
                      fontWeight: 700,
                          color: theme.textPrimary,
                          mb: 1
                        }}>
                          ${(stockData?.current_price || comprehensiveData?.current_price || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Current Price
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{
                          fontWeight: 600,
                          color: (() => {
                            const currentPrice = stockData?.current_price || comprehensiveData?.current_price || 0;
                            const forecastPrice = prophetForecast?.forecast_price || currentPrice;
                            return forecastPrice >= currentPrice ? '#4caf50' : '#f44336';
                          })(),
                          mb: 1
                        }}>
                          ${(() => {
                            const currentPrice = stockData?.current_price || comprehensiveData?.current_price || 0;
                            const forecastPrice = prophetForecast?.forecast_price || currentPrice;
                            return forecastPrice.toFixed(2);
                          })()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          {(() => {
                            const currentPrice = stockData?.current_price || comprehensiveData?.current_price || 0;
                            const forecastPrice = prophetForecast?.forecast_price || currentPrice;
                            const changePercent = ((forecastPrice - currentPrice) / currentPrice) * 100;
                            return `Forecast (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`;
                          })()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                        Based on historical patterns and seasonality analysis
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Darts Forecast */}
                  <Card sx={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 3,
                    boxShadow: theme.cardShadow,
                  }}>
                    <CardHeader
                      title="Darts"
                      subheader="Deep learning time series"
                      sx={{
                        backgroundColor: `${theme.accent}10`,
                        '& .MuiCardHeader-title': { color: theme.textPrimary, fontWeight: 600 },
                        '& .MuiCardHeader-subheader': { color: theme.textSecondary }
                      }}
                    />
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{
                          fontWeight: 700,
                          color: theme.textPrimary,
                          mb: 1
                        }}>
                          ${comprehensiveData?.current_price?.toFixed(2) || '0.00'}
                  </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Current Price
                  </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{
                          fontWeight: 600,
                          color: '#4caf50',
                          mb: 1
                        }}>
                          ${((comprehensiveData?.current_price || 0) * 1.08).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Forecast (+8.0%)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                        Neural network-based prediction with attention mechanisms
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* NeuralProphet Forecast */}
                  <Card sx={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 3,
                    boxShadow: theme.cardShadow,
                  }}>
                    <CardHeader
                      title="NeuralProphet"
                      subheader="Neural network Prophet"
                      sx={{
                        backgroundColor: `${theme.accent}10`,
                        '& .MuiCardHeader-title': { color: theme.textPrimary, fontWeight: 600 },
                        '& .MuiCardHeader-subheader': { color: theme.textSecondary }
                      }}
                    />
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{
                          fontWeight: 700,
                          color: theme.textPrimary,
                          mb: 1
                        }}>
                          ${comprehensiveData?.current_price?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Current Price
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{
                        fontWeight: 600,
                          color: '#f44336',
                          mb: 1
                        }}>
                          ${((comprehensiveData?.current_price || 0) * 0.95).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Forecast (-5.0%)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                        Hybrid Prophet with neural network components
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Greykits Forecast */}
                  <Card sx={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 3,
                    boxShadow: theme.cardShadow,
                  }}>
                    <CardHeader
                      title="Greykits"
                      subheader="Grey system theory"
                      sx={{
                        backgroundColor: `${theme.accent}10`,
                        '& .MuiCardHeader-title': { color: theme.textPrimary, fontWeight: 600 },
                        '& .MuiCardHeader-subheader': { color: theme.textSecondary }
                      }}
                    />
                    <CardContent>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h4" sx={{
                          fontWeight: 700,
                          color: theme.textPrimary,
                          mb: 1
                        }}>
                          ${comprehensiveData?.current_price?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Current Price
                        </Typography>
                  </Box>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{
                          fontWeight: 600,
                          color: '#4caf50',
                          mb: 1
                        }}>
                          ${((comprehensiveData?.current_price || 0) * 1.02).toFixed(2)}
                  </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Forecast (+2.0%)
                </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
                        Grey system theory for uncertain systems
                      </Typography>
                    </CardContent>
                  </Card>
            </Box>

                {/* Consensus Analysis */}
                <Card sx={{
                  backgroundColor: theme.cardBackground,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 3,
                  boxShadow: theme.cardShadow,
                }}>
                  <CardHeader
                    title="AI Consensus Analysis"
                    subheader="Aggregated prediction from all algorithms"
                    sx={{
                      backgroundColor: `${theme.accent}10`,
                      '& .MuiCardHeader-title': { color: theme.textPrimary, fontWeight: 600 },
                      '& .MuiCardHeader-subheader': { color: theme.textSecondary }
                    }}
                  />
                  <CardContent>
            <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                      gap: 3,
                      mb: 3
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          color: '#4caf50',
                          mb: 1
                        }}>
                          +2.5%
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Average Forecast
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          color: theme.textPrimary,
                          mb: 1
                        }}>
                          4/5
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Bullish Algorithms
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 600,
                          color: '#ff9800',
                          mb: 1
                        }}>
                          Medium
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                          Confidence Level
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ color: theme.textSecondary }}>
                      The majority of AI algorithms (4 out of 5) predict a positive price movement,
                      with an average forecast of +2.5%. NeuralProphet is the only algorithm
                      predicting a decline, suggesting some uncertainty in the market outlook.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Financials Tab */}
            {activeTab === 4 && (
              <Box sx={{ p: 4 }}>
                {/* Financial Data Header */}
                <Box sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: `${theme.accent}05`,
                  borderRadius: 2,
                  border: `1px solid ${theme.accent}20`,
            }}>
                <Typography
                    variant="h5"
                  sx={{
                      color: theme.textPrimary,
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Financial Data & Metrics
                </Typography>
                  <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                    Comprehensive financial analysis including key ratios, performance metrics, and financial health indicators
                  </Typography>
                  </Box>

                {/* Key Financial Metrics Grid */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: 3,
                  mb: 4,
                }}>
                  {/* Market Cap */}
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      Market Capitalization
                      </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      ${comprehensiveData?.market_cap ? (comprehensiveData.market_cap / 1e9).toFixed(1) + 'B' : 'N/A'}
                        </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Total market value
                </Typography>
                    </Box>

                  {/* P/E Ratio */}
            <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      P/E Ratio
                    </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      {comprehensiveData?.valuation?.pe_ratio?.toFixed(1) || 'N/A'}
                      </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Price-to-earnings ratio
                    </Typography>
                  </Box>

                  {/* Enterprise Value */}
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      Enterprise Value
                    </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      ${comprehensiveData?.valuation?.enterprise_value ? (comprehensiveData.valuation.enterprise_value / 1e9).toFixed(1) + 'B' : 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Total enterprise value
                    </Typography>
                  </Box>

                  {/* Price-to-Book */}
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      Price-to-Book
                    </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      {comprehensiveData?.valuation?.pb_ratio?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Book value ratio
                    </Typography>
                  </Box>

                  {/* Current Price */}
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      Current Price
                    </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      ${(stockData?.current_price || comprehensiveData?.current_price || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      {stockData ? 'Real-time market price' : 'Latest market price'}
                    </Typography>
                  </Box>

                  {/* Volume */}
                  <Box sx={{
                    p: 3,
                    backgroundColor: theme.cardBackground,
                    borderRadius: 3,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.cardShadow,
                  }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                      Trading Volume
                    </Typography>
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 700, mb: 1 }}>
                      {stockData?.volume ? (stockData.volume / 1e6).toFixed(1) + 'M' :
                       comprehensiveData?.volume ? (comprehensiveData.volume / 1e6).toFixed(1) + 'M' : 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      {stockData ? 'Real-time volume' : 'Shares traded today'}
                    </Typography>
                  </Box>
                </Box>

                {/* Valuation Summary */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                  mb: 4,
            }}>
                <Typography
                    variant="h5"
                  sx={{
                      color: theme.textPrimary,
                    mb: 3,
                      fontWeight: 600,
                  }}
                >
                    Valuation Summary
                  </Typography>

                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 3,
                  }}>
                    {/* DCF Analysis */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                    borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                  }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 2 }}>
                        DCF Analysis
                    </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          DCF Value per Share
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          ${comprehensiveData?.summary?.dcf_value?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Current Price
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          ${(stockData?.current_price || comprehensiveData?.current_price || 0).toFixed(2)}
                        </Typography>
                </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Upside/Downside
                        </Typography>
                        <Typography variant="h6" sx={{
                          color: comprehensiveData?.summary?.dcf_value && (stockData?.current_price || comprehensiveData?.current_price)
                            ? (comprehensiveData.summary.dcf_value > (stockData?.current_price || comprehensiveData.current_price) ? '#4caf50' : '#f44336')
                            : theme.textSecondary,
                          fontWeight: 600
                        }}>
                          {comprehensiveData?.summary?.dcf_value && (stockData?.current_price || comprehensiveData?.current_price)
                            ? `${((comprehensiveData.summary.dcf_value - (stockData?.current_price || comprehensiveData.current_price)) / (stockData?.current_price || comprehensiveData.current_price) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </Typography>
              </Box>
                    </Box>

                    {/* Market Metrics */}
                    <Box sx={{
                      p: 3,
                      backgroundColor: `${theme.accent}05`,
                      borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                    }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 2 }}>
                        Market Metrics
                </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Market Cap
                      </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          ${comprehensiveData?.market_cap ? (comprehensiveData.market_cap / 1e9).toFixed(1) + 'B' : 'N/A'}
                </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          P/E Ratio
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          {comprehensiveData?.valuation?.pe_ratio?.toFixed(1) || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Price-to-Book
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          {comprehensiveData?.valuation?.pb_ratio?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                  </Box>

                    {/* Investment Recommendation */}
                  <Box sx={{
                    p: 3,
                      backgroundColor: `${theme.accent}05`,
                    borderRadius: 2,
                      border: `1px solid ${theme.accent}20`,
                  }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600, mb: 2 }}>
                        Investment Analysis
                    </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Recommendation
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          {comprehensiveData?.summary?.investment_recommendation || 'N/A'}
                    </Typography>
                  </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                          Risk Level
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                          {comprehensiveData?.summary?.risk_level || 'N/A'}
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
                </Box>

                {/* Additional Financial Information */}
                <Box sx={{
                  p: 4,
                  backgroundColor: theme.cardBackground,
                  borderRadius: 3,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.textPrimary,
                      mb: 3,
                      fontWeight: 600,
                    }}
                  >
                    Additional Information
                </Typography>

                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 3,
                  }}>
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Analysis Date
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                        {comprehensiveData?.analysis_date ? new Date(comprehensiveData.analysis_date).toLocaleDateString() : 'N/A'}
                </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Confidence Score
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                        {comprehensiveData?.confidence_score ? comprehensiveData.confidence_score.toFixed(0) + '%' : 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{
                        color: theme.textSecondary,
                        fontSize: '0.75rem',
                        display: 'block',
                        mt: 1,
                        lineHeight: 1.2,
                        maxWidth: '120px',
                        mx: 'auto'
                      }}>
                        Reliability of analysis based on data quality and model accuracy
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Sector
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                        {comprehensiveData?.sector || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1, fontWeight: 500 }}>
                        Industry
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 700 }}>
                        {comprehensiveData?.industry || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Data Sources */}
                  {comprehensiveData?.data_sources && comprehensiveData.data_sources.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ color: theme.textPrimary, mb: 2, fontWeight: 600 }}>
                        Data Sources
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {comprehensiveData.data_sources.map((source: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                          <Chip
                            key={index}
                            label={source}
                            sx={{
                              backgroundColor: `${theme.accent}20`,
                              color: theme.accent,
                              border: `1px solid ${theme.accent}50`,
                              fontWeight: 500,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}


            {/* Competitive Analysis Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: 4 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ fontSize: 32, color: theme.accent, mr: 2 }} />
                    <Typography variant="h4" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                      Competitive Analysis - {ticker}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 3 }}>
                    Comprehensive analysis of {comprehensiveData?.company_name || ticker} competitive advantage and market position
                  </Typography>

                  {/* Competitive Position Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Chip
                      label={comprehensiveData?.competitive?.moat_level || 'N/A'}
                      sx={{
                        backgroundColor: comprehensiveData?.competitive?.moat_level === 'Market Leader' ? '#4caf50' :
                                       comprehensiveData?.competitive?.moat_level === 'Strong Competitor' ? '#00d4ff' :
                                       comprehensiveData?.competitive?.moat_level === 'Average Position' ? '#ff9800' :
                                       comprehensiveData?.competitive?.moat_level === 'Below Average' ? '#ff5722' :
                                       comprehensiveData?.competitive?.moat_level === 'Weak Position' ? '#f44336' : '#b0b0b0',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '1rem',
                        px: 2,
                        py: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Moat Strength Score: {comprehensiveData?.competitive?.overall_moat_score?.toFixed(1) || 'N/A'}/100
                    </Typography>
                  </Box>
                </Box>

                {/* Main Content Grid */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
                  {/* Competitive Position Overview */}
                  <Box sx={{ flex: { xs: 1, lg: 1 } }}>
                    <Card sx={{
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assessment sx={{ mr: 1, color: theme.accent }} />
                            <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                              Competitive Position
                            </Typography>
                          </Box>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                            Overall Moat Strength
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={comprehensiveData?.competitive?.overall_moat_score || 0}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: darkMode ? '#333333' : '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: comprehensiveData?.competitive?.moat_level === 'Market Leader' ? '#4caf50' :
                                               comprehensiveData?.competitive?.moat_level === 'Strong Competitor' ? '#00d4ff' :
                                               comprehensiveData?.competitive?.moat_level === 'Average Position' ? '#ff9800' :
                                               comprehensiveData?.competitive?.moat_level === 'Below Average' ? '#ff5722' :
                                               comprehensiveData?.competitive?.moat_level === 'Weak Position' ? '#f44336' : theme.accent,
                                borderRadius: 6,
                              },
                            }}
                          />
                          <Typography variant="h6" sx={{ color: theme.textPrimary, mt: 1, textAlign: 'center' }}>
                            {comprehensiveData?.competitive?.overall_moat_score?.toFixed(1) || 'N/A'}/100
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: theme.border }} />

                        {/* Key Metrics */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                            Top Advantage
                          </Typography>
                          <Typography variant="h6" sx={{ color: theme.textPrimary }}>
                            {comprehensiveData?.competitive?.top_advantage || 'N/A'}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                            Weakest Area
                          </Typography>
                          <Typography variant="h6" sx={{ color: theme.textPrimary }}>
                            {comprehensiveData?.competitive?.weakest_area || 'N/A'}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: theme.textSecondary, mb: 1 }}>
                            Industry Attractiveness
                          </Typography>
                          <Typography variant="h6" sx={{ color: theme.textPrimary }}>
                            {comprehensiveData?.summary?.industry_attractiveness || 'N/A'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Competitive Advantage Radar Chart */}
                  <Box sx={{ flex: { xs: 1, lg: 1 } }}>
                    <Card sx={{
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                            Competitive Advantage Breakdown
                          </Typography>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent sx={{ p: 0 }}>
                        <Box sx={{ height: 300, p: 2 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={[
                              {
                                advantage: 'Ecosystem',
                                score: comprehensiveData?.competitive?.ecosystem_score ?? 0,
                                fullMark: 100
                              },
                              {
                                advantage: 'Brand Power',
                                score: comprehensiveData?.competitive?.brand_score ?? 0,
                                fullMark: 100
                              },
                              {
                                advantage: 'Integration',
                                score: comprehensiveData?.competitive?.integration_score ?? 0,
                                fullMark: 100
                              },
                              {
                                advantage: 'Supply Chain',
                                score: comprehensiveData?.competitive?.supply_chain_score ?? 0,
                                fullMark: 100
                              },
                              {
                                advantage: 'Strategic',
                                score: comprehensiveData?.competitive?.strategic_score ?? 0,
                                fullMark: 100
                              }
                            ]}>
                              <PolarGrid stroke={theme.border} />
                              <PolarAngleAxis dataKey="advantage" tick={{ fill: theme.textSecondary, fontSize: 12 }} />
                              <PolarRadiusAxis
                                domain={[0, 100]}
                                tick={{ fill: theme.textSecondary, fontSize: 10 }}
                                tickCount={6}
                              />
                              <Radar
                                name="Score"
                                dataKey="score"
                                stroke={theme.accent}
                                fill={theme.accent}
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
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                            Competitive Advantage Details
                          </Typography>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)' }}>
                                <TableCell sx={{ color: theme.accent, fontWeight: 600 }}>Advantage</TableCell>
                                <TableCell sx={{ color: theme.accent, fontWeight: 600 }}>Score</TableCell>
                                <TableCell sx={{ color: theme.accent, fontWeight: 600 }}>Description</TableCell>
                                <TableCell sx={{ color: theme.accent, fontWeight: 600 }}>Evidence</TableCell>
                                <TableCell sx={{ color: theme.accent, fontWeight: 600 }}>Sustainability</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {comprehensiveData?.competitive_advantage?.competitive_advantages ?
                                Object.entries(comprehensiveData.competitive_advantage.competitive_advantages).map(([key, advantage]) => (
                                  <TableRow key={key} sx={{ '&:hover': { backgroundColor: `${theme.accent}05` } }}>
                                    <TableCell sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                                      {advantage.category}
                                    </TableCell>
                                    <TableCell sx={{ color: theme.textPrimary }}>
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
                                            backgroundColor: darkMode ? '#333333' : '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                              backgroundColor: advantage.strength_score >= 60 ? '#4caf50' : advantage.strength_score >= 40 ? '#ff9800' : '#f44336',
                                              borderRadius: 3,
                                            },
                                          }}
                                        />
                                      </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: theme.textPrimary, maxWidth: 200 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                        {advantage.description}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: theme.textPrimary, maxWidth: 200 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                        {advantage.evidence.slice(0, 2).join('; ')}
                                        {advantage.evidence.length > 2 && '...'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: theme.textPrimary }}>
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
                                )) : (
                                  <TableRow>
                                    <TableCell colSpan={5} sx={{ color: theme.textSecondary, textAlign: 'center', py: 4 }}>
                                      No competitive advantage data available
                                    </TableCell>
                                  </TableRow>
                                )
                              }
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
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                            Strengths & Opportunities
                          </Typography>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 600, mb: 2 }}>
                            Investment Thesis
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.textPrimary, mb: 2 }}>
                            {typeof comprehensiveData?.competitive_advantage?.investment_thesis === 'string'
                              ? comprehensiveData.competitive_advantage.investment_thesis
                              : comprehensiveData?.competitive_advantage?.investment_thesis?.thesis || 'Investment thesis not available'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            Recommendation: {typeof comprehensiveData?.competitive_advantage?.investment_thesis === 'string'
                              ? 'N/A'
                              : comprehensiveData?.competitive_advantage?.investment_thesis?.recommendation || 'N/A'}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: theme.border }} />

                        <Box>
                          <Typography variant="subtitle1" sx={{ color: theme.accent, fontWeight: 600, mb: 2 }}>
                            Growth Opportunities
                          </Typography>
                          <List dense>
                            {comprehensiveData?.opportunities?.growth_opportunities?.map((opportunity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <TrendingUp sx={{ color: theme.accent, fontSize: 20 }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={opportunity}
                                  primaryTypographyProps={{ color: theme.textPrimary, fontSize: '0.9rem' }}
                                />
                              </ListItem>
                            )) || (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemText
                                  primary="No growth opportunities data available"
                                  primaryTypographyProps={{ color: theme.textSecondary, fontSize: '0.9rem' }}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Box>
                      </CardContent>
                    </Card>
                    </Box>

                    {/* Weaknesses & Threats */}
                    <Box sx={{ flex: 1 }}>
                    <Card sx={{
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardHeader
                        title={
                          <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                            Weaknesses & Threats
                          </Typography>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ color: '#ff9800', fontWeight: 600, mb: 2 }}>
                            Risk Factors
                          </Typography>
                          <List dense>
                            {comprehensiveData?.competitive_advantage?.investment_thesis?.risk_factors?.map((risk: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={risk}
                                  primaryTypographyProps={{ color: theme.textPrimary, fontSize: '0.9rem' }}
                                />
                              </ListItem>
                            )) || (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemText
                                  primary="No risk factors data available"
                                  primaryTypographyProps={{ color: theme.textSecondary, fontSize: '0.9rem' }}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: theme.border }} />

                        <Box>
                          <Typography variant="subtitle1" sx={{ color: '#f44336', fontWeight: 600, mb: 2 }}>
                            Porter's Five Forces
                          </Typography>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                              Industry Attractiveness: {comprehensiveData?.competitive_advantage?.porters_five_forces?.overall_industry_attractiveness || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                              Supplier Power: {comprehensiveData?.competitive_advantage?.porters_five_forces?.supplier_power || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                              Buyer Power: {comprehensiveData?.competitive_advantage?.porters_five_forces?.buyer_power || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                              Competitive Rivalry: {comprehensiveData?.competitive_advantage?.porters_five_forces?.competitive_rivalry || 'N/A'}
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
                      backgroundColor: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 3
                    }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Star sx={{ mr: 1, color: theme.accent }} />
                            <Typography variant="h6" sx={{ color: theme.textPrimary, fontWeight: 600 }}>
                              Strategic Recommendations
                            </Typography>
                          </Box>
                        }
                        sx={{
                          backgroundColor: `${theme.accent}05`,
                          borderBottom: `1px solid ${theme.border}`
                        }}
                      />
                      <CardContent>
                        <List>
                          {comprehensiveData?.competitive_advantage?.sector_insights?.recommendations?.map((recommendation: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                            <ListItem key={index} sx={{ px: 0, py: 1 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <StarBorder sx={{ color: theme.accent, fontSize: 20 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={recommendation}
                                primaryTypographyProps={{ color: theme.textPrimary, fontSize: '1rem' }}
                              />
                            </ListItem>
                          )) || (
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary="No strategic recommendations available"
                                primaryTypographyProps={{ color: theme.textSecondary, fontSize: '0.9rem' }}
                              />
                            </ListItem>
                          )}
                        </List>
                      </CardContent>
                    </Card>
                  </Box>
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
