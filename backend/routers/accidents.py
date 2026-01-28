from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy import text

from ..schemas import AccidentResponse, AccidentUpdateRequest

router = APIRouter()


def risk_to_severity(risk_angle: Optional[float]) -> str:
    if risk_angle is None:
        return "low"
    if risk_angle >= 85:
        return "critical"
    if risk_angle >= 80:
        return "high"
    if risk_angle >= 70:
        return "medium"
    return "low"


def verification_to_status(value: Optional[int]) -> str:
    if value == 1:
        return "acknowledged"
    if value == 2:
        return "resolved"
    return "active"


def build_title(event_status: Optional[str], camera_id: Optional[str]) -> str:
    status_part = event_status or "EVENT"
    camera_part = camera_id or "CAMERA"
    return f"{status_part} - {camera_part}"


@router.get("/api/accidents", response_model=List[AccidentResponse])
def list_accidents(
    request: Request,
    status: Optional[str] = Query(None, description="active|acknowledged|resolved"),
    from_ts: Optional[str] = Query(None, description="ISO timestamp"),
    to_ts: Optional[str] = Query(None, description="ISO timestamp"),
    limit: int = Query(100, ge=1, le=500),
) -> List[AccidentResponse]:
    engine = request.app.state.db_engine

    sql = """
    SELECT TOP (:limit)
        EventID, Timestamp, CameraID, RiskAngle, Status,
        EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
    FROM FallEvents
    WHERE 1=1
    """
    params = {"limit": limit}

    status_map = {"active": 0, "acknowledged": 1, "resolved": 2}
    if status in status_map:
        sql += " AND VerificationStatus = :vs"
        params["vs"] = status_map[status]

    if from_ts:
        sql += " AND Timestamp >= :from_ts"
        params["from_ts"] = from_ts

    if to_ts:
        sql += " AND Timestamp <= :to_ts"
        params["to_ts"] = to_ts

    sql += " ORDER BY Timestamp DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    results: List[AccidentResponse] = []
    for row in rows:
        risk = row.get("RiskAngle")
        vstatus = row.get("VerificationStatus")
        results.append(
            AccidentResponse(
                id=row.get("EventID"),
                title=build_title(row.get("Status"), row.get("CameraID")),
                description=row.get("EventSummary"),
                location=row.get("CameraID"),
                severity=risk_to_severity(risk),
                status=verification_to_status(vstatus),
                reportedAt=row.get("Timestamp"),
                reportedBy=row.get("VerifySubject") or "system",
            )
        )
    return results


@router.patch("/api/accidents/{event_id}", response_model=AccidentResponse)
def update_accident(
    event_id: int, body: AccidentUpdateRequest, request: Request
) -> AccidentResponse:
    engine = request.app.state.db_engine
    if body.verification_status not in (0, 1, 2):
        raise HTTPException(status_code=400, detail="Invalid verification_status")

    update_sql = """
    UPDATE FallEvents
    SET VerificationStatus = :vs,
        VerifiedAt = GETDATE(),
        VerifySubject = :subj
    WHERE EventID = :event_id;
    """

    with engine.begin() as conn:
        conn.execute(
            text(update_sql),
            {
                "vs": body.verification_status,
                "subj": body.verify_subject or "system",
                "event_id": event_id,
            },
        )

    fetch_sql = """
    SELECT EventID, Timestamp, CameraID, RiskAngle, Status,
           EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
    FROM FallEvents
    WHERE EventID = :event_id;
    """

    with engine.connect() as conn:
        row = conn.execute(text(fetch_sql), {"event_id": event_id}).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    risk = row.get("RiskAngle")
    vstatus = row.get("VerificationStatus")
    return AccidentResponse(
        id=row.get("EventID"),
        title=build_title(row.get("Status"), row.get("CameraID")),
        description=row.get("EventSummary"),
        location=row.get("CameraID"),
        severity=risk_to_severity(risk),
        status=verification_to_status(vstatus),
        reportedAt=row.get("Timestamp"),
        reportedBy=row.get("VerifySubject") or "system",
    )
