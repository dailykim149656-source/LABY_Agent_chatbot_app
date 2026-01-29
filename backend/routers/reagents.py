from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from ..schemas import (
    ReagentListResponse,
    ReagentItem,
    ReagentCreateRequest,
    ReagentUpdateRequest,
    ReagentDisposalCreateRequest,
    ReagentDisposalResponse,
    ReagentDisposalListResponse,
    StorageEnvironmentResponse,
)
from ..services import reagents_service

router = APIRouter()


@router.get("/api/reagents", response_model=ReagentListResponse)
def list_reagents(request: Request, limit: int = Query(100), cursor: Optional[str] = Query(None)):
    return reagents_service.list_reagents(request.app.state.db_engine, limit, cursor)

@router.get("/api/reagents/storage-environment", response_model=StorageEnvironmentResponse)
def storage_environment(request: Request):
    return reagents_service.list_storage_environment(request.app.state.db_engine)

@router.get("/api/reagents/disposals", response_model=ReagentDisposalListResponse)
def list_disposals(request: Request, limit: int = Query(100), cursor: Optional[int] = Query(None)):
    return reagents_service.list_disposals(request.app.state.db_engine, limit, cursor)

@router.get("/api/reagents/{reagent_id}", response_model=ReagentItem)
def get_reagent(reagent_id: str, request: Request):
    item = reagents_service.get_reagent(request.app.state.db_engine, reagent_id)
    if not item:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return item

@router.post("/api/reagents", response_model=ReagentItem)
def create_reagent(body: ReagentCreateRequest, request: Request):
    try:
        item = reagents_service.create_reagent(request.app.state.db_engine, body)
    except Exception as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    if not item:
        raise HTTPException(status_code=500, detail="Failed to create reagent")
    return item

@router.patch("/api/reagents/{reagent_id}", response_model=ReagentItem)
def update_reagent(reagent_id: str, body: ReagentUpdateRequest, request: Request):
    item = reagents_service.update_reagent(request.app.state.db_engine, reagent_id, body)
    if not item:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return item

@router.post("/api/reagents/{reagent_id}/dispose", response_model=ReagentDisposalResponse)
def dispose_reagent(reagent_id: str, body: ReagentDisposalCreateRequest, request: Request):
    disposal = reagents_service.dispose_reagent(request.app.state.db_engine, reagent_id, body.reason, body.disposedBy)
    if not disposal:
        raise HTTPException(status_code=404, detail="Reagent not found")
    return disposal
