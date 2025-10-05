#!/bin/bash

# Parse command line arguments
PRODUCTION_MODE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            PRODUCTION_MODE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--production]"
            echo "  --production    Build and serve production build instead of development mode"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Load config
if [ -f "config.env" ]; then
    source config.env
else
    API_HOST="localhost"
    API_PORT="8001"
    FRONTEND_PORT="3001"
    BACKEND_HOST="0.0.0.0"
    BACKEND_PORT="8001"
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check if process is running
check_process() {
    local pattern=$1
    if pgrep -f "$pattern" 2>&1; then
        return 0  # Process is running
    else
        return 1  # Process is not running
    fi
}

# Function to kill existing processes
kill_existing_processes() {
    echo "Cleaning up existing processes..."

    # Kill uvicorn processes
    if check_process "uvicorn main:app"; then
        echo "Killing existing uvicorn processes..."
        pkill -f "uvicorn main:app" || true
        pkill -f "uv run uvicorn" || true
    fi

    # Kill npm start processes
    if check_process "npm start"; then
        echo "Killing existing npm processes..."
        pkill -f "npm start" || true
    fi

    # Kill serve processes (for production mode)
    if check_process "serve"; then
        echo "Killing existing serve processes..."
        pkill -f "serve" || true
    fi

    # Force kill any processes using our ports
    echo "Force killing processes on ports $BACKEND_PORT and $FRONTEND_PORT..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 || true
    lsof -ti:$FRONTEND_PORT | xargs kill -9 || true

    # Wait for processes to terminate
    sleep 3
}

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill_existing_processes
    exit 0
}
trap cleanup SIGINT SIGTERM

# Check if processes are already running
if check_process "uvicorn main:app" || check_process "npm start" || check_process "serve"; then
    echo "Services appear to be already running"
    echo "Killing existing processes and restarting..."
    kill_existing_processes
fi

# Start backend
if [ "$PRODUCTION_MODE" = true ]; then
    echo "Starting backend in PRODUCTION mode on port $BACKEND_PORT..."
    cd backend
    uv run uvicorn main:app --host $BACKEND_HOST --port $BACKEND_PORT &
    BACKEND_PID=$!
    cd ..
else
    echo "Starting backend in DEVELOPMENT mode on port $BACKEND_PORT..."
    cd backend
    uv run uvicorn main:app --host $BACKEND_HOST --port $BACKEND_PORT --reload &
    BACKEND_PID=$!
    cd ..
fi

# Wait a moment for backend to start
sleep 3

# Start frontend
if [ "$PRODUCTION_MODE" = true ]; then
    echo "Building and serving frontend in PRODUCTION mode on port $FRONTEND_PORT..."
    cd frontend

    # Build the production version
    echo "Building production bundle..."
    REACT_APP_API_HOST=$API_HOST REACT_APP_API_PORT=$API_PORT npm run build

    # Check if serve is installed, install if not
    if ! command -v serve &> /dev/null; then
        echo "Installing serve package for production serving..."
        npm install -g serve
    fi

    # Serve the production build
    PORT=$FRONTEND_PORT serve -s build &
    FRONTEND_PID=$!
    cd ..
else
    echo "Starting frontend in DEVELOPMENT mode on port $FRONTEND_PORT..."
    cd frontend
    PORT=$FRONTEND_PORT REACT_APP_API_HOST=$API_HOST REACT_APP_API_PORT=$API_PORT npm start &
    FRONTEND_PID=$!
    cd ..
fi

echo ""
if [ "$PRODUCTION_MODE" = true ]; then
    echo "🚀 Services started successfully in PRODUCTION mode!"
    echo "Backend: http://localhost:$BACKEND_PORT"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Mode: Production (optimized build, no hot reload)"
else
    echo "🔧 Services started successfully in DEVELOPMENT mode!"
    echo "Backend: http://localhost:$BACKEND_PORT"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Mode: Development (hot reload enabled)"
fi
echo "Press Ctrl+C to stop"

# Wait for processes
wait
