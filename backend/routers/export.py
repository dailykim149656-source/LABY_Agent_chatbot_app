"""CSV Export Router - Download logs as CSV files."""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse

from ..services import export_service
from ..utils.dependencies import require_admin

router = APIRouter()


def _parse_limit(limit: str) -> Optional[int]:
    """Parse limit string: 'all' returns None, otherwise returns int."""
    return None if limit == "all" else int(limit)


def _csv_response(csv_content, filename: str) -> StreamingResponse:
    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/api/export/conversations")
def export_conversations(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    csv_content, filename = export_service.export_conversations(
        request.app.state.db_engine, _parse_limit(limit)
    )
    return _csv_response(csv_content, filename)


@router.get("/api/export/auth-logs", dependencies=[Depends(require_admin)])
def export_auth_logs(
    request: Request,
    limit: str = Query("all", description="1000 or all"),
) -> StreamingResponse:
    csv_content, filename = export_service.export_auth_logs(
        request.app.state.db_engine, _parse_limit(limit)
    )
    return _csv_response(csv_content, filename)


@router.get("/api/export/accidents")
def export_accidents(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    csv_content, filename = export_service.export_accidents(
        request.app.state.db_engine, _parse_limit(limit)
    )
    return _csv_response(csv_content, filename)


@router.get("/api/export/experiments")
def export_experiments(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    csv_content, filename = export_service.export_experiments(
        request.app.state.db_engine, _parse_limit(limit)
    )
    return _csv_response(csv_content, filename)


@router.get("/api/export/environment")
def export_environment(
    request: Request,
    limit: str = Query("1000", description="1000 or all"),
) -> StreamingResponse:
    csv_content, filename = export_service.export_environment(
        request.app.state.db_engine, _parse_limit(limit)
    )
    return _csv_response(csv_content, filename)
