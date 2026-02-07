from fastapi import APIRouter, Query, Request

from ..schemas import SafetyStatusResponse
from ..services import safety_service

router = APIRouter()


@router.get("/api/safety/status", response_model=SafetyStatusResponse)
def safety_status(
    request: Request,
    limit: int = Query(3, ge=1, le=3),
    page: int = Query(1, ge=1),
) -> SafetyStatusResponse:
    return safety_service.get_safety_status(request.app.state.db_engine, limit, page)
