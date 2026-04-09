"""Prompt templates for smart update generation."""

LEADERSHIP_SUMMARY_PROMPT = """You are creating an executive summary for ALE leadership about partner performance.

Analyze the provided partner and KPI data and generate a concise, insightful report that includes:

1. EXECUTIVE SUMMARY
   - Overall portfolio health (1-2 sentences)
   - Key performance highlights
   - Areas of concern

2. KEY METRICS OVERVIEW
   - Average achievement rate across all KPIs
   - Best performing metric and worst performing metric
   - Year-over-year trend (if available)

3. TOP PERFORMERS
   - List top 3 partners by overall achievement
   - Their contributions to revenue/pipeline

4. REGIONS & SEGMENTS ANALYSIS
   - Performance by region with brief insight
   - Performance by partner segment
   - Regional trends and patterns

5. RISK & OPPORTUNITY
   - Bottom performers requiring attention
   - Opportunities for growth in specific segments
   - Certification and marketing adoption gaps

6. RECOMMENDATIONS
   - Top 3 actions for leadership consideration
   - Resource allocation suggestions
   - Timeline for expected improvements

Keep the tone professional, data-driven, and forward-looking. Use percentages and metrics to support statements."""

ACCOUNT_MANAGER_REVIEW_PROMPT = """You are creating a detailed partner review report for an Account Manager.

Analyze the provided partner and KPI data and generate a comprehensive report that includes:

1. YOUR PORTFOLIO OVERVIEW
   - Total partners managed
   - Average achievement rate
   - Number of partners at-risk vs on-track

2. PARTNER-BY-PARTNER ANALYSIS
   For each partner, provide:
   - Account ID and Name
   - Current achievement vs target
   - Top 2 strengths in KPI performance
   - Top 2 areas for improvement
   - Recommended action (training, support, strategic review)

3. PIPELINE ANALYSIS
   - Quarterly pipeline performance (Q1-Q4 data if available)
   - Forecast based on current trends
   - Recommended pipeline improvement actions

4. CERTIFICATION STATUS
   - Partners with gaps in required certifications
   - Training programs that should be prioritized
   - Recommended certification timeline

5. MARKETING & BUSINESS PLAN
   - Partners engaged with marketing plan
   - Partners needing marketing support
   - Opportunities for joint go-to-market

6. ACTION PLAN
   - Priority business reviews to schedule (top 5 partners)
   - Specific support programs needed
   - Timeline for next 90 days

7. SUCCESS METRICS
   - Targets for next quarter
   - KPIs to focus on with each partner
   - Expected business impact

Be specific, actionable, and supportive. Focus on helping the account manager drive partner success."""

REGIONAL_PERFORMANCE_PROMPT = """You are creating a regional performance overview for ALE leadership.

Analyze the provided partner and KPI data and generate a regional comparison report that includes:

1. REGIONAL SNAPSHOTS
   For each region, provide:
   - Partner count and total revenue contribution
   - Average achievement rate
   - Top performing partner segment
   - Key strengths and challenges

2. CROSS-REGIONAL COMPARISON
   - Best performing region and key success factors
   - Region requiring most support
   - Benchmark comparison across regions
   - Performance trends (improving, stable, declining)

3. SEGMENT PERFORMANCE BY REGION
   - How different segments perform in each region
   - Regional preferences or strengths
   - Opportunities for segment-specific growth

4. CERTIFICATION & SKILLS
   - Certification adoption by region
   - Regional training needs
   - Knowledge sharing opportunities across regions

5. PIPELINE & FORECAST
   - Quarterly pipeline by region
   - Regional forecast confidence levels
   - Risk factors by region

6. STRATEGIC RECOMMENDATIONS
   - Resource allocation by region
   - Best practices from top region to share
   - Support needs for underperforming regions
   - Regional growth opportunities

7. NEXT STEPS
   - Recommended regional leadership actions
   - Cross-regional initiatives
   - Timeline for improvement

Focus on regional dynamics, competitive positioning, and strategic growth opportunities."""

RISK_ALERT_PROMPT = """You are creating a risk alert and intervention plan for Account Managers.

Analyze the provided partner and KPI data and generate a focused report on at-risk partners:

1. AT-RISK PARTNERS SUMMARY
   - Number of partners below 70% achievement
   - Number of partners below 50% achievement (critical)
   - Total revenue at-risk
   - Overall portfolio risk assessment

2. CRITICAL RISK PARTNERS
   For each critical at-risk partner:
   - Account ID and Name
   - Risk level (High/Critical)
   - Current achievement rate
   - Primary underperforming KPIs (top 2-3)
   - Impact on overall business
   - Root cause assessment (if apparent from data)

3. INTERVENTION REQUIREMENTS
   - Immediate actions needed (next 2 weeks)
   - Business review urgency
   - Required executive support
   - Recommended communication approach

4. SUPPORT PROGRAMS
   - Certification training priorities
   - Sales enablement needed
   - Marketing plan assistance
   - Technical support requirements

5. RECOVERY TIMELINE
   - Expected timeline to return to health (30/60/90 days)
   - Key milestones to track
   - Success metrics for recovery

6. ESCALATION & RESOURCES
   - Partners requiring executive attention
   - Internal resources needed for support
   - When to escalate to regional leadership

7. FOLLOW-UP SCHEDULE
   - Weekly touchpoints for critical partners
   - Business review dates
   - Next comprehensive risk assessment

Be direct, specific, and solution-focused. Include concrete next steps and timelines."""
