"""Repository for ChatLogs data access."""

from typing import Any, Dict, List

from sqlalchemy import text


def insert_chat_log(engine, user_name: str, command: str, status: str) -> None:
    sql = """
    INSERT INTO ChatLogs (user_name, command, status)
    VALUES (:user_name, :command, :status);
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {"user_name": user_name, "command": command, "status": status})


def list_chat_logs(engine, limit: int) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        log_id, timestamp, user_name, command, status
    FROM ChatLogs
    ORDER BY timestamp DESC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"limit": limit}).mappings().all()


def list_chat_logs_all(engine) -> List[Dict[str, Any]]:
    sql = """
    SELECT log_id, timestamp, user_name, command, status
    FROM ChatLogs
    ORDER BY timestamp DESC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql)).mappings().all()
