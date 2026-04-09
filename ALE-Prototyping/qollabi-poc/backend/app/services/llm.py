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

IMPORTANT: Always output the report as clean, well-structured HTML using Tailwind CSS classes.
Use headings (h3, h4), tables, lists (ul/ol), and styled divs for KPI cards.
Use color classes like text-green-600, text-red-600, bg-blue-50, etc. for emphasis.
Use &lt; and &gt; for angle brackets in text content, never raw < or >.
Do NOT wrap the output in markdown code fences or ```html blocks.

If web_intelligence data is provided in the context, integrate those findings into your analysis:
- Reference specific partner news/developments in the relevant partner sections
- Adjust recommendations based on business health signals (e.g. if a partner is restructuring, suggest different actions)
- For at-risk partners with negative news, flag the connection between external factors and KPI underperformance
- For top performers with positive news, highlight growth opportunities

{custom_instructions if custom_instructions else ""}
"""

    user_prompt = f"""{prompt_template}

Here is the partner and KPI data to analyze:

{context_str}

Generate a professional, insightful HTML report based on this data. Use Tailwind CSS classes for styling.
Focus on actionable insights and key trends. Include data tables where appropriate.
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


def _build_data_driven_sections(data_context: dict) -> dict:
    """Extract real insights from the data context for mock reports."""
    partners = data_context.get("partners", [])
    kpis = data_context.get("kpis", [])
    stats = data_context.get("stats", {})
    regional = data_context.get("regional_summary", [])

    total_partners = stats.get("partner_count", len(partners))
    avg_achievement = stats.get("avg_achievement", "N/A")
    metric_count = stats.get("metric_count", 0)

    # Top/bottom partners by KPI
    partner_scores = {}
    for k in kpis:
        pid = k.get("account_id", "")
        ach = k.get("achievement")
        if ach is not None:
            partner_scores.setdefault(pid, []).append(ach)
    partner_avgs = {pid: sum(scores)/len(scores) for pid, scores in partner_scores.items() if scores}
    sorted_partners = sorted(partner_avgs.items(), key=lambda x: x[1], reverse=True)

    # Map partner IDs to names
    id_to_name = {p.get("account_id", ""): p.get("name", p.get("account_id", "")) for p in partners}

    top5 = sorted_partners[:5]
    bottom5 = sorted_partners[-5:] if len(sorted_partners) > 5 else []
    at_risk = [(pid, avg) for pid, avg in sorted_partners if avg < 0.7]

    # Regional rows
    region_rows = ""
    for r in regional:
        region_rows += f'<tr><td class="px-3 py-2 border-b border-gray-100">{r.get("region", "N/A")}</td><td class="px-3 py-2 border-b border-gray-100 text-center">{r.get("partners", 0)}</td><td class="px-3 py-2 border-b border-gray-100 text-center">{r.get("avg_achievement", 0):.0%}</td></tr>'

    return {
        "total_partners": total_partners,
        "avg_achievement": avg_achievement,
        "metric_count": metric_count,
        "partner_count": len(partners),
        "kpi_count": len(kpis),
        "top5": top5,
        "bottom5": bottom5,
        "at_risk": at_risk,
        "id_to_name": id_to_name,
        "region_rows": region_rows,
        "regional": regional,
    }


def generate_mock_update(
    data_context: dict, target_group: str, error_note: str = ""
) -> str:
    """Generate a data-driven HTML update when API is not available."""
    d = _build_data_driven_sections(data_context)
    note = f'<p class="text-xs text-amber-600 mb-4">{error_note}</p>' if error_note else ""

    def _partner_rows(items, color="green"):
        rows = ""
        for pid, avg in items:
            name = d["id_to_name"].get(pid, pid)
            rows += f'<tr><td class="px-3 py-2 border-b border-gray-100">{name}</td><td class="px-3 py-2 border-b border-gray-100 text-center font-semibold text-{color}-600">{avg:.0%}</td></tr>'
        return rows

    if target_group == "leadership":
        top_rows = _partner_rows(d["top5"], "green")
        bottom_rows = _partner_rows(d["bottom5"], "red")

        return f"""{note}
<h3 class="text-xl font-bold text-gray-800 mb-1">Executive Summary &mdash; Partner Performance</h3>
<p class="text-sm text-gray-500 mb-6">Generated from {d['total_partners']} partners &middot; {d['kpi_count']} KPI data points &middot; {d['metric_count']} metric types</p>

<div class="grid grid-cols-3 gap-4 mb-6">
  <div class="bg-blue-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-blue-700">{d['total_partners']}</p>
    <p class="text-xs text-gray-600">Total Partners</p>
  </div>
  <div class="bg-teal-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p>
    <p class="text-xs text-gray-600">Avg Achievement</p>
  </div>
  <div class="bg-amber-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-amber-700">{len(d['at_risk'])}</p>
    <p class="text-xs text-gray-600">At-Risk Partners</p>
  </div>
</div>

<h4 class="font-semibold text-gray-800 mb-2">Regional Overview</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-gray-50"><th class="px-3 py-2 text-left">Region</th><th class="px-3 py-2 text-center">Partners</th><th class="px-3 py-2 text-center">Avg Achievement</th></tr></thead>
  <tbody>{d['region_rows']}</tbody>
</table>

<h4 class="font-semibold text-green-700 mb-2">Top 5 Performers</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-green-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead>
  <tbody>{top_rows}</tbody>
</table>

<h4 class="font-semibold text-red-700 mb-2">Bottom 5 &mdash; Requiring Attention</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-red-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead>
  <tbody>{bottom_rows}</tbody>
</table>

<h4 class="font-semibold text-gray-800 mb-2">Recommendations</h4>
<ul class="list-disc list-inside text-gray-700 space-y-1">
  <li>Focus certification programs on partners below 50% achievement</li>
  <li>Prioritize marketing plan adoption for underperforming segments</li>
  <li>Schedule quarterly business reviews with the {len(d['at_risk'])} at-risk partners</li>
  <li>Share best practices from top-performing regions to others</li>
</ul>
"""

    elif target_group == "account_manager":
        top_rows = _partner_rows(d["top5"], "green")
        at_risk_rows = _partner_rows(d["at_risk"][:10], "red") if d["at_risk"] else '<tr><td colspan="2" class="px-3 py-2 text-gray-500 text-center">No at-risk partners</td></tr>'

        return f"""{note}
<h3 class="text-xl font-bold text-gray-800 mb-1">Account Manager &mdash; Partner Review</h3>
<p class="text-sm text-gray-500 mb-6">{d['partner_count']} partners managed &middot; {d['kpi_count']} KPI records analyzed</p>

<div class="grid grid-cols-3 gap-4 mb-6">
  <div class="bg-blue-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-blue-700">{d['partner_count']}</p>
    <p class="text-xs text-gray-600">Your Partners</p>
  </div>
  <div class="bg-teal-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p>
    <p class="text-xs text-gray-600">Portfolio Achievement</p>
  </div>
  <div class="bg-red-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-red-700">{len(d['at_risk'])}</p>
    <p class="text-xs text-gray-600">Partners at Risk (&lt;70%)</p>
  </div>
</div>

<h4 class="font-semibold text-green-700 mb-2">Top Performers</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-green-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead>
  <tbody>{top_rows}</tbody>
</table>

<h4 class="font-semibold text-red-700 mb-2">Partners Requiring Attention (&lt;70% Achievement)</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-red-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead>
  <tbody>{at_risk_rows}</tbody>
</table>

<h4 class="font-semibold text-gray-800 mb-2">Action Plan</h4>
<ol class="list-decimal list-inside text-gray-700 space-y-1">
  <li>Schedule business reviews with partners below 70% achievement</li>
  <li>Provide certification support and training for gaps</li>
  <li>Review quarterly pipeline targets with underperformers</li>
  <li>Assess marketing plan implementation status</li>
</ol>

<p class="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
  <strong>Next Step:</strong> Contact regional leadership to coordinate support for the {len(d['at_risk'])} at-risk partners.
</p>
"""

    else:
        return f"""{note}
<h3 class="text-xl font-bold text-gray-800 mb-1">Partner Analysis Report</h3>
<p class="text-sm text-gray-500 mb-6">{d['partner_count']} partners &middot; {d['kpi_count']} data points &middot; Achievement: {d['avg_achievement']:.0%}</p>

<div class="grid grid-cols-2 gap-4 mb-6">
  <div class="bg-blue-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-blue-700">{d['partner_count']}</p>
    <p class="text-xs text-gray-600">Partners Analyzed</p>
  </div>
  <div class="bg-teal-50 rounded-lg p-4 text-center">
    <p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p>
    <p class="text-xs text-gray-600">Overall Achievement</p>
  </div>
</div>

<h4 class="font-semibold text-gray-800 mb-2">Regional Overview</h4>
<table class="w-full text-sm mb-6">
  <thead><tr class="bg-gray-50"><th class="px-3 py-2 text-left">Region</th><th class="px-3 py-2 text-center">Partners</th><th class="px-3 py-2 text-center">Avg Achievement</th></tr></thead>
  <tbody>{d['region_rows']}</tbody>
</table>

<p class="text-gray-700">Review the detailed metrics above for specific regional and segment recommendations.</p>
"""
