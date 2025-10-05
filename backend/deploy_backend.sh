#!/bin/bash

# Backend Deployment Script for Cloud Run
echo "🚀 Deploying DCF Backend to Cloud Run..."

# Set project
gcloud config set project horizon-gcloud-eu

# Deploy backend
gcloud run deploy dcf-backend \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2

echo "✅ Backend deployed successfully!"
echo "🌐 Backend URL: https://dcf-backend-355089933221.europe-west1.run.app"
echo "📚 API Docs: https://dcf-backend-355089933221.europe-west1.run.app/docs"
