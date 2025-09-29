"""
Background Scraper Service - Manages scraping operations as background tasks
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.app.core.scraper import SP500Scraper
from backend.app.utils.logger import get_logger

logger = get_logger(__name__)


class ScraperService:
    """
    Background service for managing scraping operations.
    Prioritizes cached data and runs scraping as background tasks.
    """

    def __init__(self):
        """Initialize the scraper service."""
        self.scraper = SP500Scraper()
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.task_status: Dict[str, Dict[str, Any]] = {}

    async def scrape_company_background(self, ticker: str) -> str:
        """
        Start a background scraping task for a company.

        Args:
            ticker: Company ticker symbol

        Returns:
            Task ID for tracking the background operation
        """
        task_id = f"scrape_{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Check if already scraping this company
        if any(ticker in task_id for task_id in self.active_tasks.keys()):
            return f"scraping_already_in_progress_{ticker}"

        # Create background task
        task = asyncio.create_task(self._scrape_company_task(ticker, task_id))
        self.active_tasks[task_id] = task

        # Initialize status
        self.task_status[task_id] = {
            "ticker": ticker,
            "status": "started",
            "started_at": datetime.now().isoformat(),
            "progress": 0,
            "message": f"Starting background scrape for {ticker}",
        }

        logger.info(f"Started background scraping task {task_id} for {ticker}")
        return task_id

    async def _scrape_company_task(self, ticker: str, task_id: str) -> None:
        """
        Background task for scraping company data.

        Args:
            ticker: Company ticker symbol
            task_id: Unique task identifier
        """
        try:
            # Update status
            self.task_status[task_id].update(
                {
                    "status": "running",
                    "progress": 25,
                    "message": f"Loading company data for {ticker}",
                }
            )

            # Run the scraping operation
            success = await asyncio.get_event_loop().run_in_executor(
                None, self.scraper.scrape_company_data, ticker
            )

            if success:
                self.task_status[task_id].update(
                    {
                        "status": "completed",
                        "progress": 100,
                        "message": f"Successfully scraped data for {ticker}",
                        "completed_at": datetime.now().isoformat(),
                    }
                )
                logger.info(f"Background scraping completed for {ticker}")
            else:
                self.task_status[task_id].update(
                    {
                        "status": "failed",
                        "progress": 100,
                        "message": f"Failed to scrape data for {ticker}",
                        "completed_at": datetime.now().isoformat(),
                    }
                )
                logger.error(f"Background scraping failed for {ticker}")

        except Exception as e:
            self.task_status[task_id].update(
                {
                    "status": "error",
                    "progress": 100,
                    "message": f"Error scraping {ticker}: {str(e)}",
                    "completed_at": datetime.now().isoformat(),
                }
            )
            logger.error(f"Error in background scraping task for {ticker}: {e}")

        finally:
            # Clean up completed task
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a specific background task.

        Args:
            task_id: Task identifier

        Returns:
            Task status dictionary or None if not found
        """
        return self.task_status.get(task_id)

    def get_all_task_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all background tasks.

        Returns:
            Dictionary of all task statuses
        """
        return self.task_status.copy()

    def get_active_tasks(self) -> List[str]:
        """
        Get list of currently active task IDs.

        Returns:
            List of active task IDs
        """
        return list(self.active_tasks.keys())

    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a background task.

        Args:
            task_id: Task identifier

        Returns:
            True if task was cancelled, False if not found
        """
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            task.cancel()

            self.task_status[task_id].update(
                {
                    "status": "cancelled",
                    "message": f"Task {task_id} was cancelled",
                    "completed_at": datetime.now().isoformat(),
                }
            )

            del self.active_tasks[task_id]
            logger.info(f"Cancelled background task {task_id}")
            return True

        return False

    def get_scraping_status(self) -> Dict[str, Any]:
        """
        Get overall scraping status and statistics.

        Returns:
            Dictionary with scraping status information
        """
        status = self.scraper.get_scraping_status()

        # Add background task information
        status.update(
            {
                "active_tasks": len(self.active_tasks),
                "total_tasks": len(self.task_status),
                "recent_tasks": list(self.task_status.keys())[-10:],  # Last 10 tasks
            }
        )

        return status

    async def cleanup_old_tasks(self, max_age_hours: int = 24) -> int:
        """
        Clean up old completed tasks to prevent memory buildup.

        Args:
            max_age_hours: Maximum age of tasks to keep (in hours)

        Returns:
            Number of tasks cleaned up
        """
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        tasks_to_remove = []

        for task_id, task_info in self.task_status.items():
            if task_id not in self.active_tasks:  # Only clean completed tasks
                completed_at = task_info.get("completed_at")
                if completed_at:
                    try:
                        task_time = datetime.fromisoformat(completed_at).timestamp()
                        if task_time < cutoff_time:
                            tasks_to_remove.append(task_id)
                    except ValueError:
                        # Invalid timestamp, remove it
                        tasks_to_remove.append(task_id)

        # Remove old tasks
        for task_id in tasks_to_remove:
            del self.task_status[task_id]

        if tasks_to_remove:
            logger.info(f"Cleaned up {len(tasks_to_remove)} old background tasks")

        return len(tasks_to_remove)
