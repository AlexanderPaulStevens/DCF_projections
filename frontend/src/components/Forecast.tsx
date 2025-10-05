import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Psychology,
  Speed,
} from "@mui/icons-material";
import { APIService } from "../services/api";

interface ForecastPrediction {
  period: number;
  prediction: number;
  method: string;
  confidence_interval?: {
    lower: number;
    upper: number;
  };
  volatility_adjustment?: number;
}

interface ForecastModel {
  model_name: string;
  description: string;
  predictions: ForecastPrediction[];
  accuracy: string;
  best_for: string;
  metrics?: {
    [key: string]: number;
  };
}

interface ForecastSummary {
  total_models: number;
  average_prediction: number;
  prediction_range: {
    min: number;
    max: number;
  };
  confidence_score: number;
}

interface StockForecastResponse {
  ticker: string;
  current_price: number;
  forecast_date: string;
  models: {
    [key: string]: ForecastModel;
  };
  summary: ForecastSummary;
  disclaimer: string;
}

const Forecast: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [forecastData, setForecastData] =
    useState<StockForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecastData = useCallback(async () => {
    if (!ticker) return;

    setLoading(true);
    setError(null);
    try {
      const data = await APIService.getStockForecast(ticker);
      setForecastData(data);
    } catch (err) {
      console.error("Error fetching forecast data:", err);
      setError("Failed to load forecast predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchForecastData();
    }
  }, [ticker, fetchForecastData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy.toLowerCase()) {
      case "high":
        return "#10b981";
      case "medium":
        return "#ffd93d";
      case "low":
      case "low-medium":
        return "#ef4444";
      default:
        return "#b0b0b0";
    }
  };

  const getModelIcon = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case "moving average":
        return <Timeline />;
      case "linear regression":
        return <TrendingUp />;
      case "arima":
        return <Assessment />;
      case "exponential smoothing":
        return <Speed />;
      case "trend analysis":
        return <TrendingDown />;
      case "facebook prophet":
        return <Psychology />;
      case "neuralprophet":
        return <Psychology />;
      case "darts lstm":
        return <Psychology />;
      case "darts transformer":
        return <Psychology />;
      case "darts n-beats":
        return <Psychology />;
      case "darts linear regression":
        return <TrendingUp />;
      case "linkedin greykite":
        return <Psychology />;
      default:
        return <Psychology />;
    }
  };

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
          Generating Advanced Forecast Predictions
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#b0b0b0", textAlign: "center", maxWidth: 500 }}
        >
          Our AI is analyzing {ticker} using multiple state-of-the-art
          forecasting models including Prophet, LSTM, Transformer, N-BEATS, and
          more. This may take a few moments...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Alert
          severity="error"
          sx={{
            mb: 3,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#ef4444",
                  cursor: "pointer",
                  textDecoration: "underline",
                  "&:hover": { color: "#dc2626" },
                }}
                onClick={fetchForecastData}
              >
                Try Again
              </Typography>
            </Box>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!forecastData) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" sx={{ color: "#b0b0b0" }}>
          No forecast data available for {ticker}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
            mb: 2,
          }}
        >
          Advanced AI Forecasts
        </Typography>
        <Typography variant="h6" sx={{ color: "#b0b0b0", mb: 4 }}>
          State-of-the-art forecasting models for {ticker}
        </Typography>
      </Box>

      {/* Summary Card */}
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
            sx={{ color: "#ffffff", fontWeight: 700, mb: 3 }}
          >
            Forecast Summary
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 3,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Price
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "#ffffff", fontWeight: 700 }}
              >
                {formatCurrency(forecastData.current_price)}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Average Prediction
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "#00d4ff", fontWeight: 700 }}
              >
                {formatCurrency(forecastData.summary.average_prediction)}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Prediction Range
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#10b981", fontWeight: 600 }}
              >
                {formatCurrency(forecastData.summary.prediction_range.min)} -{" "}
                {formatCurrency(forecastData.summary.prediction_range.max)}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Confidence Score
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: "#ffd93d", fontWeight: 700 }}
              >
                {forecastData.summary.confidence_score.toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Models Grid */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Traditional Models */}
        <Box>
          <Typography
            variant="h5"
            sx={{ color: "#ffffff", fontWeight: 700, mb: 3 }}
          >
            Traditional Forecasting Models
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            {Object.entries(forecastData.models)
              .filter(([key, model]) =>
                [
                  "moving_average",
                  "linear_regression",
                  "arima",
                  "exponential_smoothing",
                  "trend_analysis",
                ].includes(key),
              )
              .map(([key, model]) => (
                <Card
                  key={key}
                  sx={{
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    borderRadius: 16,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    height: "100%",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(0, 212, 255, 0.2)",
                      borderColor: "rgba(0, 212, 255, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Model Header */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ color: "#00d4ff", mr: 2 }}>
                        {getModelIcon(model.model_name)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ color: "#ffffff", fontWeight: 700 }}
                        >
                          {model.model_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                          {model.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={model.accuracy}
                        sx={{
                          backgroundColor: getAccuracyColor(model.accuracy),
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>

                    <Divider
                      sx={{ borderColor: "rgba(0, 212, 255, 0.2)", my: 2 }}
                    />

                    {/* Predictions Table */}
                    <TableContainer
                      sx={{ backgroundColor: "transparent", boxShadow: "none" }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(0, 212, 255, 0.2)",
                              }}
                            >
                              Period
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(0, 212, 255, 0.2)",
                              }}
                            >
                              Prediction
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(0, 212, 255, 0.2)",
                              }}
                            >
                              Method
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {model.predictions.map((prediction, index) => (
                            <TableRow key={index}>
                              <TableCell
                                sx={{
                                  color: "#b0b0b0",
                                  borderColor: "rgba(0, 212, 255, 0.1)",
                                }}
                              >
                                {prediction.period} day
                                {prediction.period > 1 ? "s" : ""}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  borderColor: "rgba(0, 212, 255, 0.1)",
                                }}
                              >
                                {formatCurrency(prediction.prediction)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "#b0b0b0",
                                  borderColor: "rgba(0, 212, 255, 0.1)",
                                }}
                              >
                                {prediction.method}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Model Info */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#b0b0b0", mb: 1 }}
                      >
                        <strong>Best for:</strong> {model.best_for}
                      </Typography>
                      {model.metrics && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "#b0b0b0", mb: 0.5 }}
                          >
                            <strong>Metrics:</strong>
                          </Typography>
                          {Object.entries(model.metrics).map(
                            ([metric, value]) => (
                              <Typography
                                key={metric}
                                variant="caption"
                                sx={{ color: "#666", display: "block" }}
                              >
                                {metric}:{" "}
                                {typeof value === "number"
                                  ? value.toFixed(4)
                                  : value}
                              </Typography>
                            ),
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        </Box>

        {/* SOTA Models */}
        <Box>
          <Typography
            variant="h5"
            sx={{ color: "#ffffff", fontWeight: 700, mb: 3 }}
          >
            State-of-the-Art AI Models
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            {Object.entries(forecastData.models)
              .filter(
                ([key, model]) =>
                  ![
                    "moving_average",
                    "linear_regression",
                    "arima",
                    "exponential_smoothing",
                    "trend_analysis",
                  ].includes(key),
              )
              .map(([key, model]) => (
                <Card
                  key={key}
                  sx={{
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: 16,
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    height: "100%",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 40px rgba(99, 102, 241, 0.2)",
                      borderColor: "rgba(99, 102, 241, 0.4)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Model Header */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ color: "#6366f1", mr: 2 }}>
                        {getModelIcon(model.model_name)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ color: "#ffffff", fontWeight: 700 }}
                        >
                          {model.model_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                          {model.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={model.accuracy}
                        sx={{
                          backgroundColor: getAccuracyColor(model.accuracy),
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>

                    <Divider
                      sx={{ borderColor: "rgba(99, 102, 241, 0.2)", my: 2 }}
                    />

                    {/* Predictions Table */}
                    <TableContainer
                      sx={{ backgroundColor: "transparent", boxShadow: "none" }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(99, 102, 241, 0.2)",
                              }}
                            >
                              Period
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(99, 102, 241, 0.2)",
                              }}
                            >
                              Prediction
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                borderColor: "rgba(99, 102, 241, 0.2)",
                              }}
                            >
                              Method
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {model.predictions.map((prediction, index) => (
                            <TableRow key={index}>
                              <TableCell
                                sx={{
                                  color: "#b0b0b0",
                                  borderColor: "rgba(99, 102, 241, 0.1)",
                                }}
                              >
                                {prediction.period} day
                                {prediction.period > 1 ? "s" : ""}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  borderColor: "rgba(99, 102, 241, 0.1)",
                                }}
                              >
                                {formatCurrency(prediction.prediction)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "#b0b0b0",
                                  borderColor: "rgba(99, 102, 241, 0.1)",
                                }}
                              >
                                {prediction.method}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Model Info */}
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#b0b0b0", mb: 1 }}
                      >
                        <strong>Best for:</strong> {model.best_for}
                      </Typography>
                      {model.metrics && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ color: "#b0b0b0", mb: 0.5 }}
                          >
                            <strong>Metrics:</strong>
                          </Typography>
                          {Object.entries(model.metrics).map(
                            ([metric, value]) => (
                              <Typography
                                key={metric}
                                variant="caption"
                                sx={{ color: "#666", display: "block" }}
                              >
                                {metric}:{" "}
                                {typeof value === "number"
                                  ? value.toFixed(4)
                                  : value}
                              </Typography>
                            ),
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        </Box>
      </Box>

      {/* Disclaimer */}
      <Card
        sx={{
          background: "rgba(255, 193, 7, 0.1)",
          border: "1px solid rgba(255, 193, 7, 0.3)",
          borderRadius: 12,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{ color: "#ffc107", lineHeight: 1.6 }}
          >
            <strong>Disclaimer:</strong> {forecastData.disclaimer}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Forecast;
