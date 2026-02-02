from typing import Optional, List, Dict, Any

from sqlalchemy import text


def create_room(
    engine,
    title: str,
    room_type: str,
    created_by_user_id: Optional[str],
) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO ChatRooms (title, room_type, created_by_user_id)
    OUTPUT
        INSERTED.room_id,
        INSERTED.title,
        INSERTED.room_type,
        INSERTED.created_by_user_id,
        INSERTED.created_at,
        INSERTED.last_message_at,
        INSERTED.last_message_preview
    VALUES (:title, :room_type, :created_by_user_id);
    """
    with engine.begin() as conn:
        return conn.execute(
            text(sql),
            {
                "title": title,
                "room_type": room_type,
                "created_by_user_id": created_by_user_id,
            },
        ).mappings().first()


def get_room(engine, room_id: int) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT
        room_id, title, room_type, created_by_user_id,
        created_at, last_message_at, last_message_preview
    FROM ChatRooms
    WHERE room_id = :room_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"room_id": room_id}).mappings().first()


def update_room_title(engine, room_id: int, title: str) -> Optional[Dict[str, Any]]:
    sql = "UPDATE ChatRooms SET title = :title WHERE room_id = :room_id;"
    with engine.begin() as conn:
        conn.execute(text(sql), {"room_id": room_id, "title": title})
    return get_room(engine, room_id)


def list_rooms(
    engine,
    limit: int,
    cursor: Optional[int] = None,
    room_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        room_id, title, room_type, created_by_user_id,
        created_at, last_message_at, last_message_preview
    FROM ChatRooms
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}

    if room_type:
        sql += " AND room_type = :room_type"
        params["room_type"] = room_type
    if cursor is not None:
        sql += " AND room_id < :cursor"
        params["cursor"] = cursor

    sql += " ORDER BY room_id DESC"

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def create_message(
    engine,
    room_id: int,
    role: str,
    content: str,
    sender_type: str,
    sender_id: Optional[str],
    sender_name: Optional[str],
) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO ChatMessages (
        room_id, role, content, sender_type, sender_id, sender_name
    )
    OUTPUT
        INSERTED.message_id,
        INSERTED.room_id,
        INSERTED.role,
        INSERTED.content,
        INSERTED.sender_type,
        INSERTED.sender_id,
        INSERTED.sender_name,
        INSERTED.created_at
    VALUES (
        :room_id, :role, :content, :sender_type, :sender_id, :sender_name
    );
    """
    with engine.begin() as conn:
        return conn.execute(
            text(sql),
            {
                "room_id": room_id,
                "role": role,
                "content": content,
                "sender_type": sender_type,
                "sender_id": sender_id,
                "sender_name": sender_name,
            },
        ).mappings().first()


def list_messages(
    engine,
    room_id: int,
    limit: int,
    cursor: Optional[int] = None,
) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        message_id, room_id, role, content,
        sender_type, sender_id, sender_name, created_at
    FROM ChatMessages
    WHERE room_id = :room_id
    """
    params: Dict[str, Any] = {"limit": limit, "room_id": room_id}

    if cursor is not None:
        sql += " AND message_id < :cursor"
        params["cursor"] = cursor

    sql += " ORDER BY message_id DESC"

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def update_room_last_message(engine, room_id: int, preview: str) -> None:
    sql = """
    UPDATE ChatRooms
    SET last_message_at = GETDATE(),
        last_message_preview = :preview
    WHERE room_id = :room_id;
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {"room_id": room_id, "preview": preview})


def delete_messages_by_room(engine, room_id: int) -> int:
    sql = "DELETE FROM ChatMessages WHERE room_id = :room_id;"
    with engine.begin() as conn:
        result = conn.execute(text(sql), {"room_id": room_id})
        return result.rowcount


def delete_room(engine, room_id: int) -> bool:
    sql = "DELETE FROM ChatRooms WHERE room_id = :room_id;"
    with engine.begin() as conn:
        result = conn.execute(text(sql), {"room_id": room_id})
        return result.rowcount > 0
