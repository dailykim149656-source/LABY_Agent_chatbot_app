"""Service layer for safety status business logic."""

import math
from typing import List, Optional

from ..repositories import safety_repo
from ..schemas import (
    SafetyStatusResponse,
    SafetyEnvironmentItem,
    SafetyAlert,
    SafetyConnections,
    SafetyDeviceConnection,
)
from ..utils.db_helpers import format_db_time, resolve_table, resolve_env_columns

CONNECTION_WINDOW_MINUTES = 5


def _risk_to_alert_type(risk_angle) -> str:
    if risk_angle is None:
        return "info"
    if risk_angle >= 85:
        return "critical"
    if risk_angle >= 75:
        return "warning"
    return "info"


def get_safety_status(engine, limit: int, page: int) -> SafetyStatusResponse:
    limit = min(limit, 3)
    window_offset = -CONNECTION_WINDOW_MINUTES
    time_basis = "local"
    time_basis_sql = "GETDATE()"

    with engine.connect() as conn:
        server_times = safety_repo.get_server_times(conn)
        server_time_utc = server_times["utc"]
        server_time_local = server_times["local"]

        env_table = resolve_table(conn, "humid_temp_log")
        fall_table = resolve_table(conn, "FallEvents")
        weight_table = resolve_table(conn, "WeightLog")

        env_table_ref = env_table.get("table_ref") if env_table else "[dbo].[humid_temp_log]"
        fall_table_ref = fall_table.get("table_ref") if fall_table else "[dbo].[FallEvents]"
        weight_table_ref = weight_table.get("table_ref") if weight_table else "[dbo].[WeightLog]"

        env_cols = resolve_env_columns(conn, env_table.get("object_name") if env_table else None)
        if not env_cols:
            env_cols = {"temp": "temperature", "humidity": "humidity", "time": "log_time"}

        env_row = safety_repo.get_env_latest(conn, env_table_ref, env_cols, time_basis_sql, window_offset)

        total = safety_repo.count_fall_events(conn, fall_table_ref)
        total_pages = math.ceil(total / limit) if total > 0 else 0
        safe_page = min(page, total_pages) if total_pages > 0 else 1
        offset = (safe_page - 1) * limit
        rows = safety_repo.get_fall_events_page(conn, fall_table_ref, limit, offset)

        camera_rows = safety_repo.get_connected_cameras(conn, fall_table_ref, time_basis_sql, window_offset)
        scale_rows = safety_repo.get_connected_scales(conn, weight_table_ref, time_basis_sql, window_offset)

    # Build environment items
    env_last_seen = env_row.get("recorded_at") if env_row else None
    env_recorded_at = format_db_time(env_last_seen)
    env_now = server_time_local if time_basis == "local" else server_time_utc

    if env_row and env_row.get("is_recent") is not None:
        env_recent = bool(env_row.get("is_recent"))
    elif env_now and env_last_seen:
        env_age_seconds = abs((env_now - env_last_seen).total_seconds())
        env_recent = env_age_seconds <= (CONNECTION_WINDOW_MINUTES * 60)
    else:
        env_recent = False

    env_temp = env_row.get("temp") if env_row else None
    env_humidity = env_row.get("humidity") if env_row else None
    env_status = "normal" if env_recent else "warning"

    environmental = [
        SafetyEnvironmentItem(
            key="temperature",
            label="temperature",
            value="-" if env_temp is None else f"{env_temp}°C",
            status=env_status,
            recordedAt=env_recorded_at,
        ),
        SafetyEnvironmentItem(
            key="humidity",
            label="humidity",
            value="-" if env_humidity is None else f"{env_humidity}%",
            status=env_status,
            recordedAt=env_recorded_at,
        ),
    ]

    # Build alerts
    alerts: List[SafetyAlert] = []
    for row in rows:
        alerts.append(
            SafetyAlert(
                id=str(row.get("EventID")),
                type=_risk_to_alert_type(row.get("RiskAngle")),
                message=row.get("EventSummary") or "Recent event",
                location=row.get("CameraID") or "camera",
                time=str(row.get("Timestamp")),
                status=row.get("Status"),
                verificationStatus=row.get("VerificationStatus"),
                experimentId=str(row.get("ExperimentID")) if row.get("ExperimentID") is not None else None,
            )
        )

    # Build connections
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
