"""FastAPI main application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, seed_default_prompts
from app.routers import dashboard, partners, updates

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("Initializing database...")
    init_db()
    seed_default_prompts()
    logger.info("Database initialized successfully")

    yield

    # Shutdown
    logger.info("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title="Qollabi Partner Management API",
    description="FastAPI backend for ALE partner performance management",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(partners.router)
app.include_router(updates.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Qollabi Partner Management API",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
