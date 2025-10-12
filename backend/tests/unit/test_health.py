"""
Simple health endpoint test.
"""


class TestHealth:
    """Simple test for health endpoint."""

    def test_health_endpoint(self, client):
        """Test health endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
