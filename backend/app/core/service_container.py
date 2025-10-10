"""
Dependency Injection Container for Services.

This module provides a centralized way to manage service dependencies
and follows the Dependency Inversion Principle.
"""

from app.services.cloud_storage_service import CloudStorageService
from app.services.company_data_service import CompanyDataService
from app.services.dcf_service import DCFService
from app.services.edgar_service import EdgarService
from app.services.financial_ratios_service import FinancialRatiosService
from app.services.forecasting_orchestration_service import (
    ForecastingOrchestrationService,
)
from app.services.yahoo_finance_service import YahooFinanceService


class ServiceContainer:
    """
    Dependency injection container for services.
    Manages service lifecycle and provides centralized access.
    """

    def __init__(self):
        # Core infrastructure services
        self._cloud_storage_service = None
        self._yahoo_service = None

        # Business services
        self._company_data_service = None
        self._edgar_service = None
        self._dcf_service = None
        self._financial_ratios_service = None
        self._forecasting_service = None

    @property
    def cloud_storage_service(self) -> CloudStorageService:
        """Get cloud storage service instance."""
        if self._cloud_storage_service is None:
            self._cloud_storage_service = CloudStorageService()
        return self._cloud_storage_service

    @property
    def yahoo_service(self) -> YahooFinanceService:
        """Get Yahoo Finance service instance."""
        if self._yahoo_service is None:
            self._yahoo_service = YahooFinanceService()
        return self._yahoo_service

    @property
    def company_data_service(self) -> CompanyDataService:
        """Get company data service instance."""
        if self._company_data_service is None:
            self._company_data_service = CompanyDataService()
        return self._company_data_service

    @property
    def edgar_service(self) -> EdgarService:
        """Get EDGAR service instance."""
        if self._edgar_service is None:
            self._edgar_service = EdgarService()
        return self._edgar_service

    @property
    def dcf_service(self) -> DCFService:
        """Get DCF service instance."""
        if self._dcf_service is None:
            self._dcf_service = DCFService()
        return self._dcf_service

    @property
    def financial_ratios_service(self) -> FinancialRatiosService:
        """Get financial ratios service instance."""
        if self._financial_ratios_service is None:
            self._financial_ratios_service = FinancialRatiosService()
        return self._financial_ratios_service

    @property
    def forecasting_service(self) -> ForecastingOrchestrationService:
        """Get forecasting service instance."""
        if self._forecasting_service is None:
            self._forecasting_service = ForecastingOrchestrationService()
        return self._forecasting_service


# Global service container instance
service_container = ServiceContainer()


# Dependency injection functions for FastAPI
def get_company_data_service() -> CompanyDataService:
    """Dependency injection for company data service."""
    return service_container.company_data_service


def get_edgar_service() -> EdgarService:
    """Dependency injection for EDGAR service."""
    return service_container.edgar_service


def get_dcf_service() -> DCFService:
    """Dependency injection for DCF service."""
    return service_container.dcf_service


def get_financial_ratios_service() -> FinancialRatiosService:
    """Dependency injection for financial ratios service."""
    return service_container.financial_ratios_service


def get_forecasting_service() -> ForecastingOrchestrationService:
    """Dependency injection for forecasting service."""
    return service_container.forecasting_service
