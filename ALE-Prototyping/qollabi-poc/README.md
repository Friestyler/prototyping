# Qollabi 2.0 - Partner Intelligence Platform (PoC)

A working proof-of-concept for ALE's partner management platform with AI-powered smart updates and interactive dashboards.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
python scripts/import_data.py "../ALE Leadership smart update.xlsx"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open `frontend/index.html` in your browser.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend   │────▶│   FastAPI (API)   │────▶│   SQLite    │
│  React SPA   │     │                  │     │  Database   │
└──────────────┘     │  ┌────────────┐  │     └─────────────┘
                     │  │ Claude API │  │
                     │  │ (Updates)  │  │     ┌─────────────┐
                     │  └────────────┘  │────▶│  Delivery   │
                     │                  │     │ Email/PDF/  │
                     └──────────────────┘     │  FTP/Hook   │
                                              └─────────────┘
```

## Modules

### 1. Smart Update Generator
- AI-generated performance reports per account manager or for leadership
- 4 built-in prompt templates + custom prompts
- Multi-channel delivery: email, PDF, FTP, webhook
- Scheduling support for automated updates
- Web context enrichment for partner intelligence

### 2. Interactive Dashboards
- Overview: KPI achievement across all metrics
- Regional: Americas, Germany, EMEA comparison
- Pipeline: Quarterly trend visualization
- Performers: Top/bottom partner rankings
- Segments: Performance by partner type
- AI Dashboard: Natural language data queries

## Data

- 2,072 partners across 3 regions
- 6,847 KPI data points (7 metric types + quarterly pipeline)
- 76 account managers
- 4 default prompt templates

## API Documentation

Start the server and visit http://localhost:8000/docs for interactive API docs.

## Project Structure

```
qollabi-poc/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # SQLite schema
│   │   ├── routers/
│   │   │   ├── partners.py      # Partner endpoints
│   │   │   ├── updates.py       # Smart update endpoints
│   │   │   └── dashboard.py     # Dashboard endpoints
│   │   ├── services/
│   │   │   ├── llm.py           # Claude API integration
│   │   │   ├── delivery.py      # Multi-channel delivery
│   │   │   └── context.py       # Web context enrichment
│   │   └── prompts/
│   │       └── templates.py     # Prompt templates
│   ├── scripts/
│   │   └── import_data.py       # Excel to SQLite import
│   ├── templates/
│   │   └── update_email.html    # Email template
│   └── requirements.txt
├── frontend/
│   └── index.html               # React SPA (single file)
├── docs/
│   └── engineering-plan.md      # Production roadmap
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
ANTHROPIC_API_KEY=your-key    # Required for AI features
SMTP_HOST=smtp.gmail.com      # For email delivery
DB_PATH=./data/qollabi.db     # Database location
```

Without an API key, the system uses mock responses for smart updates.

## Engineering Plan

See `docs/engineering-plan.md` for the detailed production roadmap, architecture decisions, sprint plan, and cost analysis.
