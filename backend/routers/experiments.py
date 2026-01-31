from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from ..schemas import (
    ExperimentListResponse,
    ExperimentDetail,
    ExperimentCreateRequest,
    ExperimentUpdateRequest,
    ExperimentReagentCreateRequest,
    ExperimentReagent,
)
from ..services import experiments_service, i18n_service
from ..utils.i18n_handler import apply_i18n, apply_i18n_to_items
from ..utils.exceptions import ensure_found, ensure_valid

router = APIRouter()


@router.get("/api/experiments", response_model=ExperimentListResponse)
def list_experiments(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ExperimentListResponse:
    response = experiments_service.list_experiments(
        request.app.state.db_engine,
        limit,
        cursor,
    )
    apply_i18n_to_items(response.items, request, i18n_service.attach_experiment_list, lang, includeI18n)
    return response


@router.get("/api/experiments/{exp_name}", response_model=ExperimentDetail)
def get_experiment(
    exp_name: str,
    request: Request,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ExperimentDetail:
    detail = ensure_found(
        experiments_service.get_experiment_detail(request.app.state.db_engine, exp_name),
        "Experiment"
    )
    apply_i18n(detail, request, i18n_service.attach_experiment_detail, lang, includeI18n)
    return detail


@router.post("/api/experiments", response_model=ExperimentDetail)
def create_experiment(
    body: ExperimentCreateRequest,
    request: Request,
) -> ExperimentDetail:
    try:
        detail = experiments_service.create_experiment(
            request.app.state.db_engine,
            body,
        )
    except Exception as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return ensure_found(detail, "Experiment")


@router.patch("/api/experiments/{exp_name}", response_model=ExperimentDetail)
def update_experiment(
    exp_name: str,
    body: ExperimentUpdateRequest,
    request: Request,
) -> ExperimentDetail:
    detail = ensure_found(
        experiments_service.update_experiment(request.app.state.db_engine, exp_name, body),
        "Experiment"
    )
    return detail


@router.post("/api/experiments/{exp_name}/reagents", response_model=ExperimentReagent)
def add_experiment_reagent(
    exp_name: str,
    body: ExperimentReagentCreateRequest,
    request: Request,
) -> ExperimentReagent:
    reagent = ensure_found(
        experiments_service.add_experiment_reagent(
            request.app.state.db_engine,
            exp_name=exp_name,
            reagent_id=body.reagentId,
            dosage_value=body.dosage.value,
            dosage_unit=body.dosage.unit,
        ),
        "Experiment or reagent"
    )
    return reagent


@router.delete("/api/experiments/{exp_name}/reagents/{exp_reagent_id}")
def remove_experiment_reagent(
    exp_name: str,
    exp_reagent_id: int,
    request: Request,
) -> dict:
    result = experiments_service.remove_experiment_reagent(
        request.app.state.db_engine,
        exp_name=exp_name,
        exp_reagent_id=exp_reagent_id,
    )
    ensure_valid(result is not None, "Experiment not found", 404)
    ensure_valid(result, "Reagent link not found", 404)
    return {"status": "ok"}
