from datetime import date
from typing import List, Optional

from ..schemas import ExperimentSummary, ExperimentDetail, ExperimentReagent


def row_to_summary(row) -> ExperimentSummary:
    exp_date = row.get("exp_date")
    created_at = row.get("created_at")
    
    # datetime.date를 문자열로 변환
    if exp_date is None and created_at is not None:
        if hasattr(created_at, "date"):
            exp_date = created_at.date()
    
    # date 객체를 문자열로 변환 (ISO format)
    if exp_date and hasattr(exp_date, 'isoformat'):
        exp_date = exp_date.isoformat()
    
    # exp_id를 id로 사용 (exp_name이 아니라)
    exp_id = row.get("exp_id")
    exp_name = row.get("exp_name") or ""
    status = row.get("status") or "진행중"
    
    return ExperimentSummary(
        id=str(exp_id),  # exp_id를 id로 사용
        title=exp_name,
        date=exp_date,
        status=status,
        researcher=row.get("researcher"),
    )


def row_to_detail(row, reagents: List[ExperimentReagent]) -> ExperimentDetail:
    exp_date = row.get("exp_date")
    created_at = row.get("created_at")
    
    # datetime.date를 문자열로 변환
    if exp_date is None and created_at is not None:
        if hasattr(created_at, "date"):
            exp_date = created_at.date()
    
    # date 객체를 문자열로 변환 (ISO format)
    if exp_date and hasattr(exp_date, 'isoformat'):
        exp_date = exp_date.isoformat()
    
    # exp_id를 id로 사용 (exp_name이 아니라)
    exp_id = row.get("exp_id")
    exp_name = row.get("exp_name") or ""
    status = row.get("status") or "진행중"
    
    return ExperimentDetail(
        id=str(exp_id),  # exp_id를 id로 사용
        title=exp_name,
        date=exp_date,
        status=status,
        researcher=row.get("researcher"),
        memo=row.get("memo"),
        reagents=reagents,
    )