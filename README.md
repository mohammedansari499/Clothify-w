# **Clothify AI Wardrobe System**


AI-powered wardrobe planner that helps users organize clothing and generate outfit recommendations using image classification.

---

## Features

- User Authentication (JWT)
- Clothing Image Upload
- AI Clothing Classification
- Wardrobe Management
- Outfit Recommendation Engine

---

## Tech Stack

Backend
- Python
- Flask
- MongoDB
- TensorFlow Lite
- OpenCV

Frontend
- React (planned)

Infrastructure
- Docker
- Cloud Storage (planned)

---

## Project Structure

backend
│
├ app
│ ├ routes
│ ├ services
│ ├ models
│ └ config
│
├ uploads
├ models
└ app.py


---

## Installation

### Clone Repository


git clone https://github.com/mohammedansari499/Clothify-w.git


### Navigate to Backend


cd WardrobeAI/backend


### Create Virtual Environment


python -m venv venv


### Activate Environment

Windows


venv\Scripts\activate


### Install Dependencies


pip install -r requirements.txt


### Run Server


python app.py


Server runs at:


http://127.0.0.1:5000


---

## API Endpoints

### Authentication

POST `/api/auth/register`

POST `/api/auth/login`

GET `/api/auth/profile`

---

### Wardrobe

POST `/api/clothes`

GET `/api/clothes`

DELETE `/api/clothes/<id>`

---

### Image Processing

POST `/api/upload`

POST `/api/classify`

---

## AI Pipeline


Upload Image
↓
Preprocess Image
↓
Run TensorFlow Lite Model
↓
Extract Colors
↓
Predict Clothing Type
↓
Store Metadata


---

## Future Improvements

- Outfit recommendation algorithm
- Google Calendar integration
- Stripe subscription system
- Mobile app

---

## Author

Mohammed Abdul Wahaj Ansari

GitHub:
https://github.com/mohammedansari499

