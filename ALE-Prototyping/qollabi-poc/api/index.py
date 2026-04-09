"""Vercel serverless entry point for FastAPI."""

import sys
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.main import app  # noqa: F401, E402
