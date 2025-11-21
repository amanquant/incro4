"""
Main FastAPI application entrypoint for Vercel
This is the entry point that Vercel looks for
"""

import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --- FIX START: Register Project Root ---
# This must be at the top to ensure 'lib' and 'api' can be imported correctly
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir) # Go up one level from 'api'
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
except Exception as e:
    print(f"Path setup error: {e}")
# --- FIX END ---

# Now we can import internal modules safely
from api.config import config
from api.database import supabase_db
# Import the router explicitly
from api.v1.routes import router as v1_router

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
    try:
        health = await supabase_db.health_check()
        if not health:
            logger.warning("⚠️ Supabase connection check failed at startup")
    except Exception as e:
        logger.error(f"⚠️ Supabase check error: {e}")
    
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
# INCLUDE ROUTES
# ============================================================================

# Mount the v1 router
app.include_router(v1_router, prefix="/api/v1")

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Incrolink API v2",
        "status": "operational",
        "environment": getattr(config, 'vercel_env', 'development'),
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
            "environment": getattr(config, 'vercel_env', 'development'),
            "version": "2.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")


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
    # Return JSON response instead of default HTML error
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error", 
            "detail": str(exc) # Helpful for debugging Vercel logs
        }
    )


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
