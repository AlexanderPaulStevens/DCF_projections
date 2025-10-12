import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { APIService } from "../services/api";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

    // Debounce search (reduced to 150ms since we're using cached data)
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 150);

    return () => clearTimeout(timeoutId);
  };

  const handleCompanySelect = (ticker: string) => {
    setSearchQuery("");
    setShowResults(false);
    navigate(`/company/${ticker}/stock-price`);
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.15)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        zIndex: 1200,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)",
        },
      }}
    >
      <Toolbar sx={{ minHeight: 80, px: 3, justifyContent: "space-between" }}>
        {/* Enhanced Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            "&:hover": {
              transform: "scale(1.08)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)",
              transform: "translate(-50%, -50%) scale(0)",
              transition: "transform 0.3s ease",
              borderRadius: "50%",
              pointerEvents: "none",
            },
            "&:hover::after": {
              transform: "translate(-50%, -50%) scale(1.5)",
            },
          }}
          onClick={() => navigate("/")}
        >
          <img
            src="/logo_horizon.png"
            alt="Horizon Logo"
            style={{
              height: "48px",
              width: "auto",
              filter: "drop-shadow(0 0 24px rgba(0, 212, 255, 0.5))",
              transition: "filter 0.3s ease",
            }}
          />
        </Box>

        {/* Enhanced Search Bar */}
        <Box
          sx={{
            position: "relative",
            width: "450px",
            maxWidth: "50%",
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by company name (e.g., Apple, Microsoft)"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? (
                    <CircularProgress
                      size={22}
                      sx={{
                        color: "#00d4ff",
                        filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))",
                      }}
                    />
                  ) : (
                    <Search
                      sx={{
                        color: "#00d4ff",
                        filter: "drop-shadow(0 0 8px rgba(0, 212, 255, 0.3))",
                        transition: "all 0.3s ease",
                      }}
                    />
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(10, 10, 10, 0.8)",
                border: "1.5px solid rgba(0, 212, 255, 0.2)",
                borderRadius: 16,
                fontSize: "0.95rem",
                py: 1,
                backdropFilter: "blur(10px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: "rgba(0, 212, 255, 0.4)",
                  backgroundColor: "rgba(10, 10, 10, 0.9)",
                  boxShadow: "0 0 20px rgba(0, 212, 255, 0.1)",
                },
                "&.Mui-focused": {
                  borderColor: "#00d4ff",
                  backgroundColor: "rgba(10, 10, 10, 0.95)",
                  boxShadow: "0 0 24px rgba(0, 212, 255, 0.25)",
                },
                "& fieldset": {
                  border: "none",
                },
              },
              "& .MuiInputBase-input": {
                color: "#ffffff",
                fontWeight: 500,
                "&::placeholder": {
                  color: "#a1a1aa",
                  opacity: 1,
                  fontWeight: 400,
                },
              },
            }}
          />

          {/* Enhanced Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Paper
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                mt: 2,
                backgroundColor: "rgba(10, 10, 10, 0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: 16,
                boxShadow:
                  "0 20px 60px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                zIndex: 1000,
                maxHeight: "300px",
                overflow: "auto",
                animation: "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "@keyframes slideDown": {
                  from: {
                    opacity: 0,
                    transform: "translateY(-10px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
              }}
            >
              <List sx={{ py: 1 }}>
                {searchResults.slice(0, 8).map((company, index) => (
                  <ListItem key={company.ticker || index} disablePadding>
                    <ListItemButton
                      onClick={() => handleCompanySelect(company.ticker)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        my: 0.5,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor: "rgba(0, 212, 255, 0.15)",
                          transform: "translateX(4px)",
                          boxShadow: "0 4px 16px rgba(0, 212, 255, 0.1)",
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
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: "#ffffff",
                                fontSize: "0.9rem",
                              }}
                            >
                              {company.name || company.company_name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#00d4ff",
                                fontWeight: 500,
                                fontSize: "0.8rem",
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
                              color: "#b0b0b0",
                              fontSize: "0.75rem",
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
