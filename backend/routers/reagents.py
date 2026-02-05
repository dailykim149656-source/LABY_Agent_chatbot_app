from collections import OrderedDict
from typing import Optional
import time
from fastapi import APIRouter, Query, Request
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
import logging
import re
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

QUERY_TIMEOUT_SEC = 10

# =================================================================
# 유해성 정보 캐시 (LRU + TTL)
# =================================================================
_HAZARD_CACHE_TTL_SECONDS = 300
_HAZARD_CACHE_MAXSIZE = 256
_HAZARD_CACHE: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()

def _get_hazard_cache(key: str) -> Optional[dict]:
    now = time.time()
    cached = _HAZARD_CACHE.get(key)
    if not cached:
        return None
    cached_at, value = cached
    if now - cached_at > _HAZARD_CACHE_TTL_SECONDS:
        _HAZARD_CACHE.pop(key, None)
        return None
    _HAZARD_CACHE.move_to_end(key)
    return value

def _set_hazard_cache(key: str, value: dict) -> None:
    _HAZARD_CACHE[key] = (time.time(), value)
    _HAZARD_CACHE.move_to_end(key)
    if len(_HAZARD_CACHE) > _HAZARD_CACHE_MAXSIZE:
        _HAZARD_CACHE.popitem(last=False)

# =================================================================
# [속도 최적화 핵심] DB 엔진을 전역 변수로 생성 (Connection Pool)
# =================================================================
# 이렇게 함수 밖에서 한 번만 만들어야 연결을 재사용해서 빨라집니다.
connection_url = URL.create(
    "mssql+pyodbc",
    username="ai3rdteamsql",
    password="Korea20261775!!",
    host="8ai-3rd-team-sql-db.database.windows.net",
    database="smart-lab-3rd-team-8ai",
    query={
        "driver": "ODBC Driver 18 for SQL Server",
        "TrustServerCertificate": "yes",
    },
)

# pool_size=5: 미리 5개의 연결을 열어두고 재사용함
# pool_pre_ping=True: 연결이 끊겼는지 확인하고 자동으로 다시 연결함
engine = create_engine(
    connection_url, 
    pool_size=5, 
    max_overflow=10,
    pool_pre_ping=True
)

def get_msds_db_connection():
    return engine

# =================================================================
# 유해성 정보 검색 API
# =================================================================
@router.get("/api/reagents/hazard-info")
def search_hazard(chem_name: str):
    """
    화학물질명(chem_name)으로 유해성 정보 검색
    """
    request_started = time.monotonic()
    
    # 1. 정제: '#숫자' 패턴 제거
    cleaned_name = re.sub(r'\s*#\d+\s*$', '', chem_name)

    # 캐시 확인 (메모리에 있으면 0.0001초 컷)
    cached_response = _get_hazard_cache(cleaned_name)
    if cached_response:
        print(f"   ⚡️ [캐시] 적중: '{cleaned_name}'")
        return cached_response

    print(f"\n🔍 [MSDS 검색] 요청값: '{chem_name}'")
    
    # 공백 제거 버전 이름 준비
    nospace_name = cleaned_name.replace(" ", "")
    
    try:
        # [최적화] 이미 연결된 풀에서 가져오므로 접속 시간이 거의 0초
        with engine.connect() as conn:
            
            # 타임아웃 설정 (필요시)
            try:
                if hasattr(conn.connection, "timeout"):
                    conn.connection.timeout = QUERY_TIMEOUT_SEC
            except: pass
            
            # 쿼리 준비
            query_exact = text("SELECT TOP 1 hazard_info FROM MSDS_Table WHERE chem_name_ko = :name")
            
            query_nospace = text("""
                SELECT TOP 1 hazard_info 
                FROM MSDS_Table 
                WHERE REPLACE(chem_name_ko, ' ', '') = :name
            """)

            # --- 검색 실행 순서 ---

            # 1. 완전 일치 시도
            result = conn.execute(query_exact, {"name": cleaned_name}).fetchone()
            if result:
                print(f"   ✅ [성공] 완전 일치: '{cleaned_name}'")
                response = {"status": "success", "hazard": result[0]}
                _set_hazard_cache(cleaned_name, response)
                return response

            # 2. 띄어쓰기 무시 시도
            result = conn.execute(query_nospace, {"name": nospace_name}).fetchone()
            if result:
                print(f"   ✅ [성공] 띄어쓰기 무시: '{cleaned_name}'")
                response = {"status": "success", "hazard": result[0]}
                _set_hazard_cache(cleaned_name, response)
                return response
            
            # 3. 원본 이름 시도
            if cleaned_name != chem_name:
                result = conn.execute(query_exact, {"name": chem_name}).fetchone()
                if result:
                    print(f"   ✅ [성공] 원본 이름: '{chem_name}'")
                    response = {"status": "success", "hazard": result[0]}
                    _set_hazard_cache(cleaned_name, response)
                    return response

            print("   ❌ [실패] DB에서 찾을 수 없음")
            response = {"status": "fail", "hazard": "정보 없음"}
            _set_hazard_cache(cleaned_name, response)
            return response
                
    except Exception as e:
        logger.exception("MSDS DB connection/query failed: %s", e)
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