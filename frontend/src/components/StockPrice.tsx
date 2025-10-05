import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  ButtonGroup,
} from '@mui/material';
import { APIService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const StockPrice: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [stockData, setStockData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6mo');

  const periods = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
    { label: '2Y', value: '2y' },
    { label: '5Y', value: '5y' },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const fetchHistoricalData = useCallback(async (period: string) => {
    if (!ticker) return;

    try {
      setHistoricalLoading(true);
      const data = await APIService.getHistoricalData(ticker, period);
      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setHistoricalLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;

      try {
        setLoading(true);
        const [stock, company] = await Promise.all([
          APIService.getStockData(ticker),
          APIService.getCompanyInfo(ticker)
        ]);

        setStockData(stock);
        setCompanyData(company);
        setError(null);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock price data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchHistoricalData(selectedPeriod);
  }, [ticker, selectedPeriod, fetchHistoricalData]);



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };


  // Chart configuration
  const getChartOptions = () => {
    // Determine the appropriate time unit based on data range
    let timeUnit: 'minute' | 'hour' | 'day' = 'day';
    let maxTicks = 6;

    if (selectedPeriod === '1d' && historicalData?.data) {
      // Check if we have intraday data (same day)
      const firstDate = new Date(historicalData.data[0]?.date);
      const lastDate = new Date(historicalData.data[historicalData.data.length - 1]?.date);
      const timeDiff = lastDate.getTime() - firstDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff <= 24 && firstDate.toDateString() === lastDate.toDateString()) {
        // Same day, use minute intervals
        timeUnit = 'minute';
        maxTicks = 12;
      } else {
        // Multiple days, use hour intervals
        timeUnit = 'hour';
        maxTicks = 8;
      }
    } else if (selectedPeriod === '5d') {
      timeUnit = 'hour';
      maxTicks = 8;
    } else {
      timeUnit = 'day';
      maxTicks = 6;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(0, 212, 255, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time' as const,
          time: {
            displayFormats: {
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy',
              year: 'yyyy',
            },
            unit: timeUnit,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#b0b0b0',
            maxTicksLimit: maxTicks,
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#b0b0b0',
            callback: function(value: any) {
              return '$' + value.toFixed(2);
            },
          },
        },
      },
    };
  };

  const getChartData = () => {
    if (!historicalData?.data) {
      return {
        datasets: [
          {
            label: 'Price',
            data: [],
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#00d4ff',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
        ],
      };
    }

    // For intraday data (1d), we might have too many points, so optimize display
    let data = historicalData.data;
    if (selectedPeriod === '1d' && data.length > 200) {
      // Sample every 2nd point for better performance while maintaining detail
      data = data.filter((_: any, index: number) => index % 2 === 0);
    }

    const chartData = data.map((point: any) => ({
      x: new Date(point.date),
      y: point.close,
    }));

    return {
      datasets: [
        {
          label: 'Price',
          data: chartData,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderWidth: selectedPeriod === '1d' ? 1.5 : 2,
          fill: true,
          tension: selectedPeriod === '1d' ? 0 : 0.1, // No smoothing for intraday
          pointRadius: 0,
          pointHoverRadius: selectedPeriod === '1d' ? 4 : 6,
          pointHoverBackgroundColor: '#00d4ff',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!stockData || !companyData) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No stock data available for {ticker}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Main Stock Price Card */}
      <Card
        sx={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
            borderColor: 'rgba(0, 212, 255, 0.4)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Time Period Selector */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 600 }}>
              Historical Price Chart
            </Typography>
            <ButtonGroup
              variant="outlined"
              sx={{
                '& .MuiButton-root': {
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  color: '#b0b0b0',
                  '&:hover': {
                    borderColor: 'rgba(0, 212, 255, 0.6)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.3)',
                    },
                  },
                },
              }}
            >
              {periods.map((period) => (
                <Button
                  key={period.value}
                  onClick={() => handlePeriodChange(period.value)}
                  variant={selectedPeriod === period.value ? 'contained' : 'outlined'}
                >
                  {period.label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Historical Price Chart */}
      <Card
        sx={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
            borderColor: 'rgba(0, 212, 255, 0.4)',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Price Chart
            </Typography>

            {/* Time Period Selector */}
            <ButtonGroup
              variant="outlined"
              sx={{
                '& .MuiButton-root': {
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  color: '#b0b0b0',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: 'rgba(0, 212, 255, 0.6)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 255, 0.3)',
                    },
                  },
                },
              }}
            >
              {[
                { value: '1d', label: '1D' },
                { value: '5d', label: '5D' },
                { value: '1mo', label: '1M' },
                { value: '3mo', label: '3M' },
                { value: '6mo', label: '6M' },
                { value: '1y', label: '1Y' },
                { value: '2y', label: '2Y' },
                { value: '5y', label: '5Y' },
              ].map((period) => (
                <Button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  variant={selectedPeriod === period.value ? 'contained' : 'outlined'}
                >
                  {period.label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>

          {/* Chart Content */}
          {historicalLoading ? (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 8,
              color: '#00d4ff'
            }}>
              <CircularProgress sx={{ mr: 2 }} />
              <Typography variant="body1">
                Loading chart data...
              </Typography>
            </Box>
          ) : historicalData && historicalData.data ? (
            <Box>
              {/* Interactive Chart */}
              <Box sx={{
                height: 400,
                mb: 3,
                background: 'rgba(25, 25, 25, 0.6)',
                borderRadius: 2,
                p: 2,
                border: '1px solid rgba(0, 212, 255, 0.1)'
              }}>
                <Line
                  data={getChartData()}
                  options={getChartOptions()}
                />
              </Box>

              {/* Price Summary */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Period: {selectedPeriod.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {historicalData.data.length} data points
                  </Typography>
                </Box>

                {/* Price Range */}
                {historicalData.data.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Period High
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                        {formatCurrency(Math.max(...historicalData.data.map((d: any) => d.high).filter(Boolean)))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Period Low
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600 }}>
                        {formatCurrency(Math.min(...historicalData.data.map((d: any) => d.low).filter(Boolean)))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Avg Volume
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 600 }}>
                        {((historicalData.data.reduce((sum: number, d: any) => sum + (d.volume || 0), 0) / historicalData.data.length) / 1e6).toFixed(1)}M
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 8,
              color: '#b0b0b0'
            }}>
              <Typography variant="body1">
                No chart data available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Stock Metrics Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Market Cap */}
        <Box>
          <Card
            sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.4)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }}
                />
                Market Cap
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                ${(stockData.market_cap / 1e9).toFixed(2)}B
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total market value
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Volume */}
        <Box>
          <Card
            sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.4)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                  }}
                />
                Volume
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                {(stockData.volume / 1e6).toFixed(2)}M
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shares traded today
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 52 Week High */}
        <Box>
          <Card
            sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.4)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                  }}
                />
                52 Week High
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#10b981',
                  mb: 1,
                }}
              >
                {formatCurrency(stockData.fifty_two_week_high)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Highest price in 52 weeks
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 52 Week Low */}
        <Box>
          <Card
            sx={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.4)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                  }}
                />
                52 Week Low
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#ef4444',
                  mb: 1,
                }}
              >
                {formatCurrency(stockData.fifty_two_week_low)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lowest price in 52 weeks
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default StockPrice;
