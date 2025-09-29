"""Technical analysis service powered by TA-Lib (with graceful fallbacks)."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

try:  # pragma: no cover - optional dependency
    import talib  # type: ignore
except (ImportError, OSError):  # noqa: WPS440 - fallback logic
    talib = None  # type: ignore

from backend.app.services.yahoo_finance_service import YahooFinanceService


@dataclass
class IndicatorDefinition:
    """Descriptor for a supported technical indicator."""

    name: str
    label: str
    category: str
    default_display: str
    default_params: Dict[str, Any]
    description: str
    supports_overlay: bool = True
    supports_subchart: bool = False
    outputs: List[str] = field(default_factory=list)


@dataclass
class IndicatorResult:
    """Computed indicator payload for API responses."""

    id: str
    name: str
    label: str
    display: str
    color: Optional[str]
    series: List[Dict[str, Any]]
    metadata: Dict[str, Any] = field(default_factory=dict)


class TechnicalAnalysisService:
    """Service that orchestrates technical indicator calculations."""

    _COLOR_PALETTE = [
        "#1976d2",
        "#d32f2f",
        "#388e3c",
        "#f57c00",
        "#7b1fa2",
        "#0097a7",
        "#c2185b",
        "#512da8",
        "#00796b",
        "#c0ca33",
    ]

    def __init__(self):
        self.yahoo_service = YahooFinanceService()
        self.indicators: Dict[str, IndicatorDefinition] = {
            "SMA": IndicatorDefinition(
                name="SMA",
                label="Simple Moving Average",
                category="Trend",
                default_display="overlay",
                default_params={"timeperiod": 20},
                description="Rolling arithmetic mean of closing prices.",
                outputs=["SMA"],
            ),
            "EMA": IndicatorDefinition(
                name="EMA",
                label="Exponential Moving Average",
                category="Trend",
                default_display="overlay",
                default_params={"timeperiod": 20},
                description="Exponential weighted moving average for faster responsiveness.",
                outputs=["EMA"],
            ),
            "MACD": IndicatorDefinition(
                name="MACD",
                label="MACD",
                category="Trend",
                default_display="subchart",
                default_params={"fastperiod": 12, "slowperiod": 26, "signalperiod": 9},
                description="Moving Average Convergence Divergence oscillator.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["macd", "signal", "hist"],
            ),
            "RSI": IndicatorDefinition(
                name="RSI",
                label="Relative Strength Index",
                category="Momentum",
                default_display="subchart",
                default_params={"timeperiod": 14},
                description="Momentum oscillator measuring speed and change of price movements.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["rsi"],
            ),
            "STOCH": IndicatorDefinition(
                name="STOCH",
                label="Stochastic Oscillator",
                category="Momentum",
                default_display="subchart",
                default_params={
                    "fastk_period": 14,
                    "slowk_period": 3,
                    "slowd_period": 3,
                },
                description="Momentum indicator comparing closing price to price range.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["slowk", "slowd"],
            ),
            "ROC": IndicatorDefinition(
                name="ROC",
                label="Rate of Change",
                category="Momentum",
                default_display="subchart",
                default_params={"timeperiod": 12},
                description="Percentage change between the current price and price n periods ago.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["roc"],
            ),
            "BBANDS": IndicatorDefinition(
                name="BBANDS",
                label="Bollinger Bands",
                category="Volatility",
                default_display="overlay",
                default_params={"timeperiod": 20, "nbdevup": 2, "nbdevdn": 2},
                description="Price envelopes plotted at standard deviations above/below SMA.",
                outputs=["upper", "middle", "lower"],
            ),
            "ATR": IndicatorDefinition(
                name="ATR",
                label="Average True Range",
                category="Volatility",
                default_display="subchart",
                default_params={"timeperiod": 14},
                description="Average range of price movement for volatility analysis.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["atr"],
            ),
            "OBV": IndicatorDefinition(
                name="OBV",
                label="On-Balance Volume",
                category="Volume",
                default_display="subchart",
                default_params={},
                description="Cumulative volume flow used to predict price movements.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["obv"],
            ),
            "AD": IndicatorDefinition(
                name="AD",
                label="Chaikin A/D Line",
                category="Volume",
                default_display="subchart",
                default_params={},
                description="Accumulation/Distribution line based on price and volume.",
                supports_overlay=False,
                supports_subchart=True,
                outputs=["ad_line"],
            ),
            "CDLDOJI": IndicatorDefinition(
                name="CDLDOJI",
                label="Doji Pattern",
                category="Pattern",
                default_display="pattern",
                default_params={},
                description="Identifies Doji candlestick patterns.",
                supports_overlay=False,
                supports_subchart=False,
                outputs=["pattern"],
            ),
            "CDLENGULFING": IndicatorDefinition(
                name="CDLENGULFING",
                label="Engulfing Pattern",
                category="Pattern",
                default_display="pattern",
                default_params={},
                description="Detects bullish or bearish engulfing patterns.",
                supports_overlay=False,
                supports_subchart=False,
                outputs=["pattern"],
            ),
            "CDLHAMMER": IndicatorDefinition(
                name="CDLHAMMER",
                label="Hammer Pattern",
                category="Pattern",
                default_display="pattern",
                default_params={},
                description="Identifies hammer and hanging man formations.",
                supports_overlay=False,
                supports_subchart=False,
                outputs=["pattern"],
            ),
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def available_indicator_catalogue(self) -> Dict[str, List[Dict[str, Any]]]:
        """Return indicator metadata grouped by category for the frontend."""
        catalogue: Dict[str, List[Dict[str, Any]]] = {}
        for indicator in self.indicators.values():
            catalogue.setdefault(indicator.category, []).append(
                {
                    "name": indicator.name,
                    "label": indicator.label,
                    "default_display": indicator.default_display,
                    "default_params": indicator.default_params,
                    "description": indicator.description,
                    "supports_overlay": indicator.supports_overlay,
                    "supports_subchart": indicator.supports_subchart,
                    "outputs": indicator.outputs,
                }
            )
        # Ensure deterministic ordering for UI
        for values in catalogue.values():
            values.sort(key=lambda item: item["label"])
        return dict(sorted(catalogue.items(), key=lambda item: item[0]))

    def default_config(self) -> Dict[str, Any]:
        """Provide the default configuration consumed by clients."""
        return {
            "period": "6mo",
            "interval": "1d",
            "chart_type": "candlestick",
            "include_volume": True,
            "comparison_ticker": None,
            "indicators": [
                {
                    "name": "SMA",
                    "params": {"timeperiod": 20},
                    "display": "overlay",
                },
                {
                    "name": "RSI",
                    "params": {"timeperiod": 14},
                    "display": "subchart",
                },
            ],
        }

    def analyse(self, ticker: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Run the technical analysis workflow for the given ticker."""
        merged_config = self._merge_config(config)
        hist_df = self._fetch_historical(
            ticker, merged_config["period"], merged_config["interval"]
        )
        if hist_df is None or hist_df.empty:
            raise ValueError("No historical data available for technical analysis")

        price_payload = self._build_price_payload(hist_df)
        indicator_results, pattern_results = self._compute_indicators(
            hist_df, merged_config["indicators"]
        )

        comparison_payload = None
        if merged_config.get("comparison_ticker"):
            comparison_payload = self._build_comparison_series(
                merged_config["comparison_ticker"],
                hist_df,
                merged_config["period"],
                merged_config["interval"],
            )

        response = {
            "ticker": ticker.upper(),
            "period": merged_config["period"],
            "interval": merged_config["interval"],
            "chart_type": merged_config["chart_type"],
            "include_volume": merged_config["include_volume"],
            "price": price_payload,
            "indicators": [result.__dict__ for result in indicator_results],
            "patterns": pattern_results,
            "comparison": comparison_payload,
            "meta": {
                "available_indicators": self.available_indicator_catalogue(),
                "chart_types": ["line", "candlestick", "area"],
                "periods": ["1mo", "3mo", "6mo", "1y", "2y", "5y"],
                "active_config": merged_config,
                "generated_at": datetime.utcnow().isoformat(),
            },
        }
        return response

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _merge_config(self, config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        merged = self.default_config()
        if not config:
            return merged

        merged.update({k: v for k, v in config.items() if k in merged})

        indicators: List[Dict[str, Any]] = []
        for indicator in config.get("indicators", []) or []:
            name = str(indicator.get("name", "")).upper()
            definition = self.indicators.get(name)
            if not definition:
                continue
            params = {**definition.default_params, **(indicator.get("params") or {})}
            display = indicator.get("display") or definition.default_display
            indicators.append(
                {
                    "name": name,
                    "params": params,
                    "display": display,
                }
            )
        if indicators:
            merged["indicators"] = indicators
        return merged

    def _fetch_historical(
        self, ticker: str, period: str, interval: str
    ) -> Optional[pd.DataFrame]:
        hist_df = self.yahoo_service.get_historical_data(ticker, period=period)
        if hist_df is None or hist_df.empty:
            return None
        # Ensure consistent column casing and ordering
        df = hist_df.rename(
            columns={
                "Date": "date",
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Volume": "volume",
            }
        )
        df = df[["date", "open", "high", "low", "close", "volume"]]
        df["date"] = pd.to_datetime(df["date"])
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    def _build_price_payload(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        return [
            {
                "date": row.date.isoformat(),
                "open": float(row.open),
                "high": float(row.high),
                "low": float(row.low),
                "close": float(row.close),
                "volume": float(row.volume) if not math.isnan(row.volume) else 0.0,
            }
            for row in df.itertuples()
        ]

    def _compute_indicators(
        self,
        df: pd.DataFrame,
        indicators: Iterable[Dict[str, Any]],
    ) -> tuple[List[IndicatorResult], List[Dict[str, Any]]]:
        results: List[IndicatorResult] = []
        patterns: List[Dict[str, Any]] = []
        color_index = 0

        for indicator_cfg in indicators:
            name = indicator_cfg.get("name")
            definition = self.indicators.get(name)
            if not definition:
                continue

            if definition.category == "Pattern":
                pattern_data = self._compute_pattern(definition, df)
                if pattern_data:
                    patterns.append(pattern_data)
                continue

            display = indicator_cfg.get("display", definition.default_display)
            params = indicator_cfg.get("params", definition.default_params)
            series_payload = self._calculate_indicator_series(definition, df, params)
            if not series_payload:
                continue

            color = self._COLOR_PALETTE[color_index % len(self._COLOR_PALETTE)]
            color_index += 1

            results.append(
                IndicatorResult(
                    id=f"{definition.name}_{color_index}",
                    name=definition.name,
                    label=definition.label,
                    display=display,
                    color=color,
                    series=series_payload,
                    metadata={"params": params},
                )
            )

        return results, patterns

    def _calculate_indicator_series(
        self,
        definition: IndicatorDefinition,
        df: pd.DataFrame,
        params: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        close = df["close"].astype(float).to_numpy()
        high = df["high"].astype(float).to_numpy()
        low = df["low"].astype(float).to_numpy()
        volume = df["volume"].astype(float).to_numpy()

        series: Dict[str, np.ndarray]
        try:
            if (
                talib is not None
            ):  # pragma: no branch - straight-through use when available
                series = self._talib_indicator(
                    definition.name, params, close, high, low, volume
                )
            else:
                series = self._fallback_indicator(definition.name, params, df)
        except Exception:  # pragma: no cover - defensive programming
            series = self._fallback_indicator(definition.name, params, df)

        payload: List[Dict[str, Any]] = []
        for key, values in series.items():
            payload.append(
                {
                    "name": key,
                    "values": [
                        float(value) if not np.isnan(value) else None
                        for value in values
                    ],
                }
            )
        return payload

    def _talib_indicator(
        self,
        name: str,
        params: Dict[str, Any],
        close: np.ndarray,
        high: np.ndarray,
        low: np.ndarray,
        volume: np.ndarray,
    ) -> Dict[str, np.ndarray]:
        name = name.upper()
        if name == "SMA":
            return {"SMA": talib.SMA(close, **params)}
        if name == "EMA":
            return {"EMA": talib.EMA(close, **params)}
        if name == "MACD":
            macd, signal, hist = talib.MACD(close, **params)
            return {"macd": macd, "signal": signal, "hist": hist}
        if name == "RSI":
            return {"rsi": talib.RSI(close, **params)}
        if name == "STOCH":
            slowk, slowd = talib.STOCH(high, low, close, **params)
            return {"slowk": slowk, "slowd": slowd}
        if name == "ROC":
            return {"roc": talib.ROC(close, **params)}
        if name == "BBANDS":
            upper, middle, lower = talib.BBANDS(close, **params)
            return {"upper": upper, "middle": middle, "lower": lower}
        if name == "ATR":
            return {"atr": talib.ATR(high, low, close, **params)}
        if name == "OBV":
            return {"obv": talib.OBV(close, volume)}
        if name == "AD":
            return {"ad_line": talib.AD(high, low, close, volume)}
        raise ValueError(f"Unsupported indicator {name}")

    def _fallback_indicator(
        self,
        name: str,
        params: Dict[str, Any],
        df: pd.DataFrame,
    ) -> Dict[str, np.ndarray]:
        name = name.upper()
        close = df["close"].astype(float)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        volume = df["volume"].astype(float)

        if name == "SMA":
            period = int(params.get("timeperiod", 20))
            return {
                "SMA": close.rolling(window=period, min_periods=period)
                .mean()
                .to_numpy()
            }
        if name == "EMA":
            period = int(params.get("timeperiod", 20))
            return {"EMA": close.ewm(span=period, adjust=False).mean().to_numpy()}
        if name == "MACD":
            fast = int(params.get("fastperiod", 12))
            slow = int(params.get("slowperiod", 26))
            signal = int(params.get("signalperiod", 9))
            ema_fast = close.ewm(span=fast, adjust=False).mean()
            ema_slow = close.ewm(span=slow, adjust=False).mean()
            macd = ema_fast - ema_slow
            signal_line = macd.ewm(span=signal, adjust=False).mean()
            hist = macd - signal_line
            return {
                "macd": macd.to_numpy(),
                "signal": signal_line.to_numpy(),
                "hist": hist.to_numpy(),
            }
        if name == "RSI":
            period = int(params.get("timeperiod", 14))
            delta = close.diff()
            gain = delta.clip(lower=0)
            loss = -delta.clip(upper=0)
            avg_gain = gain.rolling(window=period, min_periods=period).mean()
            avg_loss = loss.rolling(window=period, min_periods=period).mean()
            rs = avg_gain / avg_loss.replace(0, np.nan)
            rsi = 100 - (100 / (1 + rs))
            return {"rsi": rsi.to_numpy()}
        if name == "STOCH":
            fastk = int(params.get("fastk_period", 14))
            slowk = int(params.get("slowk_period", 3))
            slowd = int(params.get("slowd_period", 3))
            lowest_low = low.rolling(window=fastk, min_periods=fastk).min()
            highest_high = high.rolling(window=fastk, min_periods=fastk).max()
            percent_k = ((close - lowest_low) / (highest_high - lowest_low)) * 100
            slowk_series = percent_k.rolling(window=slowk, min_periods=slowk).mean()
            slowd_series = slowk_series.rolling(window=slowd, min_periods=slowd).mean()
            return {
                "slowk": slowk_series.to_numpy(),
                "slowd": slowd_series.to_numpy(),
            }
        if name == "ROC":
            period = int(params.get("timeperiod", 12))
            roc = close.pct_change(periods=period) * 100
            return {"roc": roc.to_numpy()}
        if name == "BBANDS":
            period = int(params.get("timeperiod", 20))
            nbdevup = float(params.get("nbdevup", 2.0))
            nbdevdn = float(params.get("nbdevdn", 2.0))
            sma = close.rolling(window=period, min_periods=period).mean()
            std = close.rolling(window=period, min_periods=period).std()
            upper = sma + nbdevup * std
            lower = sma - nbdevdn * std
            return {
                "upper": upper.to_numpy(),
                "middle": sma.to_numpy(),
                "lower": lower.to_numpy(),
            }
        if name == "ATR":
            period = int(params.get("timeperiod", 14))
            prev_close = close.shift(1)
            tr = pd.concat(
                [
                    high - low,
                    (high - prev_close).abs(),
                    (low - prev_close).abs(),
                ],
                axis=1,
            ).max(axis=1)
            atr = tr.rolling(window=period, min_periods=period).mean()
            return {"atr": atr.to_numpy()}
        if name == "OBV":
            obv = (np.sign(close.diff().fillna(0)) * volume).fillna(0).cumsum()
            return {"obv": obv.to_numpy()}
        if name == "AD":
            money_flow_multiplier = ((close - low) - (high - close)) / (
                high - low
            ).replace(0, np.nan)
            money_flow_volume = money_flow_multiplier.fillna(0) * volume
            ad_line = money_flow_volume.cumsum()
            return {"ad_line": ad_line.to_numpy()}
        raise ValueError(f"Unsupported indicator {name}")

    def _compute_pattern(
        self, definition: IndicatorDefinition, df: pd.DataFrame
    ) -> Optional[Dict[str, Any]]:
        if talib is None:
            return None
        high = df["high"].astype(float).to_numpy()
        low = df["low"].astype(float).to_numpy()
        open_ = df["open"].astype(float).to_numpy()
        close = df["close"].astype(float).to_numpy()

        func = getattr(talib, definition.name, None)
        if func is None:
            return None
        raw = func(open_, high, low, close)
        occurrences = []
        for idx, value in enumerate(raw):
            if value != 0:
                occurrences.append(
                    {
                        "date": df.loc[idx, "date"].isoformat(),
                        "value": int(value),
                    }
                )
        if not occurrences:
            return None
        return {
            "name": definition.name,
            "label": definition.label,
            "occurrences": occurrences,
        }

    def _build_comparison_series(
        self,
        ticker: str,
        base_df: pd.DataFrame,
        period: str,
        interval: str,
    ) -> Optional[Dict[str, Any]]:
        comparison_df = self._fetch_historical(ticker, period, interval)
        if comparison_df is None or comparison_df.empty:
            return None
        # Align comparison to base dates using forward fill
        comparison_df = comparison_df.set_index("date").reindex(
            base_df["date"], method="nearest"
        )
        close = comparison_df["close"].astype(float)
        if close.isna().all():
            return None
        base_value = close.iloc[0]
        normalized = ((close / base_value) * 100).tolist()
        series = [
            {
                "date": date.isoformat(),
                "value": float(value) if not math.isnan(float(value)) else None,
            }
            for date, value in zip(base_df["date"], normalized)
        ]
        return {
            "ticker": ticker.upper(),
            "label": f"{ticker.upper()} (indexed)",
            "series": series,
        }


__all__ = ["TechnicalAnalysisService", "IndicatorDefinition", "IndicatorResult"]
