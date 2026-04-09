"""Multi-channel delivery service for updates."""

import io
import os
import smtplib
import zipfile
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, List, Optional

import httpx


# ==================== POSTMARK EMAIL ====================

POSTMARK_API_URL = "https://api.postmarkapp.com/email"
POSTMARK_SERVER_TOKEN = os.getenv("POSTMARK_SERVER_TOKEN", "")
POSTMARK_FROM_ADDRESS = os.getenv("POSTMARK_FROM_ADDRESS", "frie@qollabi.com")
# PoC safety: override all recipient emails to this address
POC_TEST_EMAIL = os.getenv("POC_TEST_EMAIL", "frie@qollabi.com")


def _wrap_email_html(content: str, title: str = "Partner Update") -> str:
    """Wrap update content in a styled email template."""
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f3f4f6; }}
  .container {{ max-width: 700px; margin: 0 auto; background: white; }}
  .header {{ background: linear-gradient(135deg, #1e3a5f, #1e40af); color: white; padding: 24px 32px; }}
  .header h1 {{ margin: 0; font-size: 20px; font-weight: 600; }}
  .header p {{ margin: 4px 0 0; font-size: 12px; opacity: 0.8; }}
  .body {{ padding: 32px; color: #1f2937; line-height: 1.6; font-size: 14px; }}
  .body h3 {{ font-size: 18px; color: #1e3a5f; margin-top: 24px; }}
  .body h4 {{ font-size: 15px; color: #374151; margin-top: 16px; }}
  .body table {{ width: 100%; border-collapse: collapse; margin: 12px 0; }}
  .body th {{ background: #f3f4f6; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 13px; }}
  .body td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }}
  .body ul, .body ol {{ padding-left: 20px; }}
  .body li {{ margin: 4px 0; }}
  .footer {{ background: #f9fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; }}
  .kpi-card {{ display: inline-block; background: #eff6ff; border-radius: 8px; padding: 12px 16px; text-align: center; margin: 4px; min-width: 120px; }}
</style>
</head><body>
<div class="container">
  <div class="header">
    <h1>Qollabi 2.0 | {title}</h1>
    <p>Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}</p>
  </div>
  <div class="body">{content}</div>
  <div class="footer">
    Qollabi 2.0 &mdash; ALE Partner Intelligence Platform<br>
    This is an automated report. Please do not reply to this email.
  </div>
</div>
</body></html>"""


def deliver_email_postmark(
    to: str,
    subject: str,
    html_content: str,
    manager_name: str = "",
) -> Dict:
    """Deliver update via Postmark API."""

    token = POSTMARK_SERVER_TOKEN
    # PoC safety: always send to test email
    actual_to = POC_TEST_EMAIL if POC_TEST_EMAIL else to

    if not token:
        print(f"[MOCK] Postmark email to {actual_to} (intended: {to}): {subject}")
        return {"success": True, "mock": True, "to": actual_to, "intended_to": to}

    try:
        wrapped_html = _wrap_email_html(html_content, subject)
        payload = {
            "From": POSTMARK_FROM_ADDRESS,
            "To": actual_to,
            "Subject": subject,
            "HtmlBody": wrapped_html,
            "TextBody": f"Partner Update for {manager_name or to}. View in HTML-capable email client.",
            "MessageStream": "outbound",
            "Tag": "smart-update",
        }

        response = httpx.post(
            POSTMARK_API_URL,
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": token,
            },
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Postmark email sent to {actual_to} (MessageID: {data.get('MessageID')})")
            return {"success": True, "mock": False, "to": actual_to, "message_id": data.get("MessageID")}
        else:
            error = response.text
            print(f"[ERROR] Postmark error ({response.status_code}): {error}")
            return {"success": False, "mock": False, "to": actual_to, "error": error}

    except Exception as e:
        print(f"[ERROR] Postmark delivery failed: {str(e)}")
        return {"success": False, "mock": False, "to": actual_to, "error": str(e)}


# ==================== PDF GENERATION ====================

def generate_pdf_bytes(html_content: str, title: str = "Partner Update") -> bytes:
    """Generate PDF from HTML content, return as bytes."""
    full_html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 30px auto; padding: 0 20px; color: #1f2937; line-height: 1.6; font-size: 13px; }}
  h3 {{ font-size: 16px; font-weight: 700; color: #1e3a5f; margin-top: 20px; }}
  h4 {{ font-size: 14px; font-weight: 600; color: #374151; margin-top: 14px; }}
  table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
  th {{ background: #f3f4f6; padding: 6px 10px; text-align: left; font-weight: 600; font-size: 12px; }}
  td {{ padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }}
  ul, ol {{ padding-left: 20px; }} li {{ margin: 3px 0; }}
  .text-green-600 {{ color: #16a34a; }} .text-red-600 {{ color: #dc2626; }}
  .text-blue-700 {{ color: #1d4ed8; }} .text-teal-700 {{ color: #0f766e; }}
  .text-amber-700 {{ color: #b45309; }}
  .bg-blue-50 {{ background: #eff6ff; padding: 10px; border-radius: 6px; text-align: center; }}
  .bg-teal-50 {{ background: #f0fdfa; padding: 10px; border-radius: 6px; text-align: center; }}
  .bg-amber-50 {{ background: #fffbeb; padding: 10px; border-radius: 6px; text-align: center; }}
  .bg-red-50 {{ background: #fef2f2; padding: 10px; border-radius: 6px; text-align: center; }}
  .bg-green-50 {{ background: #f0fdf4; padding: 10px; border-radius: 6px; text-align: center; }}
  .grid {{ display: flex; gap: 10px; margin: 10px 0; }}
  .grid > div {{ flex: 1; }}
  @page {{ margin: 1.5cm; size: A4; }}
</style>
</head><body>
<div style="border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 16px;">
  <h2 style="color: #1e3a5f; margin: 0; font-size: 18px;">Qollabi 2.0 | {title}</h2>
  <p style="color: #6b7280; font-size: 11px; margin: 3px 0 0;">Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}</p>
</div>
{html_content}
<div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 10px; color: #9ca3af; font-size: 10px;">
  Qollabi 2.0 &mdash; ALE Partner Intelligence Platform
</div>
</body></html>"""

    try:
        from weasyprint import HTML
        return HTML(string=full_html).write_pdf()
    except Exception as e:
        print(f"[WARN] WeasyPrint not available ({e}), returning HTML as fallback")
        return full_html.encode("utf-8")


def generate_zip_from_pdfs(pdf_items: List[Dict]) -> bytes:
    """Generate a ZIP file from a list of {filename, content_bytes} dicts."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for item in pdf_items:
            zf.writestr(item["filename"], item["bytes"])
    zip_buffer.seek(0)
    return zip_buffer.read()


# ==================== LEGACY SMTP (kept for compatibility) ====================

def deliver_email(
    to: str,
    subject: str,
    html_content: str,
    smtp_config: Optional[Dict] = None,
) -> bool:
    """Deliver update via email using SMTP."""
    if not smtp_config:
        print(f"[MOCK] Email delivery to {to}: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_config.get("from_address", "noreply@ale.com")
        msg["To"] = to
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_config.get("host"), smtp_config.get("port", 587)) as server:
            if smtp_config.get("use_tls", True):
                server.starttls()
            if smtp_config.get("username") and smtp_config.get("password"):
                server.login(smtp_config["username"], smtp_config["password"])
            server.send_message(msg)

        print(f"[SUCCESS] Email sent to {to}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email to {to}: {str(e)}")
        return False


def deliver_pdf(
    content: str,
    filename: str,
    output_dir: Optional[Path] = None,
) -> Optional[str]:
    """Generate PDF from HTML content to file."""
    if output_dir is None:
        output_dir = Path(__file__).parent.parent.parent / "outputs"
        output_dir.mkdir(exist_ok=True)

    filepath = output_dir / filename
    try:
        from weasyprint import HTML
        HTML(string=content).write_pdf(str(filepath))
        print(f"[SUCCESS] PDF generated: {filepath}")
        return str(filepath)
    except Exception as e:
        print(f"[ERROR] Failed to generate PDF: {str(e)}")
        try:
            html_filepath = output_dir / filename.replace(".pdf", ".html")
            with open(html_filepath, "w") as f:
                f.write(content)
            return str(html_filepath)
        except Exception:
            return None


def deliver_ftp(filepath: str, ftp_config: Dict) -> bool:
    """Upload file via FTP."""
    try:
        from ftplib import FTP
        ftp = FTP(ftp_config.get("host"))
        ftp.login(ftp_config.get("username", "anonymous"), ftp_config.get("password", ""))
        ftp.cwd(ftp_config.get("path", "/"))
        with open(filepath, "rb") as f:
            ftp.storbinary(f"STOR {Path(filepath).name}", f)
        ftp.quit()
        return True
    except Exception as e:
        print(f"[ERROR] FTP upload failed: {str(e)}")
        return False


def deliver_webhook(url: str, payload: Dict) -> bool:
    """Send update via HTTP webhook."""
    try:
        response = httpx.post(url, json=payload, timeout=30.0)
        return response.status_code in [200, 201, 202]
    except Exception as e:
        print(f"[ERROR] Webhook delivery failed: {str(e)}")
        return False
