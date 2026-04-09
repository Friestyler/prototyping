"""Dashboard API endpoints."""

from typing import Optional

from fastapi import APIRouter, Query

from app.database import get_db
from app.services.llm import generate_sql_from_query

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
def get_overview():
    """Get overall KPI summary."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Overall stats
        cursor.execute(
            """
            SELECT
                COUNT(DISTINCT account_id) as total_partners,
                COUNT(DISTINCT metric_name) as total_metrics,
                ROUND(AVG(achievement), 2) as avg_achievement,
                MIN(achievement) as min_achievement,
                MAX(achievement) as max_achievement
            FROM kpi_metrics
            WHERE achievement IS NOT NULL
        """
        )
        stats = dict(cursor.fetchone())

        # By metric
        cursor.execute(
            """
            SELECT
                metric_name,
                COUNT(*) as count,
                ROUND(AVG(achievement), 2) as avg_achievement,
                ROUND(AVG(result), 2) as avg_result,
                ROUND(AVG(target), 2) as avg_target
            FROM kpi_metrics
            GROUP BY metric_name
            ORDER BY avg_achievement DESC
        """
        )
        by_metric = [dict(row) for row in cursor.fetchall()]

        return {
            "summary": stats,
            "by_metric": by_metric,
        }


@router.get("/regional")
def get_regional_performance():
    """Get performance by region."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                p.region,
                COUNT(DISTINCT p.account_id) as partner_count,
                ROUND(AVG(k.achievement), 2) as avg_achievement,
                ROUND(AVG(k.result), 2) as avg_result,
                ROUND(AVG(k.target), 2) as avg_target
            FROM partners p
            LEFT JOIN kpi_metrics k ON p.account_id = k.account_id
            WHERE p.region IS NOT NULL
            GROUP BY p.region
            ORDER BY avg_achievement DESC NULLS LAST
        """
        )
        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/by-segment")
def get_by_segment():
    """Get performance by partner segment."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                p.segment,
                COUNT(DISTINCT p.account_id) as partner_count,
                ROUND(AVG(k.achievement), 2) as avg_achievement,
                ROUND(AVG(k.result), 2) as avg_result,
                ROUND(AVG(k.target), 2) as avg_target
            FROM partners p
            LEFT JOIN kpi_metrics k ON p.account_id = k.account_id
            WHERE p.segment IS NOT NULL
            GROUP BY p.segment
            ORDER BY avg_achievement DESC NULLS LAST
        """
        )
        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/pipeline-trend")
def get_pipeline_trend():
    """Get quarterly pipeline trend data."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                period,
                ROUND(AVG(result), 2) as avg_result,
                ROUND(AVG(target), 2) as avg_target,
                ROUND(AVG(achievement), 2) as avg_achievement,
                COUNT(*) as partner_count
            FROM kpi_metrics
            WHERE metric_name = 'Quarterly Pipeline vs Target'
            AND period IS NOT NULL
            GROUP BY period
            ORDER BY period
        """
        )
        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/top-performers")
def get_top_performers(
    metric: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
):
    """Get top N partners by metric."""
    with get_db() as conn:
        cursor = conn.cursor()

        if metric:
            cursor.execute(
                """
                SELECT
                    p.account_id,
                    p.name,
                    p.region,
                    p.segment,
                    k.metric_name,
                    ROUND(k.achievement, 2) as achievement,
                    ROUND(k.result, 2) as result,
                    ROUND(k.target, 2) as target
                FROM kpi_metrics k
                JOIN partners p ON k.account_id = p.account_id
                WHERE k.metric_name = ?
                AND k.achievement IS NOT NULL
                ORDER BY k.achievement DESC
                LIMIT ?
            """,
                (metric, limit),
            )
        else:
            cursor.execute(
                """
                SELECT
                    p.account_id,
                    p.name,
                    p.region,
                    p.segment,
                    ROUND(AVG(k.achievement), 2) as avg_achievement,
                    COUNT(*) as metric_count
                FROM kpi_metrics k
                JOIN partners p ON k.account_id = p.account_id
                WHERE k.achievement IS NOT NULL
                GROUP BY p.account_id
                ORDER BY avg_achievement DESC
                LIMIT ?
            """,
                (limit,),
            )

        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/bottom-performers")
def get_bottom_performers(
    metric: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
):
    """Get bottom N partners by metric (risk alerts)."""
    with get_db() as conn:
        cursor = conn.cursor()

        if metric:
            cursor.execute(
                """
                SELECT
                    p.account_id,
                    p.name,
                    p.region,
                    p.segment,
                    k.metric_name,
                    ROUND(k.achievement, 2) as achievement,
                    ROUND(k.result, 2) as result,
                    ROUND(k.target, 2) as target
                FROM kpi_metrics k
                JOIN partners p ON k.account_id = p.account_id
                WHERE k.metric_name = ?
                AND k.achievement IS NOT NULL
                ORDER BY k.achievement ASC
                LIMIT ?
            """,
                (metric, limit),
            )
        else:
            cursor.execute(
                """
                SELECT
                    p.account_id,
                    p.name,
                    p.region,
                    p.segment,
                    ROUND(AVG(k.achievement), 2) as avg_achievement,
                    COUNT(*) as metric_count
                FROM kpi_metrics k
                JOIN partners p ON k.account_id = p.account_id
                WHERE k.achievement IS NOT NULL
                GROUP BY p.account_id
                ORDER BY avg_achievement ASC
                LIMIT ?
            """,
                (limit,),
            )

        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/manager-performance")
def get_manager_performance():
    """Get KPIs grouped by account manager."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                am.email,
                am.name,
                am.region,
                COUNT(DISTINCT p.account_id) as partner_count,
                ROUND(AVG(k.achievement), 2) as avg_achievement,
                ROUND(AVG(k.result), 2) as avg_result,
                ROUND(AVG(k.target), 2) as avg_target
            FROM account_managers am
            LEFT JOIN partners p ON p.csm_emails LIKE '%' || am.email || '%'
            LEFT JOIN kpi_metrics k ON p.account_id = k.account_id
            GROUP BY am.email
            ORDER BY avg_achievement DESC NULLS LAST
        """
        )
        rows = cursor.fetchall()

        return [dict(row) for row in rows]


@router.get("/custom-query")
@router.post("/custom-query")
def custom_query(query: str = Query(None), question: str = Query(None)):
    """Accept a natural language query and convert to SQL using Claude."""
    query = query or question
    if not query:
        return {"error": "Please provide a 'query' or 'question' parameter"}
    try:
        # Get database schema
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT sql FROM sqlite_master
                WHERE type='table' AND name IN ('partners', 'kpi_metrics', 'account_managers')
            """
            )
            schema_rows = cursor.fetchall()
            schema = "\n".join([row[0] for row in schema_rows])

        # Generate SQL
        sql = generate_sql_from_query(query, schema)

        # Execute SQL
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(sql)
            rows = cursor.fetchall()

            # Convert to list of dicts
            if rows:
                columns = [description[0] for description in cursor.description]
                results = [dict(zip(columns, row)) for row in rows]
            else:
                results = []

            return {
                "query": query,
                "sql": sql,
                "results": results,
                "count": len(results),
            }

    except Exception as e:
        error_msg = str(e)
        # Provide helpful hints for common SQL errors
        hint = ""
        if "no such column" in error_msg:
            hint = " Hint: kpi_metrics has no 'region' column — JOIN with partners to get region."
        elif "no such table" in error_msg:
            hint = " Hint: Tables are: partners, kpi_metrics, account_managers."
        elif "ambiguous column" in error_msg:
            hint = " Hint: Use table prefix like p.name or k.achievement."

        return {
            "query": query,
            "sql": sql if 'sql' in dir() else "",
            "results": [],
            "count": 0,
            "error": error_msg + hint,
        }
