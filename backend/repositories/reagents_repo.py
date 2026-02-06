from typing import Optional, List, Dict, Any
from sqlalchemy import text
from ..schemas import REAGENT_STATUS_NORMAL, REAGENT_STATUS_DISPOSED, REAGENT_DEFAULT_PURITY

def list_reagents(engine, limit: int, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT reagent_id, reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass, recorded_at, status
    FROM Reagents
    WHERE (status != :excluded_status OR status IS NULL)
    """
    params: Dict[str, Any] = {"excluded_status": REAGENT_STATUS_DISPOSED}
    
    if cursor is not None:
        # 커서 페이징: 최신순 정렬이므로 커서(이전 페이지의 마지막 ID)보다 작은 ID를 찾음
        sql += " AND reagent_id < :cursor"
        params["cursor"] = cursor
        
    # [핵심 수정] reagent_id DESC (내림차순) 정렬 -> 최신 시약이 맨 위에 뜸
    sql += " ORDER BY reagent_id DESC OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY"
    params["limit"] = limit
    
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()

def get_reagent(engine, reagent_id: Any) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT
        reagent_id, reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass, recorded_at, status
    FROM Reagents
    WHERE reagent_id = :reagent_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"reagent_id": reagent_id}).mappings().first()

def create_reagent(engine, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # 순도는 입력값이 없으면 100으로 고정하여 저장
    sql = """
    INSERT INTO Reagents (
        reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass, recorded_at, status
    ) 
    OUTPUT INSERTED.reagent_id
    VALUES (
        :reagent_name, :formula, :purchase_date, :open_date,
        :current_volume, :total_capacity, :purity, :location, :density, :mass, GETUTCDATE(), :status
    );
    """
    with engine.begin() as conn:
        result = conn.execute(text(sql), {
            **payload,
            "purity": payload.get("purity") or REAGENT_DEFAULT_PURITY,
            "status": REAGENT_STATUS_NORMAL,
        })
        new_id = result.scalar()
    return get_reagent(engine, new_id)

def update_reagent(engine, reagent_id: Any, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """시약 정보를 수정합니다 (연필 아이콘 기능용)"""
    sql = """
    UPDATE Reagents 
    SET 
        reagent_name = :reagent_name,
        formula = :formula,
        current_volume = :current_volume,
        location = :location,
        density = :density,
        mass = :mass,
        purchase_date = :purchase_date
    WHERE reagent_id = :reagent_id;
    """
    with engine.begin() as conn:
        conn.execute(text(sql), {**payload, "reagent_id": reagent_id})
    return get_reagent(engine, reagent_id)

def dispose_reagent(engine, reagent_id: Any, reason: str, disposed_by: str, disposal_date) -> Optional[Dict[str, Any]]:
    insert_sql = """
    INSERT INTO ReagentDisposals (reagent_id, disposal_date, reason, disposed_by)
    VALUES (:reagent_id, :disposal_date, :reason, :disposed_by);
    """
    update_sql = "UPDATE Reagents SET status = :status WHERE reagent_id = :reagent_id;"
    with engine.begin() as conn:
        conn.execute(text(insert_sql), {
            "reagent_id": reagent_id, "disposal_date": disposal_date,
            "reason": reason, "disposed_by": disposed_by
        })
        conn.execute(text(update_sql), {"reagent_id": reagent_id, "status": REAGENT_STATUS_DISPOSED})
    return get_reagent(engine, reagent_id)

def list_disposals(engine, limit: int, cursor: Optional[int] = None) -> List[Dict[str, Any]]:
    # 폐기 목록: 최신순 정렬 (disposal_id DESC)
    sql = """
    SELECT d.disposal_id, d.reagent_id, d.disposal_date, d.reason, d.disposed_by,
        r.reagent_name, r.formula, r.current_volume
    FROM ReagentDisposals d
    JOIN Reagents r ON d.reagent_id = r.reagent_id
    ORDER BY d.disposal_id DESC
    OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"limit": limit}).mappings().all()

def list_storage_environment(engine, limit: int = 100) -> List[Dict[str, Any]]:
    # 온습도 목록: 최신순 정렬 (recorded_at DESC)
    sql = """
    SELECT location, temp, humidity, status 
    FROM StorageEnvironment 
    ORDER BY recorded_at DESC
    OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"limit": limit}).mappings().all()

# --- 복원 및 영구 삭제 기능 ---

def restore_reagent(engine, reagent_id: Any) -> Optional[Dict[str, Any]]:
    """폐기 기록 삭제 및 시약 상태 'normal'로 원복"""
    delete_disposal_sql = "DELETE FROM ReagentDisposals WHERE reagent_id = :reagent_id;"
    update_reagent_sql = "UPDATE Reagents SET status = :status WHERE reagent_id = :reagent_id;"
    
    with engine.begin() as conn:
        conn.execute(text(delete_disposal_sql), {"reagent_id": reagent_id})
        conn.execute(text(update_reagent_sql), {"reagent_id": reagent_id, "status": REAGENT_STATUS_NORMAL})
    return get_reagent(engine, reagent_id)

def delete_reagent_permanently(engine, reagent_id: Any) -> bool:
    """단일 시약 영구 삭제 (자식 테이블 데이터 먼저 삭제)"""
    delete_disposal_sql = "DELETE FROM ReagentDisposals WHERE reagent_id = :reagent_id;"
    delete_reagent_sql = "DELETE FROM Reagents WHERE reagent_id = :reagent_id AND status = :status;"
    
    with engine.begin() as conn:
        conn.execute(text(delete_disposal_sql), {"reagent_id": reagent_id})
        result = conn.execute(text(delete_reagent_sql), {"reagent_id": reagent_id, "status": REAGENT_STATUS_DISPOSED})
        return result.rowcount > 0

def clear_all_disposals(engine) -> int:
    """모든 폐기 항목 일괄 영구 삭제"""
    delete_disposals_sql = """
    DELETE FROM ReagentDisposals
    WHERE reagent_id IN (SELECT reagent_id FROM Reagents WHERE status = :status);
    """
    delete_reagents_sql = "DELETE FROM Reagents WHERE status = :status;"
    
    with engine.begin() as conn:
        conn.execute(text(delete_disposals_sql), {"status": REAGENT_STATUS_DISPOSED})
        result = conn.execute(text(delete_reagents_sql), {"status": REAGENT_STATUS_DISPOSED})
        return result.rowcount