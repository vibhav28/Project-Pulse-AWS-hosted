# Project Pulse Dashboard

This project is separated into a Django backend and a React frontend.

## Project Structure

- `backend/`: Django REST Framework API.
- `frontend/`: React + Vite application.

## Getting Started

### Backend (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup Database (PostgreSQL required):
   - Ensure PostgreSQL is running.
   - Update `backend/projectpulse/settings.py` with your database credentials if needed.
   - Run migrations:
     ```bash
     python manage.py migrate
     ```
5. Run the server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://localhost:8000/api/`.

### Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Architecture

- **Backend**: Django 4.2+, DRF, PostgreSQL (recommended).
- **Frontend**: React, Vite, TailwindCSS (shadcn/ui).
- **API**: The frontend communicates with the backend via REST API at `http://localhost:8000/api`.
