"""Partners API endpoints."""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.database import get_db

router = APIRouter(prefix="/api/partners", tags=["partners"])


@router.get("/account-managers")
def list_account_managers():
    """List all account managers."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, region FROM account_managers ORDER BY name")
        return [dict(row) for row in cursor.fetchall()]


@router.get("/by-manager/{email:path}")
def get_partners_by_manager(email: str, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    """Get partners for a specific account manager."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM account_managers WHERE email = ?", (email,))
        manager = cursor.fetchone()
        if not manager:
            raise HTTPException(status_code=404, detail="Account manager not found")

        cursor.execute("""
            SELECT * FROM partners WHERE csm_emails LIKE ? ORDER BY name LIMIT ? OFFSET ?
        """, (f"%{email}%", limit, skip))
        partners = [dict(row) for row in cursor.fetchall()]

        cursor.execute("SELECT COUNT(*) as total FROM partners WHERE csm_emails LIKE ?", (f"%{email}%",))
        total = cursor.fetchone()["total"]

        return {"manager": dict(manager), "partners": partners, "total": total}


@router.get("")
def list_partners(
    region: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    csm_email: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List all partners with optional filters."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM partners WHERE 1=1"
        params = []

        if region:
            query += " AND region = ?"
            params.append(region)
        if segment:
            query += " AND segment = ?"
            params.append(segment)
        if csm_email:
            query += " AND csm_emails LIKE ?"
            params.append(f"%{csm_email}%")
        if search:
            query += " AND (name LIKE ? OR account_id LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])

        # Count
        count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        query += " ORDER BY name LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        cursor.execute(query, params)

        return {"data": [dict(row) for row in cursor.fetchall()], "total": total, "skip": skip, "limit": limit}


@router.get("/{account_id}")
def get_partner_detail(account_id: str):
    """Get partner detail with all KPIs."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM partners WHERE account_id = ?", (account_id,))
        partner = cursor.fetchone()
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

        partner_dict = dict(partner)
        cursor.execute("""
            SELECT metric_name, period, result, target, achievement
            FROM kpi_metrics WHERE account_id = ? ORDER BY metric_name, period
        """, (account_id,))
        partner_dict["kpis"] = [dict(row) for row in cursor.fetchall()]
        return partner_dict
