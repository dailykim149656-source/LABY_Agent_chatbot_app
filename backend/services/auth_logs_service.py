from typing import Any, Dict, List, Optional

from ..repositories import auth_logs_repo


_ALLOWED_EVENT_TYPES = {"login", "logout"}


def record_auth_event(
    engine,
    user_id: Optional[int],
    email: Optional[str],
    event_type: str,
    success: bool,
    user_agent: Optional[str],
    ip_address: Optional[str],
) -> None:
    if event_type not in _ALLOWED_EVENT_TYPES:
        return
    auth_logs_repo.create_auth_log(
        engine=engine,
        user_id=user_id,
        email=email,
        event_type=event_type,
        success=success,
        user_agent=user_agent,
        ip_address=ip_address,
    )


def list_auth_logs(engine, user_id: int, limit: int) -> List[Dict[str, Any]]:
    safe_limit = max(1, min(limit, 50))
    return auth_logs_repo.list_auth_logs_by_user(engine, user_id, safe_limit)


def delete_auth_logs(engine, user_id: int) -> int:
    return auth_logs_repo.delete_auth_logs_by_user(engine, user_id)


def count_recent_failed_logins(
    engine,
    ip_address: Optional[str],
    email: Optional[str],
    window_seconds: int,
) -> int:
    return auth_logs_repo.count_recent_failed_logins(
        engine, ip_address, email, window_seconds
    )


def delete_all_auth_logs(engine) -> int:
    return auth_logs_repo.delete_all_auth_logs(engine)
