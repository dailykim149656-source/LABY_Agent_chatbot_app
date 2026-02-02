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
    status: Optional[str] = Query(None),  # 상태 필터링 추가
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ExperimentListResponse:
    """실험 목록 조회 - 상태별 필터링 지원"""
    response = experiments_service.list_experiments(
        request.app.state.db_engine,
        limit,
        cursor,
        status,
    )
    apply_i18n_to_items(response.items, request, i18n_service.attach_experiment_list, lang, includeI18n)
    return response


@router.get("/api/experiments/{exp_id}", response_model=ExperimentDetail)
def get_experiment(
    exp_id: str,
    request: Request,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> ExperimentDetail:
    """실험 상세 정보 조회"""
    detail = ensure_found(
        experiments_service.get_experiment_detail(request.app.state.db_engine, exp_id),
        "Experiment"
    )
    apply_i18n(detail, request, i18n_service.attach_experiment_detail, lang, includeI18n)
    return detail


@router.post("/api/experiments", response_model=ExperimentDetail)
def create_experiment(
    body: ExperimentCreateRequest,
    request: Request,
) -> ExperimentDetail:
    """
    실험 생성
    - 실험 이름, 연구원 이름 입력
    - 상태는 '진행중'으로 고정
    """
    try:
        detail = experiments_service.create_experiment(
            request.app.state.db_engine,
            body,
        )
    except Exception as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return ensure_found(detail, "Experiment")


@router.patch("/api/experiments/{exp_id}", response_model=ExperimentDetail)
def update_experiment(
    exp_id: str,
    body: ExperimentUpdateRequest,
    request: Request,
) -> ExperimentDetail:
    """실험 수정 - 실험 이름, 상태 수정"""
    detail = ensure_found(
        experiments_service.update_experiment(request.app.state.db_engine, exp_id, body),
        "Experiment"
    )
    return detail


@router.patch("/api/experiments/{exp_id}/memo")
def update_experiment_memo(
    exp_id: str,
    request: Request,
    memo: str = Query(...),
) -> ExperimentDetail:
    """메모 저장"""
    detail = ensure_found(
        experiments_service.update_experiment_memo(request.app.state.db_engine, exp_id, memo),
        "Experiment"
    )
    return detail


@router.delete("/api/experiments/{exp_id}")
def delete_experiment(
    exp_id: str,
    request: Request,
) -> dict:
    """실험 삭제"""
    result = experiments_service.delete_experiment(request.app.state.db_engine, exp_id)
    ensure_valid(result, "Experiment not found or delete failed", 404)
    return {"status": "ok"}


@router.post("/api/experiments/{exp_id}/reagents", response_model=ExperimentReagent)
def add_experiment_reagent(
    exp_id: str,
    body: ExperimentReagentCreateRequest,
    request: Request,
) -> ExperimentReagent:
    """
    시약 추가
    - used_volume은 ml 단위 고정
    - Reagents.current_volume 자동 감소
    - Reagents.open_date 자동 업데이트 (NULL인 경우)
    """
    reagent = ensure_found(
        experiments_service.add_experiment_reagent(
            request.app.state.db_engine,
            exp_id=exp_id,
            reagent_id=body.reagentId,
            used_volume=body.dosage.value,
        ),
        "Experiment or reagent"
    )
    return reagent


@router.delete("/api/experiments/{exp_id}/reagents/{usage_id}")
def remove_experiment_reagent(
    exp_id: str,
    usage_id: int,
    request: Request,
) -> dict:
    """
    시약 제거
    - Reagents.current_volume 자동 복구
    """
    result = experiments_service.remove_experiment_reagent(
        request.app.state.db_engine,
        exp_id=exp_id,
        usage_id=usage_id,
    )
    ensure_valid(result is not None, "Experiment not found", 404)
    ensure_valid(result, "Reagent link not found", 404)
    return {"status": "ok"}