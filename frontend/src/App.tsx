import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CompanySearch from './components/CompanySearch';
import CompanyOverview from './components/CompanyOverview';
import DCFAnalysis from './components/DCFAnalysis';
import FinancialRatios from './components/FinancialRatios';
import SensitivityAnalysis from './components/SensitivityAnalysis';
import PortfolioAnalyzer from './components/PortfolioAnalyzer';
import './App.css';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#4ddfff',
      dark: '#0099cc',
    },
    secondary: {
      main: '#ff6b35',
      light: '#ff8f5c',
      dark: '#cc5500',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          border: '1px solid #333333',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<CompanySearch />} />
            <Route path="/company/:ticker" element={<CompanyOverview />} />
            <Route path="/company/:ticker/dcf" element={<DCFAnalysis />} />
            <Route path="/company/:ticker/ratios" element={<FinancialRatios />} />
            <Route path="/company/:ticker/sensitivity" element={<SensitivityAnalysis />} />
            <Route path="/portfolio" element={<PortfolioAnalyzer />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
