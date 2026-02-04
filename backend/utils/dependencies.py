import os
from typing import Any, Dict

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .security import decode_access_token
from ..repositories import users_repo

security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid user id")

    user = users_repo.get_user_by_id(request.app.state.db_engine, user_id_int)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Inactive user")

    return user


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def csrf_protect(request: Request) -> None:
    if os.getenv("CSRF_DISABLED") == "1":
        return
    if os.getenv("AUTH_COOKIE_ENABLED", "0") != "1":
        return
    if request.headers.get("Authorization"):
        return
    if request.method in SAFE_METHODS:
        return
    header = request.headers.get("X-CSRF-Token")
    cookie = request.cookies.get("csrf_token")
    if not header or not cookie:
        raise HTTPException(status_code=403, detail={"code": "CSRF_MISSING"})
    if header != cookie:
        raise HTTPException(status_code=403, detail={"code": "CSRF_INVALID"})
