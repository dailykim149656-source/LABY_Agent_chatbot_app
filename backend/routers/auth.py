import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from ..schemas import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    SignupRequest,
    UserResponse,
    UserSelfUpdateRequest,
)
from ..services import auth_logs_service, auth_service, users_service
from ..repositories import users_repo
from ..utils.user_helpers import build_user_response
from ..utils.dependencies import csrf_protect, get_current_user
from ..utils.security import generate_csrf_token
from ..utils.rate_limit import login_rate_limiter

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
ALLOWED_PROFILE_IMAGES = {
    "/avatars/avatar-1.png",
    "/avatars/avatar-2.png",
    "/avatars/avatar-3.png",
}


def _get_cookie_settings(request: Request) -> Dict[str, Any]:
    app_env = os.getenv("APP_ENV", "development").lower()
    samesite = os.getenv("COOKIE_SAMESITE")
    if not samesite:
        samesite = "none" if app_env == "production" else "lax"
    samesite = samesite.lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"

    secure = request.url.scheme == "https" or app_env == "production" or samesite == "none"
    domain = os.getenv("COOKIE_DOMAIN") or None

    return {
        "httponly": True,
        "secure": secure,
        "samesite": samesite,
        "path": "/",
        "domain": domain,
    }

def _should_set_cookies() -> bool:
    return os.getenv("AUTH_COOKIE_ENABLED", "0") == "1"



def _set_auth_cookies(
    response: Response,
    request: Request,
    access_token: str,
    refresh_token: str,
) -> None:
    settings = _get_cookie_settings(request)
    response.set_cookie(
        "access_token",
        access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **settings,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        **settings,
    )


def _set_csrf_cookie(response: Response, request: Request, token: str) -> None:
    settings = _get_cookie_settings(request)
    response.set_cookie(
        "csrf_token",
        token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=False,
        secure=settings["secure"],
        samesite=settings["samesite"],
        path=settings["path"],
        domain=settings["domain"],
    )


def _clear_auth_cookies(response: Response, request: Request) -> None:
    if not _should_set_cookies():
        return
    settings = _get_cookie_settings(request)
    response.delete_cookie("access_token", path=settings["path"], domain=settings["domain"])
    response.delete_cookie("refresh_token", path=settings["path"], domain=settings["domain"])
    response.delete_cookie("csrf_token", path=settings["path"], domain=settings["domain"])


def _rate_limit(request: Request, key_suffix: str) -> None:
    ip = request.client.host if request.client else None
    store = os.getenv("LOGIN_RATE_LIMIT_STORE", "hybrid").lower()
    if store in ("memory", "hybrid"):
        key = f"{ip or 'unknown'}:{key_suffix}"
        if not login_rate_limiter.allow(key):
            raise HTTPException(status_code=429, detail={"code": "RATE_LIMITED"})
    if store in ("db", "hybrid"):
        try:
            recent_failures = auth_logs_service.count_recent_failed_logins(
                request.app.state.db_engine,
                ip_address=ip,
                email=key_suffix,
                window_seconds=login_rate_limiter.window_seconds,
            )
            if recent_failures >= login_rate_limiter.max_requests:
                raise HTTPException(status_code=429, detail={"code": "RATE_LIMITED"})
        except HTTPException:
            raise
        except Exception:
            # If DB check fails, fall back to in-memory limits
            pass


def _build_login_response(
    response: Response,
    request: Request,
    user: Dict[str, Any],
    access_token: str,
    refresh_token: str,
) -> LoginResponse:
    csrf_token = None
    if _should_set_cookies():
        csrf_token = generate_csrf_token()
        _set_auth_cookies(response, request, access_token, refresh_token)
        _set_csrf_cookie(response, request, csrf_token)
    return LoginResponse(
        token_type="bearer",
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=build_user_response(user),
        csrf_token=csrf_token,
    )


def _extract_refresh_token(
    request: Request,
    body: Optional[RefreshRequest],
) -> Optional[str]:
    if body and body.refresh_token:
        return body.refresh_token
    header_token = request.headers.get("X-Refresh-Token")
    if header_token:
        return header_token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        if token:
            return token
    return request.cookies.get("refresh_token")


def _get_request_meta(request: Request) -> Dict[str, Any]:
    user_agent = request.headers.get("user-agent")
    if user_agent and len(user_agent) > 255:
        user_agent = user_agent[:255]
    ip_address = request.client.host if request.client else None
    return {"user_agent": user_agent, "ip_address": ip_address}


def _record_auth_event(
    request: Request,
    user_id: Optional[int],
    email: Optional[str],
    event_type: str,
    success: bool,
) -> None:
    try:
        meta = _get_request_meta(request)
        auth_logs_service.record_auth_event(
            request.app.state.db_engine,
            user_id=user_id,
            email=email,
            event_type=event_type,
            success=success,
            user_agent=meta["user_agent"],
            ip_address=meta["ip_address"],
        )
    except Exception:
        pass



@router.post("/api/auth/signup", response_model=LoginResponse)
def signup(body: SignupRequest, request: Request, response: Response) -> LoginResponse:
    _rate_limit(request, body.email)
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
        consent_payload = consent.dict()
        user_agent = request.headers.get("user-agent")
        if user_agent and len(user_agent) > 255:
            user_agent = user_agent[:255]
        ip_address = request.client.host if request.client else None
        user = auth_service.signup_user(
            request.app.state.db_engine,
            email=body.email,
            password=body.password,
            name=body.name,
            role="user",
            affiliation=body.affiliation,
            department=body.department,
            position=body.position,
            phone=body.phone.strip() if body.phone else None,
            contact_email=body.contactEmail.strip() if body.contactEmail else None,
            consent_payload=consent_payload,
            consent_version=body.consent.version,
            consent_source="signup",
            consent_ip=ip_address,
            consent_user_agent=user_agent,
        )
    except ValueError as exc:
        detail = str(exc)
        detail_lower = detail.lower()
        if "exists" in detail_lower:
            raise HTTPException(status_code=409, detail={"code": "EMAIL_EXISTS"})
        if "password" in detail_lower:
            raise HTTPException(status_code=400, detail={"code": "PASSWORD_POLICY"})
        raise HTTPException(status_code=400, detail={"code": "INVALID_REQUEST"})

    access_token = auth_service.issue_access_token(user)
    refresh_token, _expires_at = auth_service.issue_refresh_token(
        request.app.state.db_engine, int(user["user_id"])
    )
    _record_auth_event(
        request=request,
        user_id=int(user["user_id"]),
        email=user.get("email"),
        event_type="login",
        success=True,
    )
    return _build_login_response(response, request, user, access_token, refresh_token)


@router.post("/api/auth/login", response_model=LoginResponse)
def login(body: LoginRequest, request: Request, response: Response) -> LoginResponse:
    _rate_limit(request, body.email)
    user, error_code = auth_service.authenticate_user(
        request.app.state.db_engine,
        email=body.email,
        password=body.password,
    )
    if error_code:
        existing = users_repo.get_user_by_email(request.app.state.db_engine, body.email)
        existing_user_id = int(existing["user_id"]) if existing else None
        _record_auth_event(
            request=request,
            user_id=existing_user_id,
            email=body.email,
            event_type="login",
            success=False,
        )
        if error_code == "ACCOUNT_INACTIVE":
            raise HTTPException(status_code=403, detail={"code": error_code})
        raise HTTPException(status_code=401, detail={"code": "INVALID_CREDENTIALS"})

    _record_auth_event(
        request=request,
        user_id=int(user["user_id"]),
        email=user.get("email"),
        event_type="login",
        success=True,
    )
    access_token = auth_service.issue_access_token(user)
    refresh_token, _expires_at = auth_service.issue_refresh_token(
        request.app.state.db_engine, int(user["user_id"])
    )
    return _build_login_response(response, request, user, access_token, refresh_token)


@router.get("/api/auth/me", response_model=UserResponse)
def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    return build_user_response(current_user)


@router.patch("/api/auth/me", response_model=UserResponse)
def update_me(
    body: UserSelfUpdateRequest,
    request: Request,
    _: None = Depends(csrf_protect),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    profile_image_url = body.profileImageUrl
    if profile_image_url:
        if profile_image_url not in ALLOWED_PROFILE_IMAGES:
            raise HTTPException(status_code=400, detail="Invalid profile image")
    user = users_service.update_user(
        request.app.state.db_engine,
        user_id=int(current_user["user_id"]),
        name=body.name,
        affiliation=body.affiliation,
        department=body.department,
        position=body.position,
        phone=body.phone,
        contact_email=body.contactEmail,
        profile_image_url=profile_image_url,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return build_user_response(user)


@router.post("/api/auth/dev-login", response_model=LoginResponse)
def dev_login(request: Request, response: Response) -> LoginResponse:
    if os.getenv("ALLOW_DEV_LOGIN") != "1":
        raise HTTPException(status_code=403, detail="Dev login disabled")

    if os.getenv("APP_ENV", "development").lower() == "production":
        raise HTTPException(status_code=403, detail="Dev login disabled")

    dev_secret = os.getenv("DEV_LOGIN_SECRET")
    if not dev_secret:
        raise HTTPException(status_code=403, detail="Dev login disabled")
    if request.headers.get("X-Dev-Login-Secret") != dev_secret:
        raise HTTPException(status_code=403, detail="Dev login disabled")

    email = os.getenv("TEST_USER_EMAIL", "msu@msu.lab.kr")
    password = os.getenv("TEST_USER_PASSWORD", "Test1234")

    user = users_repo.get_user_by_email(request.app.state.db_engine, email)
    if not user:
        try:
            user = auth_service.signup_user(
                request.app.state.db_engine,
                email=email,
                password=password,
                name="Test Admin",
                role="admin",
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    access_token = auth_service.issue_access_token(user)
    refresh_token, _expires_at = auth_service.issue_refresh_token(
        request.app.state.db_engine, int(user["user_id"])
    )
    return _build_login_response(response, request, user, access_token, refresh_token)


@router.post("/api/auth/logout")
def logout(
    request: Request,
    response: Response,
    body: Optional[RefreshRequest] = None,
    _: None = Depends(csrf_protect),
) -> Dict[str, str]:
    refresh_token = _extract_refresh_token(request, body)
    user_id = None
    if refresh_token:
        record = auth_service.validate_refresh_token(
            request.app.state.db_engine, refresh_token
        )
        if record:
            user_id = int(record["user_id"])
            auth_service.revoke_user_tokens(
                request.app.state.db_engine, int(record["user_id"])
            )
        else:
            auth_service.revoke_refresh_token(request.app.state.db_engine, refresh_token)
    _clear_auth_cookies(response, request)
    if user_id is not None:
        _record_auth_event(
            request=request,
            user_id=user_id,
            email=None,
            event_type="logout",
            success=True,
        )
    return {"status": "ok"}


@router.post("/api/auth/refresh", response_model=LoginResponse)
def refresh(
    request: Request,
    response: Response,
    body: Optional[RefreshRequest] = None,
    _: None = Depends(csrf_protect),
) -> LoginResponse:
    refresh_token = _extract_refresh_token(request, body)
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    record = auth_service.validate_refresh_token(
        request.app.state.db_engine, refresh_token
    )
    if not record:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = users_repo.get_user_by_id(request.app.state.db_engine, int(record["user_id"]))
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found")

    access_token = auth_service.issue_access_token(user)
    new_refresh_token, _expires_at = auth_service.rotate_refresh_token(
        request.app.state.db_engine, record
    )
    return _build_login_response(response, request, user, access_token, new_refresh_token)


@router.delete("/api/auth/me")
def delete_me(
    request: Request,
    response: Response,
    _: None = Depends(csrf_protect),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, str]:
    user_id = int(current_user["user_id"])
    success = auth_service.delete_account(request.app.state.db_engine, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    _clear_auth_cookies(response, request)
    return {"status": "ok"}
