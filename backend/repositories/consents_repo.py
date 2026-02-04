from typing import Any, Dict, List, Optional

from sqlalchemy import text


def create_user_consent(
    engine,
    user_id: int,
    consent_version: str,
    consent_payload: str,
    consent_source: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    sql = """
    INSERT INTO UserConsents (
        user_id,
        consent_version,
        consent_payload,
        consent_source,
        ip_address,
        user_agent,
        created_at
    )
    VALUES (
        :user_id,
        :consent_version,
        :consent_payload,
        :consent_source,
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
                "consent_version": consent_version,
                "consent_payload": consent_payload,
                "consent_source": consent_source,
                "ip_address": ip_address,
                "user_agent": user_agent,
            },
        )


def list_consents(
    engine,
    limit: int,
    cursor: Optional[int] = None,
) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        c.consent_id,
        c.user_id,
        u.email,
        c.consent_version,
        c.consent_payload,
        c.consent_source,
        c.ip_address,
        c.user_agent,
        c.created_at
    FROM UserConsents c
    LEFT JOIN Users u ON u.user_id = c.user_id
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}
    if cursor is not None:
        sql += " AND c.consent_id < :cursor"
        params["cursor"] = cursor
    sql += " ORDER BY c.consent_id DESC;"
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def count_consents(engine) -> int:
    sql = "SELECT COUNT(*) as total FROM UserConsents;"
    with engine.connect() as conn:
        row = conn.execute(text(sql)).mappings().first()
        return int(row["total"]) if row else 0
