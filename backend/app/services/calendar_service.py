import os
from google_auth_oauthlib.flow import Flow


def create_oauth_flow():

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar.readonly"]
    )

    flow.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    return flow
