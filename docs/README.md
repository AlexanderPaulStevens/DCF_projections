# DCF Projections Documentation

## Overview
DCF Projections is a comprehensive financial analysis application that provides company analysis, DCF calculations, financial ratios, and portfolio management. The application consists of a FastAPI backend API and a React frontend for a mobile-ready web interface.

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with `uv` package manager
- **Node.js 16+** with npm
- **Git** for cloning the repository

### 1. Clone and Setup
```bash
git clone <your-repository-url>
cd DCF_projections
```

### 2. Backend Setup (FastAPI)
```bash
# Install Python dependencies
uv sync

# Run the FastAPI server
uv run uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will be available at:**
- **Local**: http://localhost:8000
- **Network**: http://192.168.0.115:8000 (your local IP)
- **API Docs**: http://localhost:8000/docs

### 3. Frontend Setup (React)
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

**Frontend will be available at:**
- **Local**: http://localhost:3000
- **Network**: http://192.168.0.115:3000 (your local IP)

## 📱 Mobile Testing

### Local Network Access
The application is configured for local network access, allowing you to test on your phone:

1. **Ensure both services are running** (backend on port 8000, frontend on port 3000)
2. **Connect your phone to the same WiFi network** as your computer
3. **Access the app** using your computer's local IP address:
   - Frontend: `http://192.168.0.115:3000`
   - API: `http://192.168.0.115:8000`

### Why Local Network?
- **Security**: No internet exposure during development
- **Speed**: Fast local network communication
- **Control**: Full control over the development environment

## 🛠️ Development Commands

### Backend Commands
```bash
# Run with auto-reload (development)
uv run uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Run production mode
uv run uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Alternative: Use the run script
./run_app.sh
```

### Frontend Commands
```bash
cd frontend

# Development mode with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (not recommended)
npm run eject
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=true

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost/dcf_projections

# Redis (if using)
REDIS_URL=redis://localhost:6379
```

### Network Configuration
The application is configured to bind to `0.0.0.0` to allow network access:
- **Backend**: `--host 0.0.0.0 --port 8000`
- **Frontend**: Configured for local network access

## 📁 Project Structure

```
DCF_projections/
├── src/
│   ├── app/                 # Core business logic
│   │   ├── core/           # Business domain modules
│   │   ├── services/       # Business services
│   │   └── utils/          # Utility functions
│   ├── api/                # FastAPI application
│   │   ├── endpoints/      # API endpoints
│   │   └── main.py        # FastAPI app entry point
│   └── main.py            # CLI entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client services
│   │   └── App.tsx        # Main React app
│   └── package.json
├── tests/                  # Test suite
├── pyproject.toml         # Python dependencies
└── README.md              # This file
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/unit/test_dcf_calculations.py
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage
```

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build and run production
uv run uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Or use the production script
uv run uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
```bash
cd frontend

# Build production bundle
npm run build

# Serve static files
npx serve -s build -l 3000
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

#### Module Not Found Errors
```bash
# Reinstall dependencies
uv sync

# Clear Python cache
find . -type d -name "__pycache__" -delete
```

#### Frontend Build Errors
```bash
cd frontend

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Network Access Issues
1. **Check firewall settings** on macOS
2. **Verify both services are running** on 0.0.0.0
3. **Confirm same WiFi network** for phone and computer
4. **Check local IP address** with `ifconfig` or `ipconfig`

### Logs and Debugging
```bash
# Backend logs (in terminal running uvicorn)
# Frontend logs (in terminal running npm start)
# Browser console (F12 for developer tools)
```

## 📚 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api/companies/search` - Search companies
- `GET /api/companies/{ticker}/overview` - Company overview
- `GET /api/companies/{ticker}/ratios` - Financial ratios
- `GET /api/companies/{ticker}/dcf` - DCF analysis
- `GET /api/companies/{ticker}/sensitivity` - Sensitivity analysis

### Interactive API Documentation
Visit http://localhost:8000/docs for interactive API documentation and testing.

## 🤝 Contributing

### Development Workflow
1. **Create feature branch** from main
2. **Make changes** following the established patterns
3. **Run tests** to ensure nothing breaks
4. **Submit pull request** with clear description

### Code Standards
- **Python**: Follow PEP 8, use type hints
- **React**: Use functional components with hooks
- **Imports**: Always use absolute imports
- **Testing**: Maintain test coverage

## 📞 Support

### Getting Help
- **Check logs** in terminal outputs
- **Review API docs** at http://localhost:8000/docs
- **Check browser console** for frontend errors
- **Verify network configuration** for mobile access

### Useful Commands
```bash
# Check service status
ps aux | grep -E "(uvicorn|npm)"

# Test API health
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000

# Check network interfaces
ifconfig | grep "inet "
```

---

**Happy coding! 🚀**

Your DCF Projections application is now ready for development and testing. The local network configuration allows you to test the mobile experience on your phone while developing on your computer.
