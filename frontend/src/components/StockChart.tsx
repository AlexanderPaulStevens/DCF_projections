import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { APIService, HistoricalData } from '../services/api';

interface StockChartProps {
  stockData?: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  };
}

export function StockChart({ stockData }: StockChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  const [chartType, setChartType] = useState('line');
  const [showIndicators, setShowIndicators] = useState(true);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('🎯 StockChart received stockData:', stockData);
  console.log('📊 StockChart symbol:', stockData?.symbol);

  // Map frontend periods to Yahoo Finance periods
  const mapPeriod = (period: string): string => {
    const periodMap: { [key: string]: string } = {
      '1D': '1d',
      '5D': '5d',
      '1M': '1mo',
      '3M': '3mo',
      '6M': '6mo',
      '1Y': '1y',
      '5Y': '5y'
    };
    return periodMap[period] || '6mo';
  };

  const loadHistoricalData = useCallback(async (period: string) => {
    if (!stockData?.symbol) return;

    try {
      setLoading(true);
      setError(null);
      const yahooPeriod = mapPeriod(period);
      console.log('🔍 Loading historical data for:', stockData.symbol, 'period:', period, '-> yahoo:', yahooPeriod);
      const data = await APIService.getHistoricalData(stockData.symbol, yahooPeriod);
      console.log('✅ Historical data loaded:', data);
      setHistoricalData(data);
    } catch (err) {
      console.error('❌ Error loading historical data:', err);
      setError(`Failed to load historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [stockData?.symbol]);

  useEffect(() => {
    if (stockData?.symbol) {
      loadHistoricalData(selectedPeriod);
    }
  }, [stockData?.symbol, selectedPeriod, loadHistoricalData]);

  // Convert historical data to chart format
  const convertToChartData = (data: HistoricalData) => {
    return data.data.map((item, index) => {
      const date = new Date(item.Date);
      const isIntraday = selectedPeriod === '1D';

      // Calculate simple moving averages (simplified)
      const sma20 = index >= 19 ?
        data.data.slice(index - 19, index + 1).reduce((sum, d) => sum + d.Close, 0) / 20 :
        item.Close;
      const sma50 = index >= 49 ?
        data.data.slice(index - 49, index + 1).reduce((sum, d) => sum + d.Close, 0) / 50 :
        item.Close;

      // Calculate RSI (simplified)
      const rsi = Math.min(100, Math.max(0, 50 + (item.Close - sma20) / sma20 * 100));

      // Calculate Bollinger Bands (simplified)
      const stdDev = index >= 19 ?
        Math.sqrt(data.data.slice(index - 19, index + 1).reduce((sum, d) => sum + Math.pow(d.Close - sma20, 2), 0) / 20) :
        0;
      const bollingerUpper = sma20 + (2 * stdDev);
      const bollingerLower = sma20 - (2 * stdDev);

      return {
        [isIntraday ? 'time' : 'date']: isIntraday ?
          date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
          date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: parseFloat(item.Close.toFixed(2)),
        volume: item.Volume,
        sma20: parseFloat(sma20.toFixed(2)),
        sma50: parseFloat(sma50.toFixed(2)),
        rsi: parseFloat(rsi.toFixed(1)),
        macd: parseFloat((item.Close - sma20).toFixed(2)),
        bollinger_upper: parseFloat(bollingerUpper.toFixed(2)),
        bollinger_lower: parseFloat(bollingerLower.toFixed(2))
      };
    });
  };


  // Get chart data - use real data if available, otherwise fallback
  const getChartData = () => {
    if (historicalData && historicalData.data.length > 0) {
      return convertToChartData(historicalData);
    }

    // Fallback data if API fails
    return [
      { date: 'No Data', price: stockData?.price || 0, volume: 0, sma20: 0, sma50: 0, rsi: 50, macd: 0, bollinger_upper: 0, bollinger_lower: 0 }
    ];
  };

  const chartData = getChartData();
  const periods = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2, color: '#00d4ff' }} />
          <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
            Loading Chart Data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography variant="body1" sx={{ color: '#f44336' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  const renderChart = () => {
    const xAxisKey = selectedPeriod === '1D' ? 'time' : 'date';

    if (chartType === 'area') {
      return (
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis dataKey={xAxisKey} stroke="#b0b0b0" fontSize={12} />
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#b0b0b0" fontSize={12} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'price') return [`$${value}`, 'Price'];
              if (name === 'sma20') return [`$${value}`, 'SMA 20'];
              if (name === 'sma50') return [`$${value}`, 'SMA 50'];
              if (name === 'bollinger_upper') return [`$${value}`, 'BB Upper'];
              if (name === 'bollinger_lower') return [`$${value}`, 'BB Lower'];
              return [value, name];
            }}
            labelStyle={{ color: '#ffffff' }}
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '8px'
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#00d4ff"
            fill="url(#colorGradient)"
            strokeWidth={2}
          />
          {showIndicators && (
            <>
              <Line type="monotone" dataKey="sma20" stroke="#ff9800" strokeWidth={1} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="sma50" stroke="#4caf50" strokeWidth={1} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="bollinger_upper" stroke="#f44336" strokeWidth={1} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="bollinger_lower" stroke="#f44336" strokeWidth={1} strokeDasharray="3 3" />
            </>
          )}
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
        </AreaChart>
      );
    }

    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
        <XAxis dataKey={xAxisKey} stroke="#b0b0b0" fontSize={12} />
        <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#b0b0b0" fontSize={12} />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'price') return [`$${value}`, 'Price'];
            if (name === 'sma20') return [`$${value}`, 'SMA 20'];
            if (name === 'sma50') return [`$${value}`, 'SMA 50'];
            if (name === 'bollinger_upper') return [`$${value}`, 'BB Upper'];
            if (name === 'bollinger_lower') return [`$${value}`, 'BB Lower'];
            if (name === 'rsi') return [`${value}`, 'RSI'];
            if (name === 'macd') return [`${value}`, 'MACD'];
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
          dataKey="price"
          stroke="#00d4ff"
          strokeWidth={3}
          dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
        />
        {showIndicators && (
          <>
            <Line type="monotone" dataKey="sma20" stroke="#ff9800" strokeWidth={1} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="sma50" stroke="#4caf50" strokeWidth={1} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="bollinger_upper" stroke="#f44336" strokeWidth={1} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="bollinger_lower" stroke="#f44336" strokeWidth={1} strokeDasharray="3 3" />
          </>
        )}
      </LineChart>
    );
  };

  return (
    <Box sx={{
      backgroundColor: 'rgba(17, 17, 17, 0.8)',
      p: 3,
      borderRadius: 2,
      border: '1px solid #333333',
      mb: 3
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3
      }}>
        <Typography variant="h6" sx={{
          fontWeight: 600,
          color: '#ffffff'
        }}>
          AAPL Technical Analysis
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => newType && setChartType(newType)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: '#b0b0b0',
                borderColor: '#333333',
                '&.Mui-selected': {
                  backgroundColor: '#00d4ff',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#0099cc',
                  }
                }
              }
            }}
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="area">Area</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={showIndicators ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setShowIndicators(!showIndicators)}
            sx={{
              minWidth: 100,
              height: 32,
              fontSize: '0.875rem',
              ...(showIndicators ? {
                backgroundColor: '#00d4ff',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#0099cc',
                }
              } : {
                borderColor: '#333333',
                color: '#b0b0b0',
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  borderColor: '#00d4ff',
                }
              })
            }}
          >
            {showIndicators ? 'Hide Indicators' : 'Show Indicators'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {periods.map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSelectedPeriod(period)}
            sx={{
              minWidth: 40,
              height: 28,
              fontSize: '0.75rem',
              ...(selectedPeriod === period ? {
                backgroundColor: '#00d4ff',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#0099cc',
                }
              } : {
                borderColor: '#333333',
                color: '#b0b0b0',
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  borderColor: '#00d4ff',
                }
              })
            }}
          >
            {period}
          </Button>
        ))}
      </Box>

      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </Box>

      {showIndicators && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 2, backgroundColor: '#ff9800' }} />
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
              SMA 20
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 2, backgroundColor: '#4caf50' }} />
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
              SMA 50
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 1, backgroundColor: '#f44336', borderTop: '1px dashed #f44336' }} />
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
              Bollinger Bands
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
