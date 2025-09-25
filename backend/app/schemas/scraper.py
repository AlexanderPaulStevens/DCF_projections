"""Pydantic schemas for scraper-related API responses."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    ticker: str


class ScrapeResponse(BaseModel):
    task_id: str
    message: str
    status: str


class TaskStatus(BaseModel):
    task_id: str
    ticker: str
    status: str
    progress: int
    message: str
    started_at: str
    completed_at: Optional[str] = None


class ScrapingStatus(BaseModel):
    total_companies: int
    companies_with_data: int
    total_analysis_files: int
    coverage_percentage: float
    active_tasks: int
    total_tasks: int
    recent_tasks: List[str]
    last_updated: str


__all__ = [
    "ScrapeRequest",
    "ScrapeResponse",
    "ScrapingStatus",
    "TaskStatus",
]
