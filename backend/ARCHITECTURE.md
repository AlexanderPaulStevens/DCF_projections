# Horizon Backend Architecture Overview

## 🏗️ **Backend Structure Explained**

This document explains the structure and purpose of each module in the Horizon financial analysis backend.

## 📁 **Directory Structure**

```
backend/
├── app/                    # Main application package
│   ├── core/              # Core business logic
│   ├── routers/           # FastAPI API endpoints
│   ├── services/          # Business logic services
│   ├── schemas/           # Pydantic data models
│   ├── dtos/              # Data Transfer Objects (unused)
│   ├── exceptions/        # Custom exceptions (unused)
│   ├── models/            # Database models (unused)
│   ├── repositories/      # Data access layer (unused)
│   └── utils/             # Utility functions
├── tests/                 # Test suite
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── company_data/          # Local company data storage
├── main.py               # FastAPI application entry point
├── config.py             # Application configuration
├── requirements.txt      # Python dependencies
└── pyproject.toml        # Project configuration
```

## 🔧 **Active Modules (Currently Used)**

### **1. Core Business Logic (`app/core/`)**
- **`DCF_calculations.py`**: Core DCF calculation engine
- **`financial_ratios.py`**: Financial ratio calculations
- **`companies.py`**: Company data management
- **`paths.py`**: File path utilities
- **`config.py`**: Core configuration management

### **2. API Endpoints (`app/routers/`)**
- **`companies.py`**: Company data endpoints (stock data, financial ratios, raw data, company info)
- **`dcf_analysis.py`**: DCF analysis endpoints (calculate DCF, overwrite analysis)

### **3. Business Services (`app/services/`)**
- **`dcf_service.py`**: DCF analysis orchestration
- **`yahoo_finance_service.py`**: Yahoo Finance API integration + data transformation
- **`cloud_storage_service.py`**: Google Cloud Storage integration (caching + S&P 500 list)
- **`financial_data_processor.py`**: Financial data processing
- **`financial_ratios_service.py`**: Financial ratio calculations

### **4. Data Models (`app/schemas/`)**
- **`company_data.py`**: Core company schemas (CompanyInfo, StockData, CompanySearchResult)
- **`financial_analysis.py`**: Financial analysis schemas (FinancialRatios, DCFAnalysis)

### **5. Utilities (`app/utils/`)**
- **`logger.py`**: Centralized logging configuration

## 🚫 **Unused Modules (Reserved for Future)**

- **`app/dtos/`**: Data Transfer Objects (unused)
- **`app/exceptions/`**: Custom exceptions (unused)
- **`app/models/`**: Database models (unused)
- **`app/repositories/`**: Data access layer (unused)

## 🔄 **Data Flow Architecture**

```
1. Frontend Request → FastAPI Router
2. Router → Cloud Storage (check cache first)
3. If cached: Return cached data
4. If not cached: Service → Yahoo Finance API (primary data source)
5. Service → Cloud Storage (cache fresh data)
6. Service → Core Business Logic
7. Core Logic → Data Processing
8. Processed Data → Response Schema
9. Response Schema → Frontend
```

## 🧪 **Testing Strategy**

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions and data flow

## 🚀 **Key Features**

1. **Yahoo Finance Integration**: Real-time financial data
2. **Intelligent Caching**: Fast responses with cloud storage
3. **DCF Analysis**: Comprehensive discounted cash flow calculations
4. **Financial Ratios**: Complete financial ratio analysis
5. **Company Search**: Real-time search across S&P 500 companies
6. **API Documentation**: Automatic OpenAPI/Swagger documentation

## 📊 **Current API Endpoints**

- **`/`**: API discovery and available endpoints
- **`/health`**: Health check endpoint
- **`/companies/list`**: Get S&P 500 companies list
- **`/companies/{ticker}/company-info`**: Get company information
- **`/companies/{ticker}/raw-data`**: Get comprehensive company data
- **`/companies/{ticker}/stock-data`**: Get stock price and market data (with historical data via period parameter)
- **`/companies/{ticker}/financial-ratios`**: Get financial ratios
- **`/companies/{ticker}/DCF`**: Get DCF analysis
- **`/companies/{ticker}/DCF/overwrite`**: Force recalculate DCF

## 🎯 **Architecture Benefits**

1. **Clean Architecture**: Clear separation of concerns
2. **Real-time Data**: Live financial data with intelligent caching
3. **Reliable Performance**: No dependency on external scraping
4. **Cost Efficient**: Reduced API calls through caching
5. **Scalable Design**: Easy to extend with new features
