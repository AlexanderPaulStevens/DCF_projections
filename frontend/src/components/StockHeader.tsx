import React from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Refresh,
} from "@mui/icons-material";
import { useStockPrice } from "../hooks/queries";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated?: string;
  marketStatus?: "open" | "closed";
}

interface StockHeaderProps {
  stockData: StockData;
  companyData?: any;
}

export function StockHeader({ stockData, companyData }: StockHeaderProps) {
  const isPositive = stockData.change >= 0;

  // Use React Query's refetch for refreshing
  const { refetch, isFetching } = useStockPrice(stockData.symbol);

  // Determine market status and format date
  const getMarketInfo = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    // Market hours: 9:30 AM - 4:00 PM EST (930 - 960 minutes)
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM

    const isMarketOpen =
      dayOfWeek >= 1 &&
      dayOfWeek <= 5 &&
      currentTime >= marketOpen &&
      currentTime < marketClose;

    const marketStatus = isMarketOpen ? "open" : "closed";

    // Format the date for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      });
    };

    return {
      status: marketStatus,
      statusText: isMarketOpen ? "Open" : "Closed",
      lastCloseDate: formatDate(now),
    };
  };

  const marketInfo = getMarketInfo();

  const handleRefreshPrice = () => {
    refetch();
  };

  return (
    <Box
      sx={{
        borderBottom: "1px solid rgba(0, 212, 255, 0.15)",
        pb: 4,
        mb: 4,
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        p: 4,
        border: "1px solid rgba(0, 212, 255, 0.15)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)",
        },
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "rgba(0, 212, 255, 0.25)",
          boxShadow:
            "0 12px 40px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                fontSize: { xs: "2rem", md: "2.5rem" },
                background:
                  "linear-gradient(135deg, #00d4ff 0%, #4ddfff 30%, #ffffff 70%, #00d4ff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(0, 212, 255, 0.5)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {stockData.name}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "#a1a1aa",
                fontSize: { xs: "1.25rem", md: "1.5rem" },
                fontWeight: 600,
                background:
                  "linear-gradient(135deg, #a1a1aa 0%, #ffffff 50%, #a1a1aa 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ({stockData.symbol})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 900,
                  color: "#ffffff",
                  fontSize: { xs: "3rem", md: "4rem" },
                  textShadow: "0 0 40px rgba(0, 212, 255, 0.5)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #ffffff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ${stockData.price.toFixed(2)}
              </Typography>
              <Tooltip title="Refresh Stock Price">
                <IconButton
                  onClick={handleRefreshPrice}
                  disabled={isFetching}
                  sx={{
                    color: "#00d4ff",
                    backgroundColor: "rgba(0, 212, 255, 0.1)",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(0, 212, 255, 0.2)",
                      borderColor: "rgba(0, 212, 255, 0.5)",
                    },
                    "&:disabled": {
                      color: "rgba(0, 212, 255, 0.5)",
                    },
                  }}
                >
                  {isFetching ? (
                    <CircularProgress size={24} sx={{ color: "#00d4ff" }} />
                  ) : (
                    <Refresh sx={{ fontSize: 24 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
            <Chip
              icon={
                isPositive ? (
                  <TrendingUp sx={{ fontSize: 20 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 20 }} />
                )
              }
              label={`${isPositive ? "+" : ""}${stockData.change.toFixed(2)} (${isPositive ? "+" : ""}${stockData.changePercent.toFixed(2)}%)`}
              sx={{
                backgroundColor: isPositive
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                color: isPositive ? "#10b981" : "#ef4444",
                fontWeight: 700,
                fontSize: "1rem",
                height: 40,
                px: 2,
                borderRadius: 12,
                border: `1.5px solid ${isPositive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                backdropFilter: "blur(10px)",
                boxShadow: `0 4px 16px ${isPositive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                "& .MuiChip-icon": {
                  color: isPositive ? "#10b981" : "#ef4444",
                  filter: `drop-shadow(0 0 8px ${isPositive ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"})`,
                },
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: `0 6px 20px ${isPositive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                },
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#b0b0b0",
              mt: 1,
              fontSize: "0.875rem",
            }}
          >
            {marketInfo.status === "open"
              ? "Live data"
              : `At close: ${marketInfo.lastCloseDate}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Box
            sx={{
              backgroundColor: "rgba(10, 10, 10, 0.8)",
              px: 3,
              py: 2,
              borderRadius: 16,
              border: "1px solid rgba(0, 212, 255, 0.15)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(0, 212, 255, 0.25)",
                boxShadow: "0 12px 40px rgba(0, 212, 255, 0.1)",
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#a1a1aa",
                fontSize: "0.875rem",
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              Market Status
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: marketInfo.status === "open" ? "#10b981" : "#ef4444",
                fontSize: "1rem",
                textShadow: `0 0 10px ${marketInfo.status === "open" ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"}`,
              }}
            >
              {marketInfo.statusText}
            </Typography>
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
