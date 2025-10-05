"""FastAPI application entry point for the Horizon Financial Analysis API."""

from app.config import settings
from app.exceptions.handlers import register_exception_handlers
from app.routers.analyst_router import router as analyst_router
from app.routers.companies_router import router as companies_router
from app.routers.dcf_analysis_router import router as dcf_analysis_router
from app.routers.forecast_router import router as forecast_router
from app.routers.health_router import router as health_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Horizon - Financial Analysis API",
    description="Financial analysis API powered by cached data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Register exception handlers
register_exception_handlers(app)

# Setup CORS BEFORE defining any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(companies_router)
app.include_router(dcf_analysis_router)
app.include_router(analyst_router)
app.include_router(forecast_router)
