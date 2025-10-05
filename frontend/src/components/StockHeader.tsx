import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated?: string;
  marketStatus?: 'open' | 'closed';
}

interface StockHeaderProps {
  stockData: StockData;
}

export function StockHeader({ stockData }: StockHeaderProps) {
  const isPositive = stockData.change >= 0;

  // Determine market status and format date
  const getMarketInfo = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    // Market hours: 9:30 AM - 4:00 PM EST (930 - 960 minutes)
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    const isMarketOpen = dayOfWeek >= 1 && dayOfWeek <= 5 &&
                        currentTime >= marketOpen && currentTime < marketClose;

    const marketStatus = isMarketOpen ? 'open' : 'closed';

    // Format the date for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
    };

    return {
      status: marketStatus,
      statusText: isMarketOpen ? 'Open' : 'Closed',
      lastCloseDate: formatDate(now)
    };
  };

  const marketInfo = getMarketInfo();

  return (
    <Box sx={{
      borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
      pb: 3,
      mb: 3,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(10px)',
      borderRadius: 2,
      p: 3,
      border: '1px solid rgba(0, 212, 255, 0.1)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              color: '#ffffff',
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {stockData.name}
            </Typography>
            <Typography variant="h6" sx={{
              color: '#b0b0b0',
              fontSize: { xs: '1.125rem', md: '1.25rem' },
              fontWeight: 600,
            }}>
              ({stockData.symbol})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h2" sx={{
              fontWeight: 800,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3rem' },
              textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            }}>
              ${stockData.price.toFixed(2)}
            </Typography>
            <Chip
              icon={isPositive ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
              label={`${isPositive ? '+' : ''}${stockData.change.toFixed(2)} (${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%)`}
              sx={{
                backgroundColor: isPositive ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                color: isPositive ? '#00d4ff' : '#ff6b6b',
                fontWeight: 600,
                fontSize: '0.875rem',
                height: 32,
                border: `1px solid ${isPositive ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                backdropFilter: 'blur(10px)',
                '& .MuiChip-icon': {
                  color: isPositive ? '#00d4ff' : '#ff6b6b'
                }
              }}
            />
          </Box>
          <Typography variant="body2" sx={{
            color: '#b0b0b0',
            mt: 1,
            fontSize: '0.875rem'
          }}>
            {marketInfo.status === 'open' ? 'Live data' : `At close: ${marketInfo.lastCloseDate}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(0, 212, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
              Market Status
            </Typography>
            <Typography variant="body1" sx={{
              fontWeight: 600,
              color: marketInfo.status === 'open' ? '#00d4ff' : '#ff6b6b',
              fontSize: '0.875rem'
            }}>
              {marketInfo.statusText}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
