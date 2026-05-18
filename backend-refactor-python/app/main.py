import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import run_migration
from .routers import auth, dashboard, dosen, mahasiswa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="KRS Akademik API (Python)",
    description="Backend Sistem Informasi Akademik — refactored to FastAPI",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Origin", "Content-Type", "Accept", "Authorization"],
)

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Terjadi kesalahan internal server"},
    )


# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    import time
    logger.info("🚀 KRS Akademik API (Python/FastAPI) starting...")

    # Retry migration up to 5 times (DB might not be immediately reachable)
    for attempt in range(1, 6):
        try:
            run_migration()
            break
        except Exception as e:
            logger.warning(f"Migration attempt {attempt}/5 failed: {e}")
            if attempt < 5:
                time.sleep(5)
            else:
                logger.error("All migration attempts failed — DB may be unavailable at startup")

    logger.info(f"✅ Server ready — env={settings.app_env}, port={settings.app_port}")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    import bcrypt
    return {
        "status": "ok",
        "service": "krs-akademik-python",
        "build": "v3-direct-bcrypt",
        "bcrypt_version": bcrypt.__version__,
    }


# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/api")
app.include_router(mahasiswa.router,  prefix="/api")
app.include_router(dosen.router,      prefix="/api")
app.include_router(dashboard.router,  prefix="/api")
