import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { DCFTab } from './tabs/DCFTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import { CompetitiveTab } from './tabs/CompetitiveTab';
import { BusinessStrategyTab } from './tabs/BusinessStrategyTab';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  bid: string;
  ask: string;
  dayRange: string;
  fiftyTwoWeekRange: string;
  volume: string;
  avgVolume: string;
  marketCap: string;
  beta: number;
  peRatio: number;
  eps: number;
  earningsDate: string;
  forwardDividend: string;
  exDividendDate: string;
  targetEstimate: number;
}

interface StockTabsProps {
  stockData: StockData;
}

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
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function StockTabs({ stockData }: StockTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'DCF Analysis', value: 'dcf' },
    { label: 'Analysis', value: 'analysis' },
    { label: 'Competitive Analysis', value: 'competitive' },
    { label: 'Business Strategy', value: 'strategy' },
    { label: 'Financials', value: 'financials' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            color: '#b0b0b0',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'none',
            minHeight: 48,
            '&.Mui-selected': {
              color: '#00d4ff',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#00d4ff',
            height: 3,
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.value}
            label={tab.label}
            id={`stock-tab-${index}`}
            aria-controls={`stock-tabpanel-${index}`}
          />
        ))}
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <DCFTab ticker={stockData.symbol} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AnalysisTab stockData={stockData} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CompetitiveTab stockData={{ price: stockData.price, symbol: stockData.symbol }} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <BusinessStrategyTab stockData={{ price: stockData.price, symbol: stockData.symbol }} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Box sx={{
          backgroundColor: 'rgba(17, 17, 17, 0.8)',
          p: 3,
          borderRadius: 2,
          border: '1px solid #333333'
        }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>
            Financial Statements
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Financial statements would be displayed here.
          </Typography>
        </Box>
      </TabPanel>
    </Box>
  );
}
