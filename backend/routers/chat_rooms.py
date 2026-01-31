from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from ..schemas import (
    ChatRoomCreateRequest,
    ChatRoomUpdateRequest,
    ChatRoomResponse,
    ChatRoomListResponse,
    ChatMessageCreateRequest,
    ChatMessageCreateResponse,
    ChatMessageListResponse,
)
from ..services import chat_rooms_service, i18n_service
from ..utils.i18n_handler import apply_i18n, apply_i18n_to_items
from ..utils.exceptions import ensure_found, ensure_valid

router = APIRouter()


@router.post("/api/chat/rooms", response_model=ChatRoomResponse)
def create_room(
    request: Request,
    payload: ChatRoomCreateRequest,
) -> ChatRoomResponse:
    engine = request.app.state.db_engine
    return chat_rooms_service.create_room(engine, payload.title)


@router.get("/api/chat/rooms", response_model=ChatRoomListResponse)
def list_rooms(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None, ge=1),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ChatRoomListResponse:
    engine = request.app.state.db_engine
    response = chat_rooms_service.list_rooms(engine, limit, cursor)
    apply_i18n_to_items(response.items, request, i18n_service.attach_chat_rooms, lang, includeI18n)
    return response


@router.get("/api/chat/rooms/{room_id}", response_model=ChatRoomResponse)
def get_room(
    request: Request,
    room_id: int,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ChatRoomResponse:
    engine = request.app.state.db_engine
    room = ensure_found(chat_rooms_service.get_room(engine, room_id), "Room")
    apply_i18n_to_items([room], request, i18n_service.attach_chat_rooms, lang, includeI18n)
    return room


@router.patch("/api/chat/rooms/{room_id}", response_model=ChatRoomResponse)
def update_room(
    request: Request,
    room_id: int,
    payload: ChatRoomUpdateRequest,
) -> ChatRoomResponse:
    engine = request.app.state.db_engine
    room = ensure_found(chat_rooms_service.update_room(engine, room_id, payload.title), "Room")
    return room


@router.delete("/api/chat/rooms/{room_id}")
def delete_room(request: Request, room_id: int) -> dict:
    engine = request.app.state.db_engine
    deleted = chat_rooms_service.delete_room(engine, room_id)
    ensure_valid(deleted, "Room not found", 404)
    return {"status": "deleted"}


@router.get(
    "/api/chat/rooms/{room_id}/messages",
    response_model=ChatMessageListResponse,
)
def list_messages(
    request: Request,
    room_id: int,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None, ge=1),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ChatMessageListResponse:
    engine = request.app.state.db_engine
    ensure_found(chat_rooms_service.get_room(engine, room_id), "Room")
    response = chat_rooms_service.list_messages(engine, room_id, limit, cursor)
    apply_i18n_to_items(response.items, request, i18n_service.attach_chat_messages, lang, includeI18n)
    return response


@router.post(
    "/api/chat/rooms/{room_id}/messages",
    response_model=ChatMessageCreateResponse,
)
async def create_message(
    request: Request,
    room_id: int,
    payload: ChatMessageCreateRequest,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ChatMessageCreateResponse:
    engine = request.app.state.db_engine
    ensure_found(chat_rooms_service.get_room(engine, room_id), "Room")

    agent = getattr(request.app.state, "agent_executor", None)
    ensure_valid(agent is not None, "Agent not initialized", 500)

    sender_type = payload.sender_type
    if sender_type not in ("guest", "user"):
        sender_type = "guest"

    try:
        response = await chat_rooms_service.create_message_pair(
            engine=engine,
            agent=agent,
            room_id=room_id,
            message=payload.message,
            user_name=payload.user,
            sender_type=sender_type,
            sender_id=payload.sender_id,
        )
        apply_i18n(response, request, i18n_service.attach_chat_message_pair, lang, includeI18n)
        return response
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
