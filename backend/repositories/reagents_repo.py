from typing import Optional, List, Dict, Any
from sqlalchemy import text

def list_reagents(engine, limit: int, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        reagent_id, reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass, recorded_at
    FROM Reagents
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}
    if cursor is not None:
        sql += " AND reagent_id < :cursor"
        params["cursor"] = cursor
    sql += " ORDER BY reagent_id DESC"
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()

def get_reagent(engine, reagent_id: Any) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT
        reagent_id, reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass, recorded_at
    FROM Reagents
    WHERE reagent_id = :reagent_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"reagent_id": reagent_id}).mappings().first()

def create_reagent(engine, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO Reagents (
        reagent_name, formula, purchase_date, open_date,
        current_volume, total_capacity, purity, location, density, mass
    ) 
    OUTPUT INSERTED.reagent_id
    VALUES (
        :reagent_name, :formula, :purchase_date, :open_date,
        :current_volume, :total_capacity, :purity, :location, :density, :mass
    );
    """
    with engine.begin() as conn:
        result = conn.execute(text(sql), payload)
        new_id = result.scalar()
    return get_reagent(engine, new_id)

def update_reagent(engine, reagent_id: Any, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not payload:
        return get_reagent(engine, reagent_id)
    set_clause = ", ".join([f"{key} = :{key}" for key in payload.keys()])
    sql = f"UPDATE Reagents SET {set_clause} WHERE reagent_id = :reagent_id;"
    params = dict(payload)
    params["reagent_id"] = reagent_id
    with engine.begin() as conn:
        conn.execute(text(sql), params)
    return get_reagent(engine, reagent_id)

def dispose_reagent(engine, reagent_id: Any, reason: str, disposed_by: str, disposal_date) -> Optional[Dict[str, Any]]:
    insert_sql = """
    INSERT INTO ReagentDisposals (reagent_id, disposal_date, reason, disposed_by)
    VALUES (:reagent_id, :disposal_date, :reason, :disposed_by);
    """
    with engine.begin() as conn:
        conn.execute(text(insert_sql), {
            "reagent_id": reagent_id,
            "disposal_date": disposal_date,
            "reason": reason,
            "disposed_by": disposed_by,
        })
    return get_reagent(engine, reagent_id)

def list_disposals(engine, limit: int, cursor: Optional[int] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        d.disposal_id, d.reagent_id, d.disposal_date, d.reason, d.disposed_by,
        r.reagent_name, r.formula
    FROM ReagentDisposals d
    JOIN Reagents r ON d.reagent_id = r.reagent_id
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}
    if cursor is not None:
        sql += " AND d.disposal_id < :cursor"
        params["cursor"] = cursor
    sql += " ORDER BY d.disposal_id DESC"
    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()

def list_storage_environment(engine, limit: int = 100) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        location, temp, humidity, status
    FROM StorageEnvironment
    ORDER BY recorded_at DESC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"limit": limit}).mappings().all()