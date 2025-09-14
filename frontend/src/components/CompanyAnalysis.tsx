import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack, TrendingUp, Assessment, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { APIService, CompanyOverview as CompanyOverviewType } from '../services/api';
import { ForecastTab } from './tabs/ForecastTab';
import { DCFTab } from './tabs/DCFTab';

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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<CompanyOverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (ticker) {
      loadCompanyOverview(ticker);
    }
  }, [ticker]);

  const loadCompanyOverview = async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading company overview for:', companyTicker);
      const data = await APIService.getCompanyOverview(companyTicker);
      console.log('📊 Company data received:', data);
      setOverview(data);
    } catch (err) {
      console.error('❌ Error loading company overview:', err);
      setError('Failed to load company overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getPerformanceColor = () => {
    // Mock performance indicator - in real app, this would come from API
    const performance = Math.random();
    if (performance > 0.6) return 'success';
    if (performance > 0.3) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = () => {
    const performance = Math.random();
    if (performance > 0.6) return <TrendingUp />;
    if (performance > 0.3) return <TrendingFlat />;
    return <TrendingDown />;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={80} sx={{ mb: 3, color: '#00d4ff' }} />
            <Typography variant="h5" sx={{ color: '#b0b0b0' }}>
              Loading company data...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !overview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
          {error || 'Company not found'}
        </Alert>
      </Container>
    );
  }

  // Mock stock data for the forecast tab
  const stockData = {
    price: 234.07,
    symbol: ticker || 'AAPL'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
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
          ← Back to Home
        </Button>

        {/* Company Header Card - Yahoo Finance Style */}
        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid #333333',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mr: 3,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
                }}
              >
                {ticker?.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {ticker}
                </Typography>
                <Typography variant="h5" sx={{ color: '#b0b0b0', mb: 2 }}>
                  Company Analysis
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    icon={getPerformanceIcon()}
                    label="Live Performance"
                    color={getPerformanceColor() as any}
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        fontSize: '1.2rem',
                      }
                    }}
                  />
                  <Chip
                    label="S&P 500"
                    variant="outlined"
                    sx={{
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Yahoo Finance Style Tabs */}
      <Card sx={{
        background: 'rgba(17, 17, 17, 0.8)',
        border: '1px solid #333333',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="company analysis tabs"
            sx={{
              '& .MuiTab-root': {
                color: '#b0b0b0',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#00d4ff',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00d4ff',
                height: 3,
              },
            }}
          >
            <Tab
              label="Forecast"
              icon={<TrendingUp />}
              iconPosition="start"
              sx={{ px: 4 }}
            />
            <Tab
              label="DCF Analysis"
              icon={<Assessment />}
              iconPosition="start"
              sx={{ px: 4 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ForecastTab stockData={stockData} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DCFTab ticker={ticker || ''} />
        </TabPanel>
      </Card>
    </Container>
  );
};

export default CompanyAnalysis;
