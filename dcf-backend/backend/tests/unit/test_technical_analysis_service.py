"""Unit tests for the technical analysis service."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict

import pandas as pd
import pytest
from backend.app.services.technical_analysis_service import TechnicalAnalysisService


def build_sample_history(rows: int = 30) -> pd.DataFrame:
    """Construct a deterministic historical dataframe for testing."""
    base_date = datetime(2024, 1, 1)
    data: Dict[str, list[Any]] = {
        "Date": [],
        "Open": [],
        "High": [],
        "Low": [],
        "Close": [],
        "Volume": [],
    }
    price = 100.0
    for offset in range(rows):
        current = base_date + timedelta(days=offset)
        open_price = price
        close_price = price + ((offset % 5) - 2) * 0.5
        high_price = max(open_price, close_price) + 1
        low_price = min(open_price, close_price) - 1
        volume = 1_000_000 + offset * 10_000
        data["Date"].append(current)
        data["Open"].append(open_price)
        data["High"].append(high_price)
        data["Low"].append(low_price)
        data["Close"].append(close_price)
        data["Volume"].append(volume)
        price = close_price
    return pd.DataFrame(data)


@pytest.fixture()
def technical_service(monkeypatch: pytest.MonkeyPatch) -> TechnicalAnalysisService:
    """Provide a service instance with deterministic data and no TA-Lib runtime."""
    # Ensure the service uses fallback implementations (TA-Lib may be unavailable in CI)
    monkeypatch.setattr(
        "backend.app.services.technical_analysis_service.talib",
        None,
    )
    service = TechnicalAnalysisService()
    sample_history = build_sample_history()
    monkeypatch.setattr(
        service.yahoo_service,
        "get_historical_data",
        lambda ticker, period: sample_history.copy(),
    )
    return service


def test_analyse_returns_indicator_payload(technical_service: TechnicalAnalysisService):
    """Service should return price points and computed indicator series."""
    request = {
        "period": "1mo",
        "interval": "1d",
        "chart_type": "line",
        "include_volume": True,
        "indicators": [
            {"name": "SMA", "params": {"timeperiod": 5}, "display": "overlay"},
            {"name": "RSI", "params": {"timeperiod": 14}, "display": "subchart"},
        ],
    }

    payload = technical_service.analyse("TEST", request)

    assert payload["ticker"] == "TEST"
    assert len(payload["price"]) == 30

    indicators = payload["indicators"]
    assert indicators, "Expected indicator payload to be populated"

    sma_series = next(
        series
        for series in indicators[0]["series"]
        if series["name"].lower().startswith("sma")
    )
    assert sma_series["values"][-1] is not None

    rsi_entry = next(
        indicator for indicator in indicators if indicator["name"] == "RSI"
    )
    assert rsi_entry["display"] == "subchart"
    assert any(value is not None for value in rsi_entry["series"][0]["values"])


def test_comparison_series_alignment(technical_service: TechnicalAnalysisService):
    """Comparison series should align to base dates and be normalised."""
    comparison_history = build_sample_history()
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(
        technical_service.yahoo_service,
        "get_historical_data",
        lambda ticker, period: comparison_history.copy(),
    )

    request = {
        "comparison_ticker": "MSFT",
        "indicators": [],
    }

    payload = technical_service.analyse("AAPL", request)
    comparison = payload["comparison"]
    assert comparison is not None
    assert comparison["ticker"] == "MSFT"
    assert len(comparison["series"]) == len(payload["price"])
    # First value should normalise to 100
    assert pytest.approx(comparison["series"][0]["value"], rel=1e-3) == 100

    monkeypatch.undo()
