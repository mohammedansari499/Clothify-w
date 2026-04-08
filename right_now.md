# Clothify Repo - Current Files Overview

## Root Directory
- `PROJECT_OVERVIEW.md`: General description of the project architecture and setup.
- `README.md`: The main README for the project with setup instructions.
- `WardrobeAI_Windows_Guide.jsx` & `WardrobeAI_Windows_Guide (1).jsx`: Legacy setup guides or React templates.
- `WardrobeAI_MajorProject_Guide.docx`: Documentation related to the major project assignment requirements.
- `changes_made`, `changes_till_ now`, `fix needed.txt`, `model_works.md`: Temporary notes detailing what was changed and remaining bug checklist.
- `execution_log.md`: Log of the execution steps and progress made in previous agent sessions.
- `seed_test_data.py`: Script to quickly seed the database with mock test data.
- `.gitignore`: Specifies intentionally untracked files to ignore for Git.

## GitHub & Infra
- `.github/workflows/ci.yml`, `deploy-production.yml`, `deploy-staging.yml`: CI/CD pipelines defining how the application is tested and deployed on GitHub Actions.
- `infrastructure/docker/Dockerfile.backend` & `docker-compose.yml`: Definition of the backend container and orchestration for running services locally using Docker.
- `.postman/resources.yaml` & `postman/globals/workspace.globals.yaml`: Postman API specifications and global workspace variables.

## Backend
- `backend/app.py`: Entry point for the Flask backend application.
- `backend/requirements.txt`: Python package dependencies.
- `backend/pytest.ini`: Pytest configuration file.
- `backend/.env.example`: Template for environment variables needed by the backend.
- `backend/changes_log.md` & `backend/how_it_works.md`: Backend specific documentation and modification logs.
- `backend/debug_imagenet.py`, `backend/test_new_classifier.py`, `backend/debug_imagenet_labels.txt`, `backend/test_output_*.txt`, `backend/test_results_new.txt`: Scripts and output files for debugging and testing the AI image classification logic.

### Backend App Structure (`backend/app/`)
- `config/db.py`: Establishes the connection to MongoDB and defines collections.
- `config/init_db.py`: Script for initializing necessary database configurations.
- `models/user_model.py`: Defines operations for handling User objects in the database.

#### API Routes (`backend/app/routes/`)
- `auth_routes.py`: Endpoints for login and registration.
- `calendar_routes.py`: Endpoints for fetching/saving scheduled outfits to a calendar.
- `classify_routes.py`: Endpoints responsible for detecting clothing categories/colors from images.
- `clothes_routes.py`: CRUD endpoints for adding, updating, fetching, and tracking items in a wardrobe.
- `collection_routes.py`: Endpoints for creating and managing user-curated clothing collections.
- `outfit_routes.py`: Endpoints for generating, listing, and saving outfit combinations.
- `upload_routes.py`: Logic for receiving image uploads and saving them.
- `weather_routes.py`: Endpoints providing weather forecasts and weather-appropriate outfit recommendations.

#### Services (`backend/app/services/`)
Core business logic separated from route handlers:
- `calendar_service.py`: Generates planner data logic.
- `classifier_service.py`: AI model interface for clothing classification.
- `outfit_service.py`: Combinatorics and rules for piecing outfits together.
- `weather_service.py`: Integrates with external weather APIs to fetch data.

#### AI Processing (`backend/app/ai/`)
- `classifier.py`: The core image classification models (ResNet/ImageNet).
- `color_extractor.py`: Colorimetric algorithms for extracting dominant hex values from clothing pictures.
- `jacket_verifier.py`: Custom model or logic for verifying specific outerwear categories.

### Migrations
- `backend/migrations/add_laundry_thresholds.py`: Database script to update collections by adding laundry tracking thresholds.

### Backend Tests (`backend/tests/`)
- `conftest.py`: Shared pytest mock configurations and database monkeypatches.
- `test_auth.py`, `test_calendar.py`, `test_classify.py`, `test_clothes.py`, `test_color_math.py`, `test_planner.py`, `test_upload.py`: Unit and integration test suites covering the application logic.

## Frontend
- `frontend/package.json` & `frontend/package-lock.json`: Node dependencies for the Vite React app.
- `frontend/vite.config.js` & `frontend/eslint.config.js`: Tooling configuration for the builder and linter.
- `frontend/tailwind.config.js`: Tailwind CSS styling rules.
- `frontend/vercel.json`: Configuration for deploying to Vercel.
- `frontend/index.html`: Base HTML template.

### Frontend Source (`frontend/src/`)
- `main.jsx` & `App.jsx`: Main React DOM entry points and route setup.
- `App.css` & `index.css`: Global base styles and Tailwind setup.
- `utils/axios.js`: Custom Axios HTTP client configured with the backend Base URL and interceptors.

#### Components (`frontend/src/components/`)
- `Navbar.jsx`: Top navigation menu.
- `UploadDropzone.jsx`: Image upload interface.
- `ThemeToggle.jsx`: Component to switch between dark and light modes.
- `AddToCollectionModal.jsx`: Modal for organizing items into specific collections.

#### Context (`frontend/src/context/`)
- `AuthContext.jsx`: React context provider managing user login state globally.
- `ThemeContext.jsx`: Manages global dark/light styling preferences across the app.

#### Pages (`frontend/src/pages/`)
- `Home.jsx`: Main dashboard post-login.
- `Login.jsx` & `Register.jsx`: Authentication screens.
- `Planner.jsx`: Calendar/Outfit scheduling interface.
- `Wardrobe.jsx`: The gallery showing all the user's uploaded clothes.
- `Collections.jsx`: Page outlining different custom categories of clothing.
