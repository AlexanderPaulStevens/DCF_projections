import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Fade,
} from '@mui/material';
import {
  Analytics,
} from '@mui/icons-material';

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
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Enhanced Moving Lines Background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
      }}>
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: 'absolute',
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: line.id % 3 === 0 ? '3px' : '2px',
              height: line.id % 4 === 0 ? '120px' : '80px',
              background: `linear-gradient(180deg,
                transparent,
                rgba(0, 212, 255, 0.2),
                rgba(0, 212, 255, 0.6),
                rgba(0, 212, 255, 0.8),
                rgba(0, 212, 255, 0.6),
                rgba(0, 212, 255, 0.2),
                transparent
              )`,
              opacity: line.opacity * 0.8,
              transform: `rotate(${45 + (line.id % 3) * 15}deg)`,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 20px rgba(0, 212, 255, 0.3)`,
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Fade in timeout={1000}>
          <Box sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Logo */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <img
                src="/logo_horizon.png"
                alt="Horizon Logo"
                style={{
                  width: '350px',
                  height: 'auto',
                  filter: 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.4))',
                }}
              />
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 800,
                background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                textShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
              }}
            >
              Analyze, Understand, Invest
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: '#b0b0b0',
                mb: 4,
                fontWeight: 400,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              <br />
            </Typography>

            {/* Main CTA Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 8 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Analytics />}
                onClick={() => navigate('/company/AAPL/analysis')}
                sx={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  px: 8,
                  py: 3,
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  boxShadow: '0 12px 40px rgba(0, 212, 255, 0.4)',
                  textTransform: 'none',
                  minWidth: '300px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 50px rgba(0, 212, 255, 0.6)',
                  },
                }}
              >
                Company Analysis
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default CompanySearch;
