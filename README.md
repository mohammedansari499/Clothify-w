# Clothify – AI Wardrobe System

![Python](https://img.shields.io/badge/Python-3.10-blue)
![Flask](https://img.shields.io/badge/Flask-Backend-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![TensorFlow Lite](https://img.shields.io/badge/AI-TensorFlow%20Lite-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

AI-powered wardrobe planner that helps users organize clothing and generate outfit recommendations using image classification.

---

# Features

- User Authentication (JWT)
- Clothing Image Upload
- AI Clothing Classification
- Wardrobe Management
- Outfit Recommendation Engine
- AI Color Extraction

---

# System Architecture

```
User Uploads Image
        │
        ▼
Flask Backend API
        │
        ▼
Image Preprocessing
(OpenCV + Pillow)
        │
        ▼
TensorFlow Lite Model
        │
        ▼
Clothing Type Prediction
        │
        ▼
Color Extraction
        │
        ▼
Store Metadata in MongoDB
        │
        ▼
Outfit Recommendation Engine
```

---

# Tech Stack

## Backend

- Python
- Flask
- MongoDB
- TensorFlow Lite
- OpenCV
- NumPy
- JWT Authentication

## Frontend (Planned)

- React
- TailwindCSS

## Infrastructure

- Docker
- Cloud Storage (future)
- Stripe (future)

---

# Project Structure

```
backend
│
├ app
│  ├ routes
│  │   ├ auth_routes.py
│  │   ├ clothes_routes.py
│  │   ├ upload_routes.py
│  │   ├ classify_routes.py
│  │   └ outfit_routes.py
│  │
│  ├ services
│  │   ├ classifier_service.py
│  │   ├ image_preprocessor.py
│  │   ├ model_loader.py
│  │   └ outfit_service.py
│  │
│  ├ models
│  │   └ user_model.py
│  │
│  └ config
│      └ db.py
│
├ uploads
├ models
└ app.py
```

---

# Installation

## Clone Repository

```
git clone https://github.com/mohammedansari499/Clothify-w.git
```

---

## Navigate to Backend

```
cd WardrobeAI/backend
```

---

## Create Virtual Environment

```
python -m venv venv
```

---

## Activate Virtual Environment

Windows

```
venv\Scripts\activate
```

Linux / Mac

```
source venv/bin/activate
```

---

## Install Dependencies

```
pip install -r requirements.txt
```

---

## Run Server

```
python app.py
```

Server will start at:

```
http://127.0.0.1:5000
```

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|------|------|------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |

---

## Wardrobe

| Method | Endpoint | Description |
|------|------|------|
| POST | `/api/clothes` | Add clothing item |
| GET | `/api/clothes` | Get wardrobe |
| DELETE | `/api/clothes/<id>` | Delete clothing |

---

## Image Processing

| Method | Endpoint | Description |
|------|------|------|
| POST | `/api/upload` | Upload clothing image |
| POST | `/api/classify` | Run AI classification |

---

# AI Pipeline

```
Upload Image
      ↓
Resize Image
      ↓
Normalize Pixels
      ↓
Run TensorFlow Lite Model
      ↓
Predict Clothing Category
      ↓
Extract Dominant Colors
      ↓
Save Clothing Metadata
```

---

# Screenshots

(Add screenshots later)

```
docs/images/upload.png
docs/images/api-test.png
docs/images/classification.png
```

Example:

```
![Upload](docs/images/upload.png)
```

---

# Roadmap

Future improvements planned:

- Advanced outfit recommendation algorithm
- Google Calendar integration
- Stripe subscription system
- Mobile application
- Cloud image storage
- Personalized style suggestions

---

# Author

Mohammed Abdul Wahaj Ansari

GitHub  
https://github.com/mohammedansari499

---

# Support

If you like this project, consider giving it a star on GitHub.
