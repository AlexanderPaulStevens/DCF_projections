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
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { APIService, AnnualRevenueData } from "../services/api";

const RevenueAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [revenueData, setRevenueData] = useState<AnnualRevenueData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(async () => {
    if (!ticker) return;

    try {
      setLoading(true);
      setError(null);
      const data = await APIService.getAnnualRevenue(ticker);
      setRevenueData(data);
    } catch (err) {
      console.error("❌ Error fetching revenue data:", err);
      setError("Failed to fetch revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} sx={{ color: "#00d4ff" }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchRevenueData}
          startIcon={<Refresh />}
          sx={{
            background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0099cc 0%, #007399 100%)",
            },
          }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  if (!revenueData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No revenue data available for {ticker?.toUpperCase()}.
        </Alert>
      </Container>
    );
  }

  // Prepare chart data for annual revenue (oldest to newest)
  const revenueChartData = revenueData.revenue_data
    .slice()
    .reverse() // Reverse to show oldest to newest
    .map((item) => ({
      year: item.year.toString(),
      revenue: item.revenue / 1000000, // Convert to millions for better display
      revenueFormatted:
        item.revenue >= 1000000000
          ? `$${(item.revenue / 1000000000).toFixed(1)}B`
          : `$${(item.revenue / 1000000).toFixed(1)}M`,
    }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Annual Revenue Bar Chart */}
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
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: "#ffffff", mb: 3 }}
          >
            📊 Annual Revenue
          </Typography>

          <Box sx={{ height: 350, p: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "end",
                height: "100%",
                gap: 1,
                justifyContent: "space-between",
              }}
            >
              {revenueChartData.map((item, index) => {
                const maxRevenue = Math.max(
                  ...revenueChartData.map((d) => d.revenue),
                );
                const height = (item.revenue / maxRevenue) * 200; // Max height of 200px

                return (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flex: "0 0 60px",
                      px: 0.5,
                    }}
                  >
                    {/* Revenue value on top */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        mb: 0.5,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {item.revenueFormatted}
                    </Typography>

                    {/* Bar */}
                    <Box
                      sx={{
                        width: "100%",
                        height: `${height}px`,
                        backgroundColor: "#00d4ff",
                        borderRadius: "4px 4px 0 0",
                        minHeight: "40px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: "#4ddfff",
                        },
                      }}
                      title={`${item.year}: ${item.revenueFormatted}`}
                    />

                    {/* Year label */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#b0b0b0",
                        fontSize: "0.75rem",
                        mt: 1,
                        transform: "rotate(-45deg)",
                        transformOrigin: "center",
                      }}
                    >
                      {item.year}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <Card
        sx={{
          background: "rgba(17, 17, 17, 0.8)",
          border: "1px solid #333333",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: "#ffffff", mb: 3 }}
          >
            📊 Revenue Analysis Summary
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
            <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
              <Paper
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
                  Average Growth
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#ffffff" }}
                >
                  {revenueData.summary.average_growth_rate >= 0 ? "+" : ""}
                  {revenueData.summary.average_growth_rate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: "#888888", mt: 1 }}>
                  Per Year
                </Typography>
              </Paper>
            </Box>
          </Box>

          <Paper
            sx={{
              p: 3,
              border: "1px solid #00d4ff",
              borderRadius: 2,
              background: "rgba(0, 212, 255, 0.1)",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#00d4ff", fontWeight: 600, mb: 2 }}
            >
              💡 Analysis
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
            >
              <strong>{ticker?.toUpperCase()}</strong> has shown an average
              annual revenue growth of{" "}
              <strong>
                {revenueData.summary.average_growth_rate >= 0 ? "+" : ""}
                {revenueData.summary.average_growth_rate.toFixed(1)}%
              </strong>
              over the past {revenueData.summary.total_years} years.
              {revenueData.summary.average_growth_rate >= 0 ? (
                <>
                  This positive growth trend indicates the company has been
                  expanding its revenue base consistently. Investors can see the
                  company's ability to generate increasing sales over time,
                  which is generally a positive indicator for long-term
                  investment potential.
                </>
              ) : (
                <>
                  This declining trend suggests the company may be facing
                  challenges in maintaining or growing its revenue. This could
                  be due to market saturation, increased competition, or changes
                  in the business model. Investors should consider the
                  underlying reasons for this trend when making investment
                  decisions.
                </>
              )}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default RevenueAnalysis;
