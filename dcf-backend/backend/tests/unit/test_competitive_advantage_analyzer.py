#!/usr/bin/env python3
"""
Unit tests for Competitive Advantage Analyzer functionality.
"""

from unittest.mock import Mock, patch

from backend.app.core.competitive_advantage_analyzer import (
    CompetitiveAdvantage,
    CompetitiveAdvantageAnalyzer,
    PortersFiveForces,
)


class TestCompetitiveAdvantageAnalyzer:
    """Test cases for CompetitiveAdvantageAnalyzer class."""

    def test_init(self):
        """Test CompetitiveAdvantageAnalyzer initialization."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        assert analyzer.ticker == "AAPL"
        assert analyzer.financial_data == {}
        assert analyzer.yf_ticker is not None
        assert analyzer.sector_templates is not None

    def test_init_with_financial_data(self):
        """Test initialization with financial data."""
        financial_data = {"2023": {"revenue": 1000000}}
        analyzer = CompetitiveAdvantageAnalyzer("AAPL", financial_data)
        assert analyzer.ticker == "AAPL"
        assert analyzer.financial_data == financial_data

    def test_sector_templates_loaded(self):
        """Test that sector templates are properly loaded."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        # Check that major sectors are present
        assert "Technology" in analyzer.sector_templates
        assert "Healthcare" in analyzer.sector_templates
        assert "Financial Services" in analyzer.sector_templates
        assert "Consumer Discretionary" in analyzer.sector_templates

        # Check Technology template structure
        tech_template = analyzer.sector_templates["Technology"]
        assert "ecosystem_lock_in" in tech_template
        assert "brand_power" in tech_template
        assert "innovation" in tech_template

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_get_company_info(self, mock_ticker_class):
        """Test getting company information."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longName": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "marketCap": 3000000000000,
            "longBusinessSummary": "Apple designs and manufactures consumer electronics",
            "website": "https://apple.com",
            "fullTimeEmployees": 150000,
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        company_info = analyzer._get_company_info()

        assert company_info["name"] == "Apple Inc."
        assert company_info["sector"] == "Technology"
        assert company_info["industry"] == "Consumer Electronics"
        assert company_info["market_cap"] == 3000000000000

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_get_company_info_error_handling(self, mock_ticker_class):
        """Test error handling in get_company_info."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker
        mock_ticker.info = {}  # Empty info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        company_info = analyzer._get_company_info()

        assert company_info["name"] == "AAPL"
        assert company_info["sector"] == "Unknown"
        assert company_info["industry"] == "Unknown"

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_ecosystem_lock_in(self, mock_ticker_class):
        """Test ecosystem lock-in analysis."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longBusinessSummary": "Apple creates an integrated ecosystem with iPhone, iPad, Mac, and services that work seamlessly together. Our platform strategy creates switching costs and network effects."
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer._analyze_ecosystem_lock_in()

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Ecosystem Lock-In"
        assert 0 <= result.strength_score <= 100
        assert result.sustainability in ["High", "Medium", "Low"]
        assert result.impact_on_valuation in ["High", "Medium", "Low"]

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_brand_power(self, mock_ticker_class):
        """Test brand power analysis."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longBusinessSummary": "Apple is a premium brand known for quality and innovation. Our brand commands premium pricing and strong customer loyalty.",
            "profitMargins": 0.25,  # 25% profit margin
            "marketCap": 3000000000000,  # $3T market cap
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer._analyze_brand_power()

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Brand Power"
        assert 0 <= result.strength_score <= 100
        assert len(result.evidence) > 0

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_vertical_integration(self, mock_ticker_class):
        """Test vertical integration analysis."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longBusinessSummary": "Apple designs both hardware and software, manufactures devices, and operates retail stores. We control the entire value chain from design to distribution."
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer._analyze_vertical_integration()

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Vertical Integration"
        assert 0 <= result.strength_score <= 100

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_supply_chain_mastery(self, mock_ticker_class):
        """Test supply chain mastery analysis."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longBusinessSummary": "Apple has exceptional supply chain management with global scale and operational efficiency.",
            "grossMargins": 0.38,  # 38% gross margin
            "totalRevenue": 394328000000,  # $394B revenue
            "fullTimeEmployees": 150000,
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer._analyze_supply_chain_mastery()

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Supply Chain Mastery"
        assert 0 <= result.strength_score <= 100

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_strategic_positioning(self, mock_ticker_class):
        """Test strategic positioning analysis."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longBusinessSummary": "Apple is the leading innovator in consumer electronics with unique design and differentiated products.",
            "marketCap": 3000000000000,  # $3T market cap
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer._analyze_strategic_positioning()

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Strategic Positioning"
        assert 0 <= result.strength_score <= 100

    def test_analyze_porters_five_forces(self):
        """Test Porter's Five Forces analysis."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        # Mock the individual force analysis methods
        with (
            patch.object(analyzer, "_analyze_supplier_power") as mock_supplier,
            patch.object(analyzer, "_analyze_buyer_power") as mock_buyer,
            patch.object(analyzer, "_analyze_competitive_rivalry") as mock_rivalry,
            patch.object(
                analyzer, "_analyze_threat_of_substitution"
            ) as mock_substitution,
            patch.object(analyzer, "_analyze_threat_of_new_entrants") as mock_entrants,
            patch.object(
                analyzer, "_calculate_industry_attractiveness"
            ) as mock_attractiveness,
        ):
            mock_supplier.return_value = {"power_level": "Low", "description": "Test"}
            mock_buyer.return_value = {"power_level": "Medium", "description": "Test"}
            mock_rivalry.return_value = {"rivalry_level": "Low", "description": "Test"}
            mock_substitution.return_value = {
                "threat_level": "Medium",
                "description": "Test",
            }
            mock_entrants.return_value = {"threat_level": "Low", "description": "Test"}
            mock_attractiveness.return_value = "Highly Attractive"

            result = analyzer._analyze_porters_five_forces()

            assert isinstance(result, PortersFiveForces)
            assert result.overall_industry_attractiveness == "Highly Attractive"

    def test_calculate_overall_moat_strength(self):
        """Test overall moat strength calculation."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        # Create mock advantages
        advantages = [
            CompetitiveAdvantage(
                "Ecosystem Lock-In", 80.0, "Strong", [], "High", "High"
            ),
            CompetitiveAdvantage("Brand Power", 75.0, "Strong", [], "High", "High"),
            CompetitiveAdvantage(
                "Vertical Integration", 70.0, "Good", [], "Medium", "Medium"
            ),
            CompetitiveAdvantage(
                "Supply Chain Mastery", 65.0, "Good", [], "Medium", "Medium"
            ),
            CompetitiveAdvantage(
                "Strategic Positioning", 60.0, "Good", [], "Medium", "Medium"
            ),
        ]

        result = analyzer._calculate_overall_moat_strength(advantages)

        assert "score" in result
        assert "level" in result
        assert "description" in result
        assert "breakdown" in result
        assert 0 <= result["score"] <= 100
        assert result["level"] in [
            "Very Strong",
            "Strong",
            "Moderate",
            "Weak",
            "Very Weak",
        ]

    def test_calculate_overall_moat_strength_empty(self):
        """Test overall moat strength calculation with empty advantages."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        result = analyzer._calculate_overall_moat_strength([])

        assert result["score"] == 0
        assert result["level"] == "None"
        assert "No competitive advantages identified" in result["description"]

    def test_generate_sector_insights_technology(self):
        """Test sector insights generation for Technology sector."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        result = analyzer._generate_sector_insights("Technology")

        assert result["sector"] == "Technology"
        assert "key_advantages" in result
        assert "insights" in result
        assert "recommendations" in result
        assert len(result["key_advantages"]) > 0

    def test_generate_sector_insights_unknown_sector(self):
        """Test sector insights generation for unknown sector."""
        analyzer = CompetitiveAdvantageAnalyzer("UNKNOWN")

        result = analyzer._generate_sector_insights("Unknown Sector")

        assert result["sector"] == "Unknown Sector"
        assert "key_advantages" in result
        assert "insights" in result
        assert "recommendations" in result

    def test_generate_investment_thesis(self):
        """Test investment thesis generation."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        moat_strength = {
            "score": 75.0,
            "level": "Strong",
            "breakdown": {"Ecosystem Lock-In": 80.0, "Brand Power": 75.0},
        }

        sector_insights = {
            "sector": "Technology",
            "key_advantages": ["ecosystem_lock_in", "brand_power"],
        }

        porters_analysis = PortersFiveForces(
            supplier_power={"power_level": "Low"},
            buyer_power={"power_level": "Medium"},
            competitive_rivalry={"rivalry_level": "Low"},
            threat_of_substitution={"threat_level": "Medium"},
            threat_of_new_entrants={"threat_level": "Low"},
            overall_industry_attractiveness="Highly Attractive",
        )

        result = analyzer._generate_investment_thesis(
            moat_strength, sector_insights, porters_analysis
        )

        assert "thesis" in result
        assert "recommendation" in result
        assert "risk_factors" in result
        assert "opportunities" in result
        assert isinstance(result["risk_factors"], list)
        assert isinstance(result["opportunities"], list)

    def test_identify_risk_factors(self):
        """Test risk factor identification."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        moat_strength = {"score": 30.0}  # Weak moat

        porters_analysis = PortersFiveForces(
            supplier_power={"power_level": "High"},
            buyer_power={"power_level": "High"},
            competitive_rivalry={"rivalry_level": "High"},
            threat_of_substitution={"threat_level": "High"},
            threat_of_new_entrants={"threat_level": "High"},
            overall_industry_attractiveness="Unattractive",
        )

        risks = analyzer._identify_risk_factors(moat_strength, porters_analysis)

        assert isinstance(risks, list)
        assert len(risks) > 0

    def test_identify_opportunities(self):
        """Test opportunity identification."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        moat_strength = {"score": 75.0}  # Strong moat

        sector_insights = {
            "sector": "Technology",
            "key_advantages": ["ecosystem", "innovation"],
        }

        opportunities = analyzer._identify_opportunities(moat_strength, sector_insights)

        assert isinstance(opportunities, list)

    def test_get_default_advantage(self):
        """Test default competitive advantage creation."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        result = analyzer._get_default_advantage("Test Category")

        assert isinstance(result, CompetitiveAdvantage)
        assert result.category == "Test Category"
        assert result.strength_score == 50.0
        assert result.sustainability == "Medium"
        assert result.impact_on_valuation == "Medium"

    def test_get_default_porters_analysis(self):
        """Test default Porter's Five Forces analysis."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        result = analyzer._get_default_porters_analysis()

        assert isinstance(result, PortersFiveForces)
        assert result.overall_industry_attractiveness == "Neutral"

    @patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
    def test_analyze_competitive_advantage_integration(self, mock_ticker_class):
        """Test full competitive advantage analysis integration."""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        mock_info = {
            "longName": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "marketCap": 3000000000000,
            "longBusinessSummary": "Apple creates integrated ecosystem with premium brand and vertical integration.",
            "profitMargins": 0.25,
            "grossMargins": 0.38,
            "totalRevenue": 394328000000,
            "fullTimeEmployees": 150000,
        }
        mock_ticker.info = mock_info

        analyzer = CompetitiveAdvantageAnalyzer("AAPL")
        result = analyzer.analyze_competitive_advantage()

        assert "ticker" in result
        assert "company_info" in result
        assert "competitive_advantages" in result
        assert "porters_five_forces" in result
        assert "sector_insights" in result
        assert "overall_moat_strength" in result
        assert "investment_thesis" in result
        assert "analysis_date" in result

        assert result["ticker"] == "AAPL"
        assert result["company_info"]["name"] == "Apple Inc."
        assert result["company_info"]["sector"] == "Technology"

    def test_analyze_competitive_advantage_error_handling(self):
        """Test error handling in competitive advantage analysis."""
        analyzer = CompetitiveAdvantageAnalyzer("INVALID")

        # Mock the _get_company_info method to raise an exception
        with patch.object(
            analyzer, "_get_company_info", side_effect=Exception("Test error")
        ):
            result = analyzer.analyze_competitive_advantage()

            assert "error" in result
            assert "Test error" in result["error"]

    def test_description_methods(self):
        """Test description generation methods."""
        analyzer = CompetitiveAdvantageAnalyzer("AAPL")

        # Test ecosystem description
        desc = analyzer._get_ecosystem_description(85.0)
        assert "Exceptional" in desc

        desc = analyzer._get_ecosystem_description(45.0)
        assert "Moderate" in desc

        # Test brand description
        desc = analyzer._get_brand_description(90.0)
        assert "Exceptional" in desc

        # Test integration description
        desc = analyzer._get_integration_description(75.0)
        assert "Strong" in desc

        # Test supply chain description
        desc = analyzer._get_supply_chain_description(60.0)
        assert "Strong" in desc

        # Test strategic description
        desc = analyzer._get_strategic_description(50.0)
        assert "Moderate" in desc


# Test functions for pytest discovery
def test_competitive_advantage_analyzer_creation():
    """Test creating a CompetitiveAdvantageAnalyzer instance."""
    analyzer = CompetitiveAdvantageAnalyzer("AAPL")
    assert isinstance(analyzer, CompetitiveAdvantageAnalyzer)


def test_competitive_advantage_analyzer_attributes():
    """Test CompetitiveAdvantageAnalyzer has expected attributes."""
    analyzer = CompetitiveAdvantageAnalyzer("AAPL")
    assert hasattr(analyzer, "ticker")
    assert hasattr(analyzer, "financial_data")
    assert hasattr(analyzer, "yf_ticker")
    assert hasattr(analyzer, "sector_templates")


@patch("backend.app.core.competitive_advantage_analyzer.yf.Ticker")
def test_competitive_advantage_analyzer_integration(mock_ticker_class):
    """Test CompetitiveAdvantageAnalyzer integration workflow."""
    mock_ticker = Mock()
    mock_ticker_class.return_value = mock_ticker

    mock_info = {
        "longName": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "marketCap": 3000000000000,
        "longBusinessSummary": "Apple creates integrated ecosystem with premium brand.",
        "profitMargins": 0.25,
        "grossMargins": 0.38,
        "totalRevenue": 394328000000,
        "fullTimeEmployees": 150000,
    }
    mock_ticker.info = mock_info

    analyzer = CompetitiveAdvantageAnalyzer("AAPL")

    # Test full workflow
    result = analyzer.analyze_competitive_advantage()

    assert result is not None
    assert "ticker" in result
    assert result["ticker"] == "AAPL"
    assert "competitive_advantages" in result
    assert "overall_moat_strength" in result
