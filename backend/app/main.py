from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.seed_data import seed_database
from app.seed_reports import seed_sample_reports
from app.routers import wells, formations, events, drilling, risk, reports, copilot, alerts


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Startup: Ensure tables exist, seed relational data and reports
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        seed_sample_reports()
    except Exception as e:
        print(f"Startup seeding warning: {e}")
    finally:
        db.close()
    yield
    # Shutdown (nothing needed)


app = FastAPI(title="NWIS Prototype API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wells.router, prefix="/api/wells", tags=["Wells"])
app.include_router(formations.router, prefix="/api/formations", tags=["Formations"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(drilling.router, prefix="/api/drilling", tags=["Drilling"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(copilot.router, prefix="/api/copilot", tags=["Copilot"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
