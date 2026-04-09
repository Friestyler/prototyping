# Qollabi PoC Backend - Complete File Index

A complete FastAPI backend for ALE partner management with AI-powered smart updates.

## Quick Start

1. **First time setup**: `bash run.sh` (Linux/Mac) or `run.bat` (Windows)
2. **Browse API docs**: http://localhost:8000/docs
3. **Check health**: http://localhost:8000/health

## File Structure & Descriptions

### Root Level Files

| File | Purpose |
|------|---------|
| **requirements.txt** | Python package dependencies (pip install -r requirements.txt) |
| **.env.example** | Environment variables template - copy to .env and configure |
| **run.sh** | Quick start script for Linux/Mac |
| **run.bat** | Quick start script for Windows |
| **README.md** | Complete API documentation and architecture overview |
| **SETUP.md** | Step-by-step setup and testing guide |
| **INDEX.md** | This file - file structure and organization |

### Core Application (`app/`)

#### Main Entry Point
- **app/main.py** (225 lines)
  - FastAPI application initialization
  - CORS middleware configuration
  - Route registration (partners, updates, dashboard)
  - Startup/shutdown event handlers
  - Health check endpoint (`GET /health`)

#### Database Layer (`app/database.py`) - 200 lines
- SQLite database schema and initialization
- Tables: partners, kpi_metrics, account_managers, smart_updates, prompt_templates, update_schedules
- Helper functions:
  - `get_db()` - Context manager for database connections
  - `init_db()` - Create all tables with indexes
  - `seed_default_prompts()` - Insert default prompt templates

#### Configuration (`app/config.py`) - 80 lines
- Centralized settings management
- Loads environment variables from .env
- Provides configuration objects for SMTP, FTP, Webhook
- Methods:
  - `get_smtp_config()` - Returns SMTP configuration if complete
  - `get_ftp_config()` - Returns FTP configuration if complete

### API Routers (`app/routers/`)

#### Partners Router (`app/routers/partners.py`) - 130 lines
**Endpoints:**
- `GET /api/partners` - List all partners with filters (region, segment, csm_email, search)
- `GET /api/partners/{account_id}` - Get partner detail with KPIs
- `GET /api/partners/account-managers/list` - List all account managers
- `GET /api/partners/by-manager/{email}` - Get partners managed by specific account manager

**Features:**
- Pagination support (skip, limit)
- Full-text search
- CSM email filtering
- Related KPI metrics inclusion

#### Updates Router (`app/routers/updates.py`) - 260 lines
**Endpoints:**
- `POST /api/updates/generate` - Generate smart update using Claude
- `GET /api/updates` - List generated updates with filters
- `GET /api/updates/{update_id}` - Get specific update
- `GET /api/updates/templates/list` - List prompt templates
- `POST /api/updates/templates` - Create custom template
- `PUT /api/updates/templates/{template_id}` - Update template
- `POST /api/updates/schedules` - Create scheduled update
- `GET /api/updates/schedules/list` - List all schedules

**Features:**
- AI-powered content generation
- Multi-format delivery (text, HTML, PDF)
- Custom prompt templates
- Scheduled updates with frequency

#### Dashboard Router (`app/routers/dashboard.py`) - 280 lines
**Endpoints:**
- `GET /api/dashboard/overview` - Overall KPI summary
- `GET /api/dashboard/regional` - Performance by region
- `GET /api/dashboard/by-segment` - Performance by partner segment
- `GET /api/dashboard/pipeline-trend` - Quarterly pipeline trends
- `GET /api/dashboard/top-performers` - Top N partners by metric
- `GET /api/dashboard/bottom-performers` - Bottom N partners (risk alerts)
- `GET /api/dashboard/manager-performance` - KPIs grouped by manager
- `POST /api/dashboard/custom-query` - Natural language to SQL

**Features:**
- Pre-built analytics queries
- Aggregation and grouping
- Natural language query conversion
- Risk identification and trends

### Services Layer (`app/services/`)

#### LLM Service (`app/services/llm.py`) - 200 lines
**Functions:**
- `generate_smart_update()` - Create AI-powered updates using Claude
- `generate_sql_from_query()` - Convert natural language to SQL
- `generate_mock_update()` - Fallback response when API unavailable

**Features:**
- Claude 3.5 Sonnet integration
- Prompt template selection
- Fallback/mock responses
- Error handling and recovery

#### Delivery Service (`app/services/delivery.py`) - 200 lines
**Functions:**
- `deliver_email()` - SMTP email delivery
- `deliver_pdf()` - HTML to PDF conversion (WeasyPrint)
- `deliver_ftp()` - FTP file upload
- `deliver_webhook()` - HTTP POST webhook
- `deliver()` - Multi-channel orchestration

**Features:**
- Multiple delivery channels
- HTML to PDF conversion with fallback
- Async HTTP client support
- Comprehensive error handling

#### Context Service (`app/services/context.py`) - 50 lines
**Functions:**
- `fetch_partner_context()` - Retrieve partner information
- `fetch_partner_context_real()` - Real API integration (placeholder)

**Features:**
- Company information lookup
- News and social presence tracking
- Extensible for real API integration
- Mock/fallback support

### Prompts (`app/prompts/`)

#### Templates (`app/prompts/templates.py`) - 240 lines
**Prompt Templates:**
1. **LEADERSHIP_SUMMARY_PROMPT** - Executive summary for leadership
   - Portfolio health overview
   - Key metrics and regional analysis
   - Risk assessment and recommendations

2. **ACCOUNT_MANAGER_REVIEW_PROMPT** - Detailed partner review for AMs
   - Portfolio overview
   - Partner-by-partner analysis
   - Certification status and action plan
   - 90-day success metrics

3. **REGIONAL_PERFORMANCE_PROMPT** - Regional comparison for leadership
   - Regional snapshots with KPIs
   - Cross-regional comparison
   - Segment performance by region
   - Strategic recommendations

4. **RISK_ALERT_PROMPT** - At-risk partner identification
   - Critical risk partners summary
   - Intervention requirements
   - Recovery timeline
   - Escalation procedures

### Scripts (`scripts/`)

#### Data Import (`scripts/import_data.py`) - 320 lines
**Functions:**
- `import_partner_list()` - Load partners from Excel
- `import_kpi_metrics()` - Load KPI data with period normalization
- `import_account_managers()` - Extract and store CSM emails
- `main()` - CLI entry point with argparse

**Features:**
- Reads Excel file (.xlsx)
- Normalizes wide format to long format
- Handles comma-separated CSM emails
- Data validation and error handling
- Default file path: `/sessions/ecstatic-elegant-cannon/mnt/uploads/ALE Leadership smart update.xlsx`
- Custom file path support via command-line argument

### Templates (`templates/`)

#### Email Template (`templates/update_email.html`) - 300 lines
**Jinja2 HTML Template:**
- Professional email layout
- Responsive design (mobile-friendly)
- Styled metric boxes
- Action item highlighting
- Header/footer with branding
- Button for CTAs
- Table support for data display

**Variable placeholders:**
- `{{ title }}` - Email title
- `{{ subtitle }}` - Subtitle/company name
- `{{ content }}` - Main HTML content
- `{{ metrics }}` - Optional metrics array
- `{{ actions }}` - Optional action items array
- `{{ cta_url }}` - Call-to-action button URL
- `{{ cta_text }}` - Button text

### Directory Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py              # Package marker (empty)
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # SQLite schema and initialization
│   ├── config.py                # Configuration management
│   ├── routers/                 # API route handlers
│   │   ├── __init__.py
│   │   ├── partners.py          # Partner management endpoints
│   │   ├── updates.py           # Smart updates endpoints
│   │   └── dashboard.py         # Analytics endpoints
│   ├── services/                # Business logic and integrations
│   │   ├── __init__.py
│   │   ├── llm.py              # Claude API integration
│   │   ├── delivery.py         # Multi-channel delivery
│   │   └── context.py          # External data retrieval
│   └── prompts/                 # AI prompt management
│       ├── __init__.py
│       └── templates.py         # Prompt template definitions
├── scripts/                      # Standalone scripts
│   └── import_data.py           # Excel import utility
├── templates/                    # Jinja2 templates
│   └── update_email.html        # Email template
├── data/                        # SQLite database (created at runtime)
│   └── qollabi.db
├── outputs/                     # Generated files (PDFs, etc.)
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment configuration template
├── run.sh                       # Quick start script (Linux/Mac)
├── run.bat                      # Quick start script (Windows)
├── README.md                    # Complete documentation
├── SETUP.md                     # Setup instructions
└── INDEX.md                     # This file
```

## Technology Stack

- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn 0.30.0
- **Database**: SQLite3
- **Data**: Pandas 2.2.0, OpenPyXL 3.1.2
- **AI**: Anthropic Claude (0.40.0)
- **Templates**: Jinja2 3.1.3
- **PDF**: WeasyPrint 62.0
- **HTTP**: httpx 0.27.0
- **Validation**: Pydantic 2.9.0
- **Async Files**: aiofiles 24.1.0
- **Environment**: python-dotenv 1.0.1

## Database Schema

### partners
- account_id (TEXT, PK)
- name, region, country, segment
- csm_emails (comma-separated)
- partner_type, accreditation_level, salesforce_name, status
- Indexes: region, segment

### kpi_metrics
- id (INTEGER, PK)
- account_id (FK), metric_name, period
- result, target, achievement (REAL)
- Indexes: account_id, metric_name

### account_managers
- id (INTEGER, PK)
- email (UNIQUE), name, region

### smart_updates
- id (INTEGER, PK)
- created_at, target_group, account_manager_email
- prompt_used, content, format, status
- delivery_channel, delivery_status, delivered_at

### prompt_templates
- id (INTEGER, PK)
- name (UNIQUE), description, target_group
- template (TEXT), is_default (BOOLEAN)

### update_schedules
- id (INTEGER, PK)
- name (UNIQUE), prompt_template_id (FK)
- target_group, frequency, delivery_channel
- is_active, last_run, next_run

## API Response Format

All endpoints return JSON with consistent structure:

**List endpoints:**
```json
{
  "data": [...],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

**Single resource endpoints:**
```json
{
  "id": 1,
  "field1": "value1",
  ...
}
```

**Error responses:**
```json
{
  "error": "Description of error",
  "detail": "Additional details if available"
}
```

## Environment Variables

See `.env.example` for all available options:

- `ANTHROPIC_API_KEY` - Claude API key
- `SMTP_*` - Email configuration
- `FTP_*` - FTP delivery configuration
- `WEBHOOK_URL` - Webhook integration
- `DEBUG` - Debug mode flag
- `LOG_LEVEL` - Logging level
- `CORS_ORIGINS` - Allowed CORS origins
- `DATABASE_PATH` - SQLite database location
- `PDF_OUTPUT_DIR` - Output directory for PDFs

## Key Features

### 1. Partner Management
- Store and query partner data
- Link account managers to partners
- Track partner segments and regions
- Support for custom fields

### 2. KPI Analytics
- Store multi-dimensional KPI metrics
- Query by partner, metric, or time period
- Calculate achievement rates
- Support quarterly pipeline tracking

### 3. Smart Updates Generation
- AI-powered report generation via Claude
- Multiple target audiences (leadership, account managers)
- Customizable prompt templates
- Fallback responses when API unavailable

### 4. Multi-Channel Delivery
- Email delivery via SMTP
- PDF generation from HTML
- FTP archive uploads
- Webhook integration for custom flows

### 5. Dashboard Analytics
- Pre-built KPI dashboards
- Regional and segment analysis
- Top/bottom performer identification
- Natural language query support

## Common Usage Patterns

### Generate a Leadership Report
```bash
curl -X POST http://localhost:8000/api/updates/generate \
  -H "Content-Type: application/json" \
  -d '{"target_group": "leadership", "format": "html"}'
```

### Find At-Risk Partners
```bash
curl http://localhost:8000/api/dashboard/bottom-performers?limit=10
```

### Query by Account Manager
```bash
curl http://localhost:8000/api/partners/by-manager/juergen.reintjes@al-enterprise.com
```

### Get Regional Performance
```bash
curl http://localhost:8000/api/dashboard/regional
```

## Production Checklist

- [ ] Set ANTHROPIC_API_KEY in .env
- [ ] Configure SMTP for email delivery
- [ ] Review and adjust CORS_ORIGINS
- [ ] Test all delivery channels
- [ ] Set DEBUG=false
- [ ] Configure logging and monitoring
- [ ] Set up database backups
- [ ] Use production ASGI server (Gunicorn)
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Set up authentication if needed

## Support & Next Steps

1. **Review README.md** for complete API documentation
2. **Check SETUP.md** for detailed setup instructions
3. **Visit http://localhost:8000/docs** for interactive API exploration
4. **Explore example queries** in SETUP.md testing section
5. **Configure .env** with your API keys and delivery settings
6. **Customize prompts** in app/prompts/templates.py
7. **Create scheduled updates** for recurring reports

## File Statistics

- **Total Python files**: 11
- **Total lines of code**: ~2,500
- **Total configuration/documentation files**: 5
- **Database tables**: 6
- **API endpoints**: 25+
- **Prompt templates**: 4

## Version History

- **v0.1.0** (Initial): Complete backend with all core features

---

Last updated: 2026-04-08
Qollabi Partner Management PoC
Alcatel-Lucent Enterprise
