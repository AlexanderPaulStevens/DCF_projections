import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Slider,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  Calculate,
  ArrowBack,
} from '@mui/icons-material';

interface PortfolioStock {
  ticker: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  marketValue?: number;
  weight?: number;
  return?: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  volatility: number;
  beta: number;
  maxDrawdown: number;
}

const PortfolioAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [newStock, setNewStock] = useState({ ticker: '', shares: 0, avgPrice: 0 });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [optimizationTarget, setOptimizationTarget] = useState('sharpe');
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [optimizationComplete, setOptimizationComplete] = useState(false);

  // Mock portfolio data for demonstration
  useEffect(() => {

    const mockPortfolio: PortfolioStock[] = [
      { ticker: 'AAPL', shares: 100, avgPrice: 150, currentPrice: 232, marketValue: 23200, weight: 0.3, return: 54.7 },
      { ticker: 'MSFT', shares: 80, avgPrice: 280, currentPrice: 420, marketValue: 33600, weight: 0.4, return: 50.0 },
      { ticker: 'GOOGL', shares: 50, avgPrice: 120, currentPrice: 180, marketValue: 9000, weight: 0.2, return: 50.0 },
      { ticker: 'NVDA', shares: 30, avgPrice: 200, currentPrice: 450, marketValue: 13500, weight: 0.1, return: 125.0 },
    ];

    setPortfolio(mockPortfolio);

    calculatePortfolioMetrics(mockPortfolio);

  }, []);

  const calculatePortfolioMetrics = (stocks: PortfolioStock[]) => {
    const totalValue = stocks.reduce((sum, stock) => sum + (stock.marketValue || 0), 0);
    const totalCost = stocks.reduce((sum, stock) => sum + (stock.shares * stock.avgPrice), 0);
    const totalReturn = totalValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Mock metrics calculation
    const mockMetrics: PortfolioMetrics = {
      totalValue,
      totalReturn,
      totalReturnPercent,
      sharpeRatio: 1.85,
      volatility: 0.18,
      beta: 1.12,
      maxDrawdown: -0.08,
    };

    setMetrics(mockMetrics);
  };

  const handleAddStock = () => {
    if (!newStock.ticker || newStock.shares <= 0 || newStock.avgPrice <= 0) {
      setError('Please fill in all fields with valid values');
      return;
    }

    const stock: PortfolioStock = {
      ticker: newStock.ticker.toUpperCase(),
      shares: newStock.shares,
      avgPrice: newStock.avgPrice,
      currentPrice: newStock.avgPrice, // Mock current price
      marketValue: newStock.shares * newStock.avgPrice,
      weight: 0,
      return: 0,
    };

    const updatedPortfolio = [...portfolio, stock];
    setPortfolio(updatedPortfolio);
    calculatePortfolioMetrics(updatedPortfolio);
    setNewStock({ ticker: '', shares: 0, avgPrice: 0 });
    setAddDialogOpen(false);
    setError(null);
  };

  const handleRemoveStock = (ticker: string) => {
    const updatedPortfolio = portfolio.filter(stock => stock.ticker !== ticker);
    setPortfolio(updatedPortfolio);
    calculatePortfolioMetrics(updatedPortfolio);
  };

  const handleOptimizePortfolio = () => {

    if (portfolio.length === 0) {
      setError('Please add stocks to your portfolio before optimizing');
      return;
    }

    setLoading(true);
    setError(null);
    setOptimizationComplete(false);

    // Mock optimization process
    setTimeout(() => {
      const optimizedWeights = [0.25, 0.35, 0.25, 0.15]; // Mock optimized weights
      const updatedPortfolio = portfolio.map((stock, index) => ({
        ...stock,
        weight: optimizedWeights[index] || stock.weight,
      }));

      setPortfolio(updatedPortfolio);
      calculatePortfolioMetrics(updatedPortfolio);
      setLoading(false);
      setOptimizationComplete(true);
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    return value >= 0 ? '#00d4ff' : '#ff6b35';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          ← Back to Home
        </Button>

        <Typography variant="h3" sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00d4ff 0%, #4ddfff 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
        }}>
          Portfolio Optimizer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          AI-powered portfolio analysis and optimization
        </Typography>
      </Box>

      {/* Portfolio Overview Cards */}
      {metrics && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700, mb: 1 }}>
                {formatCurrency(metrics.totalValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Portfolio Value
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: getReturnColor(metrics.totalReturnPercent), fontWeight: 700, mb: 1 }}>
                {formatPercentage(metrics.totalReturnPercent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Return
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700, mb: 1 }}>
                {metrics.sharpeRatio.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700, mb: 1 }}>
                {formatPercentage(metrics.volatility * 100)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Volatility
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Portfolio Management */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
        {/* Portfolio Holdings */}
        <Box sx={{ flex: { lg: 2 } }}>
          <Paper sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
                Portfolio Holdings
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
                  },
                }}
              >
                Add Stock
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Ticker</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Shares</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Avg Price</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Current Price</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Market Value</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Weight</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Return</TableCell>
                    <TableCell sx={{ color: '#b0b0b0', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.map((stock) => (
                    <TableRow key={stock.ticker} hover>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>
                        {stock.ticker}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {stock.shares.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {formatCurrency(stock.avgPrice)}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {formatCurrency(stock.currentPrice || 0)}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        {formatCurrency(stock.marketValue || 0)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${((stock.weight || 0) * 100).toFixed(1)}%`}
                          size="small"
                          sx={{
                            background: 'rgba(0, 212, 255, 0.2)',
                            color: '#00d4ff',
                            border: '1px solid #00d4ff',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: getReturnColor(stock.return || 0), fontWeight: 600 }}>
                        {formatPercentage(stock.return || 0)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleRemoveStock(stock.ticker)}
                          sx={{ color: '#ff6b35' }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Portfolio Optimization */}
        <Box sx={{ flex: { lg: 1 } }}>
          <Paper sx={{ background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', p: 3 }}>
            <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600, mb: 3 }}>
              Portfolio Optimization
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Optimization Target
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={optimizationTarget}
                  onChange={(e) => setOptimizationTarget(e.target.value)}
                  sx={{ color: '#ffffff' }}
                >
                  <MenuItem value="sharpe">Maximize Sharpe Ratio</MenuItem>
                  <MenuItem value="return">Maximize Return</MenuItem>
                  <MenuItem value="minvol">Minimize Volatility</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Risk Tolerance: {riskTolerance}/10
              </Typography>
              <Slider
                value={riskTolerance}
                onChange={(_, value) => setRiskTolerance(value as number)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #00d4ff 0%, #ff6b35 100%)',
                  },
                  '& .MuiSlider-thumb': {
                    background: '#00d4ff',
                  },
                }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
              onClick={handleOptimizePortfolio}
              disabled={loading || portfolio.length === 0}
              sx={{
                background: loading || portfolio.length === 0
                  ? 'linear-gradient(135deg, #666666 0%, #444444 100%)'
                  : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                py: 1.5,
                '&:hover': {
                  background: loading || portfolio.length === 0
                    ? 'linear-gradient(135deg, #666666 0%, #444444 100%)'
                    : 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #666666 0%, #444444 100%)',
                  color: '#999999',
                }
              }}
            >
              {loading ? 'Optimizing...' : 'Optimize Portfolio'}
            </Button>

            {/* Optimization Explanation */}
            <Box sx={{ mt: 2, p: 3, background: 'rgba(17, 17, 17, 0.8)', border: '1px solid #333333', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, fontWeight: 600 }}>
                📊 What Portfolio Optimization Does
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2 }}>
                When you click "Optimize Portfolio", the system will:
              </Typography>
              <Box component="ul" sx={{ color: '#b0b0b0', pl: 3, mb: 2 }}>
                <li>Analyze your current portfolio allocation</li>
                <li>Calculate optimal weight distribution for better risk-adjusted returns</li>
                <li>Update the "Weight" column in your portfolio holdings</li>
                <li>Recalculate portfolio metrics (Sharpe ratio, volatility, etc.)</li>
              </Box>
              <Typography variant="body2" sx={{ color: '#00d4ff', fontStyle: 'italic' }}>
                💡 <strong>Current Implementation:</strong> This is a demonstration using mock optimization weights.
                In production, this would use advanced algorithms like Modern Portfolio Theory,
                Monte Carlo simulations, and real-time market data analysis.
              </Typography>
            </Box>

            {/* Optimization Success Message */}
            {optimizationComplete && (
              <Alert
                severity="success"
                sx={{
                  mt: 2,
                  background: 'rgba(0, 200, 83, 0.1)',
                  border: '1px solid #00c853',
                  '& .MuiAlert-icon': { color: '#00c853' }
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  ✅ Portfolio Optimization Complete!
                </Typography>
                <Typography variant="body2">
                  Your portfolio has been optimized with new weight allocations.
                  Check the "Weight" column in your portfolio holdings above to see the changes.
                  The system has also recalculated your portfolio metrics for the new allocation.
                </Typography>
              </Alert>
            )}

            {portfolio.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Add some stocks to your portfolio to start optimization
              </Alert>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Add Stock Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#ffffff', background: '#111111' }}>
          Add New Stock
        </DialogTitle>
        <DialogContent sx={{ background: '#111111', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Ticker Symbol"
              value={newStock.ticker}
              onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value })}
              placeholder="e.g., AAPL"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#00d4ff' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
              }}
            />
            <TextField
              label="Number of Shares"
              type="number"
              value={newStock.shares}
              onChange={(e) => setNewStock({ ...newStock, shares: parseInt(e.target.value) || 0 })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#00d4ff' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
              }}
            />
            <TextField
              label="Average Purchase Price"
              type="number"
              value={newStock.avgPrice}
              onChange={(e) => setNewStock({ ...newStock, avgPrice: parseFloat(e.target.value) || 0 })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#00d4ff' },
                  '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                },
                '& .MuiInputLabel-root': { color: '#b0b0b0' },
              }}
            />
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ background: '#111111', p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: '#b0b0b0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddStock}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0099cc 0%, #006699 100%)',
              },
            }}
          >
            Add Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PortfolioAnalyzer;
