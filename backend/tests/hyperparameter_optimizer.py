"""
SQL Agent Hyperparameter Optimizer

5개 Phase로 구성된 종합 하이퍼파라미터 최적화 실험:
- Phase 1: Temperature (0.0~1.0)
- Phase 2: Top-P (0.5~1.0)
- Phase 3: Frequency Penalty (0.0~1.2)
- Phase 4: Presence Penalty (0.0~1.2)
- Phase 5: 조합 테스트

사용법:
    cd backend
    python -m tests.hyperparameter_optimizer --phase 1
    python -m tests.hyperparameter_optimizer --phase all
    python -m tests.hyperparameter_optimizer --phase 5 --iterations 5

삭제해도 메인 시스템에 영향 없음.
"""

import os
import sys
import csv
import json
import time
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from statistics import mean, stdev

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from sqlalchemy import create_engine, text
import urllib.parse

# sql_agent.py에서 커스텀 도구 임포트
from sql_agent import (
    create_experiment,
    log_experiment_data,
    fetch_pending_verification,
    update_verification_status,
    get_experiment_summary,
    get_storage_status,
)

# ============================================================
# 실험 설정
# ============================================================

# Phase별 파라미터 범위
PHASE_CONFIG = {
    1: {
        "name": "Temperature",
        "param": "temperature",
        "values": [0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
        "default_others": {"top_p": 1.0, "frequency_penalty": 0.0, "presence_penalty": 0.0}
    },
    2: {
        "name": "Top-P",
        "param": "top_p",
        "values": [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1.0],
        "default_others": {"temperature": 0.7, "frequency_penalty": 0.0, "presence_penalty": 0.0}
    },
    3: {
        "name": "Frequency Penalty",
        "param": "frequency_penalty",
        "values": [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2],
        "default_others": {"temperature": 0.7, "top_p": 0.85, "presence_penalty": 0.0}
    },
    4: {
        "name": "Presence Penalty",
        "param": "presence_penalty",
        "values": [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2],
        "default_others": {"temperature": 0.7, "top_p": 0.85, "frequency_penalty": 0.5}
    },
    5: {
        "name": "Combination Test",
        "combinations": [
            # 팩트 기반 (정확도 우선)
            {"temperature": 0.2, "top_p": 0.5, "frequency_penalty": 0.6, "presence_penalty": 0.3, "label": "fact_based"},
            # 일반 SQL (균형)
            {"temperature": 0.7, "top_p": 0.85, "frequency_penalty": 0.5, "presence_penalty": 0.5, "label": "balanced"},
            # 창의적 (복잡한 질문용)
            {"temperature": 0.9, "top_p": 0.95, "frequency_penalty": 0.3, "presence_penalty": 0.6, "label": "creative"},
            # 보수적 (안정성 우선)
            {"temperature": 0.3, "top_p": 0.7, "frequency_penalty": 0.7, "presence_penalty": 0.4, "label": "conservative"},
        ]
    }
}

# 난이도별 테스트 쿼리
TEST_QUERIES = {
    "simple": [
        {"query": "황산 재고 있어?", "expected_table": "Reagents", "difficulty": "simple"},
        {"query": "실험 목록 보여줘", "expected_table": "Experiments", "difficulty": "simple"},
        {"query": "총 시약 개수가 몇 개야?", "expected_table": "Reagents", "difficulty": "simple"},
    ],
    "medium": [
        {"query": "가장 최근 사고 알려줘", "expected_table": "FallEvents", "difficulty": "medium"},
        {"query": "진행 중인 실험에서 사용된 시약 목록 보여줘", "expected_table": "ExperimentReagents", "difficulty": "medium"},
        {"query": "위치별 시약 재고 현황 알려줘", "expected_table": "Reagents", "difficulty": "medium"},
        {"query": "이번 달 폐기된 시약 목록", "expected_table": "ReagentDisposals", "difficulty": "medium"},
        {"query": "연구원별 실험 횟수 알려줘", "expected_table": "Experiments", "difficulty": "medium"},
        {"query": "카메라별 사고 발생 횟수", "expected_table": "FallEvents", "difficulty": "medium"},
    ],
    "complex": [
        {"query": "가장 많이 사용된 시약 TOP 3와 각각의 총 사용량 알려줘", "expected_table": "ExperimentReagents", "difficulty": "complex"},
        {"query": "최근 7일간 사고 발생 추이와 확인 처리율 분석해줘", "expected_table": "FallEvents", "difficulty": "complex"},
    ],
    "edge_case": [
        {"query": "시약 추천해줘", "expected_table": None, "difficulty": "edge_case"},  # 모호한 질문
        {"query": "가장채근삭오알여조", "expected_table": "FallEvents", "difficulty": "edge_case"},  # 오타
        {"query": "개봉일이 없는 시약 목록", "expected_table": "Reagents", "difficulty": "edge_case"},  # NULL 처리
    ],
}

# ============================================================
# 결과 데이터 구조
# ============================================================

@dataclass
class TestResult:
    query: str
    difficulty: str
    response: str
    latency_ms: float
    token_count: int
    execution_success: bool
    error_message: Optional[str] = None


@dataclass
class PhaseResult:
    phase: int
    param_name: str
    param_value: Any
    iteration: int
    results: List[TestResult]
    avg_latency: float
    success_rate: float
    timestamp: str


# ============================================================
# sql_agent.py와 동일한 설정
# ============================================================

EXAMPLES = [
    {"input": "가장 최근에 일어난 넘어짐 사고를 보고해.", "sql_cmd": "SELECT TOP 1 * FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"},
    {"input": "가장 최근에 일어난 엎어짐 사고의 시간을 보고해.", "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"},
    {"input": "Cylinder_Cam_01에서 발생한 마지막 사고가 언제야?", "sql_cmd": "SELECT TOP 1 Timestamp FROM FallEvents WHERE CameraID = 'Cylinder_Cam_01' AND Status = 'FALL_CONFIRMED' ORDER BY Timestamp DESC;"},
    {"input": "새로운 실험 세션을 만들어줘. 이름은 'Experiment_001'이고 담당자는 'Kim'이야.", "sql_cmd": "FUNCTION_CALL: create_experiment(exp_name='Experiment_001', researcher='Kim')"},
    {"input": "'Experiment_001' 실험에 데이터 추가해. 물질은 'Graphene', 부피 10.5, 밀도 2.2, 질량 23.1.", "sql_cmd": "FUNCTION_CALL: log_experiment_data(exp_name='Experiment_001', material='Graphene', volume=10.5, density=2.2, mass=23.1)"},
    {"input": "'Experiment_001'에 대한 실험 정보를 다 보여줘.", "sql_cmd": "SELECT e.exp_name, e.researcher, e.created_at, d.material, d.volume, d.density, d.mass FROM Experiments e JOIN ExperimentData d ON e.exp_id = d.exp_id WHERE e.exp_name = 'Experiment_001';"},
    {"input": "지금 확인 안 된 낙하 사고 있어?", "sql_cmd": "FUNCTION_CALL: fetch_pending_verification()"},
    {"input": "이벤트 105번은 진짜 넘어진 거 맞아. 확인 처리해줘.", "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=105, status_code=1, subject='Agent')"},
    {"input": "이벤트 106번은 센서 오류 같아. 무시해.", "sql_cmd": "FUNCTION_CALL: update_verification_status(event_id=106, status_code=2, subject='Agent')"},
    {"input": "'EXP_2024_A' 넘어짐 사고 요약해줘.", "sql_cmd": "FUNCTION_CALL: get_experiment_summary(experiment_id='EXP_2024_A')"},
    {"input": "시약 창고 Alpha 비어있어?", "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"},
    {"input": "현재 무게 얼마야?", "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"},
    {"input": "지금 저울 상태 알려줘.", "sql_cmd": "FUNCTION_CALL: get_storage_status(storage_id='Alpha')"},
    {"input": "우리 랩에 황산 재고 있어?", "sql_cmd": "SELECT * FROM Reagents WHERE name LIKE '%Sulfuric Acid%' OR name LIKE '%황산%';"},
    {"input": "수산화나트륨 얼마나 남았어?", "sql_cmd": "SELECT name, current_volume_value, current_volume_unit FROM Reagents WHERE name LIKE '%Sodium Hydroxide%' OR name LIKE '%수산화나트륨%';"}
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


def get_llm(temperature: float = 0.7, top_p: float = 1.0,
            frequency_penalty: float = 0.0, presence_penalty: float = 0.0) -> AzureChatOpenAI:
    """파라미터를 지정하여 LLM 생성"""
    return AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_DEPLOYMENT_NAME"),
        api_version=os.getenv("OPENAI_API_VERSION"),
        temperature=temperature,
        top_p=top_p,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        verbose=False
    )


def build_system_prompt() -> str:
    """시스템 프롬프트 생성"""
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
    """SQL Agent 생성"""
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

def run_single_query(agent, query_info: Dict) -> TestResult:
    """단일 쿼리 테스트"""
    query = query_info["query"]
    difficulty = query_info["difficulty"]

    start_time = time.time()
    try:
        result = agent.invoke({"input": query})
        response = result.get("output", "")
        execution_success = True
        error_message = None
    except Exception as e:
        response = ""
        execution_success = False
        error_message = str(e)

    latency_ms = (time.time() - start_time) * 1000
    token_count = len(response.split())  # 간단한 토큰 추정

    return TestResult(
        query=query,
        difficulty=difficulty,
        response=response,
        latency_ms=latency_ms,
        token_count=token_count,
        execution_success=execution_success,
        error_message=error_message
    )


def run_phase_test(
    db: SQLDatabase,
    engine,
    phase: int,
    iterations: int = 1,
    selected_difficulties: List[str] = None
) -> List[PhaseResult]:
    """Phase별 테스트 실행"""
    config = PHASE_CONFIG[phase]
    results = []

    # 테스트할 쿼리 선택
    if selected_difficulties is None:
        selected_difficulties = ["simple", "medium", "complex", "edge_case"]

    test_queries = []
    for diff in selected_difficulties:
        test_queries.extend(TEST_QUERIES.get(diff, []))

    print(f"\n{'='*70}")
    print(f"Phase {phase}: {config['name']}")
    print(f"테스트 쿼리 수: {len(test_queries)}")
    print(f"반복 횟수: {iterations}")
    print(f"{'='*70}")

    if phase == 5:
        # 조합 테스트
        for combo in config["combinations"]:
            label = combo.pop("label")
            print(f"\n  조합: {label}")
            print(f"  파라미터: {combo}")

            for iteration in range(iterations):
                print(f"    반복 {iteration + 1}/{iterations}...")

                llm = get_llm(**combo)
                agent = create_agent(llm, db, engine)

                test_results = []
                for query_info in test_queries:
                    result = run_single_query(agent, query_info)
                    test_results.append(result)

                success_rate = sum(1 for r in test_results if r.execution_success) / len(test_results)
                avg_latency = mean(r.latency_ms for r in test_results)

                phase_result = PhaseResult(
                    phase=phase,
                    param_name=label,
                    param_value=combo,
                    iteration=iteration + 1,
                    results=test_results,
                    avg_latency=avg_latency,
                    success_rate=success_rate,
                    timestamp=datetime.now().isoformat()
                )
                results.append(phase_result)

            combo["label"] = label  # 복원
    else:
        # 단일 파라미터 테스트
        param_name = config["param"]
        default_others = config["default_others"]

        for param_value in config["values"]:
            print(f"\n  {param_name}={param_value}")

            for iteration in range(iterations):
                print(f"    반복 {iteration + 1}/{iterations}...")

                # 파라미터 설정
                llm_params = {**default_others, param_name: param_value}
                llm = get_llm(**llm_params)
                agent = create_agent(llm, db, engine)

                test_results = []
                for query_info in test_queries:
                    result = run_single_query(agent, query_info)
                    test_results.append(result)
                    # 진행 상황 표시
                    status = "✓" if result.execution_success else "✗"
                    print(f"      {status} {result.query[:30]}... ({result.latency_ms:.0f}ms)")

                success_rate = sum(1 for r in test_results if r.execution_success) / len(test_results)
                avg_latency = mean(r.latency_ms for r in test_results)

                phase_result = PhaseResult(
                    phase=phase,
                    param_name=param_name,
                    param_value=param_value,
                    iteration=iteration + 1,
                    results=test_results,
                    avg_latency=avg_latency,
                    success_rate=success_rate,
                    timestamp=datetime.now().isoformat()
                )
                results.append(phase_result)

    return results


# ============================================================
# 결과 저장 및 분석
# ============================================================

def save_results(results: List[PhaseResult], output_dir: str, phase: int) -> Tuple[str, str]:
    """결과를 CSV와 JSON으로 저장"""
    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # CSV 저장 (요약)
    csv_filename = f"phase{phase}_summary_{timestamp}.csv"
    csv_filepath = os.path.join(output_dir, csv_filename)

    with open(csv_filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "phase", "param_name", "param_value", "iteration",
            "success_rate", "avg_latency_ms", "total_queries", "timestamp"
        ])
        for r in results:
            writer.writerow([
                r.phase, r.param_name, r.param_value, r.iteration,
                f"{r.success_rate:.2%}", f"{r.avg_latency:.1f}",
                len(r.results), r.timestamp
            ])

    # JSON 저장 (상세)
    json_filename = f"phase{phase}_detail_{timestamp}.json"
    json_filepath = os.path.join(output_dir, json_filename)

    json_data = []
    for r in results:
        entry = {
            "phase": r.phase,
            "param_name": r.param_name,
            "param_value": r.param_value,
            "iteration": r.iteration,
            "success_rate": r.success_rate,
            "avg_latency_ms": r.avg_latency,
            "timestamp": r.timestamp,
            "results": [asdict(tr) for tr in r.results]
        }
        json_data.append(entry)

    with open(json_filepath, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    return csv_filepath, json_filepath


def print_phase_summary(results: List[PhaseResult], phase: int):
    """Phase 결과 요약 출력"""
    config = PHASE_CONFIG[phase]

    print(f"\n{'='*70}")
    print(f"Phase {phase} 결과 요약: {config['name']}")
    print(f"{'='*70}")

    # 파라미터 값별 집계
    param_stats = {}
    for r in results:
        key = str(r.param_value)
        if key not in param_stats:
            param_stats[key] = {"success_rates": [], "latencies": []}
        param_stats[key]["success_rates"].append(r.success_rate)
        param_stats[key]["latencies"].append(r.avg_latency)

    print(f"\n{'파라미터 값':<20} {'성공률':<15} {'평균 지연시간':<15} {'표준편차':<15}")
    print("-" * 70)

    best_param = None
    best_score = -1

    for param_val, stats in param_stats.items():
        avg_success = mean(stats["success_rates"])
        avg_latency = mean(stats["latencies"])
        std_success = stdev(stats["success_rates"]) if len(stats["success_rates"]) > 1 else 0

        print(f"{param_val:<20} {avg_success:.1%}{'':>8} {avg_latency:.1f}ms{'':>7} ±{std_success:.2%}")

        # 최적 파라미터 선정 (성공률 우선, 동점시 지연시간)
        score = avg_success * 1000 - avg_latency * 0.001
        if score > best_score:
            best_score = score
            best_param = param_val

    print(f"\n⭐ 최적 파라미터: {best_param}")

    return best_param


# ============================================================
# 메인 실행
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="SQL Agent Hyperparameter Optimizer")
    parser.add_argument("--phase", type=str, default="1",
                        help="실행할 phase (1-5 또는 'all')")
    parser.add_argument("--iterations", type=int, default=3,
                        help="각 조건 반복 횟수 (기본: 3)")
    parser.add_argument("--output", type=str, default=None,
                        help="결과 저장 디렉토리")
    parser.add_argument("--difficulty", type=str, default="all",
                        help="테스트 난이도 (simple/medium/complex/edge_case/all)")

    args = parser.parse_args()

    print("="*70)
    print("SQL Agent Hyperparameter Optimizer")
    print("="*70)

    # 환경 설정
    print("\n[1/3] 환경 설정 중...")
    load_environment()

    conn_str = get_connection_string()
    engine = create_engine(conn_str, pool_pre_ping=True)
    db = SQLDatabase(engine)
    print("  완료!")

    # 출력 디렉토리 설정
    if args.output is None:
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(script_dir, "test_results")
    else:
        output_dir = args.output

    # 난이도 선택
    if args.difficulty == "all":
        difficulties = ["simple", "medium", "complex", "edge_case"]
    else:
        difficulties = [args.difficulty]

    # Phase 실행
    print("\n[2/3] 테스트 실행 중...")

    if args.phase.lower() == "all":
        phases_to_run = [1, 2, 3, 4, 5]
    else:
        phases_to_run = [int(args.phase)]

    all_results = {}
    for phase in phases_to_run:
        results = run_phase_test(
            db=db,
            engine=engine,
            phase=phase,
            iterations=args.iterations,
            selected_difficulties=difficulties
        )
        all_results[phase] = results

        # 결과 저장
        csv_path, json_path = save_results(results, output_dir, phase)
        print(f"\n  Phase {phase} 결과 저장:")
        print(f"    CSV: {csv_path}")
        print(f"    JSON: {json_path}")

        # 요약 출력
        best_param = print_phase_summary(results, phase)

    # 최종 요약
    print("\n" + "="*70)
    print("[3/3] 테스트 완료!")
    print("="*70)
    print(f"\n결과 파일 위치: {output_dir}")
    print("\n다음 단계:")
    print("  1. CSV 파일로 성능 비교")
    print("  2. JSON 파일로 상세 분석")
    print("  3. 최적 파라미터를 sql_agent.py에 적용")


if __name__ == "__main__":
    main()
