from typing import Optional, Tuple

from sqlalchemy import text
from starlette.concurrency import run_in_threadpool

from ..repositories import chat_rooms_repo
from ..schemas import (
    ChatRoomResponse,
    ChatRoomListResponse,
    ChatMessageResponse,
    ChatMessageListResponse,
    ChatMessageCreateResponse,
)

RECENT_KEYWORDS = ("가장 최근", "최근", "최신")
ACCIDENT_KEYWORDS = (
    "사고",
    "넘어짐",
    "전도",
    "쓰러짐",
    "낙상",
    "fall",
    "overturn",
    "tip",
    "upset",
)
VERIFY_KEYWORDS = (
    "확인 처리",
    "확인처리",
    "승인",
    "확인해",
    "확인해줘",
    "확인해 줘",
    "확인 처리해",
    "확인 처리해줘",
    "확인 처리해 줘",
)
REJECT_KEYWORDS = ("오탐", "오류", "거짓", "무효", "거절", "false", "glitch")


def row_to_room(row) -> ChatRoomResponse:
    return ChatRoomResponse(
        id=str(row.get("room_id")),
        title=row.get("title") or "",
        roomType=row.get("room_type") or "public",
        createdAt=row.get("created_at"),
        lastMessageAt=row.get("last_message_at"),
        lastMessagePreview=row.get("last_message_preview"),
    )


def row_to_message(row) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=str(row.get("message_id")),
        roomId=str(row.get("room_id")),
        role=row.get("role") or "assistant",
        content=row.get("content") or "",
        createdAt=row.get("created_at"),
        senderType=row.get("sender_type") or "assistant",
        senderId=row.get("sender_id"),
        senderName=row.get("sender_name"),
    )


def normalize_title(title: Optional[str]) -> str:
    if not title:
        return "New Chat"
    trimmed = title.strip()
    return trimmed if trimmed else "New Chat"


def build_preview(content: str, max_len: int = 200) -> str:
    cleaned = " ".join(content.split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 3].rstrip() + "..."


def is_recent_accident_query(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    has_recent = any(k in message for k in RECENT_KEYWORDS)
    has_accident = any(k in message for k in ACCIDENT_KEYWORDS) or any(
        k in lower for k in ACCIDENT_KEYWORDS
    )
    return has_recent and has_accident


def wants_verify(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    return any(k in message for k in VERIFY_KEYWORDS) or any(k in lower for k in VERIFY_KEYWORDS)


def wants_reject(message: str) -> bool:
    if not message:
        return False
    lower = message.lower()
    return any(k in message for k in REJECT_KEYWORDS) or any(k in lower for k in REJECT_KEYWORDS)


def fetch_latest_unverified(engine) -> dict | None:
    sql = """
    SELECT TOP 1 EventID, Timestamp, CameraID, RiskAngle, Status, ExperimentID
    FROM FallEvents
    WHERE VerificationStatus = 0
    ORDER BY Timestamp DESC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql)).mappings().first()


def format_recent_accident(row: dict) -> str:
    return (
        "가장 최근의 미확인 사고는 다음과 같습니다:\n"
        f"- 이벤트 ID: {row.get('EventID')}\n"
        f"- 발생 시간: {row.get('Timestamp')}\n"
        f"- 카메라: {row.get('CameraID')}\n"
        f"- 위험 각도: {row.get('RiskAngle')}\n"
        f"- 상태: {row.get('Status')}\n"
        f"- 연관 실험 ID: {row.get('ExperimentID')}"
    )


def insert_chat_log(engine, user_name: str, command: str, status: str) -> None:
    sql = """
    INSERT INTO ChatLogs (user_name, command, status)
    VALUES (:user_name, :command, :status);
    """
    with engine.begin() as conn:
        conn.execute(
            text(sql),
            {
                "user_name": user_name,
                "command": command,
                "status": status,
            },
        )


async def generate_output(engine, agent, message: str, user_name: Optional[str]) -> Tuple[str, str]:
    status = "completed"
    output = ""

    if is_recent_accident_query(message):
        row = fetch_latest_unverified(engine)
        if not row:
            output = "미확인 사고가 없습니다."
        else:
            if wants_verify(message):
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            UPDATE FallEvents
                            SET VerificationStatus = 1,
                                VerifiedAt = GETDATE(),
                                VerifySubject = :subj
                            WHERE EventID = :eid;
                            """
                        ),
                        {"eid": row.get("EventID"), "subj": user_name or "Agent"},
                    )
                output = f"가장 최근의 사고(EventID: {row.get('EventID')})가 확인 처리되었습니다."
            elif wants_reject(message):
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            """
                            UPDATE FallEvents
                            SET VerificationStatus = 2,
                                VerifiedAt = GETDATE(),
                                VerifySubject = :subj
                            WHERE EventID = :eid;
                            """
                        ),
                        {"eid": row.get("EventID"), "subj": user_name or "Agent"},
                    )
                output = f"가장 최근의 사고(EventID: {row.get('EventID')})를 오탐으로 처리했습니다."
            else:
                output = format_recent_accident(row)

        return output, status

    try:
        result = await run_in_threadpool(agent.invoke, {"input": message})
        output = result.get("output", "")
    except Exception:
        status = "failed"
        output = "Agent error"

    return output, status


def list_rooms(engine, limit: int, cursor: Optional[int]) -> ChatRoomListResponse:
    rows = chat_rooms_repo.list_rooms(engine, limit + 1, cursor, room_type="public")
    items = [row_to_room(row) for row in rows[:limit]]

    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1].get("room_id"))

    return ChatRoomListResponse(items=items, nextCursor=next_cursor)


def get_room(engine, room_id: int) -> Optional[ChatRoomResponse]:
    row = chat_rooms_repo.get_room(engine, room_id)
    if not row:
        return None
    return row_to_room(row)


def create_room(engine, title: Optional[str]) -> ChatRoomResponse:
    row = chat_rooms_repo.create_room(
        engine,
        title=normalize_title(title),
        room_type="public",
        created_by_user_id=None,
    )
    return row_to_room(row)


def update_room(engine, room_id: int, title: Optional[str]) -> Optional[ChatRoomResponse]:
    if title is None:
        return get_room(engine, room_id)
    row = chat_rooms_repo.update_room_title(engine, room_id, normalize_title(title))
    if not row:
        return None
    return row_to_room(row)


def delete_room(engine, room_id: int) -> bool:
    room = chat_rooms_repo.get_room(engine, room_id)
    if not room:
        return False
    chat_rooms_repo.delete_messages_by_room(engine, room_id)
    return chat_rooms_repo.delete_room(engine, room_id)


def list_messages(
    engine,
    room_id: int,
    limit: int,
    cursor: Optional[int],
) -> ChatMessageListResponse:
    rows = chat_rooms_repo.list_messages(engine, room_id, limit + 1, cursor)
    slice_rows = rows[:limit]

    items = [row_to_message(row) for row in reversed(slice_rows)]
    next_cursor = None
    if len(rows) > limit and slice_rows:
        next_cursor = str(slice_rows[-1].get("message_id"))

    return ChatMessageListResponse(items=items, nextCursor=next_cursor)


async def create_message_pair(
    engine,
    agent,
    room_id: int,
    message: str,
    user_name: Optional[str],
    sender_type: str,
    sender_id: Optional[str],
) -> ChatMessageCreateResponse:
    user_row = chat_rooms_repo.create_message(
        engine,
        room_id=room_id,
        role="user",
        content=message,
        sender_type=sender_type,
        sender_id=sender_id,
        sender_name=user_name or "Guest",
    )
    chat_rooms_repo.update_room_last_message(engine, room_id, build_preview(message))

    output, status = await generate_output(engine, agent, message, user_name)
    if status == "failed":
        insert_chat_log(engine, user_name or "system", message, status)
        raise RuntimeError("Agent error")

    assistant_row = chat_rooms_repo.create_message(
        engine,
        room_id=room_id,
        role="assistant",
        content=output or "",
        sender_type="assistant",
        sender_id=None,
        sender_name="Assistant",
    )

    preview = build_preview(assistant_row.get("content") or "")
    chat_rooms_repo.update_room_last_message(engine, room_id, preview)
    insert_chat_log(engine, user_name or "system", message, status)

    return ChatMessageCreateResponse(
        roomId=str(room_id),
        userMessage=row_to_message(user_row),
        assistantMessage=row_to_message(assistant_row),
    )
