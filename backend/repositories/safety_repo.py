"""Repository for safety-related data access (environment, FallEvents, WeightLog)."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text

from ..utils.db_helpers import bracket, resolve_table, resolve_env_columns


def get_server_times(conn) -> Dict[str, Any]:
    """Get current UTC and local server times."""
    try:
        row = (
            conn.execute(text("SELECT GETUTCDATE() AS utc_now, GETDATE() AS local_now;"))
            .mappings()
            .first()
        )
        if row:
            return {"utc": row.get("utc_now"), "local": row.get("local_now")}
    except Exception:
        pass
    return {"utc": None, "local": None}


def get_fall_events_page(
    conn, fall_table_ref: str, limit: int, offset: int
) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT
        [EventID], [Timestamp], [CameraID], [RiskAngle], [Status],
        [EventSummary], [ExperimentID], [VerificationStatus]
    FROM {fall_table_ref}
    ORDER BY [Timestamp] DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY;
    """
    return conn.execute(text(sql), {"limit": limit, "offset": offset}).mappings().all()


def count_fall_events(conn, fall_table_ref: str) -> int:
    result = conn.execute(text(f"SELECT COUNT(*) FROM {fall_table_ref};")).scalar()
    return int(result or 0)


def get_env_latest(conn, env_table_ref: str, env_cols: dict, time_basis_sql: str, window_offset: int):
    """Get the latest environment reading (temp/humidity)."""
    if not env_cols or not env_cols.get("temp") or not env_cols.get("humidity"):
        return None

    temp_col = bracket(env_cols["temp"])
    humidity_col = bracket(env_cols["humidity"])
    time_col = bracket(env_cols["time"]) if env_cols.get("time") else None
    select_cols = [
        f"{temp_col} AS temp",
        f"{humidity_col} AS humidity",
        f"{time_col} AS recorded_at" if time_col else "NULL AS recorded_at",
    ]
    if time_col:
        select_cols.append(
            f"CASE WHEN {time_col} >= DATEADD(minute, :window_offset, {time_basis_sql}) THEN 1 ELSE 0 END AS is_recent"
        )
    env_query = f"SELECT TOP 1 {', '.join(select_cols)} FROM {env_table_ref}"
    if time_col:
        env_query = f"{env_query} ORDER BY {time_col} DESC"
    try:
        return conn.execute(text(env_query), {"window_offset": window_offset}).mappings().first()
    except Exception:
        return None


def get_connected_cameras(
    conn, fall_table_ref: str, time_basis_sql: str, window_offset: int
) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT
        [CameraID] AS device_id,
        MAX([Timestamp]) AS last_seen
    FROM {fall_table_ref}
    WHERE [Timestamp] >= DATEADD(minute, :window_offset, {time_basis_sql})
    GROUP BY [CameraID]
    ORDER BY MAX([Timestamp]) DESC;
    """
    try:
        return conn.execute(text(sql), {"window_offset": window_offset}).mappings().all()
    except Exception:
        return []


def get_connected_scales(
    conn, weight_table_ref: str, time_basis_sql: str, window_offset: int
) -> List[Dict[str, Any]]:
    sql = f"""
    SELECT
        [StorageID] AS device_id,
        MAX([RecordedAt]) AS last_seen,
        MAX([Status]) AS status
    FROM {weight_table_ref}
    WHERE [RecordedAt] >= DATEADD(minute, :window_offset, {time_basis_sql})
    GROUP BY [StorageID]
    ORDER BY MAX([RecordedAt]) DESC;
    """
    try:
        return conn.execute(text(sql), {"window_offset": window_offset}).mappings().all()
    except Exception:
        return []
