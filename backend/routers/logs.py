from typing import List, Optional

from fastapi import APIRouter, Query, Request
from sqlalchemy import text

from ..schemas import EmailLogResponse, ConversationLogResponse
from ..services import i18n_service
from ..utils.translation import resolve_target_lang, should_translate

router = APIRouter()


@router.get("/api/logs/conversations", response_model=List[ConversationLogResponse])
def list_conversation_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
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
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_conversation_logs(results, service, target_lang)
    return results


@router.get("/api/logs/emails", response_model=List[EmailLogResponse])
def list_email_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
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
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_email_logs(results, service, target_lang)
    return results
