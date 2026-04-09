"""Vercel serverless entry point for FastAPI."""

import os
import sys
from pathlib import Path

# Resolve backend path - works both locally and on Vercel
_project_root = Path(__file__).resolve().parent.parent
_backend_path = _project_root / "backend"
sys.path.insert(0, str(_backend_path))

# Set DB path explicitly before importing app
os.environ.setdefault("DB_PATH", str(_backend_path / "data" / "qollabi.db"))

from app.main import app  # noqa: F401, E402
