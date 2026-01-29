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


def list_experiments(engine, limit: int, cursor: Optional[int]) -> ExperimentListResponse:
    rows = experiments_repo.list_experiments(engine, limit + 1, cursor)
    items = []

    for row in rows[:limit]:
        summary = experiments_service_helpers.row_to_summary(row)
        items.append(summary)

    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1]["exp_id"])

    return ExperimentListResponse(items=items, nextCursor=next_cursor)


def get_experiment_detail(engine, exp_name: str) -> Optional[ExperimentDetail]:
    exp_row = experiments_repo.get_experiment_by_name(engine, exp_name)
    if not exp_row:
        return None

    exp_id = exp_row.get("exp_id")
    reagent_rows = experiments_repo.list_experiment_reagents(engine, exp_id)
    reagents = []
    for row in reagent_rows:
        dosage_value = row.get("dosage_value")
        dosage = Quantity(value=float(dosage_value or 0), unit=row.get("dosage_unit") or "")
        reagent = ExperimentReagent(
            id=str(row.get("exp_reagent_id")),
            reagentId=str(row.get("reagent_id")),
            name=row.get("name") or "",
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
    row = experiments_repo.create_experiment(
        engine,
        exp_name=payload.title,
        researcher=payload.researcher,
        status=payload.status,
        exp_date=payload.date,
        memo=payload.memo,
    )
    if not row:
        return None
    detail = experiments_service_helpers.row_to_detail(row, [])
    return detail


def update_experiment(engine, exp_name: str, payload) -> Optional[ExperimentDetail]:
    row = experiments_repo.update_experiment(
        engine,
        current_name=exp_name,
        new_name=payload.title,
        researcher=payload.researcher,
        status=payload.status,
        exp_date=payload.date,
        memo=payload.memo,
    )
    if not row:
        return None
    exp_id = row.get("exp_id")
    reagent_rows = experiments_repo.list_experiment_reagents(engine, exp_id)
    reagents = []
    for r in reagent_rows:
        dosage_value = r.get("dosage_value")
        dosage = Quantity(value=float(dosage_value or 0), unit=r.get("dosage_unit") or "")
        reagent = ExperimentReagent(
            id=str(r.get("exp_reagent_id")),
            reagentId=str(r.get("reagent_id")),
            name=r.get("name") or "",
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


def add_experiment_reagent(
    engine,
    exp_name: str,
    reagent_id: str,
    dosage_value: float,
    dosage_unit: str,
) -> Optional[ExperimentReagent]:
    exp_id = experiments_repo.get_experiment_id_by_name(engine, exp_name)
    if exp_id is None:
        return None

    row = experiments_repo.insert_experiment_reagent(
        engine,
        exp_id=exp_id,
        reagent_id=reagent_id,
        dosage_value=dosage_value,
        dosage_unit=dosage_unit,
    )
    if not row:
        return None

    dosage_value = row.get("dosage_value")
    dosage = Quantity(value=float(dosage_value or 0), unit=row.get("dosage_unit") or "")
    reagent = ExperimentReagent(
        id=str(row.get("exp_reagent_id")),
        reagentId=str(row.get("reagent_id")),
        name=row.get("name") or "",
        formula=row.get("formula"),
        dosage=dosage,
        density=row.get("density"),
        mass=row.get("mass"),
        purity=row.get("purity"),
        location=row.get("location"),
    )
    return reagent


def remove_experiment_reagent(engine, exp_name: str, exp_reagent_id: int) -> Optional[bool]:
    exp_id = experiments_repo.get_experiment_id_by_name(engine, exp_name)
    if exp_id is None:
        return None
    return experiments_repo.delete_experiment_reagent(engine, exp_id, exp_reagent_id)


# Helpers are separated to avoid circular imports in type checking
