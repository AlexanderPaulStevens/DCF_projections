"""
Cloud Storage Service for reading company data from Google Cloud Storage.
Uses REST API directly to avoid hanging issues with the Python client library.
"""

import fnmatch
import logging
import os
import shutil
import subprocess  # nosec B404
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class CloudStorageService:
    """Service for reading company data from Google Cloud Storage using REST API."""

    def __init__(self):
        """Initialize the Cloud Storage service."""
        self.bucket_name = os.getenv(
            "CLOUD_STORAGE_BUCKET", "horizon-gcloud-eu-company-data"
        )
        self.project_id = os.getenv("GCP_PROJECT_ID", "horizon-gcloud-eu")
        self.base_url = (
            f"https://storage.googleapis.com/storage/v1/b/{self.bucket_name}"
        )
        self.download_url = f"https://storage.googleapis.com/{self.bucket_name}"
        self._access_token = None
        self._token_expires = None
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy initialization of Cloud Storage service."""
        if self._initialized:
            return

        # Check if we're running on Cloud Run (K_SERVICE) or App Engine (GAE_ENV)
        if os.getenv("K_SERVICE") is not None:
            logger.info("Running on Cloud Run - Cloud Storage REST API available")
        elif os.getenv("GAE_ENV") is not None:
            logger.info("Running on App Engine - Cloud Storage REST API available")
        else:
            logger.info("Running locally - Cloud Storage REST API available")

        self._initialized = True

    def _get_access_token(self) -> str:
        """Get access token for App Engine service account."""
        if (
            self._access_token
            and self._token_expires
            and datetime.now() < self._token_expires
        ):
            return self._access_token

        try:
            # Get access token from App Engine metadata service
            metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
            headers = {"Metadata-Flavor": "Google"}

            logger.info("Attempting to get access token from metadata service...")
            response = requests.get(
                metadata_url, headers=headers, timeout=5
            )  # Reduced timeout
            response.raise_for_status()

            token_data = response.json()
            self._access_token = token_data["access_token"]
            # Set expiration time (subtract 5 minutes for safety)
            expires_in = token_data.get("expires_in", 3600) - 300
            self._token_expires = datetime.now() + timedelta(seconds=expires_in)

            logger.info("Successfully obtained access token for Cloud Storage")
            return self._access_token

        except requests.exceptions.Timeout:
            logger.error("Timeout getting access token from metadata service")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error getting access token: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to get access token: {e}")
            raise

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Cloud Storage API requests."""
        # Check if we're running on Cloud Run (K_SERVICE) or App Engine (GAE_ENV)
        if os.getenv("K_SERVICE") is not None or os.getenv("GAE_ENV") is not None:
            # Use access token from metadata service (Cloud Run or App Engine)
            token = self._get_access_token()
            return {"Authorization": f"Bearer {token}"}
        else:
            # For local development, get access token from gcloud
            try:
                # Validate gcloud executable path for security
                gcloud_path = shutil.which("gcloud")
                if not gcloud_path:
                    logger.error("gcloud executable not found in PATH")
                    return {}

                # Use absolute path to prevent path injection
                result = subprocess.run(  # nosec B603
                    [gcloud_path, "auth", "application-default", "print-access-token"],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    check=False,  # Don't raise exception on non-zero exit
                )
                if result.returncode == 0:
                    token = result.stdout.strip()
                    return {"Authorization": f"Bearer {token}"}
                else:
                    logger.error(f"Failed to get local access token: {result.stderr}")
                    return {}
            except subprocess.TimeoutExpired:
                logger.error("Timeout getting local access token from gcloud")
                return {}
            except Exception as e:
                logger.error(f"Error getting local access token: {e}")
                return {}

    def is_available(self) -> bool:
        """Check if Cloud Storage service is available."""
        self._ensure_initialized()

        # Check if we're running on Cloud Run or App Engine
        if os.getenv("K_SERVICE") is not None or os.getenv("GAE_ENV") is not None:
            logger.info(
                f"Running on Cloud Run/App Engine - checking access token: {self._access_token is not None}"
            )
            if self._access_token is None:
                logger.warning("No access token available - attempting to get one")
                try:
                    self._get_access_token()
                    logger.info("Successfully obtained access token")
                    return True
                except Exception as e:
                    logger.error(f"Failed to get access token: {e}")
                    return False
            return True
        else:
            # For local development, assume available
            logger.info("Running locally - Cloud Storage assumed available")
            return True

    def _get_blob_path(self, ticker: str, filename: str) -> str:
        """Get the blob path for a company file."""
        return f"{ticker}/{filename}"

    def read_json_file(self, ticker: str, filename: str) -> Optional[Dict[str, Any]]:
        """
        Read a JSON file from Cloud Storage using REST API.

        Args:
            ticker: Company ticker symbol
            filename: Name of the file to read

        Returns:
            JSON data as dictionary, or None if not found
        """
        self._ensure_initialized()

        if not self.is_available():
            logger.warning("Cloud Storage service not available")
            return None

        try:
            blob_path = self._get_blob_path(ticker, filename)
            url = f"{self.download_url}/{blob_path}"
            headers = self._get_headers()

            logger.debug(f"Reading file from: {url}")
            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 404:
                logger.debug(f"File not found: {blob_path}")
                return None
            elif response.status_code == 200:
                return response.json()
            else:
                logger.error(
                    f"Error reading file {blob_path}: HTTP {response.status_code}"
                )
                return None

        except Exception as e:
            logger.error(f"Error reading JSON file {blob_path}: {e}")
            return None

    def list_files(self, ticker: str, pattern: str = "*") -> List[str]:
        """
        List files for a company matching a pattern using REST API.

        Args:
            ticker: Company ticker symbol
            pattern: File pattern to match (e.g., "financial_analysis_*.json")

        Returns:
            List of filenames
        """
        self._ensure_initialized()

        if not self.is_available():
            logger.warning("Cloud Storage service not available")
            return []

        try:
            # Use the Cloud Storage REST API to list objects
            url = f"{self.base_url}/o"
            params = {"prefix": f"{ticker}/", "delimiter": "/"}
            headers = self._get_headers()

            logger.debug(f"Listing files for {ticker} with pattern {pattern}")
            response = requests.get(url, params=params, headers=headers, timeout=30)

            if response.status_code != 200:
                logger.error(
                    f"Error listing files for {ticker}: HTTP {response.status_code}"
                )
                return []

            data = response.json()
            files = []

            # Extract filenames from the response
            for item in data.get("items", []):
                name = item.get("name", "")
                if name.startswith(f"{ticker}/"):
                    filename = name.split("/", 1)[1]  # Remove ticker prefix
                    if fnmatch.fnmatch(filename, pattern):
                        files.append(filename)

            logger.debug(f"Found {len(files)} files matching pattern {pattern}")
            return files

        except Exception as e:
            logger.error(f"Error listing files for {ticker}: {e}")
            return []

    def get_latest_file(self, ticker: str, pattern: str) -> Optional[str]:
        """
        Get the most recently modified file for a company matching a pattern.

        Args:
            ticker: Company ticker symbol
            pattern: File pattern to match

        Returns:
            Name of the latest file, or None if no files match
        """
        self._ensure_initialized()

        if not self.is_available():
            logger.warning("Cloud Storage service not available")
            return None

        try:
            files = self.list_files(ticker, pattern)
            if not files:
                return None

            # For simplicity, assuming file names with timestamps are sortable
            # A more robust solution would fetch blob.time_updated from the API
            files.sort(reverse=True)
            return files[0]

        except Exception as e:
            logger.error(
                f"Error getting latest file for {ticker} with pattern {pattern}: {e}"
            )
            return None

    def read_file_content(self, ticker: str, filename: str) -> Optional[str]:
        """
        Read a file from Cloud Storage as text content.

        Args:
            ticker: Company ticker symbol
            filename: Name of the file to read

        Returns:
            File content as string, or None if not found
        """
        self._ensure_initialized()

        if not self.is_available():
            logger.warning("Cloud Storage service not available")
            return None

        try:
            blob_path = self._get_blob_path(ticker, filename)
            url = f"{self.download_url}/{blob_path}"
            headers = self._get_headers()

            logger.debug(f"Reading file content from: {url}")
            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 404:
                logger.debug(f"File not found: {blob_path}")
                return None
            elif response.status_code == 200:
                return response.text
            else:
                logger.error(
                    f"Error reading file {blob_path}: HTTP {response.status_code}"
                )
                return None

        except Exception as e:
            logger.error(f"Error reading file content {blob_path}: {e}")
            return None

    def upload_file_content(
        self,
        ticker: str,
        filename: str,
        content: str,
        content_type: str = "application/json",
    ) -> bool:
        """
        Upload file content to Cloud Storage using Google Cloud Storage client library.

        Args:
            ticker: Company ticker symbol
            filename: Name of the file to upload
            content: File content as string
            content_type: MIME type of the content

        Returns:
            True if successful, False otherwise
        """
        self._ensure_initialized()

        if not self.is_available():
            logger.warning("Cloud Storage service not available")
            return False

        try:
            # Use Google Cloud Storage client library
            from google.cloud import storage

            # Create client
            client = storage.Client(project=self.project_id)
            bucket = client.bucket(self.bucket_name)

            # Create blob path
            blob_path = self._get_blob_path(ticker, filename)
            blob = bucket.blob(blob_path)

            # Upload content
            blob.upload_from_string(content, content_type=content_type)

            logger.info(f"Successfully uploaded file: {blob_path}")
            return True

        except ImportError:
            logger.error("Google Cloud Storage client library not available")
            return False
        except Exception as e:
            logger.error(f"Error uploading file content {blob_path}: {e}")
            return False


# Create a singleton instance
cloud_storage_service = CloudStorageService()
