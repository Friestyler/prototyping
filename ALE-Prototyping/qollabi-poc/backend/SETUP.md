# Setup and Running the Qollabi PoC Backend

## Prerequisites

- Python 3.8+
- pip package manager
- The Excel data file: `/sessions/ecstatic-elegant-cannon/mnt/uploads/ALE Leadership smart update.xlsx`

## Step-by-Step Setup

### 1. Navigate to the backend directory

```bash
cd /sessions/ecstatic-elegant-cannon/mnt/ALE-Prototyping/qollabi-poc/backend
```

### 2. Create a virtual environment (recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages:
- fastapi==0.115.0
- uvicorn==0.30.0
- pandas==2.2.0
- openpyxl==3.1.2
- anthropic==0.40.0
- And more (see requirements.txt)

### 4. Configure environment variables (optional)

```bash
cp .env.example .env
# Edit .env if you want to configure:
# - ANTHROPIC_API_KEY for Claude integration
# - SMTP settings for email delivery
# - FTP or webhook settings for delivery channels
```

The API will work without these, but smart update generation will use fallback responses.

### 5. Import data from Excel

```bash
python scripts/import_data.py
```

Or specify a custom file path:

```bash
python scripts/import_data.py /path/to/your/excel/file.xlsx
```

This command will:
- Create `data/qollabi.db` SQLite database
- Import partner data from "Partner List" sheet
- Import KPI metrics from "Aggregation" sheet
- Create account manager records
- Seed default prompt templates

Expected output:
```
Importing data from /path/to/file.xlsx...
Initializing database...
Reading Excel file...
Available sheets: ['Context', 'Partner List', 'Aggregation', ...]

Importing Partner List...
  Imported 2072 partners

Importing KPI Metrics from Aggregation sheet...
  Imported 873 KPI metrics

Importing Account Managers...
  Imported 3 unique account managers

Data import completed successfully!
```

### 6. Run the FastAPI server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start and display:
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 7. Access the API

- **Interactive API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative API Docs (ReDoc)**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

## Testing the API

### Test 1: List Partners

```bash
curl http://localhost:8000/api/partners?limit=5
```

Expected: JSON array with partner data

### Test 2: Get Partner Detail

```bash
curl http://localhost:8000/api/partners/[account_id]
```

Replace `[account_id]` with an actual account ID from the database.

### Test 3: List Account Managers

```bash
curl http://localhost:8000/api/partners/account-managers/list
```

Expected: List of account managers including:
- juergen.reintjes@al-enterprise.com
- marcos.rodriguez@al-enterprise.com
- michael-j.francis@al-enterprise.com

### Test 4: Generate a Smart Update

```bash
curl -X POST http://localhost:8000/api/updates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "target_group": "leadership",
    "format": "text",
    "delivery_channels": ["email"]
  }'
```

Expected: JSON response with generated update content

### Test 5: Get Dashboard Overview

```bash
curl http://localhost:8000/api/dashboard/overview
```

Expected: Summary statistics about partners and KPIs

### Test 6: Get Regional Performance

```bash
curl http://localhost:8000/api/dashboard/regional
```

Expected: Performance metrics grouped by region (americas, germany, emea)

### Test 7: Custom Natural Language Query

```bash
curl -X POST http://localhost:8000/api/dashboard/custom-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many partners are in the AMERICAS region?"
  }'
```

Expected: SQL query executed and results returned (if ANTHROPIC_API_KEY is configured)

## Project Structure

```
backend/
├── app/                          # Main application package
│   ├── main.py                   # FastAPI app entry point
│   ├── database.py               # SQLite setup and schema
│   ├── routers/
│   │   ├── partners.py           # /api/partners endpoints
│   │   ├── updates.py            # /api/updates endpoints
│   │   └── dashboard.py          # /api/dashboard endpoints
│   ├── services/
│   │   ├── llm.py                # Claude API integration
│   │   ├── delivery.py           # Email, PDF, FTP, webhook delivery
│   │   └── context.py            # Web context retrieval
│   └── prompts/
│       └── templates.py          # AI prompt templates
├── scripts/
│   └── import_data.py            # Excel import script
├── templates/
│   └── update_email.html         # Email template (Jinja2)
├── data/                         # SQLite database (created after import)
├── outputs/                      # Generated PDFs
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables template
├── README.md                     # Full API documentation
└── SETUP.md                      # This file
```

## Available API Endpoints Summary

### Partners
- `GET /api/partners` - List partners (with filters)
- `GET /api/partners/{account_id}` - Get partner detail
- `GET /api/partners/account-managers/list` - List account managers
- `GET /api/partners/by-manager/{email}` - Get partners by manager

### Updates
- `POST /api/updates/generate` - Generate AI-powered update
- `GET /api/updates` - List generated updates
- `GET /api/updates/{id}` - Get specific update
- `GET /api/updates/templates/list` - List prompt templates
- `POST /api/updates/templates` - Create custom template
- `PUT /api/updates/templates/{id}` - Update template
- `POST /api/updates/schedules` - Create scheduled update
- `GET /api/updates/schedules/list` - List schedules

### Dashboard
- `GET /api/dashboard/overview` - KPI summary
- `GET /api/dashboard/regional` - Performance by region
- `GET /api/dashboard/by-segment` - Performance by segment
- `GET /api/dashboard/pipeline-trend` - Quarterly pipeline trends
- `GET /api/dashboard/top-performers` - Top partners
- `GET /api/dashboard/bottom-performers` - Bottom partners (risk)
- `GET /api/dashboard/manager-performance` - Manager KPIs
- `POST /api/dashboard/custom-query` - Natural language query

## Troubleshooting

### ImportError: No module named 'pandas'
```bash
pip install -r requirements.txt
```

### Database file not found
Make sure you've run the import script:
```bash
python scripts/import_data.py
```

### Port 8000 already in use
Use a different port:
```bash
uvicorn app.main:app --port 8001
```

### Excel file not found
Verify the file path:
```bash
ls -la /sessions/ecstatic-elegant-cannon/mnt/uploads/
```

### No data after import
Check the Excel file sheet names match:
- "Partner List"
- "Aggregation"

## Next Steps

1. **Integrate with a Frontend**: Use the `/docs` endpoint to explore the API
2. **Configure Email Delivery**: Set up SMTP in `.env` for email delivery
3. **Add Claude API Key**: Set ANTHROPIC_API_KEY to enable AI features
4. **Create Custom Templates**: Add domain-specific prompt templates
5. **Set Up Schedules**: Create recurring update schedules
6. **Deploy to Production**: Use Gunicorn or similar for production

## Production Deployment

For production use:

1. Use a production ASGI server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

2. Configure logging and monitoring
3. Set up HTTPS with reverse proxy (nginx, etc.)
4. Consider PostgreSQL instead of SQLite for concurrent access
5. Implement rate limiting and authentication
6. Configure CORS appropriately

## Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Uvicorn**: https://www.uvicorn.org/
- **Anthropic Claude**: https://www.anthropic.com/
- **SQLite**: https://www.sqlite.org/
- **Pandas**: https://pandas.pydata.org/

## Support

For issues or questions, refer to:
- README.md - Full API documentation
- app/main.py - Application entry point and structure
- .env.example - Configuration options
- Interactive API docs at http://localhost:8000/docs
