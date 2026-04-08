from flask import Blueprint, jsonify, request

from app.services.weather_service import get_weather

weather_bp = Blueprint("weather", __name__)


@weather_bp.route("/", methods=["GET"])
def fetch_weather():
    city = request.args.get("city")
    data = get_weather(city)
    return jsonify(data), 200
