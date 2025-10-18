from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "CodeSage Backend"
    ENV: str = os.getenv("ENV", "dev")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app.db")),
    )

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    # Ensure we allow all origins in development
    if os.getenv("ENV", "dev").lower() in ["dev", "development"]:
        CORS_ORIGINS.append("*")


settings = Settings()


