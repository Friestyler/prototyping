"""LLM integration — uses OpenAI (primary) or Anthropic (if configured)."""

import json
import os
from typing import Optional

import httpx

from app.prompts.templates import (
    ACCOUNT_MANAGER_REVIEW_PROMPT,
    LEADERSHIP_SUMMARY_PROMPT,
    REGIONAL_PERFORMANCE_PROMPT,
    RISK_ALERT_PROMPT,
)


def _get_openai_key():
    return os.getenv("OPENAI_API_KEY", "")


def _get_anthropic_key():
    return os.getenv("ANTHROPIC_API_KEY", "")


SYSTEM_PROMPT_TEMPLATE = """You are an expert analyst for ALE (Alcatel-Lucent Enterprise) partner management.
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

{custom_instructions}"""


def generate_smart_update(
    data_context: dict,
    prompt_template: str,
    target_group: str,
    custom_instructions: Optional[str] = None,
) -> str:
    """Generate a smart update using OpenAI (primary) or Anthropic (fallback)."""

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

    context_str = json.dumps(data_context, indent=2, default=str)

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        target_group=target_group,
        custom_instructions=custom_instructions or "",
    )

    user_prompt = f"""{prompt_template}

Here is the partner and KPI data to analyze:

{context_str}

Generate a professional, insightful HTML report based on this data. Use Tailwind CSS classes for styling.
Focus on actionable insights and key trends. Include data tables where appropriate.
"""

    # Try OpenAI first
    if _get_openai_key():
        try:
            return _call_openai(system_prompt, user_prompt)
        except Exception as e:
            print(f"[WARN] OpenAI generation failed: {e}")

    # Try Anthropic as fallback
    if _get_anthropic_key():
        try:
            return _call_anthropic(system_prompt, user_prompt)
        except Exception as e:
            print(f"[WARN] Anthropic generation failed: {e}")

    # Final fallback: mock
    return generate_mock_update(data_context, target_group)


def generate_sql_from_query(natural_language: str, schema: str) -> str:
    """Convert natural language query to SQL."""

    system_prompt = """You are an SQL expert for SQLite databases.
Convert natural language queries to valid SQLite SQL queries.
Only return the SQL query, nothing else. No explanation, no markdown.
Use proper JOINs and aggregations as needed.

TABLES:
- partners: account_id (TEXT PK), name, region, country, segment, csm_emails
- kpi_metrics: id, account_id (FK→partners), metric_name, period, result (REAL), target (REAL), achievement (REAL, 0-1 scale where 1.0 = 100%)
- account_managers: id, email (UNIQUE), name, region

IMPORTANT — Use ONLY these exact values (case-sensitive):

metric_name values:
  'Quarterly Pipeline vs Target', 'Certifications achievements vs recommended',
  'Business Plan Setup and Acceptance', 'Sales IN Revenues vs Sales target',
  'Communications Certifications', 'Networking Certifications', 'Marketing Plan'

period values:
  'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', '2025 Total',
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', '2026 Total',
  'Current' (for non-pipeline metrics)

region values: 'americas', 'germany', 'emea', 'apac', 'eeimea', 'france'
segment values: 'yes', 'expert_1000', 'expert_200', 'distributor_1000', 'distributor'

RULES:
- Pipeline queries: use metric_name = 'Quarterly Pipeline vs Target'
- At-risk partners: use achievement < 0.7
- Top performers: ORDER BY achievement DESC
- Region/country info is on the partners table, NOT kpi_metrics — always JOIN partners for region
- Always SELECT specific columns, not SELECT *
- Always LIMIT results to 50 unless specified otherwise
- For aggregations, use ROUND() for readability
- If the query asks about growth, compare periods using self-joins or CASE expressions
"""

    user_prompt = f"""Convert this question to SQL:
{natural_language}

Return ONLY the SQL query.
"""

    if _get_openai_key():
        try:
            result = _call_openai(system_prompt, user_prompt, max_tokens=500)
            return _clean_sql(result)
        except Exception as e:
            print(f"[WARN] OpenAI SQL generation failed: {e}")

    if _get_anthropic_key():
        try:
            result = _call_anthropic(system_prompt, user_prompt, max_tokens=500)
            return _clean_sql(result)
        except Exception as e:
            raise ValueError(f"Failed to generate SQL: {str(e)}")

    return "SELECT * FROM partners LIMIT 10"


# ==================== LLM BACKENDS ====================

def _call_openai(system_prompt: str, user_prompt: str, max_tokens: int = 3000) -> str:
    """Call OpenAI API."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {_get_openai_key()}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.4,
        },
        timeout=60.0,
    )

    if response.status_code != 200:
        raise ValueError(f"OpenAI {response.status_code}: {response.text[:200]}")

    text = response.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last ``` lines
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    return text


def _call_anthropic(system_prompt: str, user_prompt: str, max_tokens: int = 3000) -> str:
    """Call Anthropic API."""
    from anthropic import Anthropic

    client = Anthropic(api_key=_get_anthropic_key())
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def _clean_sql(text: str) -> str:
    """Clean SQL output from LLM response."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("sql"):
            text = text[3:]
        text = text.strip()
    return text


# ==================== MOCK FALLBACK ====================

def _build_data_driven_sections(data_context: dict) -> dict:
    """Extract real insights from the data context for mock reports."""
    partners = data_context.get("partners", [])
    kpis = data_context.get("kpis", [])
    stats = data_context.get("stats", {})
    regional = data_context.get("regional_summary", [])

    total_partners = stats.get("partner_count", len(partners))
    avg_achievement = stats.get("avg_achievement", "N/A")
    metric_count = stats.get("metric_count", 0)

    partner_scores = {}
    for k in kpis:
        pid = k.get("account_id", "")
        ach = k.get("achievement")
        if ach is not None:
            partner_scores.setdefault(pid, []).append(ach)
    partner_avgs = {pid: sum(scores)/len(scores) for pid, scores in partner_scores.items() if scores}
    sorted_partners = sorted(partner_avgs.items(), key=lambda x: x[1], reverse=True)

    id_to_name = {p.get("account_id", ""): p.get("name", p.get("account_id", "")) for p in partners}

    top5 = sorted_partners[:5]
    bottom5 = sorted_partners[-5:] if len(sorted_partners) > 5 else []
    at_risk = [(pid, avg) for pid, avg in sorted_partners if avg < 0.7]

    region_rows = ""
    for r in regional:
        region_rows += f'<tr><td class="px-3 py-2 border-b border-gray-100">{r.get("region", "N/A")}</td><td class="px-3 py-2 border-b border-gray-100 text-center">{r.get("partners", 0)}</td><td class="px-3 py-2 border-b border-gray-100 text-center">{r.get("avg_achievement", 0):.0%}</td></tr>'

    return {
        "total_partners": total_partners, "avg_achievement": avg_achievement,
        "metric_count": metric_count, "partner_count": len(partners),
        "kpi_count": len(kpis), "top5": top5, "bottom5": bottom5,
        "at_risk": at_risk, "id_to_name": id_to_name,
        "region_rows": region_rows, "regional": regional,
    }


def generate_mock_update(data_context: dict, target_group: str, error_note: str = "") -> str:
    """Generate a data-driven HTML update when no LLM API is available."""
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
  <div class="bg-blue-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-blue-700">{d['total_partners']}</p><p class="text-xs text-gray-600">Total Partners</p></div>
  <div class="bg-teal-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p><p class="text-xs text-gray-600">Avg Achievement</p></div>
  <div class="bg-amber-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-amber-700">{len(d['at_risk'])}</p><p class="text-xs text-gray-600">At-Risk Partners</p></div>
</div>
<h4 class="font-semibold text-gray-800 mb-2">Regional Overview</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-gray-50"><th class="px-3 py-2 text-left">Region</th><th class="px-3 py-2 text-center">Partners</th><th class="px-3 py-2 text-center">Avg Achievement</th></tr></thead><tbody>{d['region_rows']}</tbody></table>
<h4 class="font-semibold text-green-700 mb-2">Top 5 Performers</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-green-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead><tbody>{top_rows}</tbody></table>
<h4 class="font-semibold text-red-700 mb-2">Bottom 5 &mdash; Requiring Attention</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-red-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead><tbody>{bottom_rows}</tbody></table>
<h4 class="font-semibold text-gray-800 mb-2">Recommendations</h4>
<ul class="list-disc list-inside text-gray-700 space-y-1">
  <li>Focus certification programs on partners below 50% achievement</li>
  <li>Schedule quarterly business reviews with the {len(d['at_risk'])} at-risk partners</li>
  <li>Share best practices from top-performing regions</li>
</ul>"""

    elif target_group == "account_manager":
        top_rows = _partner_rows(d["top5"], "green")
        at_risk_rows = _partner_rows(d["at_risk"][:10], "red") if d["at_risk"] else '<tr><td colspan="2" class="px-3 py-2 text-gray-500 text-center">No at-risk partners</td></tr>'
        return f"""{note}
<h3 class="text-xl font-bold text-gray-800 mb-1">Account Manager &mdash; Partner Review</h3>
<p class="text-sm text-gray-500 mb-6">{d['partner_count']} partners managed &middot; {d['kpi_count']} KPI records analyzed</p>
<div class="grid grid-cols-3 gap-4 mb-6">
  <div class="bg-blue-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-blue-700">{d['partner_count']}</p><p class="text-xs text-gray-600">Your Partners</p></div>
  <div class="bg-teal-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p><p class="text-xs text-gray-600">Portfolio Achievement</p></div>
  <div class="bg-red-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-red-700">{len(d['at_risk'])}</p><p class="text-xs text-gray-600">Partners at Risk (&lt;70%)</p></div>
</div>
<h4 class="font-semibold text-green-700 mb-2">Top Performers</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-green-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead><tbody>{top_rows}</tbody></table>
<h4 class="font-semibold text-red-700 mb-2">Partners Requiring Attention (&lt;70% Achievement)</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-red-50"><th class="px-3 py-2 text-left">Partner</th><th class="px-3 py-2 text-center">Achievement</th></tr></thead><tbody>{at_risk_rows}</tbody></table>
<h4 class="font-semibold text-gray-800 mb-2">Action Plan</h4>
<ol class="list-decimal list-inside text-gray-700 space-y-1">
  <li>Schedule business reviews with partners below 70% achievement</li>
  <li>Provide certification support and training for gaps</li>
  <li>Review quarterly pipeline targets with underperformers</li>
</ol>
<p class="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg"><strong>Next Step:</strong> Contact regional leadership to coordinate support for the {len(d['at_risk'])} at-risk partners.</p>"""

    else:
        return f"""{note}
<h3 class="text-xl font-bold text-gray-800 mb-1">Partner Analysis Report</h3>
<p class="text-sm text-gray-500 mb-6">{d['partner_count']} partners &middot; {d['kpi_count']} data points &middot; Achievement: {d['avg_achievement']:.0%}</p>
<div class="grid grid-cols-2 gap-4 mb-6">
  <div class="bg-blue-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-blue-700">{d['partner_count']}</p><p class="text-xs text-gray-600">Partners Analyzed</p></div>
  <div class="bg-teal-50 rounded-lg p-4 text-center"><p class="text-2xl font-bold text-teal-700">{d['avg_achievement']:.0%}</p><p class="text-xs text-gray-600">Overall Achievement</p></div>
</div>
<h4 class="font-semibold text-gray-800 mb-2">Regional Overview</h4>
<table class="w-full text-sm mb-6"><thead><tr class="bg-gray-50"><th class="px-3 py-2 text-left">Region</th><th class="px-3 py-2 text-center">Partners</th><th class="px-3 py-2 text-center">Avg Achievement</th></tr></thead><tbody>{d['region_rows']}</tbody></table>
<p class="text-gray-700">Review the detailed metrics for specific recommendations.</p>"""
