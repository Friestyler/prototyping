#!/usr/bin/env python3
"""Import partner and KPI data from Excel file into SQLite database."""

import argparse
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.database import get_db, init_db, seed_default_prompts


def import_partners(excel_path: str) -> int:
    """Import from both Partner List (rich metadata) and Aggregation (KPI-linked partners)."""
    count = 0
    pl = pd.read_excel(excel_path, sheet_name="Partner List")
    agg = pd.read_excel(excel_path, sheet_name="Aggregation")

    with get_db() as conn:
        cur = conn.cursor()

        # First pass: Partner List for rich metadata
        for _, r in pl.iterrows():
            aid = str(r.get("ACCOUNT::ID", "")).strip()
            if not aid or aid == "nan":
                continue
            name = str(r.get("ACCOUNT::NAME", "")).strip()
            csm = str(r.get("ACCOUNT::AM", "")).strip()
            region = str(r.get("ACCOUNT::TM_ACCCOUNTRYREGION", "")).strip()
            country = str(r.get("ACCOUNT::COUNTRY", "")).strip()
            segment = str(r.get("ACCOUNT::STRATEGIC_PARTNER", "")).strip()
            partner_type = str(r.get("ACCOUNT::PARTNER_TYPE", "")).strip()
            accred = str(r.get("ACCOUNT::ACCREDITATION_PARTNER_LEVEL", "")).strip()
            sf_name = str(r.get("ACCOUNT::SALESFORCE_NAME", "")).strip()
            status = str(r.get("ACCOUNT::GESDP_STATUS", "")).strip()

            def clean(v):
                return v if v and v != "nan" else None

            cur.execute("""
                INSERT OR REPLACE INTO partners
                (account_id, name, region, country, segment, csm_emails,
                 partner_type, accreditation_level, salesforce_name, strategic_partner, status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (aid, clean(name), clean(region), clean(country), clean(segment),
                  clean(csm), clean(partner_type), clean(accred), clean(sf_name),
                  clean(segment), clean(status)))
            count += 1

        # Second pass: Aggregation sheet may have partners not in Partner List, plus has region/segment
        for _, r in agg.iterrows():
            aid = str(r.get("Account ID", "")).strip()
            if not aid or aid == "nan":
                continue
            name = str(r.get("Partner name", "")).strip()
            csm = str(r.get("CSM", "")).strip()
            region = str(r.get("Region", "")).strip()
            country = str(r.get("Country", "")).strip()
            segment = str(r.get("Partner Segment", "")).strip()

            def clean(v):
                return v if v and v != "nan" else None

            # Update with aggregation data (which has cleaner region/segment)
            cur.execute("""
                INSERT INTO partners (account_id, name, region, country, segment, csm_emails)
                VALUES (?,?,?,?,?,?)
                ON CONFLICT(account_id) DO UPDATE SET
                    region = COALESCE(excluded.region, partners.region),
                    country = COALESCE(excluded.country, partners.country),
                    segment = COALESCE(excluded.segment, partners.segment),
                    csm_emails = COALESCE(excluded.csm_emails, partners.csm_emails)
            """, (aid, clean(name), clean(region), clean(country), clean(segment), clean(csm)))

        conn.commit()
    return count


def import_kpi_metrics(excel_path: str) -> int:
    """Import KPI metrics from Aggregation sheet, normalizing wide format to long."""
    agg = pd.read_excel(excel_path, sheet_name="Aggregation")
    count = 0
    cols = list(agg.columns)

    # Map of metric categories and their column name patterns
    standard_metrics = [
        ("Business Plan Setup and Acceptance",
         "Business Plan Setup and Acceptance - Result",
         "Business Plan Setup and Acceptance - Target",
         "Business Plan Setup and Acceptance - Achievement"),
        ("Sales IN Revenues vs Sales target",
         "Sales IN Revenues vs Sales target - Result",
         "Sales IN Revenues vs Sales target - Target",
         "Sales IN Revenues vs Sales target - Achievement"),
        ("Certifications achievements vs recommended",
         "Certifications achievements vs recommended - Result",
         "Certifications achievements vs recommended - Target",
         "Certifications achievements vs recommended - Achievement"),
        ("Marketing Plan",
         "Marketing Plan (extract summary from SF) - Result",
         "Marketing Plan (extract summary from SF) - Target",
         "Marketing Plan (extract summary from SF) - Achievement"),
    ]

    # Communications and Networking certs have .1 suffix for target
    comm_cert = ("Communications Certifications",
                 "Communications - Certifications achievements vs recommended - Result",
                 "Communications - Certifications achievements vs recommended - Result.1",
                 "Communications - Certifications achievements vs recommended - Achievement")
    net_cert = ("Networking Certifications",
                "Networking - Certifications achievements vs recommended - Result",
                "Networking - Certifications achievements vs recommended - Result.1",
                "Networking - Certifications achievements vs recommended - Achievement")

    # Quarterly pipeline patterns
    quarterly_periods = []
    for q in ["Q1", "Q2", "Q3", "Q4"]:
        quarterly_periods.append((f"{q} 2025",
            f"Quarterly Pipeline vs Target Pipeline - Result - {q}",
            f"Quarterly Pipeline vs Target Pipeline - Target - {q}",
            f"Quarterly Pipeline vs Target Pipeline - Achievement - {q}"))
    quarterly_periods.append(("2025 Total",
        "Quarterly Pipeline vs Target Pipeline - Result - 2025 Total",
        "Quarterly Pipeline vs Target Pipeline - Target - 2025 Total",
        "Quarterly Pipeline vs Target Pipeline - Achievement - 2025 Total"))
    for q in ["Q1", "Q2", "Q3", "Q4"]:
        quarterly_periods.append((f"{q} 2026",
            f"Quarterly Pipeline vs Target Pipeline - Result - {q} 2026",
            f"Quarterly Pipeline vs Target Pipeline - Target - {q} 2026",
            f"Quarterly Pipeline vs Target Pipeline - Achievement - {q} 2026"))
    quarterly_periods.append(("2026 Total",
        "Quarterly Pipeline vs Target Pipeline - Result - 2026 Total",
        "Quarterly Pipeline vs Target Pipeline - Target - 2026 Total",
        None))  # No achievement column for 2026 total

    with get_db() as conn:
        cur = conn.cursor()

        for _, row in agg.iterrows():
            aid = str(row.get("Account ID", "")).strip()
            if not aid or aid == "nan":
                continue

            # Standard metrics
            for metric_name, r_col, t_col, a_col in standard_metrics:
                result = row.get(r_col) if r_col in cols else None
                target = row.get(t_col) if t_col in cols else None
                achievement = row.get(a_col) if a_col in cols else None

                result = float(result) if pd.notna(result) else None
                target = float(target) if pd.notna(target) else None
                achievement = float(achievement) if pd.notna(achievement) else None

                if result is None and target is None and achievement is None:
                    continue

                cur.execute("""
                    INSERT INTO kpi_metrics (account_id, metric_name, period, result, target, achievement)
                    VALUES (?,?,?,?,?,?)
                """, (aid, metric_name, "Current", result, target, achievement))
                count += 1

            # Communications and Networking certs
            for metric_name, r_col, t_col, a_col in [comm_cert, net_cert]:
                result = row.get(r_col) if r_col in cols else None
                target = row.get(t_col) if t_col in cols else None
                achievement = row.get(a_col) if a_col in cols else None

                result = float(result) if pd.notna(result) else None
                target = float(target) if pd.notna(target) else None
                achievement = float(achievement) if pd.notna(achievement) else None

                if result is None and target is None and achievement is None:
                    continue

                cur.execute("""
                    INSERT INTO kpi_metrics (account_id, metric_name, period, result, target, achievement)
                    VALUES (?,?,?,?,?,?)
                """, (aid, metric_name, "Current", result, target, achievement))
                count += 1

            # Quarterly pipeline
            for period, r_col, t_col, a_col in quarterly_periods:
                result = row.get(r_col) if r_col in cols else None
                target = row.get(t_col) if t_col in cols else None
                achievement = row.get(a_col) if a_col and a_col in cols else None

                result = float(result) if pd.notna(result) else None
                target = float(target) if pd.notna(target) else None
                achievement = float(achievement) if pd.notna(achievement) else None

                if result is None and target is None and achievement is None:
                    continue

                cur.execute("""
                    INSERT INTO kpi_metrics (account_id, metric_name, period, result, target, achievement)
                    VALUES (?,?,?,?,?,?)
                """, (aid, "Quarterly Pipeline vs Target", period, result, target, achievement))
                count += 1

        conn.commit()
    return count


def import_account_managers(excel_path: str) -> int:
    """Extract unique account managers from Aggregation CSM field + Context recipients."""
    agg = pd.read_excel(excel_path, sheet_name="Aggregation")
    ctx = pd.read_excel(excel_path, sheet_name="Context")
    count = 0
    seen = set()

    with get_db() as conn:
        cur = conn.cursor()

        # From Context sheet - named recipients with regions
        recipients = [
            ("Juergen Reintjes", "juergen.reintjes@al-enterprise.com", "germany"),
            ("Marcos Rodrigues", "marcos.rodriguez@al-enterprise.com", "emea"),
            ("Michael-J Francis", "michael-j.francis@al-enterprise.com", "americas"),
        ]
        for name, email, region in recipients:
            cur.execute("INSERT OR IGNORE INTO account_managers (email, name, region) VALUES (?,?,?)",
                        (email, name, region))
            seen.add(email)
            count += 1

        # From Aggregation CSM field
        for _, row in agg.iterrows():
            csm = str(row.get("CSM", "")).strip()
            region = str(row.get("Region", "")).strip()
            if not csm or csm == "nan":
                continue

            for email in [e.strip() for e in csm.split(",")]:
                if not email or email in seen:
                    continue
                name = email.split("@")[0].replace(".", " ").replace("-", " ").title() if "@" in email else email
                rgn = region if region != "nan" else None
                cur.execute("INSERT OR IGNORE INTO account_managers (email, name, region) VALUES (?,?,?)",
                            (email, name, rgn))
                seen.add(email)
                count += 1

        conn.commit()
    return count


def main():
    parser = argparse.ArgumentParser(description="Import partner and KPI data from Excel")
    parser.add_argument("excel_file", nargs="?",
        default="/sessions/ecstatic-elegant-cannon/mnt/uploads/ALE Leadership smart update.xlsx")
    args = parser.parse_args()

    excel_path = args.excel_file
    if not Path(excel_path).exists():
        print(f"Error: {excel_path} not found")
        sys.exit(1)

    print(f"Importing data from {excel_path}...")
    print("Initializing database...")
    init_db()
    seed_default_prompts()

    print("\nImporting Partners...")
    pc = import_partners(excel_path)
    print(f"  Imported {pc} partners")

    print("\nImporting KPI Metrics...")
    kc = import_kpi_metrics(excel_path)
    print(f"  Imported {kc} KPI metrics")

    print("\nImporting Account Managers...")
    ac = import_account_managers(excel_path)
    print(f"  Imported {ac} account managers")

    # Summary
    from app.database import DATABASE_PATH
    import sqlite3
    conn = sqlite3.connect(str(DATABASE_PATH))
    for table in ["partners", "kpi_metrics", "account_managers", "prompt_templates"]:
        n = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {n} rows")
    conn.close()

    print("\nData import completed successfully!")


if __name__ == "__main__":
    main()
