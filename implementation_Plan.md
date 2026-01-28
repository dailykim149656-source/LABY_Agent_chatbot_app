코드베이스 구조 분석 및 확장성 평가 보고서
본 보고서는 LABY_Agent_chatbot_app 프로젝트의 전체 코드를 분석하여, 객체 지향 설계 (OOP), 소프트 코딩 원칙, 그리고 향후 기능 확장 및 B/E-F/E 연동 시 충돌 가능성을 평가합니다.

1. 분석 개요
   항목 경로 프레임워크/언어
   Backend backend/ FastAPI (Python)
   Frontend chemical-sample-dashboard/ Next.js 14 (TypeScript, React)
2. Backend 구조 분석
   2.1 디렉토리 구조
   backend/
   ├── main.py # FastAPI 앱 팩토리 (create_app)
   ├── schemas.py # Pydantic 스키마 (데이터 계약)
   ├── sql_agent.py # LangChain SQL Agent 로직
   ├── routers/ # API 엔드포인트 (기능별 분리)
   │ ├── chat.py, accidents.py, logs.py, safety.py, health.py
   └── services/
   └── agent_service.py # Agent 초기화 로직
   2.2 평가
   평가 항목 결과 상세
   라우터 분리 ✅ 우수 기능별로
   chat
   ,
   accidents
   , logs,
   safety
   등 라우터가 분리되어 있어 신규 기능 추가 시 기존 코드 수정 없이 새로운 라우터 파일 생성으로 확장 가능.
   스키마 정의 ✅ 우수
   schemas.py
   에 Pydantic 모델로 Request/Response 데이터 타입이 명확히 정의되어 있음. 새로운 기능에 대한 스키마 추가도 이 파일에서 가능.
   서비스 레이어 ⚠️ 개선 여지 services/ 폴더가 존재하나, 현재
   agent_service.py
   만 있음. 향후 비즈니스 로직 분리가 권장됨 (예: reagent_service.py, experiment_service.py).
   SQL Agent 모듈 ✅ 확장 용이
   sql_agent.py
   의
   create_conversational_agent
   에서 커스텀 Tool들을 extra_tools 리스트에 추가하는 방식으로 새 기능(Tool) 추가 시 기존 코드 변경 최소화.
   하드코딩 여부 ✅ 양호 환경 변수(
   .env
   )로 DB 연결 정보, API Key 등을 관리. 하드코딩된 값 없음.
   OOP 활용 ⚠️ 부분적 Python 함수 기반으로 작성되어 있으며, 클래스 기반 OOP는 제한적으로 사용됨. 향후 Service Layer 등을 클래스로 리팩토링 시 유지보수성 향상 가능.
   2.3 확장 시 권장 패턴 (Backend)
   backend/
   ├── routers/
   │ ├── experiments.py # [NEW] 실험 관리 API
   │ └── reagents.py # [NEW] 시약 관리 API
   ├── services/
   │ ├── experiment_service.py # [NEW] 실험 비즈니스 로직
   │ └── reagent_service.py # [NEW] 시약 비즈니스 로직
   └── schemas.py # 새로운 Pydantic 모델 추가
   결론: 신규 B/E 기능은 별도의 라우터 파일을 생성하여
   main.py
   에서 app.include_router()로 등록하는 방식으로 기존 코드 충돌 없이 확장 가능.

3. Frontend 구조 분석
   3.1 디렉토리 구조
   chemical-sample-dashboard/
   ├── app/
   │ ├── page.tsx # 메인 대시보드 (탭 라우팅)
   │ └── layout.tsx # 전역 레이아웃
   ├── components/
   │ └── dashboard/ # 대시보드 전용 컴포넌트
   │ ├── chat-interface.tsx
   │ ├── experiments-view.tsx
   │ ├── reagents-view.tsx
   │ ├── safety-status.tsx
   │ └── ...
   ├── lib/
   │ ├── api.ts # 공용 fetchJson 함수 (Backend 통신)
   │ └── reagent-inventory.ts # 더미 데이터 (Master Reagent 목록)
   └── hooks/
   3.2 평가
   평가 항목 결과 상세
   컴포넌트 분리 ✅ 우수 각 View (
   experiments-view.tsx
   ,
   reagents-view.tsx
   등)가 독립적인 컴포넌트로 분리되어 있음.
   API 추상화 ✅ 우수
   lib/api.ts
   에
   fetchJson
   함수가 정의되어 있어, 모든 Backend 호출이 이 함수를 통해 이루어짐. 새로운 API 연동 시 일관된 패턴 적용 가능.
   더미 데이터 분리 ✅ 우수
   lib/reagent-inventory.ts
   에 더미 데이터가 별도 파일로 분리되어 있음. 향후 B/E 연동 시 해당 파일의 import만 수정하거나, useEffect에서 API 호출로 대체 가능.
   하드코딩 API URL ✅ 양호
   lib/api.ts
   에서 NEXT_PUBLIC_API_BASE_URL 환경 변수 또는 기본값(localhost:8000)을 사용.
   데이터 Fetching 패턴 ⚠️ 일부 혼재 일부 컴포넌트 (
   chat-interface.tsx
   ,
   safety-status.tsx
   )는 API 호출을 통해 데이터를 가져오나, 다른 컴포넌트(
   experiments-view.tsx
   ,
   reagents-view.tsx
   )는 로컬 더미 데이터를 사용.
   3.3 현재 더미 데이터 사용 현황
   Component Data Source 연동 가능 방법
   chat-interface.tsx
   ✅
   fetchJson("/api/chat")
   연동 완료
   safety-status.tsx
   ✅
   fetchJson("/api/safety/status")
   연동 완료
   experiments-view.tsx
   ❌ 로컬 initialExperimentsData useEffect +
   fetchJson("/api/experiments")
   추가 필요
   reagents-view.tsx
   ❌
   lib/reagent-inventory.ts
   import useEffect +
   fetchJson("/api/reagents")
   추가 필요
   accident-status.tsx
   ✅
   fetchJson("/api/accidents")
   연동 완료
   3.4 확장 시 권장 패턴 (Frontend)
   현재 더미 데이터를 사용하는 컴포넌트를 B/E 연동으로 전환하는 방법:

// experiments-view.tsx 예시 (Before: 더미 데이터)
const [experiments, setExperiments] = useState<Experiment[]>(initialExperimentsData)
// After: B/E 연동
const [experiments, setExperiments] = useState<Experiment[]>([])
const [loading, setLoading] = useState(true)
useEffect(() => {
const fetchData = async () => {
try {
const data = await fetchJson<Experiment[]>("/api/experiments")
setExperiments(data)
} catch (e) {
console.error(e)
setExperiments(initialExperimentsData) // Fallback to dummy
} finally {
setLoading(false)
}
}
fetchData()
}, [])
결론: Frontend 더미 데이터는 기존 컴포넌트 코드 내 useEffect 로직 추가로 B/E 데이터로 교체 가능. 별도 파일 생성 필요 없이 점진적 연동 가능.

4. 종합 평가 및 권장 사항
   4.1 확장성 평가
   항목 평가 근거
   B/E 신규 기능 추가 ✅ 충돌 없음 라우터 파일 분리, 스키마 중앙 관리, Agent Tool 확장성 우수
   F/E-B/E 연동 ✅ 용이
   lib/api.ts
   공용 함수 사용, 더미 데이터 분리
   OOP 적용 ⚠️ 개선 권장 B/E Service Layer 클래스화, F/E Custom Hook 분리 권장
   4.2 향후 권장 작업 (선택 사항)
   Backend Service Layer 클래스화:

services/experiment_service.py 등을 클래스로 구현하여 의존성 주입(DI) 및 테스트 용이성 확보.
Frontend Custom Hook 분리:

데이터 Fetching 로직을 hooks/use-experiments.ts 등으로 분리하여 재사용성 및 테스트 용이성 향상.
B/E API 우선 개발 후 F/E 연동:

신규 기능 개발 시 B/E API (Router + Schema) 먼저 구현.
F/E에서 해당 API 호출 로직을 useEffect로 추가하여 연동.
기존 더미 데이터는 Fallback으로 유지하거나 제거.

5. 결론
   현재 코드베이스는 구조적으로 잘 분리되어 있으며, 신규 B/E 기능 추가 시 별도 파일 생성으로 충돌 없이 확장이 가능합니다. F/E의 더미 데이터 역시 useEffect + API 호출 패턴으로 점진적 교체가 가능하여, B/E-F/E 연동 작업 시 기존 코드 수정을 최소화할 수 있습니다.

다만, OOP 원칙 강화를 위해 Service Layer 클래스화 및 Custom Hook 분리를 권장합니다.

Comment
Ctrl+Alt+M
