import pytest
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database

@pytest.fixture(autouse=True)
def ensure_test_mode():
    """Ensure tests run with DEMO_MODE=True by default for full-pipeline math verification."""
    prev = settings.DEMO_MODE
    settings.DEMO_MODE = True
    yield
    settings.DEMO_MODE = prev
