#!/bin/bash

# Horizon - DCF Projections Application Runner
# This script manages the entire application lifecycle

# Load configuration from central config file
if [ -f "config.env" ]; then
    echo "🔧 Loading configuration from config.env..."
    source config.env
    echo "📍 API Host: $API_HOST"
    echo "🔌 API Port: $API_PORT"
    echo "🌐 Frontend Port: $FRONTEND_PORT"

    # Check if IP address needs updating
    CURRENT_IP=$(ifconfig | grep -E "inet [0-9]" | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    if [ ! -z "$CURRENT_IP" ] && [ "$CURRENT_IP" != "$API_HOST" ]; then
        echo "⚠️  IP address mismatch detected!"
        echo "   Config file has: $API_HOST"
        echo "   Current network IP: $CURRENT_IP"
        echo "   Update config.env with: API_HOST=$CURRENT_IP"
    fi
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
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found. Please create the React app first."
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

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "🔧 Starting FastAPI backend..."
echo "   API will be available at: http://$BACKEND_HOST:$BACKEND_PORT"
echo "   API docs: http://$BACKEND_HOST:$BACKEND_PORT/docs"
echo "   Health check: http://$BACKEND_HOST:$BACKEND_PORT/health"
echo ""

# Start the API in the background
uv run uvicorn backend.main:app \
    --host $BACKEND_HOST \
    --port $BACKEND_PORT \
    --reload \
    --log-level info &
API_PID=$!

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

# Start ngrok for external access with robust error handling
echo "🌐 Starting ngrok for external access..."

# Kill any existing ngrok processes to avoid conflicts
echo "🧹 Cleaning up any existing ngrok processes..."
pkill -f ngrok 2>/dev/null || true
sleep 2

# Check if ngrok is available and configured
if ! command -v ngrok &> /dev/null; then
    echo "❌ Error: ngrok is not installed. Please install it first:"
    echo "   brew install ngrok/ngrok/ngrok"
    echo "   Then configure with: ngrok config add-authtoken YOUR_TOKEN"
    NGROK_PID=""
else
    # Check ngrok configuration
    if ! ngrok config check &> /dev/null; then
        echo "⚠️  Warning: ngrok configuration check failed"
        echo "   You may need to configure ngrok with: ngrok config add-authtoken YOUR_TOKEN"
    else
        echo "✅ Ngrok configuration verified"
    fi

    # Start ngrok tunnels for both frontend and API
    echo "🚀 Starting ngrok tunnels..."
    echo "   - Frontend tunnel (port $FRONTEND_PORT)"
    echo "   - API tunnel (port $BACKEND_PORT)"

    # Start frontend tunnel
    uv run ngrok http $FRONTEND_PORT --log=stdout &
    NGROK_FRONTEND_PID=$!

    # Start API tunnel
    uv run ngrok http $BACKEND_PORT --log=stdout &
    NGROK_API_PID=$!

    NGROK_PID="$NGROK_FRONTEND_PID $NGROK_API_PID"

    # Wait for ngrok to start and get the URL
    echo "⏳ Waiting for ngrok to start..."
    sleep 5

    # Get ngrok URLs with better error handling and retry logic
    echo "🔍 Getting ngrok public URLs..."
    NGROK_FRONTEND_URL=""
    NGROK_API_URL=""
    MAX_ATTEMPTS=15
    ATTEMPT=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && ([ -z "$NGROK_FRONTEND_URL" ] || [ -z "$NGROK_API_URL" ]); do
        ATTEMPT=$((ATTEMPT + 1))
        echo "   Attempt $ATTEMPT/$MAX_ATTEMPTS to get ngrok URLs..."

        if command -v curl &> /dev/null; then
            # Try to get the tunnel info from both ngrok API ports
            TUNNEL_INFO_4040=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
            TUNNEL_INFO_4041=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null)

            if [ ! -z "$TUNNEL_INFO_4040" ] || [ ! -z "$TUNNEL_INFO_4041" ]; then
                # Extract URLs using jq if available, otherwise use grep
                if command -v jq &> /dev/null; then
                    # Use jq for more reliable JSON parsing
                    NGROK_FRONTEND_URL=$(echo "$TUNNEL_INFO_4041" | jq -r '.tunnels[] | select(.config.addr == "http://localhost:3000") | .public_url' 2>/dev/null)
                    NGROK_API_URL=$(echo "$TUNNEL_INFO_4040" | jq -r '.tunnels[] | select(.config.addr == "http://localhost:8000") | .public_url' 2>/dev/null)
                else
                    # Fallback to grep method
                    NGROK_FRONTEND_URL=$(echo "$TUNNEL_INFO_4041" | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
                    NGROK_API_URL=$(echo "$TUNNEL_INFO_4040" | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
                fi

                if [ ! -z "$NGROK_FRONTEND_URL" ] && [ ! -z "$NGROK_API_URL" ]; then
                    echo "✅ Frontend URL: $NGROK_FRONTEND_URL"
                    echo "✅ API URL: $NGROK_API_URL"
                    echo "   Share the frontend URL with people on different networks!"

                    # Export the ngrok API URL for the React app
                    export REACT_APP_NGROK_API_URL="$NGROK_API_URL"
                    echo "🔧 Set REACT_APP_NGROK_API_URL=$NGROK_API_URL"
                    break
                fi
            else
                echo "   Ngrok API not responding yet..."
            fi
        fi

        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo "   Waiting 3 seconds before retry..."
            sleep 3
        fi
    done

    if [ -z "$NGROK_FRONTEND_URL" ] || [ -z "$NGROK_API_URL" ]; then
        echo "⚠️  Could not get ngrok URLs automatically"
        echo "   This might be due to:"
        echo "   - Ngrok still starting up (check http://localhost:4040)"
        echo "   - Network/firewall issues"
        echo "   - Ngrok authentication problems"
        echo ""
        echo "   Troubleshooting steps:"
        echo "   1. Check ngrok status: http://localhost:4040"
        echo "   2. Verify ngrok config: ngrok config check"
        echo "   3. Test manually: ngrok http $FRONTEND_PORT"
        echo "   4. Check ngrok logs in another terminal"
    fi
fi

# Start React frontend after ngrok URLs are obtained
echo "🎨 Starting React frontend..."
echo "   Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo ""

# Change to frontend directory and start React with environment variables
cd frontend
REACT_APP_NGROK_API_URL="$NGROK_API_URL" REACT_APP_API_HOST="$API_HOST" REACT_APP_API_PORT="$API_PORT" npm start &
FRONTEND_PID=$!
cd ..

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."

    # Kill processes by PID if they exist
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    [ ! -z "$NGROK_FRONTEND_PID" ] && kill $NGROK_FRONTEND_PID 2>/dev/null || true
    [ ! -z "$NGROK_API_PID" ] && kill $NGROK_API_PID 2>/dev/null || true

    # Also kill by process name to ensure cleanup
    pkill -f "uvicorn backend.main:app" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "ngrok" 2>/dev/null || true

    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 Full application is starting!"
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
echo "🔍 Ngrok Status & URLs:"
echo "   - Ngrok Web Interface:  http://localhost:4040"
echo "   - Check this page for the public URL if not shown above"
echo ""
echo "🛠️  Ngrok Troubleshooting:"
echo "   If ngrok isn't working:"
echo "   1. Check status: http://localhost:4040"
echo "   2. Verify config: ngrok config check"
echo "   3. Kill processes: pkill -f ngrok"
echo "   4. Test manually: ngrok http $FRONTEND_PORT"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
