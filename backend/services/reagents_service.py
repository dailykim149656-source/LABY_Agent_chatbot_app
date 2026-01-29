import uuid
from datetime import date
from typing import Optional
from ..repositories import reagents_repo
from ..schemas import (
    Quantity,
    ReagentItem,
    ReagentListResponse,
    ReagentCreateRequest,
    ReagentDisposalResponse,
    ReagentDisposalListResponse,
    StorageEnvironmentResponse,
    StorageEnvironmentItem,
)

def _make_quantity(value, unit="ml") -> Optional[Quantity]:
    if value is None:
        return None
    return Quantity(value=float(value), unit=str(unit))

def _row_to_reagent_item(row) -> ReagentItem:
    return ReagentItem(
        id=str(row.get("reagent_id")),
        name=row.get("reagent_name") or "",
        formula=row.get("formula"),
        purchaseDate=row.get("purchase_date"),
        openDate=row.get("open_date"),
        currentVolume=_make_quantity(row.get("current_volume")),
        originalVolume=_make_quantity(row.get("total_capacity")),
        density=row.get("density"),
        mass=row.get("mass"),
        purity=row.get("purity"),
        location=row.get("location"),
        status="normal",
    )

def list_reagents(engine, limit: int, cursor: Optional[str]) -> ReagentListResponse:
    rows = reagents_repo.list_reagents(engine, limit + 1, cursor)
    items = [_row_to_reagent_item(row) for row in rows[:limit]]
    next_cursor = str(rows[limit - 1]["reagent_id"]) if len(rows) > limit else None
    return ReagentListResponse(items=items, nextCursor=next_cursor)

def get_reagent(engine, reagent_id: str) -> Optional[ReagentItem]:
    row = reagents_repo.get_reagent(engine, reagent_id)
    if not row:
        return None
    return _row_to_reagent_item(row)

def create_reagent(engine, payload: ReagentCreateRequest) -> Optional[ReagentItem]:
    row = reagents_repo.create_reagent(
        engine,
        {
            "reagent_name": payload.reagent_name,
            "formula": payload.formula,
            "purchase_date": payload.purchase_date,
            "open_date": None,
            "current_volume": payload.current_volume,
            "total_capacity": payload.total_capacity,
            "density": payload.density,
            "mass": payload.mass,
            "purity": payload.purity,
            "location": payload.location
        },
    )
    if not row:
        return None
    return _row_to_reagent_item(row)

def update_reagent(engine, reagent_id: str, payload) -> Optional[ReagentItem]:
    updates = {}
    if payload.name is not None: updates["reagent_name"] = payload.name
    if payload.formula is not None: updates["formula"] = payload.formula
    if payload.currentVolume is not None: updates["current_volume"] = payload.currentVolume.value
    row = reagents_repo.update_reagent(engine, reagent_id, updates)
    if not row: return None
    return _row_to_reagent_item(row)

def dispose_reagent(engine, reagent_id: str, reason: str, disposed_by: str) -> Optional[ReagentDisposalResponse]:
    today = date.today()
    row = reagents_repo.dispose_reagent(engine, reagent_id, reason, disposed_by, today)
    if not row: return None
    return ReagentDisposalResponse(
        id=str(row.get("reagent_id")),
        name=row.get("reagent_name") or "",
        formula=row.get("formula"),
        disposalDate=today,
        reason=reason,
        disposedBy=disposed_by,
    )

def list_disposals(engine, limit: int, cursor: Optional[int]) -> ReagentDisposalListResponse:
    rows = reagents_repo.list_disposals(engine, limit + 1, cursor)
    items = [
        ReagentDisposalResponse(
            id=str(row.get("reagent_id")),
            name=row.get("reagent_name") or "",
            formula=row.get("formula"),
            disposalDate=row.get("disposal_date"),
            reason=row.get("reason") or "",
            disposedBy=row.get("disposed_by") or "",
        ) for row in rows[:limit]
    ]
    next_cursor = str(rows[limit - 1]["disposal_id"]) if len(rows) > limit else None
    return ReagentDisposalListResponse(items=items, nextCursor=next_cursor)

def list_storage_environment(engine) -> StorageEnvironmentResponse:
    rows = reagents_repo.list_storage_environment(engine)
    items = [
        StorageEnvironmentItem(
            location=row.get("location") or "",
            temp=float(row.get("temp")) if row.get("temp") is not None else 0.0,
            humidity=float(row.get("humidity")) if row.get("humidity") is not None else 0.0,
            status=row.get("status") or "normal",
        ) for row in rows
    ]
    return StorageEnvironmentResponse(items=items)