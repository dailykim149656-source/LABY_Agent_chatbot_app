from typing import Optional
from fastapi import APIRouter, Query, Request, HTTPException
from sqlalchemy import create_engine, text
import urllib.parse
import os
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

# 환경변수 로드 (혹시 모르니 유지)
load_dotenv("backend/azure_and_sql.env")

router = APIRouter()

# MSDS DB 연결 함수 (★수정됨: 확실한 접속을 위해 정보 직접 입력)
def get_msds_db_connection():
    # ▼▼▼ [수정] .env 대신 직접 입력하여 None 에러 방지 ▼▼▼
    SQL_SERVER = "8ai-3rd-team-sql-db.database.windows.net"
    SQL_NAME = "smart-lab-3rd-team-8ai"
    SQL_USERNAME = "ai3rdteamsql"
    SQL_PASSWORD = "ProjectSuccess2026"  # 기존에 알려주신 비밀번호
    # ▲▲▲ [수정 끝] ▲▲▲
    
    params = urllib.parse.quote_plus(
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={SQL_SERVER};"
        f"DATABASE={SQL_NAME};"
        f"UID={SQL_USERNAME};"
        f"PWD={{{SQL_PASSWORD}}};"
        f"TrustServerCertificate=yes;"
    )
    engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")
    return engine

# =================================================================
# 유해성 정보 검색 API 
# =================================================================
@router.get("/api/reagents/hazard-info")
def search_hazard(chem_name: str):
    """
    화학물질명(chem_name)으로 유해성 정보 검색
    - 띄어쓰기 무시, #숫자 태그 무시
    """
    engine = get_msds_db_connection()
    
    # 1. 정제: 맨 뒤에 붙은 '#숫자' 패턴 제거
    cleaned_name = re.sub(r'\s*#\d+\s*$', '', chem_name)
    
    try:
        with engine.connect() as conn:
            # SQL: 공백 제거 후 비교 (REPLACE 사용)
            query = text("""
                SELECT TOP 1 hazard_info 
                FROM MSDS_Table 
                WHERE REPLACE(chem_name_ko, ' ', '') = REPLACE(:name, ' ', '')
            """)
            
            # 1차 시도: 정제된 이름(숫자 뗀 것)으로 검색
            result = conn.execute(query, {"name": cleaned_name}).fetchone()
            
            if result:
                return {"status": "success", "hazard": result[0]}
            
            else:
                # 2차 시도: 원본 이름으로 검색
                result_origin = conn.execute(query, {"name": chem_name}).fetchone()
                
                if result_origin:
                    return {"status": "success", "hazard": result_origin[0]}
                
                return {"status": "fail", "hazard": "정보 없음"}
                
    except Exception as e:
        print(f"MSDS DB Error: {e}")
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