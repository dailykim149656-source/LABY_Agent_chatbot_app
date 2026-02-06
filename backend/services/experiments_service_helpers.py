from datetime import date
from typing import List, Optional

from ..schemas import ExperimentSummary, ExperimentDetail, ExperimentReagent

# DB 한글 상태값 → API 영문 코드값 매핑 (하위 호환)
_STATUS_KO_TO_CODE = {
    "진행중": "in_progress",
    "대기": "pending",
    "완료": "completed",
}


def _normalize_status(raw: Optional[str]) -> str:
    """DB 상태값을 API 코드값으로 변환. 이미 영문이면 그대로 반환."""
    if not raw:
        return "in_progress"
    return _STATUS_KO_TO_CODE.get(raw, raw)


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