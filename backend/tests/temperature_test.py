"""
Temperature Hyperparameter Test Script

이 스크립트는 SQL Agent의 temperature 파라미터를 테스트합니다.
sql_agent.py와 동일한 시스템 프롬프트, Few-shot 예제, 커스텀 도구를 사용합니다.
temperature만 변경하여 동일 조건에서 테스트합니다.

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
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from sqlalchemy import create_engine
import urllib.parse

# sql_agent.py에서 커스텀 도구 임포트
from sql_agent import (
    create_experiment,
    log_experiment_data,
    fetch_pending_verification,
    update_verification_status,
    get_experiment_summary,
    get_storage_status,
    db_engine,
)

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
# sql_agent.py와 동일한 시스템 프롬프트 및 Few-shot 예제
# ============================================================

EXAMPLES = [
    {
        "input": "가장 최근에 일어난 넘어짐 사고를 보고해.",
        "sql_cmd": "SELECT TOP 1 * FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
    },
    {
        "input": "가장 최근에 일어난 엎어짐 사고의 시간을 보고해.",
        "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
    },
    {
        "input": "Cylinder_Cam_01에서 발생한 마지막 사고가 언제야?",
        "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE CameraID = 'Cylinder_Cam_01' AND Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"
    },
    {
        "input": "새로운 실험 세션을 만들어줘. 이름은 'Experiment_001'이고 담당자는 'Kim'이야.",
        "sql_cmd": "FUNCTION_CALL: create_experiment(exp_name='Experiment_001', researcher='Kim')"
    },
    {
        "input": "'Experiment_001' 실험에 데이터 추가해. 물질은 'Graphene', 부피 10.5, 밀도 2.2, 질량 23.1.",
        "sql_cmd": "FUNCTION_CALL: log_experiment_data(exp_name='Experiment_001', material='Graphene', volume=10.5, density=2.2, mass=23.1)"
    },
    {
        "input": "'Experiment_001'에 대한 실험 정보를 다 보여줘.",
        "sql_cmd": "SELECT e.exp_name, e.researcher, e.created_at, d.material, d.volume, d.density, d.mass FROM Experiments e JOIN ExperimentData d ON e.exp_id = d.exp_id WHERE e.exp_name = 'Experiment_001';"
    },
    {
        "input": "지금 확인 안 된 낙하 사고 있어?",
        "sql_cmd": "FUNCTION_CALL: fetch_pending_verification()"
    },
    {
        "input": "이벤트 105번은 진짜 넘어진 거 맞아. 확인 처리해줘.",
        "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=105, status_code=1, subject='Agent')"
    },
    {
        "input": "이벤트 106번은 센서 오류 같아. 무시해.",
        "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=106, status_code=2, subject='Agent')"
    },
    {
        "input": "'EXP_2024_A' 넘어짐 사고 요약해줘.",
        "sql_cmd": "FUNCTION_CALL: get_experiment_summary(experiment_id='EXP_2024_A')"
    },
    {
        "input": "시약 창고 Alpha 비어있어?",
        "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
    },
    {
        "input": "현재 무게 얼마야?",
        "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
    },
    {
        "input": "지금 저울 상태 알려줘.",
        "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"
    },
    {
        "input": "우리 랩에 황산 재고 있어?",
        "sql_cmd": "SELECT * FROM Reagents WHERE name LIKE '%Sulfuric Acid%' OR name LIKE '%황산%';"
    },
    {
        "input": "수산화나트륨 얼마나 남았어?",
        "sql_cmd": "SELECT name, current_volume_value, current_volume_unit FROM Reagents WHERE name LIKE '%Sodium Hydroxide%' OR name LIKE '%수산화나트륨%';"
    }
]

SYSTEM_PREFIX = """
You are a smart laboratory assistant agent. You manage five distinct domains of data:

### Domain 1: Cylinder Stability (Fall Detection)
- **Table**: `FallEvents`
- **Logic**:
  - `Status='FALL_CONFIRMED'` strictly means **'Overturned'** (lying on side, >45°), not just dropping.
  - **Risk Angle**: ~90° is fully prostrate (serious).
  - If user asks about 'overturn', 'tip-over', 'upset', use `Status='FALL_CONFIRMED'`.

### Domain 2: Lab Experiments (Master-Detail)
- **Tables**:
  - `Experiments` (Parent: exp_id, exp_name, researcher)
  - `ExperimentData` (Child: data_id, exp_id, material, volume, density...)
- **Logic**:
  - These tables are linked by `exp_id`.
  - **To READ**: When asked for experiment info, ALWAYS **JOIN** these two tables to show full context.
  - **To WRITE**: DO NOT generate `INSERT` SQL. You MUST use the provided tools: `create_experiment` or `log_experiment_data`.

### Domain 3: Fall Verification (Workflow)
- **Table**: `FallEvents` (EventID, VerificationStatus, ExperimentID...)
- **Status Codes**: 0 (Pending), 1 (Confirmed Real), 2 (False Alarm).
- **Workflow**:
  1. User asks to check pending falls -> Call `fetch_pending_verification`.
  2. Agent shows detail.
  3. User confirms or rejects specific EventID.
  4. Agent calls `update_verification_status`.

### Domain 4: Real-time Asset Monitoring (Arduino Scale)
- **Table**: `WeightLog` (LogID, StorageID, WeightValue, Status, EmptyTime, RecordedAt)
- **Logic**:
  - This table stores **LIVE sensor data** from an electronic scale.
  - **USE THE TOOL**: For any questions about current weight, status (empty/occupied), or duration of emptiness, use `get_storage_status`.
  - The tool returns formatted text easier for you to explain (e.g., "Empty for 30s").

### Domain 5: Chemical Inventory (Static Stock)
- **Table**: `Reagents` (reagent_id, name, current_volume_value, location...)
- **Logic**:
  - This table stores the **list of chemicals** owned by the lab (e.g., 'Sulfuric Acid', 'Methanol').
  - Use this ONLY if the user asks about "inventory", "stock list", or "properties" of a specific chemical.

### General Rules:
- **Priority**: If user asks "What is the weight now?", check **Domain 4 (Tool: get_storage_status)** first.
- Use MSSQL syntax (TOP instead of LIMIT).
- Always answer in Korean unless requested otherwise.

Here are examples of how to map user intent to SQL or Actions:
"""

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
        verbose=False
    )


def build_system_prompt() -> str:
    """sql_agent.py와 동일한 시스템 프롬프트 생성"""
    example_prompt = PromptTemplate(
        input_variables=["input", "sql_cmd"],
        template="User Input: {input}\nSQL Query/Action: {sql_cmd}"
    )

    few_shot_prompt = FewShotPromptTemplate(
        examples=EXAMPLES,
        example_prompt=example_prompt,
        prefix=SYSTEM_PREFIX,
        suffix="\nUser Input: {input}\nSQL Query/Action:",
        input_variables=["input"]
    )

    full_system_message = few_shot_prompt.format(input="")
    return full_system_message.replace("\nUser Input: \nSQL Query/Action:", "")


def create_agent(llm: AzureChatOpenAI, db: SQLDatabase, engine):
    """sql_agent.py와 동일한 설정으로 SQL Agent 생성"""
    # db_engine을 sql_agent 모듈에 설정 (도구에서 사용)
    import sql_agent
    sql_agent.db_engine = engine

    system_prompt = build_system_prompt()

    return create_sql_agent(
        llm=llm,
        db=db,
        agent_type="openai-tools",
        verbose=False,
        handle_parsing_errors=True,
        prefix=system_prompt,
        extra_tools=[
            create_experiment,
            log_experiment_data,
            fetch_pending_verification,
            update_verification_status,
            get_experiment_summary,
            get_storage_status
        ]
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


def run_all_tests(db: SQLDatabase, engine) -> List[Dict[str, Any]]:
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
            agent = create_agent(llm, db, engine)

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
    print("sql_agent.py와 동일한 설정 (temperature만 변경)")
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
    print("  (sql_agent.py와 동일한 시스템 프롬프트, Few-shot, 도구 사용)")
    results = run_all_tests(db, engine)

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
