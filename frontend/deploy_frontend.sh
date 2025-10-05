#!/bin/bash

# Frontend Deployment Script for Cloud Run
echo "🚀 Deploying DCF Frontend to Cloud Run..."

# Set project
gcloud config set project horizon-gcloud-eu

# Build the React app
echo "📦 Building React app..."
npm run build

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy dcf-frontend \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars REACT_APP_PRODUCTION_API_URL=https://dcf-backend-355089933221.europe-west1.run.app

echo "✅ Frontend deployed successfully!"
echo "🌐 Frontend URL: https://dcf-frontend-355089933221.europe-west1.run.app"
