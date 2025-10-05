import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Fade,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import {
  Search,
} from '@mui/icons-material';
import { APIService } from '../services/api';

const CompanySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await APIService.searchCompanies(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleCompanySelect = (ticker: string) => {
    navigate(`/company/${ticker}/stock-price`);
  };

  // Theme configuration
  const theme = {
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    accent: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.5)',
    topBar: 'rgba(0, 0, 0, 0.8)',
    logoPath: '/logo_horizon.png',
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.background,
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

      {/* Top Bar */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: theme.topBar,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.accent}20`,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        pointerEvents: 'auto',
      }}>
        {/* Logo in top bar */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={theme.logoPath}
            alt="Horizon Logo"
            style={{
              height: '40px',
              width: 'auto',
            }}
          />
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 10 }}>
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
                src={theme.logoPath}
                alt="Horizon Logo"
              style={{
                width: '350px',
                height: 'auto',
                filter: `drop-shadow(0 0 30px ${theme.glowColor})`,
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
                textShadow: `0 0 40px ${theme.glowColor}`,
              }}
            >
              Analyze, Understand, Invest.
            </Typography>


            <Typography
              variant="h5"
              sx={{
                color: theme.textSecondary,
                mb: 4,
                fontWeight: 400,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              <br />
            </Typography>

            {/* Search Bar */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 8,
              position: 'relative',
              width: '100%',
              maxWidth: '600px',
              mx: 'auto'
            }}>
              <TextField
                fullWidth
                placeholder="Search for a company (e.g., AAPL, Apple, Microsoft)"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {isSearching ? (
                        <CircularProgress size={24} sx={{ color: theme.accent }} />
                      ) : (
                        <Search sx={{ color: theme.accent }} />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: `2px solid ${theme.accent}`,
                    borderRadius: 4,
                    fontSize: '1.2rem',
                    py: 1,
                    boxShadow: `0 8px 32px ${theme.glowColor}`,
                    '&:hover': {
                      borderColor: theme.accent,
                      boxShadow: `0 12px 40px ${theme.glowColor}`,
                    },
                    '&.Mui-focused': {
                      borderColor: theme.accent,
                      boxShadow: `0 16px 50px ${theme.glowColor}`,
                    },
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: theme.textPrimary,
                    '&::placeholder': {
                      color: theme.textSecondary,
                      opacity: 1,
                    },
                  },
                }}
              />

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.accent}`,
                    borderRadius: 2,
                    boxShadow: `0 8px 32px ${theme.glowColor}`,
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  <List>
                    {searchResults.slice(0, 10).map((company, index) => (
                      <ListItem key={company.ticker || index} disablePadding>
                        <ListItemButton
                          onClick={() => handleCompanySelect(company.ticker)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: theme.textPrimary,
                                    fontSize: '1rem'
                                  }}
                                >
                                  {company.name || company.company_name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: theme.accent,
                                    fontWeight: 500,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  ({company.ticker})
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: theme.textSecondary,
                                  fontSize: '0.8rem'
                                }}
                              >
                                {company.sector || company.industry || 'Financial Services'}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Popular Companies */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.textSecondary,
                    mb: 2,
                    fontSize: '0.9rem'
                  }}
                >
                  Popular searches:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['AAPL', 'META', 'NVDA', 'MSFT', 'TSLA'].map((ticker) => (
                    <Button
                      key={ticker}
                      variant="outlined"
                      size="small"
                      onClick={() => handleCompanySelect(ticker)}
                      sx={{
                        borderColor: theme.accent,
                        color: theme.accent,
                        backgroundColor: 'transparent',
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          borderColor: theme.accent,
                        },
                      }}
                    >
                      {ticker}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default CompanySearch;
