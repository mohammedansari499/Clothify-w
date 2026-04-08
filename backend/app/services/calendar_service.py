import os
from datetime import datetime
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build


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


def fetch_upcoming_events(credentials):
    """Fetch the next 10 events from the user's primary calendar."""
    service = build("calendar", "v3", credentials=credentials)
    
    # Call the Calendar API
    now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
    events_result = service.events().list(
        calendarId='primary', 
        timeMin=now,
        maxResults=10, 
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    bookings = []
    for event in events:
        start = event['start'].get('dateTime', event['start'].get('date'))
        bookings.append({
            "summary": event.get("summary", "No Title"),
            "start": start,
            "description": event.get("description", "")
        })
    return bookings
