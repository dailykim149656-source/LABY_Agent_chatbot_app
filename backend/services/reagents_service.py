import uuid
from datetime import date
from typing import Optional

from ..repositories import reagents_repo
from ..schemas import (
    Quantity,
    ReagentItem,
    ReagentListResponse,
    ReagentDisposalResponse,
    ReagentDisposalListResponse,
    StorageEnvironmentResponse,
    StorageEnvironmentItem,
)


def _make_quantity(value, unit) -> Optional[Quantity]:
    if value is None or unit is None:
        return None
    return Quantity(value=float(value), unit=str(unit))


def _row_to_reagent_item(row) -> ReagentItem:
    return ReagentItem(
        id=str(row.get("reagent_id")),
        name=row.get("name") or "",
        formula=row.get("formula"),
        purchaseDate=row.get("purchase_date"),
        openDate=row.get("open_date"),
        currentVolume=_make_quantity(row.get("current_volume_value"), row.get("current_volume_unit")),
        originalVolume=_make_quantity(row.get("original_volume_value"), row.get("original_volume_unit")),
        density=row.get("density"),
        mass=row.get("mass"),
        purity=row.get("purity"),
        location=row.get("location"),
        status=row.get("status") or "normal",
    )


def list_reagents(engine, limit: int, cursor: Optional[str]) -> ReagentListResponse:
    rows = reagents_repo.list_reagents(engine, limit + 1, cursor)
    items = [_row_to_reagent_item(row) for row in rows[:limit]]

    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1]["reagent_id"])

    return ReagentListResponse(items=items, nextCursor=next_cursor)


def get_reagent(engine, reagent_id: str) -> Optional[ReagentItem]:
    row = reagents_repo.get_reagent(engine, reagent_id)
    if not row:
        return None
    return _row_to_reagent_item(row)


def create_reagent(engine, payload) -> Optional[ReagentItem]:
    reagent_id = payload.id or f"RG-{uuid.uuid4().hex[:8].upper()}"

    original = payload.originalVolume
    current = payload.currentVolume or original

    row = reagents_repo.create_reagent(
        engine,
        {
            "reagent_id": reagent_id,
            "name": payload.name,
            "formula": payload.formula,
            "purchase_date": payload.purchaseDate,
            "open_date": payload.openDate,
            "current_volume_value": current.value if current else None,
            "current_volume_unit": current.unit if current else None,
            "original_volume_value": original.value if original else None,
            "original_volume_unit": original.unit if original else None,
            "density": payload.density,
            "mass": payload.mass,
            "purity": payload.purity,
            "location": payload.location,
            "status": payload.status or "normal",
        },
    )
    if not row:
        return None
    return _row_to_reagent_item(row)


def update_reagent(engine, reagent_id: str, payload) -> Optional[ReagentItem]:
    updates = {}

    if payload.name is not None:
        updates["name"] = payload.name
    if payload.formula is not None:
        updates["formula"] = payload.formula
    if payload.purchaseDate is not None:
        updates["purchase_date"] = payload.purchaseDate
    if payload.openDate is not None:
        updates["open_date"] = payload.openDate
    if payload.currentVolume is not None:
        updates["current_volume_value"] = payload.currentVolume.value
        updates["current_volume_unit"] = payload.currentVolume.unit
    if payload.originalVolume is not None:
        updates["original_volume_value"] = payload.originalVolume.value
        updates["original_volume_unit"] = payload.originalVolume.unit
    if payload.density is not None:
        updates["density"] = payload.density
    if payload.mass is not None:
        updates["mass"] = payload.mass
    if payload.purity is not None:
        updates["purity"] = payload.purity
    if payload.location is not None:
        updates["location"] = payload.location
    if payload.status is not None:
        updates["status"] = payload.status

    row = reagents_repo.update_reagent(engine, reagent_id, updates)
    if not row:
        return None
    return _row_to_reagent_item(row)


def dispose_reagent(engine, reagent_id: str, reason: str, disposed_by: str) -> Optional[ReagentDisposalResponse]:
    today = date.today()
    row = reagents_repo.dispose_reagent(engine, reagent_id, reason, disposed_by, today)
    if not row:
        return None

    return ReagentDisposalResponse(
        id=str(row.get("reagent_id")),
        name=row.get("name") or "",
        formula=row.get("formula"),
        disposalDate=today,
        reason=reason,
        disposedBy=disposed_by,
    )


def list_disposals(engine, limit: int, cursor: Optional[int]) -> ReagentDisposalListResponse:
    rows = reagents_repo.list_disposals(engine, limit + 1, cursor)
    items = []
    for row in rows[:limit]:
        items.append(
            ReagentDisposalResponse(
                id=str(row.get("reagent_id")),
                name=row.get("name") or "",
                formula=row.get("formula"),
                disposalDate=row.get("disposal_date"),
                reason=row.get("reason") or "",
                disposedBy=row.get("disposed_by") or "",
            )
        )

    next_cursor = None
    if len(rows) > limit:
        next_cursor = str(rows[limit - 1]["disposal_id"])

    return ReagentDisposalListResponse(items=items, nextCursor=next_cursor)


def list_storage_environment(engine) -> StorageEnvironmentResponse:
    rows = reagents_repo.list_storage_environment(engine)
    items = [
        StorageEnvironmentItem(
            location=row.get("location") or "",
            temp=float(row.get("temp")) if row.get("temp") is not None else 0.0,
            humidity=float(row.get("humidity")) if row.get("humidity") is not None else 0.0,
            status=row.get("status") or "normal",
        )
        for row in rows
    ]
    return StorageEnvironmentResponse(items=items)
