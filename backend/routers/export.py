"""CSV Export Router - Download logs as CSV files."""

import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import text

router = APIRouter()

# UTF-8 BOM for Excel compatibility
UTF8_BOM = "\ufeff"


def generate_csv(rows: list, columns: list[str]) -> io.StringIO:
    """Generate CSV content from rows and column names with UTF-8 BOM."""
    output = io.StringIO()
    # Write UTF-8 BOM at the beginning for Excel compatibility
    output.write(UTF8_BOM)
    writer = csv.writer(output)
    writer.writerow(columns)
    for row in rows:
        writer.writerow([row.get(col) for col in columns])
    output.seek(0)
    return output


def get_filename(prefix: str) -> str:
    """Generate filename with timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.csv"


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


def parse_db_time(value) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("Z", "")
    if "+" in text:
        text = text.split("+", 1)[0]
    if " " in text:
        date_part, time_part = text.split(" ", 1)
        if "-" in time_part and ":" in time_part:
            time_part = time_part.split("-", 1)[0]
        text = f"{date_part} {time_part}"
    text = text.replace("T", " ")
    if "." in text:
        text = text.split(".", 1)[0]
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


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


def resolve_weight_columns(conn, object_name: str | None):
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

    return {
        "storage_id": pick(["storageid", "storage_id", "storage", "device_id", "deviceid", "id"]),
        "weight": pick(["weightvalue", "weight_value", "weight", "value"]),
        "status": pick(["status", "state"]),
        "empty_time": pick(["emptytime", "empty_time", "duration", "elapsed"]),
        "time": pick(["recordedat", "recorded_at", "timestamp", "time", "created_at", "createdat"]),
    }


@router.get("/api/export/conversations")
def export_conversations(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    """Export conversation logs as CSV."""
    engine = request.app.state.db_engine

    if limit == "all":
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
        params = {"limit": int(limit)}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    columns = ["log_id", "timestamp", "user_name", "command", "status"]
    csv_content = generate_csv(rows, columns)

    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={get_filename('conversations')}"
        },
    )


@router.get("/api/export/accidents")
def export_accidents(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    """Export accident/fall event logs as CSV."""
    engine = request.app.state.db_engine

    if limit == "all":
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
        params = {"limit": int(limit)}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    columns = [
        "EventID", "Timestamp", "CameraID", "RiskAngle", "Status",
        "EventSummary", "ExperimentID", "VerificationStatus", "VerifiedAt", "VerifySubject"
    ]
    csv_content = generate_csv(rows, columns)

    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={get_filename('accidents')}"
        },
    )


@router.get("/api/export/experiments")
def export_experiments(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    """Export experiment logs as CSV (includes reagent usage)."""
    engine = request.app.state.db_engine

    if limit == "all":
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
        params = {"limit": int(limit)}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    columns = [
        "exp_id", "exp_name", "researcher", "status", "exp_date", "memo", "created_at",
        "exp_reagent_id", "reagent_id", "reagent_name", "formula", "dosage_value", "dosage_unit"
    ]
    csv_content = generate_csv(rows, columns)

    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={get_filename('experiments')}"
        },
    )


@router.get("/api/export/environment")
def export_environment(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    """Export environment + scale logs as a unified CSV."""
    engine = request.app.state.db_engine

    if limit == "all":
        params = {}
        top_clause = ""
        limit_value = None
    else:
        limit_value = int(limit)
        params = {"limit": limit_value}
        top_clause = "TOP (:limit)"

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
                "storage_id": "StorageID",
                "weight": "WeightValue",
                "status": "Status",
                "empty_time": "EmptyTime",
                "time": "RecordedAt",
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
                "NULL AS storage_id",
                "NULL AS weight_value",
                "NULL AS status",
                "NULL AS empty_time",
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
            empty_time_col = (
                bracket(weight_cols["empty_time"]) if weight_cols.get("empty_time") else "NULL"
            )
            time_col = bracket(weight_cols["time"])
            weight_select = [
                "'scale' AS log_type",
                f"{time_col} AS recorded_at",
                "NULL AS temperature",
                "NULL AS humidity",
                f"{storage_col} AS storage_id",
                f"{weight_col} AS weight_value",
                f"{status_col} AS status",
                f"{empty_time_col} AS empty_time",
            ]
            weight_sql = f"SELECT {top_clause} {', '.join(weight_select)} FROM {weight_table_ref}"
            weight_sql = f"{weight_sql} ORDER BY {time_col} DESC"
            try:
                weight_rows = conn.execute(text(weight_sql), params).mappings().all()
            except Exception:
                weight_rows = []

    rows = [dict(row) for row in env_rows + weight_rows]
    rows.sort(key=lambda row: parse_db_time(row.get("recorded_at")) or datetime.min, reverse=True)
    if limit_value is not None:
        rows = rows[:limit_value]

    for row in rows:
        row["recorded_at"] = format_db_time(row.get("recorded_at"))

    columns = [
        "log_type",
        "recorded_at",
        "temperature",
        "humidity",
        "storage_id",
        "weight_value",
        "status",
        "empty_time",
    ]
    csv_content = generate_csv(rows, columns)

    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={get_filename('environment')}"
        },
    )
