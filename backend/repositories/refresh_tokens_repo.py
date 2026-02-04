from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import text


def create_refresh_token(
    engine,
    user_id: int,
    token_hash: str,
    expires_at: datetime,
) -> int:
    sql = """
    INSERT INTO RefreshTokens (user_id, token_hash, expires_at, created_at)
    OUTPUT INSERTED.token_id
    VALUES (:user_id, :token_hash, :expires_at, GETUTCDATE());
    """
    with engine.begin() as conn:
        row = conn.execute(
            text(sql),
            {
                "user_id": user_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
            },
        ).first()
        return int(row[0]) if row else 0


def get_refresh_token_by_hash(engine, token_hash: str) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT token_id, user_id, token_hash, expires_at, revoked_at
    FROM RefreshTokens
    WHERE token_hash = :token_hash;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"token_hash": token_hash}).mappings().first()


def revoke_refresh_token(engine, token_id: int) -> None:
    sql = """
    UPDATE RefreshTokens
    SET revoked_at = GETUTCDATE()
    WHERE token_id = :token_id AND revoked_at IS NULL;
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {"token_id": token_id})


def revoke_refresh_token_by_hash(engine, token_hash: str) -> None:
    sql = """
    UPDATE RefreshTokens
    SET revoked_at = GETUTCDATE()
    WHERE token_hash = :token_hash AND revoked_at IS NULL;
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {"token_hash": token_hash})


def revoke_user_tokens(engine, user_id: int) -> None:
    sql = """
    UPDATE RefreshTokens
    SET revoked_at = GETUTCDATE()
    WHERE user_id = :user_id AND revoked_at IS NULL;
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {"user_id": user_id})


def cleanup_refresh_tokens(engine) -> int:
    sql = """
    DELETE FROM RefreshTokens
    WHERE revoked_at IS NOT NULL OR expires_at < GETUTCDATE();
    """
    with engine.begin() as conn:
        result = conn.execute(text(sql))
        return result.rowcount if result.rowcount is not None else 0
