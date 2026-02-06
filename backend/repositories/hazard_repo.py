import os
import urllib.parse
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from dotenv import load_dotenv

load_dotenv("backend/azure_and_sql.env")

_engine = None


def _get_engine():
    global _engine
    if _engine is not None:
        return _engine

    connection_url = URL.create(
        "mssql+pyodbc",
        username=os.getenv("SQL_USERNAME"),
        password=os.getenv("SQL_PASSWORD"),
        host=os.getenv("SQL_SERVER"),
        database=os.getenv("SQL_DATABASE"),
        query={
            "driver": os.getenv("SQL_DRIVER", "ODBC Driver 18 for SQL Server"),
            "TrustServerCertificate": "yes",
        },
    )
    _engine = create_engine(
        connection_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
    )
    return _engine


def find_by_exact_name(chem_name: str) -> Optional[str]:
    """화학물질명 정확 일치 검색"""
    sql = text("SELECT TOP 1 hazard_info FROM MSDS_Table WHERE chem_name_ko = :name")
    with _get_engine().connect() as conn:
        row = conn.execute(sql, {"name": chem_name}).fetchone()
    return row[0] if row else None


def find_by_nospace_name(chem_name: str) -> Optional[str]:
    """공백 무시 검색"""
    sql = text("""
        SELECT TOP 1 hazard_info
        FROM MSDS_Table
        WHERE REPLACE(chem_name_ko, ' ', '') = :name
    """)
    with _get_engine().connect() as conn:
        row = conn.execute(sql, {"name": chem_name}).fetchone()
    return row[0] if row else None
