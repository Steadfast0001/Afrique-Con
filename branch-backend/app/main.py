from __future__ import annotations

from fastapi import FastAPI

from app.routers.health import router as health_router
from app.routers.journeys import router as journeys_router

app = FastAPI(
    title="Afrique-Con Branch Backend",
    version="0.1.0",
    description="Branch node backend service for Afrique-Con.",
)

app.include_router(health_router)
app.include_router(journeys_router)
