import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

from ..repositories import users_repo
from ..repositories import refresh_tokens_repo
from ..repositories import consents_repo
from ..utils.security import (
    create_access_token,
    hash_password,
    verify_password,
    validate_password_policy,
    hash_token,
)

REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def signup_user(
    engine,
    email: str,
    password: str,
    name: Optional[str] = None,
    role: str = "user",
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
) -> Dict[str, Any]:
    existing = users_repo.get_user_by_email(engine, email)
    if existing:
        raise ValueError("User already exists")

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
        raise ValueError("Failed to create user")
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


def authenticate_user(
    engine, email: str, password: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    user = users_repo.get_user_by_email(engine, email)
    if not user:
        return None, "INVALID_CREDENTIALS"
    if not verify_password(password, user.get("password_hash", "")):
        return None, "INVALID_CREDENTIALS"
    if not user.get("is_active", True):
        return None, "ACCOUNT_INACTIVE"

    users_repo.update_last_login(engine, user["user_id"])
    return users_repo.get_user_by_id(engine, user["user_id"]), None


def issue_access_token(user: Dict[str, Any]) -> str:
    return create_access_token(
        {
            "sub": str(user["user_id"]),
            "role": user.get("role", "user"),
        }
    )


def issue_refresh_token(engine, user_id: int) -> Tuple[str, datetime]:
    raw_token = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token_hash = hash_token(raw_token)
    refresh_tokens_repo.create_refresh_token(engine, user_id, token_hash, expires_at)
    return raw_token, expires_at


def validate_refresh_token(engine, token: str) -> Optional[Dict[str, Any]]:
    token_hash = hash_token(token)
    record = refresh_tokens_repo.get_refresh_token_by_hash(engine, token_hash)
    if not record:
        return None
    if record.get("revoked_at") is not None:
        return None
    if record.get("expires_at") and record["expires_at"] < datetime.utcnow():
        return None
    return record


def rotate_refresh_token(engine, record: Dict[str, Any]) -> Tuple[str, datetime]:
    refresh_tokens_repo.revoke_refresh_token(engine, int(record["token_id"]))
    return issue_refresh_token(engine, int(record["user_id"]))


def revoke_refresh_token(engine, token: str) -> None:
    token_hash = hash_token(token)
    refresh_tokens_repo.revoke_refresh_token_by_hash(engine, token_hash)


def revoke_user_tokens(engine, user_id: int) -> None:
    refresh_tokens_repo.revoke_user_tokens(engine, user_id)


def delete_account(engine, user_id: int) -> bool:
    revoke_user_tokens(engine, user_id)
    return users_repo.delete_user(engine, user_id)
