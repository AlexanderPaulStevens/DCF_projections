import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockChartProps {
  stockData: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
  };
  showForecast: boolean;
  onForecastToggle: (show: boolean) => void;
}

const StockChart: React.FC<StockChartProps> = ({ stockData, showForecast, onForecastToggle }) => {
  // Mock data for now - in a real app, this would come from props or API
  const mockData = [
    { date: '2024-01-01', close: 100 },
    { date: '2024-01-02', close: 102 },
    { date: '2024-01-03', close: 98 },
    { date: '2024-01-04', close: 105 },
    { date: '2024-01-05', close: 103 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3>{stockData.symbol}</h3>
        <p>Price: ${stockData.price}</p>
        <p>Change: {stockData.change} ({stockData.changePercent}%)</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
