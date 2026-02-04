from typing import Any, Dict, List, Optional

from sqlalchemy import text


def create_auth_log(
    engine,
    user_id: Optional[int],
    email: Optional[str],
    event_type: str,
    success: bool,
    user_agent: Optional[str],
    ip_address: Optional[str],
) -> None:
    sql = """
    INSERT INTO AuthLogs (
        user_id,
        email,
        event_type,
        success,
        ip_address,
        user_agent,
        logged_at
    )
    VALUES (
        :user_id,
        :email,
        :event_type,
        :success,
        :ip_address,
        :user_agent,
        GETUTCDATE()
    );
    """
    with engine.begin() as conn:
        conn.execute(
            text(sql),
            {
                "user_id": user_id,
                "email": email,
                "event_type": event_type,
                "success": 1 if success else 0,
                "ip_address": ip_address,
                "user_agent": user_agent,
            },
        )


def list_auth_logs_by_user(
    engine, user_id: int, limit: int
) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        log_id,
        event_type,
        success,
        ip_address,
        user_agent,
        logged_at
    FROM AuthLogs
    WHERE user_id = :user_id
    ORDER BY logged_at DESC, log_id DESC;
    """
    with engine.connect() as conn:
        return (
            conn.execute(text(sql), {"user_id": user_id, "limit": limit})
            .mappings()
            .all()
        )


def delete_auth_logs_by_user(engine, user_id: int) -> int:
    sql = "DELETE FROM AuthLogs WHERE user_id = :user_id;"
    with engine.begin() as conn:
        result = conn.execute(text(sql), {"user_id": user_id})
        return int(result.rowcount or 0)


def count_recent_failed_logins(
    engine,
    ip_address: Optional[str],
    email: Optional[str],
    window_seconds: int,
) -> int:
    if not ip_address and not email:
        return 0

    sql = """
    SELECT COUNT(*) AS total
    FROM AuthLogs
    WHERE event_type = 'login'
      AND success = 0
      AND logged_at >= DATEADD(second, -:window_seconds, GETUTCDATE())
    """
    params: Dict[str, Any] = {"window_seconds": window_seconds}
    filters = []
    if ip_address:
        filters.append("ip_address = :ip_address")
        params["ip_address"] = ip_address
    if email:
        filters.append("email = :email")
        params["email"] = email
    if filters:
        sql += f" AND ({' OR '.join(filters)})"

    with engine.connect() as conn:
        row = conn.execute(text(sql), params).mappings().first()
        return int(row["total"]) if row else 0


def delete_all_auth_logs(engine) -> int:
    sql = "DELETE FROM AuthLogs;"
    with engine.begin() as conn:
        result = conn.execute(text(sql))
        return int(result.rowcount or 0)
