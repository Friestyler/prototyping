"""Web context retrieval service for partner intelligence.

Uses OpenAI API with web search to find relevant partner news,
announcements, and market context that can enrich smart updates.
"""

import json
import os
from typing import Dict, List, Optional

import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def fetch_partner_context(
    partner_name: str,
    partner_region: str = "",
    partner_segment: str = "",
) -> Dict:
    """Fetch partner context using OpenAI web search.

    Returns structured context with recent news, market position,
    and relevant updates about the partner company.
    """
    if not OPENAI_API_KEY:
        return _mock_context(partner_name)

    try:
        return _openai_web_search(partner_name, partner_region, partner_segment)
    except Exception as e:
        print(f"[ERROR] Context fetch failed for {partner_name}: {e}")
        return _mock_context(partner_name, error=str(e))


def fetch_batch_context(
    partners: List[Dict],
    max_partners: int = 10,
) -> Dict[str, Dict]:
    """Fetch context for multiple partners. Returns {account_id: context}."""
    results = {}
    for partner in partners[:max_partners]:
        name = partner.get("name", "")
        if not name or name == "nan":
            continue
        ctx = fetch_partner_context(
            partner_name=name,
            partner_region=partner.get("region", ""),
            partner_segment=partner.get("segment", ""),
        )
        results[partner.get("account_id", name)] = ctx
    return results


def _openai_web_search(
    partner_name: str,
    region: str = "",
    segment: str = "",
) -> Dict:
    """Use OpenAI API to search for partner context."""

    region_hint = f" in the {region} region" if region else ""
    segment_hint = f" ({segment} segment)" if segment else ""

    prompt = f"""Search for recent news and information about the company "{partner_name}"{region_hint}{segment_hint} that is relevant to their IT/telecom partnership business.

Focus on:
1. Recent company news or announcements (last 6 months)
2. Business developments, mergers, acquisitions, or partnerships
3. Technology investments or digital transformation initiatives
4. Financial health indicators (growth, layoffs, expansions)
5. Any news relevant to their relationship with Alcatel-Lucent Enterprise (ALE)

Return a JSON object with this structure:
{{
  "company_summary": "Brief 1-2 sentence company description",
  "recent_news": [
    {{"title": "...", "summary": "...", "date": "...", "relevance": "high/medium/low", "source": "..."}}
  ],
  "business_signals": {{
    "growth_trend": "growing/stable/declining/unknown",
    "recent_investments": "...",
    "market_position": "..."
  }},
  "partnership_relevance": "How this context might affect ALE partnership",
  "recommendations": "Suggested actions based on this context"
}}

If you cannot find specific information, indicate that clearly rather than making things up. Only include verified information."""

    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENAI_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a business intelligence analyst helping ALE (Alcatel-Lucent Enterprise) understand their partners better. Return only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 1000,
            "temperature": 0.3,
        },
        timeout=30.0,
    )

    if response.status_code != 200:
        raise ValueError(f"OpenAI API error: {response.status_code} - {response.text[:200]}")

    data = response.json()
    text = data["choices"][0]["message"]["content"].strip()

    # Parse JSON from response (handle markdown code fences)
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    parsed = json.loads(text)
    parsed["source"] = "openai"
    parsed["partner_name"] = partner_name
    return parsed


def format_context_for_prompt(context: Dict) -> str:
    """Format partner context into text suitable for inclusion in an LLM prompt."""
    if not context or context.get("source") == "mock":
        return ""

    parts = []
    name = context.get("partner_name", "Unknown")
    parts.append(f"### Web Intelligence for {name}")

    summary = context.get("company_summary", "")
    if summary:
        parts.append(f"**Company:** {summary}")

    # Recent news
    news = context.get("recent_news", [])
    if news:
        parts.append("\n**Recent News:**")
        for item in news[:5]:
            title = item.get("title", "")
            summary = item.get("summary", "")
            relevance = item.get("relevance", "")
            source = item.get("source", "")
            parts.append(f"- [{relevance.upper()}] {title}: {summary} (Source: {source})")

    # Business signals
    signals = context.get("business_signals", {})
    if signals:
        trend = signals.get("growth_trend", "unknown")
        investments = signals.get("recent_investments", "")
        position = signals.get("market_position", "")
        parts.append(f"\n**Business Signals:** Growth trend: {trend}")
        if investments:
            parts.append(f"  Investments: {investments}")
        if position:
            parts.append(f"  Market position: {position}")

    relevance = context.get("partnership_relevance", "")
    if relevance:
        parts.append(f"\n**Partnership Relevance:** {relevance}")

    recs = context.get("recommendations", "")
    if recs:
        parts.append(f"**Suggested Actions:** {recs}")

    return "\n".join(parts)


def format_context_html(context: Dict) -> str:
    """Format partner context as HTML for inclusion in update output."""
    if not context or context.get("source") == "mock":
        return ""

    name = context.get("partner_name", "Unknown")
    html_parts = [f'<div class="bg-indigo-50 rounded-lg p-4 mb-4">']
    html_parts.append(f'<h4 class="font-semibold text-indigo-800 mb-2">Web Intelligence: {name}</h4>')

    summary = context.get("company_summary", "")
    if summary:
        html_parts.append(f'<p class="text-sm text-gray-700 mb-2">{summary}</p>')

    news = context.get("recent_news", [])
    if news:
        html_parts.append('<p class="text-xs font-semibold text-gray-600 mb-1">Recent News:</p><ul class="text-sm text-gray-700 space-y-1 mb-2">')
        for item in news[:3]:
            title = item.get("title", "")
            rel = item.get("relevance", "")
            color = "green" if rel == "high" else "amber" if rel == "medium" else "gray"
            html_parts.append(f'<li><span class="text-{color}-600 text-xs font-semibold">[{rel.upper()}]</span> {title}</li>')
        html_parts.append("</ul>")

    relevance = context.get("partnership_relevance", "")
    if relevance:
        html_parts.append(f'<p class="text-sm text-indigo-700"><strong>Impact:</strong> {relevance}</p>')

    html_parts.append("</div>")
    return "\n".join(html_parts)


def _mock_context(partner_name: str, error: str = "") -> Dict:
    """Return mock context when API is not available."""
    return {
        "partner_name": partner_name,
        "company_summary": f"Partner company in the ALE ecosystem.",
        "recent_news": [],
        "business_signals": {
            "growth_trend": "unknown",
            "recent_investments": "",
            "market_position": "",
        },
        "partnership_relevance": "",
        "recommendations": "",
        "source": "mock",
        "error": error,
    }
