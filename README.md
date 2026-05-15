# 🧠 Clothify AI — Intelligent Digital Wardrobe System

<p align="center">
  <strong>The Future of Wardrobe Intelligence. Engineered with AI, Computer Vision & Neural UI.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python"/>
  <img src="https://img.shields.io/badge/Flask-Backend-black?style=for-the-badge&logo=flask"/>
  <img src="https://img.shields.io/badge/PyTorch-Local%20AI-ee4c2c?style=for-the-badge&logo=pytorch"/>
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/TailwindCSS-UI-38B2AC?style=for-the-badge&logo=tailwindcss"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

---

## 🌌 Overview

Clothify is a **full-stack AI-powered wardrobe intelligence system** that turns clothing photos into a **structured, searchable, and style-aware digital wardrobe**.

It combines:

* 🧠 **Local Computer Vision** for garment recognition
* 🎨 **Perceptual Color Intelligence** using CIELAB + KMeans
* 👗 **Rule-based Outfit Planning** with scoring, variety, and weather context
* ⚡ **Modern Animated UI** built with React, Tailwind CSS, and Framer Motion
* 🔐 **User Accounts, Profiles, Collections, and Planner Persistence**

At its core, Clothify is designed to:

* ingest wardrobe images,
* classify garments locally,
* extract dominant colors,
* tag items with wearable context,
* generate weekly outfit plans,
* persist wardrobe and planner data in MongoDB,
* optionally connect Google Calendar to infer real-world occasions.

> **Note:** some internal docs and legacy files still use the older name **WardrobeAI**. The active product identity in this repository is **Clothify AI**.

---

## 🌟 Key Features

### 🔐 Authentication & User Identity

* JWT-based authentication for protected API routes
* Email/password registration and login
* Google sign-in endpoint for OAuth-based login
* Persistent frontend auth state via `AuthContext`
* User profile retrieval and update support
* Rich profile fields, including:
  * name / display name
  * username
  * bio
  * phone
  * occupation
  * location
  * style preferences
  * available in both dark and light theme
  
<img width="1138" height="574" alt="image" src="https://github.com/user-attachments/assets/a8acba5a-4741-4ba1-919c-bbcdbf4be20a" />
<img width="1149" height="582" alt="image" src="https://github.com/user-attachments/assets/3b6ba075-7f25-492d-bd0d-ca6db0e43a98" />

---

### 👕 Digital Wardrobe Management

* Drag-and-drop clothing image upload via React Dropzone
* Secure backend upload handling for:
  * `.jpg`
  * `.jpeg`
  * `.png`
  * `.webp`
 <img width="1135" height="579" alt="image" src="https://github.com/user-attachments/assets/0686622c-a59f-4f9d-a05a-b4b32d50470e" />

* Uploaded files stored locally and served back through `/uploads/<filename>`
* Clothing metadata persisted in MongoDB
* Wardrobe CRUD operations:
  * add item
  * fetch all items
  * delete item
  * mark item as worn
  * reset wear count
* Frontend wardrobe view supports:
  * grouped sections (Tops, Bottoms, Outerwear, Traditional, Dresses, Footwear, Accessories)
  * search filtering
  * wearable status tracking
  * color chip previews
  * quick action controls

---

### 🧠 Local AI Clothing Classification

The AI path is primarily **local-first**.

#### Primary classifier

* Uses **PyTorch + TorchVision MobileNetV2**
* Runs locally on the backend
* Uses ImageNet-pretrained weights when no custom weights are present
* Supports optional fine-tuned replacement weights from:
  * `backend/app/ai/weights/clothing_classifier.pt`
  * `backend/app/ai/weights/class_index.json`

#### Clothing label mapping

* Converts generic ImageNet outputs into wardrobe-oriented labels using an ordered remapping layer
* Supports a broad taxonomy including categories such as:
  * `tshirt`, `shirt`, `formal_shirt`
  * `jacket`, `coat`, `hoodie`, `sweater`, `blazer`
  * `jeans`, `formal_pants`, `cargo_pants`, `shorts`, `track_pants`, `pyjama`, `skirt`, `dress`
  * `sneakers`, `loafers`, `shoes`, `sandals`, `slippers`
  * `kurta`, `sherwani`
  * `watch`, `belt`, `cap`, `socks`, `ring`, `chain`, `bracelet`, `tie`, `scarf`, `bag`, `accessories`

<img width="1131" height="570" alt="image" src="https://github.com/user-attachments/assets/6dedd155-6dbb-4394-a881-1d3dcd0a917a" />


#### Secondary verifier for ambiguous tops / outerwear

* Includes a **CLIP-based zero-shot verifier** for difficult cases such as:
  * jacket vs shirt
  * jacket vs t-shirt
  * shirt vs t-shirt
* This verifier is auxiliary, not the primary classification backbone

#### AI output payload

Each classified item can include:

* clothing type
* predicted style
* confidence score
* top predictions
* occasion tags
* primary and secondary colors
* human-readable color name

---

### 🎨 Advanced Color Extraction

Color extraction is significantly more sophisticated than simple RGB averaging.

* Reads the uploaded image with OpenCV
* Resizes for faster processing
* Center-crops the garment region to reduce background influence
* Converts image data into **CIELAB color space**
* Filters near-white, near-black, and low-information background pixels
* Uses **KMeans++ clustering** in LAB space to identify dominant hues
* Converts dominant colors back to RGB / HSV for downstream use
* Maps dominant tones to human-readable names such as:
  * Black, White, Gray, Silver
  * Navy, Royal Blue, Teal, Green, Forest Green
  * Beige, Brown, Cream, Gold, Olive
  * Purple, Lavender, Pink, Red, Maroon, Salmon

This pipeline is used both for display in the wardrobe UI and for outfit scoring logic.

---

### 🏷️ Style & Occasion Tagging

After classification and color extraction, the backend derives wearable context automatically.

* Style inference based on garment category
* Occasion tagging using garment type and color formality
* Example style buckets include:
  * casual
  * semi-formal
  * formal
  * traditional
  * athletic
  * accessory
* Example occasion tags include:
  * everyday
  * office
  * business
  * festive
  * wedding
  * gym
  * sports

---

### 👗 Smart Outfit Planning Engine

Clothify includes a real planner engine rather than a shallow “random outfit” generator.

#### Weekly plan generation

* Generates a **7-day plan** from the current wardrobe
* Works with sparse wardrobes and degrades gracefully if slots are missing
* Supports occasion-aware planning per day

#### Scoring logic

* Groups clothing into outfit slots:
  * tops
  * bottoms
  * footwear
  * outerwear
  * accessories
* Uses RGB → HSL conversion for color harmony scoring
* Rewards contrast, complementary pairings, and readable silhouettes
* Penalizes high `wear_count` items to improve rotation
* Adds variety penalties to reduce repeated combinations across the week

<img width="1118" height="573" alt="image" src="https://github.com/user-attachments/assets/5c7d0467-48b7-4aeb-ba8f-110e2e0e8298" />


#### Weather awareness

* Filters outfit candidates using weather conditions when city context is provided
* Can add outerwear when the weather is cold enough

<img width="1108" height="562" alt="image" src="https://github.com/user-attachments/assets/a26ff80e-fb1b-4cca-833e-0ddaa33188ad" />


#### Laundry awareness

* Supports `in_laundry` and laundry-threshold-aware planning logic
* Applies laundry filtering only when enough clean inventory remains

#### Planner UX features

* save weekly plan
* load saved plan
* regenerate weekly plan
* regenerate a single day’s outfit
* replace current outfit suggestion for a given day
* mark an outfit as worn
* add generated outfits into collections
* show confidence scores / suggested status / explanations

---

### ☁️ Weather Integration

* Weather lookup service available through `/api/weather/`
* Uses **OpenWeatherMap** when `OPENWEATHER_API_KEY` is configured
* Falls back to mock weather data when the key is absent or the request fails
* Used by the planner to make outfit suggestions more context-aware

---

### 📅 Google Calendar Integration

Calendar support exists as an actual feature surface in both backend and frontend.

* OAuth connect flow for Google Calendar
* Stores Google credentials on the user document
* Reads upcoming events from the user’s primary calendar
* Maps calendar events to wardrobe occasions such as:
  * Work
  * Gym
  * Wedding
  * Formal Event
  * Date
  * Party
  * Casual
  * Home
* Planner page can connect the calendar and pull event-derived context

**Important implementation note:** the strongest implemented calendar path in this repo is **calendar connection + reading upcoming events for occasion inference**.

---

### 📂 Collections System

* Create named collections
* Save outfits into collections
* Fetch all user collections
* Delete collections
* Remove individual saved outfits from a collection
* Dedicated frontend page for browsing saved collections and outfits

<img width="1134" height="573" alt="image" src="https://github.com/user-attachments/assets/8f72a47b-a50d-4397-846c-0a28cb62de61" />

This makes the planner output reusable instead of disposable.

---

### 👤 Profile Management

The repo includes a dedicated profile page and backend profile update support.

Users can manage:

* name
* display name
* username
* bio
* phone
* occupation
* location
* style preferences
* Google profile picture when applicable

---

### 🎨 Frontend Experience Layer

The frontend is not plain CRUD.

* React 19 + Vite application
* Tailwind CSS with tokenized theming
* Dark / light mode via `ThemeContext`
* Framer Motion page transitions and animated UI states
* Reusable UI primitives in `NeuralUI.jsx`
* Animated landing page with branded “Clothify.AI” identity
* Responsive navigation with auth-aware actions
* Dedicated pages for:
  * Home
  * Login
  * Register
  * Wardrobe
  * Planner
  * Collections
  * Profile


The repository also contains extra experimental / design-forward components such as:

* `CustomCursor.jsx`
* `NeuralBackground.jsx`
* `PageTransition.jsx`

These reinforce the repo’s cyberpunk / neural aesthetic direction.

---

### 🧪 Testing, CI/CD & Dev Tooling

#### Backend tests

The repo includes pytest-based backend tests covering:

* auth routes
* file upload
* classification pipeline behavior
* clothes CRUD
* outfit planning logic
* color scoring math
* calendar integration flow

#### CI pipeline

GitHub Actions workflows provide:

* backend dependency install
* flake8 linting
* backend unit tests with coverage
* coverage artifact upload
* frontend lint/build
* staging integration test run

#### Deployment workflows

* **Staging deploy:** Render backend + Vercel preview + smoke tests
* **Production deploy:** approval gate + Render backend + Vercel production + post-deploy verification

#### Additional developer tooling

* MongoDB index bootstrap script: `backend/app/config/init_db.py`
* Seed data script: `seed_test_data.py`
* Docker Compose stack for local development
* Postman workspace resources
* Vercel configuration for SPA routing

---

## 🏗️ System Architecture

```text
User
 │
 ▼
Frontend SPA (React + Vite + Tailwind + Framer Motion)
 │
 ├── Authentication UI
 ├── Wardrobe UI
 ├── Planner UI
 ├── Collections UI
 └── Profile UI
 │
 ▼
Flask Backend REST API
 │
 ├── Auth Routes
 ├── Upload Routes
 ├── Classification Routes
 ├── Clothes Routes
 ├── Outfit Routes
 ├── Weather Routes
 ├── Calendar Routes
 └── Collection Routes
 │
 ▼
Local AI Engine
 │
 ├── MobileNetV2 garment classifier
 ├── Ordered label remapping layer
 ├── Optional CLIP-based jacket/shirt verifier
 └── CIELAB + KMeans color extractor
 │
 ▼
MongoDB
 │
 ├── users
 ├── clothes
 ├── outfit_plans
 └── collections
```

---

## 🤖 AI Pipeline Deep Dive

```text
User uploads clothing image
        ↓
Backend stores file locally
        ↓
/api/classify resolves local upload path
        ↓
MobileNetV2 predicts garment class
        ↓
Ordered mapping converts ImageNet labels → wardrobe labels
        ↓
Optional CLIP verifier resolves ambiguous jacket/shirt/t-shirt cases
        ↓
CIELAB + KMeans extracts dominant color palette
        ↓
Style + occasion tags are synthesized
        ↓
Structured wardrobe item is saved to MongoDB
        ↓
Planner uses saved wardrobe metadata for scoring and generation
```

---

## 🧮 Outfit Planning Logic

```text
Wardrobe Items
      ↓
Slot Grouping (top / bottom / shoes / outerwear / accessories)
      ↓
Optional Weather Filter
      ↓
Optional Laundry Filter
      ↓
Color Harmony Scoring
      ↓
Wear Penalty + Variety Adjustment
      ↓
Occasion Mapping (Work / Casual / Party / Gym / etc.)
      ↓
Best Outfit Candidates Per Day
      ↓
Weekly Plan + Confidence + Explanation
```

---

## 🛠 Tech Stack

### Frontend

* React 19
* Vite 8
* Tailwind CSS
* Framer Motion
* React Router DOM
* Axios
* React Dropzone
* Lucide React
* React Icons
* Google OAuth React SDK

### Backend

* Flask
* Flask-CORS
* Flask-JWT-Extended
* MongoDB / PyMongo
* bcrypt
* python-dotenv
* Google OAuth libraries
* Requests

### AI / ML

* PyTorch
* TorchVision
* OpenCV
* NumPy
* scikit-learn
* Pillow
* Transformers (for the auxiliary CLIP verifier)

### Infra / Tooling

* GitHub Actions
* Docker Compose
* Vercel
* Render
* Postman
* Pytest
* Flake8

---

## 📁 Project Structure

```text
Clothify-w/
│
├── backend/
│   ├── app.py                         # Flask entrypoint
│   ├── requirements.txt              # Python dependencies
│   ├── changes_log.md                # Classification engine change notes
│   ├── how_it_works.md               # AI pipeline internals
│   ├── app/
│   │   ├── ai/
│   │   │   ├── classifier.py         # MobileNetV2 + optional CLIP verification
│   │   │   ├── color_extractor.py    # CIELAB + KMeans palette extraction
│   │   │   └── jacket_verifier.py    # CLIP-based ambiguous-top resolver
│   │   ├── config/
│   │   │   ├── db.py                 # MongoDB collections
│   │   │   └── init_db.py            # MongoDB index bootstrap
│   │   ├── models/
│   │   │   └── user_model.py         # User helpers
│   │   ├── routes/
│   │   │   ├── auth_routes.py
│   │   │   ├── upload_routes.py
│   │   │   ├── classify_routes.py
│   │   │   ├── clothes_routes.py
│   │   │   ├── outfit_routes.py
│   │   │   ├── calendar_routes.py
│   │   │   ├── weather_routes.py
│   │   │   └── collection_routes.py
│   │   └── services/
│   │       ├── classifier_service.py
│   │       ├── outfit_service.py
│   │       ├── calendar_service.py
│   │       └── weather_service.py
│   ├── migrations/
│   │   └── add_laundry_thresholds.py # Data migration for laundry thresholds
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_calendar.py
│       ├── test_classify.py
│       ├── test_clothes.py
│       ├── test_color_math.py
│       ├── test_planner.py
│       └── test_upload.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── UploadDropzone.jsx
│       │   ├── AddToCollectionModal.jsx
│       │   ├── ThemeToggle.jsx
│       │   ├── NeuralUI.jsx
│       │   ├── PageTransition.jsx
│       │   ├── CustomCursor.jsx
│       │   └── NeuralBackground.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Wardrobe.jsx
│       │   ├── Planner.jsx
│       │   ├── Collections.jsx
│       │   └── Profile.jsx
│       └── utils/
│           └── axios.js
│
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy-staging.yml
│   └── deploy-production.yml
│
├── infrastructure/docker/
│   └── docker-compose.yml
│
├── PROJECT_OVERVIEW.md
├── seed_test_data.py
└── README.md
```

---

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/mohammedansari499/Clothify-w.git
cd "Clothify w"
```

---

### 2. Backend setup

#### Create and activate a virtual environment

**Windows (PowerShell)**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Configure environment variables

Create `backend/.env` and define the values used by the codebase:

```env
MONGO_URI=mongodb://localhost:27017/wardrobeai
SECRET_KEY=your_app_secret
JWT_SECRET_KEY=your_jwt_secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/callback
OPENWEATHER_API_KEY=your_openweather_api_key
UPLOAD_FOLDER=uploads
FLASK_DEBUG=false
```

#### Optional: initialize MongoDB indexes

```bash
python app/config/init_db.py
```

#### Run the backend

```bash
python app.py
```

The backend will be available at:

```text
http://127.0.0.1:5000
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Optional frontend environment values:

```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

The frontend will typically run at:

```text
http://localhost:5173
```

---

### 4. Seed demo data (optional)

From the repo root:

```bash
python seed_test_data.py
```

This inserts sample users / clothes / collections for quick UI testing.

---

## 🐳 Docker Development Stack

A Docker Compose setup is included for local development.

```bash
cd infrastructure/docker
docker-compose up --build
```

This stack includes:

* MongoDB container
* Flask backend container
* mounted backend source for local iteration

---

## 📡 API Surface

### Authentication

* `POST /api/auth/register`
* `POST /api/auth/login`
* `POST /api/auth/google`
* `GET /api/auth/profile`
* `PUT /api/auth/profile`

### Upload & Classification

* `POST /api/upload/`
* `POST /api/classify/`

### Wardrobe

* `POST /api/clothes/`
* `GET /api/clothes/`
* `DELETE /api/clothes/<item_id>`
* `PATCH /api/clothes/<item_id>/wear`
* `PATCH /api/clothes/<item_id>/reset-wear`

### Outfit Planner

* `GET /api/outfits/plan`
* `POST /api/outfits/plan`
* `POST /api/outfits/plan/save`
* `GET /api/outfits/plan/saved`
* `POST /api/outfits/plan/day`
* `POST /api/outfits/wear`

### Collections

* `GET /api/collections/`
* `POST /api/collections/`
* `POST /api/collections/<collection_id>/add`
* `DELETE /api/collections/<collection_id>`
* `DELETE /api/collections/<collection_id>/outfit/<outfit_index>`

### Weather

* `GET /api/weather/`

### Calendar

* `GET /api/calendar/connect`
* `GET /api/calendar/callback`
* `GET /api/calendar/events`

---

## ⚡ Runtime & Behavior Notes

* Backend preloads the model stack on startup to reduce first-request latency
* If custom classifier weights are absent, MobileNetV2 ImageNet weights are used
* The CLIP verifier is only used for ambiguous top / outerwear cases
* Uploads are stored locally, not in a required external media service
* Weather calls fall back to mock data if OpenWeatherMap is unavailable
* Planner logic is robust enough to handle incomplete wardrobes
* The frontend stores some planner and theme preferences in local storage

---

## 🧪 Testing & Quality Gates

### Backend test suites

The repository includes tests for:

* authentication flows
* upload route validation
* color extraction fallbacks
* classification return shape
* outfit score math
* weekly plan generation
* calendar OAuth flow scaffolding
* clothes route serialization and deletion logic

### CI behavior

`ci.yml` runs:

* backend install
* flake8 linting
* pytest with coverage
* frontend install
* frontend lint
* frontend build

### Deployment workflows

* `deploy-staging.yml`
  * triggers CI
  * deploys backend to Render staging
  * deploys frontend preview to Vercel
  * runs smoke tests
* `deploy-production.yml`
  * triggers CI
  * requires approval
  * deploys backend to Render production
  * deploys frontend to Vercel production
  * runs post-deploy verification

---

## 🛠 Implementation Status

* [x] Flask backend with modular blueprints
* [x] JWT auth + Google login endpoint
* [x] Local upload pipeline
* [x] Local AI classification pipeline
* [x] Color extraction with CIELAB + KMeans
* [x] MongoDB wardrobe persistence
* [x] Wear tracking and planner persistence
* [x] Weekly outfit planner
* [x] Weather-aware planning
* [x] Google Calendar connection + event reading
* [x] Collections management
* [x] Profile editing UI + backend update route
* [x] Tailwind + Framer Motion frontend
* [x] Dark / light theme support
* [x] Backend tests
* [x] CI/CD workflows
* [x] Docker local stack
* [ ] Mobile app
* [ ] Fine-tuned production clothing model bundled in-repo
* [ ] Fully polished screenshot gallery in README
* [ ] Advanced AI stylist / conversational recommendation layer

---

## 🗺️ Practical Next Steps

If you continue improving this repo, the most valuable next upgrades are:

1. replace generic ImageNet mapping with a fine-tuned garment classifier,
2. formalize the backend `.env.example`,
3. add real screenshots / gifs to this README,
4. harden Google Calendar scopes and callback behavior,
5. wire any experimental UI components globally only if they are intended to ship,
6. add stronger integration tests for planner + calendar + weather flows.

---

## 📸 Screenshots

Replace this section with real UI captures from:

* Home page
* Wardrobe page
* Planner page
* Collections page
* Profile page

Example layout:

| Dashboard | Wardrobe | Planner |
|---|---|---|
| `docs/screenshots/home.png` | `docs/screenshots/wardrobe.png` | `docs/screenshots/planner.png` |

---

## 📚 Additional Project Docs

Useful companion documents already present in the repository snapshot:

* `PROJECT_OVERVIEW.md`
* `backend/how_it_works.md`
* `backend/changes_log.md`
* `seed_test_data.py`

---

## 👨‍💻 Author

**Mohammed Abdul Wahaj Ansari**
GitHub: https://github.com/mohammedansari499

---

## 📜 License

MIT License

---

## 🤝 Contributing

Contributions are welcome in areas such as:

* model quality improvements
* wardrobe taxonomy refinement
* planner intelligence
* frontend polish and accessibility
* testing depth
* deployment hardening
* documentation cleanup

If you contribute, keep these principles intact:

* preserve local-first AI behavior where possible,
* avoid reintroducing weak heuristic shortcuts where the repo already has better logic,
* keep the backend modular,
* keep the UI theme coherent with the current Clothify identity.
