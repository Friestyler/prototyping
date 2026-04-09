# Qollabi Partner Management Backend

A FastAPI-based backend for managing ALE (Alcatel-Lucent Enterprise) partner performance data and generating AI-powered smart updates.

## Features

- **Partner Management**: Store and query partner data, KPIs, and account manager assignments
- **KPI Analytics**: Analyze partner performance metrics across multiple dimensions
- **Smart Updates**: Generate AI-powered insights and reports using Claude
- **Multi-Channel Delivery**: Email, PDF, FTP, and webhook delivery
- **Dashboard Analytics**: Pre-built dashboard endpoints for performance analysis
- **Custom Queries**: Natural language to SQL conversion using Claude
- **Prompt Templates**: Customizable templates for different audience groups (leadership, account managers, regional)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # SQLite database configuration and initialization
│   ├── routers/
│   │   ├── partners.py      # Partner management endpoints
│   │   ├── updates.py       # Smart updates generation endpoints
│   │   └── dashboard.py     # Analytics and dashboard endpoints
│   ├── services/
│   │   ├── llm.py          # Claude API integration
│   │   ├── delivery.py     # Multi-channel delivery service
│   │   └── context.py      # Web context retrieval
│   └── prompts/
│       └── templates.py     # Prompt templates for different audiences
├── scripts/
│   └── import_data.py       # Excel data import script
├── templates/
│   └── update_email.html    # Email template
├── data/                    # SQLite database (created at runtime)
├── outputs/                 # Generated PDFs and outputs
├── requirements.txt
├── .env.example
└── README.md
```

## Quick Start

### 1. Installation

```bash
# Clone/navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 2. Import Data from Excel

```bash
# Import partner and KPI data from Excel file
python scripts/import_data.py

# Or specify a custom Excel file path
python scripts/import_data.py /path/to/your/file.xlsx
```

This will:
- Initialize the SQLite database
- Import partner data from the "Partner List" sheet
- Import KPI metrics from the "Aggregation" sheet
- Extract and store account manager information
- Seed default prompt templates

### 3. Run the API Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Partners (`/api/partners`)

```
GET /api/partners
  Query params: region, segment, csm_email, search, skip, limit
  → List partners with filtering

GET /api/partners/{account_id}
  → Get partner detail with all KPIs

GET /api/partners/account-managers/list
  → List all account managers

GET /api/partners/by-manager/{email}
  → Get partners managed by specific account manager
```

### Updates (`/api/updates`)

```
POST /api/updates/generate
  Body: target_group, account_manager_email?, prompt_template_id?,
        custom_prompt?, include_web_context?, delivery_channels[], format
  → Generate a smart update using Claude

GET /api/updates
  Query params: target_group, status, skip, limit
  → List generated updates

GET /api/updates/{update_id}
  → Get a specific update

GET /api/updates/templates/list
  → List available prompt templates

POST /api/updates/templates
  Body: name, description, target_group, template
  → Create custom prompt template

PUT /api/updates/templates/{template_id}
  → Update an existing template

POST /api/updates/schedules
  Body: name, prompt_template_id, target_group, frequency, delivery_channel
  → Create a scheduled update

GET /api/updates/schedules/list
  → List all scheduled updates
```

### Dashboard (`/api/dashboard`)

```
GET /api/dashboard/overview
  → Overall KPI summary and metrics

GET /api/dashboard/regional
  → Performance by region

GET /api/dashboard/by-segment
  → Performance by partner segment

GET /api/dashboard/pipeline-trend
  → Quarterly pipeline trend data

GET /api/dashboard/top-performers
  Query params: metric?, limit?
  → Top N partners by metric

GET /api/dashboard/bottom-performers
  Query params: metric?, limit?
  → Bottom N partners (risk alerts)

GET /api/dashboard/manager-performance
  → KPIs grouped by account manager

POST /api/dashboard/custom-query
  Body: query (natural language)
  → Convert natural language to SQL and execute
```

## Database Schema

### partners
- `account_id` (TEXT, PK)
- `name` (TEXT)
- `region` (TEXT)
- `country` (TEXT)
- `segment` (TEXT)
- `csm_emails` (TEXT) - Comma-separated email addresses
- `partner_type` (TEXT)
- `accreditation_level` (TEXT)
- `salesforce_name` (TEXT)
- `strategic_partner` (TEXT)
- `status` (TEXT)

### kpi_metrics
- `id` (INTEGER, PK)
- `account_id` (TEXT, FK)
- `metric_name` (TEXT)
- `period` (TEXT) - For quarterly data
- `result` (REAL)
- `target` (REAL)
- `achievement` (REAL)

### account_managers
- `id` (INTEGER, PK)
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `region` (TEXT)

### smart_updates
- `id` (INTEGER, PK)
- `created_at` (TIMESTAMP)
- `target_group` (TEXT)
- `account_manager_email` (TEXT)
- `prompt_used` (TEXT)
- `content` (TEXT)
- `format` (TEXT)
- `status` (TEXT)
- `delivery_channel` (TEXT)

### prompt_templates
- `id` (INTEGER, PK)
- `name` (TEXT, UNIQUE)
- `description` (TEXT)
- `target_group` (TEXT)
- `template` (TEXT)
- `is_default` (BOOLEAN)

### update_schedules
- `id` (INTEGER, PK)
- `name` (TEXT, UNIQUE)
- `prompt_template_id` (INTEGER, FK)
- `target_group` (TEXT)
- `frequency` (TEXT)
- `delivery_channel` (TEXT)
- `is_active` (BOOLEAN)
- `last_run` (TIMESTAMP)
- `next_run` (TIMESTAMP)

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Required for AI features
ANTHROPIC_API_KEY=sk-...

# Email delivery (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: FTP delivery for PDFs
FTP_HOST=ftp.example.com
FTP_USER=username
FTP_PASSWORD=password

# Optional: Webhook integration
WEBHOOK_URL=https://your-api.example.com/webhook
```

## Usage Examples

### Generate a Leadership Summary

```bash
curl -X POST http://localhost:8000/api/updates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "target_group": "leadership",
    "format": "text",
    "delivery_channels": ["email"]
  }'
```

### Get Partner Performance by Manager

```bash
curl http://localhost:8000/api/partners/by-manager/juergen.reintjes@al-enterprise.com
```

### Get Top Performers

```bash
curl "http://localhost:8000/api/dashboard/top-performers?metric=Business%20Plan%20Setup%20and%20Acceptance&limit=5"
```

### Custom Natural Language Query

```bash
curl -X POST http://localhost:8000/api/dashboard/custom-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me the top 10 partners in the AMERICAS region by average achievement"
  }'
```

## AI Features

### Claude Integration

The application uses Claude 3.5 Sonnet for:
- **Smart Update Generation**: Creates tailored reports based on partner data
- **SQL Query Generation**: Converts natural language queries to SQL
- **Context Awareness**: Generates insights specific to target audience

### Fallback Behavior

If the Anthropic API key is not configured, the system:
- Generates mock/templated updates
- Provides helpful fallback responses
- Continues to function for data retrieval and analytics

## Delivery Channels

### Email
- SMTP-based delivery
- HTML formatted content
- Requires SMTP configuration

### PDF
- Uses WeasyPrint for HTML to PDF conversion
- Falls back to HTML if PDF generation fails
- Stored in `outputs/` directory

### FTP
- Direct file upload to FTP server
- Requires FTP configuration
- Used for archival and distribution

### Webhook
- HTTP POST to custom endpoint
- JSON payload with content and metadata
- Suitable for custom integrations

## Data Import

The import script (`scripts/import_data.py`) handles:
- **Partner List sheet**: Basic partner information
- **Aggregation sheet**: KPI metrics with multi-period data
- **Account Manager extraction**: Parses comma-separated CSM emails
- **Data validation**: Handles missing/invalid data gracefully

Expected Excel structure:
```
Partner List sheet:
  - Account ID, Partner name, Region, Country, Partner Segment, CSM, ...

Aggregation sheet:
  - Account ID, metric columns (e.g., BP_Result, BP_Target, BP_Achievement)
  - Quarterly data (Q1_2025_Result, Q1_2025_Target, Q1_2025_Achievement, ...)
```

## Error Handling

The API includes comprehensive error handling:
- Validation errors: 400 Bad Request
- Not found errors: 404 Not Found
- Server errors: 500 Internal Server Error
- Detailed error messages in responses

## Development

### Adding New Routes

1. Create a new file in `app/routers/`
2. Define router with prefix and tags
3. Import and include in `app/main.py`:

```python
from app.routers import your_router
app.include_router(your_router.router)
```

### Adding New Prompt Templates

1. Add template string to `app/prompts/templates.py`
2. Update `seed_default_prompts()` in `app/database.py`
3. Use in API by passing `prompt_template_id`

## Testing

```bash
# Interactive API documentation
http://localhost:8000/docs

# OpenAPI schema
http://localhost:8000/openapi.json

# Health check
curl http://localhost:8000/health
```

## Performance Optimization

The database includes indexes on:
- `kpi_metrics.account_id`
- `kpi_metrics.metric_name`
- `partners.region`
- `partners.segment`
- `smart_updates.created_at`

## Production Deployment

For production deployment:

1. Set `DEBUG=false` in environment
2. Use a production ASGI server (Gunicorn, Uvicorn)
3. Configure CORS appropriately
4. Use a production database (consider PostgreSQL for scale)
5. Implement rate limiting and authentication
6. Enable HTTPS
7. Configure logging and monitoring

Example Gunicorn command:
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

## Dependencies

- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **Pandas**: Data processing and Excel import
- **SQLite3**: Embedded database
- **Anthropic**: Claude API integration
- **Jinja2**: Template rendering
- **WeasyPrint**: HTML to PDF conversion
- **httpx**: Async HTTP client
- **python-dotenv**: Environment configuration

## Troubleshooting

### Database not initializing
- Check write permissions in `data/` directory
- Verify SQLite3 is installed
- Check disk space

### Excel import failing
- Verify file path is correct
- Check sheet names match expected ("Partner List", "Aggregation")
- Review column names in Excel file

### Claude API errors
- Verify ANTHROPIC_API_KEY is set correctly
- Check API key has proper permissions
- Review API rate limits and quotas

### Email delivery issues
- Verify SMTP credentials
- Check firewall/network access to SMTP server
- Review mail server logs for rejected emails

## Support

For issues, questions, or feature requests, please contact the ALE Qollabi team.

## License

Proprietary - Alcatel-Lucent Enterprise
