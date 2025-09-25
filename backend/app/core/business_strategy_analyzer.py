"""
Business Strategy Analysis Module

This module analyzes business strategy and long-term survival prospects by:
- Extracting strategy information from SEC filings
- Analyzing business model sustainability
- Calculating survival risk metrics
- Providing strategic insights and recommendations
"""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class StrategyInsight:
    """Data structure for strategy insights"""

    category: str
    insight: str
    confidence: float
    source: str


@dataclass
class SurvivalMetrics:
    """Data structure for survival risk metrics"""

    altman_z_score: Optional[float]
    current_ratio: Optional[float]
    debt_to_equity: Optional[float]
    interest_coverage: Optional[float]
    cash_ratio: Optional[float]
    survival_probability: float
    risk_level: str


class BusinessStrategyAnalyzer:
    """
    Analyzer for business strategy and survival analysis.
    """

    def __init__(self, ticker: str, financial_data: Optional[Dict] = None):
        """
        Initialize business strategy analyzer.

        Args:
            ticker (str): Company ticker symbol
            financial_data (Dict): Historical financial data from SEC filings
        """
        self.ticker = ticker
        self.financial_data = financial_data or {}

        # Strategy keywords for analysis
        self.strategy_keywords = {
            "innovation": [
                "innovation",
                "R&D",
                "research",
                "development",
                "technology",
                "patent",
                "intellectual property",
            ],
            "market_expansion": [
                "expansion",
                "growth",
                "market",
                "geographic",
                "international",
                "global",
            ],
            "acquisition": [
                "acquisition",
                "merger",
                "consolidation",
                "partnership",
                "joint venture",
            ],
            "cost_optimization": [
                "cost",
                "efficiency",
                "optimization",
                "restructuring",
                "streamlining",
            ],
            "sustainability": [
                "sustainability",
                "ESG",
                "environmental",
                "social",
                "governance",
                "green",
            ],
            "digital_transformation": [
                "digital",
                "technology",
                "automation",
                "AI",
                "machine learning",
                "data",
            ],
            "customer_focus": [
                "customer",
                "client",
                "service",
                "experience",
                "satisfaction",
                "retention",
            ],
        }

    def analyze_business_strategy(self) -> Dict[str, Any]:
        """
        Analyze business strategy from available data sources.

        Returns:
            Dictionary containing strategy analysis
        """
        try:
            # Extract strategy from SEC filings if available
            strategy_insights = self._extract_strategy_from_filings()

            # Analyze business model sustainability
            business_model_analysis = self._analyze_business_model()

            # Calculate survival metrics
            survival_metrics = self._calculate_survival_metrics()

            # Generate strategic recommendations
            recommendations = self._generate_strategic_recommendations(
                strategy_insights, survival_metrics
            )

            return {
                "ticker": self.ticker,
                "strategy_insights": [
                    insight.__dict__ for insight in strategy_insights
                ],
                "business_model_analysis": business_model_analysis,
                "survival_metrics": survival_metrics.__dict__,
                "recommendations": recommendations,
                "analysis_date": datetime.now().isoformat(),
            }

        except Exception as e:
            return {"error": f"Error analyzing business strategy: {str(e)}"}

    def _extract_strategy_from_filings(self) -> List[StrategyInsight]:
        """
        Extract strategy insights from SEC filings.

        Returns:
            List of strategy insights
        """
        insights = []

        if not self.financial_data:
            return insights

        # Handle different data structures
        if isinstance(self.financial_data, dict):
            # Check if it's a year-based structure or a single financial data structure
            if any(isinstance(key, (int, float)) for key in self.financial_data.keys()):
                # Year-based structure
                latest_year = (
                    max(self.financial_data.keys()) if self.financial_data else None
                )
                if not latest_year:
                    return insights
                latest_data = self.financial_data[latest_year]
            else:
                # Single financial data structure
                latest_data = self.financial_data
        else:
            return insights

        # Extract business description and strategy
        business_description = latest_data.get("Business Description", "")
        if business_description and isinstance(business_description, str):
            strategy_insights = self._analyze_text_for_strategy(
                business_description, "SEC Filing"
            )
            insights.extend(strategy_insights)

        # Extract risk factors that might indicate strategy
        risk_factors = latest_data.get("Risk Factors", "")
        if risk_factors and isinstance(risk_factors, str):
            risk_insights = self._analyze_text_for_strategy(
                risk_factors, "Risk Factors"
            )
            insights.extend(risk_insights)

        # If no specific strategy text found, create some basic insights based on financial data
        if not insights:
            insights = self._create_basic_strategy_insights(latest_data)

        return insights

    def _analyze_text_for_strategy(
        self, text: str, source: str
    ) -> List[StrategyInsight]:
        """
        Analyze text for strategy-related insights.

        Args:
            text (str): Text to analyze
            source (str): Source of the text

        Returns:
            List of strategy insights
        """
        insights = []

        if not text:
            return insights

        text_lower = text.lower()

        for category, keywords in self.strategy_keywords.items():
            matches = []
            for keyword in keywords:
                if keyword in text_lower:
                    matches.append(keyword)

            if matches:
                # Extract relevant sentences
                sentences = self._extract_relevant_sentences(text, matches)
                for sentence in sentences:
                    confidence = min(
                        len(matches) * 0.2, 1.0
                    )  # Simple confidence scoring
                    insights.append(
                        StrategyInsight(
                            category=category,
                            insight=sentence,
                            confidence=confidence,
                            source=source,
                        )
                    )

        return insights

    def _extract_relevant_sentences(self, text: str, keywords: List[str]) -> List[str]:
        """
        Extract sentences containing strategy keywords.

        Args:
            text (str): Text to search
            keywords (List[str]): Keywords to find

        Returns:
            List of relevant sentences
        """
        sentences = re.split(r"[.!?]+", text)
        relevant_sentences = []

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(keyword in sentence_lower for keyword in keywords):
                # Clean up the sentence
                cleaned = sentence.strip()
                if len(cleaned) > 20 and len(cleaned) < 200:  # Reasonable length
                    relevant_sentences.append(cleaned)

        return relevant_sentences[:5]  # Limit to top 5 sentences

    def _analyze_business_model(self) -> Dict[str, Any]:
        """
        Analyze business model sustainability.

        Returns:
            Dictionary containing business model analysis
        """
        analysis = {
            "revenue_diversification": self._assess_revenue_diversification(),
            "profitability_trends": self._assess_profitability_trends(),
            "market_position": self._assess_market_position(),
            "innovation_level": self._assess_innovation_level(),
            "sustainability_score": 0.0,
        }

        # Calculate overall sustainability score
        scores = [v for v in analysis.values() if isinstance(v, (int, float)) and v > 0]
        if scores:
            analysis["sustainability_score"] = sum(scores) / len(scores)

        return analysis

    def _assess_revenue_diversification(self) -> float:
        """Assess revenue diversification (0-100)"""
        if not self.financial_data:
            return 50.0  # Neutral score

        # This would need more detailed segment data from SEC filings
        # For now, return a placeholder score
        return 60.0

    def _assess_profitability_trends(self) -> float:
        """Assess profitability trends (0-100)"""
        if not self.financial_data:
            return 50.0

        # Handle single financial data structure
        if isinstance(self.financial_data, dict):
            if any(isinstance(key, (int, float)) for key in self.financial_data.keys()):
                # Year-based structure - calculate trends
                years = sorted(self.financial_data.keys(), reverse=True)[:3]
                margins = []

                for year in years:
                    data = self.financial_data[year]
                    revenue = data.get("Total net sales", 0)
                    net_income = data.get("Net income", 0)

                    if revenue and revenue > 0:
                        margin = (net_income / revenue) * 100
                        margins.append(margin)

                if len(margins) >= 2:
                    # Calculate trend
                    if margins[0] > margins[-1]:  # Improving
                        return min(80 + (margins[0] - margins[-1]) * 10, 100)
                    else:  # Declining
                        return max(20 - (margins[-1] - margins[0]) * 10, 0)
            else:
                # Single financial data structure - assess current profitability
                revenue = self.financial_data.get("Total net sales", 0)
                net_income = self.financial_data.get("Net income", 0)

                if revenue and revenue > 0:
                    margin = (net_income / revenue) * 100
                    # Score based on profit margin
                    if margin > 20:
                        return 90
                    elif margin > 15:
                        return 80
                    elif margin > 10:
                        return 70
                    elif margin > 5:
                        return 60
                    else:
                        return 40

        return 50.0

    def _assess_market_position(self) -> float:
        """Assess market position strength (0-100)"""
        if not self.financial_data:
            return 50.0

        # Handle single financial data structure
        if isinstance(self.financial_data, dict):
            if any(isinstance(key, (int, float)) for key in self.financial_data.keys()):
                # Year-based structure
                latest_year = max(self.financial_data.keys())
                latest_data = self.financial_data[latest_year]
            else:
                # Single financial data structure
                latest_data = self.financial_data

            # Use revenue growth as a proxy for market position
            revenue_growth = latest_data.get("Revenue Growth", 0)
            if revenue_growth:
                return min(max(revenue_growth * 100 + 50, 0), 100)

        return 50.0

    def _assess_innovation_level(self) -> float:
        """Assess innovation level (0-100)"""
        if not self.financial_data:
            return 50.0

        # Handle single financial data structure
        if isinstance(self.financial_data, dict):
            if any(isinstance(key, (int, float)) for key in self.financial_data.keys()):
                # Year-based structure
                latest_year = max(self.financial_data.keys())
                latest_data = self.financial_data[latest_year]
            else:
                # Single financial data structure
                latest_data = self.financial_data

            # Look for R&D spending as a proxy for innovation
            rd_expense = latest_data.get("Research and development", 0)
            revenue = latest_data.get("Total net sales", 0)

            if revenue and revenue > 0:
                rd_ratio = (rd_expense / revenue) * 100
                return min(rd_ratio * 10, 100)  # Scale R&D ratio to 0-100

        return 50.0

    def _calculate_survival_metrics(self) -> SurvivalMetrics:
        """
        Calculate survival risk metrics.

        Returns:
            SurvivalMetrics object
        """
        if not self.financial_data:
            return SurvivalMetrics(
                altman_z_score=None,
                current_ratio=None,
                debt_to_equity=None,
                interest_coverage=None,
                cash_ratio=None,
                survival_probability=50.0,
                risk_level="Unknown",
            )

        # Handle single financial data structure
        if isinstance(self.financial_data, dict):
            if any(isinstance(key, (int, float)) for key in self.financial_data.keys()):
                # Year-based structure
                latest_year = max(self.financial_data.keys())
                latest_data = self.financial_data[latest_year]
            else:
                # Single financial data structure
                latest_data = self.financial_data
        else:
            latest_data = {}

        # Calculate Altman Z-Score
        altman_z_score = self._calculate_altman_z_score(latest_data)

        # Calculate other survival metrics
        current_ratio = self._calculate_current_ratio(latest_data)
        debt_to_equity = self._calculate_debt_to_equity(latest_data)
        interest_coverage = self._calculate_interest_coverage(latest_data)
        cash_ratio = self._calculate_cash_ratio(latest_data)

        # Calculate survival probability
        survival_probability = self._calculate_survival_probability(
            altman_z_score, current_ratio, debt_to_equity, interest_coverage, cash_ratio
        )

        # Determine risk level
        risk_level = self._determine_risk_level(survival_probability)

        return SurvivalMetrics(
            altman_z_score=altman_z_score,
            current_ratio=current_ratio,
            debt_to_equity=debt_to_equity,
            interest_coverage=interest_coverage,
            cash_ratio=cash_ratio,
            survival_probability=survival_probability,
            risk_level=risk_level,
        )

    def _calculate_altman_z_score(self, data: Dict) -> Optional[float]:
        """Calculate Altman Z-Score for bankruptcy prediction"""
        try:
            # Get required financial data
            working_capital = data.get("Working capital", 0)
            retained_earnings = data.get("Retained earnings", 0)
            ebit = data.get("EBIT (Operating Income + Other Income/Expense)", 0)
            market_value = data.get("Market value of equity", 0)
            sales = data.get("Total net sales", 0)
            total_assets = data.get("Total assets", 0)
            total_liabilities = data.get("Total liabilities", 0)

            if not all([total_assets, sales]):
                return None

            # Altman Z-Score formula
            z_score = (
                1.2 * (working_capital / total_assets)
                + 1.4 * (retained_earnings / total_assets)
                + 3.3 * (ebit / total_assets)
                + 0.6 * (market_value / total_liabilities)
                + 1.0 * (sales / total_assets)
            )

            return z_score

        except Exception:
            return None

    def _calculate_current_ratio(self, data: Dict) -> Optional[float]:
        """Calculate current ratio"""
        try:
            current_assets = data.get("Current assets", 0)
            current_liabilities = data.get("Current liabilities", 0)

            if current_liabilities and current_liabilities > 0:
                return current_assets / current_liabilities
            return None
        except Exception:
            return None

    def _calculate_debt_to_equity(self, data: Dict) -> Optional[float]:
        """Calculate debt-to-equity ratio"""
        try:
            total_debt = data.get("Total debt", 0)
            total_equity = data.get("Total stockholders' equity", 0)

            if total_equity and total_equity > 0:
                return total_debt / total_equity
            return None
        except Exception:
            return None

    def _calculate_interest_coverage(self, data: Dict) -> Optional[float]:
        """Calculate interest coverage ratio"""
        try:
            ebit = data.get("EBIT (Operating Income + Other Income/Expense)", 0)
            interest_expense = data.get("Interest expense", 0)

            if interest_expense and interest_expense > 0:
                return ebit / interest_expense
            return None
        except Exception:
            return None

    def _calculate_cash_ratio(self, data: Dict) -> Optional[float]:
        """Calculate cash ratio"""
        try:
            cash = data.get("Cash and cash equivalents", 0)
            current_liabilities = data.get("Current liabilities", 0)

            if current_liabilities and current_liabilities > 0:
                return cash / current_liabilities
            return None
        except Exception:
            return None

    def _calculate_survival_probability(
        self,
        altman_z: Optional[float],
        current_ratio: Optional[float],
        debt_to_equity: Optional[float],
        interest_coverage: Optional[float],
        cash_ratio: Optional[float],
    ) -> float:
        """Calculate overall survival probability (0-100)"""
        scores = []

        # Altman Z-Score (40% weight)
        if altman_z is not None:
            if altman_z > 2.99:
                scores.append((100, 0.4))  # Safe zone
            elif altman_z > 1.81:
                scores.append((70, 0.4))  # Grey zone
            else:
                scores.append((30, 0.4))  # Distress zone

        # Current ratio (20% weight)
        if current_ratio is not None:
            if current_ratio > 2.0:
                scores.append((90, 0.2))
            elif current_ratio > 1.0:
                scores.append((70, 0.2))
            else:
                scores.append((30, 0.2))

        # Debt-to-equity (20% weight)
        if debt_to_equity is not None:
            if debt_to_equity < 0.5:
                scores.append((90, 0.2))
            elif debt_to_equity < 1.0:
                scores.append((70, 0.2))
            else:
                scores.append((40, 0.2))

        # Interest coverage (20% weight)
        if interest_coverage is not None:
            if interest_coverage > 5.0:
                scores.append((90, 0.2))
            elif interest_coverage > 2.5:
                scores.append((70, 0.2))
            else:
                scores.append((30, 0.2))

        if not scores:
            return 50.0  # Default neutral score

        # Calculate weighted average
        total_weight = sum(weight for _, weight in scores)
        weighted_sum = sum(score * weight for score, weight in scores)

        return weighted_sum / total_weight if total_weight > 0 else 50.0

    def _determine_risk_level(self, survival_probability: float) -> str:
        """Determine risk level based on survival probability"""
        if survival_probability >= 80:
            return "Low Risk"
        elif survival_probability >= 60:
            return "Moderate Risk"
        elif survival_probability >= 40:
            return "High Risk"
        else:
            return "Very High Risk"

    def _generate_strategic_recommendations(
        self,
        strategy_insights: List[StrategyInsight],
        survival_metrics: SurvivalMetrics,
    ) -> List[str]:
        """Generate strategic recommendations based on analysis"""
        recommendations = []

        # Survival-based recommendations
        if survival_metrics.survival_probability < 60:
            recommendations.append(
                "Focus on improving financial stability and reducing debt levels"
            )
            recommendations.append(
                "Consider cost-cutting measures and operational efficiency improvements"
            )

        if survival_metrics.current_ratio and survival_metrics.current_ratio < 1.0:
            recommendations.append(
                "Improve liquidity position to meet short-term obligations"
            )

        if survival_metrics.debt_to_equity and survival_metrics.debt_to_equity > 1.0:
            recommendations.append(
                "Reduce debt levels or increase equity to improve financial leverage"
            )

        # Strategy-based recommendations
        strategy_categories = [insight.category for insight in strategy_insights]

        if "innovation" not in strategy_categories:
            recommendations.append(
                "Consider increasing investment in R&D and innovation initiatives"
            )

        if "market_expansion" not in strategy_categories:
            recommendations.append(
                "Explore opportunities for market expansion and growth"
            )

        if "digital_transformation" not in strategy_categories:
            recommendations.append(
                "Develop digital transformation strategy to stay competitive"
            )

        return recommendations

    def _create_basic_strategy_insights(
        self, financial_data: Dict
    ) -> List[StrategyInsight]:
        """
        Create basic strategy insights based on financial data when no text analysis is available.

        Args:
            financial_data: Financial data dictionary

        Returns:
            List of basic strategy insights
        """
        insights = []

        # Analyze R&D spending for innovation insights
        rd_expense = financial_data.get("Research and development", 0)
        revenue = financial_data.get("Total net sales", 0)

        if rd_expense and revenue and revenue > 0:
            rd_ratio = rd_expense / revenue
            if rd_ratio > 0.05:  # More than 5% of revenue
                insights.append(
                    StrategyInsight(
                        category="innovation",
                        insight=f"High R&D investment of {rd_ratio:.1%} of revenue indicates strong focus on innovation and product development",
                        confidence=0.8,
                        source="Financial Analysis",
                    )
                )

        # Analyze revenue growth for market expansion insights
        revenue_growth = financial_data.get("Revenue Growth", 0)
        if revenue_growth and revenue_growth > 0.1:  # More than 10% growth
            insights.append(
                StrategyInsight(
                    category="market_expansion",
                    insight=f"Strong revenue growth of {revenue_growth:.1%} suggests successful market expansion strategy",
                    confidence=0.7,
                    source="Financial Analysis",
                )
            )

        # Analyze profit margins for cost optimization insights
        operating_income = financial_data.get("Operating income", 0)
        if operating_income and revenue and revenue > 0:
            operating_margin = operating_income / revenue
            if operating_margin > 0.2:  # More than 20% margin
                insights.append(
                    StrategyInsight(
                        category="cost_optimization",
                        insight=f"Strong operating margin of {operating_margin:.1%} indicates effective cost management and operational efficiency",
                        confidence=0.7,
                        source="Financial Analysis",
                    )
                )

        # Analyze cash position for financial strength
        cash = financial_data.get("Cash and cash equivalents", 0)
        total_assets = financial_data.get("Total assets", 0)
        if cash and total_assets and total_assets > 0:
            cash_ratio = cash / total_assets
            if cash_ratio > 0.1:  # More than 10% of assets in cash
                insights.append(
                    StrategyInsight(
                        category="financial_strength",
                        insight=f"Strong cash position of {cash_ratio:.1%} of total assets provides financial flexibility for strategic initiatives",
                        confidence=0.6,
                        source="Financial Analysis",
                    )
                )

        return insights[:5]  # Limit to top 5 recommendations
