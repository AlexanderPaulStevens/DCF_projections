import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Typography, Box, Tabs, Tab } from "@mui/material";
import { StockHeader } from "./StockHeader";
import { APIService } from "../services/api";
import StockPrice from "./StockPrice";
import DCFAnalysis from "./DCFAnalysis";
import FinancialRatios from "./FinancialRatios";
import AnalystRecommendation from "./AnalystRecommendation";
import Forecast from "./Forecast";

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
    if (path.includes("/dcf")) return 1;
    if (path.includes("/ratios")) return 2;
    if (path.includes("/analyst")) return 3;
    if (path.includes("/forecast")) return 4;
    return 0; // default to stock price
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Stock data for header
  const [stockData, setStockData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

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

  // Fetch stock and company data for header
  useEffect(() => {
    const fetchHeaderData = async () => {
      if (!ticker) return;

      try {
        setHeaderLoading(true);
        const [stock, company] = await Promise.all([
          APIService.getStockData(ticker),
          APIService.getCompanyInfo(ticker),
        ]);

        setStockData(stock);
        setCompanyData(company);
      } catch (err) {
        console.error("Error fetching header data:", err);
      } finally {
        setHeaderLoading(false);
      }
    };

    fetchHeaderData();
  }, [ticker]);

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [getInitialTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Update URL without page reload
    const tabRoutes = ["stock-price", "dcf", "ratios", "analyst", "forecast"];
    const newRoute = tabRoutes[newValue];
    navigate(`/company/${ticker}/${newRoute}`, { replace: true });
  };

  const tabs = [
    { label: "Stock Price", component: <StockPrice /> },
    { label: "DCF Analysis", component: <DCFAnalysis /> },
    { label: "Financial Ratios", component: <FinancialRatios /> },
    { label: "AI Analyst", component: <AnalystRecommendation /> },
    { label: "Forecasts", component: <Forecast /> },
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
        {!headerLoading && stockData && companyData && (
          <StockHeader
            stockData={{
              symbol: ticker?.toUpperCase() || "",
              name: companyData.name || "",
              price: stockData.current_price || 0,
              change: stockData.price_change || 0,
              changePercent: stockData.price_change_percent || 0,
              lastUpdated: new Date().toLocaleTimeString(),
            }}
          />
        )}

        {/* Page Title - Only show if no StockHeader */}
        {(!stockData || !companyData) && (
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                background:
                  "linear-gradient(135deg, #00d4ff 0%, #4ddfff 30%, #ffffff 70%, #00d4ff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                textShadow: "0 0 50px rgba(0, 212, 255, 0.6)",
                fontSize: { xs: "2rem", md: "3rem" },
                lineHeight: 1.2,
                animation: "headerGlow 3s ease-in-out infinite alternate",
                "@keyframes headerGlow": {
                  "0%": {
                    filter: "drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))",
                  },
                  "100%": {
                    filter: "drop-shadow(0 0 40px rgba(0, 212, 255, 0.8))",
                  },
                },
              }}
            >
              {companyData?.name || `${ticker?.toUpperCase()} Analysis`}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                fontSize: "1.125rem",
                lineHeight: 1.7,
                maxWidth: "700px",
                color: "#a1a1aa",
                fontWeight: 400,
                background:
                  "linear-gradient(135deg, #a1a1aa 0%, #ffffff 50%, #a1a1aa 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Comprehensive financial analysis and valuation powered by advanced
              AI
            </Typography>
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
