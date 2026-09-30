import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env.local")

database_url = os.getenv("DATABASE_URL")
if os.getenv("VERCEL") == "1" and not database_url:
    raise RuntimeError("DATABASE_URL must be configured for Vercel deployments")

class Settings:
    DATABASE_URL: str = database_url or "sqlite:///./nwis_prototype.db"
    CORS_ORIGINS: list[str] = [
        origin.strip().rstrip("/")
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://nwis-sih2026.netlify.app",
        ).split(",")
        if origin.strip()
    ]
        
settings = Settings()
