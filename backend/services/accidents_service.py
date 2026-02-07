"""Service layer for accident/fall-event business logic."""

from typing import List, Optional

from ..repositories import accidents_repo
from ..schemas import AccidentResponse


_STATUS_MAP = {"active": 0, "acknowledged": 1, "false_alarm": 2}


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
        return "false_alarm"
    return "active"


def _build_title(event_status: Optional[str], camera_id: Optional[str]) -> str:
    status_part = event_status or "EVENT"
    camera_part = camera_id or "CAMERA"
    return f"{status_part} - {camera_part}"


def _row_to_response(row) -> AccidentResponse:
    return AccidentResponse(
        id=row.get("EventID"),
        title=_build_title(row.get("Status"), row.get("CameraID")),
        description=row.get("EventSummary"),
        location=row.get("CameraID"),
        severity=risk_to_severity(row.get("RiskAngle")),
        status=verification_to_status(row.get("VerificationStatus")),
        reportedAt=row.get("Timestamp"),
        reportedBy=row.get("VerifySubject") or "system",
    )


def list_accidents(
    engine,
    limit: int,
    status: Optional[str] = None,
    from_ts: Optional[str] = None,
    to_ts: Optional[str] = None,
) -> List[AccidentResponse]:
    vs = _STATUS_MAP.get(status) if status else None
    rows = accidents_repo.list_fall_events(engine, limit, vs, from_ts, to_ts)
    return [_row_to_response(row) for row in rows]


def update_accident(
    engine, event_id: int, verification_status: int, verify_subject: Optional[str]
) -> Optional[AccidentResponse]:
    accidents_repo.update_verification(
        engine, event_id, verification_status, verify_subject or "system"
    )
    row = accidents_repo.get_fall_event_by_id(engine, event_id)
    if not row:
        return None
    return _row_to_response(row)
