from typing import List

from fastapi import APIRouter, Query, Request
from sqlalchemy import text

from ..schemas import EmailLogResponse, ConversationLogResponse

router = APIRouter()


@router.get("/api/logs/conversations", response_model=List[ConversationLogResponse])
def list_conversation_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
) -> List[ConversationLogResponse]:
    engine = request.app.state.db_engine
    sql = """
    SELECT TOP (:limit)
        log_id, timestamp, user_name, command, status
    FROM ChatLogs
    ORDER BY timestamp DESC;
    """

    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()

    results: List[ConversationLogResponse] = []
    for row in rows:
        results.append(
            ConversationLogResponse(
                id=row.get("log_id"),
                timestamp=row.get("timestamp"),
                user=row.get("user_name"),
                command=row.get("command"),
                status=row.get("status"),
            )
        )
    return results


@router.get("/api/logs/emails", response_model=List[EmailLogResponse])
def list_email_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
) -> List[EmailLogResponse]:
    engine = request.app.state.db_engine
    sql = """
    SELECT TOP (:limit)
        email_id, sent_time, recipient, recipient_email, incident_type, delivery_status
    FROM EmailLogs
    ORDER BY sent_time DESC;
    """

    with engine.connect() as conn:
        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()

    results: List[EmailLogResponse] = []
    for row in rows:
        results.append(
            EmailLogResponse(
                id=row.get("email_id"),
                sentTime=row.get("sent_time"),
                recipient=row.get("recipient"),
                recipientEmail=row.get("recipient_email"),
                incidentType=row.get("incident_type"),
                deliveryStatus=row.get("delivery_status"),
            )
        )
    return results
