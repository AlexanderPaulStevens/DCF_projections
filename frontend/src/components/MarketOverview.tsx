import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { TrendingUp, TrendingDown, MoreVert } from "@mui/icons-material";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  pe: number;
  sector: string;
}

const MarketOverview: React.FC = () => {
  // Mock data - in real app, this would come from API
  const topStocks: StockData[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 234.07,
      change: 2.45,
      changePercent: 1.06,
      volume: "45.2M",
      marketCap: "3.7T",
      pe: 28.5,
      sector: "Technology",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      price: 456.78,
      change: -3.21,
      changePercent: -0.7,
      volume: "32.1M",
      marketCap: "3.4T",
      pe: 32.1,
      sector: "Technology",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 178.45,
      change: 1.23,
      changePercent: 0.69,
      volume: "28.7M",
      marketCap: "2.2T",
      pe: 25.8,
      sector: "Technology",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      price: 189.32,
      change: -2.15,
      changePercent: -1.12,
      volume: "41.3M",
      marketCap: "1.9T",
      pe: 45.2,
      sector: "Consumer Discretionary",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      price: 267.89,
      change: 8.45,
      changePercent: 3.26,
      volume: "67.8M",
      marketCap: "850B",
      pe: 65.3,
      sector: "Automotive",
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      price: 523.12,
      change: 12.34,
      changePercent: 2.41,
      volume: "23.4M",
      marketCap: "1.3T",
      pe: 22.1,
      sector: "Technology",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 789.45,
      change: 15.67,
      changePercent: 2.03,
      volume: "38.9M",
      marketCap: "1.9T",
      pe: 68.2,
      sector: "Technology",
    },
    {
      symbol: "BRK.B",
      name: "Berkshire Hathaway Inc.",
      price: 345.67,
      change: -1.23,
      changePercent: -0.35,
      volume: "12.3M",
      marketCap: "800B",
      pe: 18.9,
      sector: "Financial Services",
    },
  ];

  const getChangeColor = (change: number) => {
    return change >= 0 ? "#107c10" : "#d83b01";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp sx={{ fontSize: 16 }} />
    ) : (
      <TrendingDown sx={{ fontSize: 16 }} />
    );
  };

  return (
    <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: 2 }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid #e1e5e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1 }}
            >
              Popular Companies to Learn From
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              Click on any company to start learning about its business and
              value
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label="Live Data"
              size="small"
              color="success"
              sx={{ fontWeight: 600 }}
            />
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>
                  Ticker
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}>
                  Company Name
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  Stock Price
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  Today's Change
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  % Change
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  Trading Volume
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  Company Value
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  P/E Ratio
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                >
                  Learn
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topStocks.map((stock) => (
                <TableRow
                  key={stock.symbol}
                  sx={{
                    "&:hover": { backgroundColor: "#f8f9fa" },
                    cursor: "pointer",
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "#0078d4", py: 2 }}>
                    {stock.symbol}
                  </TableCell>
                  <TableCell sx={{ color: "#1a1a1a", py: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {stock.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        {stock.sector}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: "#1a1a1a", py: 2 }}
                  >
                    ${stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      {getChangeIcon(stock.change)}
                      <Typography
                        variant="body2"
                        sx={{
                          color: getChangeColor(stock.change),
                          fontWeight: 600,
                        }}
                      >
                        {stock.change > 0 ? "+" : ""}
                        {stock.change.toFixed(2)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getChangeColor(stock.change),
                        fontWeight: 600,
                      }}
                    >
                      {stock.changePercent > 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#666", py: 2 }}>
                    {stock.volume}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#666", py: 2 }}>
                    {stock.marketCap}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "#666", py: 2 }}>
                    {stock.pe}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: "#0078d4",
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2,
                        "&:hover": {
                          backgroundColor: "#106ebe",
                        },
                      }}
                    >
                      Learn More
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
