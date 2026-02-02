"""
Pagination Query Builder Utilities

Provides reusable functions for building cursor-based pagination queries.
"""

from typing import Optional, Dict, Any, Tuple, List


def build_paginated_query(
    select_columns: str,
    table: str,
    limit: int,
    cursor: Optional[int] = None,
    cursor_field: str = "id",
    order: str = "DESC",
    where_clauses: Optional[List[str]] = None,
    extra_params: Optional[Dict[str, Any]] = None,
) -> Tuple[str, Dict[str, Any]]:
    """
    Build a cursor-based pagination query for SQL Server.

    Args:
        select_columns: Column list for SELECT clause (e.g., "id, name, created_at")
        table: Table name to query from
        limit: Maximum number of rows to return
        cursor: Cursor value for pagination (None for first page)
        cursor_field: Field to use for cursor-based pagination (default: "id")
        order: Sort order - "DESC" or "ASC" (default: "DESC")
        where_clauses: Additional WHERE conditions (without "AND" prefix)
        extra_params: Additional query parameters

    Returns:
        Tuple of (sql_query, params_dict)

    Example:
        sql, params = build_paginated_query(
            select_columns="room_id, title, created_at",
            table="ChatRooms",
            limit=50,
            cursor=100,
            cursor_field="room_id",
            where_clauses=["room_type = :room_type"],
            extra_params={"room_type": "general"}
        )
    """
    params: Dict[str, Any] = {"limit": limit}

    if extra_params:
        params.update(extra_params)

    sql = f"""
    SELECT TOP (:limit)
        {select_columns}
    FROM {table}
    WHERE 1=1
    """

    # Add extra WHERE clauses
    if where_clauses:
        for clause in where_clauses:
            sql += f" AND {clause}"

    # Add cursor condition
    if cursor is not None:
        if order.upper() == "DESC":
            sql += f" AND {cursor_field} < :cursor"
        else:
            sql += f" AND {cursor_field} > :cursor"
        params["cursor"] = cursor

    sql += f" ORDER BY {cursor_field} {order}"

    return sql, params


def compute_next_cursor(
    rows: List[Any],
    limit: int,
    cursor_field: str = "id",
) -> Optional[Any]:
    """
    Compute the next cursor value from query results.

    Args:
        rows: List of row mappings from query
        limit: The limit used in the query
        cursor_field: Field name used for cursor

    Returns:
        Next cursor value or None if no more pages
    """
    if len(rows) < limit:
        return None

    last_row = rows[-1]
    if hasattr(last_row, "get"):
        return last_row.get(cursor_field)
    elif hasattr(last_row, cursor_field):
        return getattr(last_row, cursor_field)
    return None
