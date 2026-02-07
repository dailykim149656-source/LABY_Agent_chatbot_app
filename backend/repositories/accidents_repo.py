"""Repository for FallEvents (accident) data access."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text


def list_fall_events(
    engine,
    limit: int,
    verification_status: Optional[int] = None,
    from_ts: Optional[str] = None,
    to_ts: Optional[str] = None,
) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        EventID, Timestamp, CameraID, RiskAngle, Status,
        EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
    FROM FallEvents
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}

    if verification_status is not None:
        sql += " AND VerificationStatus = :vs"
        params["vs"] = verification_status

    if from_ts:
        sql += " AND Timestamp >= :from_ts"
        params["from_ts"] = from_ts

    if to_ts:
        sql += " AND Timestamp <= :to_ts"
        params["to_ts"] = to_ts

    sql += " ORDER BY Timestamp DESC"

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def get_fall_event_by_id(engine, event_id: int) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT EventID, Timestamp, CameraID, RiskAngle, Status,
           EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
    FROM FallEvents
    WHERE EventID = :event_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"event_id": event_id}).mappings().first()


def update_verification(
    engine, event_id: int, verification_status: int, verify_subject: str
) -> None:
    sql = """
    UPDATE FallEvents
    SET VerificationStatus = :vs,
        VerifiedAt = GETUTCDATE(),
        VerifySubject = :subj
    WHERE EventID = :event_id;
    """
    with engine.begin() as conn:
        conn.execute(
            text(sql),
            {"vs": verification_status, "subj": verify_subject, "event_id": event_id},
        )
