import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Assessment, Calculate } from "@mui/icons-material";
import { APIService, DCFAnalysis as DCFAnalysisType } from "../services/api";

const DCFAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [dcfData, setDcfData] = useState<DCFAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadDCFAnalysis = useCallback(async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getDCFAnalysis(companyTicker);
      setDcfData(data);
    } catch (err) {
      setError("Failed to load DCF analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ticker) {
      loadDCFAnalysis(ticker);
    }
  }, [ticker, loadDCFAnalysis]);

  const handleRunAnalysis = () => {
    if (ticker) {
      loadDCFAnalysis(ticker);
    }
  };

  const formatCurrency = (value: any) => {
    try {
      if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
        if (value > 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
        if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
        if (value > 1000) return `$${(value / 1000).toFixed(2)}K`;
        return `$${value.toFixed(2)}`;
      }
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };

  const formatPercentage = (value: any) => {
    try {
      if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
        return `${(value * 100).toFixed(2)}%`;
      }
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={80} sx={{ mb: 3, color: "#00d4ff" }} />
            <Typography variant="h5" sx={{ color: "#b0b0b0", mb: 2 }}>
              Running DCF Analysis...
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#888888", maxWidth: "600px" }}
            >
              {ticker
                ? `Loading DCF analysis for ${ticker}...`
                : "Loading DCF analysis..."}
            </Typography>
            <Typography variant="body2" sx={{ color: "#666666", mt: 2 }}>
              Calculating discounted cash flow valuation...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !dcfData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: "rgba(17, 17, 17, 0.8)",
            border: "1px solid #333333",
          }}
        >
          {error || "DCF analysis not found"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Analysis Warning */}
      {dcfData.analysis_warning && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            backgroundColor: "rgba(255, 193, 7, 0.1)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            color: "#ffc107",
            "& .MuiAlert-icon": {
              color: "#ffc107",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ⚠️ {dcfData.analysis_warning}
          </Typography>
        </Alert>
      )}

      {/* Data Source Status */}
      {dcfData.scraping_status && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            background: "rgba(0, 212, 255, 0.1)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#00d4ff" }}
          >
            📊 {dcfData.scraping_status}
          </Typography>
        </Alert>
      )}

      {dcfData.analysis_warning && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            background: "rgba(255, 193, 7, 0.1)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#ffc107" }}
          >
            ⚠️ {dcfData.analysis_warning}
          </Typography>
        </Alert>
      )}

      {/* DCF Analysis Control */}
      <Card
        sx={{
          mb: 4,
          background: "rgba(17, 17, 17, 0.8)",
          border: "1px solid #333333",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "#ffffff",
              mb: 3,
            }}
          >
            DCF Analysis Control
          </Typography>

          <Typography variant="body1" sx={{ color: "#b0b0b0", mb: 3 }}>
            Click the button below to run a fresh DCF analysis using the latest
            cached financial data.
          </Typography>

          <Button
            variant="contained"
            startIcon={<Calculate />}
            onClick={handleRunAnalysis}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: "1rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
              borderRadius: 2,
              "&:hover": {
                background: "linear-gradient(135deg, #0099cc 0%, #006699 100%)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Run DCF Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Base Case Results */}
      <Card
        sx={{
          mb: 4,
          background: "rgba(17, 17, 17, 0.8)",
          border: "1px solid #333333",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "#ffffff",
              mb: 3,
            }}
          >
            Base Case Results
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {Object.entries(dcfData.base_results || {})
              .filter(([key, value]) => {
                // Filter out projections and any non-primitive values
                if (key === "projections") return false;
                if (typeof value === "object" && value !== null) return false;
                if (typeof value === "function") return false;
                return true;
              })
              .map(([key, value]) => (
                <Paper
                  key={key}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    border: "1px solid #333333",
                    background: "rgba(34, 34, 34, 0.8)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#b0b0b0",
                    }}
                  >
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "#ffffff" }}
                  >
                    {key.toLowerCase().includes("growth")
                      ? formatPercentage(value)
                      : formatCurrency(value)}
                  </Typography>
                </Paper>
              ))}
          </Box>
        </CardContent>
      </Card>

      {/* Projections Table */}
      {dcfData.base_results?.projections &&
        typeof dcfData.base_results.projections === "object" && (
          <Card
            sx={{
              mb: 4,
              background: "rgba(17, 17, 17, 0.8)",
              border: "1px solid #333333",
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: "#ffffff",
                  mb: 3,
                }}
              >
                Financial Projections
              </Typography>

              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: "none",
                  border: "1px solid #333333",
                  background: "rgba(34, 34, 34, 0.8)",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#ffffff",
                          backgroundColor: "rgba(51, 51, 51, 0.8)",
                        }}
                      >
                        Year
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#ffffff",
                          backgroundColor: "rgba(51, 51, 51, 0.8)",
                        }}
                      >
                        Revenue
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#ffffff",
                          backgroundColor: "rgba(51, 51, 51, 0.8)",
                        }}
                      >
                        EBIT
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#374151",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        FCF
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#ffffff",
                          backgroundColor: "rgba(51, 51, 51, 0.8)",
                        }}
                      >
                        D&A
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(dcfData.base_results.projections)
                      .filter(
                        ([year, data]) =>
                          typeof data === "object" && data !== null,
                      )
                      .map(([year, data]: [string, any]) => (
                        <TableRow
                          key={year}
                          hover
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(51, 51, 51, 0.3)",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: "#ffffff" }}>
                            {year}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: "#ffffff" }}>
                            {formatCurrency(data.Revenue)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: "#ffffff" }}>
                            {formatCurrency(data.EBIT)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: "#ffffff" }}>
                            {formatCurrency(data.FCF)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: "#ffffff" }}>
                            {formatCurrency(data["D&A"])}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => navigate(`/company/${ticker}/ratios`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: 2,
            minWidth: 180,
            border: "2px solid",
            borderColor: "#00d4ff",
            color: "#00d4ff",
            "&:hover": {
              background: "rgba(0, 212, 255, 0.1)",
              borderColor: "#0099cc",
              transform: "translateY(-2px)",
            },
          }}
        >
          Financial Ratios
        </Button>
      </Box>
    </Container>
  );
};

export default DCFAnalysis;
