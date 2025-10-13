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

  const getEvaluationIcon = (evaluation: string) => {
    switch (evaluation) {
      case "good":
        return <TrendingUp />;
      case "bad":
        return <TrendingDown />;
      default:
        return <TrendingFlat />;
    }
  };

  const getEvaluationLabel = (evaluation: string) => {
    switch (evaluation) {
      case "good":
        return "Good";
      case "bad":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  const getEvaluationColor = (evaluation: string): "success" | "error" | "default" => {
    switch (evaluation) {
      case "good":
        return "success";
      case "bad":
        return "error";
      default:
        return "default";
    }
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
                  const flatRatios: Array<[string, any, string]> = [];
                  if (ratios.ratios) {
                    Object.entries(ratios.ratios).forEach(
                      ([category, categoryRatios]) => {
                        if (
                          typeof categoryRatios === "object" &&
                          categoryRatios !== null
                        ) {
                          Object.entries(categoryRatios).forEach(
                            ([key, ratioData]) => {
                              if (
                                ratioData &&
                                typeof ratioData === "object" &&
                                ratioData.value !== null
                              ) {
                                flatRatios.push([key, ratioData, category]);
                              }
                            },
                          );
                        }
                      },
                    );
                  }
                  return flatRatios.map(([key, ratioData, category]) => (
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
                        {formatRatio(ratioData.value)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getEvaluationIcon(ratioData.evaluation)}
                          label={getEvaluationLabel(ratioData.evaluation)}
                          size="small"
                          color={getEvaluationColor(ratioData.evaluation)}
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
