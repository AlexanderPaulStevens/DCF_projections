"""Path resolution helpers for backend services."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Iterable

from app.config import Settings


def _matches_marker(directory: Path, markers: Iterable[str]) -> bool:
    """Return True if any marker file exists in the directory."""
    return any((directory / marker).exists() for marker in markers)


@lru_cache(maxsize=1)
def get_project_root(markers: tuple[str, ...] = ("pyproject.toml", ".git")) -> Path:
    """Resolve the project root by walking up the directory tree."""
    current = Path(__file__).resolve().parent
    for directory in [current, *current.parents]:
        if _matches_marker(directory, markers):
            return directory
    return Path.cwd()


@lru_cache(maxsize=1)
def get_company_data_dir() -> Path:
    """Return the absolute path to the company data directory."""
    return get_project_root() / Settings.DATA_DIR


def ensure_directory(path: Path) -> Path:
    """Ensure a directory exists and return it."""
    path.mkdir(parents=True, exist_ok=True)
    return path


__all__ = [
    "ensure_directory",
    "get_company_data_dir",
    "get_project_root",
]
