"""
Temperature Hyperparameter Test Script

이 스크립트는 SQL Agent의 temperature 파라미터를 테스트합니다.
동일한 질문에 대해 다양한 temperature 값으로 응답을 생성하고
결과를 CSV 파일로 저장합니다.

사용법:
    cd backend
    python -m tests.temperature_test

삭제해도 메인 시스템에 영향 없음.
"""

import os
import sys
import csv
from datetime import datetime
from typing import List, Dict, Any

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from sqlalchemy import create_engine
import urllib.parse

# ============================================================
# 테스트 설정
# ============================================================

TEMPERATURES = [0, 0.1, 0.3, 0.5, 0.8, 1.0]

TEST_QUESTIONS = [
    "황산 재고 있어?",
    "가장 최근 사고 알려줘",
    "시약 추천해줘",
    "가장채근삭오알여조",  # 의도적 오타 테스트 (가장 최근 사고 알려줘)
]

# ============================================================
# 환경 설정
# ============================================================

def load_environment() -> None:
    """환경 변수 로드"""
    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(script_dir, "azure_and_sql.env")
    load_dotenv(dotenv_path=env_path)

    required_vars = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "OPENAI_API_VERSION",
        "AZURE_DEPLOYMENT_NAME",
        "SQL_SERVER",
        "SQL_DATABASE",
        "SQL_USERNAME",
        "SQL_PASSWORD"
    ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        raise EnvironmentError(f"Missing: {', '.join(missing_vars)}")


def get_connection_string() -> str:
    """DB 연결 문자열 생성"""
    server = os.getenv("SQL_SERVER")
    database = os.getenv("SQL_DATABASE")
    username = os.getenv("SQL_USERNAME")
    password = os.getenv("SQL_PASSWORD")
    encoded_password = urllib.parse.quote_plus(password)
    driver = os.getenv("SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    encoded_driver = urllib.parse.quote_plus(driver)

    return (
        f"mssql+pyodbc://{username}:{encoded_password}@{server}/{database}"
        f"?driver={encoded_driver}"
    )


def get_llm(temperature: float) -> AzureChatOpenAI:
    """지정된 temperature로 LLM 생성"""
    return AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_DEPLOYMENT_NAME"),
        api_version=os.getenv("OPENAI_API_VERSION"),
        temperature=temperature,
        verbose=False  # 테스트 시 로그 간소화
    )


def create_agent(llm: AzureChatOpenAI, db: SQLDatabase):
    """SQL Agent 생성 (간소화 버전)"""
    return create_sql_agent(
        llm=llm,
        db=db,
        agent_type="openai-tools",
        verbose=False,
        handle_parsing_errors=True,
    )


# ============================================================
# 테스트 실행
# ============================================================

def run_single_test(agent, question: str) -> str:
    """단일 질문 테스트 실행"""
    try:
        result = agent.invoke({"input": question})
        return result.get("output", "")
    except Exception as e:
        return f"[ERROR] {str(e)}"


def run_all_tests(db: SQLDatabase) -> List[Dict[str, Any]]:
    """모든 temperature에 대해 테스트 실행"""
    results = []

    for question in TEST_QUESTIONS:
        row = {"question": question}
        print(f"\n{'='*60}")
        print(f"질문: {question}")
        print('='*60)

        for temp in TEMPERATURES:
            print(f"\n  Temperature {temp}:")
            print(f"  {'-'*50}")

            llm = get_llm(temp)
            agent = create_agent(llm, db)

            response = run_single_test(agent, question)
            row[f"temp_{temp}"] = response

            # 응답 미리보기 (첫 200자)
            preview = response[:200] + "..." if len(response) > 200 else response
            print(f"  응답: {preview}")

        results.append(row)

    return results


def save_results(results: List[Dict[str, Any]], output_dir: str) -> str:
    """결과를 CSV 파일로 저장"""
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"temperature_results_{timestamp}.csv"
    filepath = os.path.join(output_dir, filename)

    # CSV 헤더 구성
    headers = ["question"] + [f"temp_{t}" for t in TEMPERATURES]

    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(results)

    return filepath


def print_summary(results: List[Dict[str, Any]]) -> None:
    """결과 요약 출력"""
    print("\n" + "="*60)
    print("테스트 결과 요약")
    print("="*60)

    for row in results:
        print(f"\n질문: {row['question']}")
        print("-"*40)
        for temp in TEMPERATURES:
            response = row.get(f"temp_{temp}", "")
            length = len(response)
            print(f"  temp={temp}: {length}자")


# ============================================================
# 메인 실행
# ============================================================

def main():
    print("="*60)
    print("Temperature Hyperparameter Test")
    print("="*60)
    print(f"테스트 temperature 값: {TEMPERATURES}")
    print(f"테스트 질문 수: {len(TEST_QUESTIONS)}")
    print("="*60)

    # 환경 설정
    print("\n[1/4] 환경 변수 로드 중...")
    load_environment()
    print("  완료!")

    # DB 연결
    print("\n[2/4] 데이터베이스 연결 중...")
    conn_str = get_connection_string()
    engine = create_engine(conn_str, pool_pre_ping=True)
    db = SQLDatabase(engine)
    print("  완료!")

    # 테스트 실행
    print("\n[3/4] 테스트 실행 중...")
    results = run_all_tests(db)

    # 결과 저장
    print("\n[4/4] 결과 저장 중...")
    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(script_dir, "test_results")
    filepath = save_results(results, output_dir)
    print(f"  저장 완료: {filepath}")

    # 요약 출력
    print_summary(results)

    print("\n" + "="*60)
    print("테스트 완료!")
    print(f"결과 파일: {filepath}")
    print("="*60)


if __name__ == "__main__":
    main()
