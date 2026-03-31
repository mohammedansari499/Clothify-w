from flask import Blueprint, redirect
from app.services.calendar_service import create_oauth_flow

calendar = Blueprint("calendar", __name__)


@calendar.route("/connect", methods=["GET"])
def connect_calendar():

    flow = create_oauth_flow()

    authorization_url, state = flow.authorization_url()

    return redirect(authorization_url)
