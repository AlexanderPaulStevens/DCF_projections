import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockHeaderProps {
  stockData: StockData;
}

export function StockHeader({ stockData }: StockHeaderProps) {
  const isPositive = stockData.change >= 0;

  return (
    <Box sx={{
      borderBottom: '1px solid #333333',
      pb: 3,
      mb: 3
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" sx={{
              fontWeight: 600,
              color: '#ffffff',
              fontSize: { xs: '1.875rem', md: '2.25rem' }
            }}>
              {stockData.name}
            </Typography>
            <Typography variant="h6" sx={{
              color: '#b0b0b0',
              fontSize: { xs: '1.125rem', md: '1.25rem' }
            }}>
              ({stockData.symbol})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h2" sx={{
              fontWeight: 700,
              color: '#ffffff',
              fontSize: { xs: '2.5rem', md: '3rem' }
            }}>
              ${stockData.price.toFixed(2)}
            </Typography>
            <Chip
              icon={isPositive ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
              label={`${isPositive ? '+' : ''}${stockData.change.toFixed(2)} (${isPositive ? '+' : ''}${stockData.changePercent.toFixed(2)}%)`}
              sx={{
                backgroundColor: isPositive ? '#4caf50' : '#f44336',
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
          <Typography variant="body2" sx={{
            color: '#b0b0b0',
            mt: 1,
            fontSize: '0.875rem'
          }}>
            At close: December 13, 2024 4:00PM EST
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Box sx={{
            backgroundColor: 'rgba(25, 25, 25, 0.6)',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: '1px solid #333333'
          }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
              Market Status
            </Typography>
            <Typography variant="body1" sx={{
              fontWeight: 600,
              color: '#ffffff',
              fontSize: '0.875rem'
            }}>
              Closed
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
