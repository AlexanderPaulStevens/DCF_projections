import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { StockHeader } from './StockHeader';
import { APIService } from '../services/api';
import StockPrice from './StockPrice';
import DCFAnalysis from './DCFAnalysis';
import FinancialRatios from './FinancialRatios';
import AnalystRecommendation from './AnalystRecommendation';

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
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state - determine initial tab based on URL
  const getInitialTab = useCallback(() => {
    const path = location.pathname;
    if (path.includes('/dcf')) return 1;
    if (path.includes('/ratios')) return 2;
    if (path.includes('/analyst')) return 3;
    return 0; // default to stock price
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Stock data for header
  const [stockData, setStockData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

  // Moving lines animation (matching landing page)
  const [lines, setLines] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    // Initialize moving lines
    const initialLines = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 1,
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

  // Fetch stock and company data for header
  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!ticker) return;

      try {
        setHeaderLoading(true);
        const [stock, company] = await Promise.all([
          APIService.getStockData(ticker),
          APIService.getCompanyInfo(ticker)
        ]);

        setStockData(stock);
        setCompanyData(company);
      } catch (err) {
        console.error('Error fetching header data:', err);
      } finally {
        setHeaderLoading(false);
      }
    };

    fetchHeaderData();
  }, [ticker]);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [getInitialTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Update URL without page reload
    const tabRoutes = ['stock-price', 'dcf', 'ratios', 'analyst'];
    const newRoute = tabRoutes[newValue];
    navigate(`/company/${ticker}/${newRoute}`, { replace: true });
  };

  const tabs = [
    { label: 'Stock Price', component: <StockPrice /> },
    { label: 'DCF Analysis', component: <DCFAnalysis /> },
    { label: 'Financial Ratios', component: <FinancialRatios /> },
    { label: 'AI Analyst', component: <AnalystRecommendation /> },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Moving lines background */}
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
              width: '2px',
              height: '100px',
              background: `linear-gradient(
                180deg,
                transparent,
                rgba(0, 212, 255, 0.1),
                transparent
              )`,
              opacity: line.opacity,
              transform: `rotate(${45 + (line.id % 3) * 15}deg)`,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 10px rgba(0, 212, 255, 0.2)`,
            }}
          />
        ))}
      </Box>

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Stock Header */}
        {!headerLoading && stockData && companyData && (
          <StockHeader
            stockData={{
              symbol: ticker?.toUpperCase() || '',
              name: companyData.name || '',
              price: stockData.current_price || 0,
              change: stockData.price_change || 0,
              changePercent: stockData.price_change_percent || 0,
              lastUpdated: new Date().toLocaleTimeString(),
            }}
          />
        )}


        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              textShadow: '0 0 40px rgba(0, 212, 255, 0.5)',
            }}
          >
            {companyData?.name || `${ticker?.toUpperCase()} Analysis`}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 3,
              fontSize: '1rem',
              lineHeight: 1.6,
              maxWidth: '600px',
              color: '#b0b0b0',
            }}
          >
            Comprehensive financial analysis and valuation
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{
          borderBottom: 1,
          borderColor: 'rgba(0, 212, 255, 0.2)',
          mb: 3
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#00d4ff',
                height: 3,
                borderRadius: '2px 2px 0 0',
              },
              '& .MuiTab-root': {
                color: '#b0b0b0',
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#00d4ff',
                },
                '&:hover': {
                  color: '#00d4ff',
                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Container>
    </Box>
  );
};

export default CompanyAnalysis;
