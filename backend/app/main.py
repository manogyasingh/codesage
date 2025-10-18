from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.db.session import Base, engine

# Routers
from app.routers import auth, companies, users, problems, candidates, interviews, execute, analytics, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev/test convenience)
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="CodeSage Backend", version="0.1.0", lifespan=lifespan)

    # Add CORS middleware with explicit configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if "*" not in settings.CORS_ORIGINS else ["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.get("/health")
    def health_check():  # pragma: no cover - trivial endpoint
        return JSONResponse({"status": "ok"})

    # Include API routers
    app.include_router(auth.router, prefix="/auth", tags=["auth"]) 
    app.include_router(companies.router, prefix="/companies", tags=["companies"]) 
    app.include_router(users.router, prefix="/users", tags=["users"]) 
    app.include_router(problems.router, prefix="/problems", tags=["problems"]) 
    app.include_router(candidates.router, prefix="/candidates", tags=["candidates"]) 
    app.include_router(interviews.router, prefix="/interviews", tags=["interviews"]) 
    app.include_router(execute.router, prefix="/execute", tags=["execute"]) 
    app.include_router(analytics.router, prefix="/analytics", tags=["analytics"]) 
    app.include_router(websocket.router, tags=["ws"]) 

    return app


app = create_app()


