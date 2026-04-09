"""Smart updates API endpoints."""

import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.database import get_db
from app.services.llm import generate_smart_update
from app.services.delivery import (
    deliver_email_postmark,
    generate_pdf_bytes,
    generate_zip_from_pdfs,
)
from app.services.context import (
    fetch_partner_context,
    fetch_batch_context,
    format_context_for_prompt,
    format_context_html,
)

router = APIRouter(prefix="/api/updates", tags=["updates"])


# ==================== REQUEST MODELS ====================

class GenerateRequest(BaseModel):
    target_group: str = "leadership"
    account_manager_email: Optional[str] = None
    prompt_template_id: Optional[int] = None
    custom_prompt: Optional[str] = None
    include_web_context: bool = False
    delivery_channels: List[str] = ["preview"]
    format: str = "text"
    regions: Optional[List[str]] = None
    additional_context: Optional[str] = None


class BulkGenerateRequest(BaseModel):
    prompt_template_id: Optional[int] = None
    custom_prompt: Optional[str] = None
    include_web_context: bool = False
    regions: Optional[List[str]] = None
    additional_context: Optional[str] = None


class TemplateCreate(BaseModel):
    name: str
    description: str
    target_group: str
    template: str


class ScheduleCreate(BaseModel):
    name: str
    prompt_template_id: int
    target_group: str
    frequency: str
    delivery_channel: str


# ==================== HELPER: build data context for a manager ====================

def _build_manager_context(cursor, email: str, regions: Optional[List[str]] = None) -> dict:
    """Build data context for a specific account manager."""
    data_context = {
        "target_group": "account_manager",
        "account_manager_email": email,
        "format": "html",
    }

    cursor.execute(
        "SELECT * FROM partners WHERE csm_emails LIKE ? LIMIT 50",
        (f"%{email}%",),
    )
    partners = [dict(row) for row in cursor.fetchall()]

    if regions:
        partners = [p for p in partners if p.get("region", "").lower() in [r.lower() for r in regions]]

    data_context["partners"] = partners

    partner_ids = [p["account_id"] for p in partners]
    if partner_ids:
        placeholders = ",".join("?" * len(partner_ids))
        cursor.execute(
            f"SELECT account_id, metric_name, period, result, target, achievement "
            f"FROM kpi_metrics WHERE account_id IN ({placeholders}) ORDER BY account_id, metric_name",
            partner_ids,
        )
        data_context["kpis"] = [dict(row) for row in cursor.fetchall()]
    else:
        data_context["kpis"] = []

    # Summary stats
    cursor.execute("""
        SELECT COUNT(DISTINCT account_id) as partner_count,
               ROUND(AVG(achievement), 2) as avg_achievement,
               COUNT(DISTINCT metric_name) as metric_count
        FROM kpi_metrics
    """)
    data_context["stats"] = dict(cursor.fetchone())

    # Regional summary
    cursor.execute("""
        SELECT p.region, COUNT(DISTINCT p.account_id) as partners,
               ROUND(AVG(k.achievement), 2) as avg_achievement
        FROM partners p JOIN kpi_metrics k ON p.account_id = k.account_id
        WHERE p.region IS NOT NULL GROUP BY p.region
    """)
    data_context["regional_summary"] = [dict(row) for row in cursor.fetchall()]

    return data_context


# ==================== HELPER: generate for one manager ====================

def _generate_for_manager(
    cursor,
    email: str,
    manager_name: str,
    template_content: str,
    custom_prompt: Optional[str],
    include_web_context: bool,
    regions: Optional[List[str]],
    additional_context: Optional[str],
) -> str:
    """Generate a smart update for a single account manager."""
    data_context = _build_manager_context(cursor, email, regions)

    if additional_context:
        data_context["additional_context"] = additional_context

    # Web context enrichment
    web_context_html = ""
    if include_web_context and data_context.get("partners"):
        partner_contexts = fetch_batch_context(data_context["partners"], max_partners=5)
        # Add context to prompt
        context_texts = []
        for pid, ctx in partner_contexts.items():
            text = format_context_for_prompt(ctx)
            if text:
                context_texts.append(text)
            html = format_context_html(ctx)
            if html:
                web_context_html += html

        if context_texts:
            data_context["web_intelligence"] = "\n\n".join(context_texts)

    content = generate_smart_update(
        data_context=data_context,
        prompt_template=template_content,
        target_group="account_manager",
        custom_instructions=custom_prompt,
    )

    # Append web context section if found
    if web_context_html:
        content += f'\n<h4 class="font-semibold text-indigo-800 mt-6 mb-3">Web Intelligence</h4>\n{web_context_html}'

    return content


# ==================== TEMPLATES ROUTES ====================

@router.get("/templates")
def list_templates():
    """List prompt templates."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, description, target_group, is_default, created_at
            FROM prompt_templates ORDER BY is_default DESC, name
        """)
        return [dict(row) for row in cursor.fetchall()]


@router.post("/templates")
def create_template(body: TemplateCreate):
    """Create a custom prompt template."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO prompt_templates (name, description, target_group, template, is_default)
            VALUES (?, ?, ?, ?, 0)
        """, (body.name, body.description, body.target_group, body.template))
        conn.commit()
        return {"id": cursor.lastrowid, "name": body.name, "target_group": body.target_group}


@router.put("/templates/{template_id}")
def update_template(template_id: int, name: Optional[str] = None, description: Optional[str] = None, template: Optional[str] = None):
    """Update a prompt template."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM prompt_templates WHERE id = ?", (template_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Template not found")

        updates, params = [], []
        if name: updates.append("name = ?"); params.append(name)
        if description: updates.append("description = ?"); params.append(description)
        if template: updates.append("template = ?"); params.append(template)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(template_id)
        cursor.execute(f"UPDATE prompt_templates SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        return {"success": True, "id": template_id}


# ==================== SCHEDULES ROUTES ====================

@router.get("/schedules")
def list_schedules():
    """List scheduled updates."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, p.name as template_name
            FROM update_schedules s
            LEFT JOIN prompt_templates p ON s.prompt_template_id = p.id
            ORDER BY s.is_active DESC, s.name
        """)
        return [dict(row) for row in cursor.fetchall()]


@router.post("/schedules")
def create_schedule(body: ScheduleCreate):
    """Create a scheduled update."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO update_schedules (name, prompt_template_id, target_group, frequency, delivery_channel, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (body.name, body.prompt_template_id, body.target_group, body.frequency, body.delivery_channel))
        conn.commit()
        return {"id": cursor.lastrowid, "name": body.name, "frequency": body.frequency, "is_active": True}


# ==================== SINGLE GENERATE ====================

@router.post("/generate")
def generate_update(body: GenerateRequest):
    """Generate a smart update."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get prompt template content
        template_content = ""
        if body.prompt_template_id:
            cursor.execute("SELECT template FROM prompt_templates WHERE id = ?", (body.prompt_template_id,))
            row = cursor.fetchone()
            if row:
                template_content = row["template"]
        elif body.custom_prompt:
            template_content = body.custom_prompt

        # Build data context
        data_context = {
            "target_group": body.target_group,
            "account_manager_email": body.account_manager_email,
            "format": body.format,
        }

        # Get partners for context
        if body.account_manager_email:
            data_context = _build_manager_context(cursor, body.account_manager_email, body.regions)
            data_context["format"] = body.format
        elif body.regions:
            placeholders = ",".join("?" * len(body.regions))
            cursor.execute(f"SELECT * FROM partners WHERE region IN ({placeholders}) LIMIT 100", body.regions)
            partners = [dict(row) for row in cursor.fetchall()]
            data_context["partners"] = partners
            partner_ids = [p["account_id"] for p in partners]
            if partner_ids:
                ph = ",".join("?" * len(partner_ids))
                cursor.execute(f"SELECT account_id, metric_name, period, result, target, achievement FROM kpi_metrics WHERE account_id IN ({ph})", partner_ids)
                data_context["kpis"] = [dict(row) for row in cursor.fetchall()]
        else:
            cursor.execute("SELECT * FROM partners WHERE region IS NOT NULL LIMIT 100")
            data_context["partners"] = [dict(row) for row in cursor.fetchall()]

        # Summary stats
        cursor.execute("""
            SELECT COUNT(DISTINCT account_id) as partner_count,
                   ROUND(AVG(achievement), 2) as avg_achievement,
                   COUNT(DISTINCT metric_name) as metric_count
            FROM kpi_metrics
        """)
        data_context["stats"] = dict(cursor.fetchone())

        # Regional summary
        cursor.execute("""
            SELECT p.region, COUNT(DISTINCT p.account_id) as partners,
                   ROUND(AVG(k.achievement), 2) as avg_achievement
            FROM partners p JOIN kpi_metrics k ON p.account_id = k.account_id
            WHERE p.region IS NOT NULL GROUP BY p.region
        """)
        data_context["regional_summary"] = [dict(row) for row in cursor.fetchall()]

        if body.additional_context:
            data_context["additional_context"] = body.additional_context

        # Web context enrichment
        web_context_html = ""
        if body.include_web_context and data_context.get("partners"):
            partner_contexts = fetch_batch_context(data_context["partners"], max_partners=5)
            context_texts = []
            for pid, ctx in partner_contexts.items():
                text = format_context_for_prompt(ctx)
                if text:
                    context_texts.append(text)
                html = format_context_html(ctx)
                if html:
                    web_context_html += html
            if context_texts:
                data_context["web_intelligence"] = "\n\n".join(context_texts)

        # Generate
        try:
            content = generate_smart_update(
                data_context=data_context,
                prompt_template=template_content,
                target_group=body.target_group,
                custom_instructions=body.custom_prompt,
            )
            if web_context_html:
                content += f'\n<h4 class="font-semibold text-indigo-800 mt-6 mb-3">Web Intelligence</h4>\n{web_context_html}'
        except Exception as e:
            content = f"Error generating update: {str(e)}"

        # Store
        cursor.execute("""
            INSERT INTO smart_updates
            (target_group, account_manager_email, prompt_used, content, format, status, delivery_channel)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (body.target_group, body.account_manager_email, template_content or body.custom_prompt,
              content, body.format, "generated", ",".join(body.delivery_channels)))
        conn.commit()

        return {
            "id": cursor.lastrowid,
            "target_group": body.target_group,
            "account_manager_email": body.account_manager_email,
            "format": body.format,
            "content": content,
            "delivery_channels": body.delivery_channels,
            "status": "generated",
            "created_at": datetime.now().isoformat(),
        }


# ==================== BULK GENERATE + EMAIL ALL ====================

@router.post("/bulk-generate-email")
def bulk_generate_and_email(body: BulkGenerateRequest):
    """Generate updates for ALL account managers and send via email."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get template
        template_content = ""
        if body.prompt_template_id:
            cursor.execute("SELECT template FROM prompt_templates WHERE id = ?", (body.prompt_template_id,))
            row = cursor.fetchone()
            if row:
                template_content = row["template"]

        # Get all account managers
        cursor.execute("SELECT id, email, name, region FROM account_managers ORDER BY name")
        managers = [dict(row) for row in cursor.fetchall()]

        if not managers:
            raise HTTPException(status_code=404, detail="No account managers found")

        results = []
        for mgr in managers:
            email = mgr["email"]
            name = mgr["name"] or email.split("@")[0]

            try:
                content = _generate_for_manager(
                    cursor, email, name, template_content,
                    body.custom_prompt, body.include_web_context,
                    body.regions, body.additional_context,
                )

                # Store in DB
                cursor.execute("""
                    INSERT INTO smart_updates
                    (target_group, account_manager_email, prompt_used, content, format, status, delivery_channel)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, ("account_manager", email, template_content or body.custom_prompt or "",
                      content, "html", "generated", "email"))

                # Send email
                email_result = deliver_email_postmark(
                    to=email,
                    subject=f"Qollabi Partner Update - {name}",
                    html_content=content,
                    manager_name=name,
                )

                if email_result.get("success"):
                    cursor.execute(
                        "UPDATE smart_updates SET status = 'sent', delivery_channel = 'email' WHERE id = ?",
                        (cursor.lastrowid,),
                    )

                results.append({
                    "manager": name,
                    "email": email,
                    "partner_count": len([p for p in (cursor.execute(
                        "SELECT account_id FROM partners WHERE csm_emails LIKE ?", (f"%{email}%",)
                    ).fetchall())]),
                    "status": "sent" if email_result.get("success") else "failed",
                    "mock": email_result.get("mock", False),
                    "error": email_result.get("error"),
                })
            except Exception as e:
                results.append({
                    "manager": name,
                    "email": email,
                    "status": "error",
                    "error": str(e),
                })

        conn.commit()

        sent = sum(1 for r in results if r["status"] == "sent")
        failed = sum(1 for r in results if r["status"] in ("failed", "error"))

        return {
            "total_managers": len(managers),
            "sent": sent,
            "failed": failed,
            "results": results,
        }


# ==================== BULK GENERATE + ZIP DOWNLOAD ====================

@router.post("/bulk-generate-pdf")
def bulk_generate_pdf_zip(body: BulkGenerateRequest):
    """Generate PDF updates for ALL account managers, return as ZIP."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get template
        template_content = ""
        if body.prompt_template_id:
            cursor.execute("SELECT template FROM prompt_templates WHERE id = ?", (body.prompt_template_id,))
            row = cursor.fetchone()
            if row:
                template_content = row["template"]

        # Get all account managers
        cursor.execute("SELECT id, email, name, region FROM account_managers ORDER BY name")
        managers = [dict(row) for row in cursor.fetchall()]

        if not managers:
            raise HTTPException(status_code=404, detail="No account managers found")

        pdf_items = []
        errors = []

        for mgr in managers:
            email = mgr["email"]
            name = mgr["name"] or email.split("@")[0]

            try:
                content = _generate_for_manager(
                    cursor, email, name, template_content,
                    body.custom_prompt, body.include_web_context,
                    body.regions, body.additional_context,
                )

                # Store in DB
                cursor.execute("""
                    INSERT INTO smart_updates
                    (target_group, account_manager_email, prompt_used, content, format, status, delivery_channel)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, ("account_manager", email, template_content or "",
                      content, "pdf", "generated", "pdf"))

                # Generate PDF bytes
                safe_name = re.sub(r'[^\w\s-]', '', name).strip().replace(' ', '_')
                filename = f"Partner_Update_{safe_name}.pdf"
                pdf_bytes = generate_pdf_bytes(content, title=f"Partner Update - {name}")

                pdf_items.append({"filename": filename, "bytes": pdf_bytes})

            except Exception as e:
                errors.append({"manager": name, "error": str(e)})

        conn.commit()

        if not pdf_items:
            raise HTTPException(status_code=500, detail="No PDFs could be generated")

        # Create ZIP
        zip_bytes = generate_zip_from_pdfs(pdf_items)

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="Qollabi_Updates_{datetime.now().strftime("%Y%m%d_%H%M")}.zip"',
            },
        )


# ==================== LIST / GET UPDATES ====================

@router.get("")
def list_updates(
    target_group: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """List generated updates."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM smart_updates WHERE 1=1"
        params = []
        if target_group:
            query += " AND target_group = ?"; params.append(target_group)
        if status:
            query += " AND status = ?"; params.append(status)

        count_query = query.replace("SELECT *", "SELECT COUNT(*) as total")
        cursor.execute(count_query, params)
        total = cursor.fetchone()["total"]

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        cursor.execute(query, params)

        return {"data": [dict(row) for row in cursor.fetchall()], "total": total}


@router.get("/{update_id}")
def get_update(update_id: int):
    """Get a specific update."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM smart_updates WHERE id = ?", (update_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Update not found")
        return dict(row)
