from typing import Optional
from fastapi import APIRouter, Query, Request
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL  # ✅ URL 객체 사용 (접속 에러 해결의 핵심!)
import logging
import re
import time
from dotenv import load_dotenv

from ..schemas import (
    ReagentListResponse, ReagentItem, ReagentCreateRequest,
    ReagentDisposalCreateRequest, ReagentDisposalResponse, ReagentDisposalListResponse,
    StorageEnvironmentResponse
)
from ..services import reagents_service, i18n_service
from ..utils.i18n_handler import apply_i18n_to_items
from ..utils.exceptions import ensure_found

# 환경변수 로드
load_dotenv("backend/azure_and_sql.env")

router = APIRouter()
logger = logging.getLogger(__name__)

CONNECT_TIMEOUT_SEC = 5
QUERY_TIMEOUT_SEC = 10

# =================================================================
# MSDS DB 연결 함수 (★수정됨: URL 객체 사용으로 "None" 에러 완벽 해결)
# =================================================================
def get_msds_db_connection():
    # 이 방식(URL.create)을 써야 DB 이름이 'None'으로 인식되는 문제를 막을 수 있습니다.
    connection_url = URL.create(
        "mssql+pyodbc",
        username="ai3rdteamsql",
        password="Korea20261775!!",
        host="8ai-3rd-team-sql-db.database.windows.net",
        database="smart-lab-3rd-team-8ai",  # DB 이름 명시
        query={
            "driver": "ODBC Driver 18 for SQL Server",
            "TrustServerCertificate": "yes",
        },
    )
    engine = create_engine(
        connection_url,
        connect_args={"timeout": CONNECT_TIMEOUT_SEC},
    )
    return engine

# =================================================================
# 유해성 정보 검색 API (★수정됨: 검색 로직 3단계 강화)
# =================================================================
@router.get("/api/reagents/hazard-info")
def search_hazard(chem_name: str):
    """
    화학물질명(chem_name)으로 유해성 정보 검색
    1. #숫자 태그 제거 (예: 황산 #1 -> 황산)
    2. 완전 일치 검색 우선 (예: AS 수지 -> AS 수지)
    3. 띄어쓰기 무시 검색 (예: AS수지 -> AS 수지)
    """
    request_started = time.monotonic()
    logger.info("MSDS hazard search request received: chem_name=%s", chem_name)

    engine = get_msds_db_connection()
    logger.info("MSDS DB engine initialized")

    # 1. 정제: '#숫자' 패턴 제거 (예: "황산 #1" -> "황산", "황산#2" -> "황산")
    cleaned_name = re.sub(r'\s*#\d+\s*$', '', chem_name)
    
    # 2. 정제: 공백 제거 버전 (예: "AS 수지" -> "AS수지")
    nospace_name = cleaned_name.replace(" ", "")
    
    try:
        logger.info("MSDS DB connection start")
        with engine.connect() as conn:
            logger.info("MSDS DB connection established")
            try:
                raw_conn = conn.connection
                if hasattr(raw_conn, "timeout"):
                    raw_conn.timeout = QUERY_TIMEOUT_SEC
                    logger.info("MSDS DB query timeout set to %s seconds", QUERY_TIMEOUT_SEC)
            except Exception as timeout_error:
                logger.warning("MSDS DB query timeout setting failed: %s", timeout_error)
            # 쿼리 준비
            
            # [전략 A] 완전 일치 검색 (가장 정확함, AS 수지 같은 경우 필수)
            query_exact = text("SELECT TOP 1 hazard_info FROM MSDS_Table WHERE chem_name_ko = :name")
            
            # [전략 B] 띄어쓰기 무시 검색 (유연함)
            # DB의 'chem_name_ko' 공백을 없애고 비교
            query_nospace = text("""
                SELECT TOP 1 hazard_info 
                FROM MSDS_Table 
                WHERE REPLACE(chem_name_ko, ' ', '') = :name
            """)

            # --- 검색 실행 순서 ---

            logger.info("MSDS query execution start")

            # 1. 정제된 이름으로 '완전 일치' 시도
            # 예: "AS 수지" -> DB에 "AS 수지"가 있으면 바로 성공!
            result = conn.execute(query_exact, {"name": cleaned_name}).fetchone()
            if result:
                logger.info("MSDS query matched exact name: %s", cleaned_name)
                logger.info(
                    "MSDS response ready status=success elapsed=%.3fs",
                    time.monotonic() - request_started,
                )
                return {"status": "success", "hazard": result[0]}

            # 2. 띄어쓰기 무시하고 시도
            # 예: "AS수지" -> DB의 "AS 수지"를 찾음
            result = conn.execute(query_nospace, {"name": nospace_name}).fetchone()
            if result:
                logger.info("MSDS query matched no-space name: %s", cleaned_name)
                logger.info(
                    "MSDS response ready status=success elapsed=%.3fs",
                    time.monotonic() - request_started,
                )
                return {"status": "success", "hazard": result[0]}
            
            # 3. 혹시 모르니 원본 이름으로 한번 더 (영어 이름 등)
            if cleaned_name != chem_name:
                result = conn.execute(query_exact, {"name": chem_name}).fetchone()
                if result:
                    logger.info("MSDS query matched original name: %s", chem_name)
                    logger.info(
                        "MSDS response ready status=success elapsed=%.3fs",
                        time.monotonic() - request_started,
                    )
                    return {"status": "success", "hazard": result[0]}

            logger.info("MSDS query completed with no match")
            logger.info(
                "MSDS response ready status=fail elapsed=%.3fs",
                time.monotonic() - request_started,
            )
            return {"status": "fail", "hazard": "정보 없음"}
                
    except Exception as e:
        logger.exception("MSDS DB connection/query failed: %s", e)
        logger.info(
            "MSDS response ready status=error elapsed=%.3fs",
            time.monotonic() - request_started,
        )
        return {"status": "error", "message": str(e)}


# ================= 기존 코드 (그대로 유지) =================

@router.get("/api/reagents", response_model=ReagentListResponse)
def list_reagents(
    request: Request,
    limit: int = Query(100),
    cursor: Optional[str] = Query(None),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
):
    response = reagents_service.list_reagents(request.app.state.db_engine, limit, cursor)
    apply_i18n_to_items(response.items, request, i18n_service.attach_reagent_list, lang, includeI18n)
    return response

@router.get("/api/reagents/storage-environment", response_model=StorageEnvironmentResponse)
def storage_environment(request: Request):
    return reagents_service.list_storage_environment(request.app.state.db_engine)

@router.get("/api/reagents/disposals", response_model=ReagentDisposalListResponse)
def list_disposals(
    request: Request,
    limit: int = Query(100),
    cursor: Optional[int] = Query(None),
    lang: Optional[str] = Query(None),
    includeI18n: bool = Query(False),
):
    response = reagents_service.list_disposals(request.app.state.db_engine, limit, cursor)
    apply_i18n_to_items(response.items, request, i18n_service.attach_reagent_disposals, lang, includeI18n)
    return response

@router.patch("/api/reagents/{reagent_id}", response_model=ReagentItem)
def update_reagent(reagent_id: str, body: dict, request: Request):
    item = ensure_found(
        reagents_service.update_reagent(request.app.state.db_engine, reagent_id, body),
        "Reagent"
    )
    return item

@router.post("/api/reagents", response_model=ReagentItem)
def create_reagent(body: ReagentCreateRequest, request: Request):
    item = reagents_service.create_reagent(request.app.state.db_engine, body)
    return item

@router.post("/api/reagents/{reagent_id}/dispose", response_model=ReagentDisposalResponse)
def dispose_reagent(reagent_id: str, body: ReagentDisposalCreateRequest, request: Request):
    return reagents_service.dispose_reagent(request.app.state.db_engine, reagent_id, body.reason, body.disposedBy)

@router.post("/api/reagents/{reagent_id}/restore", response_model=ReagentItem)
def restore_reagent(reagent_id: str, request: Request):
    return reagents_service.restore_reagent(request.app.state.db_engine, reagent_id)

@router.delete("/api/reagents/disposals")
def clear_all_disposals(request: Request):
    count = reagents_service.clear_all_disposals(request.app.state.db_engine)
    return {"success": True, "deleted_count": count}

@router.delete("/api/reagents/{reagent_id}")
def delete_reagent_permanently(reagent_id: str, request: Request):
    reagents_service.delete_reagent_permanently(request.app.state.db_engine, reagent_id)
    return {"success": True}
