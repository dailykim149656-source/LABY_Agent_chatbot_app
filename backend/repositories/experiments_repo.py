from typing import Optional, List, Dict, Any
from sqlalchemy import text


def list_experiments(engine, limit: int, cursor: Optional[int] = None, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    sql = """
    SELECT exp_id, exp_name, researcher, status, exp_date, memo, created_at
    FROM Experiments
    WHERE 1=1
    """
    params: Dict[str, Any] = {}

    if status_filter:
        sql += " AND status = :status"
        params["status"] = status_filter

    if cursor is not None:
        sql += " AND exp_id < :cursor"
        params["cursor"] = cursor

    sql += " ORDER BY exp_id DESC OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY"
    params["limit"] = limit

    with engine.connect() as conn:
        return conn.execute(text(sql), params).mappings().all()


def get_experiment_by_id(engine, exp_id: int) -> Optional[Dict[str, Any]]:
    sql = """
    SELECT exp_id, exp_name, researcher, status, exp_date, memo, created_at
    FROM Experiments
    WHERE exp_id = :exp_id;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"exp_id": exp_id}).mappings().first()


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
) -> Optional[Dict[str, Any]]:
    sql = """
    INSERT INTO Experiments (exp_name, researcher, status, exp_date, memo, created_at)
    VALUES (:exp_name, :researcher, N'진행중', NULL, NULL, GETUTCDATE());
    """
    with engine.begin() as conn:
        result = conn.execute(
            text(sql),
            {
                "exp_name": exp_name,
                "researcher": researcher,
            },
        )
    
    return get_experiment_by_name(engine, exp_name)


def update_experiment(
    engine,
    exp_id: int,
    exp_name: Optional[str],
    status: Optional[str],
) -> Optional[Dict[str, Any]]:
    updates = []
    params: Dict[str, Any] = {"exp_id": exp_id}

    if exp_name is not None:
        updates.append("exp_name = :exp_name")
        params["exp_name"] = exp_name
    if status is not None:
        updates.append("status = :status")
        params["status"] = status

    if updates:
        sql = f"UPDATE Experiments SET {', '.join(updates)} WHERE exp_id = :exp_id;"
        with engine.begin() as conn:
            conn.execute(text(sql), params)

    return get_experiment_by_id(engine, exp_id)


def update_experiment_memo(engine, exp_id: int, memo: str) -> Optional[Dict[str, Any]]:
    sql = "UPDATE Experiments SET memo = :memo WHERE exp_id = :exp_id;"
    with engine.begin() as conn:
        conn.execute(text(sql), {"exp_id": exp_id, "memo": memo})
    return get_experiment_by_id(engine, exp_id)


def delete_experiment(engine, exp_id: int) -> bool:
    delete_usage_sql = "DELETE FROM ExperimentReagentUsage WHERE exp_id = :exp_id;"
    delete_exp_sql = "DELETE FROM Experiments WHERE exp_id = :exp_id;"
    
    with engine.begin() as conn:
        conn.execute(text(delete_usage_sql), {"exp_id": exp_id})
        result = conn.execute(text(delete_exp_sql), {"exp_id": exp_id})
        return result.rowcount > 0


def list_experiment_reagents(engine, exp_id: int) -> List[Dict[str, Any]]:
    """실험에 사용된 시약 목록 조회 (Usage 테이블에 저장된 스냅샷 정보 사용)"""
    sql = """
    SELECT
        usage_id,
        reagent_id,
        used_volume,
        reagent_name, -- 스냅샷 필드 사용
        formula,      -- 스냅샷 필드 사용
        density,      -- 스냅샷 필드 사용
        mass,         -- 스냅샷 필드 사용
        purity,       -- 스냅샷 필드 사용
        location      -- 스냅샷 필드 사용
    FROM ExperimentReagentUsage
    WHERE exp_id = :exp_id
    ORDER BY recorded_at ASC;
    """
    with engine.connect() as conn:
        return conn.execute(text(sql), {"exp_id": exp_id}).mappings().all()


def insert_experiment_reagent(
    engine,
    exp_id: int,
    reagent_id: int,
    used_volume: float,
) -> Optional[Dict[str, Any]]:
    """
    시약 추가:
    1. Reagents 테이블에서 현재 정보를 가져와 ExperimentReagentUsage에 스냅샷으로 기록 ✅
    2. Reagents의 current_volume 감소
    3. Reagents의 open_date가 NULL이면 현재 날짜로 업데이트
    """
    
    # 0. 스냅샷 저장을 위한 마스터 정보 조회
    fetch_info_sql = """
    SELECT reagent_name, formula, density, mass, purity, location
    FROM Reagents WHERE reagent_id = :reagent_id;
    """
    with engine.connect() as conn:
        info = conn.execute(text(fetch_info_sql), {"reagent_id": reagent_id}).mappings().first()
    
    if not info:
        return None

    # 1. 사용 기록 저장 (스냅샷 컬럼 포함)
    insert_sql = """
    INSERT INTO ExperimentReagentUsage (
        exp_id, reagent_id, used_volume, recorded_at,
        reagent_name, formula, density, mass, purity, location
    )
    VALUES (
        :exp_id, :reagent_id, :used_volume, GETUTCDATE(),
        :reagent_name, :formula, :density, :mass, :purity, :location
    );
    """
    
    # 2. 재고 감소
    update_volume_sql = """
    UPDATE Reagents 
    SET current_volume = current_volume - :used_volume
    WHERE reagent_id = :reagent_id;
    """
    
    # 3. open_date 업데이트 (NULL인 경우에만)
    update_open_date_sql = """
    UPDATE Reagents
    SET open_date = CONVERT(DATE, GETUTCDATE())
    WHERE reagent_id = :reagent_id AND open_date IS NULL;
    """
    
    with engine.begin() as conn:
        conn.execute(
            text(insert_sql),
            {
                "exp_id": exp_id,
                "reagent_id": reagent_id,
                "used_volume": used_volume,
                "reagent_name": info["reagent_name"],
                "formula": info["formula"],
                "density": info["density"],
                "mass": info["mass"],
                "purity": info["purity"],
                "location": info["location"]
            },
        )
        conn.execute(
            text(update_volume_sql),
            {"reagent_id": reagent_id, "used_volume": used_volume},
        )
        conn.execute(
            text(update_open_date_sql),
            {"reagent_id": reagent_id},
        )

    # 최신 데이터 조회 (스냅샷 컬럼 기준)
    fetch_sql = """
    SELECT TOP 1
        usage_id,
        reagent_id,
        used_volume,
        reagent_name,
        formula,
        density,
        mass,
        purity,
        location
    FROM ExperimentReagentUsage
    WHERE exp_id = :exp_id AND reagent_id = :reagent_id
    ORDER BY usage_id DESC;
    """

    with engine.connect() as conn:
        return conn.execute(
            text(fetch_sql),
            {"exp_id": exp_id, "reagent_id": reagent_id},
        ).mappings().first()


def delete_experiment_reagent(engine, exp_id: int, usage_id: int) -> tuple[bool, Optional[float], Optional[int]]:
    """
    시약 제거:
    1. ExperimentReagentUsage에서 삭제
    2. Reagents의 current_volume 복구
    3. 만약 해당 시약의 사용 내역이 더 이상 없다면 open_date를 NULL로 초기화 ✅
    """
    fetch_sql = """
    SELECT used_volume, reagent_id
    FROM ExperimentReagentUsage
    WHERE usage_id = :usage_id AND exp_id = :exp_id;
    """
    
    with engine.connect() as conn:
        row = conn.execute(
            text(fetch_sql),
            {"usage_id": usage_id, "exp_id": exp_id},
        ).mappings().first()
    
    if not row:
        return (False, None, None)
    
    used_volume = row["used_volume"]
    reagent_id = row["reagent_id"]
    
    delete_sql = """
    DELETE FROM ExperimentReagentUsage
    WHERE usage_id = :usage_id AND exp_id = :exp_id;
    """
    
    restore_volume_sql = """
    UPDATE Reagents
    SET current_volume = current_volume + :used_volume
    WHERE reagent_id = :reagent_id;
    """

    check_remaining_sql = """
    SELECT COUNT(*) as cnt FROM ExperimentReagentUsage WHERE reagent_id = :reagent_id;
    """

    reset_open_date_sql = """
    UPDATE Reagents SET open_date = NULL WHERE reagent_id = :reagent_id;
    """
    
    with engine.begin() as conn:
        # 1. 사용 기록 삭제
        result = conn.execute(text(delete_sql), {"usage_id": usage_id, "exp_id": exp_id})
        
        if result.rowcount > 0:
            # 2. 재고 복구
            conn.execute(
                text(restore_volume_sql),
                {"reagent_id": reagent_id, "used_volume": used_volume},
            )
            
            # 3. 남은 사용 기록 확인 후 개봉일 초기화
            remaining = conn.execute(text(check_remaining_sql), {"reagent_id": reagent_id}).mappings().first()
            if remaining and remaining["cnt"] == 0:
                conn.execute(text(reset_open_date_sql), {"reagent_id": reagent_id})
                
            return (True, used_volume, reagent_id)
    
    return (False, None, None)