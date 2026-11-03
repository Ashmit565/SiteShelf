# SiteShelf

SiteShelf is a small full-stack website bookmarking and preview app built with React, Vite, FastAPI, SQLAlchemy, and SQLite.

## Run locally

Requirements: Python 3.10+ and Node.js 18+.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `JWT_SECRET_KEY` in `backend/.env` to a long random value, then start:

```powershell
uvicorn main:app --reload
```

The API is at <http://127.0.0.1:8000>; interactive API docs are at <http://127.0.0.1:8000/docs>.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173>.

## Features

- Signup and login with Argon2-hashed passwords and signed JWT access tokens.
- Authenticated dashboard with website previews, search, and delete.
- SQLite persistence, per-user website ownership, and duplicate prevention.
- Metadata extraction for page title, description, and Open Graph image. A failed or blocked metadata request still saves the URL and falls back to its domain.
- URL scheme validation, public-host checks, redirect validation, and bounded request timeouts for preview fetches.

For deployment, set `JWT_SECRET_KEY` to a secure random value and configure the allowed frontend origin in `backend/main.py`.
