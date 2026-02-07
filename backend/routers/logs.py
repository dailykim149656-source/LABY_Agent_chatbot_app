from typing import List, Optional

from fastapi import APIRouter, Query, Request

from ..schemas import ConversationLogResponse
from ..repositories import chat_logs_repo
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
    rows = chat_logs_repo.list_chat_logs(request.app.state.db_engine, limit)
    results = [
        ConversationLogResponse(
            id=row.get("log_id"),
            timestamp=row.get("timestamp"),
            user=row.get("user_name"),
            command=row.get("command"),
            status=row.get("status"),
        )
        for row in rows
    ]
    apply_i18n_to_items(results, request, i18n_service.attach_conversation_logs, lang, includeI18n)
    return results
