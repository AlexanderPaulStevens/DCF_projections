"""
Scraper API endpoints for background data scraping operations.
"""

from typing import List

from backend.app.schemas.scraper import (
    ScrapeRequest,
    ScrapeResponse,
    ScrapingStatus,
    TaskStatus,
)
from backend.app.services.scraper_service import ScraperService
from fastapi import APIRouter, HTTPException

# Initialize router
router = APIRouter(prefix="/api/scraper", tags=["scraper"])

# Initialize scraper service
scraper_service = ScraperService()


@router.post("/scrape-company", response_model=ScrapeResponse)
async def start_company_scrape(request: ScrapeRequest):
    """
    Start background scraping for a specific company.

    Args:
        request: Scrape request with company ticker

    Returns:
        Scrape response with task ID and status
    """
    try:
        ticker = request.ticker.upper()

        # Start background scraping task
        task_id = await scraper_service.scrape_company_background(ticker)

        if task_id.startswith("scraping_already_in_progress"):
            return ScrapeResponse(
                task_id="",
                message=f"Scraping already in progress for {ticker}",
                status="already_running",
            )

        return ScrapeResponse(
            task_id=task_id,
            message=f"Started background scraping for {ticker}",
            status="started",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error starting scrape for {request.ticker}: {str(e)}",
        )


@router.get("/status", response_model=ScrapingStatus)
async def get_scraping_status():
    """
    Get overall scraping status and statistics.

    Returns:
        Comprehensive scraping status information
    """
    try:
        status = scraper_service.get_scraping_status()
        return ScrapingStatus(**status)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting scraping status: {str(e)}"
        )


@router.get("/tasks", response_model=List[TaskStatus])
async def get_all_tasks():
    """
    Get status of all background scraping tasks.

    Returns:
        List of all task statuses
    """
    try:
        all_tasks = scraper_service.get_all_task_statuses()

        task_list = []
        for task_id, task_info in all_tasks.items():
            task_list.append(
                TaskStatus(
                    task_id=task_id,
                    ticker=task_info.get("ticker", ""),
                    status=task_info.get("status", "unknown"),
                    progress=task_info.get("progress", 0),
                    message=task_info.get("message", ""),
                    started_at=task_info.get("started_at", ""),
                    completed_at=task_info.get("completed_at"),
                )
            )

        return task_list

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting task statuses: {str(e)}"
        )


@router.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """
    Get status of a specific background task.

    Args:
        task_id: Task identifier

    Returns:
        Task status information
    """
    try:
        task_status = scraper_service.get_task_status(task_id)

        if not task_status:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

        return TaskStatus(
            task_id=task_id,
            ticker=task_status.get("ticker", ""),
            status=task_status.get("status", "unknown"),
            progress=task_status.get("progress", 0),
            message=task_status.get("message", ""),
            started_at=task_status.get("started_at", ""),
            completed_at=task_status.get("completed_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting task status: {str(e)}"
        )


@router.delete("/tasks/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a background scraping task.

    Args:
        task_id: Task identifier

    Returns:
        Success message
    """
    try:
        success = scraper_service.cancel_task(task_id)

        if not success:
            raise HTTPException(
                status_code=404, detail=f"Task {task_id} not found or not active"
            )

        return {"message": f"Task {task_id} cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling task: {str(e)}")


@router.get("/active-tasks")
async def get_active_tasks():
    """
    Get list of currently active task IDs.

    Returns:
        List of active task IDs
    """
    try:
        active_tasks = scraper_service.get_active_tasks()
        return {"active_tasks": active_tasks}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting active tasks: {str(e)}"
        )


@router.post("/cleanup")
async def cleanup_old_tasks(max_age_hours: int = 24):
    """
    Clean up old completed tasks to prevent memory buildup.

    Args:
        max_age_hours: Maximum age of tasks to keep (in hours)

    Returns:
        Cleanup results
    """
    try:
        cleaned_count = await scraper_service.cleanup_old_tasks(max_age_hours)

        return {
            "message": f"Cleaned up {cleaned_count} old tasks",
            "cleaned_count": cleaned_count,
            "max_age_hours": max_age_hours,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error cleaning up tasks: {str(e)}"
        )
