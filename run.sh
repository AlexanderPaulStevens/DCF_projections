#!/bin/bash

# Horizon - DCF Projections Local Development Runner
# This script starts the backend and frontend for local development

# Load configuration from central config file
if [ -f "config.env" ]; then
    echo "🔧 Loading configuration from config.env..."
    source config.env
    echo "📍 API Host: $API_HOST"
    echo "🔌 API Port: $API_PORT"
    echo "🌐 Frontend Port: $FRONTEND_PORT"
else
    echo "⚠️ config.env not found, using default values"
    API_HOST="localhost"
    API_PORT="8000"
    FRONTEND_PORT="3000"
    BACKEND_HOST="0.0.0.0"
    BACKEND_PORT="8000"
fi

echo "=========================================="
echo "🚀 Starting HORIZON - DCF Projections"
echo "=========================================="
echo "📍 Project directory: $(pwd)"
echo "🌐 API will be available at: http://$API_HOST:$API_PORT"
echo "🎨 Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo ""

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: pyproject.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "dcf-frontend" ]; then
    echo "❌ Error: dcf-frontend directory not found. Please create the React app first."
    exit 1
fi

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install it first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d ".venv" ] && [ ! -f "uv.lock" ]; then
    echo "📦 Installing Python dependencies with uv..."
    uv sync
fi

# Check if backend dependencies are installed
if [ ! -d "dcf-backend/.venv" ] && [ ! -f "dcf-backend/uv.lock" ]; then
    echo "📦 Installing backend dependencies..."
    cd dcf-backend
    uv sync
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "dcf-frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd dcf-frontend
    npm install
    cd ..
fi

echo "🔧 Starting FastAPI backend..."
echo "   API will be available at: http://$BACKEND_HOST:$BACKEND_PORT"
echo "   API docs: http://$BACKEND_HOST:$BACKEND_PORT/docs"
echo "   Health check: http://$BACKEND_HOST:$BACKEND_PORT/health"
echo ""

# Start the API in the background
cd dcf-backend
uv run uvicorn backend.main:app \
    --host $BACKEND_HOST \
    --port $BACKEND_PORT \
    --reload \
    --log-level info &
API_PID=$!
cd ..

# Wait for API to start
echo "⏳ Waiting for API to start..."
sleep 5

# Check if API is running
if ! curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo "❌ API failed to start"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo "✅ API is running on http://$BACKEND_HOST:$BACKEND_PORT"
echo ""

# Start React frontend
echo "🎨 Starting React frontend..."
echo "   Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo ""

# Change to frontend directory and start React
cd dcf-frontend
REACT_APP_API_HOST="$API_HOST" REACT_APP_API_PORT="$API_PORT" npm start &
FRONTEND_PID=$!
cd ..

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."

    # Kill processes by PID if they exist
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true

    # Also kill by process name to ensure cleanup
    pkill -f "uvicorn backend.main:app" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true

    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 Local development environment is ready!"
echo ""
echo "📱 Access your app:"
echo "   - Frontend (Local):     http://localhost:$FRONTEND_PORT"
echo "   - Frontend (Network):   http://$API_HOST:$FRONTEND_PORT"
echo "   - API (Local):          http://localhost:$BACKEND_PORT"
echo "   - API (Network):        http://$API_HOST:$BACKEND_PORT"
echo "   - API Docs:             http://localhost:$BACKEND_PORT/docs"
echo "   - Health Check:         http://localhost:$BACKEND_PORT/health"
echo ""
echo "🌐 From your phone (same WiFi):"
echo "   - Frontend: http://$API_HOST:$FRONTEND_PORT"
echo "   - API: http://$API_HOST:$BACKEND_PORT"
echo ""
echo "🌍 For public access, use your Cloud Run deployment:"
echo "   - Frontend: https://dcf-frontend-355089933221.europe-west1.run.app"
echo "   - Backend: https://dcf-backend-355089933221.europe-west1.run.app"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
