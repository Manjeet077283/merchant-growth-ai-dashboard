import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routers import health, metrics, transactions, paypal, ai_agent

# Simple sliding window rate limiter: max 60 requests/minute on sensitive routes
rate_limit_records = defaultdict(list)

class SecurityAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        if path in ("/api/ai/chat", "/api/paypal/create-order"):
            now = time.time()
            cutoff = now - 60.0
            rate_limit_records[client_ip] = [t for t in rate_limit_records[client_ip] if t > cutoff]
            if len(rate_limit_records[client_ip]) >= 60:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please wait a minute before retrying."}
                )
            rate_limit_records[client_ip].append(now)

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed initial demo data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Merchant Growth AI: Intelligent Business Agent for Small Merchants using PayPal Sandbox & AI",
    lifespan=lifespan
)

# Attach Security and Rate Limiting Middleware
app.add_middleware(SecurityAndRateLimitMiddleware)

# CORS Middleware with explicit trusted origins, wildcard-safe credentials, and Render domain regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Exception handlers ensuring CORS headers and clean JSON errors on any failure
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin") or "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server processing error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

# Root-level health check alias
@app.get("/health", tags=["Health"])
def root_health():
    return health.get_health()

# Register Routers
app.include_router(health.router)
app.include_router(metrics.router)
app.include_router(transactions.router)
app.include_router(paypal.router)
app.include_router(ai_agent.router)

# Mount frontend/dist if built (for unified production deployment on Render)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist) and os.path.isdir(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs_url": "/docs",
            "health_check": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
