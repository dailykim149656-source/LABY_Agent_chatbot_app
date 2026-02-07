from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from ..schemas import (
    AuthLogListResponse,
    UserCreateRequest,
    UserListResponse,
    UserPasswordResetRequest,
    UserResponse,
    UserUpdateRequest,
)
from ..services import auth_logs_service, users_service
from ..repositories import users_repo
from ..utils.dependencies import csrf_protect, require_admin
from ..utils.user_helpers import build_user_response

router = APIRouter(dependencies=[Depends(require_admin), Depends(csrf_protect)])
ALLOWED_PROFILE_IMAGES = {
    "/avatars/avatar-1.png",
    "/avatars/avatar-2.png",
    "/avatars/avatar-3.png",
}


def _validate_profile_image(url: Optional[str]) -> None:
    if url and url not in ALLOWED_PROFILE_IMAGES:
        raise HTTPException(status_code=400, detail="Invalid profile image")



@router.get("/api/users", response_model=UserListResponse)
def list_users(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None),
) -> UserListResponse:
    items, total, next_cursor = users_service.list_users(
        request.app.state.db_engine,
        limit,
        cursor,
    )
    return UserListResponse(
        items=[build_user_response(item) for item in items],
        total=total,
        nextCursor=next_cursor,
    )


@router.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, request: Request) -> UserResponse:
    user = users_service.get_user(request.app.state.db_engine, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return build_user_response(user)


@router.get("/api/users/{user_id}/auth-logs", response_model=AuthLogListResponse)
def list_auth_logs(
    user_id: int,
    request: Request,
    limit: int = Query(10, ge=1, le=50),
) -> AuthLogListResponse:
    logs = auth_logs_service.list_auth_logs(
        request.app.state.db_engine, user_id, limit
    )
    return AuthLogListResponse(
        items=[
            {
                "id": int(item["log_id"]),
                "eventType": item["event_type"],
                "success": bool(item["success"]),
                "loggedAt": item["logged_at"],
                "ipAddress": item.get("ip_address"),
                "userAgent": item.get("user_agent"),
            }
            for item in logs
        ]
    )


@router.delete("/api/users/{user_id}/auth-logs")
def delete_auth_logs(user_id: int, request: Request) -> Dict[str, str]:
    deleted = auth_logs_service.delete_auth_logs(request.app.state.db_engine, user_id)
    if deleted == 0:
        existing = users_service.get_user(request.app.state.db_engine, user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.delete("/api/users/auth-logs")
def delete_all_auth_logs(request: Request) -> Dict[str, str]:
    auth_logs_service.delete_all_auth_logs(request.app.state.db_engine)
    return {"status": "ok"}


@router.post("/api/users", response_model=UserResponse)
def create_user(body: UserCreateRequest, request: Request) -> UserResponse:
    existing = users_repo.get_user_by_email(request.app.state.db_engine, body.email)
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    _validate_profile_image(body.profileImageUrl)
    consent = body.consent
    if not all(
        [
            consent.required,
            consent.iotEnvironment,
            consent.iotReagent,
            consent.video,
        ]
    ):
        raise HTTPException(status_code=400, detail="Required consents are missing")

    try:
        user_agent = request.headers.get("user-agent")
        if user_agent and len(user_agent) > 255:
            user_agent = user_agent[:255]
        ip_address = request.client.host if request.client else None
        user = users_service.create_user(
            request.app.state.db_engine,
            email=body.email,
            password=body.password,
            name=body.name,
            role=body.role,
            affiliation=body.affiliation,
            department=body.department,
            position=body.position,
            phone=body.phone.strip() if body.phone else None,
            contact_email=body.contactEmail.strip() if body.contactEmail else None,
            profile_image_url=body.profileImageUrl,
            consent_payload=body.consent.dict(),
            consent_version=body.consent.version,
            consent_source="admin_create",
            consent_ip=ip_address,
            consent_user_agent=user_agent,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    return build_user_response(user)


@router.patch("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UserUpdateRequest, request: Request) -> UserResponse:
    _validate_profile_image(body.profileImageUrl)
    user = users_service.update_user(
        request.app.state.db_engine,
        user_id=user_id,
        name=body.name,
        role=body.role,
        is_active=body.isActive,
        affiliation=body.affiliation,
        department=body.department,
        position=body.position,
        phone=body.phone,
        contact_email=body.contactEmail,
        profile_image_url=body.profileImageUrl,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return build_user_response(user)


@router.delete("/api/users/{user_id}")
def delete_user(user_id: int, request: Request) -> Dict[str, str]:
    success = users_service.deactivate_user(request.app.state.db_engine, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.patch("/api/users/{user_id}/password")
def reset_password(
    user_id: int, body: UserPasswordResetRequest, request: Request
) -> Dict[str, str]:
    success = users_service.update_password(
        request.app.state.db_engine, user_id, body.password
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}


@router.delete("/api/users/{user_id}/hard")
def delete_user_hard(
    user_id: int,
    request: Request,
    current_user: Dict[str, Any] = Depends(require_admin),
) -> Dict[str, str]:
    if current_user.get("user_id") == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete self")

    success = users_service.delete_user(request.app.state.db_engine, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok"}
