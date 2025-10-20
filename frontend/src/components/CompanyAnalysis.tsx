import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Tabs,
  Tab,
  Skeleton,
} from "@mui/material";
import { StockHeader } from "./StockHeader";
import { useStockPrice, useCompanyInfo } from "../hooks/queries";
import StockPrice from "./StockPrice";
import ValuationAnalysis from "./ValuationAnalysis";
import FinancialRatios from "./FinancialRatios";
import AnalystRecommendation from "./AnalystRecommendation";
import EBITAnalysis from "./RevenueAnalysis";
import { FCFPerShare } from "./FCFPerShare";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            py: 4,
            animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes fadeInUp": {
              "0%": {
                opacity: 0,
                transform: "translateY(20px)",
              },
              "100%": {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

const CompanyAnalysis: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state - determine initial tab based on URL
  const getInitialTab = useCallback(() => {
    const path = location.pathname;
    if (path.includes("/valuation")) return 1;
    if (path.includes("/ratios")) return 2;
    if (path.includes("/analyst")) return 3;
    if (path.includes("/ebit")) return 4;
    if (path.includes("/fcf")) return 5;
    return 0; // default to stock price
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Use React Query hooks for data fetching
  const {
    data: stockPriceData,
    isLoading: stockPriceLoading,
  } = useStockPrice(ticker || "");

  const {
    data: companyInfo,
    isLoading: companyInfoLoading,
  } = useCompanyInfo(ticker || "");

  // Determine overall loading state
  const headerLoading = stockPriceLoading || companyInfoLoading;
  const hasData = stockPriceData && companyInfo;

  // Moving lines animation (matching landing page)
  const [lines, setLines] = useState<
    Array<{ id: number; x: number; y: number; speed: number; opacity: number }>
  >([]);

  useEffect(() => {
    // Initialize moving lines
    const initialLines = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 1,
      opacity: 0.2 + Math.random() * 0.3,
    }));
    setLines(initialLines);

    // Animate lines
    const interval = setInterval(() => {
      setLines((prevLines) =>
        prevLines.map((line) => ({
          ...line,
          y: (line.y - line.speed) % 100,
          opacity: 0.2 + Math.sin(Date.now() * 0.001 + line.id) * 0.3,
        })),
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [getInitialTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Update URL without page reload
    const tabRoutes = ["stock-price", "valuation", "ratios", "analyst", "ebit", "fcf"];
    const newRoute = tabRoutes[newValue];
    navigate(`/company/${ticker}/${newRoute}`, { replace: true });
  };

  const tabs = [
    { label: "Stock Price", component: <StockPrice /> },
    {
      label: "Valuation",
      component: <ValuationAnalysis />,
    },
    {
      label: "Financial Ratios",
      component: <FinancialRatios />,
    },
    { label: "AI Analyst", component: <AnalystRecommendation /> },
    { label: "EBIT Analysis", component: <EBITAnalysis /> },
    { label: "FCF Per Share", component: <FCFPerShare ticker={ticker || ""} /> },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 60% 60%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)
        `,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.02) 0%, transparent 70%)
          `,
          pointerEvents: "none",
        },
      }}
    >
      {/* Enhanced Moving lines background */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {lines.map((line) => (
          <Box
            key={line.id}
            sx={{
              position: "absolute",
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: "1px",
              height: "120px",
              background: `linear-gradient(
                180deg,
                transparent,
                rgba(0, 212, 255, 0.15),
                rgba(0, 212, 255, 0.25),
                rgba(0, 212, 255, 0.15),
                transparent
              )`,
              opacity: line.opacity,
              transform: `rotate(${45 + (line.id % 4) * 12}deg)`,
              filter: "blur(0.8px)",
              boxShadow: `0 0 15px rgba(0, 212, 255, 0.3)`,
              animation: `lineGlow ${2 + line.id * 0.1}s ease-in-out infinite alternate`,
              "@keyframes lineGlow": {
                "0%": { opacity: line.opacity * 0.5 },
                "100%": { opacity: line.opacity * 1.2 },
              },
            }}
          />
        ))}
      </Box>

      <Container maxWidth="xl" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        {/* Stock Header */}
        {!headerLoading && hasData && (
          <StockHeader
            stockData={{
              symbol: ticker?.toUpperCase() || "",
              name: companyInfo.name || "",
              price: stockPriceData.current_price || 0,
              change: stockPriceData.price_change || 0,
              changePercent: stockPriceData.price_change_percent || 0,
              lastUpdated: stockPriceData.last_updated || new Date().toLocaleTimeString(),
            }}
            companyData={companyInfo}
          />
        )}

        {/* Loading Skeleton - Only show if no data yet */}
        {!hasData && (
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
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  {/* Company Name Skeleton */}
                  <Skeleton
                    variant="text"
                    width={300}
                    height={60}
                    sx={{
                      bgcolor: "rgba(0, 212, 255, 0.1)",
                      borderRadius: 2,
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.4 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  />
                  {/* Ticker Symbol Skeleton */}
                  <Skeleton
                    variant="text"
                    width={100}
                    height={50}
                    sx={{
                      bgcolor: "rgba(0, 212, 255, 0.08)",
                      borderRadius: 2,
                      animation: "pulse 1.5s ease-in-out infinite 0.2s",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.4 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 3, mb: 1 }}
                >
                  {/* Price Skeleton */}
                  <Skeleton
                    variant="text"
                    width={200}
                    height={80}
                    sx={{
                      bgcolor: "rgba(0, 212, 255, 0.15)",
                      borderRadius: 2,
                      animation: "pulse 1.5s ease-in-out infinite 0.4s",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.4 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  />
                  {/* Change Chip Skeleton */}
                  <Box
                    sx={{
                      height: 40,
                      px: 3,
                      py: 1,
                      borderRadius: 12,
                      border: "1.5px solid rgba(0, 212, 255, 0.2)",
                      backgroundColor: "rgba(0, 212, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      animation: "pulse 1.5s ease-in-out infinite 0.6s",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.4 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  >
                    <Skeleton
                      variant="circular"
                      width={20}
                      height={20}
                      sx={{ bgcolor: "rgba(0, 212, 255, 0.2)" }}
                    />
                    <Skeleton
                      variant="text"
                      width={120}
                      sx={{ bgcolor: "rgba(0, 212, 255, 0.2)" }}
                    />
                  </Box>
                </Box>
                {/* Status Text Skeleton */}
                <Skeleton
                  variant="text"
                  width={250}
                  height={20}
                  sx={{
                    bgcolor: "rgba(0, 212, 255, 0.08)",
                    borderRadius: 1,
                    animation: "pulse 1.5s ease-in-out infinite 0.8s",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 0.4 },
                      "50%": { opacity: 0.6 },
                    },
                  }}
                />
              </Box>
              {/* Market Status Box Skeleton */}
              <Box
                sx={{
                  backgroundColor: "rgba(10, 10, 10, 0.8)",
                  px: 3,
                  py: 2,
                  borderRadius: 16,
                  border: "1px solid rgba(0, 212, 255, 0.15)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  minWidth: 150,
                  animation: "pulse 1.5s ease-in-out infinite 1s",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 0.4 },
                    "50%": { opacity: 0.6 },
                  },
                }}
              >
                <Skeleton
                  variant="text"
                  width={100}
                  height={20}
                  sx={{
                    bgcolor: "rgba(0, 212, 255, 0.15)",
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                />
                <Skeleton
                  variant="text"
                  width={60}
                  height={28}
                  sx={{
                    bgcolor: "rgba(0, 212, 255, 0.2)",
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Enhanced Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "rgba(0, 212, 255, 0.15)",
            mb: 4,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)",
            },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#00d4ff",
                height: 4,
                borderRadius: "2px 2px 0 0",
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
                background: "linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)",
              },
              "& .MuiTab-root": {
                color: "#a1a1aa",
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                minHeight: 56,
                px: 3,
                py: 2,
                borderRadius: "12px 12px 0 0",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                "&.Mui-selected": {
                  color: "#00d4ff",
                  backgroundColor: "rgba(0, 212, 255, 0.08)",
                  backdropFilter: "blur(10px)",
                },
                "&:hover": {
                  color: "#00d4ff",
                  backgroundColor: "rgba(0, 212, 255, 0.05)",
                  transform: "translateY(-2px)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                },
                "&:hover::before": {
                  opacity: 1,
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Container>
    </Box>
  );
};

export default CompanyAnalysis;
