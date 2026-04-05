# WardrobeAI Project Overview & Architecture Guide

Welcome to WardrobeAI! This document explains the full-stack architecture of the platform, detailing how the React frontend, Python Flask backend, and the local AI models communicate to create a complete smart wardrobe system.

---

## 1. High-Level Architecture
The project is split into two primary folders:
- `/frontend`: A React 18 application built with Vite and Tailwind CSS.
- `/backend`: A Python 3.11 Flask API running local AI models and a MongoDB database.

Everything runs on the local machine without requiring external cloud AI GPUs, making it totally private and extremely fast.

---

## 2. Frontend (`/frontend`)
The frontend is a Single Page Application (SPA) that provides the graphical interface for users.
- **Framework:** React + Vite.
- **Styling:** Tailwind CSS (configured in `tailwind.config.js` and `src/index.css`) with heavy use of glassmorphism (translucency + blur) and a dark mode aesthetic.
- **Routing:** Handled via React Router (`src/App.jsx`).

### Key Components & Pages:
1. **Auth Context (`src/context/AuthContext.jsx`)**: Manages the user's JWT tokens and login state persistence.
2. **Wardrobe Page (`src/pages/Wardrobe.jsx`)**: 
   - Displays all clothing items in categorized groups (Tops, Bottoms, Outerwear, etc.).
   - Includes the `UploadDropzone.jsx` component to drag-and-drop new clothes.
   - Allows users to track how many times they've worn an item or delete items.
3. **Planner Page (`src/pages/Planner.jsx`)**:
   - Communicates with the outfit generation service to provide a 7-day style plan.
   - Computes logic on the display side to highlight "Today" and render color swatches.

---

## 3. Backend API (`/backend`)
The backend is a Flask server serving HTTP JSON requests and orchestrating database interactions.

### API Routes (`app/routes/`)
- `auth_routes.py`: Handles login & user registration functionality + JWT token generation.
- `upload_routes.py`: Deals strictly with saving physical image files to the `/uploads/` directory on the local disk.
- `classify_routes.py`: Acts as the bridge between uploads and AI. Sends a physically saved image to the AI service, receives the prediction, and pushes the final metadata to the database.
- `clothes_routes.py`: Standard CRUD endpoints to fetch the list of clothes, delete items, or update the `wear_count` trackers.
- `outfit_routes.py`: Retrieves the user's clothes, dynamically generates a 7-day outfit plan, and supports saving that plan strictly to the user's profile.
- `calendar_routes.py`: Scaffolds OAuth integration (e.g., to Google Calendar).

---

## 4. Database (`app/config/db.py`)
WardrobeAI uses local **MongoDB**.
- Collections included: `users`, `clothes`, `outfit_plans`.
- Clothes documents store metadata such as AI-predicted tags, image URL paths, wearing frequency, and primary/secondary HSV+RGB color palettes.

---

## 5. Local AI Engine (`app/ai/`)
This runs entirely offline without API limits. It powers the classification and tagging of items.
Detailed internal documentation for this sits in `/backend/how_it_works.md`, but fundamentally:

**A. MobileNetV2 Classifier (`classifier.py`)** 
Identifies the clothing type taking PyTorch arrays and mapping ImageNet classifications to Wardrobe classes via a strict keyword-order list.
**B. CIELAB KMeans Extractor (`color_extractor.py`)** 
Applies ML clustering in 3D color-space (LAB format instead of RGB) to crop and define the exact shade and harmony of the cloth, dodging shadows and backgrounds.

---

## 6. Smart Outfit Service (`app/services/outfit_service.py`)
This is the logic engine that powers the "Weekly Planner" tab without needing deep AI.
- **Grouping:** Automatically segments tops, bottoms, and outwears.
- **Color Harmony (`_color_contrast_score`):** It translates RGB values to HSL and mathematically compares them. Complementary colors (opposite hue) or drastically different lightness scores get high match confidence.
- **Wear Penalty (`_wear_penalty`):** It punishes clothing items mathematically if they have a high `wear_count`. This ensures your weekly generation is actually "rotating" your wardrobe instead of giving you the exact same outfit.
