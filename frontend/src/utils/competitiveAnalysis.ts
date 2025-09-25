import { ComprehensiveAnalysis } from '../services/api';

export interface CompetitiveAdvantageContent {
  title: string;
  introduction: string;
  advantages: Array<{
    title: string;
    points: string[];
  }>;
  competitorAnalysis: {
    title: string;
    points: string[];
  };
  summary: string;
}

export function generateCompetitiveAdvantageContent(
  ticker: string,
  data: ComprehensiveAnalysis | null
): CompetitiveAdvantageContent {
  const companyName = data?.company_name || ticker;
  const moatLevel = data?.competitive?.moat_level || 'Unknown';
  const topAdvantage = data?.competitive?.top_advantage || 'Unknown';
  const moatScore = data?.competitive?.overall_moat_score || 0;

  // Company-specific content templates
  const companyTemplates: { [key: string]: Partial<CompetitiveAdvantageContent> } = {
    AAPL: {
      title: "Apple's Competitive Advantage",
      introduction: "When you ask about Apple's competitive advantage, you're really asking why, despite fierce competition and the fact that the hardware and software they sell are often more expensive than alternatives, Apple consistently manages to dominate key market segments (smartphones, tablets, wearables, laptops) and sustain premium margins. The answer isn't one single factor but a layered strategy where each component reinforces the others.",
      advantages: [
        {
          title: "1. Ecosystem Lock-In (\"Walled Garden\")",
          points: [
            "Apple's biggest advantage is its integrated ecosystem: iPhone, iPad, Mac, Apple Watch, AirPods, Apple TV, and services (iCloud, iMessage, Apple Music, App Store, Apple Pay).",
            "Once a consumer owns one Apple product, the marginal utility of buying another increases dramatically (AirPods connect instantly to iPhone/Mac, Apple Watch extends iPhone, AirDrop simplifies sharing).",
            "This creates switching costs: it's psychologically and practically hard for users to leave the ecosystem, even if alternatives are cheaper or technically superior."
          ]
        },
        {
          title: "2. Brand Power & Customer Loyalty",
          points: [
            "Apple isn't just a tech company—it's a lifestyle brand with extraordinary cultural capital.",
            "Their marketing emphasizes simplicity, creativity, and premium quality. Owning an iPhone isn't just about specs—it's about identity and status.",
            "Brand loyalty translates into repeat purchases, willingness to pay premium prices, and strong word-of-mouth."
          ]
        },
        {
          title: "3. Vertical Integration & Control",
          points: [
            "Apple designs both hardware and software, allowing for deep optimization (e.g., iOS runs more smoothly on iPhones than Android on comparable devices, despite fewer raw specs).",
            "They control the App Store and distribution channels, capturing significant revenue streams.",
            "This integration allows them to differentiate on user experience, not just specs or price."
          ]
        },
        {
          title: "4. Design & User Experience",
          points: [
            "Apple has a relentless focus on simplicity, aesthetics, and intuitive usability.",
            "Competitors may match or exceed them on raw hardware performance, but Apple's holistic design philosophy (minimalist hardware, intuitive software, consistent interface across devices) gives them a psychological edge with consumers."
          ]
        },
        {
          title: "5. Supply Chain Mastery",
          points: [
            "Apple is exceptionally good at managing its supply chain: securing favorable deals with suppliers, pre-buying critical components (like flash memory or OLED displays), and leveraging its scale.",
            "This enables them to launch at massive scale while maintaining high margins."
          ]
        },
        {
          title: "6. Services as a Growth Engine",
          points: [
            "Increasingly, Apple's revenue growth comes not from hardware alone but from services (App Store commissions, iCloud, Apple Music, AppleCare, Fitness+, etc.).",
            "Services provide recurring, high-margin revenue and deepen ecosystem lock-in."
          ]
        },
        {
          title: "7. Strategic Patience",
          points: [
            "Apple rarely tries to be first. Instead, they enter categories late (MP3 players, smartphones, tablets, smartwatches, AR/VR with Vision Pro) but execute better, with design, usability, and ecosystem integration that rivals can't match.",
            "This \"fast follower with perfection\" strategy minimizes risk and maximizes impact."
          ]
        }
      ],
      competitorAnalysis: {
        title: "Why Competitors Struggle to Match",
        points: [
          "Fragmentation: Android manufacturers can't match Apple's tight integration (too many device makers, software fragmentation).",
          "Margins: Competitors often compete on price, eroding profitability, while Apple sustains premium pricing.",
          "Switching Costs: Moving from iPhone to Android means losing iMessage, AirDrop, seamless AirPods pairing, Apple Watch integration—many consumers won't tolerate that."
        ]
      },
      summary: "Apple's success comes from a reinforcing loop of ecosystem lock-in, brand power, design excellence, and vertical integration. Competitors can copy one element (a phone, a service, a wearable), but not the entire interconnected system. That systemic advantage makes it uniquely resilient."
    },
    GOOGL: {
      title: "Google's Competitive Advantage",
      introduction: "Google's dominance in search and digital advertising stems from its data moat, network effects, and continuous innovation. The company has built an ecosystem of interconnected services that reinforce each other, creating significant barriers to entry for competitors.",
      advantages: [
        {
          title: "1. Search Dominance & Data Moat",
          points: [
            "Google processes over 8.5 billion searches daily, giving it unparalleled insights into user behavior and intent.",
            "This massive data advantage improves search quality, creating a virtuous cycle that's nearly impossible for competitors to replicate.",
            "The company's algorithms become more accurate with each search, strengthening its moat over time."
          ]
        },
        {
          title: "2. Network Effects in Advertising",
          points: [
            "Google's advertising platform benefits from powerful network effects: more advertisers attract more users, and more users attract more advertisers.",
            "The company's auction-based system ensures optimal pricing and placement, creating value for both sides of the marketplace.",
            "Advertisers have access to precise targeting capabilities that are unmatched by competitors."
          ]
        },
        {
          title: "3. Ecosystem Integration",
          points: [
            "Google's services (Search, YouTube, Maps, Gmail, Android) create a comprehensive ecosystem that keeps users engaged.",
            "Cross-service data sharing improves the user experience across all platforms.",
            "The Android operating system provides Google with a massive distribution channel for its services."
          ]
        },
        {
          title: "4. Innovation & R&D Investment",
          points: [
            "Google invests heavily in R&D, exploring cutting-edge technologies like AI, quantum computing, and autonomous vehicles.",
            "The company's \"20% time\" policy encourages innovation and has led to breakthrough products like Gmail and Google News.",
            "Continuous innovation keeps Google ahead of competitors and opens new revenue streams."
          ]
        }
      ],
      competitorAnalysis: {
        title: "Competitive Challenges",
        points: [
          "Regulatory Pressure: Increasing scrutiny from governments worldwide threatens Google's business model.",
          "Privacy Concerns: Growing awareness of data privacy could impact Google's advertising effectiveness.",
          "Competition: Microsoft's Bing and other search engines continue to chip away at Google's dominance."
        ]
      },
      summary: "Google's competitive advantage lies in its data moat, network effects, and ecosystem integration. While regulatory and privacy challenges exist, the company's innovation and scale provide significant barriers to competition."
    },
    MSFT: {
      title: "Microsoft's Competitive Advantage",
      introduction: "Microsoft has successfully transformed from a traditional software company into a cloud-first, AI-powered enterprise leader. The company's competitive advantages stem from its enterprise relationships, cloud infrastructure, and integrated productivity suite.",
      advantages: [
        {
          title: "1. Enterprise Relationships & Switching Costs",
          points: [
            "Microsoft has deep relationships with enterprise customers built over decades of providing business software.",
            "The company's integrated suite (Office 365, Teams, Azure) creates high switching costs for businesses.",
            "Enterprise customers value Microsoft's security, compliance, and support capabilities."
          ]
        },
        {
          title: "2. Cloud Infrastructure Leadership",
          points: [
            "Azure is the second-largest cloud provider globally, with strong growth in enterprise adoption.",
            "Microsoft's hybrid cloud approach appeals to enterprises with existing on-premises infrastructure.",
            "The company's focus on enterprise security and compliance differentiates it from competitors."
          ]
        },
        {
          title: "3. Productivity Suite Integration",
          points: [
            "Office 365's integration with Teams, SharePoint, and other Microsoft services creates a comprehensive productivity platform.",
            "The suite's familiarity and compatibility with existing workflows reduce training costs for enterprises.",
            "Microsoft's investment in AI (Copilot) enhances productivity and creates new value propositions."
          ]
        },
        {
          title: "4. Developer Ecosystem",
          points: [
            "Microsoft's developer tools (Visual Studio, GitHub) create a strong developer ecosystem.",
            "The company's open-source initiatives and cross-platform support attract developers.",
            "Azure's integration with Microsoft's development tools creates a seamless development experience."
          ]
        }
      ],
      competitorAnalysis: {
        title: "Competitive Landscape",
        points: [
          "Cloud Competition: AWS and Google Cloud provide strong competition in the cloud infrastructure market.",
          "Productivity Tools: Google Workspace and other productivity suites compete with Office 365.",
          "AI Race: Microsoft faces competition from Google, OpenAI, and other AI companies in the AI space."
        ]
      },
      summary: "Microsoft's competitive advantage lies in its enterprise relationships, cloud infrastructure, and integrated productivity suite. The company's focus on enterprise needs and AI integration positions it well for future growth."
    }
  };

  // Get company-specific template or use generic template
  const template = companyTemplates[ticker.toUpperCase()] || generateGenericContent(ticker, data);

  return {
    title: template.title || `${companyName}'s Competitive Advantage`,
    introduction: template.introduction || generateGenericIntroduction(companyName, moatLevel, moatScore),
    advantages: template.advantages || generateGenericAdvantages(topAdvantage, moatScore),
    competitorAnalysis: template.competitorAnalysis || generateGenericCompetitorAnalysis(companyName),
    summary: template.summary || generateGenericSummary(companyName, moatLevel)
  };
}

function generateGenericContent(ticker: string, data: ComprehensiveAnalysis | null): Partial<CompetitiveAdvantageContent> {
  const companyName = data?.company_name || ticker;
  const moatLevel = data?.competitive?.moat_level || 'Unknown';
  const topAdvantage = data?.competitive?.top_advantage || 'Unknown';
  const moatScore = data?.competitive?.overall_moat_score || 0;

  return {
    title: `${companyName}'s Competitive Advantage`,
    introduction: generateGenericIntroduction(companyName, moatLevel, moatScore),
    advantages: generateGenericAdvantages(topAdvantage, moatScore),
    competitorAnalysis: generateGenericCompetitorAnalysis(companyName),
    summary: generateGenericSummary(companyName, moatLevel)
  };
}

function generateGenericIntroduction(companyName: string, moatLevel: string, moatScore: number): string {
  if (moatLevel === 'Unknown' || moatScore === 0) {
    return `Understanding ${companyName}'s competitive advantage requires analyzing the company's business model, market position, and strategic assets. While detailed competitive analysis is still being developed, we can examine the key factors that typically drive competitive advantage in the company's industry.`;
  }

  const strengthDescription = moatScore > 70 ? 'strong' : moatScore > 40 ? 'moderate' : 'developing';

  return `${companyName} demonstrates a ${strengthDescription} competitive position with a ${moatLevel.toLowerCase()} moat. The company's competitive advantage stems from several key factors that create barriers to entry and sustainable profitability. Understanding these advantages is crucial for evaluating the company's long-term investment potential.`;
}

function generateGenericAdvantages(topAdvantage: string, moatScore: number): Array<{ title: string; points: string[] }> {
  const advantages = [];

  if (topAdvantage !== 'Unknown') {
    advantages.push({
      title: `1. ${topAdvantage}`,
      points: [
        `${topAdvantage} represents a key competitive advantage that differentiates the company from its competitors.`,
        "This advantage creates barriers to entry and helps maintain market position.",
        "The company's focus on this area has contributed to its competitive strength."
      ]
    });
  }

  // Add generic advantages based on moat score
  if (moatScore > 50) {
    advantages.push({
      title: "2. Market Position & Scale",
      points: [
        "The company's market position provides economies of scale and operational efficiency.",
        "Established market presence creates barriers to entry for new competitors.",
        "Scale advantages allow for better pricing power and resource allocation."
      ]
    });

    advantages.push({
      title: "3. Strategic Assets",
      points: [
        "The company possesses valuable strategic assets that are difficult to replicate.",
        "These assets may include intellectual property, brand recognition, or unique capabilities.",
        "Strategic assets provide sustainable competitive advantages over time."
      ]
    });
  }

  if (advantages.length === 0) {
    advantages.push({
      title: "1. Business Model Analysis",
      points: [
        "The company's business model and market position are key factors in its competitive advantage.",
        "Understanding the company's revenue streams and cost structure is important for analysis.",
        "Further analysis is needed to identify specific competitive advantages."
      ]
    });
  }

  return advantages;
}

function generateGenericCompetitorAnalysis(companyName: string): { title: string; points: string[] } {
  return {
    title: "Competitive Landscape",
    points: [
      `${companyName} operates in a competitive market with various players vying for market share.`,
      "Understanding the competitive dynamics is crucial for evaluating the company's position.",
      "Further analysis of competitors and market trends would provide deeper insights into the competitive landscape."
    ]
  };
}

function generateGenericSummary(companyName: string, moatLevel: string): string {
  if (moatLevel === 'Unknown') {
    return `${companyName}'s competitive advantage analysis is still being developed. The company's long-term success will depend on its ability to create and maintain sustainable competitive advantages in its market. Further analysis of the company's business model, market position, and strategic assets would provide more detailed insights.`;
  }

  return `${companyName} demonstrates a ${moatLevel.toLowerCase()} competitive moat, indicating ${moatLevel === 'Strong' ? 'significant' : moatLevel === 'Moderate' ? 'moderate' : 'developing'} competitive advantages. The company's success depends on maintaining and strengthening these advantages while adapting to changing market conditions.`;
}
