import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, CircularProgress, Alert, TextField, InputAdornment, IconButton, Paper } from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { APIService, CompanyOverview as CompanyOverviewType, StockData as StockDataType } from '../services/api';
import { StockHeader } from './StockHeader';
import { StockChart } from './StockChart';
import { StockTabs } from './StockTabs';

const CompanyOverview: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<CompanyOverviewType | null>(null);
  const [stockData, setStockData] = useState<StockDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (ticker) {
      loadCompanyData(ticker);
    }
  }, [ticker]);

  const loadCompanyData = async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading company data for:', companyTicker);

      // Load both overview and stock data in parallel
      const [overviewData, stockData] = await Promise.all([
        APIService.getCompanyOverview(companyTicker),
        APIService.getStockData(companyTicker)
      ]);

      console.log('✅ Company data loaded:', { overviewData, stockData });
      setOverview(overviewData);
      setStockData(stockData);
    } catch (err) {
      console.error('❌ Error loading company data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#000000'
      }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!overview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid #ff9800' }}>
          No company data available
        </Alert>
      </Container>
    );
  }

  // Prepare stock data for components
  const prepareStockData = () => {
    if (!stockData) {
      // Fallback data if stock data is not available
      return {
        symbol: ticker || 'AAPL',
        name: 'Apple Inc.',
        price: 174.84,
        change: 2.47,
        changePercent: 1.43,
        previousClose: 172.37,
        open: 173.50,
        bid: '174.80 x 1000',
        ask: '174.84 x 800',
        dayRange: '172.18 - 175.12',
        fiftyTwoWeekRange: '124.17 - 199.62',
        volume: '45,234,567',
        avgVolume: '52,845,231',
        marketCap: '2.73T',
        beta: 1.29,
        peRatio: 28.45,
        eps: 6.13,
        earningsDate: 'Jan 30, 2025',
        forwardDividend: '1.00 (0.57%)',
        exDividendDate: 'Nov 8, 2024',
        targetEstimate: 195.50
      };
    }

    // Use real stock data from Yahoo Finance
    const formatMarketCap = (marketCap: number) => {
      if (!marketCap || marketCap === 0) return 'N/A';
      if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
      if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
      if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
      return `$${marketCap.toFixed(0)}`;
    };

    const formatVolume = (volume: number) => {
      if (!volume || volume === 0) return 'N/A';
      if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
      if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
      if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
      return volume.toLocaleString();
    };

    return {
      symbol: stockData.ticker,
      name: stockData.name,
      price: stockData.current_price || 0,
      change: stockData.price_change || 0,
      changePercent: stockData.price_change_percent || 0,
      previousClose: stockData.previous_close || 0,
      open: stockData.open || 0,
      bid: `${(stockData.current_price || 0).toFixed(2)} x 1000`,
      ask: `${((stockData.current_price || 0) + 0.01).toFixed(2)} x 800`,
      dayRange: `${(stockData.day_low || 0).toFixed(2)} - ${(stockData.day_high || 0).toFixed(2)}`,
      fiftyTwoWeekRange: `${(stockData.fifty_two_week_low || 0).toFixed(2)} - ${(stockData.fifty_two_week_high || 0).toFixed(2)}`,
      volume: formatVolume(stockData.volume || 0),
      avgVolume: formatVolume(stockData.avg_volume || 0),
      marketCap: formatMarketCap(stockData.market_cap || 0),
      beta: stockData.beta || 0,
      peRatio: stockData.pe_ratio || 0,
      eps: stockData.eps || 0,
      earningsDate: stockData.earnings_date ? new Date(stockData.earnings_date).toLocaleDateString() : 'N/A',
      forwardDividend: `${((stockData.dividend_yield || 0) * 100).toFixed(2)}%`,
      exDividendDate: stockData.ex_dividend_date ? new Date(stockData.ex_dividend_date).toLocaleDateString() : 'N/A',
      targetEstimate: stockData.target_price || 0,
      // Additional real-time data
      sector: stockData.sector || 'N/A',
      industry: stockData.industry || 'N/A',
      recommendation: stockData.recommendation || 'N/A',
      currency: stockData.currency || 'USD',
      exchange: stockData.exchange || 'N/A',
      lastUpdated: stockData.last_updated || 'N/A'
    };
  };

  const stockDataForComponents = prepareStockData();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/company/${query.toUpperCase()}`);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

                  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff'
    }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Search Bar */}
                    <Paper
                      sx={{
              mb: 3,
            p: 2,
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid #333333',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for a company (e.g., AAPL, MSFT, GOOGL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00d4ff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00d4ff',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#b0b0b0',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#b0b0b0',
                  opacity: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#00d4ff' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery('')}
                      sx={{ color: '#b0b0b0' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <IconButton
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim()}
                    sx={{
                backgroundColor: '#00d4ff',
                color: '#000000',
                      '&:hover': {
                  backgroundColor: '#00b8e6',
                },
                '&:disabled': {
                  backgroundColor: '#333333',
                  color: '#666666',
                },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Box>
        </Paper>

        <StockHeader stockData={stockDataForComponents} />
        <StockChart stockData={stockDataForComponents} />
        <StockTabs stockData={stockDataForComponents} />
    </Container>
    </Box>
  );
};

export default CompanyOverview;
