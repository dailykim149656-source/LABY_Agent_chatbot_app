import math
from typing import List

from fastapi import APIRouter, Query, Request
from sqlalchemy import text

from ..schemas import (
    SafetyStatusResponse,
    SafetyEnvironmentItem,
    SafetyAlert,
    SafetyConnections,
    SafetyDeviceConnection,
)

router = APIRouter()


def risk_to_alert_type(risk_angle) -> str:
    if risk_angle is None:
        return "info"
    if risk_angle >= 85:
        return "critical"
    if risk_angle >= 75:
        return "warning"
    return "info"


@router.get("/api/safety/status", response_model=SafetyStatusResponse)
def safety_status(
    request: Request,
    limit: int = Query(3, ge=1, le=3),
    page: int = Query(1, ge=1),
) -> SafetyStatusResponse:
    engine = request.app.state.db_engine
    limit = min(limit, 3)
    connection_window_minutes = 5
    window_offset = -connection_window_minutes
    force_db_time = True
    time_basis = "local" if force_db_time else "unknown"
    server_time_utc = None
    server_time_local = None

    def bracket(name: str) -> str:
        return f"[{name.replace(']', ']]')}]"

    def format_db_time(value) -> str | None:
        if value is None:
            return None
        if hasattr(value, "strftime"):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        text = str(value).strip()
        if not text:
            return None
        if "T" in text:
            date_part, time_part = text.split("T", 1)
        elif " " in text:
            date_part, time_part = text.split(" ", 1)
        else:
            return text
        time_part = time_part.replace("Z", "")
        if "+" in time_part:
            time_part = time_part.split("+", 1)[0]
        if "-" in time_part:
            time_part = time_part.split("-", 1)[0]
        time_part = time_part.split(".", 1)[0]
        if len(time_part) > 8:
            time_part = time_part[:8]
        return f"{date_part} {time_part}"

    def resolve_table(conn, table_name: str):
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

    def resolve_env_columns(conn, object_name: str | None):
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
        lower_map = {name.lower(): name for name in col_names}

        def pick(candidates):
            for cand in candidates:
                if cand in lower_map:
                    return lower_map[cand]
            return None

        time_col = lower_map.get("log_time")
        if not time_col:
            time_col = pick(
                [
                    "recorded_at",
                    "timestamp",
                    "time",
                    "created_at",
                    "createdat",
                    "logged_at",
                    "datetime",
                    "ts",
                ]
            )

        return {
            "temp": pick(["temperature", "temp", "temp_c", "temp_celsius", "temperature_c"]),
            "humidity": pick(["humidity", "humid", "hum", "humidity_pct", "humidity_percent", "rh"]),
            "time": time_col,
        }

    sql_template = """
    SELECT
        [EventID],
        [Timestamp],
        [CameraID],
        [RiskAngle],
        [Status],
        [EventSummary],
        [ExperimentID],
        [VerificationStatus]
    FROM {fall_table_ref}
    ORDER BY [Timestamp] DESC
    OFFSET :offset ROWS
    FETCH NEXT :limit ROWS ONLY;
    """

    time_basis_sql = "GETUTCDATE()"
    camera_sql_template = """
    SELECT
        [CameraID] AS device_id,
        MAX([Timestamp]) AS last_seen
    FROM {fall_table_ref}
    WHERE [Timestamp] >= DATEADD(minute, :window_offset, {time_basis_sql})
    GROUP BY [CameraID]
    ORDER BY MAX([Timestamp]) DESC;
    """

    scale_sql_template = """
    SELECT
        [StorageID] AS device_id,
        MAX([RecordedAt]) AS last_seen,
        MAX([Status]) AS status
    FROM {weight_table_ref}
    WHERE [RecordedAt] >= DATEADD(minute, :window_offset, {time_basis_sql})
    GROUP BY [StorageID]
    ORDER BY MAX([RecordedAt]) DESC;
    """

    with engine.connect() as conn:
        try:
            time_row = (
                conn.execute(
                    text("SELECT GETUTCDATE() AS utc_now, GETDATE() AS local_now;")
                )
                .mappings()
                .first()
            )
            if time_row:
                server_time_utc = time_row.get("utc_now")
                server_time_local = time_row.get("local_now")
        except Exception:
            server_time_utc = None
            server_time_local = None

        def infer_basis(last_seen):
            if last_seen is None or server_time_utc is None or server_time_local is None:
                return None
            delta_utc = abs((server_time_utc - last_seen).total_seconds())
            delta_local = abs((server_time_local - last_seen).total_seconds())
            return "utc" if delta_utc <= delta_local else "local"

        env_table = resolve_table(conn, "humid_temp_log")
        fall_table = resolve_table(conn, "FallEvents")
        weight_table = resolve_table(conn, "WeightLog")

        env_table_ref = env_table.get("table_ref") if env_table else "[dbo].[humid_temp_log]"
        fall_table_ref = fall_table.get("table_ref") if fall_table else "[dbo].[FallEvents]"
        weight_table_ref = weight_table.get("table_ref") if weight_table else "[dbo].[WeightLog]"

        env_cols = resolve_env_columns(conn, env_table.get("object_name") if env_table else None)
        if not env_cols:
            env_cols = {"temp": "temperature", "humidity": "humidity", "time": "log_time"}

        env_max = None
        if not force_db_time:
            try:
                fall_max = conn.execute(text(f"SELECT MAX([Timestamp]) FROM {fall_table_ref};")).scalar()
            except Exception:
                fall_max = None

            try:
                weight_max = conn.execute(text(f"SELECT MAX([RecordedAt]) FROM {weight_table_ref};")).scalar()
            except Exception:
                weight_max = None

            if env_cols and env_cols.get("time"):
                try:
                    env_max = conn.execute(
                        text(
                            f"SELECT MAX({bracket(env_cols['time'])}) FROM {env_table_ref};"
                        )
                    ).scalar()
                except Exception:
                    env_max = None

            basis_candidates = [infer_basis(fall_max), infer_basis(weight_max), infer_basis(env_max)]
            basis_candidates = [basis for basis in basis_candidates if basis]
            if basis_candidates:
                time_basis = (
                    "utc"
                    if basis_candidates.count("utc") >= basis_candidates.count("local")
                    else "local"
                )

        time_basis_sql = "GETDATE()" if time_basis == "local" else "GETUTCDATE()"
        sql = sql_template.format(fall_table_ref=fall_table_ref)
        camera_query = camera_sql_template.format(
            fall_table_ref=fall_table_ref, time_basis_sql=time_basis_sql
        )
        scale_query = scale_sql_template.format(
            weight_table_ref=weight_table_ref, time_basis_sql=time_basis_sql
        )

        env_row = None
        if env_cols and env_cols.get("temp") and env_cols.get("humidity"):
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
                env_row = (
                    conn.execute(text(env_query), {"window_offset": window_offset})
                    .mappings()
                    .first()
                )
            except Exception:
                env_row = None

        total_count = conn.execute(text(f"SELECT COUNT(*) FROM {fall_table_ref};")).scalar()
        total = int(total_count or 0)
        total_pages = math.ceil(total / limit) if total > 0 else 0
        safe_page = min(page, total_pages) if total_pages > 0 else 1
        offset = (safe_page - 1) * limit
        rows = conn.execute(text(sql), {"limit": limit, "offset": offset}).mappings().all()

        try:
            camera_rows = (
                conn.execute(
                    text(camera_query),
                    {"window_offset": window_offset},
                )
                .mappings()
                .all()
            )
        except Exception:
            camera_rows = []

        try:
            scale_rows = (
                conn.execute(
                    text(scale_query),
                    {"window_offset": window_offset},
                )
                .mappings()
                .all()
            )
        except Exception:
            scale_rows = []

    env_last_seen = env_row.get("recorded_at") if env_row else None
    env_recorded_at = format_db_time(env_last_seen)
    if time_basis == "local":
        env_now = server_time_local
    else:
        env_now = server_time_utc
    if env_row and env_row.get("is_recent") is not None:
        env_recent = bool(env_row.get("is_recent"))
    elif env_now and env_last_seen:
        env_age_seconds = abs((env_now - env_last_seen).total_seconds())
        env_recent = env_age_seconds <= (connection_window_minutes * 60)
    else:
        env_recent = False

    env_temp = env_row.get("temp") if env_row else None
    env_humidity = env_row.get("humidity") if env_row else None
    env_temp_value = "-" if env_temp is None else f"{env_temp}°C"
    env_humidity_value = "-" if env_humidity is None else f"{env_humidity}%"
    env_status = "normal" if env_recent else "warning"

    alerts: List[SafetyAlert] = []
    for row in rows:
        alerts.append(
            SafetyAlert(
                id=str(row.get("EventID")),
                type=risk_to_alert_type(row.get("RiskAngle")),
                message=row.get("EventSummary") or "Recent event",
                location=row.get("CameraID") or "camera",
                time=str(row.get("Timestamp")),
                status=row.get("Status"),
                verificationStatus=row.get("VerificationStatus"),
                experimentId=str(row.get("ExperimentID")) if row.get("ExperimentID") is not None else None,
            )
        )

    environmental = [
        SafetyEnvironmentItem(
            key="temperature",
            label="temperature",
            value=env_temp_value,
            status=env_status,
            recordedAt=env_recorded_at,
        ),
        SafetyEnvironmentItem(
            key="humidity",
            label="humidity",
            value=env_humidity_value,
            status=env_status,
            recordedAt=env_recorded_at,
        ),
    ]

    cameras = [
        SafetyDeviceConnection(
            id=str(row.get("device_id")),
            label=str(row.get("device_id")),
            lastSeen=str(row.get("last_seen")) if row.get("last_seen") is not None else None,
        )
        for row in camera_rows
        if row.get("device_id") is not None
    ]

    scales = [
        SafetyDeviceConnection(
            id=str(row.get("device_id")),
            label=str(row.get("device_id")),
            lastSeen=str(row.get("last_seen")) if row.get("last_seen") is not None else None,
            status=str(row.get("status")) if row.get("status") is not None else None,
        )
        for row in scale_rows
        if row.get("device_id") is not None
    ]

    return SafetyStatusResponse(
        environmental=environmental,
        alerts=alerts,
        connections=SafetyConnections(cameras=cameras, scales=scales),
        systemStatus="normal",
        timeBasis=time_basis,
        serverTimeUtc=format_db_time(server_time_utc),
        serverTimeLocal=format_db_time(server_time_local),
        totalCount=total,
        page=safe_page,
        pageSize=limit,
        totalPages=total_pages,
    )
