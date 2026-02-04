import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
ISSUER = os.getenv("JWT_ISSUER", "laby-auth")
LEEWAY_SECONDS = int(os.getenv("JWT_LEEWAY_SECONDS", "30"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    has_letter = any(char.isalpha() for char in password)
    has_digit = any(char.isdigit() for char in password)
    if not (has_letter and has_digit):
        raise ValueError("Password must include letters and numbers")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(
    data: Dict[str, Any],
    expires_minutes: Optional[int] = None,
) -> str:
    to_encode = data.copy()
    expire_minutes = expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    now = datetime.utcnow()
    expire = now + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire, "iat": now, "iss": ISSUER})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        try:
            return jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                issuer=ISSUER,
                options={"require": ["exp", "iat", "iss"]},
                leeway=LEEWAY_SECONDS,
            )
        except TypeError:
            return jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                issuer=ISSUER,
                options={"require": ["exp", "iat", "iss"]},
            )
    except JWTError:
        return None
