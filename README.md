# Clothify – AI Wardrobe System

![Python](https://img.shields.io/badge/Python-3.10-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![TensorFlow Lite](https://img.shields.io/badge/AI-TensorFlow%20Lite-orange)
![React](https://img.shields.io/badge/Frontend-React-blue)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Clothify is an AI-powered wardrobe management system that allows users to organize clothing items, automatically classify garments using computer vision, and generate outfit recommendations.

The system combines **Flask APIs, machine learning models, and modern frontend technologies** to build a scalable wardrobe assistant.

---

# Key Features

- User authentication using JWT
- Clothing image upload
- AI-powered clothing classification
- Automatic color extraction
- Wardrobe management system
- Outfit recommendation engine
- REST API architecture

---

# System Architecture

```
User
 │
 ▼
Frontend (React)
 │
 ▼
Flask Backend API
 │
 ├── Authentication Service
 ├── Wardrobe Management
 ├── Image Upload
 └── AI Classification Requests
 │
 ▼
AI Service
 │
 ├── Image Preprocessing
 ├── TensorFlow Lite Model
 └── Color Extraction
 │
 ▼
MongoDB Database
```

---

# Project Structure

```
Clothify-w
│
├ WardrobeAI
│
│  ├ backend
│  │
│  │  ├ app
│  │  │
│  │  │   ├ routes
│  │  │   │   ├ auth_routes.py
│  │  │   │   ├ clothes_routes.py
│  │  │   │   ├ upload_routes.py
│  │  │   │   ├ classify_routes.py
│  │  │   │   └ outfit_routes.py
│  │  │   │
│  │  │   ├ services
│  │  │   │   ├ classifier_service.py
│  │  │   │   ├ image_preprocessor.py
│  │  │   │   ├ model_loader.py
│  │  │   │   └ outfit_service.py
│  │  │   │
│  │  │   ├ models
│  │  │   │   └ user_model.py
│  │  │   │
│  │  │   ├ config
│  │  │   │   └ db.py
│  │  │   │
│  │  │   └ utils
│  │  │
│  │  ├ uploads
│  │  ├ models
│  │  ├ tests
│  │  └ app.py
│  │
│  ├ frontend
│  │
│  │  ├ src
│  │  │   ├ components
│  │  │   ├ pages
│  │  │   ├ services
│  │  │   ├ hooks
│  │  │   └ App.jsx
│  │  │
│  │  ├ public
│  │  └ package.json
│  │
│  ├ ai-service
│  │
│  │  ├ models
│  │  │   └ clothing_classifier.tflite
│  │  │
│  │  ├ preprocessing
│  │  ├ inference
│  │  └ api
│  │
│  ├ infrastructure
│  │
│  │  ├ docker
│  │  │   ├ Dockerfile.backend
│  │  │   └ Dockerfile.ai
│  │  │
│  │  └ docker-compose.yml
│  │
│  ├ docs
│  │
│  │  ├ architecture
│  │  ├ api
│  │  └ images
│  │
│  └ README.md
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
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/profile | Get profile |

---

## Wardrobe

| Method | Endpoint | Description |
|------|------|------|
| POST | /api/clothes | Add clothing item |
| GET | /api/clothes | Get wardrobe |
| DELETE | /api/clothes/<id> | Delete clothing |

---

## Image Processing

| Method | Endpoint | Description |
|------|------|------|
| POST | /api/upload | Upload clothing image |
| POST | /api/classify | Classify clothing |

---

# AI Pipeline

```
Upload Image
      ↓
Resize Image
      ↓
Normalize Pixels
      ↓
TensorFlow Lite Model
      ↓
Clothing Category Prediction
      ↓
Dominant Color Extraction
      ↓
Save Metadata in Database
```

---

# Implementation Roadmap

## Phase 1 – Backend Core (Completed)

- Flask API
- JWT authentication
- MongoDB integration
- Wardrobe CRUD operations
- Image upload system

---

## Phase 2 – AI Integration (Completed)

- TensorFlow Lite model loader
- Image preprocessing
- Clothing classification
- Color extraction

---

## Phase 3 – Frontend (Planned)

The React frontend will include:

- User authentication UI
- Wardrobe dashboard
- Clothing upload interface
- Outfit planner interface

---

## Phase 4 – AI Service (Planned)

The AI service will be separated from the backend to allow scalable inference.

Planned modules:

- model serving API
- GPU inference support
- model versioning
- asynchronous prediction queue

---

## Phase 5 – Infrastructure (Planned)

- Docker containerization
- Docker Compose orchestration
- CI/CD pipeline
- cloud deployment

---

## Phase 6 – Advanced Features (Planned)

- Outfit recommendation algorithm
- Google Calendar integration
- Stripe subscription system
- mobile application

---

# Screenshots

Screenshots will be added in the `docs/images` folder.

Example:

```
docs/images/upload.png
docs/images/classification.png
```

---

# Author

Mohammed Abdul Wahaj Ansari

GitHub  
https://github.com/mohammedansari499

---

# License

This project is licensed under the MIT License.
