from typing import List, Optional

from fastapi import APIRouter, Query, Request
from sqlalchemy import text

from ..schemas import ConversationLogResponse
from ..services import i18n_service
from ..utils.i18n_handler import apply_i18n_to_items

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
    apply_i18n_to_items(results, request, i18n_service.attach_conversation_logs, lang, includeI18n)
    return results
