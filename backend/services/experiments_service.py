from typing import List, Optional

from . import experiments_service_helpers as helpers
from ..repositories import experiments_repo
from ..schemas import (
    ExperimentListResponse,
    ExperimentDetail,
    ExperimentReagent,
)


def _build_reagents(engine, exp_id_int: int) -> List[ExperimentReagent]:
    """Fetch and convert reagent rows for an experiment."""
    rows = experiments_repo.list_experiment_reagents(engine, exp_id_int)
    return [helpers.row_to_reagent(r) for r in rows]


def _build_detail(engine, row, exp_id_int: int) -> Optional[ExperimentDetail]:
    """Build ExperimentDetail from a DB row, fetching reagents."""
    if not row:
        return None
    reagents = _build_reagents(engine, exp_id_int)
    return helpers.row_to_detail(row, reagents)


def list_experiments(
    engine,
    limit: int,
    cursor: Optional[int],
    status_filter: Optional[str] = None,
) -> ExperimentListResponse:
    rows = experiments_repo.list_experiments(engine, limit + 1, cursor, status_filter)
    items = [helpers.row_to_summary(row) for row in rows[:limit]]
    next_cursor = str(rows[limit - 1]["exp_id"]) if len(rows) > limit else None
    return ExperimentListResponse(items=items, nextCursor=next_cursor)


def get_experiment_detail(engine, exp_id: str) -> Optional[ExperimentDetail]:
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    row = experiments_repo.get_experiment_by_id(engine, exp_id_int)
    return _build_detail(engine, row, exp_id_int)


def create_experiment(engine, payload) -> Optional[ExperimentDetail]:
    row = experiments_repo.create_experiment(
        engine, exp_name=payload.title, researcher=payload.researcher,
    )
    if not row:
        return None
    return helpers.row_to_detail(row, [])


def update_experiment(engine, exp_id: str, payload) -> Optional[ExperimentDetail]:
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    row = experiments_repo.update_experiment(
        engine, exp_id=exp_id_int, exp_name=payload.title, status=payload.status,
    )
    return _build_detail(engine, row, exp_id_int)


def update_experiment_memo(engine, exp_id: str, memo: str) -> Optional[ExperimentDetail]:
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    row = experiments_repo.update_experiment_memo(engine, exp_id_int, memo)
    return _build_detail(engine, row, exp_id_int)


def delete_experiment(engine, exp_id: str) -> bool:
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return False
    return experiments_repo.delete_experiment(engine, exp_id_int)


def add_experiment_reagent(
    engine, exp_id: str, reagent_id: str, used_volume: float,
) -> Optional[ExperimentReagent]:
    try:
        exp_id_int = int(exp_id)
        reagent_id_int = int(reagent_id)
    except ValueError:
        return None
    row = experiments_repo.insert_experiment_reagent(
        engine, exp_id=exp_id_int, reagent_id=reagent_id_int, used_volume=used_volume,
    )
    if not row:
        return None
    return helpers.row_to_reagent(row)


def remove_experiment_reagent(engine, exp_id: str, usage_id: int) -> Optional[bool]:
    try:
        exp_id_int = int(exp_id)
    except ValueError:
        return None
    success, _, _ = experiments_repo.delete_experiment_reagent(engine, exp_id_int, usage_id)
    return success
