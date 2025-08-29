import matplotlib
import yfinance as yf
from tabulate import tabulate
from config.settings import Settings

# Use non-interactive backend for testing and non-GUI environments
matplotlib.use(Settings.MATPLOTLIB_BACKEND)
import matplotlib.pyplot as plt


class CompanyAnalyzer:
    """
    Comprehensive company analysis including share price visualization and overview tables.
    """

    def __init__(self, ticker):
        """
        Initialize company analyzer.

        Args:
            ticker (str): Company ticker symbol
        """
        self.ticker = ticker
        self.yf_ticker = yf.Ticker(ticker)

    def get_share_price_data(self, period="5y"):
        """
        Get share price data from Yahoo Finance.

        Args:
            period (str): Time period (1y, 2y, 5y, 10y, max)

        Returns:
            pandas.DataFrame: Share price data with dates and prices
        """
        try:
            # Get historical data
            hist = self.yf_ticker.history(period=period)

            if hist.empty:
                print(f"No share price data available for {self.ticker}")
                return None

            return hist
        except Exception as e:
            print(f"Error fetching share price data for {self.ticker}: {e}")
            return None

    def plot_share_price(self, period="5y", save_path=None):
        """
        Create and display share price chart.

        Args:
            period (str): Time period for the chart
            save_path (str): Path to save the chart image
        """
        data = self.get_share_price_data(period)
        if data is None:
            return

        # Create the plot
        plt.figure(figsize=(12, 8))

        # Plot closing prices
        plt.plot(data.index, data["Close"], linewidth=2, label="Closing Price")

        # Add volume as subplot
        ax2 = plt.twinx()
        ax2.bar(data.index, data["Volume"], alpha=0.3, color="gray", label="Volume")

        # Customize the plot
        plt.title(
            f"{self.ticker} Share Price Over Time ({period})",
            fontsize=16,
            fontweight="bold",
        )
        plt.xlabel("Date", fontsize=12)
        plt.ylabel("Share Price ($)", fontsize=12)
        ax2.set_ylabel("Volume", fontsize=12)

        # Add grid
        plt.grid(True, alpha=0.3)

        # Add legend
        lines1, labels1 = plt.gca().get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax2.legend(lines1 + lines2, labels1 + labels2, loc="upper left")

        # Rotate x-axis labels for better readability
        plt.xticks(rotation=45)

        # Adjust layout
        plt.tight_layout()

        # Save if path provided
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches="tight")
            print(f"Chart saved to {save_path}")

        # Show the plot
        plt.show()

    def get_company_overview(self):
        """
        Get comprehensive company overview information.

        Returns:
            dict: Company overview data
        """
        try:
            info = self.yf_ticker.info

            overview = {
                "Company Name": info.get("longName", "N/A"),
                "Sector": info.get("sector", "N/A"),
                "Industry": info.get("industry", "N/A"),
                "Market Cap": info.get("marketCap", "N/A"),
                "Enterprise Value": info.get("enterpriseValue", "N/A"),
                "Current Price": info.get("currentPrice", "N/A"),
                "52 Week High": info.get("fiftyTwoWeekHigh", "N/A"),
                "52 Week Low": info.get("fiftyTwoWeekLow", "N/A"),
                "P/E Ratio": info.get("trailingPE", "N/A"),
                "Forward P/E": info.get("forwardPE", "N/A"),
                "PEG Ratio": info.get("pegRatio", "N/A"),
                "Price to Book": info.get("priceToBook", "N/A"),
                "Price to Sales": info.get("priceToSalesTrailing12Months", "N/A"),
                "Dividend Yield": info.get("dividendYield", "N/A"),
                "Beta": info.get("beta", "N/A"),
                "ROE": info.get("returnOnEquity", "N/A"),
                "ROA": info.get("returnOnAssets", "N/A"),
                "Profit Margin": info.get("profitMargins", "N/A"),
                "Operating Margin": info.get("operatingMargins", "N/A"),
                "Revenue Growth": info.get("revenueGrowth", "N/A"),
                "Earnings Growth": info.get("earningsGrowth", "N/A"),
                "Employees": info.get("numberOfEmployees", "N/A"),
                "Country": info.get("country", "N/A"),
                "Website": info.get("website", "N/A"),
            }

            return overview
        except Exception as e:
            print(f"Error fetching company overview for {self.ticker}: {e}")
            return {}

    def print_company_overview_table(self):
        """
        Print company overview in a nice formatted table.
        """
        overview = self.get_company_overview()

        if not overview:
            print(f"Could not fetch overview data for {self.ticker}")
            return

        # Format the data for better display
        formatted_data = []
        for key, value in overview.items():
            if isinstance(value, (int, float)):
                if "Cap" in key or "Value" in key or "Price" in key:
                    # Format large numbers
                    if value > 1e9:
                        formatted_value = f"${value / 1e9:.2f}B"
                    elif value > 1e6:
                        formatted_value = f"${value / 1e6:.2f}M"
                    elif value > 1e3:
                        formatted_value = f"${value / 1e3:.2f}K"
                    else:
                        formatted_value = f"${value:.2f}"
                elif (
                    "Ratio" in key
                    or "Yield" in key
                    or "Growth" in key
                    or "Margin" in key
                ):
                    # Format ratios and percentages
                    if value is not None:
                        if "Yield" in key or "Growth" in key or "Margin" in key:
                            formatted_value = f"{value * 100:.2f}%" if value else "N/A"
                        else:
                            formatted_value = f"{value:.2f}"
                    else:
                        formatted_value = "N/A"
                else:
                    formatted_value = f"{value:,.0f}" if value else "N/A"
            else:
                formatted_value = str(value) if value else "N/A"

            formatted_data.append([key, formatted_value])

        # Print the table
        print(f"\n{'=' * 80}")
        print(f"COMPANY OVERVIEW: {self.ticker.upper()}")
        print(f"{'=' * 80}")
        print(tabulate(formatted_data, headers=["Metric", "Value"], tablefmt="grid"))
        print(f"{'=' * 80}")
