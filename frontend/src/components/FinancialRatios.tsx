import React, { useState, useEffect } from "react";
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";
import {
  APIService,
  FinancialRatios as FinancialRatiosType,
} from "../services/api";

const FinancialRatios: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [ratios, setRatios] = useState<FinancialRatiosType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticker) {
      loadFinancialRatios(ticker);
    }
  }, [ticker]);

  const loadFinancialRatios = async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getFinancialRatios(companyTicker);
      setRatios(data);
    } catch (err) {
      setError("Failed to load financial ratios. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRatioColor = (value: number, metric: string) => {
    // Mock logic for ratio coloring - in real app, this would be based on industry benchmarks
    if (metric.includes("P/E") || metric.includes("Price")) {
      return value < 20 ? "success" : value < 30 ? "warning" : "error";
    }
    if (metric.includes("Yield") || metric.includes("Return")) {
      return value > 0.05 ? "success" : value > 0.02 ? "warning" : "error";
    }
    if (metric.includes("Debt") || metric.includes("Leverage")) {
      return value < 0.5 ? "success" : value < 0.7 ? "warning" : "error";
    }
    return "default";
  };

  const getRatioIcon = (value: number, metric: string) => {
    const color = getRatioColor(value, metric);
    if (color === "success") return <TrendingUp />;
    if (color === "error") return <TrendingDown />;
    return <TrendingFlat />;
  };

  const formatRatio = (value: any) => {
    if (typeof value === "number") {
      if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (value > 1000) return `$${(value / 1000).toFixed(2)}K`;
      if (value > 0 && value < 1) return `${(value * 100).toFixed(2)}%`;
      return value.toFixed(2);
    }
    return value;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={80} sx={{ mb: 3, color: "#00d4ff" }} />
            <Typography variant="h5" sx={{ color: "#b0b0b0" }}>
              Loading financial ratios...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !ratios) {
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
          {error || "Financial ratios not found"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Key Metrics Summary */}
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
              background: "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 3,
            }}
          >
            Key Financial Metrics
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
            {(() => {
              const flatRatios: Array<[string, number]> = [];
              if (ratios.ratios) {
                Object.entries(ratios.ratios).forEach(
                  ([category, categoryRatios]) => {
                    if (
                      typeof categoryRatios === "object" &&
                      categoryRatios !== null
                    ) {
                      Object.entries(categoryRatios).forEach(([key, value]) => {
                        if (typeof value === "number") {
                          flatRatios.push([key, value]);
                        }
                      });
                    }
                  },
                );
              }
              return flatRatios.slice(0, 8).map(([key, value]) => (
                <Paper
                  key={key}
                  sx={{
                    p: 3,
                    textAlign: "center",
                    background: "rgba(25, 25, 25, 0.6)",
                    border: "1px solid #444444",
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
                    {key}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "#ffffff" }}
                  >
                    {formatRatio(value)}
                  </Typography>
                  <Chip
                    icon={getRatioIcon(value, key)}
                    label={
                      getRatioColor(value, key) === "success"
                        ? "Good"
                        : getRatioColor(value, key) === "warning"
                          ? "Fair"
                          : "Poor"
                    }
                    size="small"
                    color={getRatioColor(value, key) as any}
                    sx={{ mt: 1, fontWeight: 500 }}
                  />
                </Paper>
              ));
            })()}
          </Box>
        </CardContent>
      </Card>

      {/* Detailed Ratios Table */}
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
              background: "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 3,
            }}
          >
            Comprehensive Financial Ratios
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              boxShadow: "none",
              background: "rgba(25, 25, 25, 0.6)",
              border: "1px solid #444444",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#b0b0b0",
                      backgroundColor: "rgba(40, 40, 40, 0.8)",
                    }}
                  >
                    Metric
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#b0b0b0",
                      backgroundColor: "rgba(40, 40, 40, 0.8)",
                    }}
                  >
                    Value
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#b0b0b0",
                      backgroundColor: "rgba(40, 40, 40, 0.8)",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#b0b0b0",
                      backgroundColor: "rgba(40, 40, 40, 0.8)",
                    }}
                  >
                    Category
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const flatRatios: Array<[string, number, string]> = [];
                  if (ratios.ratios) {
                    Object.entries(ratios.ratios).forEach(
                      ([category, categoryRatios]) => {
                        if (
                          typeof categoryRatios === "object" &&
                          categoryRatios !== null
                        ) {
                          Object.entries(categoryRatios).forEach(
                            ([key, value]) => {
                              if (typeof value === "number") {
                                flatRatios.push([key, value, category]);
                              }
                            },
                          );
                        }
                      },
                    );
                  }
                  return flatRatios.map(([key, value, category]) => (
                    <TableRow
                      key={key}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(0, 212, 255, 0.05)",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500, color: "#ffffff" }}>
                        {key}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#ffffff" }}>
                        {formatRatio(value)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRatioIcon(value, key)}
                          label={
                            getRatioColor(value, key) === "success"
                              ? "Good"
                              : getRatioColor(value, key) === "warning"
                                ? "Fair"
                                : "Poor"
                          }
                          size="small"
                          color={getRatioColor(value, key) as any}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#00d4ff",
                            color: "#00d4ff",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<TrendingUp />}
          onClick={() => navigate(`/company/${ticker}/dcf`)}
          sx={{
            py: 2,
            px: 4,
            fontSize: "1.1rem",
            fontWeight: 600,
            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
            borderRadius: 2,
            minWidth: 180,
            "&:hover": {
              background: "linear-gradient(135deg, #0099cc 0%, #006699 100%)",
              transform: "translateY(-1px)",
            },
          }}
        >
          DCF Analysis
        </Button>
      </Box>
    </Container>
  );
};

export default FinancialRatios;
