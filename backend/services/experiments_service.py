from typing import Optional

from . import experiments_service_helpers
from ..repositories import experiments_repo
from ..schemas import (
    ExperimentListResponse,
    ExperimentSummary,
    ExperimentDetail,
    ExperimentReagent,
    Quantity,
)


def list_experiments(
    engine, 
    limit: int, 
    cursor: Optional[int],
    status_filter: Optional[str] = None
) -> ExperimentListResponse:
    """실험 목록 조회 - 상태 필터링 지원"""
    rows = experiments_repo.list_experiments(engine, limit + 1, cursor, status_filter)
    items = []

    for row in rows[:limit]:
        summary = experiments_service_helpers.row_to_summary(row)
        items.append(summary)

    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1]["exp_id"])

    return ExperimentListResponse(items=items, nextCursor=next_cursor)


def get_experiment_detail(engine, exp_id: str) -> Optional[ExperimentDetail]:
    """실험 상세 정보 조회"""
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    
    exp_row = experiments_repo.get_experiment_by_id(engine, exp_id_int)
    if not exp_row:
        return None

    reagent_rows = experiments_repo.list_experiment_reagents(engine, exp_id_int)
    reagents = []
    for row in reagent_rows:
        used_volume = row.get("used_volume")
        dosage = Quantity(value=float(used_volume or 0), unit="ml")
        reagent = ExperimentReagent(
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
        reagents.append(reagent)

    detail = experiments_service_helpers.row_to_detail(exp_row, reagents)
    return detail


def create_experiment(engine, payload) -> Optional[ExperimentDetail]:
    """
    실험 생성
    - exp_name: payload.title
    - researcher: payload.researcher
    - status: '진행중' (고정)
    - exp_date, memo: 공백
    """
    row = experiments_repo.create_experiment(
        engine,
        exp_name=payload.title,
        researcher=payload.researcher,
    )
    if not row:
        return None
    detail = experiments_service_helpers.row_to_detail(row, [])
    return detail


def update_experiment(engine, exp_id: str, payload) -> Optional[ExperimentDetail]:
    """실험 수정 - 실험 이름과 상태만 수정"""
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    
    row = experiments_repo.update_experiment(
        engine,
        exp_id=exp_id_int,
        exp_name=payload.title,
        status=payload.status,
    )
    if not row:
        return None
    
    reagent_rows = experiments_repo.list_experiment_reagents(engine, exp_id_int)
    reagents = []
    for r in reagent_rows:
        used_volume = r.get("used_volume")
        dosage = Quantity(value=float(used_volume or 0), unit="ml")
        reagent = ExperimentReagent(
            id=str(r.get("usage_id")),
            reagentId=str(r.get("reagent_id")),
            name=r.get("reagent_name") or "",
            formula=r.get("formula"),
            dosage=dosage,
            density=r.get("density"),
            mass=r.get("mass"),
            purity=r.get("purity"),
            location=r.get("location"),
        )
        reagents.append(reagent)
    
    detail = experiments_service_helpers.row_to_detail(row, reagents)
    return detail


def update_experiment_memo(engine, exp_id: str, memo: str) -> Optional[ExperimentDetail]:
    """메모 저장"""
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    
    row = experiments_repo.update_experiment_memo(engine, exp_id_int, memo)
    if not row:
        return None
    
    reagent_rows = experiments_repo.list_experiment_reagents(engine, exp_id_int)
    reagents = []
    for r in reagent_rows:
        used_volume = r.get("used_volume")
        dosage = Quantity(value=float(used_volume or 0), unit="ml")
        reagent = ExperimentReagent(
            id=str(r.get("usage_id")),
            reagentId=str(r.get("reagent_id")),
            name=r.get("reagent_name") or "",
            formula=r.get("formula"),
            dosage=dosage,
            density=r.get("density"),
            mass=r.get("mass"),
            purity=r.get("purity"),
            location=r.get("location"),
        )
        reagents.append(reagent)
    
    detail = experiments_service_helpers.row_to_detail(row, reagents)
    return detail


def delete_experiment(engine, exp_id: str) -> bool:
    """실험 삭제"""
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return False
    
    return experiments_repo.delete_experiment(engine, exp_id_int)


def add_experiment_reagent(
    engine,
    exp_id: str,
    reagent_id: str,
    used_volume: float,
) -> Optional[ExperimentReagent]:
    """
    시약 추가
    - ExperimentReagentUsage에 기록
    - Reagents.current_volume 감소
    - Reagents.open_date 업데이트 (NULL인 경우)
    """
    try:
        exp_id_int = int(exp_id)
        reagent_id_int = int(reagent_id)
    except ValueError:
        return None

    row = experiments_repo.insert_experiment_reagent(
        engine,
        exp_id=exp_id_int,
        reagent_id=reagent_id_int,
        used_volume=used_volume,
    )
    if not row:
        return None

    used_vol = row.get("used_volume")
    dosage = Quantity(value=float(used_vol or 0), unit="ml")
    reagent = ExperimentReagent(
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
    return reagent


def remove_experiment_reagent(engine, exp_id: str, usage_id: int) -> Optional[bool]:
    """
    시약 제거
    - ExperimentReagentUsage에서 삭제
    - Reagents.current_volume 복구
    """
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    
    success, _, _ = experiments_repo.delete_experiment_reagent(engine, exp_id_int, usage_id)
    return success