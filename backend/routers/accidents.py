from typing import List, Optional

from fastapi import APIRouter, Query, Request

from ..schemas import AccidentResponse, AccidentUpdateRequest
from ..services import accidents_service, i18n_service
from ..utils.i18n_handler import apply_i18n_to_items
from ..utils.exceptions import ensure_found, ensure_valid

router = APIRouter()


@router.get("/api/accidents", response_model=List[AccidentResponse])
def list_accidents(
    request: Request,
    status: Optional[str] = Query(None, description="active|acknowledged|resolved"),
    from_ts: Optional[str] = Query(None, description="ISO timestamp"),
    to_ts: Optional[str] = Query(None, description="ISO timestamp"),
    limit: int = Query(100, ge=1, le=500),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> List[AccidentResponse]:
    results = accidents_service.list_accidents(
        request.app.state.db_engine, limit, status, from_ts, to_ts
    )
    apply_i18n_to_items(results, request, i18n_service.attach_accidents, lang, includeI18n)
    return results


@router.patch("/api/accidents/{event_id}", response_model=AccidentResponse)
def update_accident(
    event_id: int,
    body: AccidentUpdateRequest,
    request: Request,
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
) -> AccidentResponse:
    ensure_valid(body.verification_status in (0, 1, 2), "Invalid verification_status")
    response = ensure_found(
        accidents_service.update_accident(
            request.app.state.db_engine,
            event_id,
            body.verification_status,
            body.verify_subject,
        ),
        "Event",
    )
    apply_i18n_to_items([response], request, i18n_service.attach_accidents, lang, includeI18n)
    return response
