from datetime import date
from typing import List, Optional

from ..schemas import ExperimentSummary, ExperimentDetail, ExperimentReagent, Quantity
from ..utils.constants import STATUS_KO_TO_CODE, DEFAULT_EXPERIMENT_STATUS


def _normalize_status(raw: Optional[str]) -> str:
    """DB 상태값을 API 코드값으로 변환. 이미 영문이면 그대로 반환."""
    if not raw:
        return DEFAULT_EXPERIMENT_STATUS
    return STATUS_KO_TO_CODE.get(raw, raw)


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
    status = _normalize_status(row.get("status"))
    
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
    status = _normalize_status(row.get("status"))

    return ExperimentDetail(
        id=str(exp_id),  # exp_id를 id로 사용
        title=exp_name,
        date=exp_date,
        status=status,
        researcher=row.get("researcher"),
        memo=row.get("memo"),
        reagents=reagents,
    )


def row_to_reagent(row) -> ExperimentReagent:
    """Convert a DB usage row to ExperimentReagent schema."""
    used_volume = row.get("used_volume")
    dosage = Quantity(value=float(used_volume or 0), unit="ml")
    return ExperimentReagent(
        id=str(row.get("usage_id")),
        reagentId=str(row.get("reagent_id")),
        name=row.get("reagent_name") or "",
        formula=row.get("formula"),
        dosage=dosage,
        density=row.get("density"),
        mass=row.get("mass"),
        purity=row.get("purity"),
        location=row.get("location"),
    )