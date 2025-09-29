"""
Competitive Advantage Analysis Module

This module provides comprehensive competitive advantage (moat) analysis including:
- Ecosystem lock-in analysis
- Brand power assessment
- Vertical integration evaluation
- Supply chain mastery analysis
- Strategic positioning assessment
- Porter's Five Forces analysis
- Sector-specific competitive advantage insights
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import yfinance as yf


@dataclass
class CompetitiveAdvantage:
    """Data structure for competitive advantage analysis"""

    category: str
    strength_score: float  # 0-100
    description: str
    evidence: List[str]
    sustainability: str  # "High", "Medium", "Low"
    impact_on_valuation: str  # "High", "Medium", "Low"


@dataclass
class PortersFiveForces:
    """Data structure for Porter's Five Forces analysis"""

    supplier_power: Dict[str, Any]
    buyer_power: Dict[str, Any]
    competitive_rivalry: Dict[str, Any]
    threat_of_substitution: Dict[str, Any]
    threat_of_new_entrants: Dict[str, Any]
    overall_industry_attractiveness: str


class CompetitiveAdvantageAnalyzer:
    """
    Analyzer for competitive advantage (moat) analysis and strategic positioning.
    """

    def __init__(self, ticker: str, financial_data: Optional[Dict] = None):
        """
        Initialize competitive advantage analyzer.

        Args:
            ticker (str): Company ticker symbol
            financial_data (Dict): Historical financial data from SEC filings
        """
        self.ticker = ticker
        self.financial_data = financial_data or {}
        self.yf_ticker = yf.Ticker(ticker)

        # Load sector-specific competitive advantage templates
        self.sector_templates = self._load_sector_templates()

    def _load_sector_templates(self) -> Dict[str, Dict[str, Any]]:
        """
        Load sector-specific competitive advantage analysis templates.

        Returns:
            Dict mapping sectors to analysis templates
        """
        return {
            "Technology": {
                "ecosystem_lock_in": {
                    "keywords": [
                        "ecosystem",
                        "integration",
                        "platform",
                        "network effects",
                        "switching costs",
                    ],
                    "strength_indicators": [
                        "recurring revenue",
                        "customer retention",
                        "platform revenue",
                    ],
                    "examples": [
                        "Apple ecosystem",
                        "Microsoft Office",
                        "Google services",
                    ],
                },
                "brand_power": {
                    "keywords": [
                        "brand",
                        "premium",
                        "loyalty",
                        "recognition",
                        "reputation",
                    ],
                    "strength_indicators": [
                        "premium pricing",
                        "brand value",
                        "customer loyalty",
                    ],
                    "examples": ["Apple brand", "Tesla brand", "Nvidia brand"],
                },
                "innovation": {
                    "keywords": [
                        "R&D",
                        "innovation",
                        "patents",
                        "technology",
                        "intellectual property",
                    ],
                    "strength_indicators": [
                        "R&D spending",
                        "patent portfolio",
                        "innovation rate",
                    ],
                    "examples": ["Apple design", "Google AI", "Microsoft cloud"],
                },
            },
            "Healthcare": {
                "regulatory_moat": {
                    "keywords": [
                        "FDA",
                        "approval",
                        "regulatory",
                        "patent",
                        "exclusivity",
                    ],
                    "strength_indicators": [
                        "FDA approvals",
                        "patent protection",
                        "regulatory barriers",
                    ],
                    "examples": [
                        "Drug patents",
                        "Medical device approvals",
                        "Biologics exclusivity",
                    ],
                },
                "research_pipeline": {
                    "keywords": [
                        "pipeline",
                        "clinical trials",
                        "R&D",
                        "drug development",
                    ],
                    "strength_indicators": [
                        "Pipeline depth",
                        "R&D investment",
                        "success rate",
                    ],
                    "examples": [
                        "Pharma pipelines",
                        "Biotech development",
                        "Medical research",
                    ],
                },
                "distribution_network": {
                    "keywords": [
                        "distribution",
                        "sales force",
                        "market access",
                        "relationships",
                    ],
                    "strength_indicators": [
                        "Sales network",
                        "Market penetration",
                        "Customer relationships",
                    ],
                    "examples": [
                        "Pharma sales",
                        "Medical device distribution",
                        "Hospital relationships",
                    ],
                },
            },
            "Financial Services": {
                "regulatory_barriers": {
                    "keywords": [
                        "banking license",
                        "regulatory",
                        "compliance",
                        "capital requirements",
                    ],
                    "strength_indicators": [
                        "Regulatory capital",
                        "Compliance costs",
                        "Barriers to entry",
                    ],
                    "examples": [
                        "Banking licenses",
                        "Insurance regulations",
                        "Securities compliance",
                    ],
                },
                "network_effects": {
                    "keywords": [
                        "network",
                        "payment",
                        "transactions",
                        "user base",
                        "scale",
                    ],
                    "strength_indicators": [
                        "Transaction volume",
                        "User base",
                        "Network size",
                    ],
                    "examples": [
                        "Visa network",
                        "PayPal users",
                        "Banking relationships",
                    ],
                },
                "data_advantage": {
                    "keywords": [
                        "data",
                        "analytics",
                        "risk assessment",
                        "credit scoring",
                    ],
                    "strength_indicators": [
                        "Data assets",
                        "Analytics capability",
                        "Risk models",
                    ],
                    "examples": ["Credit data", "Transaction data", "Risk analytics"],
                },
            },
            "Consumer Discretionary": {
                "brand_loyalty": {
                    "keywords": [
                        "brand",
                        "loyalty",
                        "premium",
                        "recognition",
                        "reputation",
                    ],
                    "strength_indicators": [
                        "Brand value",
                        "Customer loyalty",
                        "Premium pricing",
                    ],
                    "examples": ["Nike brand", "Tesla brand", "Luxury brands"],
                },
                "retail_presence": {
                    "keywords": [
                        "stores",
                        "retail",
                        "distribution",
                        "location",
                        "footprint",
                    ],
                    "strength_indicators": [
                        "Store count",
                        "Prime locations",
                        "Distribution network",
                    ],
                    "examples": ["Apple Stores", "Nike stores", "Tesla showrooms"],
                },
                "supply_chain": {
                    "keywords": [
                        "supply chain",
                        "manufacturing",
                        "sourcing",
                        "logistics",
                    ],
                    "strength_indicators": [
                        "Supply chain efficiency",
                        "Cost control",
                        "Quality",
                    ],
                    "examples": [
                        "Apple supply chain",
                        "Nike manufacturing",
                        "Tesla production",
                    ],
                },
            },
            "Consumer Staples": {
                "distribution_network": {
                    "keywords": [
                        "distribution",
                        "retail",
                        "shelf space",
                        "relationships",
                    ],
                    "strength_indicators": [
                        "Distribution reach",
                        "Shelf space",
                        "Retail relationships",
                    ],
                    "examples": [
                        "Coca-Cola distribution",
                        "P&G retail",
                        "Nestle global reach",
                    ],
                },
                "brand_recognition": {
                    "keywords": [
                        "brand",
                        "recognition",
                        "household",
                        "trust",
                        "reputation",
                    ],
                    "strength_indicators": [
                        "Brand recognition",
                        "Market share",
                        "Customer trust",
                    ],
                    "examples": ["Coca-Cola brand", "P&G brands", "Nestle brands"],
                },
                "scale_economics": {
                    "keywords": ["scale", "economies", "volume", "efficiency", "cost"],
                    "strength_indicators": [
                        "Production scale",
                        "Cost efficiency",
                        "Volume",
                    ],
                    "examples": ["Coca-Cola scale", "P&G efficiency", "Nestle volume"],
                },
            },
        }

    def analyze_competitive_advantage(self) -> Dict[str, Any]:
        """
        Perform comprehensive competitive advantage analysis.

        Returns:
            Dictionary containing competitive advantage analysis
        """
        try:
            # Get company information
            company_info = self._get_company_info()
            sector = company_info.get("sector", "Unknown")

            # Analyze different types of competitive advantages
            ecosystem_analysis = self._analyze_ecosystem_lock_in()
            brand_analysis = self._analyze_brand_power()
            vertical_integration = self._analyze_vertical_integration()
            supply_chain = self._analyze_supply_chain_mastery()
            strategic_positioning = self._analyze_strategic_positioning()

            # Perform Porter's Five Forces analysis
            porters_analysis = self._analyze_porters_five_forces()

            # Generate sector-specific insights
            sector_insights = self._generate_sector_insights(sector)

            # Calculate overall moat strength
            overall_moat_strength = self._calculate_overall_moat_strength(
                [
                    ecosystem_analysis,
                    brand_analysis,
                    vertical_integration,
                    supply_chain,
                    strategic_positioning,
                ]
            )

            # Generate investment thesis
            investment_thesis = self._generate_investment_thesis(
                overall_moat_strength, sector_insights, porters_analysis
            )

            return {
                "ticker": self.ticker,
                "company_info": company_info,
                "competitive_advantages": {
                    "ecosystem_lock_in": ecosystem_analysis.__dict__,
                    "brand_power": brand_analysis.__dict__,
                    "vertical_integration": vertical_integration.__dict__,
                    "supply_chain_mastery": supply_chain.__dict__,
                    "strategic_positioning": strategic_positioning.__dict__,
                },
                "porters_five_forces": porters_analysis.__dict__,
                "sector_insights": sector_insights,
                "overall_moat_strength": overall_moat_strength,
                "investment_thesis": investment_thesis,
                "analysis_date": datetime.now().isoformat(),
            }

        except Exception as e:
            return {"error": f"Error analyzing competitive advantage: {str(e)}"}

    def _get_company_info(self) -> Dict[str, Any]:
        """Get basic company information"""
        try:
            info = self.yf_ticker.info
            return {
                "name": info.get("longName", self.ticker),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "market_cap": info.get("marketCap", 0),
                "description": info.get("longBusinessSummary", ""),
                "website": info.get("website", ""),
                "employees": info.get("fullTimeEmployees", 0),
            }
        except Exception as e:
            print(f"Error getting company info for {self.ticker}: {e}")
            return {"name": self.ticker, "sector": "Unknown", "industry": "Unknown"}

    def _analyze_ecosystem_lock_in(self) -> CompetitiveAdvantage:
        """Analyze ecosystem lock-in competitive advantage"""
        try:
            info = self.yf_ticker.info
            business_summary = info.get("longBusinessSummary", "").lower()

            # Look for ecosystem indicators
            ecosystem_keywords = [
                "ecosystem",
                "platform",
                "integration",
                "network effects",
                "switching costs",
                "ecosystem",
                "suite",
                "connected",
            ]

            ecosystem_mentions = sum(
                1 for keyword in ecosystem_keywords if keyword in business_summary
            )

            # Analyze financial metrics for ecosystem strength
            recurring_revenue_indicators = 0
            if "subscription" in business_summary or "recurring" in business_summary:
                recurring_revenue_indicators += 1

            # Calculate strength score
            strength_score = min(
                100, (ecosystem_mentions * 15) + (recurring_revenue_indicators * 20)
            )

            # Determine sustainability and impact
            if strength_score >= 70:
                sustainability = "High"
                impact = "High"
            elif strength_score >= 40:
                sustainability = "Medium"
                impact = "Medium"
            else:
                sustainability = "Low"
                impact = "Low"

            evidence = []
            if ecosystem_mentions > 0:
                evidence.append(
                    f"Business model emphasizes ecosystem integration ({ecosystem_mentions} mentions)"
                )
            if recurring_revenue_indicators > 0:
                evidence.append("Strong recurring revenue model")

            return CompetitiveAdvantage(
                category="Ecosystem Lock-In",
                strength_score=strength_score,
                description=self._get_ecosystem_description(strength_score),
                evidence=evidence,
                sustainability=sustainability,
                impact_on_valuation=impact,
            )

        except Exception as e:
            print(f"Error analyzing ecosystem lock-in: {e}")
            return self._get_default_advantage("Ecosystem Lock-In")

    def _analyze_brand_power(self) -> CompetitiveAdvantage:
        """Analyze brand power competitive advantage"""
        try:
            info = self.yf_ticker.info

            # Analyze brand strength indicators
            brand_strength = 0

            # Premium pricing indicator
            profit_margin = info.get("profitMargins", 0)
            if profit_margin and profit_margin > 0.15:  # 15%+ profit margin
                brand_strength += 30

            # Market cap as brand value proxy
            market_cap = info.get("marketCap", 0)
            if market_cap and market_cap > 100_000_000_000:  # $100B+
                brand_strength += 25

            # Brand recognition in business summary
            business_summary = info.get("longBusinessSummary", "").lower()
            brand_keywords = [
                "brand",
                "premium",
                "quality",
                "reputation",
                "trust",
                "recognition",
            ]
            brand_mentions = sum(
                1 for keyword in brand_keywords if keyword in business_summary
            )
            brand_strength += min(25, brand_mentions * 5)

            # Industry leadership
            if "leader" in business_summary or "leading" in business_summary:
                brand_strength += 20

            strength_score = min(100, brand_strength)

            # Determine sustainability and impact
            if strength_score >= 70:
                sustainability = "High"
                impact = "High"
            elif strength_score >= 40:
                sustainability = "Medium"
                impact = "Medium"
            else:
                sustainability = "Low"
                impact = "Low"

            evidence = []
            if profit_margin and profit_margin > 0.15:
                evidence.append(
                    f"High profit margins ({profit_margin:.1%}) indicate premium pricing power"
                )
            if market_cap and market_cap > 100_000_000_000:
                evidence.append(
                    "Large market capitalization reflects strong brand value"
                )
            if brand_mentions > 0:
                evidence.append(
                    f"Business model emphasizes brand strength ({brand_mentions} mentions)"
                )

            return CompetitiveAdvantage(
                category="Brand Power",
                strength_score=strength_score,
                description=self._get_brand_description(strength_score),
                evidence=evidence,
                sustainability=sustainability,
                impact_on_valuation=impact,
            )

        except Exception as e:
            print(f"Error analyzing brand power: {e}")
            return self._get_default_advantage("Brand Power")

    def _analyze_vertical_integration(self) -> CompetitiveAdvantage:
        """Analyze vertical integration competitive advantage"""
        try:
            info = self.yf_ticker.info
            business_summary = info.get("longBusinessSummary", "").lower()

            # Look for vertical integration indicators
            integration_keywords = [
                "design",
                "manufacturing",
                "distribution",
                "retail",
                "software",
                "hardware",
                "services",
                "integrated",
                "end-to-end",
                "full stack",
            ]

            integration_mentions = sum(
                1 for keyword in integration_keywords if keyword in business_summary
            )

            # Analyze business model complexity
            business_complexity = 0
            if "design" in business_summary and "manufacturing" in business_summary:
                business_complexity += 25
            if "software" in business_summary and "hardware" in business_summary:
                business_complexity += 25
            if "services" in business_summary and (
                "software" in business_summary or "hardware" in business_summary
            ):
                business_complexity += 25

            strength_score = min(100, integration_mentions * 8 + business_complexity)

            # Determine sustainability and impact
            if strength_score >= 70:
                sustainability = "High"
                impact = "High"
            elif strength_score >= 40:
                sustainability = "Medium"
                impact = "Medium"
            else:
                sustainability = "Low"
                impact = "Low"

            evidence = []
            if integration_mentions > 0:
                evidence.append(
                    f"Business model shows vertical integration ({integration_mentions} indicators)"
                )
            if business_complexity > 0:
                evidence.append("Complex integrated business model")

            return CompetitiveAdvantage(
                category="Vertical Integration",
                strength_score=strength_score,
                description=self._get_integration_description(strength_score),
                evidence=evidence,
                sustainability=sustainability,
                impact_on_valuation=impact,
            )

        except Exception as e:
            print(f"Error analyzing vertical integration: {e}")
            return self._get_default_advantage("Vertical Integration")

    def _analyze_supply_chain_mastery(self) -> CompetitiveAdvantage:
        """Analyze supply chain mastery competitive advantage"""
        try:
            info = self.yf_ticker.info
            business_summary = info.get("longBusinessSummary", "").lower()

            # Look for supply chain indicators
            supply_chain_keywords = [
                "supply chain",
                "logistics",
                "manufacturing",
                "sourcing",
                "efficiency",
                "cost",
                "scale",
                "operations",
                "production",
            ]

            supply_chain_mentions = sum(
                1 for keyword in supply_chain_keywords if keyword in business_summary
            )

            # Analyze operational efficiency
            operational_efficiency = 0

            # Gross margin as efficiency indicator
            gross_margin = info.get("grossMargins", 0)
            if gross_margin and gross_margin > 0.3:  # 30%+ gross margin
                operational_efficiency += 30

            # Revenue per employee as efficiency indicator
            revenue = info.get("totalRevenue", 0)
            employees = info.get("fullTimeEmployees", 0)
            if revenue and employees and employees > 0:
                revenue_per_employee = revenue / employees
                if revenue_per_employee > 500_000:  # $500K+ per employee
                    operational_efficiency += 25

            # Scale indicators
            if "scale" in business_summary or "global" in business_summary:
                operational_efficiency += 20

            strength_score = min(
                100, supply_chain_mentions * 10 + operational_efficiency
            )

            # Determine sustainability and impact
            if strength_score >= 70:
                sustainability = "High"
                impact = "High"
            elif strength_score >= 40:
                sustainability = "Medium"
                impact = "Medium"
            else:
                sustainability = "Low"
                impact = "Low"

            evidence = []
            if supply_chain_mentions > 0:
                evidence.append(
                    f"Business emphasizes supply chain excellence ({supply_chain_mentions} mentions)"
                )
            if gross_margin and gross_margin > 0.3:
                evidence.append(
                    f"High gross margins ({gross_margin:.1%}) indicate operational efficiency"
                )
            if revenue_per_employee and revenue_per_employee > 500_000:
                evidence.append(
                    f"High revenue per employee (${revenue_per_employee:,.0f}) shows operational efficiency"
                )

            return CompetitiveAdvantage(
                category="Supply Chain Mastery",
                strength_score=strength_score,
                description=self._get_supply_chain_description(strength_score),
                evidence=evidence,
                sustainability=sustainability,
                impact_on_valuation=impact,
            )

        except Exception as e:
            print(f"Error analyzing supply chain mastery: {e}")
            return self._get_default_advantage("Supply Chain Mastery")

    def _analyze_strategic_positioning(self) -> CompetitiveAdvantage:
        """Analyze strategic positioning competitive advantage"""
        try:
            info = self.yf_ticker.info
            business_summary = info.get("longBusinessSummary", "").lower()

            # Look for strategic positioning indicators
            strategic_keywords = [
                "leader",
                "leading",
                "market share",
                "dominant",
                "first",
                "innovative",
                "pioneer",
                "unique",
                "differentiated",
                "competitive",
            ]

            strategic_mentions = sum(
                1 for keyword in strategic_keywords if keyword in business_summary
            )

            # Analyze market position
            market_position = 0

            # Market cap as market position indicator
            market_cap = info.get("marketCap", 0)
            if market_cap and market_cap > 50_000_000_000:  # $50B+
                market_position += 30

            # Innovation indicators
            if "innovative" in business_summary or "innovation" in business_summary:
                market_position += 25

            # Market leadership indicators
            if "leader" in business_summary or "leading" in business_summary:
                market_position += 25

            # Differentiation indicators
            if "unique" in business_summary or "differentiated" in business_summary:
                market_position += 20

            strength_score = min(100, strategic_mentions * 8 + market_position)

            # Determine sustainability and impact
            if strength_score >= 70:
                sustainability = "High"
                impact = "High"
            elif strength_score >= 40:
                sustainability = "Medium"
                impact = "Medium"
            else:
                sustainability = "Low"
                impact = "Low"

            evidence = []
            if strategic_mentions > 0:
                evidence.append(
                    f"Strong strategic positioning indicators ({strategic_mentions} mentions)"
                )
            if market_cap and market_cap > 50_000_000_000:
                evidence.append(
                    "Large market capitalization indicates strong market position"
                )
            if "innovative" in business_summary:
                evidence.append("Business emphasizes innovation and differentiation")

            return CompetitiveAdvantage(
                category="Strategic Positioning",
                strength_score=strength_score,
                description=self._get_strategic_description(strength_score),
                evidence=evidence,
                sustainability=sustainability,
                impact_on_valuation=impact,
            )

        except Exception as e:
            print(f"Error analyzing strategic positioning: {e}")
            return self._get_default_advantage("Strategic Positioning")

    def _analyze_porters_five_forces(self) -> PortersFiveForces:
        """Perform Porter's Five Forces analysis"""
        try:
            info = self.yf_ticker.info
            business_summary = info.get("longBusinessSummary", "").lower()

            # Supplier Power Analysis
            supplier_power = self._analyze_supplier_power(business_summary)

            # Buyer Power Analysis
            buyer_power = self._analyze_buyer_power(business_summary, info)

            # Competitive Rivalry Analysis
            competitive_rivalry = self._analyze_competitive_rivalry(
                business_summary, info
            )

            # Threat of Substitution Analysis
            threat_of_substitution = self._analyze_threat_of_substitution(
                business_summary
            )

            # Threat of New Entrants Analysis
            threat_of_new_entrants = self._analyze_threat_of_new_entrants(
                business_summary, info
            )

            # Calculate overall industry attractiveness
            overall_attractiveness = self._calculate_industry_attractiveness(
                [
                    supplier_power,
                    buyer_power,
                    competitive_rivalry,
                    threat_of_substitution,
                    threat_of_new_entrants,
                ]
            )

            return PortersFiveForces(
                supplier_power=supplier_power,
                buyer_power=buyer_power,
                competitive_rivalry=competitive_rivalry,
                threat_of_substitution=threat_of_substitution,
                threat_of_new_entrants=threat_of_new_entrants,
                overall_industry_attractiveness=overall_attractiveness,
            )

        except Exception as e:
            print(f"Error analyzing Porter's Five Forces: {e}")
            return self._get_default_porters_analysis()

    def _analyze_supplier_power(self, business_summary: str) -> Dict[str, Any]:
        """Analyze supplier power"""
        supplier_keywords = [
            "supplier",
            "vendor",
            "outsource",
            "contract",
            "relationship",
        ]
        supplier_mentions = sum(
            1 for keyword in supplier_keywords if keyword in business_summary
        )

        if supplier_mentions > 2:
            power_level = "Low"
            description = (
                "Company has strong supplier relationships and diversification"
            )
        elif supplier_mentions > 0:
            power_level = "Medium"
            description = "Moderate supplier dependency"
        else:
            power_level = "High"
            description = "Limited supplier diversification mentioned"

        return {
            "power_level": power_level,
            "description": description,
            "evidence": f"Supplier-related mentions: {supplier_mentions}",
            "impact": (
                "Low"
                if power_level == "Low"
                else "Medium" if power_level == "Medium" else "High"
            ),
        }

    def _analyze_buyer_power(self, business_summary: str, info: Dict) -> Dict[str, Any]:
        """Analyze buyer power"""
        buyer_keywords = ["customer", "client", "consumer", "market", "demand"]
        buyer_mentions = sum(
            1 for keyword in buyer_keywords if keyword in business_summary
        )

        # Analyze customer concentration
        customer_concentration = 0
        if "diversified" in business_summary or "broad" in business_summary:
            customer_concentration -= 20
        if "concentrated" in business_summary or "few" in business_summary:
            customer_concentration += 20

        # Analyze pricing power
        profit_margin = info.get("profitMargins", 0)
        pricing_power = 0
        if profit_margin and profit_margin > 0.15:
            pricing_power -= 20  # High margins indicate low buyer power

        power_score = buyer_mentions * 5 + customer_concentration + pricing_power

        if power_score < 20:
            power_level = "Low"
            description = "Strong pricing power and diversified customer base"
        elif power_score < 40:
            power_level = "Medium"
            description = "Moderate buyer power"
        else:
            power_level = "High"
            description = (
                "High buyer power due to customer concentration or pricing pressure"
            )

        return {
            "power_level": power_level,
            "description": description,
            "evidence": (
                f"Buyer-related mentions: {buyer_mentions}, Profit margin: {profit_margin:.1%}"
                if profit_margin
                else f"Buyer-related mentions: {buyer_mentions}"
            ),
            "impact": (
                "Low"
                if power_level == "Low"
                else "Medium" if power_level == "Medium" else "High"
            ),
        }

    def _analyze_competitive_rivalry(
        self, business_summary: str, info: Dict
    ) -> Dict[str, Any]:
        """Analyze competitive rivalry"""
        rivalry_keywords = [
            "competitive",
            "competition",
            "rival",
            "market share",
            "leader",
        ]
        rivalry_mentions = sum(
            1 for keyword in rivalry_keywords if keyword in business_summary
        )

        # Analyze market position
        market_cap = info.get("marketCap", 0)
        market_position = 0
        if market_cap and market_cap > 100_000_000_000:  # $100B+
            market_position -= 20  # Large companies face less rivalry

        # Analyze differentiation
        differentiation_keywords = [
            "unique",
            "differentiated",
            "innovative",
            "specialized",
        ]
        differentiation_mentions = sum(
            1 for keyword in differentiation_keywords if keyword in business_summary
        )

        rivalry_score = (
            rivalry_mentions * 8 + market_position - (differentiation_mentions * 5)
        )

        if rivalry_score < 20:
            rivalry_level = "Low"
            description = "Strong market position with differentiated offerings"
        elif rivalry_score < 40:
            rivalry_level = "Medium"
            description = "Moderate competitive rivalry"
        else:
            rivalry_level = "High"
            description = "Intense competitive rivalry in the market"

        return {
            "rivalry_level": rivalry_level,
            "description": description,
            "evidence": f"Competitive mentions: {rivalry_mentions}, Differentiation: {differentiation_mentions}",
            "impact": (
                "Low"
                if rivalry_level == "Low"
                else "Medium" if rivalry_level == "Medium" else "High"
            ),
        }

    def _analyze_threat_of_substitution(self, business_summary: str) -> Dict[str, Any]:
        """Analyze threat of substitution"""
        substitution_keywords = [
            "substitute",
            "alternative",
            "replacement",
            "disruption",
            "technology",
        ]
        substitution_mentions = sum(
            1 for keyword in substitution_keywords if keyword in business_summary
        )

        # Analyze technology disruption
        tech_keywords = ["technology", "digital", "innovation", "disruption"]
        tech_mentions = sum(
            1 for keyword in tech_keywords if keyword in business_summary
        )

        threat_score = substitution_mentions * 10 + tech_mentions * 5

        if threat_score < 15:
            threat_level = "Low"
            description = "Low threat of substitution due to unique value proposition"
        elif threat_score < 30:
            threat_level = "Medium"
            description = "Moderate threat of substitution"
        else:
            threat_level = "High"
            description = "High threat of substitution due to technological disruption"

        return {
            "threat_level": threat_level,
            "description": description,
            "evidence": f"Substitution mentions: {substitution_mentions}, Technology mentions: {tech_mentions}",
            "impact": (
                "Low"
                if threat_level == "Low"
                else "Medium" if threat_level == "Medium" else "High"
            ),
        }

    def _analyze_threat_of_new_entrants(
        self, business_summary: str, info: Dict
    ) -> Dict[str, Any]:
        """Analyze threat of new entrants"""
        barrier_keywords = [
            "barrier",
            "capital",
            "scale",
            "regulation",
            "patent",
            "exclusive",
        ]
        barrier_mentions = sum(
            1 for keyword in barrier_keywords if keyword in business_summary
        )

        # Analyze capital requirements
        market_cap = info.get("marketCap", 0)
        capital_barrier = 0
        if market_cap and market_cap > 50_000_000_000:  # $50B+
            capital_barrier -= 20  # High capital requirements create barriers

        # Analyze regulatory barriers
        regulatory_keywords = ["regulation", "license", "approval", "compliance"]
        regulatory_mentions = sum(
            1 for keyword in regulatory_keywords if keyword in business_summary
        )

        threat_score = (
            barrier_mentions * 8 + capital_barrier - (regulatory_mentions * 10)
        )

        if threat_score < 20:
            threat_level = "Low"
            description = "High barriers to entry protect market position"
        elif threat_score < 40:
            threat_level = "Medium"
            description = "Moderate barriers to entry"
        else:
            threat_level = "High"
            description = "Low barriers to entry allow new competitors"

        return {
            "threat_level": threat_level,
            "description": description,
            "evidence": f"Barrier mentions: {barrier_mentions}, Regulatory mentions: {regulatory_mentions}",
            "impact": (
                "Low"
                if threat_level == "Low"
                else "Medium" if threat_level == "Medium" else "High"
            ),
        }

    def _calculate_industry_attractiveness(self, forces: List[Dict]) -> str:
        """Calculate overall industry attractiveness based on Porter's Five Forces"""
        attractive_forces = 0

        for force in forces:
            if "power_level" in force:
                if force["power_level"] == "Low":
                    attractive_forces += 1
            elif "rivalry_level" in force:
                if force["rivalry_level"] == "Low":
                    attractive_forces += 1
            elif "threat_level" in force:
                if force["threat_level"] == "Low":
                    attractive_forces += 1

        if attractive_forces >= 4:
            return "Highly Attractive"
        elif attractive_forces >= 3:
            return "Moderately Attractive"
        elif attractive_forces >= 2:
            return "Neutral"
        else:
            return "Unattractive"

    def _generate_sector_insights(self, sector: str) -> Dict[str, Any]:
        """Generate sector-specific competitive advantage insights"""
        sector_template = self.sector_templates.get(sector, {})

        if not sector_template:
            return {
                "sector": sector,
                "key_advantages": ["Market position", "Operational efficiency"],
                "insights": "Standard competitive advantage analysis",
                "recommendations": [
                    "Focus on operational excellence",
                    "Build market position",
                ],
            }

        key_advantages = list(sector_template.keys())

        insights = []
        recommendations = []

        for advantage_type, details in sector_template.items():
            insights.append(
                f"{advantage_type.replace('_', ' ').title()}: {details.get('examples', ['Standard approach'])[0]}"
            )
            recommendations.append(f"Strengthen {advantage_type.replace('_', ' ')}")

        return {
            "sector": sector,
            "key_advantages": key_advantages,
            "insights": insights,
            "recommendations": recommendations,
            "template_details": sector_template,
        }

    def _calculate_overall_moat_strength(
        self, advantages: List[CompetitiveAdvantage]
    ) -> Dict[str, Any]:
        """Calculate overall competitive moat strength"""
        if not advantages:
            return {
                "score": 0,
                "level": "None",
                "description": "No competitive advantages identified",
            }

        # Weight different advantages
        weights = {
            "Ecosystem Lock-In": 0.25,
            "Brand Power": 0.20,
            "Vertical Integration": 0.20,
            "Supply Chain Mastery": 0.20,
            "Strategic Positioning": 0.15,
        }

        weighted_score = 0
        for advantage in advantages:
            weight = weights.get(advantage.category, 0.20)
            weighted_score += advantage.strength_score * weight

        if weighted_score >= 80:
            level = "Very Strong"
            description = "Company has multiple strong competitive advantages that create significant barriers to competition"
        elif weighted_score >= 60:
            level = "Strong"
            description = "Company has solid competitive advantages that provide meaningful protection"
        elif weighted_score >= 40:
            level = "Moderate"
            description = "Company has some competitive advantages but faces significant competition"
        elif weighted_score >= 20:
            level = "Weak"
            description = "Company has limited competitive advantages and faces intense competition"
        else:
            level = "Very Weak"
            description = "Company has minimal competitive advantages and is highly vulnerable to competition"

        return {
            "score": round(weighted_score, 1),
            "level": level,
            "description": description,
            "breakdown": {adv.category: adv.strength_score for adv in advantages},
        }

    def _generate_investment_thesis(
        self,
        moat_strength: Dict,
        sector_insights: Dict,
        porters_analysis: PortersFiveForces,
    ) -> Dict[str, Any]:
        """Generate investment thesis based on competitive advantage analysis"""
        thesis_parts = []

        # Moat strength analysis
        moat_level = moat_strength["level"]
        if moat_level in ["Very Strong", "Strong"]:
            thesis_parts.append(
                f"Strong competitive moat with {moat_strength['score']:.1f}/100 score"
            )
        elif moat_level == "Moderate":
            thesis_parts.append(
                f"Moderate competitive position with {moat_strength['score']:.1f}/100 score"
            )
        else:
            thesis_parts.append(
                f"Weak competitive position with {moat_strength['score']:.1f}/100 score"
            )

        # Industry attractiveness
        industry_attractiveness = porters_analysis.overall_industry_attractiveness
        thesis_parts.append(f"Industry attractiveness: {industry_attractiveness}")

        # Key advantages
        top_advantages = sorted(
            moat_strength["breakdown"].items(), key=lambda x: x[1], reverse=True
        )[:3]
        if top_advantages:
            advantage_text = ", ".join(
                [f"{adv[0]} ({adv[1]:.1f})" for adv in top_advantages]
            )
            thesis_parts.append(f"Key advantages: {advantage_text}")

        # Investment recommendation
        if moat_level in ["Very Strong", "Strong"] and industry_attractiveness in [
            "Highly Attractive",
            "Moderately Attractive",
        ]:
            recommendation = (
                "Strong Buy - Excellent competitive position in attractive industry"
            )
        elif moat_level in ["Strong", "Moderate"] and industry_attractiveness in [
            "Moderately Attractive",
            "Neutral",
        ]:
            recommendation = "Buy - Good competitive position with some risks"
        elif moat_level == "Moderate" and industry_attractiveness == "Unattractive":
            recommendation = "Hold - Moderate position in challenging industry"
        else:
            recommendation = (
                "Avoid - Weak competitive position or unattractive industry"
            )

        return {
            "thesis": " | ".join(thesis_parts),
            "recommendation": recommendation,
            "risk_factors": self._identify_risk_factors(
                moat_strength, porters_analysis
            ),
            "opportunities": self._identify_opportunities(
                moat_strength, sector_insights
            ),
        }

    def _identify_risk_factors(
        self, moat_strength: Dict, porters_analysis: PortersFiveForces
    ) -> List[str]:
        """Identify key risk factors"""
        risks = []

        if moat_strength["score"] < 40:
            risks.append(
                "Weak competitive moat makes company vulnerable to competition"
            )

        if porters_analysis.overall_industry_attractiveness == "Unattractive":
            risks.append(
                "Unattractive industry structure with multiple competitive threats"
            )

        if porters_analysis.competitive_rivalry["rivalry_level"] == "High":
            risks.append("Intense competitive rivalry in the market")

        if porters_analysis.threat_of_substitution["threat_level"] == "High":
            risks.append("High threat of product/service substitution")

        return risks

    def _identify_opportunities(
        self, moat_strength: Dict, sector_insights: Dict
    ) -> List[str]:
        """Identify growth opportunities"""
        opportunities = []

        if moat_strength["score"] >= 60:
            opportunities.append("Strong competitive position enables market expansion")

        if "ecosystem" in str(sector_insights).lower():
            opportunities.append(
                "Ecosystem strategy can drive customer lock-in and growth"
            )

        if "innovation" in str(sector_insights).lower():
            opportunities.append(
                "Innovation capabilities can drive new product development"
            )

        return opportunities

    # Helper methods for descriptions
    def _get_ecosystem_description(self, score: float) -> str:
        """Get ecosystem lock-in description based on score"""
        if score >= 80:
            return "Exceptional ecosystem lock-in with strong network effects and switching costs"
        elif score >= 60:
            return "Strong ecosystem integration with meaningful customer lock-in"
        elif score >= 40:
            return "Moderate ecosystem elements with some customer retention benefits"
        else:
            return "Limited ecosystem integration with minimal switching costs"

    def _get_brand_description(self, score: float) -> str:
        """Get brand power description based on score"""
        if score >= 80:
            return "Exceptional brand power with premium pricing ability and strong customer loyalty"
        elif score >= 60:
            return "Strong brand recognition with good pricing power"
        elif score >= 40:
            return "Moderate brand strength with some pricing flexibility"
        else:
            return "Limited brand power with commodity-like pricing"

    def _get_integration_description(self, score: float) -> str:
        """Get vertical integration description based on score"""
        if score >= 80:
            return "Highly integrated business model with end-to-end control"
        elif score >= 60:
            return (
                "Strong vertical integration with significant control over value chain"
            )
        elif score >= 40:
            return "Moderate integration with some vertical control"
        else:
            return "Limited vertical integration with fragmented value chain"

    def _get_supply_chain_description(self, score: float) -> str:
        """Get supply chain mastery description based on score"""
        if score >= 80:
            return (
                "Exceptional supply chain mastery with superior operational efficiency"
            )
        elif score >= 60:
            return "Strong supply chain capabilities with good operational efficiency"
        elif score >= 40:
            return "Moderate supply chain performance with adequate efficiency"
        else:
            return "Limited supply chain optimization with operational challenges"

    def _get_strategic_description(self, score: float) -> str:
        """Get strategic positioning description based on score"""
        if score >= 80:
            return "Exceptional strategic positioning with market leadership and differentiation"
        elif score >= 60:
            return "Strong strategic position with competitive advantages"
        elif score >= 40:
            return "Moderate strategic positioning with some competitive elements"
        else:
            return "Weak strategic position with limited differentiation"

    def _get_default_advantage(self, category: str) -> CompetitiveAdvantage:
        """Get default competitive advantage when analysis fails"""
        return CompetitiveAdvantage(
            category=category,
            strength_score=50.0,
            description=f"Standard {category.lower()} analysis",
            evidence=["Analysis based on available data"],
            sustainability="Medium",
            impact_on_valuation="Medium",
        )

    def _get_default_porters_analysis(self) -> PortersFiveForces:
        """Get default Porter's Five Forces analysis when analysis fails"""
        default_force = {
            "power_level": "Medium",
            "description": "Standard industry analysis",
            "evidence": "Analysis based on available data",
            "impact": "Medium",
        }

        return PortersFiveForces(
            supplier_power=default_force,
            buyer_power=default_force,
            competitive_rivalry=default_force,
            threat_of_substitution=default_force,
            threat_of_new_entrants=default_force,
            overall_industry_attractiveness="Neutral",
        )
