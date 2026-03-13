from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.classifier_service import analyze_clothing

classify = Blueprint("classify", __name__)


@classify.route("/", methods=["POST"])
@jwt_required()
def classify_image():

    data = request.json

    image_path = data.get("image_url")

    result = analyze_clothing(image_path)

    return jsonify(result)
