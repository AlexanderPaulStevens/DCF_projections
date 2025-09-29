# DCF Projections - Clean Deployment Setup

## 🚀 Quick Deployment

To deploy updates to your site, simply run:

```bash
./deploy.sh
```

This will deploy both backend and frontend to Google Cloud Run.

## 📁 Project Structure

- `dcf-backend/` - Clean backend deployment setup
- `dcf-frontend/` - Clean frontend deployment setup
- `company_data/` - Local financial data storage
- `config/` - Configuration files
- `deploy.sh` - Simple deployment script

## 🔗 Live URLs

- **Backend**: https://dcf-backend-355089933221.europe-west1.run.app
- **Frontend**: https://dcf-frontend-355089933221.europe-west1.run.app

## 💰 Cost Monitoring

Check your Google Cloud costs at: https://console.cloud.google.com/billing

Expected monthly cost: **€1-3** (well under your €10 budget)

## 🛠️ Local Development

```bash
# Start local development
./run.sh
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
