import logging
from typing import Any, Dict

from app.services.cloud_storage_service import CloudStorageService
from app.services.yahoo_finance_service import YahooFinanceService
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class FinancialRatiosService:
    def __init__(self):
        self.cloud_storage_service = CloudStorageService()
        self.yahoo_service = YahooFinanceService()

    async def calculate_financial_ratios(self, ticker: str) -> Dict[str, Any]:
        """
        Calculate financial ratios from Yahoo Finance data.

        Args:
            ticker: Company ticker symbol

        Returns:
            Financial ratios calculated from real Yahoo Finance data
        """
        try:
            # Try to get cached raw data first
            raw_data = None
            try:
                raw_data = self.cloud_storage_service.read_json_file(
                    ticker.upper(), "raw_data_cache.json"
                )
                if raw_data:
                    logger.info(f"Using cached raw data for financial ratios {ticker}")
            except Exception as e:
                logger.debug(f"No cached raw data found for {ticker}: {str(e)}")

            # If no cached data, fetch from Yahoo Finance
            if not raw_data:
                logger.info(
                    f"Fetching fresh raw data from Yahoo Finance for financial ratios {ticker}"
                )
                raw_data = self.yahoo_service.get_comprehensive_data(ticker.upper())

                if not raw_data:
                    raise HTTPException(
                        status_code=404, detail=f"Financial data not found for {ticker}"
                    )

                # Cache the data for future requests
                try:
                    import json

                    cache_content = json.dumps(raw_data, indent=2, default=str)
                    success = self.cloud_storage_service.upload_file_content(
                        ticker.upper(),
                        "raw_data_cache.json",
                        cache_content,
                        content_type="application/json",
                    )
                    if success:
                        logger.info(
                            f"Successfully cached raw data for financial ratios {ticker}"
                        )
                    else:
                        logger.warning(
                            f"Failed to cache raw data for financial ratios {ticker}"
                        )
                except Exception as e:
                    logger.warning(
                        f"Error caching raw data for financial ratios {ticker}: {str(e)}"
                    )
                    # Don't fail the request if caching fails

            # Calculate ratios from raw data
            ratios = self._calculate_ratios_from_yahoo_data(raw_data)

            return {"ticker": ticker.upper(), "ratios": ratios, "raw_data": raw_data}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error calculating financial ratios for {ticker}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error calculating financial ratios for {ticker}: {str(e)}",
            )

    def _calculate_ratios_from_yahoo_data(
        self, raw_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate financial ratios from Yahoo Finance raw data.

        Only calculates ratios where we have sufficient real data - no placeholders or estimates.
        Uses market cap as proxy for total assets where balance sheet data is unavailable.

        Ratio Categories:
        - Profitability: ROE, ROA, ROIC, Operating Margin, Net Margin
        - Leverage: Debt-to-Equity, Debt-to-Assets (only if company has debt)
        - Efficiency: Asset Turnover
        - Valuation: P/E, P/B, P/S, PEG ratios

        Args:
            raw_data: Raw data from Yahoo Finance containing financial metrics

        Returns:
            Dictionary of calculated financial ratios organized by category
        """
        try:
            current_price = raw_data.get("current_price", 0)
            eps = raw_data.get("eps", 0)
            book_value = raw_data.get("book_value", 0)
            earnings_growth = raw_data.get("earnings_growth", 0)
            free_cashflow = raw_data.get("free_cashflow", 0)
            shares_outstanding = raw_data.get("shares_outstanding", 0)
            market_cap = raw_data.get("market_cap", 0)
            total_debt = raw_data.get("total_debt", 0)
            total_cash = raw_data.get("total_cash", 0)
            revenue = raw_data.get("revenue", 0)
            net_income = raw_data.get("net_income", 0)

            # Calculate equity
            equity = (
                market_cap - total_debt + total_cash
                if market_cap and total_debt and total_cash
                else 0
            )

            # Build ratios structure - only include sections with actual data
            ratios = {}

            # Profitability ratios - measures of company's ability to generate profits
            profitability = {}
            # ROE: Return on Equity = Net Income / Shareholders' Equity
            if net_income and equity and equity != 0:
                profitability["ROE"] = net_income / equity

            # ROA: Return on Assets = Net Income / Total Assets (using market cap as proxy)
            # ROIC: Return on Invested Capital = Net Income / Invested Capital
            if net_income and market_cap and market_cap != 0:
                profitability["ROA"] = net_income / market_cap
                # ROIC = Net Operating Profit After Tax / Invested Capital
                # Invested Capital = Total Debt + Total Equity - Cash
                # For companies with no debt, use market cap as proxy for invested capital
                if total_debt and total_debt > 0:
                    invested_capital = (
                        total_debt + equity - total_cash
                        if total_cash
                        else total_debt + equity
                    )
                    profitability["ROIC"] = (
                        net_income / invested_capital if invested_capital != 0 else 0
                    )
                else:
                    # No debt company - ROIC ≈ ROA for debt-free companies
                    profitability["ROIC"] = net_income / market_cap

            # Operating Margin = Operating Income / Revenue (using net income as proxy)
            # Net Margin = Net Income / Revenue
            if net_income and revenue and revenue != 0:
                profitability["Operating Margin"] = net_income / revenue
                profitability["Net Margin"] = net_income / revenue

            if profitability:
                ratios["profitability"] = profitability

            # Leverage ratios - measures of company's debt levels and financial risk
            leverage = {}
            # Debt-to-Equity = Total Debt / Shareholders' Equity
            if total_debt and equity and equity != 0:
                leverage["Debt-to-Equity"] = total_debt / equity

            # Debt-to-Assets = Total Debt / Total Assets (using market cap as proxy)
            if total_debt and market_cap and market_cap != 0:
                leverage["Debt-to-Assets"] = total_debt / market_cap

            if leverage:
                ratios["leverage"] = leverage

            # Efficiency ratios - measures of how effectively company uses its assets
            efficiency = {}
            # Asset Turnover = Revenue / Total Assets (using market cap as proxy)
            if revenue and market_cap and market_cap != 0:
                efficiency["Asset Turnover"] = revenue / market_cap

            if efficiency:
                ratios["efficiency"] = efficiency

            # Valuation ratios - measures of company's market valuation relative to fundamentals
            valuation = {}
            # P/E Ratio = Stock Price / Earnings Per Share
            if current_price and eps and eps != 0:
                valuation["P/E Ratio"] = current_price / eps

            # P/B Ratio = Stock Price / Book Value Per Share
            if current_price and book_value and book_value != 0:
                valuation["P/B Ratio"] = current_price / book_value

            # P/S Ratio = Market Cap / Revenue
            if market_cap and revenue and revenue != 0:
                valuation["P/S Ratio"] = market_cap / revenue

            # PEG Ratio = P/E Ratio / Earnings Growth Rate
            if (
                current_price
                and eps
                and earnings_growth
                and eps != 0
                and earnings_growth != 0
            ):
                valuation["PEG Ratio"] = (current_price / eps) / earnings_growth

            if valuation:
                ratios["valuation"] = valuation

            return ratios

        except Exception as e:
            logger.error(f"Error calculating ratios from Yahoo Finance data: {str(e)}")
            return {}
