import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';

const CompanySearch: React.FC = () => {
  const navigate = useNavigate();

  // Moving lines animation
  const [lines, setLines] = useState<Array<{ id: number; x: number; y: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    // Initialize moving lines
    const initialLines = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.5 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.4,
    }));
    setLines(initialLines);

    // Animate lines
    const interval = setInterval(() => {
      setLines(prevLines =>
        prevLines.map(line => ({
          ...line,
          y: (line.y - line.speed) % 100,
          opacity: 0.3 + Math.sin(Date.now() * 0.001 + line.id) * 0.4,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#000000',
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
      }}>
        {/* Prominent Moving Lines */}
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: 'absolute',
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: line.id % 3 === 0 ? '4px' : line.id % 2 === 0 ? '3px' : '2px',
              height: line.id % 4 === 0 ? '150px' : line.id % 3 === 0 ? '120px' : '100px',
              background: `linear-gradient(180deg,
                transparent,
                rgba(0, 212, 255, 0.4),
                rgba(0, 212, 255, 0.8),
                rgba(0, 212, 255, 1),
                rgba(0, 212, 255, 0.8),
                rgba(0, 212, 255, 0.4),
                transparent
              )`,
              opacity: line.opacity * 1.5,
              transform: `rotate(${45 + (line.id % 3) * 15}deg)`,
              filter: 'blur(0.3px)',
              boxShadow: `
                0 0 15px rgba(0, 212, 255, 0.8),
                0 0 30px rgba(0, 212, 255, 0.5),
                0 0 45px rgba(0, 212, 255, 0.3)
              `,
              animation: 'pulse 3s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: line.opacity * 1.2,
                  transform: `rotate(${45 + (line.id % 3) * 15}deg) scale(1)`,
                },
                '50%': {
                  opacity: line.opacity * 2,
                  transform: `rotate(${45 + (line.id % 3) * 15}deg) scale(1.1)`,
                },
              },
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box sx={{
          textAlign: 'center',
          py: { xs: 8, md: 12 },
          position: 'relative',
          zIndex: 1,
        }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3rem', md: '4.5rem' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              textShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
            }}
          >
          </Typography>

          {/* Logo */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo_horizon.png"
              alt="Horizon Logo"
              style={{
                width: '400px',
                height: 'auto',
                filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))',
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              color: '#b0b0b0',
              mb: 4,
              fontWeight: 400,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.4,
            }}
          >
            Understand, Project, Invest
          </Typography>
        </Box>

        {/* Company Analysis Button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 6,
        }}>
          <Paper
            sx={{
              background: 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid #333333',
              borderRadius: 4,
              p: 6,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              maxWidth: '500px',
              width: '100%',
              '&:hover': {
                transform: 'translateY(-8px)',
                borderColor: '#00d4ff',
                boxShadow: '0 8px 32px rgba(0, 212, 255, 0.2)',
              },
            }}
            onClick={() => navigate('/company/AAPL')}
          >
            <TrendingUp sx={{ fontSize: 64, color: '#00d4ff', mb: 3 }} />
            <Typography variant="h4" sx={{ color: '#ffffff', mb: 2, fontWeight: 700 }}>
              Company Analysis
            </Typography>
            <Typography variant="h6" sx={{ color: '#b0b0b0', mb: 3, lineHeight: 1.5 }}>
              Deep dive into company financials, DCF valuations, and stock price forecasting
            </Typography>
            <Typography variant="body1" sx={{ color: '#00d4ff', fontWeight: 600 }}>
              Click to explore →
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default CompanySearch;
