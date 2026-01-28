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
    limit: int = Query(5, ge=1, le=50),
) -> SafetyStatusResponse:
    engine = request.app.state.db_engine

    sql = """
    SELECT TOP (:limit)
        EventID, Timestamp, CameraID, RiskAngle, Status, EventSummary
    FROM FallEvents
    ORDER BY Timestamp DESC;
    """

    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()

    alerts: List[SafetyAlert] = []
    for row in rows:
        alerts.append(
            SafetyAlert(
                id=str(row.get("EventID")),
                type=risk_to_alert_type(row.get("RiskAngle")),
                message=row.get("EventSummary") or "Recent event",
                location=row.get("CameraID") or "camera",
                time=str(row.get("Timestamp")),
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
    )
