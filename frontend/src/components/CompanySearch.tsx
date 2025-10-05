import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { APIService } from "../services/api";

const CompanySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Moving lines animation
  const [lines, setLines] = useState<
    Array<{ id: number; x: number; y: number; speed: number; opacity: number }>
  >([]);

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
      setLines((prevLines) =>
        prevLines.map((line) => ({
          ...line,
          y: (line.y - line.speed) % 100,
          opacity: 0.3 + Math.sin(Date.now() * 0.001 + line.id) * 0.4,
        })),
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
      console.error("Search error:", error);
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
    background:
      "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#b0b0b0",
    accent: "#00d4ff",
    glowColor: "rgba(0, 212, 255, 0.5)",
    topBar: "rgba(0, 0, 0, 0.8)",
    logoPath: "/logo_horizon.png",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 60% 60%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)
        `,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.02) 0%, transparent 70%)
          `,
          pointerEvents: "none",
        },
      }}
    >
      {/* Enhanced Moving Lines Background */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: "absolute",
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: line.id % 3 === 0 ? "3px" : "2px",
              height: line.id % 4 === 0 ? "120px" : "80px",
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
              filter: "blur(0.5px)",
              boxShadow: `0 0 20px rgba(0, 212, 255, 0.3)`,
            }}
          />
        ))}
      </Box>

      {/* Top Bar */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: theme.topBar,
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${theme.accent}20`,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          px: 3,
          pointerEvents: "auto",
        }}
      >
        {/* Logo in top bar */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src={theme.logoPath}
            alt="Horizon Logo"
            style={{
              height: "40px",
              width: "auto",
            }}
          />
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, pt: 10 }}>
        {/* Hero Section */}
        <Fade in timeout={1000}>
          <Box
            sx={{
              textAlign: "center",
              py: { xs: 8, md: 12 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Enhanced Logo */}
            <Box
              sx={{
                mb: 6,
                display: "flex",
                justifyContent: "center",
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "400px",
                  height: "400px",
                  background:
                    "radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)",
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  animation: "pulse 3s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": {
                      transform: "translate(-50%, -50%) scale(1)",
                      opacity: 0.3,
                    },
                    "50%": {
                      transform: "translate(-50%, -50%) scale(1.1)",
                      opacity: 0.6,
                    },
                  },
                },
              }}
            >
              <img
                src={theme.logoPath}
                alt="Horizon Logo"
                style={{
                  width: "380px",
                  height: "auto",
                  filter: `drop-shadow(0 0 40px ${theme.glowColor})`,
                  transition: "all 0.3s ease",
                }}
              />
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "3rem", md: "5rem" },
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, #00d4ff 0%, #4ddfff 30%, #ffffff 70%, #00d4ff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 3,
                textShadow: `0 0 60px ${theme.glowColor}`,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                animation: "textGlow 2s ease-in-out infinite alternate",
                "@keyframes textGlow": {
                  "0%": {
                    filter: "drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))",
                  },
                  "100%": {
                    filter: "drop-shadow(0 0 40px rgba(0, 212, 255, 0.6))",
                  },
                },
              }}
            >
              Analyze, Understand, Invest.
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#a1a1aa",
                mb: 6,
                maxWidth: "700px",
                mx: "auto",
                lineHeight: 1.7,
                fontWeight: 400,
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                textAlign: "center",
                background:
                  "linear-gradient(135deg, #a1a1aa 0%, #ffffff 50%, #a1a1aa 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            ></Typography>

            {/* Search Bar */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 8,
                position: "relative",
                width: "100%",
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              <TextField
                fullWidth
                placeholder="Search for a company (e.g., AAPL, Apple, Microsoft)"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {isSearching ? (
                        <CircularProgress
                          size={28}
                          sx={{
                            color: theme.accent,
                            filter:
                              "drop-shadow(0 0 12px rgba(0, 212, 255, 0.6))",
                          }}
                        />
                      ) : (
                        <Search
                          sx={{
                            color: theme.accent,
                            fontSize: "1.5rem",
                            filter:
                              "drop-shadow(0 0 8px rgba(0, 212, 255, 0.4))",
                          }}
                        />
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(10, 10, 10, 0.9)",
                    border: `2px solid rgba(0, 212, 255, 0.3)`,
                    borderRadius: 16,
                    fontSize: "1.25rem",
                    py: 1.5,
                    backdropFilter: "blur(20px)",
                    boxShadow: `0 12px 40px rgba(0, 212, 255, 0.2)`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      borderColor: "rgba(0, 212, 255, 0.5)",
                      boxShadow: `0 16px 60px rgba(0, 212, 255, 0.3)`,
                      backgroundColor: "rgba(10, 10, 10, 0.95)",
                    },
                    "&.Mui-focused": {
                      borderColor: theme.accent,
                      boxShadow: `0 20px 80px rgba(0, 212, 255, 0.4)`,
                      backgroundColor: "rgba(10, 10, 10, 0.98)",
                    },
                    "& fieldset": {
                      border: "none",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: theme.textPrimary,
                    "&::placeholder": {
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
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    mt: 1,
                    backgroundColor: "rgba(0, 0, 0, 0.95)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${theme.accent}`,
                    borderRadius: 2,
                    boxShadow: `0 8px 32px ${theme.glowColor}`,
                    zIndex: 1000,
                    maxHeight: "300px",
                    overflow: "auto",
                  }}
                >
                  <List>
                    {searchResults.slice(0, 10).map((company, index) => (
                      <ListItem key={company.ticker || index} disablePadding>
                        <ListItemButton
                          onClick={() => handleCompanySelect(company.ticker)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(0, 212, 255, 0.1)",
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: theme.textPrimary,
                                    fontSize: "1rem",
                                  }}
                                >
                                  {company.name || company.company_name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: theme.accent,
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
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
                                  fontSize: "0.8rem",
                                }}
                              >
                                {company.sector ||
                                  company.industry ||
                                  "Financial Services"}
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
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.textSecondary,
                    mb: 2,
                    fontSize: "0.9rem",
                  }}
                >
                  Popular searches:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {["AAPL", "META", "NVDA", "MSFT", "TSLA"].map((ticker) => (
                    <Button
                      key={ticker}
                      variant="outlined"
                      size="small"
                      onClick={() => handleCompanySelect(ticker)}
                      sx={{
                        borderColor: theme.accent,
                        color: theme.accent,
                        backgroundColor: "transparent",
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        "&:hover": {
                          backgroundColor: "rgba(0, 212, 255, 0.1)",
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
