from datetime import date
from typing import Optional, List, Dict, Any
from ..repositories import reagents_repo
from ..schemas import (
    Quantity, ReagentItem, ReagentListResponse, ReagentCreateRequest,
    ReagentDisposalResponse, ReagentDisposalListResponse,
    StorageEnvironmentResponse, StorageEnvironmentItem,
    REAGENT_STATUS_NORMAL, REAGENT_DEFAULT_PURITY,
)



def _make_quantity(value, unit="ml") -> Optional[Quantity]:
    if value is None: return None
    return Quantity(value=float(value), unit=str(unit))

def _row_to_reagent_item(row) -> ReagentItem:
    """DB 데이터를 스키마에 맞춰 변환. purity는 반드시 '숫자'여야 에러가 안 납니다."""
    purity_value = row.get("purity")
    # 문자열로 들어온 경우 '%' 제거 후 변환
    if isinstance(purity_value, str):
        purity_value = float(purity_value.replace('%', '').strip())
    else:
        purity_value = float(purity_value or 0)
    
    return ReagentItem(
        id=str(row.get("reagent_id")),
        name=row.get("reagent_name") or "",
        formula=row.get("formula"),
        purchaseDate=row.get("purchase_date"),
        openDate=row.get("open_date"),
        currentVolume=_make_quantity(row.get("current_volume")),
        originalVolume=_make_quantity(row.get("total_capacity")),
        density=float(row.get("density") or 0),
        mass=float(row.get("mass") or 0),
        purity=purity_value,
        location=row.get("location") or "미지정",
        status=row.get("status") or REAGENT_STATUS_NORMAL,
    )

def list_reagents(engine, limit: int, cursor: Optional[str]) -> ReagentListResponse:
    rows = reagents_repo.list_reagents(engine, limit + 1, cursor)
    items = [_row_to_reagent_item(row) for row in rows[:limit]]
    next_cursor = str(rows[-1]["reagent_id"]) if len(rows) > limit else None
    return ReagentListResponse(items=items, nextCursor=next_cursor)

def get_reagent(engine, reagent_id: str) -> Optional[ReagentItem]:
    row = reagents_repo.get_reagent(engine, reagent_id)
    return _row_to_reagent_item(row) if row else None

def create_reagent(engine, payload: ReagentCreateRequest) -> Optional[ReagentItem]:
    """API → DB 컬럼 매핑 (camelCase → snake_case)"""
    current_vol = payload.currentVolume or payload.originalVolume
    row = reagents_repo.create_reagent(engine, {
        "reagent_name": payload.name,
        "formula": payload.formula,
        "purchase_date": payload.purchaseDate,
        "open_date": None,
        "current_volume": current_vol.value if current_vol else None,
        "total_capacity": payload.originalVolume.value,
        "density": payload.density,
        "mass": payload.mass,
        "purity": payload.purity if payload.purity is not None else REAGENT_DEFAULT_PURITY,
        "location": payload.location,
    })
    return _row_to_reagent_item(row) if row else None

def update_reagent(engine, reagent_id: str, payload: Dict[str, Any]) -> Optional[ReagentItem]:
    update_data = {
        "reagent_name": payload.get("reagent_name") or payload.get("name"),
        "formula": payload.get("formula"),
        "current_volume": payload.get("current_volume") or payload.get("capacity"),
        "location": payload.get("location"),
        "density": payload.get("density"),
        "mass": payload.get("mass"),
        "purchase_date": payload.get("purchase_date")
    }
    row = reagents_repo.update_reagent(engine, reagent_id, update_data)
    return _row_to_reagent_item(row) if row else None

def dispose_reagent(engine, reagent_id: str, reason: str, disposed_by: str) -> Optional[ReagentDisposalResponse]:
    today = date.today()
    row = reagents_repo.dispose_reagent(engine, reagent_id, reason, disposed_by, today)
    if not row: return None
    return ReagentDisposalResponse(
        id=str(row.get("reagent_id")), name=row.get("reagent_name") or "",
        formula=row.get("formula"), disposalDate=today, reason=reason, disposedBy=disposed_by,
        currentVolume=_make_quantity(row.get("current_volume"))
    )

def restore_reagent(engine, reagent_id: str) -> Optional[ReagentItem]:
    row = reagents_repo.restore_reagent(engine, reagent_id)
    return _row_to_reagent_item(row) if row else None

def delete_reagent_permanently(engine, reagent_id: str) -> bool:
    return reagents_repo.delete_reagent_permanently(engine, reagent_id)

def clear_all_disposals(engine) -> int:
    return reagents_repo.clear_all_disposals(engine)

def list_disposals(engine, limit: int, cursor: Optional[int]) -> ReagentDisposalListResponse:
    rows = reagents_repo.list_disposals(engine, limit + 1, cursor)
    items = [ReagentDisposalResponse(
        id=str(row.get("reagent_id")), name=row.get("reagent_name") or "",
        formula=row.get("formula"), disposalDate=row.get("disposal_date"),
        reason=row.get("reason") or "", disposedBy=row.get("disposed_by") or "",
        currentVolume=_make_quantity(row.get("current_volume"))
    ) for row in rows[:limit]]
    next_cursor = str(rows[-1]["disposal_id"]) if len(rows) > limit else None
    return ReagentDisposalListResponse(items=items, nextCursor=next_cursor)

def list_storage_environment(engine) -> StorageEnvironmentResponse:
    rows = reagents_repo.list_storage_environment(engine)
    items = [StorageEnvironmentItem(
        location=row.get("location") or "", 
        temp=float(row.get("temp") or 0), 
        humidity=float(row.get("humidity") or 0), 
        status=row.get("status") or REAGENT_STATUS_NORMAL
    ) for row in rows]
    return StorageEnvironmentResponse(items=items)
