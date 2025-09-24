import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, ToggleButton, ToggleButtonGroup, CircularProgress, Switch, FormControlLabel, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
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
  const [showIndicators, setShowIndicators] = useState(false);
  const [showForecast, setShowForecast] = useState(true);
  const [forecastScenario, setForecastScenario] = useState('base');
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
      const data = await APIService.getHistoricalData(stockData.symbol, yahooPeriod, showForecast);
      console.log('✅ Historical data loaded:', data);
      setHistoricalData(data);
    } catch (err) {
      console.error('❌ Error loading historical data:', err);
      setError(`Failed to load historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [stockData?.symbol, showForecast]);

  useEffect(() => {
    if (stockData?.symbol) {
      loadHistoricalData(selectedPeriod);
    }
  }, [stockData?.symbol, selectedPeriod, loadHistoricalData]);

  // Convert historical data to chart format
  const convertToChartData = (data: HistoricalData) => {
    const historicalPoints = data.data.map((item, index) => {
      const date = new Date(item.Date);
      const isIntraday = selectedPeriod === '1D';


      return {
        [isIntraday ? 'time' : 'date']: isIntraday ?
          date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
          date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: parseFloat(item.Close.toFixed(2)),
        volume: item.Volume,
        type: 'historical' as const
      };
    });

    // Add forecast data if available
    if (data.forecast && showForecast) {
      // Get the last historical price to ensure continuity
      const lastHistoricalPrice = historicalPoints[historicalPoints.length - 1]?.price || data.forecast.current_price;

      const forecastPoints = data.forecast.forecast_dates.map((dateStr, index) => {
        const date = new Date(dateStr);
        const isIntraday = selectedPeriod === '1D';

        // Start with the last historical price for the first forecast point
        let basePrice = index === 0 ? lastHistoricalPrice : data.forecast!.forecast_values[index];

        // Apply scenario adjustments
        let price = basePrice;
        let confidenceLower = data.forecast!.confidence_lower;
        let confidenceUpper = data.forecast!.confidence_upper;

        if (forecastScenario === 'conservative') {
          price = basePrice * 0.95; // 5% lower
          confidenceLower = confidenceLower * 0.9;
          confidenceUpper = confidenceUpper * 0.9;
        } else if (forecastScenario === 'optimistic') {
          price = basePrice * 1.05; // 5% higher
          confidenceLower = confidenceLower * 1.1;
          confidenceUpper = confidenceUpper * 1.1;
        }

        return {
          [isIntraday ? 'time' : 'date']: isIntraday ?
            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
            date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: parseFloat(price.toFixed(2)),
          confidence_lower: parseFloat(confidenceLower.toFixed(2)),
          confidence_upper: parseFloat(confidenceUpper.toFixed(2)),
          type: 'forecast' as const
        };
      });

      return [...historicalPoints, ...forecastPoints];
    }

    return historicalPoints;
  };


  // Get chart data - use real data if available, otherwise fallback
  const getChartData = () => {
    if (historicalData && historicalData.data.length > 0) {
      return convertToChartData(historicalData);
    }

    // Fallback data if API fails
    return [
      { date: 'No Data', price: stockData?.price || 0, volume: 0 }
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
    const hasForecast = showForecast && historicalData?.forecast;

    // Helper function to get the reference line value
    const getReferenceLineValue = () => {
      const forecastItem = (chartData as any[]).find((d: any) => d.type === 'forecast');
      return forecastItem ? forecastItem[xAxisKey] : undefined;
    };

    if (chartType === 'area') {
      return (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis dataKey={xAxisKey} stroke="#b0b0b0" fontSize={12} />
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#b0b0b0" fontSize={12} />
          <Tooltip
            formatter={(value, name, props) => {
              if (name === 'price') return [`$${value}`, props.payload.type === 'forecast' ? 'Forecast Price' : 'Historical Price'];
              if (name === 'confidence_upper') return [`$${value}`, 'High Estimate'];
              if (name === 'confidence_lower') return [`$${value}`, 'Low Estimate'];
              return [value, name];
            }}
            labelStyle={{ color: '#ffffff' }}
            contentStyle={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '8px'
            }}
          />
          {hasForecast && (
            <>
              <ReferenceLine x={getReferenceLineValue()} stroke="#666666" strokeDasharray="5 5" />
              {/* Forecast uncertainty band */}
              <Area
                dataKey="confidence_upper"
                stroke="none"
                fill="url(#forecastGradient)"
                fillOpacity={0.3}
              />
              <Area
                dataKey="confidence_lower"
                stroke="none"
                fill="#111111"
                fillOpacity={1}
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#00d4ff"
            fill="url(#colorGradient)"
            strokeWidth={2}
            dot={(props) => {
              const { payload } = props;
              if (payload?.type === 'historical') {
                return <circle cx={props.cx} cy={props.cy} r={3} fill="#00d4ff" strokeWidth={2} />;
              }
              return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
            }}
          />
          {hasForecast && (
            <Line
              type="monotone"
              dataKey="price"
              stroke="#ff6b35"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={(props) => {
                const { payload } = props;
                if (payload?.type === 'forecast') {
                  return <circle cx={props.cx} cy={props.cy} r={3} fill="#ff6b35" strokeWidth={2} />;
                }
                return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
              }}
            />
          )}
        </AreaChart>
      );
    }

    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
        <XAxis dataKey={xAxisKey} stroke="#b0b0b0" fontSize={12} />
        <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#b0b0b0" fontSize={12} />
        <Tooltip
          formatter={(value, name, props) => {
            if (name === 'price') return [`$${value}`, props.payload.type === 'forecast' ? 'Forecast Price' : 'Historical Price'];
            if (name === 'confidence_upper') return [`$${value}`, 'High Estimate'];
            if (name === 'confidence_lower') return [`$${value}`, 'Low Estimate'];
            return [value, name];
          }}
          labelStyle={{ color: '#ffffff' }}
          contentStyle={{
            backgroundColor: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px'
          }}
        />
        {hasForecast && (
          <ReferenceLine x={getReferenceLineValue()} stroke="#666666" strokeDasharray="5 5" />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#00d4ff"
          strokeWidth={3}
          dot={(props) => {
            const { payload } = props;
            if (payload?.type === 'historical') {
              return <circle cx={props.cx} cy={props.cy} r={4} fill="#00d4ff" strokeWidth={2} />;
            }
            return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
          }}
        />
        {hasForecast && (
          <Line
            type="monotone"
            dataKey="price"
            stroke="#ff6b35"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={(props) => {
              const { payload } = props;
              if (payload?.type === 'forecast') {
                return <circle cx={props.cx} cy={props.cy} r={4} fill="#ff6b35" strokeWidth={2} />;
              }
              return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />;
            }}
          />
        )}
      </LineChart>
    );
  };

  return (
    <Box sx={{
      backgroundColor: 'transparent',
      p: 0,
      borderRadius: 0,
      border: 'none',
      mb: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Google-style header with price info */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        px: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            color: '#ffffff',
            fontSize: '1.8rem'
          }}>
            ${stockData?.price?.toFixed(2) || '0.00'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{
              color: stockData?.change && stockData.change >= 0 ? '#4caf50' : '#f44336',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              {stockData?.change && stockData.change >= 0 ? '+' : ''}${stockData?.change?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body1" sx={{
              color: stockData?.change && stockData.change >= 0 ? '#4caf50' : '#f44336',
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              ({stockData?.changePercent && stockData.changePercent >= 0 ? '+' : ''}{stockData?.changePercent?.toFixed(2) || '0.00'}%)
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'contained' : 'text'}
              size="small"
              onClick={() => setSelectedPeriod(period)}
              sx={{
                minWidth: 32,
                height: 32,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                ...(selectedPeriod === period ? {
                  backgroundColor: '#00d4ff',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#0099cc',
                  }
                } : {
                  color: '#b0b0b0',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    color: '#00d4ff',
                  }
                })
              }}
            >
              {period}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Forecast toggle - simplified */}
      {showForecast && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          px: 1
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00d4ff',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#00d4ff',
                    },
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                Show Forecast
              </Typography>
            }
          />
          {historicalData?.forecast && (
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              Target: ${historicalData.forecast.forecast_price.toFixed(2)}
            </Typography>
          )}
        </Box>
      )}

      {/* Chart container */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
