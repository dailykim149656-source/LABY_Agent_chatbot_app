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
from ..utils.translation import resolve_target_lang, should_translate

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
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_experiment_list(response.items, service, target_lang)
    return response


@router.get("/api/experiments/{exp_name}", response_model=ExperimentDetail)
def get_experiment(
    exp_name: str,
    request: Request,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ExperimentDetail:
    detail = experiments_service.get_experiment_detail(
        request.app.state.db_engine,
        exp_name,
    )
    if not detail:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_experiment_detail(detail, service, target_lang)
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

    if not detail:
        raise HTTPException(status_code=500, detail="Failed to create experiment")
    return detail


@router.patch("/api/experiments/{exp_name}", response_model=ExperimentDetail)
def update_experiment(
    exp_name: str,
    body: ExperimentUpdateRequest,
    request: Request,
) -> ExperimentDetail:
    detail = experiments_service.update_experiment(
        request.app.state.db_engine,
        exp_name,
        body,
    )
    if not detail:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return detail


@router.post("/api/experiments/{exp_name}/reagents", response_model=ExperimentReagent)
def add_experiment_reagent(
    exp_name: str,
    body: ExperimentReagentCreateRequest,
    request: Request,
) -> ExperimentReagent:
    reagent = experiments_service.add_experiment_reagent(
        request.app.state.db_engine,
        exp_name=exp_name,
        reagent_id=body.reagentId,
        dosage_value=body.dosage.value,
        dosage_unit=body.dosage.unit,
    )
    if not reagent:
        raise HTTPException(status_code=404, detail="Experiment or reagent not found")
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
    if result is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    if not result:
        raise HTTPException(status_code=404, detail="Reagent link not found")
    return {"status": "ok"}
