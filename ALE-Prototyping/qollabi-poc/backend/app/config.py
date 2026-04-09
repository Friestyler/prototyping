"""Application configuration."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Settings:
    """Application settings."""

    # API Configuration
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(
        ","
    )

    # Database
    DATABASE_PATH = os.getenv(
        "DATABASE_PATH",
        str(Path(__file__).parent.parent / "data" / "qollabi.db"),
    )

    # Anthropic API
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

    # Email Configuration (SMTP)
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_ADDRESS = os.getenv("SMTP_FROM_ADDRESS", "noreply@ale.com")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    # FTP Configuration
    FTP_HOST = os.getenv("FTP_HOST", "")
    FTP_USER = os.getenv("FTP_USER", "")
    FTP_PASSWORD = os.getenv("FTP_PASSWORD", "")
    FTP_PATH = os.getenv("FTP_PATH", "/updates")

    # Webhook Configuration
    WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")

    # PDF Output
    PDF_OUTPUT_DIR = os.getenv("PDF_OUTPUT_DIR", "outputs")

    @classmethod
    def get_smtp_config(cls) -> dict:
        """Get SMTP configuration if complete."""
        if cls.SMTP_HOST and cls.SMTP_USER and cls.SMTP_PASSWORD:
            return {
                "host": cls.SMTP_HOST,
                "port": cls.SMTP_PORT,
                "username": cls.SMTP_USER,
                "password": cls.SMTP_PASSWORD,
                "from_address": cls.SMTP_FROM_ADDRESS,
                "use_tls": cls.SMTP_USE_TLS,
            }
        return None

    @classmethod
    def get_ftp_config(cls) -> dict:
        """Get FTP configuration if complete."""
        if cls.FTP_HOST and cls.FTP_USER and cls.FTP_PASSWORD:
            return {
                "host": cls.FTP_HOST,
                "username": cls.FTP_USER,
                "password": cls.FTP_PASSWORD,
                "path": cls.FTP_PATH,
            }
        return None


settings = Settings()
