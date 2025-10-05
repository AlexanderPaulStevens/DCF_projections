import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Alert, AlertTitle } from '@mui/material';
import CompanySearch from './components/CompanySearch';
import CompanyAnalysis from './components/CompanyAnalysis';
import Header from './components/Header';
import MarketsPage from './components/MarketsPage';
import './App.css';

// Create black theme matching landing page
const blackTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#4ddfff',
      dark: '#0099cc',
    },
    secondary: {
      main: '#00d4ff',
      light: '#4ddfff',
      dark: '#0099cc',
    },
    error: {
      main: '#ff6b6b',
      light: '#ff8e8e',
      dark: '#e55353',
    },
    background: {
      default: '#000000',
      paper: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    success: {
      main: '#00d4ff',
      light: '#4ddfff',
      dark: '#0099cc',
    },
    warning: {
      main: '#ffd93d',
      light: '#ffe066',
      dark: '#e6c235',
    },
    info: {
      main: '#00d4ff',
      light: '#4ddfff',
      dark: '#0099cc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.025em',
      background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 50%, #ffffff 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.025em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          boxShadow: '0 12px 40px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
            boxShadow: '0 16px 50px rgba(0, 212, 255, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          '&:hover': {
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.2)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
            borderColor: 'rgba(0, 212, 255, 0.4)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
          padding: '12px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          backgroundColor: 'rgba(0, 212, 255, 0.2)',
          color: '#00d4ff',
          border: '1px solid rgba(0, 212, 255, 0.3)',
        },
      },
    },
  },
});

// Component to redirect company page to stock price page
const CompanyRedirect = () => {
  const location = useLocation();
  const ticker = location.pathname.split('/')[2];
  return <Navigate to={`/company/${ticker}/stock-price`} replace />;
};

// Component to conditionally render header
const AppContent = () => {
  const showHeader = true; // Always show header with search functionality
  const isNgrok = window.location.hostname.includes('ngrok');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showHeader && <Header />}
      {isNgrok && (
        <Alert severity="info" sx={{
          borderRadius: 0,
          backgroundColor: '#e3f2fd',
          borderBottom: '1px solid #2196f3',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}>
          <AlertTitle>Limited Access Mode</AlertTitle>
          You're accessing this app through ngrok. Some features like company analysis, DCF calculations, and financial data are not available.
          For full functionality, please access the app locally at <strong>http://localhost:3000</strong>
        </Alert>
      )}
      <Box sx={{ flexGrow: 1, background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)' }}>
        <Routes>
          <Route path="/" element={<CompanySearch />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/company/:ticker" element={<CompanyRedirect />} />
          <Route path="/company/:ticker/stock-price" element={<CompanyAnalysis />} />
          <Route path="/company/:ticker/dcf" element={<CompanyAnalysis />} />
          <Route path="/company/:ticker/ratios" element={<CompanyAnalysis />} />
          <Route path="/company/:ticker/analyst" element={<CompanyAnalysis />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={blackTheme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
