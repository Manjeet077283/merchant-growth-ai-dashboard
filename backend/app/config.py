import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

def _get_demo_mode() -> bool:
    env = os.getenv("ENVIRONMENT", "development").lower()
    raw_demo = os.getenv("DEMO_MODE")
    if raw_demo is not None:
        return raw_demo.lower() in ("true", "1", "yes")
    # In production, default DEMO_MODE to False unless explicitly requested
    return False if env == "production" else True

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./merchant_growth.db")
    # SQLAlchemy 2.0 requires postgresql:// instead of legacy postgres://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class Settings(BaseModel):
    PROJECT_NAME: str = "Merchant Growth AI — Intelligent Business Agent"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = _get_demo_mode()

    # Database
    DATABASE_URL: str = _get_database_url()

    @property
    def database_type(self) -> str:
        return "PostgreSQL" if "postgres" in self.DATABASE_URL.lower() else "SQLite"

    # PayPal REST API Sandbox / Live
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_MODE: str = os.getenv("PAYPAL_MODE", "sandbox")
    PAYPAL_WEBHOOK_ID: str = os.getenv("PAYPAL_WEBHOOK_ID", "")
    PAYPAL_API_BASE: str = (
        "https://api-m.sandbox.paypal.com"
        if os.getenv("PAYPAL_MODE", "sandbox") == "sandbox"
        else "https://api-m.paypal.com"
    )

    # AI Configuration (Gemini API)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Server Settings
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # CORS
    @property
    def cors_origins_list(self) -> list[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://merchant-growth-ai-dashboard.onrender.com"
        ]
        raw = os.getenv("CORS_ORIGINS", "")
        if raw:
            for item in raw.split(","):
                cleaned = item.strip()
                if cleaned and cleaned != "*" and cleaned not in origins:
                    origins.append(cleaned)
        return origins

settings = Settings()

