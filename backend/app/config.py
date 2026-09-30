import os

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nwis_prototype.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
<<<<<<< HEAD
        "nwis-sih2026.netlify.app"
=======
        "https://nwis-sih2026.netlify.app/"
>>>>>>> 1a9809405be5eed0edce8a083f9fb384e25cec62
    ]

settings = Settings()
