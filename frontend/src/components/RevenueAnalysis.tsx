import React from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Tooltip,
} from "@mui/material";
import { useEBITData } from "../hooks/queries";

const EBITAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();

  // Use React Query for EBIT data
  const { data: ebitData, isLoading: loading, error } = useEBITData(ticker || "");

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
          {error.message || "Failed to load EBIT data"}
        </Alert>
      </Container>
    );
  }

  if (!ebitData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No EBIT data available for {ticker?.toUpperCase()}.
        </Alert>
      </Container>
    );
  }

  // Prepare chart data for annual EBIT (oldest to newest)
  const ebitChartData = ebitData.ebit_data
    .slice()
    .reverse() // Reverse to show oldest to newest
    .map((item: any) => ({
      year: item.year.toString(),
      ebit: item.ebit / 1000000, // Convert to millions for better display
      ebitFormatted:
        item.ebit >= 1000000000
          ? `$${(item.ebit / 1000000000).toFixed(1)}B`
          : `$${(item.ebit / 1000000).toFixed(1)}M`,
    }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Annual EBIT Bar Chart */}
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
            📊 Annual EBIT
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
              {ebitChartData.map((item: any, index: number) => {
                const maxEbit = Math.max(
                  ...ebitChartData.map((d: any) => Math.abs(d.ebit)),
                );
                const height = (Math.abs(item.ebit) / maxEbit) * 200; // Max height of 200px

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
                    {/* EBIT value on top */}
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
                      {item.ebitFormatted}
                    </Typography>

                    {/* Bar */}
                    <Box
                      sx={{
                        width: "100%",
                        height: `${height}px`,
                        backgroundColor: item.ebit >= 0 ? "#00d4ff" : "#ff4444",
                        borderRadius: "4px 4px 0 0",
                        minHeight: "40px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor:
                            item.ebit >= 0 ? "#4ddfff" : "#ff6666",
                        },
                      }}
                      title={`${item.year}: ${item.ebitFormatted}`}
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
            📊 EBIT Analysis Summary
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
                <Tooltip
                  title={
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Compound Annual Growth Rate (CAGR)
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        The consistent annual growth rate that would get you
                        from the beginning value to the ending value over the
                        time period.
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", mt: 1, fontStyle: "italic" }}
                      >
                        Formula: (Ending Value ÷ Beginning Value)^(1/Years) - 1
                      </Typography>
                    </Box>
                  }
                  arrow
                  placement="top"
                  sx={{
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      border: "1px solid #00d4ff",
                      borderRadius: 2,
                      maxWidth: 300,
                    },
                    "& .MuiTooltip-arrow": {
                      color: "rgba(0, 0, 0, 0.9)",
                    },
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
                      cursor: "help",
                      borderBottom: "1px dotted #b0b0b0",
                    }}
                  >
                    CAGR
                  </Typography>
                </Tooltip>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#ffffff" }}
                >
                  {ebitData.summary.average_growth_rate >= 0 ? "+" : ""}
                  {ebitData.summary.average_growth_rate.toFixed(1)}%
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
              annual EBIT CAGR of{" "}
              <strong>
                {ebitData.summary.average_growth_rate >= 0 ? "+" : ""}
                {ebitData.summary.average_growth_rate.toFixed(1)}%
              </strong>
              over the past {ebitData.summary.total_years} years.
              {ebitData.summary.average_growth_rate >= 0 ? (
                <>
                  This positive CAGR indicates the company has been improving
                  its operational profitability consistently. EBIT CAGR shows
                  the company's compound annual growth in operating earnings
                  over time, which is a strong indicator for long-term
                  investment potential and operational efficiency.
                </>
              ) : (
                <>
                  This negative CAGR suggests the company may be facing
                  challenges in maintaining or improving its operational
                  profitability. A declining EBIT CAGR could be due to increased
                  costs, pricing pressure, or operational inefficiencies.
                  Investors should consider the underlying reasons for this
                  trend when making investment decisions.
                </>
              )}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EBITAnalysis;
