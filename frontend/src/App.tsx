import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Alert, AlertTitle } from "@mui/material";
import CompanySearch from "./components/CompanySearch";
import CompanyAnalysis from "./components/CompanyAnalysis";
import Header from "./components/Header";
import MarketsPage from "./components/MarketsPage";
import "./App.css";

// Redirect component for old routes
const ValuationRedirect: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  return <Navigate to={`/company/${ticker}/valuation`} replace />;
};

// Create professional dark theme with enhanced styling
const professionalTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00d4ff",
      light: "#4ddfff",
      dark: "#0099cc",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#6366f1",
      light: "#8b5cf6",
      dark: "#4f46e5",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0a0a0a",
      paper: "rgba(10, 10, 10, 0.95)",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a1a1aa",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    grey: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },
  },
  typography: {
    fontFamily:
      '"Inter", "SF Pro Display", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: "3rem",
      letterSpacing: "-0.04em",
      lineHeight: 1.1,
      background:
        "linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.25rem",
      letterSpacing: "-0.03em",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 700,
      fontSize: "1.875rem",
      letterSpacing: "-0.025em",
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      letterSpacing: "-0.02em",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      letterSpacing: "-0.015em",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.125rem",
      letterSpacing: "-0.01em",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.7,
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.025em",
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          padding: "12px 24px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
            transition: "left 0.5s",
          },
          "&:hover::before": {
            left: "100%",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
          boxShadow: "0 8px 32px rgba(0, 212, 255, 0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #0099cc 0%, #006699 100%)",
            boxShadow: "0 12px 48px rgba(0, 212, 255, 0.35)",
          },
          "&:active": {
            boxShadow: "0 4px 16px rgba(0, 212, 255, 0.2)",
          },
        },
        outlined: {
          borderColor: "rgba(0, 212, 255, 0.4)",
          color: "#00d4ff",
          backgroundColor: "rgba(0, 212, 255, 0.05)",
          borderWidth: "1.5px",
          "&:hover": {
            borderColor: "#00d4ff",
            backgroundColor: "rgba(0, 212, 255, 0.15)",
            boxShadow: "0 0 24px rgba(0, 212, 255, 0.25)",
          },
        },
        text: {
          color: "#00d4ff",
          "&:hover": {
            backgroundColor: "rgba(0, 212, 255, 0.1)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          border: "1px solid rgba(0, 212, 255, 0.15)",
          borderRadius: 20,
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-6px) scale(1.02)",
            boxShadow:
              "0 20px 60px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(0, 212, 255, 0.3)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)",
            opacity: 0,
            transition: "opacity 0.3s ease",
          },
          "&:hover::before": {
            opacity: 1,
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "32px",
          "&:last-child": {
            paddingBottom: "32px",
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 212, 255, 0.08)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0, 212, 255, 0.08)",
          padding: "16px 20px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 212, 255, 0.03)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          backgroundColor: "rgba(0, 212, 255, 0.15)",
          color: "#00d4ff",
          border: "1px solid rgba(0, 212, 255, 0.25)",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 212, 255, 0.25)",
            transform: "scale(1.05)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(10, 10, 10, 0.8)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(10, 10, 10, 0.9)",
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(10, 10, 10, 0.95)",
              boxShadow: "0 0 0 2px rgba(0, 212, 255, 0.3)",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 212, 255, 0.1)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 212, 255, 0.2)",
        },
      },
    },
  },
});

// Component to redirect company page to stock price page
const CompanyRedirect = () => {
  const location = useLocation();
  const ticker = location.pathname.split("/")[2];
  return <Navigate to={`/company/${ticker}/stock-price`} replace />;
};

// Component to conditionally render header
const AppContent = () => {
  const showHeader = true; // Always show header with search functionality
  const isNgrok = window.location.hostname.includes("ngrok");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {showHeader && <Header />}
      {isNgrok && (
        <Alert
          severity="info"
          sx={{
            borderRadius: 0,
            backgroundColor: "#e3f2fd",
            borderBottom: "1px solid #2196f3",
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <AlertTitle>Limited Access Mode</AlertTitle>
          You're accessing this app through ngrok. Some features like company
          analysis, DCF calculations, and financial data are not available. For
          full functionality, please access the app locally at{" "}
          <strong>http://localhost:3000</strong>
        </Alert>
      )}
      <Box
        sx={{
          flexGrow: 1,
          background: `
            radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a0a 0%, #000000 50%, #0a0a0a 100%)
          `,
          minHeight: "100vh",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 70%)
            `,
            pointerEvents: "none",
          },
        }}
      >
        <Routes>
          <Route path="/" element={<CompanySearch />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/company/:ticker" element={<CompanyRedirect />} />
          <Route
            path="/company/:ticker/stock-price"
            element={<CompanyAnalysis />}
          />
          <Route path="/company/:ticker/dcf" element={<ValuationRedirect />} />
          <Route
            path="/company/:ticker/forecast"
            element={<ValuationRedirect />}
          />
          <Route path="/company/:ticker/ratios" element={<CompanyAnalysis />} />
          <Route
            path="/company/:ticker/analyst"
            element={<CompanyAnalysis />}
          />
          <Route
            path="/company/:ticker/valuation"
            element={<CompanyAnalysis />}
          />
          <Route
            path="/company/:ticker/revenue"
            element={<CompanyAnalysis />}
          />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={professionalTheme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
