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
