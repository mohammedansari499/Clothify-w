import os

import requests

DEFAULT_CITY = "Mumbai"


def get_weather(city=None):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    city = city or DEFAULT_CITY

    if api_key and api_key != "your_api_key_here":
        try:
            response = requests.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": city, "appid": api_key, "units": "metric"},
                timeout=5,
            )
            response.raise_for_status()
            data = response.json()
            condition = data["weather"][0]["main"]
            return {
                "city": city,
                "temp_c": data["main"]["temp"],
                "condition": condition,
                "description": data["weather"][0]["description"],
                "is_raining": "rain" in condition.lower(),
                "source": "OpenWeatherMap",
            }
        except Exception:
            pass

    mock_data = {
        "London": {"temp": 12, "cond": "Cloudy", "rain": False},
        "Mumbai": {"temp": 32, "cond": "Sunny", "rain": False},
        "New York": {"temp": 5, "cond": "Snow", "rain": False},
        "Dubai": {"temp": 40, "cond": "Clear", "rain": False},
    }
    city_vibe = mock_data.get(city, {"temp": 22, "cond": "Partly Cloudy", "rain": False})
    return {
        "city": city,
        "temp_c": city_vibe["temp"],
        "condition": city_vibe["cond"],
        "description": f"Mock {city_vibe['cond']} in {city}",
        "is_raining": city_vibe["rain"],
        "source": "Mock",
    }
