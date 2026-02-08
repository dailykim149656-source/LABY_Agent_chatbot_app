from typing import List, Optional

from fastapi import APIRouter, Query, Request

from ..schemas import ConversationLogResponse
from ..services import logs_service, i18n_service
from ..utils.i18n_handler import apply_i18n_to_items

router = APIRouter()


@router.get("/api/logs/conversations", response_model=List[ConversationLogResponse])
def list_conversation_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> List[ConversationLogResponse]:
    results = logs_service.list_conversation_logs(request.app.state.db_engine, limit)
    apply_i18n_to_items(results, request, i18n_service.attach_conversation_logs, lang, includeI18n)
    return results
