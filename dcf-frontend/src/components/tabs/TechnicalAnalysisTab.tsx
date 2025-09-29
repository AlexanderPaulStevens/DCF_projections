import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  BarChart as BarChartIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon,
  CompareArrows as CompareArrowsIcon,
  Gesture as GestureIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Brush,
  Bar,
  Scatter,
} from 'recharts';
import {
  APIService,
  TechnicalAnalysisRequest,
  TechnicalAnalysisResponse,
  TechnicalIndicatorDefinition,
  TechnicalIndicatorResult,
} from '../../services/api';

interface TechnicalAnalysisTabProps {
  ticker: string;
  stockName?: string;
  darkMode?: boolean;
}

type IndicatorDisplay = 'overlay' | 'subchart' | 'pattern';

interface Annotation {
  id: string;
  label: string;
  value: number;
  color: string;
}

const DEFAULT_CONFIG: TechnicalAnalysisRequest = {
  period: '6mo',
  interval: '1d',
  chart_type: 'candlestick',
  include_volume: true,
  comparison_ticker: null,
  indicators: [
    { name: 'SMA', params: { timeperiod: 20 }, display: 'overlay' },
    { name: 'RSI', params: { timeperiod: 14 }, display: 'subchart' },
  ],
};

const ANNOTATION_COLORS = ['#fb8c00', '#ab47bc', '#00acc1', '#ef5350', '#26a69a'];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const CandlestickShape: React.FC<any> = (props) => {
  const { x, width, payload, yAxis } = props;
  const candleWidth = Math.max(width * 0.6, 3);
  const centerX = x + width / 2;
  const open = payload.open;
  const close = payload.close;
  const high = payload.high;
  const low = payload.low;

  const scale = yAxis?.scale;
  if (!scale) {
    return null;
  }

  const candleTop = scale(Math.max(open, close));
  const candleBottom = scale(Math.min(open, close));
  const wickTop = scale(high);
  const wickBottom = scale(low);
  const height = Math.max(candleBottom - candleTop, 1);
  const isBullish = close >= open;
  const color = isBullish ? '#26a69a' : '#ef5350';

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={1} />
      <rect x={centerX - candleWidth / 2} y={candleTop} width={candleWidth} height={height} fill={color} stroke={color} />
    </g>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label, indicatorMeta }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const pricePayload = payload.find((entry: any) => entry.dataKey === 'close');
  const open = payload.find((entry: any) => entry.dataKey === 'open')?.value;
  const high = payload.find((entry: any) => entry.dataKey === 'high')?.value;
  const low = payload.find((entry: any) => entry.dataKey === 'low')?.value;
  const volume = payload.find((entry: any) => entry.dataKey === 'volume')?.value;

  return (
    <Paper elevation={3} sx={{
      p: 2,
      minWidth: 220,
      backgroundColor: '#111111',
      border: '1px solid #333333',
      borderRadius: '8px'
    }}>
      <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
        {label}
      </Typography>
      {pricePayload && (
        <Stack spacing={0.5} sx={{ fontSize: '0.85rem' }}>
          <Typography sx={{ color: '#ffffff' }}>Open: {open?.toFixed(2)}</Typography>
          <Typography sx={{ color: '#ffffff' }}>High: {high?.toFixed(2)}</Typography>
          <Typography sx={{ color: '#ffffff' }}>Low: {low?.toFixed(2)}</Typography>
          <Typography sx={{ color: '#ffffff' }}>Close: {pricePayload.value?.toFixed(2)}</Typography>
          {typeof volume === 'number' && (
            <Typography sx={{ color: '#ffffff' }}>Volume: {Math.round(volume).toLocaleString()}</Typography>
          )}
          {payload
            .filter((entry: any) => entry.dataKey?.startsWith('indicator_'))
            .map((entry: any) => (
              <Typography key={entry.dataKey} sx={{ color: entry.stroke }}>
                {indicatorMeta[entry.dataKey]}: {entry.value?.toFixed(2)}
              </Typography>
            ))}
        </Stack>
      )}
    </Paper>
  );
};

const TechnicalAnalysisTab: React.FC<TechnicalAnalysisTabProps> = ({ ticker, darkMode = false }) => {
  const [config, setConfig] = useState<TechnicalAnalysisRequest>(DEFAULT_CONFIG);
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndicator, setEditingIndicator] = useState<number | null>(null);

  // Theme colors for charts - matching StockChart styling
  const themeColors = {
    background: darkMode ? '#1a1a1a' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    grid: darkMode ? '#333333' : '#e0e0e0',
    axis: darkMode ? '#b0b0b0' : '#666666',
    volume: darkMode ? '#90a4ae' : '#90a4ae',
    price: darkMode ? '#00d4ff' : '#1976d2',
    tooltip: {
      background: darkMode ? '#111111' : '#ffffff',
      border: darkMode ? '#333333' : '#e0e0e0',
      text: darkMode ? '#ffffff' : '#000000'
    }
  };
  const [indicatorParamsDraft, setIndicatorParamsDraft] = useState<Record<string, any>>({});
  const [comparisonDraft, setComparisonDraft] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationDraft, setAnnotationDraft] = useState<{ price: string; label: string }>({ price: '', label: '' });

  const fetchAnalysis = useCallback(
    async (nextConfig: TechnicalAnalysisRequest) => {
      if (!ticker) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await APIService.getTechnicalAnalysis(ticker, nextConfig);
        setAnalysis(response);
        if (response.meta?.active_config) {
          setConfig(response.meta.active_config);
          setComparisonDraft(response.meta.active_config.comparison_ticker ?? '');
        } else {
          setConfig(nextConfig);
        }
      } catch (err) {
        console.error('❌ Technical analysis fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Unable to generate technical analysis');
      } finally {
        setLoading(false);
      }
    },
    [ticker]
  );

  useEffect(() => {
    fetchAnalysis(DEFAULT_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const availableIndicators = useMemo(() => {
    if (!analysis?.meta?.available_indicators) {
      return {} as Record<string, TechnicalIndicatorDefinition[]>;
    }
    return analysis.meta.available_indicators;
  }, [analysis?.meta?.available_indicators]);

  const indicatorMetaLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    analysis?.indicators.forEach((indicator) => {
      indicator.series.forEach((series, idx) => {
        const key = `indicator_${indicator.id}_${series.name}_${idx}`;
        lookup[key] = `${indicator.label} (${series.name})`;
      });
    });
    return lookup;
  }, [analysis?.indicators]);

  const closeMap = useMemo(() => {
    const map = new Map<string, number>();
    analysis?.price.forEach((point) => {
      map.set(point.date, point.close);
    });
    return map;
  }, [analysis?.price]);

  const comparisonMap = useMemo(() => {
    const map = new Map<string, number | null>();
    analysis?.comparison?.series.forEach((point) => {
      map.set(point.date, point.value ?? null);
    });
    return map;
  }, [analysis?.comparison]);

  const chartData = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return analysis.price.map((point, index) => {
      const base: Record<string, any> = {
        ...point,
        dateLabel: formatDate(point.date),
        comparison: comparisonMap.get(point.date) ?? null,
      };

      analysis.indicators.forEach((indicator) => {
        indicator.series.forEach((series, seriesIndex) => {
          const key = `indicator_${indicator.id}_${series.name}_${seriesIndex}`;
          base[key] = series.values[index] ?? null;
        });
      });

      return base;
    });
  }, [analysis, comparisonMap]);

  const overlayIndicators = useMemo(() => {
    return analysis?.indicators.filter((indicator) => indicator.display === 'overlay') ?? [];
  }, [analysis?.indicators]);

  const subchartIndicators = useMemo(() => {
    return analysis?.indicators.filter((indicator) => indicator.display === 'subchart') ?? [];
  }, [analysis?.indicators]);

  const patternMarkers = useMemo(() => {
    if (!analysis) {
      return [] as Array<{ date: string; value: number; label: string; strength: number }>;
    }
    const markers: Array<{ date: string; value: number; label: string; strength: number }> = [];
    analysis.patterns.forEach((pattern) => {
      pattern.occurrences.forEach((occurrence) => {
        const price = closeMap.get(occurrence.date) ?? null;
        if (price !== null) {
          markers.push({
            date: occurrence.date,
            value: price,
            label: pattern.label,
            strength: occurrence.value,
          });
        }
      });
    });
    return markers;
  }, [analysis, closeMap]);

  const handleAddIndicator = (definition: TechnicalIndicatorDefinition) => {
    if (!definition) {
      return;
    }
    const nextIndicators = [...(config.indicators ?? [])];
    nextIndicators.push({
      name: definition.name,
      params: { ...definition.default_params },
      display: definition.default_display as IndicatorDisplay,
    });
    const nextConfig = { ...config, indicators: nextIndicators };
    fetchAnalysis(nextConfig);
  };

  const handleRemoveIndicator = (index: number) => {
    const nextIndicators = [...(config.indicators ?? [])];
    nextIndicators.splice(index, 1);
    const nextConfig = { ...config, indicators: nextIndicators };
    fetchAnalysis(nextConfig);
  };

  const handleToggleDisplay = (index: number, display: IndicatorDisplay) => {
    const nextIndicators = [...(config.indicators ?? [])];
    const current = nextIndicators[index];
    if (!current) {
      return;
    }
    nextIndicators[index] = { ...current, display };
    fetchAnalysis({ ...config, indicators: nextIndicators });
  };

  const openIndicatorDialog = (index: number, indicator: TechnicalIndicatorResult) => {
    setEditingIndicator(index);
    setIndicatorParamsDraft({ ...(indicator.metadata?.params ?? {}) });
  };

  const handleIndicatorParamChange = (key: string, value: string) => {
    setIndicatorParamsDraft((prev) => ({
      ...prev,
      [key]: Number.isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const saveIndicatorParams = () => {
    if (editingIndicator === null) {
      return;
    }
    const nextIndicators = [...(config.indicators ?? [])];
    const current = nextIndicators[editingIndicator];
    if (!current) {
      return;
    }
    nextIndicators[editingIndicator] = {
      ...current,
      params: { ...current.params, ...indicatorParamsDraft },
    };
    setEditingIndicator(null);
    fetchAnalysis({ ...config, indicators: nextIndicators });
  };

  const handleConfigChange = (key: keyof TechnicalAnalysisRequest, value: any) => {
    const nextConfig = { ...config, [key]: value };
    fetchAnalysis(nextConfig);
  };

  const handleComparisonApply = () => {
    const value = comparisonDraft.trim().toUpperCase() || null;
    handleConfigChange('comparison_ticker', value);
  };

  const addAnnotation = () => {
    const priceValue = parseFloat(annotationDraft.price);
    if (Number.isNaN(priceValue)) {
      return;
    }
    const annotation: Annotation = {
      id: `${Date.now()}`,
      label: annotationDraft.label || `Line @ ${priceValue.toFixed(2)}`,
      value: priceValue,
      color: ANNOTATION_COLORS[annotations.length % ANNOTATION_COLORS.length],
    };
    setAnnotations((prev) => [...prev, annotation]);
    setAnnotationDraft({ price: '', label: '' });
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
  };

  const indicatorDefinitionsByName = useMemo(() => {
    const map = new Map<string, TechnicalIndicatorDefinition>();
    Object.values(availableIndicators).forEach((group) => {
      group.forEach((definition) => map.set(definition.name, definition));
    });
    return map;
  }, [availableIndicators]);

  if (loading && !analysis) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !analysis) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        {error}
      </Alert>
    );
  }

  const periods = analysis?.meta?.periods ?? ['1mo', '3mo', '6mo', '1y'];
  const chartTypes = analysis?.meta?.chart_types ?? ['line', 'candlestick', 'area'];

  return (
    <Box sx={{ py: 3 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: { xs: 1, md: 8, lg: 9 } }}>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}>Technical Analysis</Typography>
                <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#666666' }}>
                  Powered by TA-Lib with interactive overlays, oscillators, and pattern insights.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel
                    id="ta-period-label"
                    sx={{ color: darkMode ? '#ffffff' : '#000000' }}
                  >
                    Period
                  </InputLabel>
                  <Select
                    labelId="ta-period-label"
                    value={config.period ?? '6mo'}
                    label="Period"
                    onChange={(event) => handleConfigChange('period', event.target.value as string)}
                    sx={{
                      color: darkMode ? '#ffffff' : '#000000',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#444444' : '#e0e0e0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#666666' : '#b0b0b0',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#00d4ff' : '#1976d2',
                      },
                      '& .MuiSvgIcon-root': {
                        color: darkMode ? '#ffffff' : '#000000',
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                          border: `1px solid ${darkMode ? '#444444' : '#e0e0e0'}`,
                        }
                      }
                    }}
                  >
                    {periods.map((period) => (
                      <MenuItem
                        key={period}
                        value={period}
                        sx={{
                          color: darkMode ? '#ffffff' : '#000000',
                          '&:hover': {
                            backgroundColor: darkMode ? '#444444' : '#f5f5f5',
                          },
                          '&.Mui-selected': {
                            backgroundColor: darkMode ? '#333333' : '#e3f2fd',
                            '&:hover': {
                              backgroundColor: darkMode ? '#444444' : '#e3f2fd',
                            }
                          }
                        }}
                      >
                        {period.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel
                    id="ta-chart-type-label"
                    sx={{ color: darkMode ? '#ffffff' : '#000000' }}
                  >
                    Chart
                  </InputLabel>
                  <Select
                    labelId="ta-chart-type-label"
                    value={config.chart_type ?? 'candlestick'}
                    label="Chart"
                    onChange={(event) => handleConfigChange('chart_type', event.target.value as any)}
                    sx={{
                      color: darkMode ? '#ffffff' : '#000000',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#444444' : '#e0e0e0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#666666' : '#b0b0b0',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? '#00d4ff' : '#1976d2',
                      },
                      '& .MuiSvgIcon-root': {
                        color: darkMode ? '#ffffff' : '#000000',
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                          border: `1px solid ${darkMode ? '#444444' : '#e0e0e0'}`,
                        }
                      }
                    }}
                  >
                    {chartTypes.map((type) => (
                      <MenuItem
                        key={type}
                        value={type}
                        sx={{
                          color: darkMode ? '#ffffff' : '#000000',
                          '&:hover': {
                            backgroundColor: darkMode ? '#444444' : '#f5f5f5',
                          },
                          '&.Mui-selected': {
                            backgroundColor: darkMode ? '#333333' : '#e3f2fd',
                            '&:hover': {
                              backgroundColor: darkMode ? '#444444' : '#e3f2fd',
                            }
                          }
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(config.include_volume)}
                      onChange={(event) => handleConfigChange('include_volume', event.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: darkMode ? '#00d4ff' : '#1976d2',
                          '& + .MuiSwitch-track': {
                            backgroundColor: darkMode ? '#00d4ff' : '#1976d2',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: darkMode ? '#00d4ff' : '#1976d2',
                        },
                        '& .MuiSwitch-track': {
                          backgroundColor: darkMode ? '#444444' : '#b0b0b0',
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: darkMode ? '#ffffff' : '#000000' }}>
                      Volume
                    </Typography>
                  }
                />
              </Stack>
            </Stack>

            {!analysis ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 420 }}>
                <ResponsiveContainer>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 40, bottom: 20, left: 0 }}
                    style={{ backgroundColor: themeColors.background }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
                    <XAxis dataKey="dateLabel" minTickGap={20} stroke={themeColors.axis} fontSize={12} />
                    <YAxis yAxisId="price" domain={['dataMin', 'dataMax']} width={60} stroke={themeColors.axis} fontSize={12} />
                    {config.include_volume && (
                      <YAxis yAxisId="volume" orientation="right" width={60} stroke={themeColors.axis} fontSize={12} />
                    )}
                    <RechartsTooltip content={<CustomTooltip indicatorMeta={indicatorMetaLookup} />} />
                    <Legend />
                    <Brush dataKey="dateLabel" height={30} stroke={themeColors.price} />

                    {config.chart_type === 'candlestick' ? (
                      <Bar
                        dataKey="close"
                        yAxisId="price"
                        shape={<CandlestickShape />}
                        barSize={8}
                        isAnimationActive={false}
                      />
                    ) : null}

                    {config.chart_type === 'line' && (
                      <Line
                        type="monotone"
                        dataKey="close"
                        yAxisId="price"
                        stroke={themeColors.price}
                        dot={false}
                        strokeWidth={2}
                        name="Close"
                      />
                    )}

                    {config.chart_type === 'area' && (
                      <Area
                        type="monotone"
                        dataKey="close"
                        yAxisId="price"
                        stroke={themeColors.price}
                        fill={themeColors.price}
                        fillOpacity={0.2}
                        name="Close"
                      />
                    )}

                    {config.include_volume && (
                      <Area
                        type="step"
                        dataKey="volume"
                        yAxisId="volume"
                        stroke={themeColors.volume}
                        fill={themeColors.volume}
                        fillOpacity={0.15}
                        name="Volume"
                      />
                    )}

                    {overlayIndicators.map((indicator, overlayIndex) =>
                      indicator.series.map((series, seriesIndex) => {
                        const dataKey = `indicator_${indicator.id}_${series.name}_${seriesIndex}`;
                        const color = indicator.color ?? ANNOTATION_COLORS[(overlayIndex + seriesIndex) % ANNOTATION_COLORS.length];
                        return (
                          <Line
                            key={dataKey}
                            type="monotone"
                            dataKey={dataKey}
                            yAxisId="price"
                            stroke={color}
                            strokeWidth={seriesIndex === 0 ? 2 : 1.5}
                            dot={false}
                            name={`${indicator.label} (${series.name})`}
                          />
                        );
                      })
                    )}

                    {analysis.comparison && (
                      <Line
                        type="monotone"
                        dataKey="comparison"
                        yAxisId="price"
                        stroke="#ffb300"
                        strokeDasharray="5 5"
                        dot={false}
                        name={`${analysis.comparison.label}`}
                      />
                    )}

                    {patternMarkers.length > 0 && (
                      <Scatter
                        data={patternMarkers.map((point) => ({
                          dateLabel: formatDate(point.date),
                          value: point.value,
                          label: point.label,
                        }))}
                        yAxisId="price"
                        shape="triangle"
                        fill="#f06292"
                        name="Patterns"
                      />
                    )}

                    {annotations.map((annotation) => (
                      <ReferenceLine
                        key={annotation.id}
                        y={annotation.value}
                        label={{ value: annotation.label, fill: annotation.color }}
                        stroke={annotation.color}
                        yAxisId="price"
                        strokeDasharray="3 3"
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>

          {subchartIndicators.length > 0 && (
            <Stack spacing={3}>
              {subchartIndicators.map((indicator) => (
                <Paper key={indicator.id} sx={{ p: 2, backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}>
                    {indicator.label}
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        style={{ backgroundColor: themeColors.background }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
                        <XAxis dataKey="dateLabel" hide minTickGap={20} stroke={themeColors.axis} fontSize={12} />
                        <YAxis domain={['dataMin', 'dataMax']} stroke={themeColors.axis} fontSize={12} />
                        <RechartsTooltip
                          labelStyle={{ color: '#ffffff' }}
                          contentStyle={{
                            backgroundColor: '#111111',
                            border: '1px solid #333333',
                            borderRadius: '8px'
                          }}
                        />
                        {indicator.series.map((series, seriesIndex) => {
                          const dataKey = `indicator_${indicator.id}_${series.name}_${seriesIndex}`;
                          const color = indicator.color ?? ANNOTATION_COLORS[(seriesIndex + 2) % ANNOTATION_COLORS.length];
                          return (
                            <Line
                              key={dataKey}
                              type="monotone"
                              dataKey={dataKey}
                              stroke={color}
                              dot={false}
                              strokeWidth={2}
                              name={`${indicator.label} (${series.name})`}
                            />
                          );
                        })}
                        {indicator.name === 'RSI' && (
                          <ReferenceLine y={70} stroke="#ef5350" strokeDasharray="4 4" />
                        )}
                        {indicator.name === 'RSI' && (
                          <ReferenceLine y={30} stroke="#26a69a" strokeDasharray="4 4" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        <Box sx={{ flex: { xs: 1, md: 4, lg: 3 } }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3, backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: darkMode ? '#ffffff' : '#000000' }}>
                Indicator Library
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: darkMode ? '#b0b0b0' : '#666666' }}>
                Add overlays and oscillators to the chart. Parameters can be tuned after adding.
              </Typography>
              <Stack spacing={1.5}>
                {Object.entries(availableIndicators).map(([category, definitions]) => (
                  <Accordion
                    key={category}
                    disableGutters
                    defaultExpanded={category === 'Trend'}
                    sx={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                      border: `1px solid ${darkMode ? '#444444' : '#e0e0e0'}`,
                      borderRadius: 1,
                      mb: 1,
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        margin: 0,
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? '#ffffff' : '#000000' }} />}
                      sx={{
                        backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#000000',
                        '&.Mui-expanded': {
                          minHeight: 48,
                        }
                      }}
                    >
                      <Typography sx={{ fontWeight: 500, color: darkMode ? '#ffffff' : '#000000' }}>{category}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: darkMode ? '#2a2a2a' : '#ffffff', pt: 0 }}>
                      <Stack spacing={1}>
                        {definitions.map((definition) => (
                          <Paper key={definition.name} variant="outlined" sx={{ p: 1.5, backgroundColor: darkMode ? '#2a2a2a' : '#ffffff', borderColor: darkMode ? '#444444' : '#e0e0e0' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}>
                                  {definition.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: darkMode ? '#b0b0b0' : '#666666' }}>
                                  {definition.description}
                                </Typography>
                              </Box>
                              <Tooltip title="Add indicator">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleAddIndicator(definition)}
                                    disabled={config.indicators?.some((indicator) => indicator.name === definition.name && definition.default_display === 'pattern')}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: darkMode ? '#ffffff' : '#000000' }}>
                Active Indicators
              </Typography>
              <Stack spacing={1.5}>
                {(config.indicators ?? []).map((indicator, index) => {
                  const definition = indicatorDefinitionsByName.get(indicator.name);
                  const activeResult = analysis?.indicators?.[index];
                  const display = indicator.display ?? definition?.default_display ?? 'overlay';

                  return (
                    <Paper key={`${indicator.name}_${index}`} variant="outlined" sx={{ p: 1.5, backgroundColor: darkMode ? '#2a2a2a' : '#ffffff', borderColor: darkMode ? '#444444' : '#e0e0e0' }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#000000' }}>
                            {definition?.label ?? indicator.name}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {definition?.supports_overlay && (
                              <Chip
                                label="Overlay"
                                size="small"
                                icon={<ShowChartIcon fontSize="inherit" />}
                                color={display === 'overlay' ? 'primary' : 'default'}
                                onClick={() => handleToggleDisplay(index, 'overlay')}
                              />
                            )}
                            {definition?.supports_subchart && (
                              <Chip
                                label="Sub-chart"
                                size="small"
                                icon={<BarChartIcon fontSize="inherit" />}
                                color={display === 'subchart' ? 'primary' : 'default'}
                                onClick={() => handleToggleDisplay(index, 'subchart')}
                              />
                            )}
                            <Tooltip title="Edit parameters">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => activeResult && openIndicatorDialog(index, activeResult)}
                                  disabled={!activeResult}
                                >
                                  <SettingsIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Remove indicator">
                              <IconButton size="small" onClick={() => handleRemoveIndicator(index)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {definition?.description}
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })}
                {!(config.indicators ?? []).length && (
                  <Typography variant="body2" color="text.secondary">
                    No active indicators. Select indicators from the library above to enrich the chart.
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: darkMode ? '#ffffff' : '#000000' }}>
                Comparison & Notes
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Comparison Ticker"
                  size="small"
                  value={comparisonDraft}
                  onChange={(event) => setComparisonDraft(event.target.value.toUpperCase())}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CompareArrowsIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" onClick={handleComparisonApply}>
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setComparisonDraft('');
                      handleConfigChange('comparison_ticker', null);
                    }}
                  >
                    Clear
                  </Button>
                </Stack>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Annotations
                </Typography>
                <Stack spacing={1}>
                  <TextField
                    label="Price Level"
                    size="small"
                    value={annotationDraft.price}
                    onChange={(event) => setAnnotationDraft((prev) => ({ ...prev, price: event.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ShowChartIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Label"
                    size="small"
                    value={annotationDraft.label}
                    onChange={(event) => setAnnotationDraft((prev) => ({ ...prev, label: event.target.value }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GestureIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addAnnotation}>
                    Add Annotation
                  </Button>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {annotations.map((annotation) => (
                      <Chip
                        key={annotation.id}
                        label={`${annotation.label} (${annotation.value.toFixed(2)})`}
                        onDelete={() => removeAnnotation(annotation.id)}
                        sx={{ borderColor: annotation.color, color: annotation.color }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Dialog open={editingIndicator !== null} onClose={() => setEditingIndicator(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Indicator Parameters</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {Object.entries(indicatorParamsDraft).map(([key, value]) => (
              <TextField
                key={key}
                label={key}
                value={value}
                onChange={(event) => handleIndicatorParamChange(key, event.target.value)}
              />
            ))}
            {!Object.keys(indicatorParamsDraft).length && (
              <Typography variant="body2" color="text.secondary">
                This indicator does not expose configurable parameters.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingIndicator(null)}>Cancel</Button>
          <Button onClick={saveIndicatorParams} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TechnicalAnalysisTab;
