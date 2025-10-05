import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { PlayArrow, Refresh } from "@mui/icons-material";
import {
  APIService,
  AnalystRecommendation as AnalystRecommendationType,
} from "../services/api";

const AnalystRecommendation: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [recommendation, setRecommendation] =
    useState<AnalystRecommendationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const data = await APIService.getAnalystRecommendation(ticker);
      setRecommendation(data);
    } catch (err) {
      console.error("Error fetching analyst recommendation:", err);
      setError("Failed to load analyst recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setRecommendation(null);
    setError(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const getRecommendationColor = (
    rec: AnalystRecommendationType["recommendation"],
  ) => {
    switch (rec) {
      case "STRONG_BUY":
      case "BUY":
        return "#10b981";
      case "STRONG_SELL":
      case "SELL":
        return "#ef4444";
      case "HOLD":
      default:
        return "#ffd93d";
    }
  };

  const getRiskColor = (risk: AnalystRecommendationType["risk_level"]) => {
    switch (risk) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#ffd93d";
      case "HIGH":
        return "#ff6b6b";
      case "VERY_HIGH":
        return "#ef4444";
      default:
        return "#b0b0b0";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
            mb: 2,
          }}
        >
          AI Financial Analysis
        </Typography>
        <Typography variant="h6" sx={{ color: "#b0b0b0", mb: 4 }}>
          Get AI-powered investment recommendations for {ticker}
        </Typography>

        {/* Action Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={
            loading ? (
              <CircularProgress size={20} sx={{ color: "#ffffff" }} />
            ) : (
              <PlayArrow />
            )
          }
          onClick={runAnalysis}
          disabled={loading}
          sx={{
            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
            boxShadow: "0 12px 40px rgba(0, 212, 255, 0.3)",
            borderRadius: 12,
            px: 6,
            py: 2,
            fontSize: "1.1rem",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #0099cc 0%, #006699 100%)",
              boxShadow: "0 16px 50px rgba(0, 212, 255, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "rgba(0, 212, 255, 0.3)",
              color: "rgba(255, 255, 255, 0.5)",
            },
          }}
        >
          {loading ? "Analyzing..." : "Run AI Analysis"}
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={resetAnalysis}
              sx={{ color: "#ef4444" }}
            >
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress
            sx={{
              color: "#00d4ff",
              width: 60,
              height: 60,
              mb: 3,
            }}
          />
          <Typography
            variant="h6"
            sx={{ color: "#ffffff", fontWeight: 600, mb: 2 }}
          >
            AI Analysis in Progress
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#b0b0b0", maxWidth: 500, mx: "auto" }}
          >
            Our AI is analyzing {ticker} using advanced financial models and
            market data. This may take a few moments...
          </Typography>
        </Box>
      )}

      {/* Recommendation Display */}
      {recommendation && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Reset Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Run a new analysis">
              <IconButton
                onClick={resetAnalysis}
                sx={{
                  color: "#00d4ff",
                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 212, 255, 0.2)",
                    borderColor: "rgba(0, 212, 255, 0.4)",
                  },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Main Recommendation Card */}
          <Card
            sx={{
              background: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: 16,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(0, 212, 255, 0.2)",
                borderColor: "rgba(0, 212, 255, 0.4)",
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Recommendation Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
                  }}
                >
                  AI Recommendation
                </Typography>
                <Chip
                  label={recommendation.recommendation.replace("_", " ")}
                  sx={{
                    backgroundColor: getRecommendationColor(
                      recommendation.recommendation,
                    ),
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    padding: "8px 16px",
                    height: "auto",
                    borderRadius: 8,
                    boxShadow: `0 4px 15px ${getRecommendationColor(recommendation.recommendation)}33`,
                  }}
                />
              </Box>

              {/* Price Analysis */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 4,
                  mb: 4,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                  >
                    Price Analysis
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Current Price
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        {formatCurrency(recommendation.current_price)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Target Price
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#00d4ff", fontWeight: 600 }}
                      >
                        {formatCurrency(recommendation.target_price)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Upside Potential
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#10b981", fontWeight: 600 }}
                      >
                        {formatPercentage(recommendation.upside_potential)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Risk Assessment */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                  >
                    Risk Assessment
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Confidence Score
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#00d4ff", fontWeight: 600 }}
                      >
                        {recommendation.confidence_score}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Risk Level
                      </Typography>
                      <Chip
                        label={recommendation.risk_level.replace("_", " ")}
                        sx={{
                          backgroundColor: getRiskColor(
                            recommendation.risk_level,
                          ),
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          height: "auto",
                          borderRadius: 6,
                          padding: "4px 8px",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Price to Intrinsic Value
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#ffd93d", fontWeight: 600 }}
                      >
                        {recommendation.price_to_intrinsic_ratio.toFixed(2)}x
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Key Metrics */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
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
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      backgroundColor: "rgba(0, 212, 255, 0.1)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      P/E Ratio
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {recommendation.key_metrics.pe_ratio
                        ? recommendation.key_metrics.pe_ratio.toFixed(2)
                        : "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      backgroundColor: "rgba(0, 212, 255, 0.1)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Beta
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {recommendation.key_metrics.beta
                        ? recommendation.key_metrics.beta.toFixed(2)
                        : "N/A"}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      backgroundColor: "rgba(0, 212, 255, 0.1)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Market Cap
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      $
                      {(recommendation.key_metrics.market_cap / 1e9).toFixed(2)}
                      B
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 2,
                      backgroundColor: "rgba(0, 212, 255, 0.1)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      WACC
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {formatPercentage(recommendation.key_metrics.wacc)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Reasoning */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                >
                  AI Analysis Reasoning
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "rgba(0, 212, 255, 0.05)",
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid rgba(0, 212, 255, 0.1)",
                  }}
                >
                  {Array.isArray(recommendation.reasoning) ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {recommendation.reasoning.map((reason, index) => (
                        <Typography
                          key={index}
                          variant="body1"
                          sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
                        >
                          • {reason}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
                    >
                      {recommendation.reasoning}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Risks and Opportunities */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 3,
                }}
              >
                {/* Key Risks */}
                {recommendation.key_risks &&
                  recommendation.key_risks.length > 0 && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ color: "#ef4444", mb: 2, fontWeight: 600 }}
                      >
                        Key Risks
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {recommendation.key_risks.map((risk, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            sx={{ color: "#b0b0b0", lineHeight: 1.5 }}
                          >
                            • {risk}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                {/* Key Opportunities */}
                {recommendation.key_opportunities &&
                  recommendation.key_opportunities.length > 0 && (
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ color: "#10b981", mb: 2, fontWeight: 600 }}
                      >
                        Key Opportunities
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {recommendation.key_opportunities.map(
                          (opportunity, index) => (
                            <Typography
                              key={index}
                              variant="body2"
                              sx={{ color: "#b0b0b0", lineHeight: 1.5 }}
                            >
                              • {opportunity}
                            </Typography>
                          ),
                        )}
                      </Box>
                    </Box>
                  )}
              </Box>

              {/* Analyst Notes */}
              {recommendation.analyst_notes && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                  >
                    Analyst Notes
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: "rgba(0, 212, 255, 0.05)",
                      p: 3,
                      borderRadius: 2,
                      border: "1px solid rgba(0, 212, 255, 0.1)",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
                    >
                      {recommendation.analyst_notes}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Timestamp */}
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: "1px solid rgba(0, 212, 255, 0.2)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#666", fontSize: "0.75rem" }}
                >
                  Analysis completed:{" "}
                  {new Date(recommendation.analysis_timestamp).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AnalystRecommendation;
