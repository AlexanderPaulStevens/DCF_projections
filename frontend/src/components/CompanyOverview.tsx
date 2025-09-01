import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Avatar,
  Chip,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { ArrowBack, TrendingUp, Assessment, ShowChart, TrendingDown, TrendingFlat, Search } from '@mui/icons-material';
import { APIService, CompanyOverview as CompanyOverviewType } from '../services/api';

const CompanyOverview: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<CompanyOverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (ticker) {
      loadCompanyOverview(ticker);
    }
  }, [ticker]);

  const loadCompanyOverview = async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading company overview for:', companyTicker);
      const data = await APIService.getCompanyOverview(companyTicker);
      console.log('📊 Company data received:', data);
      setOverview(data);
    } catch (err) {
      console.error('❌ Error loading company overview:', err);
      setError('Failed to load company overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = () => {
    // Mock performance indicator - in real app, this would come from API
    const performance = Math.random();
    if (performance > 0.6) return 'success';
    if (performance > 0.3) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = () => {
    const performance = Math.random();
    if (performance > 0.6) return <TrendingUp />;
    if (performance > 0.3) return <TrendingFlat />;
    return <TrendingDown />;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await APIService.searchCompanies(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCompanySelect = (selectedTicker: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/company/${selectedTicker}`);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={80} sx={{ mb: 3, color: '#00d4ff' }} />
            <Typography variant="h5" sx={{ color: '#b0b0b0' }}>
              Loading company data...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !overview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
          {error || 'Company not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          ← Back to Home
        </Button>

        {/* Company Header Card */}
        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid #333333',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mr: 3,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
                }}
              >
                {ticker?.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {ticker}
                </Typography>
                <Typography variant="h5" sx={{ color: '#b0b0b0', mb: 2 }}>
                  Company Overview
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    icon={getPerformanceIcon()}
                    label="Live Performance"
                    color={getPerformanceColor() as any}
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        fontSize: '1.2rem',
                      }
                    }}
                  />
                  <Chip
                    label="S&P 500"
                    variant="outlined"
                    sx={{
                      borderColor: '#00d4ff',
                      color: '#00d4ff',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={handleSearchOpen}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderColor: '#0099cc',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Search Companies
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<Assessment />}
          onClick={() => navigate(`/company/${ticker}/ratios`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            borderRadius: 2,
            minWidth: 180,
            '&:hover': {
              background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 24px rgba(0, 212, 255, 0.4)',
            }
          }}
        >
          📊 Financial Ratios
        </Button>
        <Button
          variant="outlined"
          startIcon={<TrendingUp />}
          onClick={() => navigate(`/company/${ticker}/dcf`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            minWidth: 180,
            border: '2px solid',
            borderColor: '#00d4ff',
            color: '#00d4ff',
            '&:hover': {
              background: 'rgba(0, 212, 255, 0.1)',
              borderColor: '#4ddfff',
              transform: 'translateY(-1px)',
            }
          }}
        >
          💰 DCF Analysis
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShowChart />}
          onClick={() => navigate(`/company/${ticker}/sensitivity`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            minWidth: 180,
            border: '2px solid',
            borderColor: '#00d4ff',
            color: '#00d4ff',
            '&:hover': {
              background: 'rgba(0, 212, 255, 0.1)',
              borderColor: '#4ddfff',
              transform: 'translateY(-1px)',
            }
          }}
        >
          📈 Sensitivity Analysis
        </Button>
      </Box>

      {/* Company Overview Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
        {/* Company Information Card */}
        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid #333333',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              🏢 Company Information
            </Typography>

            {overview.overview && Object.keys(overview.overview).length > 0 ? (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3
              }}>
                {Object.entries(overview.overview).map(([key, value], index) => {
                  // Define icons and colors for different data types
                  const getIconAndColor = (key: string) => {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('market') || lowerKey.includes('cap')) return { icon: '💰', color: '#00d4ff' };
                    if (lowerKey.includes('revenue') || lowerKey.includes('sales')) return { icon: '📈', color: '#00ff88' };
                    if (lowerKey.includes('profit') || lowerKey.includes('earnings')) return { icon: '💎', color: '#ff6b35' };
                    if (lowerKey.includes('debt') || lowerKey.includes('liability')) return { icon: '⚠️', color: '#ff6b35' };
                    if (lowerKey.includes('cash') || lowerKey.includes('asset')) return { icon: '🏦', color: '#00ff88' };
                    if (lowerKey.includes('ratio') || lowerKey.includes('p/e')) return { icon: '📊', color: '#00d4ff' };
                    if (lowerKey.includes('dividend') || lowerKey.includes('yield')) return { icon: '🎯', color: '#ffd700' };
                    if (lowerKey.includes('sector') || lowerKey.includes('industry')) return { icon: '🏭', color: '#9c88ff' };
                    if (lowerKey.includes('employee') || lowerKey.includes('staff')) return { icon: '👥', color: '#ff6b9d' };
                    return { icon: '📋', color: '#00d4ff' };
                  };

                  const { icon, color } = getIconAndColor(key);

                  return (
                    <Paper
                      key={key}
                      sx={{
                        p: 3,
                        background: 'rgba(25, 25, 25, 0.6)',
                        border: '1px solid #444444',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: color,
                          boxShadow: `0 8px 25px rgba(0, 0, 0, 0.3)`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          fontSize: '1.5rem',
                          mr: 2,
                          filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.1))',
                        }}>
                          {icon}
                        </Box>
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#b0b0b0',
                          fontSize: '0.8rem',
                        }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                      </Box>

                      <Typography variant="h6" sx={{
                        fontWeight: 700,
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {typeof value === 'number'
                          ? value > 1000000
                            ? `$${(value / 1000000).toFixed(2)}M`
                            : value > 1000
                              ? `$${(value / 1000).toFixed(2)}K`
                              : value.toLocaleString()
                          : String(value)
                        }
                      </Typography>

                      {/* Progress bar for numerical values */}
                      {typeof value === 'number' && value > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <Box sx={{
                              width: `${Math.min((value / 1000000000) * 100, 100)}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
                              borderRadius: '2px',
                              transition: 'width 0.8s ease',
                            }} />
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 2 }}>
                  No company information available
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Company data may still be loading or unavailable
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card sx={{
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid #333333',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              ⚡ Quick Actions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Assessment />}
                onClick={() => navigate(`/company/${ticker}/ratios`)}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(0, 212, 255, 0.4)',
                  }
                }}
              >
                📊 View Financial Ratios
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUp />}
                onClick={() => navigate(`/company/${ticker}/dcf`)}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderColor: '#4ddfff',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(0, 212, 255, 0.2)',
                  }
                }}
              >
                💰 Run DCF Analysis
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ShowChart />}
                onClick={() => navigate(`/company/${ticker}/sensitivity`)}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderColor: '#4ddfff',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(0, 212, 255, 0.2)',
                  }
                }}
              >
                📈 Sensitivity Analysis
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Company Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.95)',
            border: '1px solid #333333',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{
          color: '#ffffff',
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}>
          🔍 Search Companies
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search by company name or ticker"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#00d4ff' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
                '& .MuiInputBase-input': { color: '#ffffff' }
              }}
            />
          </Box>

          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={40} sx={{ color: '#00d4ff' }} />
            </Box>
          ) : searchResults.length > 0 ? (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {searchResults.map((company, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    onClick={() => handleCompanySelect(company.ticker)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {company.ticker}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: '#b0b0b0' }}>
                          {company.name || company.ticker}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : searchQuery && !searchLoading ? (
            <Typography sx={{ color: '#b0b0b0', textAlign: 'center', py: 2 }}>
              No companies found. Try a different search term.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSearchOpen(false)}
            sx={{
              color: '#b0b0b0',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSearch}
            variant="contained"
            startIcon={<Search />}
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              }
            }}
          >
            Search
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanyOverview;
