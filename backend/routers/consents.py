import csv
import io
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse

from ..schemas import SignupConsent, UserConsentListResponse, UserConsentResponse
from ..services import consents_service
from ..utils.dependencies import csrf_protect, require_admin

router = APIRouter(dependencies=[Depends(require_admin), Depends(csrf_protect)])

UTF8_BOM = "\ufeff"


def generate_csv(rows: list, columns: list[str]) -> io.StringIO:
    output = io.StringIO()
    output.write(UTF8_BOM)
    writer = csv.writer(output)
    writer.writerow(columns)
    for row in rows:
        writer.writerow([row.get(col) for col in columns])
    output.seek(0)
    return output


def build_consent_response(item: Dict[str, Any]) -> UserConsentResponse:
    payload = {
        "version": item.get("consent_version") or "unknown",
        "required": False,
        "phone": False,
        "iotEnvironment": False,
        "iotReagent": False,
        "voice": False,
        "video": False,
        "marketing": False,
    }
    payload.update(item.get("consent_payload") or {})
    return UserConsentResponse(
        id=int(item["consent_id"]),
        userId=int(item["user_id"]),
        email=item.get("email"),
        consentVersion=item["consent_version"],
        consentPayload=SignupConsent(**payload),
        consentSource=item.get("consent_source"),
        ipAddress=item.get("ip_address"),
        userAgent=item.get("user_agent"),
        createdAt=item["created_at"],
    )


@router.get("/api/consents", response_model=UserConsentListResponse)
def list_consents(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None),
) -> UserConsentListResponse:
    items, total, next_cursor = consents_service.list_consents(
        request.app.state.db_engine,
        limit,
        cursor,
    )
    return UserConsentListResponse(
        items=[build_consent_response(item) for item in items],
        total=total,
        nextCursor=next_cursor,
    )


@router.get("/api/consents/export")
def export_consents(
    request: Request,
    limit: int = Query(1000, ge=1, le=10000),
) -> StreamingResponse:
    items, _total, _next_cursor = consents_service.list_consents(
        request.app.state.db_engine,
        limit,
        None,
    )

    rows = []
    for item in items:
        payload = item.get("consent_payload") or {}
        rows.append(
            {
                "consent_id": item.get("consent_id"),
                "user_id": item.get("user_id"),
                "email": item.get("email"),
                "consent_version": item.get("consent_version"),
                "required": payload.get("required"),
                "phone": payload.get("phone"),
                "iotEnvironment": payload.get("iotEnvironment"),
                "iotReagent": payload.get("iotReagent"),
                "voice": payload.get("voice"),
                "video": payload.get("video"),
                "marketing": payload.get("marketing"),
                "consent_source": item.get("consent_source"),
                "ip_address": item.get("ip_address"),
                "user_agent": item.get("user_agent"),
                "created_at": item.get("created_at"),
            }
        )

    columns = [
        "consent_id",
        "user_id",
        "email",
        "consent_version",
        "required",
        "phone",
        "iotEnvironment",
        "iotReagent",
        "voice",
        "video",
        "marketing",
        "consent_source",
        "ip_address",
        "user_agent",
        "created_at",
    ]
    csv_content = generate_csv(rows, columns)

    return StreamingResponse(
        iter([csv_content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=consents.csv"
        },
    )
