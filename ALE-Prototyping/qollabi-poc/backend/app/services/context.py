"""Web context retrieval service for partner intelligence.

Uses OpenAI API to find relevant partner news, announcements,
and market context that can enrich smart updates.

Strategy: Only scrape partners that matter — at-risk and top performers.
This keeps it fast (3-8 calls instead of 50+) and focused.
"""

import json
import os
from typing import Dict, List, Optional, Tuple

import httpx

def _get_openai_key():
    return os.getenv("OPENAI_API_KEY", "")

def _get_openai_model():
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# ==================== PARTNER SCORING ====================

def identify_focus_partners(
    partners: List[Dict],
    kpis: List[Dict],
    max_at_risk: int = 3,
    max_top: int = 3,
) -> Tuple[List[Dict], List[Dict]]:
    """Score partners and return (at_risk, top_performers) lists.

    Each entry includes the partner dict plus avg_achievement score.
    This is the selection algorithm that decides WHO gets scraped.
    """
    # Build average achievement per partner
    scores = {}
    for k in kpis:
        pid = k.get("account_id", "")
        ach = k.get("achievement")
        if ach is not None and pid:
            scores.setdefault(pid, []).append(float(ach))

    partner_map = {p.get("account_id"): p for p in partners}

    scored = []
    for pid, achievements in scores.items():
        if pid not in partner_map:
            continue
        avg = sum(achievements) / len(achievements)
        entry = {**partner_map[pid], "avg_achievement": avg, "kpi_count": len(achievements)}
        scored.append(entry)

    scored.sort(key=lambda x: x["avg_achievement"])

    # At-risk: lowest scores (below 70% or bottom N)
    at_risk = [p for p in scored if p["avg_achievement"] < 0.7][:max_at_risk]
    if not at_risk:
        at_risk = scored[:max_at_risk]

    # Top: highest scores
    top = sorted(scored, key=lambda x: x["avg_achievement"], reverse=True)[:max_top]

    return at_risk, top


# ==================== WEB CONTEXT FETCHING ====================

def fetch_partner_context(
    partner_name: str,
    partner_region: str = "",
    partner_segment: str = "",
    achievement: float = None,
) -> Dict:
    """Fetch partner context using OpenAI."""
    if not _get_openai_key():
        return _mock_context(partner_name)

    try:
        return _openai_search(partner_name, partner_region, partner_segment, achievement)
    except Exception as e:
        print(f"[WARN] Context fetch failed for {partner_name}: {e}")
        return _mock_context(partner_name, error=str(e))


def fetch_focus_partners_context(
    at_risk: List[Dict],
    top_performers: List[Dict],
) -> Dict[str, Dict]:
    """Fetch context only for focus partners (at-risk + top).

    Returns {account_id: context_dict}.
    Typically 3-6 API calls total — fast and focused.
    """
    results = {}

    for partner in at_risk:
        name = partner.get("name", "")
        if not name or name == "nan":
            continue
        ctx = fetch_partner_context(
            partner_name=name,
            partner_region=partner.get("region", ""),
            partner_segment=partner.get("segment", ""),
            achievement=partner.get("avg_achievement"),
        )
        ctx["_focus_reason"] = "at_risk"
        ctx["_achievement"] = partner.get("avg_achievement", 0)
        results[partner.get("account_id", name)] = ctx

    for partner in top_performers:
        pid = partner.get("account_id", partner.get("name", ""))
        if pid in results:
            continue  # Already fetched as at-risk
        name = partner.get("name", "")
        if not name or name == "nan":
            continue
        ctx = fetch_partner_context(
            partner_name=name,
            partner_region=partner.get("region", ""),
            partner_segment=partner.get("segment", ""),
            achievement=partner.get("avg_achievement"),
        )
        ctx["_focus_reason"] = "top_performer"
        ctx["_achievement"] = partner.get("avg_achievement", 0)
        results[pid] = ctx

    return results


def _openai_search(
    partner_name: str,
    region: str = "",
    segment: str = "",
    achievement: float = None,
) -> Dict:
    """Use OpenAI API to search for partner context."""

    region_hint = f" operating in the {region} region" if region else ""
    segment_hint = f" (partner segment: {segment})" if segment else ""
    perf_hint = ""
    if achievement is not None:
        if achievement < 0.5:
            perf_hint = " This partner is significantly underperforming. Look for reasons why (restructuring, financial trouble, leadership changes)."
        elif achievement < 0.7:
            perf_hint = " This partner is below target. Look for business challenges or opportunities."
        elif achievement > 1.0:
            perf_hint = " This partner is a top performer. Look for growth drivers and expansion news."

    prompt = f"""Find recent, relevant business information about "{partner_name}"{region_hint}{segment_hint} in the IT/telecom/networking industry.{perf_hint}

Return a JSON object:
{{
  "company_summary": "1-2 sentence description of what this company does",
  "recent_developments": [
    {{"headline": "...", "detail": "1 sentence", "relevance": "high/medium/low"}}
  ],
  "business_health": "growing/stable/declining/restructuring/unknown",
  "partnership_impact": "How this might affect their partnership with ALE (Alcatel-Lucent Enterprise) — 1-2 sentences",
  "action_suggestion": "Specific recommendation for the account manager — 1 sentence"
}}

Rules:
- Maximum 3 items in recent_developments
- Only include verified, factual information
- If you cannot find specific info, say so honestly
- Focus on IT infrastructure, networking, unified communications relevance"""

    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {_get_openai_key()}",
            "Content-Type": "application/json",
        },
        json={
            "model": _get_openai_model(),
            "messages": [
                {
                    "role": "system",
                    "content": "You are a concise business intelligence analyst. Return only valid JSON, no markdown fences.",
                },
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 500,
            "temperature": 0.2,
        },
        timeout=25.0,
    )

    if response.status_code != 200:
        raise ValueError(f"OpenAI {response.status_code}: {response.text[:200]}")

    text = response.json()["choices"][0]["message"]["content"].strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    parsed = json.loads(text)
    parsed["source"] = "openai"
    parsed["partner_name"] = partner_name
    return parsed


# ==================== FORMATTING FOR LLM PROMPT ====================

def format_context_for_prompt(contexts: Dict[str, Dict]) -> str:
    """Format all scraped contexts into text for the LLM prompt.

    This gets injected into the data_context so Claude/mock can use it.
    """
    if not contexts:
        return ""

    parts = ["=== WEB INTELLIGENCE (scraped partner context) ===\n"]

    for pid, ctx in contexts.items():
        if ctx.get("source") == "mock":
            continue

        name = ctx.get("partner_name", pid)
        reason = ctx.get("_focus_reason", "")
        ach = ctx.get("_achievement", 0)
        label = f"AT-RISK ({ach:.0%})" if reason == "at_risk" else f"TOP PERFORMER ({ach:.0%})"

        parts.append(f"### {name} [{label}]")

        summary = ctx.get("company_summary", "")
        if summary:
            parts.append(f"Company: {summary}")

        devs = ctx.get("recent_developments", [])
        for d in devs:
            rel = d.get("relevance", "")
            parts.append(f"- [{rel.upper()}] {d.get('headline', '')}: {d.get('detail', '')}")

        health = ctx.get("business_health", "unknown")
        parts.append(f"Business health: {health}")

        impact = ctx.get("partnership_impact", "")
        if impact:
            parts.append(f"Partnership impact: {impact}")

        action = ctx.get("action_suggestion", "")
        if action:
            parts.append(f"Recommended action: {action}")

        parts.append("")

    parts.append("Use this web intelligence to enrich your analysis. Reference specific findings where relevant.")
    return "\n".join(parts)


# ==================== FORMATTING FOR HTML OUTPUT ====================

def format_context_html(contexts: Dict[str, Dict]) -> str:
    """Format scraped contexts as an HTML section for the update output."""
    if not contexts:
        return ""

    real_contexts = {k: v for k, v in contexts.items() if v.get("source") not in ("mock", None)}
    if not real_contexts:
        return ""

    html = ['<div class="mt-6 border-t pt-4">']
    html.append('<h4 class="text-lg font-bold text-indigo-800 mb-3">Partner Web Intelligence</h4>')
    html.append('<p class="text-xs text-gray-500 mb-4">Scraped context for key partners to inform recommendations</p>')

    for pid, ctx in real_contexts.items():
        name = ctx.get("partner_name", pid)
        reason = ctx.get("_focus_reason", "")
        ach = ctx.get("_achievement", 0)

        if reason == "at_risk":
            badge_class = "bg-red-100 text-red-800"
            badge_text = f"At Risk ({ach:.0%})"
        else:
            badge_class = "bg-green-100 text-green-800"
            badge_text = f"Top Performer ({ach:.0%})"

        html.append(f'<div class="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">')
        html.append(f'  <div class="flex items-center justify-between mb-2">')
        html.append(f'    <h5 class="font-semibold text-gray-800">{name}</h5>')
        html.append(f'    <span class="text-xs font-medium px-2 py-1 rounded-full {badge_class}">{badge_text}</span>')
        html.append(f'  </div>')

        summary = ctx.get("company_summary", "")
        if summary:
            html.append(f'  <p class="text-sm text-gray-600 mb-2">{summary}</p>')

        devs = ctx.get("recent_developments", [])
        if devs:
            html.append('  <div class="space-y-1 mb-2">')
            for d in devs:
                rel = d.get("relevance", "medium")
                color = "green" if rel == "high" else "amber" if rel == "medium" else "gray"
                html.append(f'    <div class="text-sm"><span class="inline-block w-16 text-xs font-semibold text-{color}-600">[{rel.upper()}]</span> <strong>{d.get("headline", "")}</strong>: {d.get("detail", "")}</div>')
            html.append('  </div>')

        health = ctx.get("business_health", "unknown")
        health_color = {"growing": "green", "stable": "blue", "declining": "red", "restructuring": "amber"}.get(health, "gray")
        html.append(f'  <p class="text-xs text-gray-500">Business health: <span class="font-semibold text-{health_color}-600">{health}</span></p>')

        impact = ctx.get("partnership_impact", "")
        if impact:
            html.append(f'  <p class="text-sm text-indigo-700 mt-2 bg-indigo-50 rounded p-2"><strong>Impact:</strong> {impact}</p>')

        action = ctx.get("action_suggestion", "")
        if action:
            html.append(f'  <p class="text-sm text-blue-700 mt-1"><strong>Action:</strong> {action}</p>')

        html.append('</div>')

    html.append('</div>')
    return "\n".join(html)


# ==================== MOCK ====================

def _mock_context(partner_name: str, error: str = "") -> Dict:
    """Return mock context when API is not available."""
    return {
        "partner_name": partner_name,
        "company_summary": "",
        "recent_developments": [],
        "business_health": "unknown",
        "partnership_impact": "",
        "action_suggestion": "",
        "source": "mock",
        "error": error,
    }
