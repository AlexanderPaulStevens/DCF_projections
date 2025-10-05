"""Core company data schemas for API responses."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CompanyInfo(BaseModel):
    """Company demographic and business information."""

    ticker: str
    name: str
    sector: str
    industry: str
    website: str
    description: str
    employees: int
    city: str
    state: str
    country: str
    exchange: str
    currency: str
    founded_year: Optional[int] = None
    ceo: Optional[str] = None
    headquarters: Optional[str] = None
    business_summary: Optional[str] = None
    last_updated: str


class StockData(BaseModel):
    """Real-time stock price and market data."""

    ticker: str
    current_price: float
    previous_close: float
    open: float
    day_low: float
    day_high: float
    fifty_two_week_low: float
    fifty_two_week_high: float
    volume: int
    avg_volume: int
    market_cap: int
    beta: float
    pe_ratio: float
    forward_pe: float
    eps: float
    forward_eps: float
    dividend_yield: float
    ex_dividend_date: Optional[str] = None
    earnings_date: Optional[str] = None
    target_price: float
    recommendation: str
    price_change: float
    price_change_percent: float
    last_updated: str
    # Optional fields for historical data
    historical_data: Optional[List[Dict[str, Any]]] = None
    period: Optional[str] = None


class CompanySearchResult(BaseModel):
    """Company search result for autocomplete."""

    ticker: str
    name: str
    sector: Optional[str] = None


__all__ = [
    "CompanyInfo",
    "StockData",
    "CompanySearchResult",
]
