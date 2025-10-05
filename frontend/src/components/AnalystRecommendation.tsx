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
  Paper,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Psychology,
  Timeline,
  AttachMoney,
  Security,
  Speed,
  Visibility,
  PlayArrow,
  Refresh,
} from "@mui/icons-material";
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
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  const runAnalysis = async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setAnalysisTriggered(true);
    try {
      const data = await APIService.getAnalystRecommendation(ticker);
      setRecommendation(data);
    } catch (err) {
      console.error("Error fetching analyst recommendation:", err);
      setError("Failed to load analyst recommendation.");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setRecommendation(null);
    setError(null);
    setAnalysisTriggered(false);
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

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress
          sx={{
            color: "#00d4ff",
            width: 80,
            height: 80,
            mb: 4,
          }}
        />
        <Typography
          variant="h5"
          sx={{ color: "#ffffff", fontWeight: 600, mb: 2 }}
        >
          AI Analysis in Progress
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#b0b0b0", textAlign: "center", maxWidth: 400 }}
        >
          Our AI is analyzing {ticker} using advanced financial models and
          market data. This may take a few moments...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={resetAnalysis}
            sx={{
              borderColor: "rgba(0, 212, 255, 0.3)",
              color: "#00d4ff",
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              "&:hover": {
                borderColor: "#00d4ff",
                backgroundColor: "rgba(0, 212, 255, 0.2)",
              },
            }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  // Pre-analysis visualization
  if (!analysisTriggered) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Header */}
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
            Comprehensive investment analysis powered by advanced AI
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
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

        {/* Analysis Overview */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          {/* What We Analyze */}
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: 16,
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Assessment sx={{ color: "#00d4ff", mr: 2, fontSize: 28 }} />
                  <Typography
                    variant="h5"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    What We Analyze
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AttachMoney sx={{ color: "#10b981", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        DCF Valuation Model
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        Intrinsic value calculation based on projected cash
                        flows
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Timeline sx={{ color: "#ffd93d", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Market Metrics
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        P/E ratio, Beta, Market Cap, and price trends
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TrendingUp sx={{ color: "#4ddfff", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Growth Projections
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        Revenue growth, profit margins, and WACC analysis
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Security sx={{ color: "#ff6b6b", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Risk Assessment
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        Volatility, market risks, and financial stability
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* What You'll Get */}
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                borderRadius: 16,
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Psychology sx={{ color: "#00d4ff", mr: 2, fontSize: 28 }} />
                  <Typography
                    variant="h5"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    What You'll Get
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TrendingUp sx={{ color: "#10b981", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Investment Recommendation
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        Strong Buy, Buy, Hold, Sell, or Strong Sell
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AttachMoney sx={{ color: "#ffd93d", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Target Price & Upside
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        AI-calculated target price and potential returns
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Speed sx={{ color: "#4ddfff", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Confidence Score
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        AI confidence level in the recommendation
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Visibility sx={{ color: "#ff6b6b", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        Detailed Analysis
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                        Key risks, opportunities, and reasoning
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Analysis Process */}
        <Card
          sx={{
            background: "rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: 16,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                }}
              />
              Analysis Process
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    1
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", fontWeight: 600, mb: 1 }}
                >
                  Data Collection
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                  Gather financial data, market metrics, and DCF analysis
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    2
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", fontWeight: 600, mb: 1 }}
                >
                  AI Processing
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                  Advanced AI analyzes patterns and market conditions
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    3
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", fontWeight: 600, mb: 1 }}
                >
                  Risk Assessment
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                  Evaluate risks and opportunities comprehensively
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 32px rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "#ffffff", fontWeight: 700 }}
                  >
                    4
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", fontWeight: 600, mb: 1 }}
                >
                  Recommendation
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                  Generate actionable investment recommendation
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Show analysis results if available
  if (!recommendation) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No analyst recommendation available for {ticker}
        </Alert>
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={resetAnalysis}
            sx={{
              borderColor: "rgba(0, 212, 255, 0.3)",
              color: "#00d4ff",
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              "&:hover": {
                borderColor: "#00d4ff",
                backgroundColor: "rgba(0, 212, 255, 0.2)",
              },
            }}
          >
            Run New Analysis
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
              }}
            >
              AI Analyst Recommendation
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

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            {/* Price Information */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                >
                  Price Analysis
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            </Box>

            {/* Risk Assessment */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
                >
                  Risk Assessment
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
          </Box>

          {/* Key Financial Metrics */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                }}
              />
              Key Financial Metrics
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row", md: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    P/E Ratio
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#00d4ff", fontWeight: 600 }}
                  >
                    {recommendation.key_metrics.pe_ratio.toFixed(2)}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Beta
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#00d4ff", fontWeight: 600 }}
                  >
                    {recommendation.key_metrics.beta.toFixed(2)}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Market Cap
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#00d4ff", fontWeight: 600 }}
                  >
                    ${(recommendation.key_metrics.market_cap / 1e9).toFixed(2)}B
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    WACC
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#00d4ff", fontWeight: 600 }}
                  >
                    {formatPercentage(recommendation.key_metrics.wacc * 100)}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>

          {/* Reasoning */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                }}
              />
              Reasoning
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recommendation.reasoning.map((reason, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#00d4ff",
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: "#ffffff", lineHeight: 1.6 }}
                  >
                    {reason}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Key Risks and Opportunities */}
          {(recommendation.key_risks?.length > 0 ||
            recommendation.key_opportunities?.length > 0) && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 3,
              }}
            >
              {/* Key Risks */}
              {recommendation.key_risks?.length > 0 && (
                <Card
                  sx={{
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 16,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease-in-out",
                    flex: 1,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(239, 68, 68, 0.2)",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "#ef4444",
                        mb: 3,
                      }}
                    >
                      Key Risks
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {recommendation.key_risks.map((risk, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#ef4444",
                              mt: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{ color: "#ffffff", lineHeight: 1.6 }}
                          >
                            {risk}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Key Opportunities */}
              {recommendation.key_opportunities?.length > 0 && (
                <Card
                  sx={{
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: 16,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease-in-out",
                    flex: 1,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(16, 185, 129, 0.2)",
                      borderColor: "rgba(16, 185, 129, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "#10b981",
                        mb: 3,
                      }}
                    >
                      Key Opportunities
                    </Typography>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {recommendation.key_opportunities.map(
                        (opportunity, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: "#10b981",
                                mt: 1,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="body1"
                              sx={{ color: "#ffffff", lineHeight: 1.6 }}
                            >
                              {opportunity}
                            </Typography>
                          </Box>
                        ),
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Detailed Analysis Notes */}
          <Card
            sx={{
              background: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: 16,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease-in-out",
              mt: 4,
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(0, 212, 255, 0.2)",
                borderColor: "rgba(0, 212, 255, 0.4)",
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 3,
                }}
              >
                Detailed Analyst Notes
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#b0b0b0",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {recommendation.analyst_notes}
              </Typography>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalystRecommendation;
