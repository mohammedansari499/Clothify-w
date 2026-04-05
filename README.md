# Clothify – AI Wardrobe System

![Python](https://img.shields.io/badge/Python-3.10-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![PyTorch](https://img.shields.io/badge/AI-PyTorch-ee4c2c)
![React](https://img.shields.io/badge/Frontend-React-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Clothify is a full-stack, AI-powered wardrobe intelligence application that allows users to organize clothing items, automatically classify garments using internal computer vision models, extract true clothing colors, and generate smart outfit plans manually or randomly.

The system seamlessly combines **Flask REST APIs, PyTorch Machine Learning Models (MobileNetV2), Advanced KMeans Coloring (CIELAB Space), and modern React frontend interfaces**.

---

# Key Features

- **User Authentication:** Secure JWT-based Login & Registration.
- **AI-Powered Image Classification:** Local PyTorch logic (MobileNetV2) instantly classifies clothing with no external API dependency.
- **Accurate Color Extraction:** Translates RGB image pixels into CIELAB space and parses true dominant clothing color via KMeans Clustering.
- **Digital Wardrobe:** Visually view, add, or delete your clothes. 
- **Outfit Planner Engine:** Automatically generate stylish outfit combinations from your digitized wardrobe.
- **Outfit Saving & Calendar Integration:** Save your favorite planned outfits and export them via Google Calendar API.
- **Full Stack React SPA:** Blazing fast React app compiled using Vite with modern Tailwind CSS styling.

---

# System Architecture

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
 └── External Integrations (Google Calendar OAuth)
 │
 ▼
Local AI Classification Engine (PyTorch CPU)
 │
 ├── Image Preprocessing & Crop Handling
 ├── MobileNetV2 Model + Internal Word Mapping 
 └── KMeans Clustering & CIELAB Extraction
 │
 ▼
MongoDB (NoSQL Document Store)
```

---

# Project Structure

```text
Clothify-w
│
├ backend (Python / Flask)
│  ├ app
│  │  ├ ai             # PyTorch classification & CIELAB color extraction algorithms
│  │  ├ config         # DB configuration and environmental loading
│  │  ├ models         # MongoDB collection abstractions
│  │  ├ routes         # API routing (auth, clothes, classify, outfit, calendar, upload)
│  │  └ services       # Business logic (JWT flows, Outfit shuffling, Calendar Auth)
│  ├ tests           
│  ├ uploads           # Local storage for user clothes
│  ├ app.py            # Flask Entry Point
│  ├ requirements.txt  # Python Dependencies
│  └ .env.example
│
├ frontend (Vite / React)
│  ├ src
│  │  ├ assets
│  │  ├ components     # Reusable UI elements (Navbar, Cards, Modals)
│  │  ├ context        # Global React Contexts (AuthContext)
│  │  ├ pages          # Main Views (Home, Login, Register, Wardrobe, Planner)
│  │  ├ App.jsx        # Main Router
│  │  └ main.jsx       # React Entry point
│  ├ public
│  ├ package.json
│  └ tailwind.config.js
│
├ how_to_start_it_whole.md  # Detailed Boot Guide
└ README.md                 # Project Overview
```

---

# Installation & Getting Started

Clothify runs two parallel dev-servers: a Python backend and a React/Vite frontend. 

## 1. Clone Repository

```bash
git clone https://github.com/mohammedansari499/Clothify-w.git
cd "Clothify w"
```

---

## 2. Start the Backend server

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and active the python virtual environment:
   - **Windows:**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup Environment Variables: 
   - Rename `.env.example` to `.env`
   - Fill in your `MONGO_URI` (MongoDB connection string) and set a secure `JWT_SECRET_KEY`.
5. Start the backend app server:
   ```bash
   flask run
   # OR
   python app.py
   ```
   *The server will be running cleanly on `http://localhost:5000`*

---

## 3. Start the Frontend Web App

1. Open a **second distinct terminal** leaving the previous backend terminal running.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install NodeJS dependencies:
   ```bash
   npm install
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
5. Click the local URL printed in your console (usually `http://localhost:5173`) to launch the visual interface!

---

# API Endpoints Summary

## Authentication (`/api/auth/*`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register user |
| POST | `/login` | Login user |
| GET | `/profile` | Get current user profile (JWT Restricted) |

## Wardrobe & Upload (`/api/clothes/*`, `/api/upload`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/clothes` | Create and save a new clothing item to DB |
| GET | `/api/clothes` | Get user's wardrobe list |
| DELETE| `/api/clothes/<id>` | Delete an item |
| POST | `/api/upload` | Specialized pipeline for image binary uploading |

## AI Processing & Outfits (`/api/classify`, `/api/outfits/*`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/classify` | Takes an image, runs PyTorch MobileNetV2 & extracts CIELAB color |
| GET | `/api/outfits/plan` | Generate outfit plans from the user's available wardrobe |
| POST | `/api/outfits/plan/save` | Push an optimal outfit into saved plan memory |
| GET | `/api/outfits/plan/saved` | Retrieve previously saved plans |

## Extensibility (`/api/calendar/connect`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/calendar/connect`| Oauth redirect to export plans to Google Calendar |

---

# AI Pipeline Deep-Dive

We replaced heavy third-party APIs or external models with a purely localized, fast-executing machine learning architecture.

```text
       User Uploads Photo
               ↓
    Image Cleaning & Resizing
               ↓
  PyTorch + MobileNetV2 Network
  (Internal Weighted Inference)
               ↓
 Dictionary Translation Mapping 
 (e.g. Lab Coat -> Formal Wear)
               ↓
 KMeans Clustering & Filter Scan
 (Ignores BG, Whites, Edge Noise)
               ↓
    CIELAB Color Space Mapping
               ↓
 Outputs Category & Hex Palette
      to Frontend Instantly
```

---

# Implementation Status

- [x] **Phase 1 – Backend Core:** Flask API, JWT, MongoDB integration, Wardrobe CRUD.
- [x] **Phase 2 – Advanced Local AI:** PyTorch MobileNetV2 loading, Image preprocessing, CIELAB Extraction.
- [x] **Phase 3 – Frontend Interfaces:** React UI, Wardrobe Dashboard, Interactive Uploads, Outfit Planner Views.
- [x] **Phase 4 – Advanced Features:** Intelligent Outfit Shuffling algorithms, Google Calendar Exports.
- [ ] **Phase 5 – Mobile Application:** React Native / Expo implementation (Coming Soon).
- [ ] **Phase 6 – DevOps Infrastructure:** Cloud Deployment orchestration.

---

# Author

**Mohammed Abdul Wahaj Ansari**

GitHub: [https://github.com/mohammedansari499](https://github.com/mohammedansari499)

---

# License

This project is licensed under the MIT License.
