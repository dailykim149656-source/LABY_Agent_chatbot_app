from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, timezone as tz
from zoneinfo import ZoneInfo

from starlette.concurrency import run_in_threadpool

from ..repositories import chat_rooms_repo, chat_logs_repo, accidents_repo
from ..schemas import (
    ChatRoomResponse,
    ChatRoomListResponse,
    ChatMessageResponse,
    ChatMessageListResponse,
    ChatMessageCreateResponse,
)
from ..utils.constants import (
    MAX_HISTORY_MESSAGES,
    MAX_PREVIEW_LENGTH,
    DEFAULT_ROOM_TITLE,
    DEFAULT_ROOM_TYPE,
    CHAT_STATUS_COMPLETED,
    CHAT_STATUS_FAILED,
    ROLE_USER,
    ROLE_ASSISTANT,
    SENDER_TYPE_ASSISTANT,
    DEFAULT_SENDER_NAME,
    ASSISTANT_SENDER_NAME,
    SYSTEM_USER_NAME,
    VERIFICATION_CONFIRMED,
    VERIFICATION_FALSE_ALARM,
    DEFAULT_VERIFY_SUBJECT,
    RECENT_KEYWORDS,
    ACCIDENT_KEYWORDS,
    VERIFY_KEYWORDS,
    REJECT_KEYWORDS,
)


def get_user_local_time(user_timezone: Optional[str]) -> str:
    """사용자 timezone 기준 현재 시간 문자열 반환"""
    now_utc = datetime.now(tz.utc)
    if user_timezone:
        try:
            user_tz = ZoneInfo(user_timezone)
            now_local = now_utc.astimezone(user_tz)
            return now_local.strftime("%Y-%m-%d %H:%M:%S %Z")
        except Exception:
            pass
    return now_utc.strftime("%Y-%m-%d %H:%M:%S UTC")


def get_conversation_history(engine, room_id: int, limit: int = MAX_HISTORY_MESSAGES) -> List[Dict[str, Any]]:
    """채팅방의 최근 대화 히스토리를 가져옵니다."""
    rows = chat_rooms_repo.list_messages(engine, room_id, limit, cursor=None)
    # list_messages는 DESC로 가져오므로 reverse하여 시간순 정렬
    return list(reversed(rows))


def format_conversation_history(history: List[Dict[str, Any]]) -> str:
    """대화 히스토리를 프롬프트 형식으로 변환합니다."""
    if not history:
        return ""

    lines = ["[이전 대화 기록]"]
    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == ROLE_USER:
            lines.append(f"사용자: {content}")
        elif role == ROLE_ASSISTANT:
            lines.append(f"어시스턴트: {content}")

    lines.append("")  # 빈 줄 추가
    return "\n".join(lines)


def row_to_room(row) -> ChatRoomResponse:
    return ChatRoomResponse(
        id=str(row.get("room_id")),
        title=row.get("title") or "",
        roomType=row.get("room_type") or DEFAULT_ROOM_TYPE,
        createdAt=row.get("created_at"),
        lastMessageAt=row.get("last_message_at"),
        lastMessagePreview=row.get("last_message_preview"),
    )


def row_to_message(row) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=str(row.get("message_id")),
        roomId=str(row.get("room_id")),
        role=row.get("role") or ROLE_ASSISTANT,
        content=row.get("content") or "",
        createdAt=row.get("created_at"),
        senderType=row.get("sender_type") or SENDER_TYPE_ASSISTANT,
        senderId=row.get("sender_id"),
        senderName=row.get("sender_name"),
    )


def normalize_title(title: Optional[str]) -> str:
    if not title:
        return DEFAULT_ROOM_TITLE
    trimmed = title.strip()
    return trimmed if trimmed else DEFAULT_ROOM_TITLE


def build_preview(content: str, max_len: int = MAX_PREVIEW_LENGTH) -> str:
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


async def generate_output(
    engine,
    agent,
    message: str,
    user_name: Optional[str],
    user_timezone: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[str, str]:
    status = CHAT_STATUS_COMPLETED
    output = ""

    # 사용자 시간 컨텍스트 추가
    user_time_context = ""
    if user_timezone:
        user_local_time = get_user_local_time(user_timezone)
        user_time_context = f"\n[시스템 정보: 현재 사용자 시간은 {user_local_time} ({user_timezone}) 입니다.]"

    # 대화 히스토리 포맷팅
    conversation_context = ""
    if conversation_history:
        conversation_context = format_conversation_history(conversation_history)

    if is_recent_accident_query(message):
        row = accidents_repo.get_latest_unverified(engine)
        if not row:
            output = "미확인 사고가 없습니다."
        else:
            verify_subject = user_name or DEFAULT_VERIFY_SUBJECT
            event_id = row.get("EventID")
            if wants_verify(message):
                accidents_repo.update_verification(
                    engine, event_id, VERIFICATION_CONFIRMED, verify_subject
                )
                output = f"가장 최근의 사고(EventID: {event_id})가 확인 처리되었습니다."
            elif wants_reject(message):
                accidents_repo.update_verification(
                    engine, event_id, VERIFICATION_FALSE_ALARM, verify_subject
                )
                output = f"가장 최근의 사고(EventID: {event_id})를 오탐으로 처리했습니다."
            else:
                output = format_recent_accident(row)

        return output, status

    try:
        # 대화 히스토리 + 시간 컨텍스트 + 현재 메시지를 조합하여 LLM에 전달
        input_parts = []
        if conversation_context:
            input_parts.append(conversation_context)
        if user_time_context:
            input_parts.append(user_time_context.strip())
        input_parts.append(f"현재 질문: {message}")

        input_with_context = "\n".join(input_parts)
        result = await run_in_threadpool(agent.invoke, {"input": input_with_context})
        output = result.get("output", "")
    except Exception:
        status = CHAT_STATUS_FAILED
        output = "Agent error"

    return output, status


def list_rooms(engine, limit: int, cursor: Optional[int]) -> ChatRoomListResponse:
    rows = chat_rooms_repo.list_rooms(engine, limit + 1, cursor, room_type=DEFAULT_ROOM_TYPE)
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
        room_type=DEFAULT_ROOM_TYPE,
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
    user_timezone: Optional[str] = None,
) -> ChatMessageCreateResponse:
    # 먼저 대화 히스토리를 가져옴 (현재 메시지 저장 전)
    conversation_history = get_conversation_history(engine, room_id)

    # 사용자 메시지 저장
    user_row = chat_rooms_repo.create_message(
        engine,
        room_id=room_id,
        role=ROLE_USER,
        content=message,
        sender_type=sender_type,
        sender_id=sender_id,
        sender_name=user_name or DEFAULT_SENDER_NAME,
    )
    chat_rooms_repo.update_room_last_message(engine, room_id, build_preview(message))

    # 히스토리와 함께 응답 생성
    output, status = await generate_output(
        engine, agent, message, user_name, user_timezone,
        conversation_history=conversation_history
    )
    if status == CHAT_STATUS_FAILED:
        chat_logs_repo.insert_chat_log(engine, user_name or SYSTEM_USER_NAME, message, status)
        raise RuntimeError("Agent error")

    assistant_row = chat_rooms_repo.create_message(
        engine,
        room_id=room_id,
        role=ROLE_ASSISTANT,
        content=output or "",
        sender_type=SENDER_TYPE_ASSISTANT,
        sender_id=None,
        sender_name=ASSISTANT_SENDER_NAME,
    )

    preview = build_preview(assistant_row.get("content") or "")
    chat_rooms_repo.update_room_last_message(engine, room_id, preview)
    chat_logs_repo.insert_chat_log(engine, user_name or SYSTEM_USER_NAME, message, status)

    user_message = row_to_message(user_row)
    assistant_message = row_to_message(assistant_row)

    return ChatMessageCreateResponse(
        roomId=str(room_id),
        userMessage=user_message,
        assistantMessage=assistant_message,
    )
