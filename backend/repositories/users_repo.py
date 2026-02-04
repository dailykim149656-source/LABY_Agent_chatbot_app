from typing import Any, Dict, List, Optional

from sqlalchemy import text


def get_user_by_id(engine, user_id: int) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT user_id, email, name, affiliation, department, position, phone, contact_email,
           profile_image_url, role, is_active, created_at, updated_at, last_login_at, password_hash
    FROM Users
    WHERE user_id = :user_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"user_id": user_id}).mappings().first()


def get_user_by_email(engine, email: str) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT user_id, email, name, affiliation, department, position, phone, contact_email,
           profile_image_url, role, is_active, created_at, updated_at, last_login_at, password_hash
    FROM Users
    WHERE email = :email;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"email": email}).mappings().first()


def list_users(engine, limit: int, cursor: Optional[int] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT user_id, email, name, affiliation, department, position, phone, contact_email,
           profile_image_url, role, is_active, created_at, updated_at, last_login_at
    FROM Users
    WHERE 1=1
    """
    params: Dict[str, Any] = {}

    if cursor is not None:
        sql += " AND user_id < :cursor"
        params["cursor"] = cursor

    sql += " ORDER BY user_id DESC OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY"
    params["limit"] = limit

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def count_users(engine) -> int:
    sql = "SELECT COUNT(*) as total FROM Users;"
    with engine.connect() as conn:
        row = conn.execute(text(sql)).mappings().first()
        return int(row["total"]) if row else 0


def create_user(
    engine,
    email: str,
    password_hash: str,
    name: Optional[str],
    role: str,
    affiliation: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    phone: Optional[str] = None,
    contact_email: Optional[str] = None,
    profile_image_url: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO Users (
        email, password_hash, name, role,
        affiliation, department, position, phone, contact_email, profile_image_url,
        created_at, updated_at
    )
    VALUES (
        :email, :password_hash, :name, :role,
        :affiliation, :department, :position, :phone, :contact_email, :profile_image_url,
        GETUTCDATE(), GETUTCDATE()
    );
    """
    with engine.begin() as conn:
        conn.execute(
            text(sql),
            {
                "email": email,
                "password_hash": password_hash,
                "name": name,
                "role": role,
                "affiliation": affiliation,
                "department": department,
                "position": position,
                "phone": phone,
                "contact_email": contact_email,
                "profile_image_url": profile_image_url,
            },
        )
    return get_user_by_email(engine, email)


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
    updates = []
    params: Dict[str, Any] = {"user_id": user_id}

    if name is not None:
        updates.append("name = :name")
        params["name"] = name
    if role is not None:
        updates.append("role = :role")
        params["role"] = role
    if is_active is not None:
        updates.append("is_active = :is_active")
        params["is_active"] = 1 if is_active else 0
    if affiliation is not None:
        updates.append("affiliation = :affiliation")
        params["affiliation"] = affiliation
    if department is not None:
        updates.append("department = :department")
        params["department"] = department
    if position is not None:
        updates.append("position = :position")
        params["position"] = position
    if phone is not None:
        updates.append("phone = :phone")
        params["phone"] = phone
    if contact_email is not None:
        updates.append("contact_email = :contact_email")
        params["contact_email"] = contact_email
    if profile_image_url is not None:
        updates.append("profile_image_url = :profile_image_url")
        params["profile_image_url"] = profile_image_url

    if updates:
        updates.append("updated_at = GETUTCDATE()")
        sql = f"UPDATE Users SET {', '.join(updates)} WHERE user_id = :user_id;"
        with engine.begin() as conn:
            conn.execute(text(sql), params)

    return get_user_by_id(engine, user_id)


def deactivate_user(engine, user_id: int) -> bool:
    sql = """
    UPDATE Users
    SET is_active = 0, updated_at = GETUTCDATE()
    WHERE user_id = :user_id;
    """
    with engine.begin() as conn:
        result = conn.execute(text(sql), {"user_id": user_id})
        return result.rowcount > 0


def delete_user(engine, user_id: int) -> bool:
    sql = "DELETE FROM Users WHERE user_id = :user_id;"
    with engine.begin() as conn:
        result = conn.execute(text(sql), {"user_id": user_id})
        return result.rowcount > 0


def update_last_login(engine, user_id: int) -> None:
    sql = "UPDATE Users SET last_login_at = GETUTCDATE(), updated_at = GETUTCDATE() WHERE user_id = :user_id;"
    with engine.begin() as conn:
        conn.execute(text(sql), {"user_id": user_id})


def update_password_hash(engine, user_id: int, password_hash: str) -> bool:
    sql = """
    UPDATE Users
    SET password_hash = :password_hash, updated_at = GETUTCDATE()
    WHERE user_id = :user_id;
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(sql), {"user_id": user_id, "password_hash": password_hash}
        )
        return result.rowcount > 0
