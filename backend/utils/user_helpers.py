"""Shared user response builder."""

from typing import Any, Dict

from ..schemas import UserResponse


def build_user_response(user: Dict[str, Any]) -> UserResponse:
    """Map a DB user row to UserResponse schema."""
    return UserResponse(
        id=int(user["user_id"]),
        email=user["email"],
        name=user.get("name"),
        affiliation=user.get("affiliation"),
        department=user.get("department"),
        position=user.get("position"),
        phone=user.get("phone"),
        contactEmail=user.get("contact_email"),
        profileImageUrl=user.get("profile_image_url"),
        role=user.get("role", "user"),
        isActive=bool(user.get("is_active", True)),
        createdAt=user["created_at"],
        lastLoginAt=user.get("last_login_at"),
    )
