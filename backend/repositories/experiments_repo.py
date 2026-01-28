from typing import Optional, List, Dict, Any

from sqlalchemy import text


def list_experiments(engine, limit: int, cursor: Optional[int] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT TOP (:limit)
        exp_id, exp_name, researcher, status, exp_date, memo, created_at
    FROM Experiments
    WHERE 1=1
    """
    params: Dict[str, Any] = {"limit": limit}

    if cursor is not None:
        sql += " AND exp_id < :cursor"
        params["cursor"] = cursor

    sql += " ORDER BY exp_id DESC"

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def get_experiment_by_name(engine, exp_name: str) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT exp_id, exp_name, researcher, status, exp_date, memo, created_at
    FROM Experiments
    WHERE exp_name = :exp_name;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"exp_name": exp_name}).mappings().first()


def get_experiment_id_by_name(engine, exp_name: str) -> Optional[int]:
    sql = "SELECT exp_id FROM Experiments WHERE exp_name = :exp_name;"
    with engine.connect() as conn:
        row = conn.execute(text(sql), {"exp_name": exp_name}).mappings().first()
    if not row:
        return None
    return row.get("exp_id")


def create_experiment(
    engine,
    exp_name: str,
    researcher: Optional[str],
    status: Optional[str],
    exp_date,
    memo: Optional[str],
) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO Experiments (exp_name, researcher, status, exp_date, memo)
    VALUES (:exp_name, :researcher, :status, :exp_date, :memo);
    """
    with engine.begin() as conn:
        conn.execute(
            text(sql),
            {
                "exp_name": exp_name,
                "researcher": researcher,
                "status": status,
                "exp_date": exp_date,
                "memo": memo,
            },
        )

    return get_experiment_by_name(engine, exp_name)


def update_experiment(
    engine,
    current_name: str,
    new_name: Optional[str],
    researcher: Optional[str],
    status: Optional[str],
    exp_date,
    memo: Optional[str],
) -> Optional[Dict[str, Any]]:
    updates = []
    params: Dict[str, Any] = {"current_name": current_name}

    if new_name is not None:
        updates.append("exp_name = :new_name")
        params["new_name"] = new_name
    if researcher is not None:
        updates.append("researcher = :researcher")
        params["researcher"] = researcher
    if status is not None:
        updates.append("status = :status")
        params["status"] = status
    if exp_date is not None:
        updates.append("exp_date = :exp_date")
        params["exp_date"] = exp_date
    if memo is not None:
        updates.append("memo = :memo")
        params["memo"] = memo

    if updates:
        sql = f"UPDATE Experiments SET {', '.join(updates)} WHERE exp_name = :current_name;"
        with engine.begin() as conn:
            conn.execute(text(sql), params)

    target_name = new_name if new_name is not None else current_name
    return get_experiment_by_name(engine, target_name)


def list_experiment_reagents(engine, exp_id: int) -> List[Dict[str, Any]]:
    sql = """
    SELECT
        er.exp_reagent_id,
        er.reagent_id,
        er.dosage_value,
        er.dosage_unit,
        r.name,
        r.formula,
        r.density,
        r.mass,
        r.purity,
        r.location
    FROM ExperimentReagents er
    JOIN Reagents r ON er.reagent_id = r.reagent_id
    WHERE er.exp_id = :exp_id
    ORDER BY er.exp_reagent_id ASC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"exp_id": exp_id}).mappings().all()


def insert_experiment_reagent(
    engine,
    exp_id: int,
    reagent_id: str,
    dosage_value: float,
    dosage_unit: str,
) -> Optional[Dict[str, Any]]:
    insert_sql = """
    INSERT INTO ExperimentReagents (exp_id, reagent_id, dosage_value, dosage_unit)
    VALUES (:exp_id, :reagent_id, :dosage_value, :dosage_unit);
    """
    with engine.begin() as conn:
        conn.execute(
            text(insert_sql),
            {
                "exp_id": exp_id,
                "reagent_id": reagent_id,
                "dosage_value": dosage_value,
                "dosage_unit": dosage_unit,
            },
        )

    fetch_sql = """
    SELECT TOP 1
        er.exp_reagent_id,
        er.reagent_id,
        er.dosage_value,
        er.dosage_unit,
        r.name,
        r.formula,
        r.density,
        r.mass,
        r.purity,
        r.location
    FROM ExperimentReagents er
    JOIN Reagents r ON er.reagent_id = r.reagent_id
    WHERE er.exp_id = :exp_id AND er.reagent_id = :reagent_id
    ORDER BY er.exp_reagent_id DESC;
    """

    with engine.connect() as conn:
        return conn.execute(
            text(fetch_sql),
            {"exp_id": exp_id, "reagent_id": reagent_id},
        ).mappings().first()


def delete_experiment_reagent(engine, exp_id: int, exp_reagent_id: int) -> bool:
    sql = """
    DELETE FROM ExperimentReagents
    WHERE exp_reagent_id = :exp_reagent_id AND exp_id = :exp_id;
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(sql),
            {"exp_reagent_id": exp_reagent_id, "exp_id": exp_id},
        )
        return result.rowcount > 0
