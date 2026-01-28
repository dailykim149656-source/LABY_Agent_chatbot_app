from datetime import date
from typing import List, Optional

from ..schemas import ExperimentSummary, ExperimentDetail, ExperimentReagent


def row_to_summary(row) -> ExperimentSummary:
    exp_date = row.get("exp_date")
    created_at = row.get("created_at")
    if exp_date is None and created_at is not None:
        exp_date = created_at.date() if hasattr(created_at, "date") else None

    status = row.get("status") or "pending"
    return ExperimentSummary(
        id=str(row.get("exp_name")),
        title=row.get("exp_name") or "",
        date=exp_date,
        status=status,
        researcher=row.get("researcher"),
    )


def row_to_detail(row, reagents: List[ExperimentReagent]) -> ExperimentDetail:
    exp_date = row.get("exp_date")
    created_at = row.get("created_at")
    if exp_date is None and created_at is not None:
        exp_date = created_at.date() if hasattr(created_at, "date") else None

    status = row.get("status") or "pending"
    return ExperimentDetail(
        id=str(row.get("exp_name")),
        title=row.get("exp_name") or "",
        date=exp_date,
        status=status,
        researcher=row.get("researcher"),
        memo=row.get("memo"),
        reagents=reagents,
    )
