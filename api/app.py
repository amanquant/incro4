# api/app.py
"""
Main FastAPI application entrypoint for Vercel
This is the entry point that Vercel looks for
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from .config import config
from .database import supabase_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# LIFECYCLE EVENTS
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app lifecycle"""
    logger.info("✅ FastAPI app starting up...")
    # Startup
    health = await supabase_db.health_check()
    if not health:
        logger.warning("⚠️ Supabase connection check failed at startup")
    yield
    # Shutdown
    logger.info("🛑 FastAPI app shutting down...")


# ============================================================================
# CREATE FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Incrolink API v2",
    description="Financial analytics API - Vercel + Supabase",
    version="2.0.0",
    lifespan=lifespan
)

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Incrolink API v2",
        "status": "operational",
        "environment": config.vercel_env,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health():
    """Health check endpoint for Vercel"""
    try:
        db_health = await supabase_db.health_check()
        return {
            "status": "healthy" if db_health else "degraded",
            "database": "connected" if db_health else "disconnected",
            "environment": config.vercel_env,
            "version": "2.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")


# ============================================================================
# IMPORT ROUTES (this will be added next)
# ============================================================================

# Routes will be included here
from .v1 import routes
app.include_router(routes.router, prefix="/api/v1")


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP Exception: {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return {
        "error": "Internal server error",
        "status_code": 500
    }


# ============================================================================
# VERCEL REQUIRES THIS EXPORT
# ============================================================================

handler = app  # Vercel serverless functions expect 'handler'


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000))
    )
