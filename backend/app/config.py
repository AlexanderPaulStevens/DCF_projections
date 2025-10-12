"""
Application configuration settings using Pydantic Settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment configuration.

    This class provides a centralized way to access all application configuration
    values from environment variables and config files.

    Attributes:
        google_api_key: Google AI API key for Gemini integration
        gcp_project_id: Google Cloud Platform project ID
        gcp_region: Google Cloud Platform region
        backend_host: Backend service host
        backend_port: Backend service port
        api_host: API host for external access
        api_port: API port for external access
        cloud_storage_bucket: GCP Cloud Storage bucket for company data
        cloud_storage_region: GCP Cloud Storage region
        cors_origins: CORS allowed origins
        production_backend_url: Production backend URL
        production_frontend_url: Production frontend URL
    """

    # Google Cloud Platform Configuration
    GCP_PROJECT_ID: str = "horizon-gcloud-eu"
    GCP_REGION: str = "europe-west1"

    # Backend Configuration
    BACKEND_SERVICE_NAME: str = "backend"
    BACKEND_HOST: str = "0.0.0.0"  # nosec B104 - Required for Docker container networking
    BACKEND_PORT: int = 8001

    # Frontend Configuration
    FRONTEND_SERVICE_NAME: str = "frontend"
    FRONTEND_PORT: int = 3001

    # API Configuration
    API_HOST: str = "localhost"
    API_PORT: int = 8001

    # Production URLs
    PRODUCTION_BACKEND_URL: str = "https://backend-dot-horizon-gcloud-eu.appspot.com"
    PRODUCTION_FRONTEND_URL: str = "https://frontend-dot-horizon-gcloud-eu.appspot.com"

    # Frontend Environment Variables
    REACT_APP_PRODUCTION_API_URL: str = "https://backend-dot-horizon-gcloud-eu.appspot.com"
    REACT_APP_API_HOST: str = "backend-dot-horizon-gcloud-eu.appspot.com"
    REACT_APP_API_PORT: int = 443

    # Cloud Storage Configuration
    CLOUD_STORAGE_BUCKET: str = "horizon-gcloud-eu-company-data"
    CLOUD_STORAGE_REGION: str = "europe-west1"

    # AI Configuration
    GOOGLE_API_KEY: str = ""

    model_config = {
        "env_file": "../.env",
        "env_file_encoding": "utf-8",
    }


# Initialize settings instance
# The environment variables will extend the system variables.
settings = Settings()
