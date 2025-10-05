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

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: 80, px: 3, justifyContent: "space-between" }}>
        {/* Logo matching landing page */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
          onClick={() => navigate("/")}
        >
          <img
            src="/logo_horizon.png"
            alt="Horizon Logo"
            style={{
              height: "40px",
              width: "auto",
              filter: "drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))",
            }}
          />
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            position: "relative",
            width: "400px",
            maxWidth: "50%",
          }}
        >
          <TextField
            fullWidth
            placeholder="Search for another company..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? (
                    <CircularProgress size={20} sx={{ color: "#00d4ff" }} />
                  ) : (
                    <Search sx={{ color: "#00d4ff" }} />
                  )}
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: 2,
                fontSize: "0.9rem",
                py: 0.5,
                "&:hover": {
                  borderColor: "rgba(0, 212, 255, 0.5)",
                },
                "&.Mui-focused": {
                  borderColor: "#00d4ff",
                  boxShadow: "0 0 10px rgba(0, 212, 255, 0.3)",
                },
                "& fieldset": {
                  border: "none",
                },
              },
              "& .MuiInputBase-input": {
                color: "#ffffff",
                "&::placeholder": {
                  color: "#b0b0b0",
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
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: 2,
                boxShadow: "0 8px 32px rgba(0, 212, 255, 0.2)",
                zIndex: 1000,
                maxHeight: "250px",
                overflow: "auto",
              }}
            >
              <List>
                {searchResults.slice(0, 8).map((company, index) => (
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
