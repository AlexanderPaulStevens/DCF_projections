import requests
from datetime import datetime
import json
from pathlib import Path
import re
from bs4 import BeautifulSoup


class SP500Scraper:
    """
    A comprehensive scraper for S&P 500 companies.

    This class is used exclusively by the company_data scraping scripts.
    All other parts of the system work with cached data only.
    """

    def __init__(
        self,
        user_agent="Alexander Stevens, Personal usage, alexanderstevens97@gmail.com",
    ):
        """
        Initialize the S&P 500 scraper.

        Args:
            user_agent (str): User agent string for SEC compliance
        """
        self.base_url = "https://data.sec.gov"
        self.headers = {"User-Agent": user_agent}
        self.session = requests.Session()
        self.session.headers.update(self.headers)

        # Create company data directory
        # Try to find the company_data directory relative to current working directory
        current_dir = Path.cwd()
        if current_dir.name == "company_data":
            # We're already in the company_data directory
            self.company_data_dir = current_dir
        else:
            # Look for company_data in the current directory or parent
            self.company_data_dir = current_dir / "company_data"
            if not self.company_data_dir.exists():
                self.company_data_dir = current_dir.parent / "company_data"

        self.company_data_dir.mkdir(exist_ok=True)

        # S&P 500 companies with their CIKs
        self.sp500_companies = self._load_sp500_companies()

    def _load_sp500_companies(self):
        """
        Load S&P 500 companies with their CIKs from the scraped JSON file.
        Returns a dictionary mapping ticker to CIK.
        """
        # Get the project root directory by looking for the company_data folder
        # Start from current working directory and work our way up
        current_dir = Path.cwd()
        project_root = None

        # Look for company_data directory in current or parent directories
        search_dirs = [current_dir, current_dir.parent, current_dir.parent.parent]

        for search_dir in search_dirs:
            potential_company_data = search_dir / "company_data"
            if potential_company_data.exists():
                project_root = search_dir
                break

        if project_root is None:
            print(
                "❌ Could not find company_data directory. Please ensure you're running from the project root."
            )
            return {}

        # Look for the companies file in the company_data directory
        companies_file = project_root / "company_data" / "sp500_companies.json"

        if companies_file.exists():
            try:
                with open(companies_file, "r") as f:
                    companies = json.load(f)
                print(f"✅ Loaded {len(companies)} companies from {companies_file}")
                return companies
            except Exception as e:
                print(f"❌ Error loading companies from {companies_file}: {e}")
                print(
                    "   Please run 'make scrape-wikipedia' to get the current S&P 500 companies list."
                )
                return {}

        print(f"❌ Companies file not found at {companies_file}")
        print(
            "   Please run 'make scrape-wikipedia' first to get the current S&P 500 companies list."
        )
        return {}

    def get_company_info(self, cik):
        """
        Get basic company information from EDGAR.

        Args:
            cik (str): Company CIK (Central Index Key)

        Returns:
            dict: Company information or None if not accessible
        """
        # Get ticker for this CIK
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
            print(f"Warning: No ticker found for CIK {cik}")
            return None

        # Check cache first
        cache_file = self.company_data_dir / ticker / "company_info.json"
        if cache_file.exists():
            with open(cache_file, "r") as f:
                return json.load(f)

        # Pad CIK to 10 digits with leading zeros
        padded_cik = cik.zfill(10)
        url = f"{self.base_url}/submissions/CIK{padded_cik}.json"

        try:
            print(f"Fetching company info for {ticker} (CIK: {padded_cik})...")
            response = self.session.get(url)

            if response.status_code == 404:
                print(
                    f"Warning: Company {ticker} (CIK: {padded_cik}) not accessible via SEC API"
                )
                print("This could be due to:")
                print("  - Company delisted or merged")
                print("  - CIK number changed")
                print("  - Company no longer in S&P 500")
                return None
            elif response.status_code != 200:
                print(
                    f"Error fetching company info for {ticker}: HTTP {response.status_code}"
                )
                return None

            data = response.json()

            # Cache the result
            cache_dir = self.company_data_dir / ticker
            cache_dir.mkdir(exist_ok=True)
            with open(cache_file, "w") as f:
                json.dump(data, f, indent=2)

            print(f"✓ Successfully fetched company info for {ticker}")
            return data

        except requests.exceptions.RequestException as e:
            print(f"Error fetching company info for {ticker}: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response for {ticker}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error for {ticker}: {e}")
            return None

    def _get_ticker_from_cik(self, cik):
        """
        Get ticker symbol from CIK.

        Args:
            cik (str): Company CIK

        Returns:
            str: Company ticker symbol or None if not found
        """
        for ticker, company_cik in self.sp500_companies.items():
            if company_cik == cik:
                return ticker
        return None

    def get_filing_details(self, cik, accession_number, primary_document):
        """
        Get the content of a specific filing document.

        Args:
            cik (str): Company CIK
            accession_number (str): Filing accession number
            primary_document (str): Primary document filename

        Returns:
            str: Document content or None if error
        """
        # Get ticker for this CIK
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
            return None

        # Check cache first
        cache_file = (
            self.company_data_dir
            / ticker
            / f"filing_content_{accession_number.replace('-', '')}_{primary_document.replace('/', '_')}.txt"
        )
        if cache_file.exists():
            with open(cache_file, "r", encoding="utf-8") as f:
                return f.read()

        padded_cik = cik.zfill(10)
        # Remove dashes from accession number
        clean_accession = accession_number.replace("-", "")

        # Try multiple URL formats for SEC EDGAR
        urls_to_try = [
            f"{self.base_url}/Archives/edgar/data/{padded_cik}/{clean_accession}/{primary_document}",
            f"https://www.sec.gov/Archives/edgar/data/{padded_cik}/{clean_accession}/{primary_document}",
            f"https://www.sec.gov/Archives/edgar/data/{padded_cik}/{clean_accession}/{primary_document}",
        ]

        for url in urls_to_try:
            try:
                print(f"Trying URL: {url}")
                response = self.session.get(url)
                if response.status_code == 200:
                    content = response.text

                    # Cache the result
                    cache_dir = self.company_data_dir / ticker
                    cache_dir.mkdir(exist_ok=True)
                    with open(cache_file, "w", encoding="utf-8") as f:
                        f.write(content)

                    return content
                else:
                    print(f"URL returned status {response.status_code}: {url}")
            except requests.exceptions.RequestException as e:
                print(f"Error with URL {url}: {e}")
                continue

        print("All URL attempts failed")
        return None

    def search_filings_by_form(self, cik, form_type, limit=10):
        """
        Search for specific types of filings (e.g., 10-K, 10-Q).

        Args:
            cik (str): Company CIK
            form_type (str): Form type to search for (e.g., "10-K", "10-Q")
            limit (int): Maximum number of results

        Returns:
            list: Matching filings
        """
        # Get ticker for this CIK
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
            return []

        # Check cache first
        cache_file = (
            self.company_data_dir / ticker / f"form_filings_{form_type}_{limit}.json"
        )
        if cache_file.exists():
            with open(cache_file, "r") as f:
                return json.load(f)

        company_info = self.get_company_info(cik)
        if not company_info:
            return []

        filings = company_info.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])

        matching_filings = []
        for i, form in enumerate(forms):
            if form == form_type and len(matching_filings) < limit:
                # Get description safely
                description = ""
                if filings.get("description") and i < len(filings["description"]):
                    description = filings["description"][i]

                filing = {
                    "form": form,
                    "filingDate": filings["filingDate"][i],
                    "accessionNumber": filings["accessionNumber"][i],
                    "primaryDocument": filings["primaryDocument"][i],
                    "description": description,
                }
                matching_filings.append(filing)

        # Cache the result
        cache_dir = self.company_data_dir / ticker
        cache_dir.mkdir(exist_ok=True)
        with open(cache_file, "w") as f:
            json.dump(matching_filings, f, indent=2)

        return matching_filings

    def get_historical_financial_data(self, cik, years_back=3):
        """
        Get historical financial data for multiple years.

        Args:
            cik (str): Company CIK
            years_back (int): Number of years to fetch

        Returns:
            dict: Financial data by year
        """
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
            return {}

        # Get all 10-K filings
        form_10k_filings = self.search_filings_by_form(
            cik, "10-K", limit=years_back + 2
        )

        historical_data = {}

        for filing in form_10k_filings[:years_back]:
            filing_date = filing["filingDate"]
            year = int(filing_date.split("-")[0])

            print(f"Fetching {year} financial data for {ticker}...")

            # Get filing content
            content = self.get_filing_details(
                cik, filing["accessionNumber"], filing["primaryDocument"]
            )

            if content:
                # Extract financial data
                financial_data = self.extract_financial_data(content)

                if financial_data:
                    # Calculate EBIT and EBITDA
                    ebit_ebitda = self.calculate_ebit_ebitda(financial_data)

                    # Combine all metrics
                    combined_data = {**financial_data, **ebit_ebitda}
                    historical_data[year] = combined_data

                    print(f"✓ {year} data extracted: {len(combined_data)} metrics")
                else:
                    print(f"✗ No financial data extracted for {year}")
            else:
                print(f"✗ Failed to retrieve {year} filing content")

        return historical_data

    def extract_financial_data(self, filing_content):
        """
        Extract financial data from filing content.

        Args:
            filing_content (str): HTML content of the filing

        Returns:
            dict: Extracted financial data
        """
        if not filing_content:
            return {}

        soup = BeautifulSoup(filing_content, "html.parser")
        financial_data = {}

        # Look for common financial statement sections
        sections = [
            "CONSOLIDATED STATEMENTS OF OPERATIONS",
            "CONSOLIDATED STATEMENTS OF INCOME",
            "INCOME STATEMENT",
            "STATEMENT OF OPERATIONS",
            "CONSOLIDATED STATEMENTS OF CASH FLOWS",
            "CASH FLOW STATEMENT",
        ]

        for section in sections:
            # Find section headers
            headers = soup.find_all(string=re.compile(section, re.IGNORECASE))
            for header in headers:
                # Look for tables or data near this header
                parent = header.parent
                if parent:
                    # Find next table or structured data
                    table = parent.find_next("table")
                    if table:
                        # Extract data from table
                        rows = table.find_all("tr")
                        for row in rows:
                            cells = row.find_all(["td", "th"])
                            if len(cells) >= 2:
                                label = cells[0].get_text(strip=True)
                                value = cells[1].get_text(strip=True)

                                # Clean and parse the value
                                if value and value != "":
                                    # Remove common formatting
                                    clean_value = re.sub(r"[^\d.-]", "", value)
                                    if clean_value:
                                        try:
                                            # Convert to float, handling negative numbers
                                            if clean_value.startswith(
                                                "("
                                            ) and clean_value.endswith(")"):
                                                clean_value = clean_value[1:-1]
                                                num_value = -float(clean_value)
                                            else:
                                                num_value = float(clean_value)
                                            financial_data[label] = num_value
                                        except ValueError:
                                            pass

        return financial_data

    def calculate_ebit_ebitda(self, financial_data):
        """
        Calculate EBIT and EBITDA from financial data.

        Args:
            financial_data (dict): Dictionary of financial metrics

        Returns:
            dict: Calculated EBIT and EBITDA
        """
        results = {}

        # Method 1: Use Operating Income + Other Income/Expense (Most Accurate)
        operating_income = None
        other_income_expense = None

        for key in financial_data:
            if "operating income" in key.lower() or "operating earnings" in key.lower():
                operating_income = financial_data[key]
            elif (
                "other income" in key.lower() or "other income/(expense)" in key.lower()
            ):
                other_income_expense = financial_data[key]

        if operating_income is not None:
            # EBIT = Operating Income + Other Income/Expense
            ebit = operating_income
            if other_income_expense is not None:
                ebit += other_income_expense

            results["EBIT (Operating Income + Other Income/Expense)"] = ebit

            # Find Depreciation and Amortization
            depreciation = None
            for key in financial_data:
                if "depreciation" in key.lower() or "amortization" in key.lower():
                    depreciation = financial_data[key]
                    break

            # EBITDA = EBIT + Depreciation + Amortization
            if depreciation is not None:
                results["EBITDA (from EBIT)"] = ebit + depreciation
            else:
                results["EBITDA (from EBIT)"] = ebit

        # Method 2: Alternative calculation using Net Income + Interest + Tax
        net_income = None
        interest_expense = None
        income_tax = None

        for key in financial_data:
            if "net income" in key.lower() or "net earnings" in key.lower():
                net_income = financial_data[key]
            elif "interest expense" in key.lower() or "interest" in key.lower():
                interest_expense = financial_data[key]
            elif (
                "income tax" in key.lower()
                or "provision for income taxes" in key.lower()
            ):
                income_tax = financial_data[key]

        if net_income is not None:
            ebit_alt = net_income
            if interest_expense is not None:
                ebit_alt += interest_expense
            if income_tax is not None:
                ebit_alt += income_tax

            results["EBIT (Net Income + Interest + Tax)"] = ebit_alt

            # Find Depreciation and Amortization
            depreciation = None
            for key in financial_data:
                if "depreciation" in key.lower() or "amortization" in key.lower():
                    depreciation = financial_data[key]
                    break

            # EBITDA = EBIT + Depreciation + Amortization
            if depreciation is not None:
                results["EBITDA (from Net Income method)"] = ebit_alt + depreciation
            else:
                results["EBITDA (from Net Income method)"] = ebit_alt

        # Method 3: Direct Operating Income + D&A (Most Common)
        if operating_income is not None:
            results["Operating Income"] = operating_income

            depreciation = None
            for key in financial_data:
                if "depreciation" in key.lower() or "amortization" in key.lower():
                    depreciation = financial_data[key]
                    break

            if depreciation is not None:
                results["EBITDA (Operating Income + D&A)"] = (
                    operating_income + depreciation
                )

        return results

    def save_financial_analysis(self, ticker, financial_data, ebit_ebitda, filename):
        """
        Save financial analysis results to a JSON file in the company's data folder.

        Args:
            ticker (str): Company ticker symbol
            financial_data (dict): Raw financial data
            ebit_ebitda (dict): Calculated EBIT/EBITDA
            filename (str): Output filename
        """
        # Ensure company directory exists
        company_dir = self.company_data_dir / ticker
        company_dir.mkdir(exist_ok=True)

        # Save in company directory
        file_path = company_dir / filename

        output_data = {
            "timestamp": datetime.now().isoformat(),
            "financial_metrics": financial_data,
            "calculated_metrics": ebit_ebitda,
            "analysis_notes": {
                "ebit_calculation": "EBIT = Net Income + Interest Expense + Income Tax Expense",
                "ebitda_calculation": "EBITDA = EBIT + Depreciation + Amortization",
                "data_source": "SEC EDGAR filings",
            },
        }

        with open(file_path, "w") as f:
            json.dump(output_data, f, indent=2)
        print(f"Financial analysis saved to {file_path}")
