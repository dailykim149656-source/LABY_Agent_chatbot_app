import json
from typing import Any, Dict, Optional, Tuple

from ..repositories import users_repo
from ..repositories import consents_repo
from ..utils.security import hash_password, validate_password_policy


def list_users(
    engine,
    limit: int,
    cursor: Optional[int],
) -> Tuple[list[Dict[str, Any]], int, Optional[str]]:
    rows = users_repo.list_users(engine, limit + 1, cursor)
    items = rows[:limit]
    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1]["user_id"])
    total = users_repo.count_users(engine)
    return items, total, next_cursor


def get_user(engine, user_id: int) -> Optional[Dict[str, Any]]:
    return users_repo.get_user_by_id(engine, user_id)


def create_user(
    engine,
    email: str,
    password: str,
    name: Optional[str],
    role: str,
    affiliation: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    phone: Optional[str] = None,
    contact_email: Optional[str] = None,
    profile_image_url: Optional[str] = None,
    consent_payload: Optional[Dict[str, Any]] = None,
    consent_version: Optional[str] = None,
    consent_source: Optional[str] = None,
    consent_ip: Optional[str] = None,
    consent_user_agent: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    validate_password_policy(password)
    password_hash = hash_password(password)
    user = users_repo.create_user(
        engine,
        email=email,
        password_hash=password_hash,
        name=name,
        role=role,
        affiliation=affiliation,
        department=department,
        position=position,
        phone=phone,
        contact_email=contact_email,
        profile_image_url=profile_image_url,
    )
    if not user:
        return None
    if consent_payload:
        try:
            consent_json = json.dumps(consent_payload, ensure_ascii=False)
            consents_repo.create_user_consent(
                engine,
                user_id=int(user["user_id"]),
                consent_version=consent_version or "unknown",
                consent_payload=consent_json,
                consent_source=consent_source,
                ip_address=consent_ip,
                user_agent=consent_user_agent,
            )
        except Exception:
            users_repo.delete_user(engine, int(user["user_id"]))
            raise
    return user


def update_user(
    engine,
    user_id: int,
    name: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    affiliation: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    phone: Optional[str] = None,
    contact_email: Optional[str] = None,
    profile_image_url: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    return users_repo.update_user(
        engine,
        user_id=user_id,
        name=name,
        role=role,
        is_active=is_active,
        affiliation=affiliation,
        department=department,
        position=position,
        phone=phone,
        contact_email=contact_email,
        profile_image_url=profile_image_url,
    )


def update_password(engine, user_id: int, password: str) -> bool:
    validate_password_policy(password)
    password_hash = hash_password(password)
    return users_repo.update_password_hash(engine, user_id, password_hash)


def deactivate_user(engine, user_id: int) -> bool:
    return users_repo.deactivate_user(engine, user_id)


def delete_user(engine, user_id: int) -> bool:
    return users_repo.delete_user(engine, user_id)
