import React from 'react';
import { Container, Box, Typography, Card, CardContent } from '@mui/material';
import MarketOverview from './MarketOverview';

const MarketsPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
          Learn About Markets
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
          Start your financial education journey with real market data
        </Typography>
        <Typography variant="body2" sx={{ color: '#999', maxWidth: '600px' }}>
          Understanding how markets work is the first step to becoming a smart investor.
          Here you can explore real companies and learn what makes them valuable.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Main Market Table */}
        <Box>
          <MarketOverview />
        </Box>

        {/* Additional Market Widgets */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 3 }}>
                Market Indices
              </Typography>
              {/* Market indices content would go here */}
              <Typography variant="body2" sx={{ color: '#666' }}>
                Market indices data will be displayed here
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 3 }}>
                Sector Performance
              </Typography>
              {/* Sector performance content would go here */}
              <Typography variant="body2" sx={{ color: '#666' }}>
                Sector performance data will be displayed here
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default MarketsPage;
