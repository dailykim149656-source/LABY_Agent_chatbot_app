"""
Error Handling Utilities

Provides reusable functions for common error handling patterns.
"""

from typing import TypeVar, Optional
from fastapi import HTTPException

T = TypeVar("T")


def ensure_found(item: Optional[T], entity_name: str = "Item") -> T:
    """
    Ensure an item exists, raise 404 if not found.

    Args:
        item: The item to check (can be None)
        entity_name: Name of the entity for error message

    Returns:
        The item if it exists

    Raises:
        HTTPException: 404 error if item is None

    Example:
        room = ensure_found(get_room(room_id), "Room")
    """
    if item is None:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return item


def ensure_valid(
    condition: bool,
    message: str,
    status_code: int = 400,
) -> None:
    """
    Ensure a condition is true, raise HTTPException if not.

    Args:
        condition: The condition to check
        message: Error message if condition is False
        status_code: HTTP status code for the error (default: 400)

    Raises:
        HTTPException: If condition is False

    Example:
        ensure_valid(user.is_admin, "Admin access required", 403)
    """
    if not condition:
        raise HTTPException(status_code=status_code, detail=message)


def ensure_not_exists(
    item: Optional[T],
    entity_name: str = "Item",
    identifier: Optional[str] = None,
) -> None:
    """
    Ensure an item does NOT exist, raise 409 Conflict if it does.

    Args:
        item: The item to check (should be None)
        entity_name: Name of the entity for error message
        identifier: Optional identifier to include in message

    Raises:
        HTTPException: 409 error if item exists

    Example:
        ensure_not_exists(get_user_by_email(email), "User", email)
    """
    if item is not None:
        detail = f"{entity_name} already exists"
        if identifier:
            detail = f"{entity_name} '{identifier}' already exists"
        raise HTTPException(status_code=409, detail=detail)


def handle_db_error(operation: str = "Database operation") -> None:
    """
    Raise a 500 error for database operation failures.

    Args:
        operation: Description of the failed operation

    Raises:
        HTTPException: 500 Internal Server Error

    Example:
        if not result:
            handle_db_error("Failed to create experiment")
    """
    raise HTTPException(status_code=500, detail=f"{operation} failed")
