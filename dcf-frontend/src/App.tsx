import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Alert, AlertTitle } from '@mui/material';
import CompanySearch from './components/CompanySearch';
import CompanyAnalysis from './components/CompanyAnalysis';
import DCFAnalysis from './components/DCFAnalysis';
import FinancialRatios from './components/FinancialRatios';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import Header from './components/Header';
import MarketsPage from './components/MarketsPage';
import './App.css';

// Create Yahoo Finance-style theme
const yahooTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0078d4',
      light: '#106ebe',
      dark: '#005a9e',
    },
    secondary: {
      main: '#107c10',
      light: '#13a10e',
      dark: '#0c5d0c',
    },
    error: {
      main: '#d83b01',
      light: '#e74c3c',
      dark: '#b71c1c',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    success: {
      main: '#107c10',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e1e5e9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e1e5e9',
          padding: '12px 16px',
        },
      },
    },
  },
});

// Component to redirect company page to analysis page
const CompanyRedirect = () => {
  const location = useLocation();
  const ticker = location.pathname.split('/')[2];
  return <Navigate to={`/company/${ticker}/analysis`} replace />;
};

// Component to conditionally render header
const AppContent = () => {
  const location = useLocation();
  const showHeader = !location.pathname.includes('/analysis');
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
      <Box sx={{ flexGrow: 1, backgroundColor: '#f8f9fa' }}>
        <Routes>
          <Route path="/" element={<CompanySearch />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/company/:ticker" element={<CompanyRedirect />} />
          <Route path="/company/:ticker/analysis" element={<CompanyAnalysis />} />
          <Route path="/company/:ticker/dcf" element={<DCFAnalysis />} />
          <Route path="/company/:ticker/ratios" element={<FinancialRatios />} />
          <Route path="/company/:ticker/sensitivity" element={<SensitivityAnalysis />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={yahooTheme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
