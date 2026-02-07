"""Shared DB/SQL helper utilities for MSSQL."""

from datetime import datetime
from typing import Optional

from sqlalchemy import text


def bracket(name: str) -> str:
    """Safely bracket a SQL Server identifier."""
    return f"[{name.replace(']', ']]')}]"


def format_db_time(value) -> str | None:
    """Format a DB datetime value to 'YYYY-MM-DD HH:MM:SS' string."""
    if value is None:
        return None
    if hasattr(value, "strftime"):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    raw = str(value).strip()
    if not raw:
        return None
    if "T" in raw:
        date_part, time_part = raw.split("T", 1)
    elif " " in raw:
        date_part, time_part = raw.split(" ", 1)
    else:
        return raw
    time_part = time_part.replace("Z", "")
    if "+" in time_part:
        time_part = time_part.split("+", 1)[0]
    if "-" in time_part:
        time_part = time_part.split("-", 1)[0]
    time_part = time_part.split(".", 1)[0]
    if len(time_part) > 8:
        time_part = time_part[:8]
    return f"{date_part} {time_part}"


def parse_db_time(value) -> Optional[datetime]:
    """Parse a DB datetime value into a Python datetime."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    raw = str(value).strip()
    if not raw:
        return None
    raw = raw.replace("Z", "")
    if "+" in raw:
        raw = raw.split("+", 1)[0]
    if " " in raw:
        date_part, time_part = raw.split(" ", 1)
        if "-" in time_part and ":" in time_part:
            time_part = time_part.split("-", 1)[0]
        raw = f"{date_part} {time_part}"
    raw = raw.replace("T", " ")
    if "." in raw:
        raw = raw.split(".", 1)[0]
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def resolve_table(conn, table_name: str) -> Optional[dict]:
    """Resolve a MSSQL table/view to its schema-qualified reference."""
    try:
        rows = conn.execute(
            text(
                """
            SELECT s.name AS schema_name, o.type
            FROM sys.objects o
            JOIN sys.schemas s ON o.schema_id = s.schema_id
            WHERE o.name = :table_name AND o.type IN ('U', 'V', 'SN');
            """
            ),
            {"table_name": table_name},
        ).mappings().all()
    except Exception:
        return None
    if not rows:
        return None
    preferred = next((row for row in rows if row.get("schema_name") == "dbo"), rows[0])
    schema_name = preferred.get("schema_name") or "dbo"
    return {
        "schema": schema_name,
        "table_ref": f"{bracket(schema_name)}.{bracket(table_name)}",
        "object_name": f"{schema_name}.{table_name}",
    }


def _resolve_columns(conn, object_name: str | None) -> Optional[dict]:
    """Get column name mapping for a table (lowercased key -> original name)."""
    if not object_name:
        return None
    try:
        rows = conn.execute(
            text(
                """
            SELECT c.name
            FROM sys.columns c
            WHERE c.object_id = OBJECT_ID(:object_name);
            """
            ),
            {"object_name": object_name},
        ).fetchall()
    except Exception:
        return None
    col_names = [row[0] for row in rows]
    if not col_names:
        return None
    return {name.lower(): name for name in col_names}


def _pick(lower_map: dict, candidates: list[str]) -> Optional[str]:
    """Pick the first matching column name from candidates."""
    for cand in candidates:
        if cand in lower_map:
            return lower_map[cand]
    return None


def resolve_env_columns(conn, object_name: str | None) -> Optional[dict]:
    """Resolve temperature/humidity/time column names for environment table."""
    lower_map = _resolve_columns(conn, object_name)
    if not lower_map:
        return None

    time_col = lower_map.get("log_time")
    if not time_col:
        time_col = _pick(
            lower_map,
            ["recorded_at", "timestamp", "time", "created_at", "createdat",
             "logged_at", "datetime", "ts"],
        )

    return {
        "temp": _pick(lower_map, ["temperature", "temp", "temp_c", "temp_celsius", "temperature_c"]),
        "humidity": _pick(lower_map, ["humidity", "humid", "hum", "humidity_pct", "humidity_percent", "rh"]),
        "time": time_col,
    }


def resolve_weight_columns(conn, object_name: str | None) -> Optional[dict]:
    """Resolve column names for weight/scale log table."""
    lower_map = _resolve_columns(conn, object_name)
    if not lower_map:
        return None

    return {
        "storage_id": _pick(lower_map, ["storageid", "storage_id", "storage", "device_id", "deviceid", "id"]),
        "weight": _pick(lower_map, ["weightvalue", "weight_value", "weight", "value"]),
        "status": _pick(lower_map, ["status", "state"]),
        "empty_time": _pick(lower_map, ["emptytime", "empty_time", "duration", "elapsed"]),
        "time": _pick(lower_map, ["recordedat", "recorded_at", "timestamp", "time", "created_at", "createdat"]),
    }
