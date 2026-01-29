import math
from typing import List

from fastapi import APIRouter, Query, Request
from sqlalchemy import text

from ..schemas import SafetyStatusResponse, SafetyEnvironmentItem, SafetyAlert

router = APIRouter()


def risk_to_alert_type(risk_angle) -> str:
    if risk_angle is None:
        return "info"
    if risk_angle >= 85:
        return "critical"
    if risk_angle >= 75:
        return "warning"
    return "info"


@router.get("/api/safety/status", response_model=SafetyStatusResponse)
def safety_status(
    request: Request,
    limit: int = Query(3, ge=1, le=3),
    page: int = Query(1, ge=1),
) -> SafetyStatusResponse:
    engine = request.app.state.db_engine
    limit = min(limit, 3)

    sql = """
    SELECT
        EventID,
        Timestamp,
        CameraID,
        RiskAngle,
        Status,
        EventSummary,
        ExperimentID,
        VerificationStatus
    FROM FallEvents
    ORDER BY Timestamp DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY;
    """

    with engine.connect() as conn:
        total_count = conn.execute(text("SELECT COUNT(*) FROM FallEvents;")).scalar()
        total = int(total_count or 0)
        total_pages = math.ceil(total / limit) if total > 0 else 0
        safe_page = min(page, total_pages) if total_pages > 0 else 1
        offset = (safe_page - 1) * limit
        rows = conn.execute(text(sql), {"limit": limit, "offset": offset}).mappings().all()

    alerts: List[SafetyAlert] = []
    for row in rows:
        alerts.append(
            SafetyAlert(
                id=str(row.get("EventID")),
                type=risk_to_alert_type(row.get("RiskAngle")),
                message=row.get("EventSummary") or "Recent event",
                location=row.get("CameraID") or "camera",
                time=str(row.get("Timestamp")),
                status=row.get("Status"),
                verificationStatus=row.get("VerificationStatus"),
                experimentId=str(row.get("ExperimentID")) if row.get("ExperimentID") is not None else None,
            )
        )

    environmental = [
        SafetyEnvironmentItem(key="temperature", label="temperature", value="N/A", status="normal"),
        SafetyEnvironmentItem(key="humidity", label="humidity", value="N/A", status="normal"),
        SafetyEnvironmentItem(key="ventilation", label="ventilation", value="N/A", status="normal"),
        SafetyEnvironmentItem(key="air_quality", label="air_quality", value="N/A", status="normal"),
    ]

    return SafetyStatusResponse(
        environmental=environmental,
        alerts=alerts,
        systemStatus="normal",
        totalCount=total,
        page=safe_page,
        pageSize=limit,
        totalPages=total_pages,
    )
