from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, current_app, jsonify, redirect, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from googleapiclient.discovery import build
from itsdangerous import BadSignature, BadTimeSignature, URLSafeTimedSerializer

import app.config.db as db
from app.services.calendar_service import create_oauth_flow

calendar = Blueprint("calendar", __name__)

STATE_MAX_AGE_SECONDS = 900


def _state_serializer():
    secret = (
        current_app.config.get("SECRET_KEY")
        or current_app.config.get("JWT_SECRET_KEY")
        or "dev-calendar-state-secret"
    )
    return URLSafeTimedSerializer(secret_key=secret, salt="calendar-oauth-state")


def _encode_state(user_id):
    return _state_serializer().dumps({"user_id": user_id})


def _decode_state(state):
    return _state_serializer().loads(state, max_age=STATE_MAX_AGE_SECONDS)


@calendar.route("/connect", methods=["GET"])
def connect_calendar():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None

    if not user_id:
        user_id = request.args.get("user_id")
    if not user_id:
        user_id = "anonymous"

    flow = create_oauth_flow()
    state = _encode_state(user_id)

    authorization_url, _ = flow.authorization_url(
        state=state,
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    return redirect(authorization_url)


@calendar.route("/callback", methods=["GET"])
def oauth2callback():
    state = request.args.get("state")
    if not state:
        return jsonify({"error": "Missing OAuth state"}), 400

    try:
        parsed = _decode_state(state)
        user_id = parsed.get("user_id")
        object_id = ObjectId(user_id)
    except (BadSignature, BadTimeSignature, InvalidId, TypeError, ValueError):
        return jsonify({"error": "Invalid or expired OAuth state"}), 400

    flow = create_oauth_flow()
    try:
        flow.fetch_token(authorization_response=request.url)
    except Exception:
        return jsonify({"error": "Failed to fetch Google OAuth token"}), 400

    credentials = flow.credentials
    update_res = db.users_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "google_credentials": {
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "scopes": credentials.scopes,
                    "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                }
            }
        },
    )
    if update_res.matched_count == 0:
        return jsonify({"error": "User not found for OAuth state"}), 404

    try:
        service = build("calendar", "v3", credentials=credentials)
        now = datetime.utcnow()
        event = {
            "summary": "Clothify Connected",
            "description": "Google Calendar integration is active.",
            "start": {"dateTime": now.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": (now + timedelta(minutes=30)).isoformat(), "timeZone": "UTC"},
        }
        service.events().insert(calendarId="primary", body=event).execute()
    except Exception:
        # Calendar write failures should not prevent storing credentials.
        pass

    frontend_url = current_app.config.get("FRONTEND_URL", "")
    if frontend_url:
        return (
            f'Calendar connected. Return to <a href="{frontend_url}/planner">{frontend_url}/planner</a>.',
            200,
        )
    return "Calendar connected successfully.", 200
