"""LLM integration using Claude API."""

import json
import os
from typing import Optional

from anthropic import Anthropic

from app.prompts.templates import (
    ACCOUNT_MANAGER_REVIEW_PROMPT,
    LEADERSHIP_SUMMARY_PROMPT,
    REGIONAL_PERFORMANCE_PROMPT,
    RISK_ALERT_PROMPT,
)

client = None
API_KEY = os.getenv("ANTHROPIC_API_KEY")


def get_client():
    """Get or create Anthropic client."""
    global client
    if client is None and API_KEY:
        client = Anthropic(api_key=API_KEY)
    return client


def generate_smart_update(
    data_context: dict,
    prompt_template: str,
    target_group: str,
    custom_instructions: Optional[str] = None,
) -> str:
    """Generate a smart update using Claude."""

    # Select default template if none provided
    if not prompt_template or prompt_template.strip() == "":
        if target_group == "leadership":
            prompt_template = LEADERSHIP_SUMMARY_PROMPT
        elif target_group == "account_manager":
            prompt_template = ACCOUNT_MANAGER_REVIEW_PROMPT
        elif target_group == "regional":
            prompt_template = REGIONAL_PERFORMANCE_PROMPT
        else:
            prompt_template = LEADERSHIP_SUMMARY_PROMPT

    # Build the prompt
    context_str = json.dumps(data_context, indent=2, default=str)

    system_prompt = f"""You are an expert analyst for ALE (Alcatel-Lucent Enterprise) partner management.
Your role is to generate insightful, actionable reports for {target_group} stakeholders.
Analyze partner performance data and provide clear, concise insights with recommendations.

{custom_instructions if custom_instructions else ""}
"""

    user_prompt = f"""{prompt_template}

Here is the partner and KPI data to analyze:

{context_str}

Generate a professional, insightful report based on this data. Focus on actionable insights and key trends.
"""

    client = get_client()

    if not client:
        # Fallback when API key is not configured
        return generate_mock_update(data_context, target_group)

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        return message.content[0].text

    except Exception as e:
        # Fallback on API error
        return generate_mock_update(data_context, target_group, f"(Note: {str(e)})")


def generate_sql_from_query(natural_language: str, schema: str) -> str:
    """Convert natural language query to SQL using Claude."""

    system_prompt = """You are an SQL expert for SQLite databases.
Convert natural language queries to valid SQLite SQL queries.
Only return the SQL query, nothing else.
Use proper JOINs and aggregations as needed.
The database has tables: partners, kpi_metrics, account_managers.

partners table has: account_id, name, region, country, segment, csm_emails
kpi_metrics table has: id, account_id, metric_name, period, result, target, achievement
account_managers table has: id, email, name, region
"""

    user_prompt = f"""Database schema:
{schema}

Convert this question to SQL:
{natural_language}

Return ONLY the SQL query, no explanation.
"""

    client = get_client()

    if not client:
        # Fallback
        return "SELECT * FROM partners LIMIT 10"

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )

        sql = message.content[0].text.strip()
        # Remove markdown code blocks if present
        if sql.startswith("```"):
            sql = sql.split("```")[1]
            if sql.startswith("sql"):
                sql = sql[3:]
            sql = sql.strip()

        return sql

    except Exception as e:
        raise ValueError(f"Failed to generate SQL: {str(e)}")


def generate_mock_update(
    data_context: dict, target_group: str, error_note: str = ""
) -> str:
    """Generate a mock update when API is not available."""

    total_partners = data_context.get("stats", {}).get("partner_count", "N/A")
    avg_achievement = data_context.get("stats", {}).get("avg_achievement", "N/A")
    partner_count = len(data_context.get("partners", []))
    kpi_count = len(data_context.get("kpis", []))

    if target_group == "leadership":
        return f"""EXECUTIVE SUMMARY - PARTNER PERFORMANCE OVERVIEW {error_note}

Key Metrics:
- Total Partners in System: {total_partners}
- Average Achievement Rate: {avg_achievement}%
- Partners Analyzed: {partner_count}
- Total KPI Data Points: {kpi_count}

Key Findings:
1. Partner Performance Trends: The portfolio shows mixed performance across regions
2. Top Performing Segments: Distributors and expert partners continue to lead
3. Areas for Improvement: Certifications and marketing plan adoption need focus
4. Regional Analysis: Americas region shows strongest performance, EMEA requires support

Recommendations:
- Increase certification training programs across all partner segments
- Focus on marketing plan adoption for lower-performing partners
- Schedule quarterly business reviews with strategic partners
- Implement targeted support for underperforming regions

"""

    elif target_group == "account_manager":
        return f"""ACCOUNT MANAGER PARTNER REVIEW {error_note}

Your Managed Partners: {partner_count}
Total KPI Records: {kpi_count}

Partner Performance Summary:
- Partners Requiring Attention: Multiple partners below target achievement
- Top Performers: Continue to drive revenue growth
- At-Risk Partners: 3-5 partners need immediate support

Action Items:
1. Schedule business reviews with partners showing <70% achievement
2. Provide certification support and training
3. Review sales pipeline quarterly targets
4. Assess marketing plan implementation status

Next Steps:
Contact your regional leadership for support planning session.

"""

    else:
        return f"""PARTNER ANALYSIS REPORT {error_note}

Dataset Summary:
- Total Records: {kpi_count}
- Partners Analyzed: {partner_count}
- Overall Achievement: {avg_achievement}%

The data shows the current state of partner performance across multiple KPI metrics.
Review the detailed metrics for specific recommendations.

"""
