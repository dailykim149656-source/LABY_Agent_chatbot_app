"""Service layer for CSV export logic."""

import io
from datetime import datetime
from typing import Optional

from ..repositories import export_repo
from ..utils.csv_helpers import generate_csv, get_csv_filename
from ..utils.db_helpers import format_db_time, parse_db_time


def export_conversations(engine, limit: Optional[int]) -> tuple[io.StringIO, str]:
    rows = export_repo.list_chat_logs(engine, limit)
    columns = ["log_id", "timestamp", "user_name", "command", "status"]
    return generate_csv(rows, columns), get_csv_filename("conversations")


def export_auth_logs(engine, limit: Optional[int]) -> tuple[io.StringIO, str]:
    rows = export_repo.list_auth_logs(engine, limit)
    columns = ["log_id", "user_id", "email", "event_type", "success", "ip_address", "user_agent", "logged_at"]
    return generate_csv(rows, columns), get_csv_filename("auth_logs")


def export_accidents(engine, limit: Optional[int]) -> tuple[io.StringIO, str]:
    rows = export_repo.list_fall_events(engine, limit)
    columns = [
        "EventID", "Timestamp", "CameraID", "RiskAngle", "Status",
        "EventSummary", "ExperimentID", "VerificationStatus", "VerifiedAt", "VerifySubject",
    ]
    return generate_csv(rows, columns), get_csv_filename("accidents")


def export_experiments(engine, limit: Optional[int]) -> tuple[io.StringIO, str]:
    rows = export_repo.list_experiments_with_reagents(engine, limit)
    columns = [
        "exp_id", "exp_name", "researcher", "status", "exp_date", "memo", "created_at",
        "exp_reagent_id", "reagent_id", "reagent_name", "formula", "dosage_value", "dosage_unit",
    ]
    return generate_csv(rows, columns), get_csv_filename("experiments")


def export_environment(engine, limit: Optional[int]) -> tuple[io.StringIO, str]:
    env_rows, weight_rows = export_repo.list_environment_logs(engine, limit)
    rows = [dict(row) for row in list(env_rows) + list(weight_rows)]
    rows.sort(key=lambda r: parse_db_time(r.get("recorded_at")) or datetime.min, reverse=True)
    if limit is not None:
        rows = rows[:limit]
    for row in rows:
        row["recorded_at"] = format_db_time(row.get("recorded_at"))
    columns = ["log_type", "recorded_at", "temperature", "humidity", "storage_id", "weight_value", "status", "empty_time"]
    return generate_csv(rows, columns), get_csv_filename("environment")
