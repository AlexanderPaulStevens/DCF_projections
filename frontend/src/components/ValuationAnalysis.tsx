import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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
  Chip,
} from "@mui/material";
import {
  Calculate,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import { APIService, DCFAnalysis as DCFAnalysisType } from "../services/api";

interface SimplePrediction {
  timeframe: string;
  prediction: number;
  method: string;
}

interface ForecastData {
  ticker: string;
  current_price: number;
  forecast_date: string;
  predictions: SimplePrediction[];
  summary: {
    average_prediction: number;
    prediction_range: { min: number; max: number };
    confidence_score: number;
  };
  disclaimer: string;
}

interface ValuationAnalysisProps {
  dcfData?: DCFAnalysisType | null;
  forecastData?: ForecastData | null;
  loading?: boolean;
}

const ValuationAnalysis: React.FC<ValuationAnalysisProps> = ({
  dcfData: propDcfData,
  forecastData: propForecastData,
  loading: propLoading,
}) => {
  const { ticker } = useParams<{ ticker: string }>();
  const [dcfData, setDcfData] = useState<DCFAnalysisType | null>(
    propDcfData || null,
  );
  const [forecastData, setForecastData] = useState<ForecastData | null>(
    propForecastData || null,
  );
  const [loading, setLoading] = useState(
    propLoading || (!propDcfData && !propForecastData),
  );
  const [error, setError] = useState<string | null>(null);

  const loadValuationData = useCallback(async (companyTicker: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load both DCF and forecast data in parallel
      const [dcf, forecast] = await Promise.all([
        APIService.getDCFAnalysis(companyTicker),
        APIService.getStockForecast(companyTicker),
      ]);

      setDcfData(dcf);
      setForecastData(forecast);
    } catch (err) {
      setError("Failed to load valuation analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update local state when props change
  useEffect(() => {
    if (propDcfData) setDcfData(propDcfData);
    if (propForecastData) setForecastData(propForecastData);
    if (propLoading !== undefined) setLoading(propLoading);
  }, [propDcfData, propForecastData, propLoading]);

  // Only fetch data if not provided as props
  useEffect(() => {
    if (ticker && !propDcfData && !propForecastData) {
      loadValuationData(ticker);
    }
  }, [ticker, loadValuationData, propDcfData, propForecastData]);

  const handleRunAnalysis = () => {
    if (ticker) {
      loadValuationData(ticker);
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

  const getUpsideDownside = (currentPrice: number, targetPrice: number) => {
    const percentage = ((targetPrice - currentPrice) / currentPrice) * 100;
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage > 0,
      color: percentage > 0 ? "#10b981" : "#ef4444",
    };
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={80} sx={{ mb: 3, color: "#00d4ff" }} />
            <Typography variant="h5" sx={{ color: "#b0b0b0", mb: 2 }}>
              Running Valuation Analysis...
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#888888", maxWidth: "600px" }}
            >
              {ticker
                ? `Analyzing ${ticker} using DCF and price forecasts...`
                : "Loading valuation analysis..."}
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || (!dcfData && !forecastData)) {
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
          {error || "Valuation analysis not found"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Analysis Warning */}
      {dcfData?.analysis_warning && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            backgroundColor: "rgba(255, 193, 7, 0.1)",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            color: "#ffc107",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ⚠️ {dcfData?.analysis_warning}
          </Typography>
        </Alert>
      )}

      {/* Welcome Section for New Users */}
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
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "#ffffff",
              mb: 2,
              textAlign: "center",
            }}
          >
            🎯 Company Valuation Analysis
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#00d4ff",
              mb: 3,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Professional Investment Analysis Made Simple
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              mb: 3,
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: 3,
                border: "1px solid #333333",
                borderRadius: 2,
                background: "rgba(34, 34, 34, 0.8)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
              >
                📊 What is DCF Analysis?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
              >
                <strong>Discounted Cash Flow (DCF)</strong> calculates a
                company's intrinsic value by projecting future cash flows and
                discounting them to present value. This fundamental analysis
                tells you what the company is <em>actually worth</em> based on
                its financial performance, not just what the market thinks it's
                worth.
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                p: 3,
                border: "1px solid #333333",
                borderRadius: 2,
                background: "rgba(34, 34, 34, 0.8)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#ffffff", mb: 2, fontWeight: 600 }}
              >
                📈 What are Price Forecasts?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
              >
                <strong>Price Forecasts</strong> predict where the stock price
                might go based on historical trends and technical analysis.
                These forecasts help you understand market sentiment and
                short-to-medium term price movements, complementing the
                fundamental DCF analysis.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 3,
              border: "1px solid #00d4ff",
              borderRadius: 2,
              background: "rgba(0, 212, 255, 0.05)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#00d4ff", mb: 2, fontWeight: 600 }}
            >
              💡 How to Use This Analysis
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#ffffff", lineHeight: 1.6 }}
            >
              <strong>Compare the values:</strong> If DCF shows a higher
              intrinsic value than the current price, the stock might be
              undervalued. If forecasts are bullish and DCF is positive, it
              could be a good investment opportunity. Always consider both
              fundamental value and market trends before making investment
              decisions.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Analysis Control */}
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
            sx={{ fontWeight: 600, color: "#ffffff", mb: 3 }}
          >
            🔄 Run Fresh Analysis
          </Typography>
          <Typography variant="body1" sx={{ color: "#b0b0b0", mb: 3 }}>
            Click the button below to run a fresh valuation analysis using both
            DCF fundamentals and price forecasts. This will fetch the latest
            financial data and market prices for the most up-to-date analysis.
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
            Run Valuation Analysis
          </Button>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* DCF Analysis */}
        {dcfData && (
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background: "rgba(17, 17, 17, 0.8)",
                border: "1px solid #333333",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "#ffffff", mb: 2 }}
                >
                  📊 DCF Analysis (Fundamental)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#888888", mb: 3, fontStyle: "italic" }}
                >
                  Intrinsic value based on projected cash flows and financial
                  fundamentals
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
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
                      Intrinsic Value
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "#ffffff" }}
                    >
                      {dcfData?.base_results?.intrinsic_value
                        ? formatCurrency(dcfData.base_results.intrinsic_value)
                        : "N/A"}
                    </Typography>
                  </Paper>

                  <Paper
                    sx={{
                      p: 2,
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
                      Current Price
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "#ffffff" }}
                    >
                      {dcfData?.base_results?.current_price
                        ? formatCurrency(dcfData.base_results.current_price)
                        : "N/A"}
                    </Typography>
                  </Paper>
                </Box>

                {dcfData?.base_results?.upside !== undefined && (
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Chip
                      icon={
                        dcfData?.base_results?.upside &&
                        dcfData.base_results.upside > 0 ? (
                          <TrendingUp />
                        ) : (
                          <TrendingDown />
                        )
                      }
                      label={`${dcfData?.base_results?.upside && dcfData.base_results.upside > 0 ? "+" : ""}${dcfData?.base_results?.upside ? dcfData.base_results.upside.toFixed(1) : "0"}% ${dcfData?.base_results?.upside && dcfData.base_results.upside > 0 ? "Upside" : "Downside"}`}
                      sx={{
                        backgroundColor:
                          dcfData?.base_results?.upside &&
                          dcfData.base_results.upside > 0
                            ? "#10b981"
                            : "#ef4444",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "1rem",
                        px: 2,
                        py: 1,
                      }}
                    />
                  </Box>
                )}

                <Typography
                  variant="body2"
                  sx={{ color: "#888888", textAlign: "center" }}
                >
                  Based on discounted cash flow analysis of financial
                  statements. This represents the company's true value based on
                  its ability to generate future cash flows.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Price Forecasts */}
        {forecastData && (
          <Box sx={{ flex: 1 }}>
            <Card
              sx={{
                background: "rgba(17, 17, 17, 0.8)",
                border: "1px solid #333333",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "#ffffff", mb: 2 }}
                >
                  📈 Price Forecasts (Technical)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#888888", mb: 3, fontStyle: "italic" }}
                >
                  Price predictions based on historical trends and market
                  patterns
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
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
                      Average Forecast
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "#ffffff" }}
                    >
                      {forecastData?.summary?.average_prediction
                        ? formatCurrency(
                            forecastData.summary.average_prediction,
                          )
                        : "N/A"}
                    </Typography>
                  </Paper>

                  <Paper
                    sx={{
                      p: 2,
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
                      Confidence
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: "#ffffff" }}
                    >
                      {forecastData?.summary?.confidence_score
                        ? forecastData.summary.confidence_score.toFixed(0) + "%"
                        : "N/A"}
                    </Typography>
                  </Paper>
                </Box>

                {/* Forecast Table */}
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
                          Timeframe
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: "#ffffff",
                            backgroundColor: "rgba(51, 51, 51, 0.8)",
                          }}
                        >
                          Forecast
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: "#ffffff",
                            backgroundColor: "rgba(51, 51, 51, 0.8)",
                          }}
                        >
                          Change
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {forecastData?.predictions?.map((prediction, index) => {
                        const change = getUpsideDownside(
                          forecastData?.current_price || 0,
                          prediction.prediction,
                        );
                        return (
                          <TableRow
                            key={index}
                            hover
                            sx={{
                              "&:hover": {
                                backgroundColor: "rgba(51, 51, 51, 0.3)",
                              },
                            }}
                          >
                            <TableCell
                              sx={{ fontWeight: 600, color: "#ffffff" }}
                            >
                              {prediction.timeframe}
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: 500, color: "#ffffff" }}
                            >
                              {formatCurrency(prediction.prediction)}
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: 500, color: change.color }}
                            >
                              {change.isPositive ? "+" : "-"}
                              {change.percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography
                  variant="body2"
                  sx={{ color: "#888888", textAlign: "center", mt: 2 }}
                >
                  Based on historical price trends and technical analysis. These
                  forecasts show where the market might price the stock based on
                  past patterns and momentum.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Combined Analysis */}
      {dcfData && forecastData && (
        <Card
          sx={{
            mt: 4,
            background: "rgba(17, 17, 17, 0.8)",
            border: "1px solid #333333",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 600, color: "#ffffff", mb: 2 }}
            >
              🎯 Investment Decision Summary
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#888888",
                mb: 3,
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              Compare fundamental value (DCF) with technical forecasts to make
              informed investment decisions
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: "center",
                    border: "1px solid #333333",
                    background: "rgba(34, 34, 34, 0.8)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#00d4ff", mb: 1 }}
                  >
                    DCF Value
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#ffffff" }}
                  >
                    {dcfData?.base_results?.intrinsic_value
                      ? formatCurrency(dcfData.base_results.intrinsic_value)
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#888888", mt: 1 }}>
                    Fundamental Analysis
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: "center",
                    border: "1px solid #333333",
                    background: "rgba(34, 34, 34, 0.8)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#00d4ff", mb: 1 }}
                  >
                    Forecast Average
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#ffffff" }}
                  >
                    {forecastData?.summary?.average_prediction
                      ? formatCurrency(forecastData.summary.average_prediction)
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#888888", mt: 1 }}>
                    Technical Analysis
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: "center",
                    border: "1px solid #333333",
                    background: "rgba(34, 34, 34, 0.8)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#00d4ff", mb: 1 }}
                  >
                    Current Price
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#ffffff" }}
                  >
                    {forecastData?.current_price
                      ? formatCurrency(forecastData.current_price)
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#888888", mt: 1 }}>
                    Market Price
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 3,
                border: "1px solid #333333",
                borderRadius: 2,
                background: "rgba(34, 34, 34, 0.8)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#ffffff",
                  mb: 2,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                📋 Investment Interpretation Guide
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    border: "1px solid #10b981",
                    borderRadius: 1,
                    background: "rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#10b981", fontWeight: 600, mb: 1 }}
                  >
                    ✅ Bullish Signal
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#b0b0b0", fontSize: "0.875rem" }}
                  >
                    DCF value &gt; Current price AND Forecasts trending up
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    border: "1px solid #ef4444",
                    borderRadius: 1,
                    background: "rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#ef4444", fontWeight: 600, mb: 1 }}
                  >
                    ⚠️ Bearish Signal
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#b0b0b0", fontSize: "0.875rem" }}
                  >
                    DCF value &lt; Current price AND Forecasts trending down
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    border: "1px solid #f59e0b",
                    borderRadius: 1,
                    background: "rgba(245, 158, 11, 0.1)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#f59e0b", fontWeight: 600, mb: 1 }}
                  >
                    ⚖️ Mixed Signal
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#b0b0b0", fontSize: "0.875rem" }}
                  >
                    DCF and forecasts disagree - requires more research
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Important Disclaimer */}
      <Card
        sx={{
          mt: 4,
          background: "rgba(17, 17, 17, 0.8)",
          border: "1px solid #f59e0b",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#f59e0b",
              mb: 2,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            ⚠️ Important Investment Disclaimer
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#b0b0b0", textAlign: "center", lineHeight: 1.6 }}
          >
            <strong>
              This analysis is for educational and informational purposes only.
            </strong>{" "}
            It should not be considered as financial advice, investment
            recommendations, or a substitute for professional financial
            consultation. Past performance does not guarantee future results.
            Always conduct your own research and consider your risk tolerance
            before making investment decisions. The accuracy of forecasts and
            valuations cannot be guaranteed, and market conditions can change
            rapidly.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ValuationAnalysis;
