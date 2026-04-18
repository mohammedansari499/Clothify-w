# 🧠 Clothify AI — Intelligent Digital Wardrobe System

<p align="center">
  <strong>The Future of Wardrobe Intelligence. Engineered with AI, Computer Vision & Neural UI.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-blue?style=for-the-badge&logo=python"/>
  <img src="https://img.shields.io/badge/Flask-Backend-black?style=for-the-badge&logo=flask"/>
  <img src="https://img.shields.io/badge/PyTorch-AI-ee4c2c?style=for-the-badge&logo=pytorch"/>
  <img src="https://img.shields.io/badge/React-Frontend-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

---

## 🌌 Overview

Clothify is a **full-stack AI-powered wardrobe intelligence system** that transforms your physical clothing into a **smart, digital wardrobe ecosystem**.

It combines:

* 🧠 **Computer Vision (MobileNetV2)**
* 🧩 **Semantic Understanding (OpenAI CLIP)**
* 🎨 **Advanced Color Science (CIELAB + KMeans)**
* ⚡ **Neural UI / UX Design**

Clothify bridges the gap between **real-world fashion** and **intelligent digital systems**, enabling automated classification, styling, and outfit planning.

---

## 🌟 Key Features

### 🧠 Intelligent Wardrobe Cataloging

* AI Classification using **MobileNetV2**
* Semantic refinement using **OpenAI CLIP**
* Zero-shot clothing understanding
* Smart category mapping (Casual, Formal, Traditional)
* Automated tagging system

### 🎨 Advanced Color Extraction

* Converts RGB → **CIELAB color space**
* Uses **KMeans clustering**
* Filters noise (background, whites, edges)
* Extracts dominant clothing color accurately

### 👗 Smart Outfit Generation

* AI-powered outfit planning engine
* Context-aware outfit combinations
* Color harmony-based matching
* Style modes:

  * Casual
  * Formal
  * Traditional
* Smart shuffling algorithm

### 📅 Planner & Calendar System

* Weekly outfit planning
* Save outfits
* Google Calendar export
* Schedule-aware styling

### 🎨 Neural UI / UX System (Advanced Layer)

* Custom Cursor Engine
* Neural Animated Background
* Glassmorphism + Cyberpunk Design
* Smooth Page Transitions (Framer Motion)
* Micro-interactions

> This is not a basic CRUD UI — it is a **designed interaction system**

---

### 📂 Digital Wardrobe System

* Upload clothing images
* Store in MongoDB
* Visual wardrobe grid
* Delete/manage items
* Custom collections:

  * Vacation
  * Office
  * Gym

---

### 🔐 Authentication System

* JWT Authentication
* Google OAuth (integration-ready)
* Secure API routing

---

## 🏗️ System Architecture

```text
User
 │
 ▼
Frontend Dashboard (React + Vite + Tailwind)
 │
 ▼
Flask Backend REST API
 │
 ├── Authentication Service (JWT)
 ├── Wardrobe Storage & Planning
 ├── Upload Handling & Routing
 ├── Outfit Planner Engine
 └── Google Calendar OAuth Integration
 │
 ▼
Local AI Classification Engine (PyTorch CPU)
 │
 ├── Image Preprocessing & Crop Handling
 ├── MobileNetV2 Model + Internal Mapping
 ├── CLIP Semantic Refinement
 └── KMeans + CIELAB Color Extraction
 │
 ▼
MongoDB (NoSQL Document Store)
```

---

## 🤖 AI Pipeline Deep Dive

```text
User Uploads Image
        ↓
Image Cleaning & Resize
        ↓
MobileNetV2 Classification
        ↓
CLIP Semantic Understanding
        ↓
Dictionary Mapping (semantic categories)
        ↓
KMeans Clustering
        ↓
CIELAB Color Mapping
        ↓
Store Results in MongoDB
        ↓
Used in Outfit Planning Engine
```

---

## 🛠 Tech Stack

### Frontend

* React 19 (Vite)
* Tailwind CSS
* Framer Motion
* Lucide Icons / React Icons
* Neural UI Components

### Backend

* Flask (Python 3.10+)
* MongoDB
* Flask-JWT-Extended
* Flask-CORS

### AI / ML

* PyTorch
* Torchvision
* Transformers (CLIP)
* MobileNetV2
* KMeans Clustering
* CIELAB Color Space

---

## 📁 Project Structure

```text
Clothify-w
│
├ backend (Python / Flask)
│  ├ app
│  │  ├ ai
│  │  ├ config
│  │  ├ models
│  │  ├ routes
│  │  └ services
│  ├ tests
│  ├ uploads
│  ├ app.py
│  ├ requirements.txt
│  └ .env.example
│
├ frontend (React / Vite)
│  ├ src
│  │  ├ assets
│  │  ├ components
│  │  ├ context
│  │  ├ pages
│  │  ├ App.jsx
│  │  └ main.jsx
│  ├ public
│  ├ package.json
│  └ tailwind.config.js
│
├ how_to_start_it_whole.md
└ README.md
```

---

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/mohammedansari499/Clothify-w.git
cd "Clothify w"
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET_KEY=your_secure_key_32_chars_min
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
WEATHER_API_KEY=your_weather_api_key
HF_TOKEN=your_huggingface_token
```

Run:

```bash
python app.py
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Endpoints

### Authentication

* POST /api/auth/register
* POST /api/auth/login
* GET /api/auth/profile

### Wardrobe

* GET /api/clothes
* POST /api/clothes
* DELETE /api/clothes/:id

### AI & Outfits

* POST /api/classify
* GET /api/outfits/plan
* POST /api/outfits/plan/save

### Integration

* GET /api/calendar/connect

---

## ⚡ Performance Notes

* First run downloads model weights (cached after)
* Use HuggingFace token for faster inference
* Load models once globally (important)

---

## 🛠 Implementation Status

* [x] Backend Core
* [x] AI Pipeline
* [x] Frontend UI
* [x] Outfit Planner
* [x] Calendar Integration
* [ ] Mobile App
* [ ] AI Stylist

---

## 🗺️ Roadmap

* AI Stylist Assistant (LLM)
* React Native Mobile App
* Cloud Deployment (CI/CD)
* Recommendation Engine

---

## 📸 Screenshots

| Dashboard                                | Wardrobe                                 | Planner                                  |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| ![](https://via.placeholder.com/300x200) | ![](https://via.placeholder.com/300x200) | ![](https://via.placeholder.com/300x200) |

---

## 👨‍💻 Author

**Mohammed Abdul Wahaj Ansari**
GitHub: https://github.com/mohammedansari499

---

## 📜 License

MIT License

---

## 🤝 Contributing

Contributions are welcome for:

* AI improvements
* UI/UX enhancements
* Performance optimization
* Feature expansion
