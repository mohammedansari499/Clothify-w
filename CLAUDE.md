# Clothify - AI Wardrobe System

## Project Context
A full-stack AI wardrobe manager using Flask (Backend) and React (Frontend).
Focuses on local AI classification and CIELAB color extraction.

## Tech Stack
- **Backend:** Python 3.10, Flask, PyTorch (MobileNetV2), MongoDB, CIELAB/KMeans.
- **Frontend:** React, Vite, Tailwind CSS.
- **Theme:** Cyberpunk Noir / Neon (Dark mode).

## Commands
- **Run Backend:** `cd backend && venv/scripts/activate && python app.py`
- **Run Frontend:** `cd frontend && npm run dev`

## Guidelines
- Always use Tailwind CSS for UI.
- Keep AI logic local (PyTorch).
- Ignore `node_modules` and `venv` during file scans.