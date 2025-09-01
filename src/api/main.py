"""
FastAPI application for DCF Projections mobile API.
Works only with cached data from company_data folder.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.app.services.dcf_service import DCFService

# Import API endpoints
from src.api.endpoints import companies

# Create FastAPI app
app = FastAPI(
    title="DCF Projections API",
    description="Professional financial analysis API for mobile applications (cached data only)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Include API routers
app.include_router(companies.router)

# Configure CORS for mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your mobile app domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instances
dcf_service = DCFService()


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "detail": str(exc), "status_code": 422},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "status_code": 500,
        },
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "DCF Projections API",
        "version": "1.0.0",
        "note": "API works with cached data only. Use scraping scripts in company_data/ folder.",
    }


# Root endpoint
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
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
