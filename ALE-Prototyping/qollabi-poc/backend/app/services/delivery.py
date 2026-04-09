"""Multi-channel delivery service for updates."""

import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Dict, List, Optional

import httpx
from weasyprint import HTML, CSS


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

        # Attach HTML version
        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
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
    """Generate PDF from HTML content."""

    if output_dir is None:
        output_dir = Path(__file__).parent.parent.parent / "outputs"
        output_dir.mkdir(exist_ok=True)

    filepath = output_dir / filename

    try:
        # Simple HTML to PDF conversion using weasyprint
        HTML(string=content).write_pdf(str(filepath))

        print(f"[SUCCESS] PDF generated: {filepath}")
        return str(filepath)

    except Exception as e:
        print(f"[ERROR] Failed to generate PDF: {str(e)}")
        # Fallback: save as HTML
        try:
            html_filepath = output_dir / filename.replace(".pdf", ".html")
            with open(html_filepath, "w") as f:
                f.write(content)
            print(f"[FALLBACK] Saved as HTML: {html_filepath}")
            return str(html_filepath)
        except Exception as e2:
            print(f"[ERROR] Failed to save HTML fallback: {str(e2)}")
            return None


def deliver_ftp(
    filepath: str,
    ftp_config: Dict,
) -> bool:
    """Upload file via FTP."""

    try:
        from ftplib import FTP

        ftp = FTP(ftp_config.get("host"))
        ftp.login(
            ftp_config.get("username", "anonymous"),
            ftp_config.get("password", ""),
        )

        ftp.cwd(ftp_config.get("path", "/"))

        with open(filepath, "rb") as f:
            ftp.storbinary(f"STOR {Path(filepath).name}", f)

        ftp.quit()

        print(f"[SUCCESS] FTP upload: {filepath}")
        return True

    except Exception as e:
        print(f"[ERROR] FTP upload failed: {str(e)}")
        return False


def deliver_webhook(
    url: str,
    payload: Dict,
) -> bool:
    """Send update via HTTP webhook."""

    try:
        response = httpx.post(
            url,
            json=payload,
            timeout=30.0,
        )

        if response.status_code in [200, 201, 202]:
            print(f"[SUCCESS] Webhook delivered to {url}")
            return True
        else:
            print(f"[ERROR] Webhook returned {response.status_code}")
            return False

    except Exception as e:
        print(f"[ERROR] Webhook delivery failed: {str(e)}")
        return False


def deliver(
    content: str,
    channels: List[str],
    config: Dict,
    subject: str = "ALE Partner Update",
    filename: str = "update.pdf",
) -> Dict:
    """Orchestrate delivery across multiple channels."""

    results = {}

    for channel in channels:
        if channel == "email":
            results["email"] = deliver_email(
                to=config.get("email_to", ""),
                subject=subject,
                html_content=content,
                smtp_config=config.get("smtp"),
            )

        elif channel == "pdf":
            results["pdf"] = deliver_pdf(
                content=content,
                filename=filename,
                output_dir=Path(config.get("pdf_output_dir", "outputs")),
            )

        elif channel == "ftp":
            pdf_path = deliver_pdf(
                content=content,
                filename=filename,
                output_dir=Path(config.get("pdf_output_dir", "outputs")),
            )
            if pdf_path:
                results["ftp"] = deliver_ftp(
                    filepath=pdf_path,
                    ftp_config=config.get("ftp", {}),
                )

        elif channel == "webhook":
            results["webhook"] = deliver_webhook(
                url=config.get("webhook_url", ""),
                payload={
                    "content": content,
                    "subject": subject,
                    "timestamp": datetime.now().isoformat(),
                },
            )

    return results
