# Backend Dockerfile for Cloud Run
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml requirements.txt ./

# Install dependencies using pip
RUN pip install -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY config/ ./config/

# Set environment variables
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
