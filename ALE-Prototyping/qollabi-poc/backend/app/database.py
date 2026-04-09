import os
import shutil
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

_SOURCE_DB = Path(os.environ.get("DB_PATH", str(Path(__file__).parent.parent / "data" / "qollabi.db")))

# On Vercel (read-only filesystem), copy DB to /tmp for write support
if os.environ.get("VERCEL") and _SOURCE_DB.exists():
    _TMP_DB = Path("/tmp/qollabi.db")
    if not _TMP_DB.exists():
        shutil.copy2(str(_SOURCE_DB), str(_TMP_DB))
    DATABASE_PATH = _TMP_DB
else:
    DATABASE_PATH = _SOURCE_DB


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database connections with row factory."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialize database with all required tables."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Partners table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS partners (
                account_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                region TEXT,
                country TEXT,
                segment TEXT,
                csm_emails TEXT,
                partner_type TEXT,
                accreditation_level TEXT,
                salesforce_name TEXT,
                strategic_partner TEXT,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # KPI Metrics table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS kpi_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                period TEXT,
                result REAL,
                target REAL,
                achievement REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES partners (account_id)
            )
        """
        )

        # Account Managers table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS account_managers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                region TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # Smart Updates table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS smart_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                target_group TEXT,
                account_manager_email TEXT,
                prompt_used TEXT,
                content TEXT,
                format TEXT,
                status TEXT DEFAULT 'pending',
                delivery_channel TEXT,
                delivery_status TEXT,
                delivered_at TIMESTAMP
            )
        """
        )

        # Prompt Templates table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS prompt_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                target_group TEXT,
                template TEXT,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # Update Schedules table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS update_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                prompt_template_id INTEGER,
                target_group TEXT,
                frequency TEXT,
                delivery_channel TEXT,
                is_active BOOLEAN DEFAULT 1,
                last_run TIMESTAMP,
                next_run TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates (id)
            )
        """
        )

        # Create indexes for common queries
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_kpi_account ON kpi_metrics(account_id)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_kpi_metric ON kpi_metrics(metric_name)"
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partners_region ON partners(region)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partners_segment ON partners(segment)")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_updates_created ON smart_updates(created_at)"
        )

        conn.commit()


def seed_default_prompts():
    """Seed the database with default prompt templates."""
    from app.prompts.templates import (
        LEADERSHIP_SUMMARY_PROMPT,
        ACCOUNT_MANAGER_REVIEW_PROMPT,
        REGIONAL_PERFORMANCE_PROMPT,
        RISK_ALERT_PROMPT,
    )

    default_prompts = [
        {
            "name": "Leadership Weekly Summary",
            "description": "A concise executive summary with key KPIs, top/bottom performers, regional trends",
            "target_group": "leadership",
            "template": LEADERSHIP_SUMMARY_PROMPT,
            "is_default": True,
        },
        {
            "name": "Account Manager Partner Review",
            "description": "Detailed per-partner analysis for an account manager with actionable insights",
            "target_group": "account_manager",
            "template": ACCOUNT_MANAGER_REVIEW_PROMPT,
            "is_default": True,
        },
        {
            "name": "Regional Performance Overview",
            "description": "Regional comparison with benchmarks and trends",
            "target_group": "leadership",
            "template": REGIONAL_PERFORMANCE_PROMPT,
            "is_default": True,
        },
        {
            "name": "Partner Risk Alert",
            "description": "Focus on underperforming partners that need attention",
            "target_group": "account_manager",
            "template": RISK_ALERT_PROMPT,
            "is_default": True,
        },
    ]

    with get_db() as conn:
        cursor = conn.cursor()

        for prompt in default_prompts:
            cursor.execute(
                "SELECT id FROM prompt_templates WHERE name = ?", (prompt["name"],)
            )
            existing = cursor.fetchone()
            if existing is None:
                cursor.execute(
                    """
                    INSERT INTO prompt_templates (name, description, target_group, template, is_default)
                    VALUES (?, ?, ?, ?, ?)
                """,
                    (
                        prompt["name"],
                        prompt["description"],
                        prompt["target_group"],
                        prompt["template"],
                        prompt["is_default"],
                    ),
                )
            else:
                # Update existing empty templates with actual content
                cursor.execute(
                    "UPDATE prompt_templates SET template = ? WHERE id = ? AND (template IS NULL OR template = '')",
                    (prompt["template"], existing["id"]),
                )

        conn.commit()
