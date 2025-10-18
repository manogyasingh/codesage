# CodeSage Backend (FastAPI)

## Setup

```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables:
- DATABASE_URL (default: SQLite file in app/core/app.db)
- SECRET_KEY (default: dev-secret-change-me)
- ALLOW_ALL_ORIGINS=1 to allow any CORS origin

## Notes
- Auto-creates tables on startup for dev via SQLAlchemy create_all.
- Auth uses OAuth2 password flow with bearer tokens.
- WebSocket echo endpoint at `/ws/interviews/{session_id}`.

## Testing

```
pytest -q
```

