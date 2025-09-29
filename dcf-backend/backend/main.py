"""FastAPI application entry point for the DCF Projections backend."""

from __future__ import annotations

from backend.app.api.endpoints import companies, scraper
from backend.app.services.dcf_service import DCFService
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def create_app() -> FastAPI:
    """Instantiate and configure the FastAPI application."""
    api = FastAPI(
        title="DCF Projections API",
        description="Financial analysis API powered by cached data",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    api.include_router(companies.router)
    api.include_router(scraper.router)

    api.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(api)
    return api


def register_exception_handlers(api: FastAPI) -> None:
    """Register application-wide exception handlers."""

    @api.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):  # type: ignore[override]
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "detail": str(exc),
                "status_code": 422,
            },
        )

    @api.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc):  # type: ignore[override]
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTP Error",
                "detail": exc.detail,
                "status_code": exc.status_code,
            },
        )

    @api.exception_handler(Exception)
    async def general_exception_handler(request, exc):  # type: ignore[override]
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "status_code": 500,
            },
        )


app = create_app()

dcf_service = DCFService()


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "service": "DCF Projections API",
        "version": "1.0.0",
        "note": "API works with cached data only. Use scraping scripts in company_data/ folder.",
    }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "DCF Projections API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "note": "This API works with cached data only. To update data, use the scraping scripts in company_data/ folder.",
    }


if __name__ == "__main__":
    import os

    import uvicorn

    # Use environment variable for host, default to localhost for security
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    # Note: 0.0.0.0 is safe in containerized environments (Cloud Run, Docker)
    uvicorn.run(app, host=host, port=port)  # nosec B104
