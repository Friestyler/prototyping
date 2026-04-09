# Qollabi 2.0 Partner Intelligence Platform - Engineering Plan

**Document Version:** 1.0
**Last Updated:** April 8, 2026
**Target Audience:** Senior Engineers, Tech Leads, Engineering Managers
**Sprint Duration:** 2-3 weeks

---

## 1. Executive Summary

Qollabi 2.0 is a next-generation Partner Intelligence Platform designed to mirror Qollabi 1.0's partner performance database while adding AI-powered smart updates and interactive analytics capabilities. The system will ingest partner data from ALE/Alcatel-Lucent Enterprise databases and Salesforce, apply large language models to generate contextual business insights, and deliver these insights across multiple channels (email, PDF, API, webhooks, FTP).

**Key Goals:**
- Reduce manual intelligence gathering by 80% through AI-driven analysis
- Provide real-time dashboards for account managers and leadership
- Enable data-driven partnership decisions with contextual insights
- Scale from 50 to 500+ partners without manual intervention

**Scope:** Core platform for 2-3 week production sprint targeting MVP launch with essential modules (data import, smart update generation, basic dashboards, delivery channels).

**Success Criteria:**
- Successful daily sync from Qollabi 1.0/Salesforce
- 99.9% email delivery rate
- Smart updates generated in <60 seconds per partner
- Dashboard load time <2 seconds for typical queries

---

## 2. Architecture Overview

### Current PoC Stack
- **Backend:** Python 3.11 + FastAPI 0.104
- **Database:** SQLite (development)
- **Frontend:** React 18 SPA with TypeScript
- **AI Integration:** Direct Claude API calls
- **Infrastructure:** Local/Docker development

### Production Architecture Recommendation

#### Option A: FastAPI + PostgreSQL + React (Recommended - Extend PoC)

**Pros:**
- Minimal migration effort from current PoC
- Python ecosystem strength for ML/AI tasks
- Excellent async support for concurrent API calls
- Strong AI/ML libraries (LangChain, LlamaIndex)
- Cost-effective scaling
- Simple authentication middleware options

**Cons:**
- Requires frontend build/deployment pipeline
- Database migrations need careful planning
- Limited out-of-box admin UI
- Separate frontend/backend deployments

**Estimated Timeline:** 2 weeks production ready

---

#### Option B: Next.js Full-Stack + PostgreSQL + Prisma

**Pros:**
- Single codebase, unified deployment
- Built-in server-side rendering and API routes
- Excellent TypeScript support
- Vercel hosting with built-in CI/CD
- Modern developer experience
- Easy authentication (NextAuth.js)

**Cons:**
- Requires rewrite of Python FastAPI backend
- Less mature ecosystem for AI/ML integration
- Node.js runtime limitations for heavy computation
- Learning curve if team is Python-heavy

**Estimated Timeline:** 3-4 weeks production ready

---

#### Option C: Django + PostgreSQL + React/Vue

**Pros:**
- Batteries-included framework (auth, ORM, admin)
- Strong admin panel out-of-box
- Excellent for rapid CRUD applications
- Strong Django ORM for complex queries
- Good async support (Django 4.1+)

**Cons:**
- Heavyweight for this use case
- Slower API response for real-time dashboards
- Requires separate frontend deployment
- Can be over-engineered for simple workflows

**Estimated Timeline:** 2-3 weeks production ready

---

### Recommended Architecture: **Option A (FastAPI + PostgreSQL + React)**

**Rationale:** Minimizes disruption to current PoC while addressing production requirements. FastAPI's async capabilities perfectly suit high-concurrency AI API calls and scheduled tasks. PostgreSQL provides reliability and JSONB support for flexible data structures. React remains unchanged, reducing complexity.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                │
├──────────────────┬──────────────────────────────┬───────────────┤
│  Qollabi 1.0     │   Salesforce                 │  External     │
│  Database        │   API                        │  APIs         │
│  (SQL Server)    │                              │  (LinkedIn,   │
│                  │                              │   News,       │
│                  │                              │   Weather)    │
└────────────────┬─────────────────┬──────────────┴───────────────┘
                 │                 │
                 └────────┬────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │     ETL/IMPORT PIPELINE            │
        │  ┌──────────────────────────────┐  │
        │  │  Data Validation & Cleaning  │  │
        │  │  Scheduling (Celery/Cron)    │  │
        │  │  Error Handling & Retries    │  │
        │  └──────────────────────────────┘  │
        └────────────────┬────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   POSTGRESQL DATABASE           │
        │  ┌────────────────────────────┐ │
        │  │ Partners, KPIs, Updates    │ │
        │  │ Audit Trail, Versioning    │ │
        │  │ Multi-tenant Support       │ │
        │  └────────────────────────────┘ │
        └────────┬──────────────┬─────────┘
                 │              │
    ┌────────────▼──┐    ┌──────▼────────────┐
    │   API LAYER   │    │   AI SERVICES     │
    │               │    │                   │
    │  FastAPI      │    │ ┌───────────────┐ │
    │  REST/GraphQL │    │ │ Claude API    │ │
    │  WebSocket    │    │ │ Integration   │ │
    │  Endpoints    │    │ │ (Prompting,   │ │
    │               │    │ │  Few-shot,    │ │
    │               │    │ │  Validation)  │ │
    │               │    │ └───────────────┘ │
    └────────┬──────┘    │ ┌───────────────┐ │
             │           │ │ Prompt Eng.   │ │
             │           │ │ Templates     │ │
             │           │ │ & Chaining    │ │
             │           │ └───────────────┘ │
             │           └───────────────────┘
             │                    │
    ┌────────▼────────────────────▼────────┐
    │   SMART UPDATE GENERATOR              │
    │  ┌───────────────────────────────┐   │
    │  │ Target Group Selection        │   │
    │  │ Web Context Enrichment        │   │
    │  │ Multi-channel Delivery        │   │
    │  │ (Email, PDF, FTP, Webhooks)   │   │
    │  └───────────────────────────────┘   │
    └────────┬──────────────────────────────┘
             │
    ┌────────┴────────────────────────────────┐
    │    DELIVERY CHANNELS                     │
    ├──────────┬──────────┬──────────┬────────┤
    │  Email   │  PDF Gen │  FTP     │API &   │
    │  (SMTP)  │  Service │  Upload  │Webhook │
    │          │          │          │        │
    └──────────┴──────────┴──────────┴────────┘
             │
    ┌────────▼──────────────────────────────┐
    │   FRONTEND (React SPA)                 │
    │  ┌──────────────────────────────────┐ │
    │  │ Dashboard Module                 │ │
    │  │ ┌────────────────────────────┐   │ │
    │  │ │ Standard Dashboards        │   │ │
    │  │ │ (KPIs, Trends, Alerts)     │   │ │
    │  │ └────────────────────────────┘   │ │
    │  │ ┌────────────────────────────┐   │ │
    │  │ │ AI Dashboards              │   │ │
    │  │ │ (NL Query → SQL → Viz)     │   │ │
    │  │ └────────────────────────────┘   │ │
    │  │ Update History & Export          │ │
    │  └──────────────────────────────────┘ │
    │  ┌──────────────────────────────────┐ │
    │  │ Admin Panel                      │ │
    │  │ (Config, Scheduling, Audits)     │ │
    │  └──────────────────────────────────┘ │
    └──────────────────────────────────────┘
```

---

## 3. Database Design

### Current PoC Schema

```sql
-- Core domain model
TABLE partners (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  region VARCHAR(100),
  partner_type VARCHAR(50),
  salesforce_id VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

TABLE kpi_metrics (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  metric_name VARCHAR(255),
  metric_value DECIMAL(15,2),
  period_start DATE,
  period_end DATE,
  data_source VARCHAR(50),
  created_at TIMESTAMP
)

TABLE account_managers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  partner_ids TEXT[], -- JSON array of managed partner IDs
  role VARCHAR(50),
  region VARCHAR(100),
  created_at TIMESTAMP
)

TABLE smart_updates (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  generated_at TIMESTAMP,
  content TEXT,
  summary VARCHAR(500),
  urgency_level VARCHAR(20), -- critical, high, normal, low
  source_kpis TEXT[], -- JSON array of KPI IDs used
  created_at TIMESTAMP
)

TABLE prompt_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  template_text TEXT,
  target_audience VARCHAR(50),
  version INT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

TABLE update_schedules (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  account_manager_id UUID REFERENCES account_managers(id),
  frequency VARCHAR(50), -- daily, weekly, monthly
  scheduled_time TIME,
  is_active BOOLEAN,
  created_at TIMESTAMP
)
```

### Production Enhancements

#### 3.1 Data Versioning & Audit Trail

```sql
-- Audit logging for compliance and debugging
TABLE audit_logs (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id UUID,
  action VARCHAR(20), -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_timestamp (changed_at)
)

-- Partner KPI versioning (track historical changes)
TABLE kpi_metrics_versioned (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  metric_name VARCHAR(255),
  metric_value DECIMAL(15,2),
  period_start DATE,
  period_end DATE,
  version INT,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
)
```

#### 3.2 Multi-Tenant Support

```sql
-- Tenant isolation for future SaaS model
TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  domain VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
)

-- Add tenant_id to all tables
ALTER TABLE partners ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE smart_updates ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... and all other tables

-- Create indexes for tenant isolation
CREATE INDEX idx_partners_tenant ON partners(tenant_id, id);
CREATE INDEX idx_updates_tenant ON smart_updates(tenant_id, created_at);
```

#### 3.3 ETL Pipeline State Management

```sql
TABLE etl_sync_state (
  id UUID PRIMARY KEY,
  source_system VARCHAR(50), -- 'qollabi1', 'salesforce', 'external_api'
  last_sync_time TIMESTAMP,
  last_sync_status VARCHAR(20), -- 'success', 'partial', 'failed'
  total_records_synced INT,
  error_count INT,
  sync_duration_seconds INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

TABLE etl_import_queue (
  id UUID PRIMARY KEY,
  source_system VARCHAR(50),
  operation VARCHAR(20), -- 'INSERT', 'UPDATE', 'DELETE'
  entity_type VARCHAR(50),
  entity_data JSONB,
  status VARCHAR(20), -- 'pending', 'processing', 'completed', 'failed'
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP,
  processed_at TIMESTAMP
)
```

### Migration Strategy: SQLite → PostgreSQL

**Phase 1: Preparation (Day 1)**
- Create PostgreSQL database on production infrastructure
- Configure replication and backup strategy
- Set up monitoring and logging

**Phase 2: Initial Load (Day 2)**
- Export SQLite schema and migrate to PostgreSQL
- Data type mapping (SQLite TEXT → PostgreSQL VARCHAR/JSONB as appropriate)
- Create indexes from production PoC
- Run data validation queries to verify record counts

**Phase 3: Dual-Write Testing (Days 3-4)**
- Deploy code that writes to both SQLite and PostgreSQL
- Compare data consistency
- Validate query performance
- Test backups and recovery

**Phase 4: Cutover (Day 5)**
- Run final data sync
- Switch traffic to PostgreSQL
- Keep SQLite as hot backup for 2 weeks
- Monitor for issues

**Risk Mitigation:**
- Automated backup every 6 hours
- Rollback plan (revert to SQLite within 5 minutes)
- Monitoring alerts for replication lag

---

## 4. Smart Update Generator - Deep Dive

### 4.1 Prompt Engineering Strategy

The smart update system generates contextual business insights by combining partner data with Claude's reasoning capabilities. Success depends on reliable, repeatable prompt engineering.

#### Template System

```python
# PromptTemplate class for managing different update types
class PromptTemplate:
    """
    Manages prompt templates for different partner intelligence scenarios
    """
    def __init__(self, name: str, template_text: str, target_audience: str):
        self.name = name
        self.template_text = template_text
        self.target_audience = target_audience  # 'executive', 'manager', 'analyst'
        self.version = 1

    def render(self, context: dict) -> str:
        """Inject context variables into template"""
        return self.template_text.format(**context)

# Core templates (stored in database, versioned)

TEMPLATES = {
    "weekly_partner_update": """
You are a partner intelligence analyst. Generate a weekly update for {target_audience} regarding partner {partner_name}.

Partner Context:
- Industry: {industry}
- Region: {region}
- Contract Value: ${contract_value:,.0f}
- Key Products: {products}

Recent KPI Data:
{kpi_summary}

Historical Performance:
- 6-month revenue trend: {revenue_trend}
- Win rate: {win_rate}
- Deal velocity: {deal_velocity}

External Context:
- Recent news: {news_summary}
- Market trends: {market_trends}
- Competitive landscape: {competitive_context}

Generate a concise 3-4 paragraph intelligence update highlighting:
1. Notable performance changes (positive or concerning)
2. Risk factors or expansion opportunities
3. Recommended actions for the account team

Tone: Professional, data-driven, actionable. Avoid speculation.
Format: Plain text, no markdown.
""",

    "kpi_anomaly_alert": """
Analyze the following KPI anomaly and determine urgency level.

Partner: {partner_name}
Metric: {metric_name}
Expected Value: {expected_value}
Actual Value: {actual_value}
Change: {percent_change}%

Context:
- Historical average: {historical_average}
- Last quarter performance: {last_quarter}
- Industry benchmark: {industry_benchmark}

Determine if this anomaly is:
- CRITICAL: Requires immediate intervention (revenue risk, contract at risk)
- HIGH: Significant concern, address within 48 hours
- NORMAL: Routine variance, monitor

Provide:
1. Root cause hypothesis (1-2 sentences)
2. Urgency classification
3. Recommended next step (1-2 sentences)
""",

    "executive_monthly_summary": """
Generate a 1-page executive summary of partnership performance.

Portfolio Overview:
- Total partners: {total_partners}
- Portfolio revenue: ${portfolio_revenue:,.0f}
- Average contract health: {health_score}/100

Top Performers:
{top_performers_list}

Areas of Concern:
{concerning_partners_list}

Month-over-month metrics:
- New partnership registrations: {new_partners}
- Churn rate: {churn_rate}%
- Revenue growth: {revenue_growth}%

Key insights and strategic recommendations for leadership.
"""
}
```

#### Few-Shot Examples for Reliability

```python
# Store few-shot examples in database with human feedback
TABLE few_shot_examples (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES prompt_templates(id),
  input_context JSONB,
  expected_output TEXT,
  quality_rating INT, -- 1-5 stars, curated by humans
  category VARCHAR(50), -- 'anomaly', 'opportunity', 'risk'
  created_at TIMESTAMP
)

# Example usage in prompt
system_message = """
You are generating partner intelligence updates. Follow the patterns in these examples:

EXAMPLE 1 - High Opportunity Alert:
[Good example of format and reasoning]

EXAMPLE 2 - Risk Detection:
[Another good example showing proper analysis]

Now generate the update following the same structure and quality.
"""
```

#### Output Formatting Validation

```python
class SmartUpdateValidator:
    """Validate Claude output meets minimum quality standards"""

    def validate(self, update_text: str, template_type: str) -> dict:
        """Returns {'is_valid': bool, 'errors': [list], 'score': 0-100}"""

        validations = {
            'length': self._check_length(update_text, template_type),
            'structure': self._check_structure(update_text, template_type),
            'no_hallucination': self._check_factuality(update_text),
            'actionability': self._check_has_recommendations(update_text),
            'tone': self._check_professional_tone(update_text),
        }

        is_valid = all(v['passed'] for v in validations.values())
        score = sum(100 for v in validations.values() if v['passed']) // len(validations)

        return {
            'is_valid': is_valid,
            'score': score,
            'validations': validations,
            'confidence': 'high' if score > 85 else 'medium' if score > 70 else 'low'
        }
```

### 4.2 Claude API Integration

#### Model Selection & Configuration

```python
# claude-3-sonnet-20250229 recommended for this use case
# - Fast inference (sub-second for typical prompts)
# - Strong reasoning capabilities for business analysis
# - Cost-effective (~$3/M input tokens, $15/M output tokens)
# - Sufficient context window (200K tokens)

class ClaudeIntegration:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        self.model = "claude-3-5-sonnet-20241022"
        self.max_tokens = 1024
        self.temperature = 0.7  # Slight creativity for insights, but grounded

    async def generate_update(
        self,
        template: PromptTemplate,
        context: dict,
        system_message: str = None
    ) -> dict:
        """Generate a smart update with error handling and retry logic"""

        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_message or "You are a helpful business analyst.",
                messages=[
                    {
                        "role": "user",
                        "content": template.render(context)
                    }
                ]
            )

            content = response.content[0].text
            usage = {
                'input_tokens': response.usage.input_tokens,
                'output_tokens': response.usage.output_tokens,
                'cost': self._calculate_cost(response.usage)
            }

            return {
                'success': True,
                'content': content,
                'usage': usage,
                'model': self.model,
                'generated_at': datetime.utcnow()
            }

        except RateLimitError as e:
            # Implement exponential backoff
            await asyncio.sleep(2 ** self.retry_count)
            return await self.generate_update(template, context, system_message)
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return {
                'success': False,
                'error': str(e),
                'fallback_action': 'send_data_only'  # Send raw data to user
            }

    def _calculate_cost(self, usage) -> float:
        """Calculate API cost for this request"""
        input_cost = (usage.input_tokens / 1_000_000) * 3
        output_cost = (usage.output_tokens / 1_000_000) * 15
        return input_cost + output_cost
```

#### Token Management & Cost Estimation

```python
class TokenBudgetManager:
    """Track and optimize token usage across the platform"""

    def __init__(self, monthly_budget_usd: float = 1000):
        self.monthly_budget = monthly_budget_usd
        self.tokens_used_this_month = 0
        self.cost_this_month = 0.0

    def estimate_update_cost(
        self,
        template_type: str,
        num_partners: int,
        num_enrichment_sources: int = 1
    ) -> dict:
        """Estimate costs for a batch of updates"""

        # Average token counts by template type
        template_tokens = {
            'weekly_update': 800,
            'anomaly_alert': 300,
            'monthly_summary': 1500,
        }

        prompt_tokens = template_tokens.get(template_type, 600)
        # Output typically 30-40% of prompt size
        completion_tokens = int(prompt_tokens * 0.35)

        tokens_per_update = prompt_tokens + completion_tokens
        total_tokens = tokens_per_update * num_partners

        # Add 20% overhead for retries and failed generations
        total_with_overhead = int(total_tokens * 1.2)

        input_cost = (total_with_overhead * 0.6 / 1_000_000) * 3  # 60% input
        output_cost = (total_with_overhead * 0.4 / 1_000_000) * 15  # 40% output

        return {
            'template': template_type,
            'num_partners': num_partners,
            'tokens_per_update': tokens_per_update,
            'total_tokens': total_with_overhead,
            'estimated_cost': input_cost + output_cost,
            'monthly_estimate': (input_cost + output_cost) * 4.33,  # weekly updates
            'tokens_remaining_monthly': self.monthly_budget - self.cost_this_month
        }

    def should_proceed(self, estimated_cost: float) -> bool:
        """Check if generation would exceed monthly budget"""
        return (self.cost_this_month + estimated_cost) <= self.monthly_budget
```

### 4.3 Multi-Channel Delivery Architecture

```python
class DeliveryChannel(ABC):
    """Abstract base for delivery implementations"""

    @abstractmethod
    async def send(self, recipient: str, subject: str, content: str, metadata: dict) -> bool:
        pass

    @abstractmethod
    async def get_status(self, message_id: str) -> dict:
        pass

class EmailChannel(DeliveryChannel):
    """SMTP-based email delivery with tracking"""

    def __init__(self):
        self.smtp_config = {
            'host': os.getenv('SMTP_HOST'),  # e.g., 'smtp.sendgrid.net'
            'port': int(os.getenv('SMTP_PORT', 587)),
            'username': os.getenv('SMTP_USER'),
            'password': os.getenv('SMTP_PASSWORD'),
        }
        self.client = aiosmtplib.SMTP(hostname=self.smtp_config['host'])

    async def send(self, recipient: str, subject: str, content: str, metadata: dict) -> bool:
        """Send email with HTML formatting and tracking"""

        html_content = self._format_html(content)
        message = EmailMessage()
        message['From'] = os.getenv('FROM_EMAIL')
        message['To'] = recipient
        message['Subject'] = subject
        message.set_content(content)
        message.add_alternative(html_content, subtype='html')

        # Add tracking pixel
        tracking_id = str(uuid.uuid4())
        message.add_alternative(
            f'<img src="https://qollabi.example.com/track/{tracking_id}" width="1" height="1" />',
            subtype='html'
        )

        try:
            async with aiosmtplib.SMTP(hostname=self.smtp_config['host']) as smtp:
                await smtp.login(self.smtp_config['username'], self.smtp_config['password'])
                await smtp.send_message(message)

            # Log delivery event
            await self._log_delivery(tracking_id, recipient, 'success')
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False

class PDFGenerationChannel(DeliveryChannel):
    """Generate PDF reports using ReportLab or similar"""

    async def send(self, recipient: str, subject: str, content: str, metadata: dict) -> bool:
        """Generate PDF and store for later delivery"""

        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, title=subject)
        story = []

        # Parse content and create PDF elements
        story.append(Paragraph(subject, styles['Heading1']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(content, styles['BodyText']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Generated: {datetime.now().isoformat()}", styles['Normal']))

        doc.build(story)
        pdf_data = pdf_buffer.getvalue()

        # Store PDF in S3/cloud storage
        s3_key = f"updates/{metadata['partner_id']}/{datetime.now():%Y%m%d_%H%M%S}.pdf"
        await self._upload_to_s3(s3_key, pdf_data)

        # Log delivery event
        await self._log_delivery(s3_key, recipient, 'success', pdf_url=f"s3://{s3_key}")
        return True

class WebhookChannel(DeliveryChannel):
    """Deliver updates via webhook to external systems"""

    async def send(self, recipient: str, subject: str, content: str, metadata: dict) -> bool:
        """POST update to webhook endpoint"""

        payload = {
            'partner_id': metadata['partner_id'],
            'subject': subject,
            'content': content,
            'timestamp': datetime.utcnow().isoformat(),
            'template_type': metadata.get('template_type'),
            'urgency': metadata.get('urgency_level')
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    recipient,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10),
                    headers={'X-Qollabi-Signature': self._sign_request(payload)}
                ) as resp:
                    return resp.status == 200
        except Exception as e:
            logger.error(f"Webhook delivery failed: {e}")
            return False

class FTPChannel(DeliveryChannel):
    """Deliver files via FTP for legacy system integration"""

    async def send(self, recipient: str, subject: str, content: str, metadata: dict) -> bool:
        """Upload update to FTP server in partner-specific directory"""

        ftp_config = {
            'host': os.getenv('FTP_HOST'),
            'user': os.getenv('FTP_USER'),
            'password': os.getenv('FTP_PASSWORD'),
        }

        filename = f"{metadata['partner_id']}_{datetime.now():%Y%m%d_%H%M%S}.txt"

        try:
            ftp = aioftp.FTP()
            await ftp.connect(ftp_config['host'])
            await ftp.login(ftp_config['user'], ftp_config['password'])

            # Create partner-specific directory if needed
            target_dir = f"/updates/{metadata['partner_id']}"
            await ftp.makedirs(target_dir, exist_ok=True)

            # Upload file
            async with ftp.open(f"{target_dir}/{filename}", 'wb') as fp:
                await fp.write(content.encode())

            await ftp.quit()
            return True
        except Exception as e:
            logger.error(f"FTP upload failed: {e}")
            return False

# Delivery orchestrator
class DeliveryOrchestrator:
    """Manages multi-channel delivery with fallbacks"""

    def __init__(self):
        self.channels = {
            'email': EmailChannel(),
            'pdf': PDFGenerationChannel(),
            'webhook': WebhookChannel(),
            'ftp': FTPChannel(),
        }

    async def deliver(self, delivery_plan: dict) -> dict:
        """Execute delivery across multiple channels"""

        results = {}

        for channel_name, config in delivery_plan['channels'].items():
            if channel_name not in self.channels:
                continue

            channel = self.channels[channel_name]
            success = await channel.send(
                recipient=config['recipient'],
                subject=delivery_plan['subject'],
                content=delivery_plan['content'],
                metadata=delivery_plan['metadata']
            )

            results[channel_name] = {
                'success': success,
                'timestamp': datetime.utcnow(),
                'fallback_triggered': False
            }

            # Fallback strategy: if email fails, try webhook or FTP
            if not success and channel_name == 'email' and 'webhook' in delivery_plan['channels']:
                webhook_config = delivery_plan['channels']['webhook']
                fallback_success = await self.channels['webhook'].send(
                    recipient=webhook_config['recipient'],
                    subject=delivery_plan['subject'],
                    content=delivery_plan['content'],
                    metadata=delivery_plan['metadata']
                )
                results['webhook']['fallback_triggered'] = True
                results['webhook']['success'] = fallback_success

        return results
```

### 4.4 Scheduling System: Celery + Redis (Recommended)

**Why Celery over APScheduler:**
- Distributed task execution (scale to multiple workers)
- Persistent job queue (survives restarts)
- Retry logic with exponential backoff
- Task chaining and error callbacks
- Better monitoring and debugging

```python
# celery_app.py
from celery import Celery, group, chord
from celery.schedules import crontab

app = Celery(
    'qollabi',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379'),
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30*60,  # Hard limit: 30 minutes
    task_soft_time_limit=25*60,  # Soft limit: 25 minutes
)

# Periodic tasks
app.conf.beat_schedule = {
    'daily-partner-updates': {
        'task': 'qollabi.tasks.generate_daily_updates',
        'schedule': crontab(hour=7, minute=0),  # 7 AM UTC daily
    },
    'weekly-executive-summary': {
        'task': 'qollabi.tasks.generate_executive_summary',
        'schedule': crontab(day_of_week=0, hour=8, minute=0),  # Monday 8 AM UTC
    },
    'sync-external-data': {
        'task': 'qollabi.tasks.sync_from_salesforce',
        'schedule': crontab(minute=0),  # Every hour
    },
    'check-kpi-anomalies': {
        'task': 'qollabi.tasks.detect_anomalies',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    }
}

@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
async def generate_daily_updates(self):
    """Generate daily updates for all active partners"""

    # Get all partners with active schedules
    partners = await db.query(
        "SELECT id, name, industry FROM partners WHERE active = true"
    )

    # Create task group for parallel execution
    tasks = group([
        generate_partner_update.s(partner_id, 'daily')
        for partner in partners
    ])

    # Execute in parallel, collect results with chord
    result_callback = chord(tasks)(collect_update_results.s())
    return result_callback

@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
async def generate_partner_update(self, partner_id: str, frequency: str):
    """Generate single partner update with error handling"""

    try:
        partner = await db.get_partner(partner_id)

        # Enrich with external data
        context = await enrich_partner_context(partner)

        # Generate using Claude
        update = await claude_service.generate_update(
            template='weekly_update',
            context=context
        )

        # Validate output
        validation = SmartUpdateValidator().validate(update['content'], 'weekly_update')
        if not validation['is_valid']:
            logger.warning(f"Low confidence update for {partner_id}: {validation}")

        # Save to database
        saved_update = await db.save_smart_update(
            partner_id=partner_id,
            content=update['content'],
            confidence=validation['confidence'],
            tokens_used=update['usage']['input_tokens'] + update['usage']['output_tokens'],
            cost=update['usage']['cost']
        )

        # Deliver to assigned account managers
        delivery_plan = await build_delivery_plan(partner_id, saved_update)
        await delivery_service.deliver(delivery_plan)

        return {
            'partner_id': partner_id,
            'update_id': saved_update['id'],
            'status': 'success',
            'cost': update['usage']['cost']
        }

    except Exception as e:
        logger.error(f"Update generation failed for {partner_id}: {e}")
        raise
```

### 4.5 Target Group System

```python
class TargetGroupSelector:
    """Determine recipients based on partner and update type"""

    async def select_recipients(
        self,
        partner_id: str,
        update_type: str,
        urgency_level: str
    ) -> dict:
        """Return delivery recipients and channels based on rules"""

        partner = await db.get_partner(partner_id)

        # Base rules: who always receives updates
        rules = {
            'account_manager': {
                'recipients': await self._get_account_managers(partner_id),
                'channels': ['email', 'dashboard'],
                'urgency_threshold': 'normal',  # Send all
            },
            'leadership': {
                'recipients': await self._get_leadership(partner.region),
                'channels': ['email', 'dashboard'],
                'urgency_threshold': 'high',  # Only high/critical
            },
            'finance': {
                'recipients': await self._get_finance_team(),
                'channels': ['email', 'pdf'],
                'urgency_threshold': 'high',
            },
            'executives': {
                'recipients': await self._get_executives(),
                'channels': ['email', 'pdf', 'dashboard'],
                'urgency_threshold': 'critical',  # Only critical
            }
        }

        # Filter by urgency
        recipients = {}
        for group_name, config in rules.items():
            if self._should_notify(urgency_level, config['urgency_threshold']):
                recipients[group_name] = config['recipients']

        # Custom rules: override based on partner attributes
        if partner.get('contract_value', 0) > 1_000_000:  # VIP accounts
            if 'executives' not in recipients:
                recipients['executives'] = await self._get_executives()

        if urgency_level == 'critical':
            # Add escalation contacts
            recipients['escalation'] = await self._get_escalation_contacts(partner_id)

        return {
            'partner_id': partner_id,
            'recipients': recipients,
            'channels': self._merge_channels(recipients),
            'priority': urgency_level == 'critical'
        }

    def _should_notify(self, actual_urgency: str, threshold: str) -> bool:
        """Check if urgency meets notification threshold"""
        urgency_order = {'low': 0, 'normal': 1, 'high': 2, 'critical': 3}
        return urgency_order.get(actual_urgency, 0) >= urgency_order.get(threshold, 0)
```

### 4.6 Web Context Enrichment

```python
class WebContextEnricher:
    """Enrich partner data with external intelligence"""

    def __init__(self):
        # API keys should be from environment
        self.linkedin_api = LinkedInAPI(os.getenv('LINKEDIN_API_KEY'))
        self.news_api = NewsAPI(os.getenv('NEWS_API_KEY'))
        self.serper_api = SerperAPI(os.getenv('SERPER_API_KEY'))  # Google search
        self.cache = aioredis.from_url(os.getenv('REDIS_URL'))

    async def enrich(self, partner: dict) -> dict:
        """Fetch and cache web context for a partner"""

        cache_key = f"enrichment:{partner['id']}:{datetime.now():%Y%m%d}"

        # Check cache first (24-hour TTL)
        cached = await self.cache.get(cache_key)
        if cached:
            return json.loads(cached)

        # Parallel fetch from all sources
        enrichment = await asyncio.gather(
            self._fetch_linkedin_company_info(partner['name']),
            self._fetch_recent_news(partner['name'], partner.get('industry')),
            self._fetch_market_trends(partner.get('industry')),
            self._check_job_postings(partner['name']),
            self._fetch_sec_filings(partner['name']) if partner.get('is_public') else None,
            return_exceptions=True
        )

        enriched = {
            'partner_id': partner['id'],
            'linkedin': enrichment[0] if not isinstance(enrichment[0], Exception) else None,
            'news': enrichment[1] if not isinstance(enrichment[1], Exception) else None,
            'market_trends': enrichment[2] if not isinstance(enrichment[2], Exception) else None,
            'hiring_activity': enrichment[3] if not isinstance(enrichment[3], Exception) else None,
            'sec_filings': enrichment[4] if enrichment[4] and not isinstance(enrichment[4], Exception) else None,
            'fetched_at': datetime.utcnow().isoformat(),
        }

        # Cache for 24 hours
        await self.cache.setex(cache_key, 86400, json.dumps(enriched))

        return enriched

    async def _fetch_recent_news(self, company_name: str, industry: str = None) -> dict:
        """Fetch recent news using NewsAPI"""

        try:
            # NewsAPI free tier: 100 requests/day
            results = await asyncio.to_thread(
                self.news_api.get_everything,
                q=f'"{company_name}"',
                sort_by='publishedAt',
                language='en',
                from_param=(datetime.utcnow() - timedelta(days=30)).isoformat(),
                page_size=5
            )

            return {
                'articles': [
                    {
                        'title': article['title'],
                        'url': article['url'],
                        'published_at': article['publishedAt'],
                        'source': article['source']['name'],
                        'summary': article.get('description', '')
                    }
                    for article in results['articles']
                ],
                'total_results': results['totalResults']
            }
        except Exception as e:
            logger.error(f"News fetch failed for {company_name}: {e}")
            return None

    async def _fetch_linkedin_company_info(self, company_name: str) -> dict:
        """Fetch LinkedIn company data"""

        try:
            # Scrape using Serper (more reliable than direct LinkedIn API)
            results = await asyncio.to_thread(
                self.serper_api.search,
                f'site:linkedin.com/company/ "{company_name}"'
            )

            if results['organic']:
                linkedin_url = results['organic'][0]['link']

                # Would use a scraper or official API here
                company_data = await self._scrape_linkedin_company(linkedin_url)
                return company_data
        except Exception as e:
            logger.error(f"LinkedIn fetch failed for {company_name}: {e}")
            return None

    async def _check_job_postings(self, company_name: str) -> dict:
        """Monitor hiring activity via job boards"""

        try:
            # Using free APIs: LinkedIn Jobs, Indeed, Glassdoor
            results = await asyncio.gather(
                self._search_linkedin_jobs(company_name),
                self._search_indeed_jobs(company_name),
                return_exceptions=True
            )

            total_postings = sum(
                r.get('count', 0) for r in results if not isinstance(r, Exception)
            )

            return {
                'total_open_positions': total_postings,
                'hiring_trend': 'increasing' if total_postings > 10 else 'stable',
                'popular_roles': self._extract_popular_roles(results),
            }
        except Exception as e:
            logger.error(f"Job posting check failed: {e}")
            return None
```

**Rate Limits & Caching Strategy:**
- LinkedIn: 300 req/day (enterprise) - cache 24 hours
- NewsAPI: 100 req/day (free) - cache 12 hours, aggregate multiple partners
- Serper (Google): 100 req/month (free) - cache 7 days
- Redis: In-memory cache for all enrichment data

### 4.7 Cost Analysis

#### Cost Estimation Model

```python
class CostAnalyzer:
    """Estimate and track Claude API costs"""

    # Pricing as of April 2026
    PRICING = {
        'claude-3-5-sonnet-20241022': {
            'input': 3 / 1_000_000,      # $3 per 1M input tokens
            'output': 15 / 1_000_000,    # $15 per 1M output tokens
        }
    }

    def estimate_monthly_costs(self, config: dict) -> dict:
        """
        config = {
            'num_partners': 100,
            'update_frequency': 'daily',  # daily, weekly, monthly
            'templates': ['weekly_update', 'anomaly_alert', 'monthly_summary'],
            'enrichment_enabled': True,
        }
        """

        # Token estimates by template (empirically measured)
        template_tokens = {
            'weekly_update': {'prompt': 800, 'completion': 280},
            'anomaly_alert': {'prompt': 300, 'completion': 105},
            'monthly_summary': {'prompt': 1500, 'completion': 525},
            'executive_summary': {'prompt': 2000, 'completion': 700},
        }

        # Frequency multiplier
        frequency_multiplier = {
            'daily': 30,  # per month
            'weekly': 4.3,
            'monthly': 1,
        }

        total_cost = 0
        breakdown = {}

        for template in config['templates']:
            tokens = template_tokens[template]
            frequency = frequency_multiplier[config['update_frequency']]

            # Cost per update
            input_cost = tokens['prompt'] * self.PRICING['claude-3-5-sonnet-20241022']['input']
            output_cost = tokens['completion'] * self.PRICING['claude-3-5-sonnet-20241022']['output']
            cost_per_update = input_cost + output_cost

            # Monthly cost
            monthly_cost = cost_per_update * config['num_partners'] * frequency

            # Add 20% for retries and failed generations
            monthly_cost *= 1.2

            breakdown[template] = {
                'tokens_per_update': tokens['prompt'] + tokens['completion'],
                'cost_per_update': cost_per_update,
                'monthly_updates': config['num_partners'] * frequency,
                'monthly_cost': monthly_cost,
            }

            total_cost += monthly_cost

        # Infrastructure costs (infrastructure costs separately)
        return {
            'claude_api_monthly': total_cost,
            'breakdown': breakdown,
            'per_partner_monthly': total_cost / config['num_partners'],
            'cost_per_update_average': total_cost / (
                sum(b['monthly_updates'] for b in breakdown.values())
            ),
            'annual_estimate': total_cost * 12,
        }

# Example calculations for different scales:

# Small: 50 partners, weekly updates
# - 50 partners × 4.3 weeks × 1 update/week = 215 updates/month
# - Average 400 tokens per update (accounting for retries)
# - Cost: ~$0.75 per update × 215 = ~$161/month = ~$1,932/year

# Medium: 200 partners, daily updates + anomaly checks
# - 200 × 30 = 6,000 daily updates
# - 200 × 96 = 19,200 anomaly checks (4x daily)
# - Average 300 tokens per check
# - Cost: ~$0.12 per daily + ~$0.03 per anomaly = ~$900/month = ~$10,800/year

# Large: 500 partners, daily + anomalies + summaries
# - 500 × 30 = 15,000 daily updates
# - 500 × 96 = 48,000 anomaly checks
# - 500 × 1 = 500 weekly summaries
# - Cost: ~$2,500/month = ~$30,000/year
```

---

## 5. Dashboard Module - Deep Dive

### 5.1 Charting Library Selection

| Aspect | Recharts | Chart.js | D3.js | Plotly |
|--------|----------|----------|-------|--------|
| Learning Curve | Easy | Easy | Steep | Medium |
| Customization | Good | Good | Excellent | Good |
| Bundle Size | 45KB | 30KB | 150KB | 300KB |
| Real-time Data | Good | Good | Excellent | Good |
| Time Series | Very Good | Good | Excellent | Good |
| **Recommendation** | ✓ Primary | Secondary | Advanced | Dashboards |

**Recommendation: Recharts for standard dashboards, D3 for custom visualizations**

```tsx
// Standard dashboard component using Recharts
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';

const PartnerDashboard: React.FC<{ partnerId: string }> = ({ partnerId }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/dashboard/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const dashboardData = await response.json();
      setData(dashboardData);
      setLoading(false);
    };

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [partnerId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorMessage />;

  return (
    <div className="dashboard-grid">
      {/* KPI Cards */}
      <div className="kpi-row">
        <KPICard label="Revenue (YTD)" value={`$${data.revenue_ytd:,.0f}`} trend={data.revenue_trend} />
        <KPICard label="Deal Count" value={data.deal_count} trend={data.deal_trend} />
        <KPICard label="Win Rate" value={`${data.win_rate}%`} trend={data.win_rate_trend} />
        <KPICard label="Health Score" value={data.health_score} trend={null} />
      </div>

      {/* Revenue Trend Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.revenue_history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value:,.0f}`} />
          <Legend />
          <Line type="monotone" dataKey="actual_revenue" stroke="#8884d8" />
          <Line type="monotone" dataKey="forecast_revenue" stroke="#82ca9d" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>

      {/* Deal Pipeline */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.deal_pipeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
          <Bar dataKey="value" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      {/* Recent Updates */}
      <div className="updates-panel">
        <h3>Recent Intelligence Updates</h3>
        {data.recent_updates.map((update) => (
          <UpdateCard key={update.id} update={update} />
        ))}
      </div>
    </div>
  );
};
```

### 5.2 AI-Driven Dashboards: Natural Language to SQL

```python
class NaturalLanguageDashboard:
    """Convert natural language queries to SQL safely"""

    def __init__(self):
        self.claude = ClaudeIntegration()
        self.db = Database()
        # Schema safe to expose to LLM
        self.safe_schema = self._build_safe_schema()

    async def query_from_natural_language(self, query: str, tenant_id: str) -> dict:
        """Convert NL to SQL with safety guardrails"""

        # 1. Validate query doesn't attempt SQL injection
        if self._contains_suspicious_patterns(query):
            return {'error': 'Query contains invalid patterns'}

        # 2. Generate SQL using Claude with strict schema
        prompt = f"""
You are a SQL expert assistant. Convert the natural language query to safe PostgreSQL.

SCHEMA (read-only views only):
{self._get_safe_schema_definition()}

TENANT_ID: {tenant_id}

CRITICAL RULES:
1. ALWAYS filter by tenant_id = {tenant_id}
2. ONLY read operations allowed (SELECT)
3. NO joins across tenant boundaries
4. Limit results to 1000 rows
5. Use parameterized queries

Query: "{query}"

Return ONLY valid SQL, no explanation.
"""

        response = await self.claude.generate_sql(prompt)
        sql = response['content'].strip()

        # 3. Validate generated SQL
        validation = self._validate_sql_safety(sql, tenant_id)
        if not validation['safe']:
            logger.warning(f"Unsafe SQL generated: {sql}")
            return {'error': 'Query validation failed'}

        # 4. Execute with timeout
        try:
            results = await self.db.execute_with_timeout(sql, timeout_seconds=30)

            # 5. Visualize results
            chart_suggestion = self._suggest_visualization(results, query)

            return {
                'results': results,
                'sql_used': sql,  # Log for audit trail
                'chart_type': chart_suggestion,
                'row_count': len(results),
            }

        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return {'error': 'Query execution failed'}

    def _validate_sql_safety(self, sql: str, tenant_id: str) -> dict:
        """Ensure SQL doesn't violate security rules"""

        dangerous_patterns = [
            r'DROP\s+TABLE',
            r'DELETE\s+FROM',
            r'UPDATE\s+',
            r'INSERT\s+INTO',
            r'ALTER\s+TABLE',
            r'CREATE\s+TABLE',
            r'TRUNCATE',
            r'--',  # SQL comments
            r'/\*.*\*/',  # Block comments
        ]

        sql_upper = sql.upper()

        for pattern in dangerous_patterns:
            if re.search(pattern, sql_upper):
                return {'safe': False, 'reason': f'Dangerous pattern: {pattern}'}

        # Check tenant isolation
        if f"tenant_id = '{tenant_id}'" not in sql and f'tenant_id = {tenant_id}' not in sql:
            return {'safe': False, 'reason': 'Missing tenant_id filter'}

        return {'safe': True}

    def _build_safe_schema(self) -> str:
        """Create read-only views for natural language queries"""

        # Only expose aggregated/safe data to LLM
        return """
-- Partner Summary View
CREATE VIEW partner_summary AS
SELECT
  partner_id,
  partner_name,
  industry,
  region,
  total_revenue,
  deal_count,
  win_rate
FROM partners
WHERE tenant_id = current_tenant_id()

-- KPI History View (aggregated)
CREATE VIEW kpi_monthly AS
SELECT
  partner_id,
  metric_name,
  DATE_TRUNC('month', period_date) as month,
  AVG(metric_value) as avg_value,
  MAX(metric_value) as max_value,
  MIN(metric_value) as min_value
FROM kpi_metrics
WHERE tenant_id = current_tenant_id()
GROUP BY partner_id, metric_name, month

-- Smart Updates View
CREATE VIEW update_summary AS
SELECT
  partner_id,
  update_date,
  COUNT(*) as update_count,
  AVG(confidence_score) as avg_confidence,
  SUM(cost) as total_cost
FROM smart_updates
WHERE tenant_id = current_tenant_id()
GROUP BY partner_id, update_date
"""
```

### 5.3 Real-Time vs Cached Data Strategy

```python
class DashboardDataStrategy:
    """Determine optimal data freshness by use case"""

    async def get_dashboard_data(
        self,
        dashboard_type: str,
        partner_id: str,
        force_refresh: bool = False
    ) -> dict:
        """
        Adaptive caching strategy:
        - Executive summaries: 1-hour cache
        - Manager dashboards: 5-minute cache
        - Real-time alerts: No cache
        - Historical trends: Daily cache
        """

        cache_config = {
            'executive_summary': {
                'ttl': 3600,  # 1 hour
                'priority': 'fast',
            },
            'account_manager_dashboard': {
                'ttl': 300,   # 5 minutes
                'priority': 'balanced',
            },
            'real_time_alerts': {
                'ttl': 0,     # No cache
                'priority': 'accuracy',
            },
            'historical_trends': {
                'ttl': 86400, # 1 day
                'priority': 'fast',
            },
        }

        config = cache_config.get(dashboard_type, {'ttl': 600, 'priority': 'balanced'})

        if not force_refresh and config['ttl'] > 0:
            cached = await self.cache.get(f"dashboard:{dashboard_type}:{partner_id}")
            if cached:
                return json.loads(cached)

        # Fetch fresh data
        if dashboard_type == 'executive_summary':
            data = await self._fetch_executive_summary(partner_id)
        elif dashboard_type == 'account_manager_dashboard':
            data = await self._fetch_manager_dashboard(partner_id)
        elif dashboard_type == 'real_time_alerts':
            data = await self._fetch_real_time_alerts(partner_id)
        else:
            data = await self._fetch_historical_trends(partner_id)

        # Cache result
        if config['ttl'] > 0:
            await self.cache.setex(
                f"dashboard:{dashboard_type}:{partner_id}",
                config['ttl'],
                json.dumps(data)
            )

        return data

    async def _fetch_real_time_alerts(self, partner_id: str) -> dict:
        """Fetch latest alerts without caching"""

        # Query latest KPIs
        latest_kpis = await self.db.query("""
            SELECT metric_name, metric_value, threshold_value,
                   CASE WHEN metric_value > threshold_value THEN 'above' ELSE 'below' END as status,
                   updated_at
            FROM kpi_metrics
            WHERE partner_id = $1
            ORDER BY updated_at DESC
            LIMIT 20
        """, [partner_id])

        return {
            'alerts': [
                {
                    'metric': kpi['metric_name'],
                    'value': kpi['metric_value'],
                    'status': kpi['status'],
                    'severity': self._calculate_severity(kpi),
                    'timestamp': kpi['updated_at'],
                }
                for kpi in latest_kpis
            ],
            'last_checked': datetime.utcnow(),
        }
```

### 5.4 Export Capabilities

```python
class DashboardExport:
    """Export dashboards in multiple formats"""

    async def export_to_pdf(self, dashboard_id: str, format_options: dict) -> bytes:
        """Generate PDF report from dashboard"""

        # Use Plotly or Weasyprint for complex layouts
        html = await self._render_dashboard_html(dashboard_id, format_options)

        pdf_bytes = await asyncio.to_thread(
            weasyprint.HTML(string=html).write_pdf
        )
        return pdf_bytes

    async def export_to_excel(self, dashboard_id: str) -> bytes:
        """Export data to Excel with formatting"""

        data = await self._get_dashboard_data(dashboard_id)

        workbook = openpyxl.Workbook()

        # Create sheets for each data series
        for series_name, series_data in data.items():
            ws = workbook.create_sheet(series_name)

            # Add headers
            if series_data:
                headers = list(series_data[0].keys())
                ws.append(headers)

                # Add data rows
                for row in series_data:
                    ws.append([row.get(h) for h in headers])

        # Format and save
        buffer = BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()

    async def export_to_image(self, dashboard_id: str, format: str = 'png') -> bytes:
        """Export individual charts as images"""

        # Use kaleido (Plotly) or Pillow
        html = await self._render_single_chart(dashboard_id)

        image_bytes = await asyncio.to_thread(
            kaleido.screenshot,
            html,
            format=format,  # 'png', 'jpg', 'svg'
            width=1200,
            height=800,
        )
        return image_bytes
```

---

## 6. Security & Authentication

### 6.1 Authentication Architecture

**Recommended: Clerk (developer-friendly, secure, SOC 2 certified)**

```typescript
// Next.js/React integration with Clerk
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

// Protected API route
import { withAuth } from '@clerk/nextjs';

export const getServerSideProps = withAuth(async (context) => {
  const { userId } = context.req.auth;

  if (!userId) {
    return { redirect: { destination: '/sign-in' } };
  }

  return { props: { userId } };
});
```

**Alternative options:**
- **Auth0:** Enterprise-grade, many integrations, higher cost
- **Supabase Auth:** Open-source, PostgreSQL-native, good for self-hosted
- **Custom JWT:** Most control, requires careful security implementation

### 6.2 Role-Based Access Control (RBAC)

```python
from enum import Enum
from sqlalchemy import Column, String, Boolean, Table, ForeignKey

class Role(str, Enum):
    ADMIN = "admin"
    LEADERSHIP = "leadership"
    ACCOUNT_MANAGER = "account_manager"
    ANALYST = "analyst"
    VIEWER = "viewer"

# Database schema for RBAC
class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[str]  # From Clerk
    role: Mapped[Role]
    tenant_id: Mapped[UUID] = mapped_column(ForeignKey("tenants.id"))
    granted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    granted_by: Mapped[str]  # Admin who granted role

class PartnerAccessGrant(Base):
    """Fine-grained access: who can access which partners"""

    __tablename__ = "partner_access_grants"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[str]  # Clerk user ID
    partner_id: Mapped[UUID] = mapped_column(ForeignKey("partners.id"))
    access_level: Mapped[str]  # 'view', 'edit', 'admin'
    region_filter: Mapped[Optional[str]]  # Restrict to region
    granted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

# Authorization middleware
async def require_role(*required_roles: Role):
    """FastAPI dependency for role-based access"""

    async def verify_role(request: Request) -> dict:
        user_id = request.state.user_id  # From Clerk JWT

        user_role = await db.query_one(
            """
            SELECT role FROM user_roles
            WHERE user_id = $1 AND tenant_id = $2
            """,
            [user_id, request.state.tenant_id]
        )

        if not user_role or user_role['role'] not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        return {'user_id': user_id, 'role': user_role['role']}

    return verify_role

# Usage in routes
@app.post("/api/partners/{partner_id}/update-schedule")
async def update_schedule(
    partner_id: UUID,
    schedule_data: ScheduleUpdate,
    auth: dict = Depends(require_role(Role.ADMIN, Role.ACCOUNT_MANAGER))
):
    # Verify user can access this partner
    can_access = await db.query_one(
        """
        SELECT 1 FROM partner_access_grants
        WHERE user_id = $1 AND partner_id = $2
        """,
        [auth['user_id'], partner_id]
    )

    if not can_access:
        raise HTTPException(status_code=403, detail="No access to this partner")

    # Update schedule...
```

### 6.3 API Key Management

```python
class APIKeyManager:
    """Manage API keys for external services securely"""

    async def rotate_claude_api_key(self):
        """Rotate Claude API key monthly"""

        # Store encrypted in PostgreSQL
        old_key = await self._get_current_key()
        new_key = os.getenv('ANTHROPIC_API_KEY_NEW')

        # Test new key
        try:
            test_response = await asyncio.to_thread(
                lambda: Anthropic(api_key=new_key).messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=10,
                    messages=[{"role": "user", "content": "test"}]
                )
            )
        except Exception as e:
            logger.error(f"New API key validation failed: {e}")
            return False

        # Store new key encrypted
        await self._store_encrypted_key('claude', new_key)

        # Log rotation
        await db.insert_audit_log({
            'action': 'api_key_rotation',
            'service': 'claude',
            'performed_by': 'system',
            'timestamp': datetime.utcnow()
        })

        return True

    async def _store_encrypted_key(self, service: str, key: str):
        """Store API key encrypted at rest"""

        cipher_suite = Fernet(os.getenv('ENCRYPTION_KEY').encode())
        encrypted = cipher_suite.encrypt(key.encode())

        await db.execute("""
            INSERT INTO api_keys (service, encrypted_key, rotated_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (service) DO UPDATE SET
                encrypted_key = $2, rotated_at = $3
        """, [service, encrypted, datetime.utcnow()])
```

### 6.4 Data Access Control

```python
class DataAccessController:
    """Enforce data isolation per manager/region"""

    async def get_filtered_partners(self, user_id: str, tenant_id: UUID) -> list:
        """Return only partners the user has access to"""

        user = await db.get_user(user_id)

        query = "SELECT * FROM partners WHERE tenant_id = $1"
        params = [tenant_id]

        # Apply filters based on role
        if user['role'] == Role.ACCOUNT_MANAGER:
            query += " AND id = ANY($2)"
            params.append(user['managed_partner_ids'])

        elif user['role'] == Role.LEADERSHIP:
            # Leadership only sees their region
            query += " AND region = $2"
            params.append(user['region'])

        # ADMIN and ANALYST see everything

        return await db.query(query, params)

    async def audit_data_access(self, user_id: str, resource_type: str, resource_id: UUID):
        """Log data access for compliance"""

        await db.insert_audit_log({
            'user_id': user_id,
            'action': 'data_access',
            'resource_type': resource_type,
            'resource_id': resource_id,
            'timestamp': datetime.utcnow(),
            'ip_address': request.client.host,
        })
```

---

## 7. Deployment & Infrastructure

### 7.1 Deployment Strategy: Docker + AWS

**Recommended Architecture:**
- **Compute:** AWS ECS (Elastic Container Service) + Fargate (serverless)
- **Database:** AWS RDS PostgreSQL (Multi-AZ for HA)
- **Cache:** ElastiCache Redis
- **Task Queue:** ECS + SQS (for Celery)
- **Storage:** S3 (PDFs, exported files)
- **CDN:** CloudFront
- **Secrets:** AWS Secrets Manager

```dockerfile
# Dockerfile - Production
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run FastAPI with gunicorn
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "app.main:app"]
```

```yaml
# AWS ECS Task Definition
{
  "family": "qollabi-api",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/qollabi-task-role",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "qollabi-api",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/qollabi:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        },
        {
          "name": "LOG_LEVEL",
          "value": "INFO"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:qollabi/db-url"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:qollabi/claude-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/qollabi-api",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 7.2 CI/CD Pipeline: GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: qollabi
  ECS_SERVICE: qollabi-api
  ECS_CLUSTER: qollabi-prod

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: qollabi_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements-dev.txt

      - name: Lint with flake8
        run: |
          flake8 app/ --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Type check with mypy
        run: mypy app/ --ignore-missing-imports

      - name: Run tests
        run: pytest tests/ -v --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/qollabi_test
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: qollabi-api
          image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

### 7.3 Environment Management

```bash
# .env.production
DATABASE_URL=postgresql://user:password@qollabi-prod.XXXXXX.us-east-1.rds.amazonaws.com:5432/qollabi
REDIS_URL=redis://qollabi-cache.XXXXXX.ng.0001.use1.cache.amazonaws.com:6379
ENVIRONMENT=production
LOG_LEVEL=INFO
ANTHROPIC_API_KEY=${aws:secretsmanager:qollabi/claude-api-key}
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_USER=${aws:secretsmanager:qollabi/smtp-user}
SMTP_PASSWORD=${aws:secretsmanager:qollabi/smtp-password}
FROM_EMAIL=updates@qollabi.example.com
AWS_S3_BUCKET=qollabi-prod-storage
CLERK_SECRET_KEY=${aws:secretsmanager:qollabi/clerk-secret}
```

### 7.4 Monitoring and Logging

```python
# Logging configuration
import logging
from pythonjsonlogger import jsonlogger

# Structured JSON logging for Cloudwatch
logger = logging.getLogger("qollabi")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Application instrumentation
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

# Trace configuration for AWS X-Ray
tracer = trace.get_tracer(__name__)
span = tracer.start_as_current_span("generate_update")

# Error tracking with Sentry
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    environment=os.getenv('ENVIRONMENT'),
    traces_sample_rate=0.1,  # Sample 10% of transactions
)

# Monitor Claude API costs
@app.middleware("http")
async def log_api_costs(request: Request, call_next):
    """Track API call costs for billing"""

    response = await call_next(request)

    if request.url.path.startswith("/api/update"):
        # Log to cost tracking system
        logger.info("api_call", extra={
            'service': 'claude',
            'endpoint': request.url.path,
            'cost_usd': response.headers.get('X-Cost-USD', 0),
            'tokens': response.headers.get('X-Tokens-Used', 0),
        })

    return response
```

---

## 8. Sprint Plan (2-3 weeks)

### Week 1: Foundation & Core Infrastructure

**Goal:** Database, authentication, data import pipeline operational

**Team allocation:** 3 engineers (1 lead, 2 full-stack)

| Day | Task | Owner | Story Points | Deliverable |
|-----|------|-------|---------------|------------|
| Mon | Setup AWS infrastructure (RDS, ElastiCache, S3) | Eng Lead | 8 | Production DB ready, backups configured |
| Tue | Migrate SQLite schema to PostgreSQL, create indexes | Backend | 5 | Data successfully migrated, 0 data loss |
| Tue | Implement Clerk authentication, RBAC schema | Backend | 8 | Users can login, roles enforced in API |
| Wed | Build ETL pipeline from Qollabi 1.0 (SQL Server) | Backend | 13 | Daily sync working, audit logs present |
| Thu | ETL pipeline from Salesforce API | Backend | 8 | Opportunity/account sync working |
| Fri | Data validation, error handling, monitoring | Backend | 5 | Alerts firing for sync failures |
| Fri | Deploy to staging environment, manual testing | Eng Lead | 3 | Staging env mirrors production |

**Week 1 Total:** 50 story points
**Completion Criteria:**
- All production infrastructure operational
- Zero data loss in migration
- ETL syncs run successfully 3 consecutive times
- RBAC prevents unauthorized data access

---

### Week 2: Smart Updates & Delivery System

**Goal:** End-to-end smart update generation and multi-channel delivery

**Team allocation:** 3 engineers

| Day | Task | Owner | Story Points | Deliverable |
|-----|------|-------|---------------|------------|
| Mon | Implement Claude API integration, prompt templates | Backend | 13 | Updates generating in <5 seconds per partner |
| Tue | Token management, cost tracking system | Backend | 8 | Daily cost reports, budget alerts working |
| Tue | Email delivery (SMTP/SendGrid), delivery tracking | Backend | 8 | Emails sending, open/click tracking working |
| Wed | PDF generation for update reports | Backend | 5 | PDFs generating, 100% successful conversion |
| Wed | FTP & webhook delivery channels | Backend | 8 | Legacy systems receiving updates via FTP |
| Thu | Celery + Redis task scheduling (daily updates) | Backend | 8 | Scheduler reliable, no missed runs |
| Thu | Target group selection, role-based delivery | Backend | 5 | Leadership/managers receive appropriate updates |
| Fri | End-to-end integration testing, performance tuning | QA | 5 | All delivery paths working, <100ms latency |

**Week 2 Total:** 60 story points
**Completion Criteria:**
- 100+ updates generated successfully
- 99% email delivery rate
- All delivery channels operational
- Cost per update tracked and < budget

---

### Week 3: Dashboards & Deployment

**Goal:** Interactive dashboards, production-ready deployment

**Team allocation:** 2 engineers (backend focus on API), 1 frontend specialist

| Day | Task | Owner | Story Points | Deliverable |
|-----|------|-------|---------------|------------|
| Mon | Standard dashboards (Recharts: KPIs, trends) | Frontend | 13 | 5 dashboard templates, responsive design |
| Mon | Dashboard data API endpoints (caching strategy) | Backend | 8 | API endpoints <200ms response time |
| Tue | Real-time alerts and notifications | Backend | 8 | Real-time updates via WebSocket |
| Tue | Dashboard export (PDF, Excel, PNG) | Backend | 8 | Exports working, proper formatting |
| Wed | Natural language dashboard (NL→SQL) | Backend | 13 | Users can query via English sentences |
| Wed | Security hardening, penetration testing | Eng Lead | 8 | OWASP top 10 mitigated, no critical findings |
| Thu | Performance optimization, load testing | Backend | 8 | Handles 100 concurrent users, <2s load time |
| Thu | Production deployment, runbook creation | Eng Lead | 5 | Deployment automated, rollback procedure clear |
| Fri | Monitoring setup (Sentry, X-Ray, Cloudwatch) | Eng Lead | 5 | All metrics visible, alerts configured |
| Fri | Documentation, knowledge transfer | All | 8 | Runbooks, API docs, architecture guide |

**Week 3 Total:** 84 story points (higher velocity with team learning)
**Completion Criteria:**
- Dashboards load in <2 seconds
- All features working end-to-end
- Production environment stable
- Team confident in deployments

---

### Sprint Totals

- **Total Story Points:** 194 (realistic for experienced team)
- **Velocity (per week):** ~65 story points
- **Team:** 3 senior engineers
- **Risk buffer:** Built-in 2 days (Fri afternoons) for fixing blockers

### Key Dependencies & Risks

1. **ETL Stability** (blocker): If Qollabi 1.0 sync fails, everything stalls
   - *Mitigation:* Dedicate day 1 to infrastructure, test with real data day 2

2. **Claude API Rate Limits** (medium risk): May hit limits with many partners
   - *Mitigation:* Implement token budgeting, implement queuing early

3. **Email Deliverability** (medium risk): Emails may land in spam
   - *Mitigation:* Setup SPF/DKIM/DMARC before launch, use SendGrid

4. **Performance at scale** (low risk): Dashboards may be slow with large datasets
   - *Mitigation:* Implement caching from day 1, load test mid-sprint

---

## 9. Technical Risks & Mitigations

### Risk 1: LLM Reliability & Hallucination

**Risk:** Claude generates plausible but false insights (e.g., misinterprets data context)

**Likelihood:** Medium | **Impact:** High (damages trust)

**Mitigations:**
```python
# 1. Few-shot examples ensure output follows patterns
few_shot_examples = [
    "GOOD: Clear, data-grounded analysis",
    "BAD: Speculative claims without data support"
]

# 2. Output validation catches suspicious content
class HallucinationDetector:
    def detect(self, output: str) -> float:
        """Return confidence score 0-1"""
        # Check for claims not in input data
        # Check for percentage claims that don't match KPIs
        # Flag extreme predictions without justification
        pass

# 3. Fallback: If low confidence, send raw data
if validation_score < 0.7:
    send_raw_kpi_email(partner)  # No AI generation
else:
    send_intelligent_update(partner)

# 4. Human review for high-value partners
if partner.contract_value > $1M:
    route_to_manager_for_review_first()
```

**Residual Risk:** Low (mitigations reduce to occasional low-confidence updates)

---

### Risk 2: Data Freshness & Sync Delays

**Risk:** Stale data leads to outdated insights or users miss critical alerts

**Likelihood:** Medium | **Impact:** High (poor user experience)

**Mitigations:**
```python
# 1. Multi-source redundancy
sync_schedule = {
    'qollabi1': every_4_hours(),      # Primary
    'salesforce': every_hour(),        # Validates
    'manual_upload': on_demand()       # Emergency
}

# 2. Sync status dashboard
class SyncMonitor:
    async def check_freshness(self, partner_id):
        age = datetime.utcnow() - last_sync_time
        if age > timedelta(hours=24):
            alert("Data stale", partner_id)
            return "warning"
        if age > timedelta(hours=48):
            return "critical"

# 3. Circuit breaker: stop using stale data
if last_update_age > 72_hours:
    do_not_generate_update()
    notify_ops_team()

# 4. Async processing: fetch fresh data before generating
@celery_task
def generate_with_fresh_data(partner_id):
    fetch_latest_kpis(partner_id)  # Always fresh
    enrich_with_web_data()
    return generate_update()
```

**Residual Risk:** Low (monitoring alerts ops quickly)

---

### Risk 3: Email Deliverability

**Risk:** Emails get filtered as spam or rejected by recipient servers

**Likelihood:** Medium | **Impact:** High (updates never reach users)

**Mitigations:**
```python
# 1. Email authentication
# SPF: v=spf1 include:sendgrid.net ~all
# DKIM: Sign all emails
# DMARC: p=quarantine

# 2. Reputation warmup (SendGrid requirements)
week_1_deliverability_target = 95_percent  # Ramp up volume
week_2_deliverability_target = 98_percent
week_3_deliverability_target = 99_5_percent

# 3. Monitor bounce rates
@celery_task
def monitor_email_health():
    bounces = get_bounces_this_week()
    if bounces > 5_percent:
        alert("High bounce rate")
        reduce_send_volume()

# 4. Fallback channels
if email_fails():
    try_webhook()
    try_sms()  # For critical alerts
    escalate_to_phone_call()
```

**Residual Risk:** Low-Medium (mitigations proven, but email remains fragile)

---

### Risk 4: Cost Management

**Risk:** Claude API bills exceed budget due to unexpected usage or inefficient prompts

**Likelihood:** Medium | **Impact:** Medium (budget overrun)

**Mitigations:**
```python
# 1. Token budgeting per partner
MONTHLY_BUDGET = 1000  # USD

budget_manager = TokenBudgetManager(monthly_budget_usd=1000)

# Check before each generation
if not budget_manager.should_proceed(estimated_cost=0.50):
    logger.warning(f"Budget exceeded")
    defer_update_to_next_month()

# 2. Prompt optimization
# Version 1: 1,200 tokens
# Version 2: 800 tokens (same quality, 33% cheaper)
# Version 3: 600 tokens (target)

# 3. Rate limiting per partner
@app.post("/api/partners/{pid}/force-update")
async def force_update(pid: str):
    if today_count[pid] > 5:
        return {"error": "Daily limit reached"}

# 4. Batch processing for efficiency
@celery_task
def batch_generate_updates():
    # Generate 100 at once (better throughput)
    partners = get_partners_needing_update()

    # Process in parallel, amortize API overhead
    results = await asyncio.gather([
        generate_update(p) for p in partners
    ])
```

**Residual Risk:** Low (monitoring and budgeting controls effective)

---

### Risk 5: Performance at Scale

**Risk:** Dashboards become slow or API timeouts with 500+ partners

**Likelihood:** Low-Medium | **Impact:** Medium (poor UX)

**Mitigations:**
```python
# 1. Database query optimization
# Create indexes on hot paths
CREATE INDEX idx_kpi_partner_period ON kpi_metrics(partner_id, period_date DESC);
CREATE INDEX idx_updates_partner_date ON smart_updates(partner_id, created_at DESC);

# 2. Caching strategy by data type
cache_ttl = {
    'executive_summary': 3600,      # 1 hour (stale OK)
    'real_time_alerts': 0,          # No cache
    'historical_trends': 86400,     # 1 day (very stale OK)
}

# 3. Pagination and limits
@app.get("/api/partners/{pid}/updates")
def get_updates(pid: str, limit: int = 10, offset: int = 0):
    # Never return >100 records
    limit = min(limit, 100)

# 4. Async processing
# Don't block user waiting for report generation
@app.post("/api/dashboard/export")
async def export_dashboard():
    task = celery.send_task('export_dashboard.pdf', (partner_id,))
    return {"task_id": task.id, "status_url": f"/status/{task.id}"}

# 5. Load testing before launch
artillery run load_test.yml  # Verify 100 concurrent users
k6 run performance_test.js   # Check response times
```

**Residual Risk:** Low-Medium (mitigations effective, but requires monitoring)

---

## 10. Alternative Solutions Considered

### Option A: No-Code/Low-Code (Retool, Appsmith)

**Pros:**
- Fastest time to market (weeks, not months)
- No custom coding for dashboards
- Built-in data connectivity
- Good for prototyping

**Cons:**
- Limited customization for complex logic
- Vendor lock-in risk
- Claude AI integration requires custom code anyway
- Difficult to move to custom code later
- High per-user licensing costs at scale ($400+/user/year)
- Not suitable for multi-tenant SaaS

**Verdict:** Good for PoC, not production

**Cost:** $20-50K/year for team + dashboards

---

### Option B: Use Existing BI Tools (Metabase, Superset)

**Pros:**
- Mature, stable platforms
- Excellent for dashboarding
- SQL-based (no custom code for visualizations)
- Open-source (Metabase, Superset) or low-cost

**Cons:**
- No built-in AI/LLM integration
- Still need custom API for smart updates
- Would need to build ETL separately
- Not designed for multi-channel delivery
- Limited customization for workflow

**Verdict:** Could use for dashboards alongside custom API

**Cost:** $10K/year hosting + custom API development

---

### Option C: Build on Salesforce Platform Directly

**Pros:**
- Leverage existing CRM data
- Built-in RBAC and multi-tenancy
- Salesforce can update records
- Less database management

**Cons:**
- Expensive (Salesforce licenses $100-300/user/month)
- Salesforce API rate limits (problematic for AI generation at scale)
- Limited control over deployment/infrastructure
- Harder to integrate external data sources
- Einstein Analytics is limited compared to custom dashboards

**Verdict:** Could complement, not replace, custom platform

**Cost:** $15K-50K/month (Salesforce licenses alone)

---

### Comparison Table

| Criteria | Retool | Metabase | Salesforce | Custom (Recommended) |
|----------|--------|----------|-----------|-----|
| Time to MVP | 4 weeks | 6 weeks | 8 weeks | 4 weeks |
| Time to Production | 8-12 weeks | 8 weeks | 12-16 weeks | 3-4 weeks |
| Cost/month (small) | $2K | $1K | $10K | $3K |
| Cost/month (large) | $10K | $3K | $50K | $8K |
| AI Integration | Hard | Very Hard | Impossible | Easy |
| Multi-channel delivery | Not built | Not built | Complex | Easy |
| Custom logic | Limited | Not possible | Possible (Apex) | Easy |
| Data privacy control | Low | Medium | Medium | High |

**Recommendation:** Custom build (Option A) with Metabase as optional companion for advanced analytics

---

## 11. Estimated Costs

### Development Costs

| Item | Cost | Notes |
|------|------|-------|
| Engineering (3 engineers × 3 weeks) | $18K | At $200/hr fully loaded |
| Infrastructure setup | $2K | AWS consulting, monitoring setup |
| Third-party APIs (setup) | $1K | SendGrid, Clerk onboarding |
| **Total Development** | **$21K** | One-time |

---

### Monthly Operating Costs (Production)

#### Small Scale (50 partners, weekly updates)

| Component | Cost/Month | Notes |
|-----------|-----------|-------|
| **Claude API** | $160 | 50 partners × 4.3 updates/month × $0.75/update |
| **AWS (compute)** | $300 | ECS Fargate (0.25 vCPU, 512 MB baseline) |
| **AWS (database)** | $200 | RDS PostgreSQL micro + backups |
| **AWS (storage)** | $50 | S3 for PDFs + backups |
| **Redis** | $40 | ElastiCache (small cluster) |
| **Email (SendGrid)** | $30 | Pro plan, 100K emails/month quota |
| **Clerk (auth)** | $25 | Pay-as-you-go (free until 1K MAU) |
| **Monitoring (Sentry)** | $20 | Generous free tier included |
| **Other (domains, etc)** | $50 | |
| **Total** | **$875/month** | **~$10,500/year** |
| **Cost per partner** | **$17.50/month** | |

#### Medium Scale (200 partners, daily updates)

| Component | Cost/Month | Notes |
|-----------|-----------|-------|
| **Claude API** | $900 | 200 × 30 daily × $0.15/update + anomalies |
| **AWS (compute)** | $600 | ECS Fargate scaled (1 vCPU during peak) |
| **AWS (database)** | $500 | RDS PostgreSQL small + monitoring |
| **AWS (storage)** | $150 | S3 + CloudFront CDN |
| **Redis** | $100 | Larger ElastiCache cluster |
| **Email (SendGrid)** | $100 | Pro plan |
| **Clerk** | $50 | Pay-as-you-go (1K-10K MAU) |
| **Monitoring** | $50 | Sentry paid tier |
| **Other** | $100 | |
| **Total** | **$2,450/month** | **~$29,400/year** |
| **Cost per partner** | **$12.25/month** | |

#### Large Scale (500 partners, multiple updates daily)

| Component | Cost/Month | Notes |
|-----------|-----------|-------|
| **Claude API** | $2,200 | 500 × 30 daily + anomalies + summaries |
| **AWS (compute)** | $1,500 | ECS Fargate auto-scaling |
| **AWS (database)** | $1,200 | RDS PostgreSQL standard + read replicas |
| **AWS (storage)** | $400 | S3 + CloudFront |
| **Redis** | $250 | Larger cache for distributed system |
| **Email (SendGrid)** | $300 | Higher volume, dedicated IP |
| **Clerk** | $150 | Enterprise features |
| **Monitoring** | $200 | Full Sentry plan + X-Ray |
| **Other** | $300 | Secrets Manager, VPN, etc |
| **Total** | **$6,500/month** | **~$78,000/year** |
| **Cost per partner** | **$13/month** | |

---

### Third-Party APIs (Optional, for enrichment)

| Service | Cost/Month | Usage |
|---------|-----------|-------|
| LinkedIn API | $0 | Free (limited, through scraper) |
| NewsAPI | $0 | Free tier (100 req/day) |
| Serper (Google Search) | $0-50 | Free tier + pay-as-you-go |
| Job board APIs | $0-100 | Free tier or small subscription |

---

### Total Cost of Ownership (Year 1)

| Phase | Cost |
|-------|------|
| Development (3-4 weeks) | $21K |
| Infrastructure setup | $3K |
| Hosting & APIs (Small scale, 12 months) | $10.5K |
| Contingency (20%) | $6.9K |
| **Total Year 1** | **~$41.4K** |

**Comparison:**
- BI Tool subscription (Metabase): +$30K/year
- Salesforce licensing (200 users): +$240K/year
- Manual reporting FTEs (4 people): +$480K/year

**ROI:** Pays for itself if replaces 1 FTE ($120K/year salary)

---

### Scaling Costs

- At **100 partners:** $1K-1.5K/month
- At **500 partners:** $6K-7K/month
- At **1000 partners:** $12K-14K/month (relatively linear scaling)

**Key optimization:** Caching and batching keeps costs sub-linear

---

## 12. Next Steps & Immediate Actions

### Pre-Sprint (This Week)

- [ ] Provision AWS accounts, set up VPC and IAM roles
- [ ] Create PostgreSQL instance with backups configured
- [ ] Set up GitHub Actions CI/CD skeleton
- [ ] Create Slack channel for sprint updates
- [ ] Schedule knowledge transfer sessions from PoC team
- [ ] Establish on-call rotation for production support

### Sprint Week 1

- [ ] Start with database migration and ETL pipeline
- [ ] Establish daily stand-ups and sprint tracking
- [ ] Create initial monitoring dashboards
- [ ] Set up staging environment

### Success Metrics

- ✓ Zero data loss in SQLite→PostgreSQL migration
- ✓ ETL runs successfully 3 consecutive times
- ✓ RBAC prevents unauthorized access
- ✓ All 100+ partners receive updates within SLA
- ✓ Dashboard load time <2 seconds p95
- ✓ 99%+ email delivery rate
- ✓ Zero critical security findings in assessment

---

## Appendix: Technology Stack Summary

```
Language & Frameworks:
- Backend: Python 3.11, FastAPI 0.104, Pydantic V2
- Frontend: React 18, TypeScript, TailwindCSS
- Database: PostgreSQL 15, SQLAlchemy 2.0 ORM
- Task Queue: Celery 5.3, Redis 7.x

AI & ML:
- Claude API (claude-3-5-sonnet-20241022)
- Anthropic Python SDK 0.27+
- LangChain for prompt management

Infrastructure:
- Container: Docker, ECR
- Compute: AWS ECS Fargate
- Database: AWS RDS PostgreSQL
- Cache: ElastiCache Redis
- Storage: S3, CloudFront
- Monitoring: CloudWatch, Sentry, X-Ray
- Secrets: AWS Secrets Manager

Authentication:
- Clerk (recommended) or Auth0
- JWT for API tokens

Testing:
- pytest for backend
- Vitest for frontend
- k6 for load testing
- OWASP ZAP for security scanning

Version Control & CI/CD:
- GitHub + Actions
- Pre-commit hooks (Black, flake8, mypy)
- Automated deployments on main branch
```

---

## Document Approval & Sign-Off

**Prepared by:** Engineering Team
**Reviewed by:** Technical Lead
**Approved by:** Product Manager
**Approval Date:** TBD

**Revision History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-08 | Engineering Team | Initial plan |

---

**End of Engineering Plan Document**
