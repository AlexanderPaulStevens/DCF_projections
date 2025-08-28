import requests
from datetime import datetime
import json
from pathlib import Path
import re
import BeautifulSoup


class SP500Scraper:
    """
    A comprehensive scraper for S&P 500 companies with caching and individual company support.
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
        self.company_data_dir = Path("company_data")
        self.company_data_dir.mkdir(exist_ok=True)

        # S&P 500 companies with their CIKs
        self.sp500_companies = self._load_sp500_companies()

    def _load_sp500_companies(self):
        """
        Load S&P 500 companies with their CIKs.
        Returns a dictionary mapping ticker to CIK.
        """
        # This is a subset - you can expand this list
        return {
            "AAPL": "0000320193",
            "MSFT": "0000789019",
            "GOOGL": "0001652044",
            "AMZN": "0001018724",
            "NVDA": "0001045810",
            "META": "0001326801",
            "BRK.B": "0001067983",
            "LLY": "0000059478",
            "TSM": "0001046179",
            "UNH": "0000731766",
            "JPM": "0000019617",
            "V": "0001403161",
            "XOM": "0000034088",
            "PG": "0000080424",
            "JNJ": "0000200404",
            "HD": "0000354950",
            "MA": "0001141391",
            "CVX": "0000093410",
            "ABBV": "0001150494",
            "AVGO": "0001730168",
            "PEP": "0000077476",
            "KO": "0000021344",
            "COST": "0000909832",
            "TMO": "0000977550",
            "ACN": "0001467373",
            "DHR": "0000313543",
            "NEE": "0000753308",
            "ADBE": "0000796343",
            "CRM": "0001108524",
            "WMT": "0000104169",
            "NFLX": "0001065280",
            "DIS": "0001001039",
            "INTC": "0000050863",
            "VZ": "0000732712",
            "CMCSA": "0001166691",
            "PFE": "0000078001",
            "T": "0000732717",
            "ABT": "0000001800",
            "MRK": "0000310158",
            "QCOM": "0000804328",
            "TXN": "0000097476",
            "HON": "0000773840",
            "ORCL": "0001341439",
            "AMD": "0000002488",
            "IBM": "0000051143",
            "GE": "0000040545",
            "CAT": "0000018230",
            "BA": "0000012927",
            "GS": "0000886982",
            "AXP": "0000004962",
            "SPGI": "0000064406",
            "ISRG": "0001035267",
            "GILD": "0000882092",
            "LMT": "0000936468",
            "RTX": "0000101832",
            "BKNG": "0001075531",
            "ADI": "0000006281",
            "MDLZ": "0001103982",
            "REGN": "0000872589",
            "PANW": "0001327567",
            "KLAC": "0000319489",
            "SNPS": "0000883201",
            "CDNS": "0000813757",
            "MU": "0000723125",
            "FTNT": "0001262039",
            "CTAS": "0000723125",
            "PAYX": "0000723125",
            "MCHP": "0000827054",
            "CTSH": "0001058290",
            "ROST": "0000745735",
            "ODFL": "0000878489",
            "FAST": "0000815559",
            "BIIB": "0000875040",
            "AMGN": "0000318154",
            "WDAY": "0001326801",
            "ADP": "0000008670",
            "CSCO": "0000858877",
            "INTU": "0000896878",
            "CME": "0001156375",
            "ICE": "0001100263",
            "BLK": "0001100914",
            "SCHW": "0000316709",
            "USB": "0000036107",
            "PNC": "0000713676",
            "TFC": "0000009229",
            "COF": "0000927628",
            "AIG": "0000005272",
            "MET": "0001099219",
            "PRU": "0001137774",
            "ALL": "0000899051",
            "TRV": "0000086312",
            "PGR": "0000080661",
            "CB": "0000009061",
            "AON": "0000315293",
            "MMC": "0000062705",
            "AJG": "0000008841",
            "MCO": "0001059556",
            "FIS": "0001136899",
            "FISV": "0000798355",
            "JKHY": "0000884562",
            "FLT": "0001175454",
            "GPN": "0001123360",
            "EFX": "0000033185",
            "TSS": "0000723125",
            "BR": "0001383312",
            "RMD": "0000943587",
            "ZTS": "0001555280",
            "HCA": "0000860731",
            "DVA": "0000927066",
            "UHS": "0000352345",
            "TEN": "0000097101",
            "APD": "0000002969",
            "LIN": "0001707925",
            "APTV": "0001521332",
            "BLL": "0001109152",
            "CCK": "0000012107",
            "WRK": "0001732845",
            "IP": "0000051434",
            "PKG": "0000071655",
            "SEE": "0000101500",
            "AVY": "0000008818",
            "GLW": "0000024741",
            "FCX": "0000831259",
            "NEM": "0001164727",
            "NUE": "0000073307",
            "STLD": "0000798355",
            "X": "0000004962",
            "CLF": "0000764185",
            "ALB": "0000928453",
            "LVS": "0001300514",
            "MGM": "0000789570",
            "CZR": "0001075531",
            "WYNN": "0001174922",
            "MAR": "0001048286",
            "HLT": "0001585689",
            "AAL": "0000006201",
            "DAL": "0000027904",
            "UAL": "000100517",
            "LUV": "0000092380",
            "ALK": "0000766421",
            "JBLU": "0001158463",
            "SAVE": "0001178460",
        }

    def get_company_info(self, cik):
        """
        Get basic company information from EDGAR.

        Args:
            cik (str): Company CIK (Central Index Key)

        Returns:
            dict: Company information
        """
        # Get ticker for this CIK
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
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
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()

            # Cache the result
            cache_dir = self.company_data_dir / ticker
            cache_dir.mkdir(exist_ok=True)
            with open(cache_file, "w") as f:
                json.dump(data, f, indent=2)

            return data
        except requests.exceptions.RequestException as e:
            print(f"Error fetching company info: {e}")
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

    def get_recent_filings(self, cik, limit=10):
        """
        Get recent filings for a company.

        Args:
            cik (str): Company CIK
            limit (int): Number of recent filings to retrieve

        Returns:
            list: Recent filings
        """
        # Get ticker for this CIK
        ticker = self._get_ticker_from_cik(cik)
        if not ticker:
            return []

        # Check cache first
        cache_file = self.company_data_dir / ticker / f"recent_filings_{limit}.json"
        if cache_file.exists():
            with open(cache_file, "r") as f:
                return json.load(f)

        company_info = self.get_company_info(cik)
        if not company_info:
            return []

        filings = company_info.get("filings", {}).get("recent", {})

        # Get the most recent filings
        recent_filings = []
        for i in range(min(limit, len(filings.get("form", [])))):
            # Get description safely
            description = ""
            if filings.get("description") and i < len(filings["description"]):
                description = filings["description"][i]

            filing = {
                "form": filings["form"][i],
                "filingDate": filings["filingDate"][i],
                "accessionNumber": filings["accessionNumber"][i],
                "primaryDocument": filings["primaryDocument"][i],
                "description": description,
            }
            recent_filings.append(filing)

        # Cache the result
        cache_dir = self.company_data_dir / ticker
        cache_dir.mkdir(exist_ok=True)
        with open(cache_file, "w") as f:
            json.dump(recent_filings, f, indent=2)

        return recent_filings

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

    def analyze_company(self, ticker):
        """
        Analyze a specific company by ticker.

        Args:
            ticker (str): Company ticker symbol
        """
        if ticker not in self.sp500_companies:
            print(f"Error: {ticker} not found in S&P 500 companies list")
            return

        cik = self.sp500_companies[ticker]
        print(f"Analyzing {ticker} (CIK: {cik})...")

        # Get company information
        print(f"\n1. Fetching company information for {ticker}...")
        company_info = self.get_company_info(cik)
        if company_info:
            company_name = company_info.get("name", "Unknown")
            print(f"Company Name: {company_name}")

        # Get recent filings
        print(f"\n2. Fetching recent filings for {ticker}...")
        recent_filings = self.get_recent_filings(cik, limit=10)
        if recent_filings:
            print(f"Found {len(recent_filings)} recent filings:")
            for filing in recent_filings[:5]:  # Show first 5
                print(
                    f"  - {filing['form']} on {filing['filingDate']}: {filing['primaryDocument']}"
                )

        # Search for 10-K filings
        print(f"\n3. Searching for 10-K filings for {ticker}...")
        form_10k_filings = self.search_filings_by_form(cik, "10-K", limit=5)
        if form_10k_filings:
            print(f"Found {len(form_10k_filings)} 10-K filings:")
            for filing in form_10k_filings:
                print(f"  - {filing['filingDate']}: {filing['primaryDocument']}")

        # Get content and analyze financial data from the most recent 10-K filing
        if form_10k_filings:
            print(
                f"\n4. Analyzing financial data from most recent 10-K filing for {ticker}..."
            )
            latest_10k = form_10k_filings[0]

            content = self.get_filing_details(
                cik, latest_10k["accessionNumber"], latest_10k["primaryDocument"]
            )

            if content:
                # Save filing content in company directory
                company_dir = self.company_data_dir / ticker
                company_dir.mkdir(exist_ok=True)
                filename = f"10k_{latest_10k['filingDate']}.txt"
                file_path = company_dir / filename
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Retrieved {len(content)} characters of content")

                # Extract financial data
                print(f"\n5. Extracting financial metrics for {ticker}...")
                financial_data = self.extract_financial_data(content)
                print(f"Extracted {len(financial_data)} financial metrics")

                if financial_data:
                    # Show some key metrics
                    print(f"\nKey financial metrics found for {ticker}:")
                    for key, value in list(financial_data.items())[:10]:
                        print(f"  {key}: {value:,.0f}")

                    # Calculate EBIT and EBITDA
                    print(f"\n6. Calculating EBIT and EBITDA for {ticker}...")
                    ebit_ebitda = self.calculate_ebit_ebitda(financial_data)

                    if ebit_ebitda:
                        print(f"\nCalculated metrics for {ticker}:")
                        for metric, value in ebit_ebitda.items():
                            print(f"  {metric}: ${value:,.0f}")

                        # Save financial analysis
                        analysis_filename = (
                            f"financial_analysis_{latest_10k['filingDate']}.json"
                        )
                        self.save_financial_analysis(
                            ticker, financial_data, ebit_ebitda, analysis_filename
                        )
                    else:
                        print(
                            f"Could not calculate EBIT/EBITDA for {ticker} with available data"
                        )
                else:
                    print(f"No financial data could be extracted for {ticker}")
            else:
                print(f"Failed to retrieve filing content for {ticker}")

        print(f"\nAnalysis complete for {ticker}!")

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
