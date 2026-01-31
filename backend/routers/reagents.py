from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from ..schemas import (
    ReagentListResponse, ReagentItem, ReagentCreateRequest,
    ReagentDisposalCreateRequest, ReagentDisposalResponse, ReagentDisposalListResponse,
    StorageEnvironmentResponse
)
from ..services import reagents_service, i18n_service
from ..utils.translation import resolve_target_lang, should_translate

router = APIRouter()


@router.get("/api/reagents", response_model=ReagentListResponse)
def list_reagents(
    request: Request,
    limit: int = Query(100),
    cursor: Optional[str] = Query(None),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
):
    response = reagents_service.list_reagents(request.app.state.db_engine, limit, cursor)
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_reagent_list(response.items, service, target_lang)
    return response

@router.get("/api/reagents/storage-environment", response_model=StorageEnvironmentResponse)
def storage_environment(request: Request):
    return reagents_service.list_storage_environment(request.app.state.db_engine)

@router.get("/api/reagents/disposals", response_model=ReagentDisposalListResponse)
def list_disposals(
    request: Request,
    limit: int = Query(100),
    cursor: Optional[int] = Query(None),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
):
    response = reagents_service.list_disposals(request.app.state.db_engine, limit, cursor)
    if includeI18n:
        target_lang = resolve_target_lang(lang, request.headers.get("accept-language"))
        service = getattr(request.app.state, "translation_service", None)
        if service and service.enabled and should_translate(target_lang):
            i18n_service.attach_reagent_disposals(response.items, service, target_lang)
    return response

# 시약 정보 수정 엔드포인트 (PATCH 메서드 확인!)
@router.patch("/api/reagents/{reagent_id}", response_model=ReagentItem)
def update_reagent(reagent_id: str, body: dict, request: Request):
    item = reagents_service.update_reagent(request.app.state.db_engine, reagent_id, body)
    if not item:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return item

@router.post("/api/reagents", response_model=ReagentItem)
def create_reagent(body: ReagentCreateRequest, request: Request):
    item = reagents_service.create_reagent(request.app.state.db_engine, body)
    return item

@router.post("/api/reagents/{reagent_id}/dispose", response_model=ReagentDisposalResponse)
def dispose_reagent(reagent_id: str, body: ReagentDisposalCreateRequest, request: Request):
    return reagents_service.dispose_reagent(request.app.state.db_engine, reagent_id, body.reason, body.disposedBy)

@router.post("/api/reagents/{reagent_id}/restore", response_model=ReagentItem)
def restore_reagent(reagent_id: str, request: Request):
    return reagents_service.restore_reagent(request.app.state.db_engine, reagent_id)

@router.delete("/api/reagents/disposals")
def clear_all_disposals(request: Request):
    count = reagents_service.clear_all_disposals(request.app.state.db_engine)
    return {"success": True, "deleted_count": count}

@router.delete("/api/reagents/{reagent_id}")
def delete_reagent_permanently(reagent_id: str, request: Request):
    reagents_service.delete_reagent_permanently(request.app.state.db_engine, reagent_id)
    return {"success": True}
