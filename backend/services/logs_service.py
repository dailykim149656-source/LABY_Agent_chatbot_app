"""Service layer for conversation logs."""

from typing import List

from ..repositories import chat_logs_repo
from ..schemas import ConversationLogResponse


def list_conversation_logs(engine, limit: int) -> List[ConversationLogResponse]:
    rows = chat_logs_repo.list_chat_logs(engine, limit)
    return [
        ConversationLogResponse(
            id=row.get("log_id"),
            timestamp=row.get("timestamp"),
            user=row.get("user_name"),
            command=row.get("command"),
            status=row.get("status"),
        )
        for row in rows
    ]
