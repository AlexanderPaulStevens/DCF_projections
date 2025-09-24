import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';
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
  Tabs,
  Tab,
  Grid,
  Paper,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Assessment,
  TrendingDown,
  TrendingFlat,
  TrendingUp,
  Star,
  Share,
  MoreVert,
  Home,
  ChevronRight,
  BarChart,
  ShowChart,
  PieChart,
  Timeline,
  Search,
} from '@mui/icons-material';
import { APIService, CompanyOverview as CompanyOverviewType, DCFAnalysis, StockData } from '../services/api';
import { DCFTab } from './tabs/DCFTab';
import { StockChart } from './StockChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Floating animation keyframes
const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(45deg);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-20px) rotate(45deg);
    opacity: 0.6;
  }
`;

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<CompanyOverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dcfData, setDcfData] = useState<DCFAnalysis | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [dcfLoading, setDcfLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [lines, setLines] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);

  // Initialize moving lines
  useEffect(() => {
    const initialLines = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.5 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.3,
    }));
    setLines(initialLines);

    // Animate lines
    const interval = setInterval(() => {
      setLines(prevLines =>
        prevLines.map(line => ({
          ...line,
          y: (line.y - line.speed) % 100,
          opacity: 0.2 + Math.sin(Date.now() * 0.001 + line.id) * 0.3,
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
      setError(null);

        // Fetch all data in parallel
        const [overviewData, dcfAnalysis, stockInfo] = await Promise.allSettled([
          APIService.getCompanyOverview(ticker),
          APIService.getDCFAnalysis(ticker),
          APIService.getStockData(ticker)
        ]);

        // Handle overview data
        if (overviewData.status === 'fulfilled') {
          setOverview(overviewData.value);
        } else {
          console.error('Error fetching overview:', overviewData.reason);
        }

        // Handle DCF data
        if (dcfAnalysis.status === 'fulfilled') {
          setDcfData(dcfAnalysis.value);
        } else {
          console.error('Error fetching DCF analysis:', dcfAnalysis.reason);
        }

        // Handle stock data
        if (stockInfo.status === 'fulfilled') {
          setStockData(stockInfo.value);
        } else {
          console.error('Error fetching stock data:', stockInfo.reason);
        }

    } catch (err) {
        setError('Failed to load company data');
        console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

    fetchData();
  }, [ticker]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/company/${query.toUpperCase()}/analysis`);
    }
  };

  const getPerformanceIcon = () => {
    if (!overview) return <TrendingFlat />;
    const change = overview.overview?.change || 0;
    return change >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  const getPerformanceColor = () => {
    if (!overview) return 'default';
    const change = overview.overview?.change || 0;
    return change >= 0 ? 'success' : 'error';
  };

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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!overview) {
  return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Company data not found
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
      {/* Moving Lines Background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: 'absolute',
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: line.id % 3 === 0 ? '3px' : '2px',
              height: line.id % 4 === 0 ? '120px' : '80px',
              background: `linear-gradient(180deg,
                transparent,
                rgba(0, 212, 255, 0.1),
                rgba(0, 212, 255, 0.3),
                rgba(0, 212, 255, 0.4),
                rgba(0, 212, 255, 0.3),
                rgba(0, 212, 255, 0.1),
                transparent
              )`,
              opacity: line.opacity,
              transform: `rotate(${45 + (line.id % 3) * 15}deg)`,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 15px rgba(0, 212, 255, 0.2)`,
              animation: `${float} ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </Box>

      <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 4, position: 'relative', zIndex: 1 }}>
        {/* Header with Logo and Search */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <Box
            sx={{
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
                color: '#00d4ff',
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
                    <Search sx={{ color: '#00d4ff' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: 3,
                  height: 48,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
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
                    border: '1px solid rgba(0, 212, 255, 0.6)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                  },
                  '&.Mui-focused': {
                    border: '1px solid rgba(0, 212, 255, 0.8)',
                    boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#ffffff',
                  fontSize: '1rem',
                  '&::placeholder': {
                    color: '#b0b0b0',
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
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
              mb: 2,
              textShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
            }}
          >
            {ticker} Analysis
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#b0b0b0',
              fontWeight: 400,
              mb: 2,
            }}
          >
            {overview.overview?.name || 'Company Name'}
          </Typography>
        </Box>

        {/* Main Content Layout */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, mb: 6 }}>
          {/* Stock Price Chart - Larger */}
          <Card sx={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
            overflow: 'hidden',
          }}>
            <Box sx={{
              p: 3,
              borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#00d4ff',
                    fontWeight: 700,
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  {ticker} Stock Price & Forecast
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Show Forecast</Typography>
                  <Switch
                    defaultChecked
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00d4ff',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00d4ff',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(0, 212, 255, 0.3)',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Box sx={{ height: '500px', width: '100%' }}>
                {stockData ? (
                  <StockChart
                    stockData={{
                      symbol: stockData.ticker,
                      price: stockData.current_price,
                      change: stockData.price_change,
                      changePercent: stockData.price_change_percent
                    }}
                  />
                ) : (
                  <Box sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 212, 255, 0.05)',
                    borderRadius: 2,
                    border: '2px dashed rgba(0, 212, 255, 0.3)',
                  }}>
                    <CircularProgress sx={{ color: '#00d4ff' }} />
                  </Box>
                )}
              </Box>
            </Box>
          </Card>

          {/* DCF Analysis - Smaller and Compact */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* DCF Summary Card */}
            <Card sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
              overflow: 'hidden',
            }}>
              <Box sx={{
                p: 3,
                borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00d4ff',
                    fontWeight: 700,
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  DCF Analysis
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {dcfData ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#00d4ff',
                        fontWeight: 700,
                        mb: 1,
                        textShadow: '0 0 30px rgba(0, 212, 255, 0.6)',
                      }}
                    >
                      ${dcfData.base_results.per_share_value?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2 }}>
                      DCF Value per Share
                    </Typography>

                    {stockData && dcfData.base_results.per_share_value && (
                      <>
                        <Typography variant="body1" sx={{ color: '#ffffff', mb: 1 }}>
                          Current: ${stockData.current_price?.toFixed(2)}
                        </Typography>
                        {dcfData.base_results.per_share_value > stockData.current_price ? (
                          <Chip
                            label="UNDERVALUED"
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              px: 2,
                              py: 1,
                              backgroundColor: 'rgba(0, 212, 255, 0.2)',
                              color: '#00d4ff',
                              border: '1px solid rgba(0, 212, 255, 0.5)',
                              textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                            }}
                          />
                        ) : (
                          <Chip
                            label="OVERVALUED"
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              px: 2,
                              py: 1,
                              backgroundColor: 'rgba(255, 0, 0, 0.2)',
                              color: '#ff4444',
                              border: '1px solid rgba(255, 0, 0, 0.5)',
                              textShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                            }}
                          />
                        )}
                        <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 1 }}>
                          {dcfData.base_results.per_share_value > stockData.current_price ?
                            `${(((dcfData.base_results.per_share_value - stockData.current_price) / stockData.current_price) * 100).toFixed(1)}% upside` :
                            `${(((stockData.current_price - dcfData.base_results.per_share_value) / dcfData.base_results.per_share_value) * 100).toFixed(1)}% overvalued`
                          }
                        </Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box sx={{
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 212, 255, 0.05)',
                    borderRadius: 2,
                    border: '2px dashed rgba(0, 212, 255, 0.3)',
                  }}>
                    <CircularProgress sx={{ color: '#00d4ff' }} />
                  </Box>
                )}
              </Box>
            </Card>

            {/* Quick Stats Card */}
            <Card sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
              overflow: 'hidden',
            }}>
              <Box sx={{
                p: 3,
                borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00d4ff',
                    fontWeight: 700,
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  Key Metrics
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {stockData ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Market Cap:</Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        ${stockData.market_cap ? (stockData.market_cap / 1e9).toFixed(1) + 'B' : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>P/E Ratio:</Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        {stockData.pe_ratio?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Volume:</Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        {stockData.volume ? (stockData.volume / 1e6).toFixed(1) + 'M' : 'N/A'}
                      </Typography>
                    </Box>
                    {dcfData && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Growth Rate:</Typography>
                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                          {(dcfData.base_results.growth_rate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 212, 255, 0.05)',
                    borderRadius: 2,
                    border: '2px dashed rgba(0, 212, 255, 0.3)',
                  }}>
                    <CircularProgress sx={{ color: '#00d4ff' }} />
                  </Box>
                )}
              </Box>
        </Card>
          </Box>
      </Box>

        {/* Investment Recommendation */}
      <Card sx={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
        overflow: 'hidden',
      }}>
          <Box sx={{
            p: 4,
            borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
          }}>
            <Typography
              variant="h5"
              sx={{
                color: '#00d4ff',
                fontWeight: 700,
                textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              }}
            >
              Investment Recommendation
            </Typography>
          </Box>
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 4 }}>
              <Box sx={{
                textAlign: 'center',
                p: 4,
                background: 'rgba(0, 212, 255, 0.1)',
                borderRadius: 3,
                border: '1px solid rgba(0, 212, 255, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 212, 255, 0.2)',
              }}>
                <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, fontWeight: 600 }}>
                  Current Price
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    mb: 1,
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  ${stockData?.current_price?.toFixed(2) || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Market price today
                </Typography>
              </Box>
              <Box sx={{
                textAlign: 'center',
                p: 4,
                background: 'rgba(0, 212, 255, 0.1)',
                borderRadius: 3,
                border: '1px solid rgba(0, 212, 255, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 212, 255, 0.2)',
              }}>
                <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, fontWeight: 600 }}>
                  DCF Value
                </Typography>
                <Typography
                  variant="h3"
            sx={{
                  color: '#00d4ff',
                    fontWeight: 700,
                    mb: 1,
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                  }}
                >
                  ${dcfData?.base_results?.per_share_value?.toFixed(2) || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Intrinsic value
                </Typography>
              </Box>
        </Box>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {stockData && dcfData?.base_results?.per_share_value ? (
                <>
                  <Typography
                    variant="h2"
                    sx={{
                      color: dcfData.base_results.per_share_value > stockData.current_price ? '#00d4ff' : '#ff4444',
                      fontWeight: 800,
                      mb: 2,
                      textShadow: dcfData.base_results.per_share_value > stockData.current_price ?
                        '0 0 30px rgba(0, 212, 255, 0.6)' :
                        '0 0 30px rgba(255, 68, 68, 0.6)',
                    }}
                  >
                    {dcfData.base_results.per_share_value > stockData.current_price ? 'BUY' : 'SELL'}
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#b0b0b0', mb: 3 }}>
                    {dcfData.base_results.per_share_value > stockData.current_price ?
                      `The stock is undervalued by ${(((dcfData.base_results.per_share_value - stockData.current_price) / stockData.current_price) * 100).toFixed(1)}%` :
                      `The stock is overvalued by ${(((stockData.current_price - dcfData.base_results.per_share_value) / dcfData.base_results.per_share_value) * 100).toFixed(1)}%`
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 250,
                      height: 10,
                      background: 'rgba(0, 212, 255, 0.2)',
                      borderRadius: 2,
                      position: 'relative',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                    }}>
                      <Box sx={{
                        position: 'absolute',
                        left: '0%',
                        top: 0,
                        width: `${Math.min(100, (dcfData.base_results.per_share_value / stockData.current_price) * 100)}%`,
                        height: '100%',
                        background: dcfData.base_results.per_share_value > stockData.current_price ?
                          'linear-gradient(90deg, #00d4ff 0%, #4ddfff 100%)' :
                          'linear-gradient(90deg, #ff4444 0%, #ff6666 100%)',
                        borderRadius: 2,
                        boxShadow: dcfData.base_results.per_share_value > stockData.current_price ?
                          '0 0 20px rgba(0, 212, 255, 0.5)' :
                          '0 0 20px rgba(255, 68, 68, 0.5)',
                      }} />
                      <Box sx={{
                        position: 'absolute',
                        left: '50%',
                        top: -6,
                        width: 6,
                        height: 22,
                        background: '#ffffff',
                        borderRadius: 1,
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
                    Current Price: ${stockData.current_price.toFixed(2)} | DCF Value: ${dcfData.base_results.per_share_value.toFixed(2)}
                  </Typography>
                </>
              ) : (
                <Typography variant="h6" sx={{ color: '#b0b0b0' }}>
                  Loading recommendation...
                </Typography>
              )}
            </Box>

            <Box sx={{
              p: 4,
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: 3,
              border: '1px solid rgba(0, 212, 255, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
            }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#00d4ff',
                  mb: 3,
                  fontWeight: 700,
                  textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                }}
              >
                Investment Analysis
              </Typography>
              <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3, lineHeight: 1.6 }}>
                Based on our DCF analysis, {ticker} is currently trading {dcfData?.base_results?.per_share_value && stockData?.current_price ?
                  (dcfData.base_results.per_share_value > stockData.current_price ? 'below' : 'above') : 'relative to'} its intrinsic value.
                This means the market is {dcfData?.base_results?.per_share_value && stockData?.current_price ?
                  (dcfData.base_results.per_share_value > stockData.current_price ? 'undervaluing' : 'overvaluing') : 'evaluating'} the company's future cash flows.
              </Typography>
              <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3, lineHeight: 1.6 }}>
                Key factors supporting this valuation:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: '50%',
                    mr: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }} />
                  Strong recurring revenue from services and ecosystem
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: '50%',
                    mr: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }} />
                  Premium pricing power and brand loyalty
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: '50%',
                    mr: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }} />
                  Consistent cash flow generation and shareholder returns
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: '50%',
                    mr: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }} />
                  Market leadership in multiple product categories
                </Typography>
              </Box>
            </Box>
          </Box>
      </Card>
      </Box>
    </Box>

  );
};

export default CompanyAnalysis;
