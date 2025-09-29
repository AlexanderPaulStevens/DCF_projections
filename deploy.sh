#!/bin/bash

# Simple deployment script for DCF Projections
# Uses the clean dcf-backend and dcf-frontend folders

set -e

echo "🚀 Deploying DCF Projections..."

# Deploy Backend
echo "📦 Deploying backend..."
cd dcf-backend
chmod +x deploy.sh
./deploy.sh
cd ..

# Deploy Frontend
echo "🌐 Deploying frontend..."
cd dcf-frontend
chmod +x deploy.sh
./deploy.sh
cd ..

echo "✅ Deployment complete!"
echo "Backend: https://dcf-backend-355089933221.europe-west1.run.app"
echo "Frontend: https://dcf-frontend-355089933221.europe-west1.run.app"
