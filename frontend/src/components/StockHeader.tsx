import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ExpandMore,
  ExpandLess,
  Business,
  LocationOn,
  People,
  Language,
  CalendarToday,
  AttachMoney,
} from "@mui/icons-material";
import { useCompanyData } from "../hooks/useDataHooks";

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
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  // Use centralized data management
  const { companyInfo, loading: loadingInfo } = useCompanyData(
    stockData.symbol,
  );

  const toggleCompanyInfo = () => {
    setShowCompanyInfo(!showCompanyInfo);
  };

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
            <Tooltip
              title={
                showCompanyInfo
                  ? "Hide Company Information"
                  : "Show Company Information"
              }
            >
              <IconButton
                onClick={toggleCompanyInfo}
                sx={{
                  color: "#00d4ff",
                  backgroundColor: "rgba(0, 212, 255, 0.1)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  borderRadius: 2,
                  p: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(0, 212, 255, 0.2)",
                    borderColor: "rgba(0, 212, 255, 0.4)",
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 16px rgba(0, 212, 255, 0.3)",
                  },
                }}
              >
                {loadingInfo ? (
                  <CircularProgress size={20} sx={{ color: "#00d4ff" }} />
                ) : showCompanyInfo ? (
                  <ExpandLess sx={{ fontSize: 20 }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
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

      {/* Company Information Dropdown */}
      <Collapse in={showCompanyInfo} timeout="auto" unmountOnExit>
        <Box
          sx={{
            mt: 3,
            backgroundColor: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            p: 3,
            transition: "all 0.3s ease",
          }}
        >
          {companyInfo ? (
            <Box>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#ffffff", fontWeight: 700, mb: 2 }}
                >
                  Company Overview
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#b0b0b0", lineHeight: 1.6 }}
                >
                  {companyInfo?.description || "No description available"}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.2)", my: 3 }} />

              {/* Company Details Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {/* Sector & Industry */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Business sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                    >
                      Sector
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {companyInfo?.sector || "N/A"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Business sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                    >
                      Industry
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {companyInfo?.industry || "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {/* Location */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                    >
                      Headquarters
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {companyInfo?.city && companyInfo?.state
                        ? `${companyInfo.city}, ${companyInfo.state}`
                        : "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {/* Employees */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <People sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                    >
                      Employees
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {companyInfo?.employees
                        ? companyInfo.employees.toLocaleString()
                        : "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {/* Exchange */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AttachMoney sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                    >
                      Exchange
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#ffffff", fontWeight: 600 }}
                    >
                      {companyInfo?.exchange && companyInfo?.currency
                        ? `${companyInfo.exchange} (${companyInfo.currency})`
                        : "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {/* Founded Year */}
                {companyInfo?.founded_year && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ color: "#00d4ff", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                      >
                        Founded
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        {companyInfo?.founded_year}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Website */}
              {companyInfo?.website && (
                <>
                  <Divider
                    sx={{ borderColor: "rgba(0, 212, 255, 0.2)", my: 3 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Language sx={{ color: "#00d4ff", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                      >
                        Website
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#00d4ff",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                          "&:hover": { color: "#4ddfff" },
                        }}
                        onClick={() =>
                          window.open(companyInfo?.website, "_blank")
                        }
                      >
                        {companyInfo?.website}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {/* CEO */}
              {companyInfo?.ceo && (
                <>
                  <Divider
                    sx={{ borderColor: "rgba(0, 212, 255, 0.2)", my: 3 }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AttachMoney sx={{ color: "#00d4ff", fontSize: 20 }} />
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: "#b0b0b0", fontSize: "0.75rem" }}
                      >
                        CEO
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ffffff", fontWeight: 600 }}
                      >
                        {companyInfo?.ceo}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.2)", my: 3 }} />

              {/* Last Updated */}
              <Typography
                variant="caption"
                sx={{ color: "#666", fontSize: "0.7rem" }}
              >
                Last updated:{" "}
                {companyInfo?.last_updated
                  ? new Date(companyInfo.last_updated).toLocaleString()
                  : "N/A"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress sx={{ color: "#00d4ff", mb: 2 }} />
              <Typography variant="body2" sx={{ color: "#b0b0b0" }}>
                Loading company information...
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
