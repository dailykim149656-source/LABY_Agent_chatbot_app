"""Repository for CSV export data access."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text

from ..utils.db_helpers import bracket, resolve_table, resolve_env_columns, resolve_weight_columns


def list_fall_events(engine, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if limit is None:
        sql = """
        SELECT EventID, Timestamp, CameraID, RiskAngle, Status,
               EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
        FROM FallEvents
        ORDER BY Timestamp DESC;
        """
        params = {}
    else:
        sql = """
        SELECT TOP (:limit) EventID, Timestamp, CameraID, RiskAngle, Status,
               EventSummary, ExperimentID, VerificationStatus, VerifiedAt, VerifySubject
        FROM FallEvents
        ORDER BY Timestamp DESC;
        """
        params = {"limit": limit}
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def list_chat_logs(engine, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if limit is None:
        sql = """
        SELECT log_id, timestamp, user_name, command, status
        FROM ChatLogs
        ORDER BY timestamp DESC;
        """
        params = {}
    else:
        sql = """
        SELECT TOP (:limit) log_id, timestamp, user_name, command, status
        FROM ChatLogs
        ORDER BY timestamp DESC;
        """
        params = {"limit": limit}
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def list_auth_logs(engine, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if limit is None:
        sql = """
        SELECT log_id, user_id, email, event_type, success, ip_address, user_agent, logged_at
        FROM AuthLogs
        ORDER BY logged_at DESC, log_id DESC;
        """
        params = {}
    else:
        sql = """
        SELECT TOP (:limit) log_id, user_id, email, event_type, success, ip_address, user_agent, logged_at
        FROM AuthLogs
        ORDER BY logged_at DESC, log_id DESC;
        """
        params = {"limit": limit}
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def list_experiments_with_reagents(engine, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if limit is None:
        sql = """
        SELECT
            e.exp_id, e.exp_name, e.researcher, e.status, e.exp_date, e.memo, e.created_at,
            er.exp_reagent_id, er.reagent_id, er.dosage_value, er.dosage_unit,
            r.name AS reagent_name, r.formula
        FROM Experiments e
        LEFT JOIN ExperimentReagents er ON e.exp_id = er.exp_id
        LEFT JOIN Reagents r ON er.reagent_id = r.reagent_id
        ORDER BY e.created_at DESC, er.exp_reagent_id;
        """
        params = {}
    else:
        sql = """
        SELECT
            e.exp_id, e.exp_name, e.researcher, e.status, e.exp_date, e.memo, e.created_at,
            er.exp_reagent_id, er.reagent_id, er.dosage_value, er.dosage_unit,
            r.name AS reagent_name, r.formula
        FROM (
            SELECT TOP (:limit) * FROM Experiments ORDER BY created_at DESC
        ) e
        LEFT JOIN ExperimentReagents er ON e.exp_id = er.exp_id
        LEFT JOIN Reagents r ON er.reagent_id = r.reagent_id
        ORDER BY e.created_at DESC, er.exp_reagent_id;
        """
        params = {"limit": limit}
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def list_environment_logs(engine, limit: Optional[int] = None) -> tuple:
    """Return (env_rows, weight_rows) for environment export."""
    params = {"limit": limit} if limit else {}
    top_clause = "TOP (:limit)" if limit else ""

    with engine.connect() as conn:
        env_table = resolve_table(conn, "humid_temp_log")
        weight_table = resolve_table(conn, "WeightLog")

        env_table_ref = env_table.get("table_ref") if env_table else "[dbo].[humid_temp_log]"
        weight_table_ref = weight_table.get("table_ref") if weight_table else "[dbo].[WeightLog]"

        env_cols = resolve_env_columns(conn, env_table.get("object_name") if env_table else None)
        if not env_cols:
            env_cols = {"temp": "temperature", "humidity": "humidity", "time": "log_time"}

        weight_cols = resolve_weight_columns(conn, weight_table.get("object_name") if weight_table else None)
        if not weight_cols:
            weight_cols = {
                "storage_id": "StorageID", "weight": "WeightValue",
                "status": "Status", "empty_time": "EmptyTime", "time": "RecordedAt",
            }

        env_rows = []
        if env_cols.get("temp") and env_cols.get("humidity"):
            temp_col = bracket(env_cols["temp"])
            humidity_col = bracket(env_cols["humidity"])
            time_col = bracket(env_cols["time"]) if env_cols.get("time") else None
            env_select = [
                "'environment' AS log_type",
                f"{time_col} AS recorded_at" if time_col else "NULL AS recorded_at",
                f"{temp_col} AS temperature",
                f"{humidity_col} AS humidity",
                "NULL AS storage_id", "NULL AS weight_value", "NULL AS status", "NULL AS empty_time",
            ]
            env_sql = f"SELECT {top_clause} {', '.join(env_select)} FROM {env_table_ref}"
            if time_col:
                env_sql = f"{env_sql} ORDER BY {time_col} DESC"
            try:
                env_rows = conn.execute(text(env_sql), params).mappings().all()
            except Exception:
                env_rows = []

        weight_rows = []
        if weight_cols.get("storage_id") and weight_cols.get("weight") and weight_cols.get("time"):
            storage_col = bracket(weight_cols["storage_id"])
            weight_col = bracket(weight_cols["weight"])
            status_col = bracket(weight_cols["status"]) if weight_cols.get("status") else "NULL"
            empty_time_col = bracket(weight_cols["empty_time"]) if weight_cols.get("empty_time") else "NULL"
            time_col = bracket(weight_cols["time"])
            weight_select = [
                "'scale' AS log_type",
                f"{time_col} AS recorded_at",
                "NULL AS temperature", "NULL AS humidity",
                f"{storage_col} AS storage_id",
                f"{weight_col} AS weight_value",
                f"{status_col} AS status",
                f"{empty_time_col} AS empty_time",
            ]
            weight_sql = f"SELECT {top_clause} {', '.join(weight_select)} FROM {weight_table_ref} ORDER BY {time_col} DESC"
            try:
                weight_rows = conn.execute(text(weight_sql), params).mappings().all()
            except Exception:
                weight_rows = []

    return env_rows, weight_rows
