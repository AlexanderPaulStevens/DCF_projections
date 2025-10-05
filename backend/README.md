# DCF Backend

FastAPI backend for DCF Projections application.

## 🚀 Quick Start

### Deploy to Cloud Run
```bash
./deploy.sh
```

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
```

## 📡 API Endpoints

- **Health Check**: `/health`
- **API Documentation**: `/docs`
- **Companies List**: `/api/companies/list`
- **Company Data**: `/api/companies/{ticker}/stock-data`
- **Historical Data**: `/api/companies/{ticker}/historical-data`
- **DCF Analysis**: `/api/companies/{ticker}/dcf`
- **Forecast**: `/api/companies/{ticker}/forecast`

## 🔧 Configuration

The backend uses **Cloud Storage** for cached company data and includes Prophet forecasting capabilities. Local company data is kept for development but not deployed to production.

## 📊 Data Storage

- **Production**: Uses Google Cloud Storage (`horizon-gcloud-eu-company-data` bucket)
- **Development**: Uses local `company_data/` directory
- **No Local Data Deployed**: Company data is excluded from Docker builds

## 🌐 Production URL

https://dcf-backend-355089933221.europe-west1.run.app
