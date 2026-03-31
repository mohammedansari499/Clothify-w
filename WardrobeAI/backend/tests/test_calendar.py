"""
Unit tests for Google Calendar integration.
Tests: create_oauth_flow, /connect endpoint.
Matches actual code in app/services/calendar_service.py
and app/routes/calendar_routes.py.
"""
import pytest
from unittest.mock import patch, MagicMock
import os


@pytest.mark.unit
class TestCreateOAuthFlow:
    """create_oauth_flow() — builds Google OAuth2 Flow object."""

    @patch("app.services.calendar_service.Flow")
    def test_creates_flow_with_correct_scopes(self, mock_flow_class):
        """OAuth flow is created with calendar.readonly scope."""
        mock_flow_instance = MagicMock()
        mock_flow_class.from_client_config.return_value = mock_flow_instance

        from app.services.calendar_service import create_oauth_flow
        flow = create_oauth_flow()

        mock_flow_class.from_client_config.assert_called_once()
        call_args = mock_flow_class.from_client_config.call_args
        scopes = call_args[1].get("scopes") or call_args[0][1]
        assert "https://www.googleapis.com/auth/calendar.readonly" in scopes

    @patch("app.services.calendar_service.Flow")
    def test_uses_env_credentials(self, mock_flow_class):
        """OAuth flow uses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from env."""
        mock_flow_instance = MagicMock()
        mock_flow_class.from_client_config.return_value = mock_flow_instance

        os.environ["GOOGLE_CLIENT_ID"] = "test-id-123"
        os.environ["GOOGLE_CLIENT_SECRET"] = "test-secret-456"

        from app.services.calendar_service import create_oauth_flow
        flow = create_oauth_flow()

        call_args = mock_flow_class.from_client_config.call_args
        config = call_args[0][0]  # First positional arg
        assert config["web"]["client_id"] == "test-id-123"
        assert config["web"]["client_secret"] == "test-secret-456"

    @patch("app.services.calendar_service.Flow")
    def test_sets_redirect_uri(self, mock_flow_class):
        """OAuth flow sets redirect URI from env."""
        mock_flow_instance = MagicMock()
        mock_flow_class.from_client_config.return_value = mock_flow_instance

        os.environ["GOOGLE_REDIRECT_URI"] = "http://localhost:5000/callback"

        from app.services.calendar_service import create_oauth_flow
        flow = create_oauth_flow()

        assert mock_flow_instance.redirect_uri == "http://localhost:5000/callback"


@pytest.mark.unit
class TestCalendarConnectEndpoint:
    """GET /api/calendar/connect — initiates Google OAuth."""

    @patch("app.routes.calendar_routes.create_oauth_flow")
    def test_connect_redirects(self, mock_create_flow, client):
        """Connect endpoint redirects to Google auth URL."""
        mock_flow = MagicMock()
        mock_flow.authorization_url.return_value = (
            "https://accounts.google.com/o/oauth2/auth?client_id=test",
            "random_state"
        )
        mock_create_flow.return_value = mock_flow

        resp = client.get("/api/calendar/connect",
                          follow_redirects=False)
        assert resp.status_code in (302, 308)

    @patch("app.routes.calendar_routes.create_oauth_flow")
    def test_connect_redirect_location(self, mock_create_flow, client):
        """Redirect location points to Google accounts."""
        mock_flow = MagicMock()
        mock_flow.authorization_url.return_value = (
            "https://accounts.google.com/o/oauth2/auth?client_id=test",
            "random_state"
        )
        mock_create_flow.return_value = mock_flow

        resp = client.get("/api/calendar/connect",
                          follow_redirects=False)
        location = resp.headers.get("Location", "")
        assert "accounts.google.com" in location

    @patch("app.routes.calendar_routes.create_oauth_flow")
    def test_connect_calls_authorization_url(self, mock_create_flow, client):
        """Connect endpoint calls flow.authorization_url()."""
        mock_flow = MagicMock()
        mock_flow.authorization_url.return_value = (
            "https://accounts.google.com/o/oauth2/auth", "state"
        )
        mock_create_flow.return_value = mock_flow

        client.get("/api/calendar/connect", follow_redirects=False)
        mock_flow.authorization_url.assert_called_once()
