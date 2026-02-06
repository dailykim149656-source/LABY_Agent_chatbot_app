# coding_guide.md 기반 코드 리뷰 리포트

작성일: 2026-02-05
검증 대상: Backend (FastAPI) + Frontend (Next.js)
검증 기준: `coding_guide.md` 원칙 (소프트 코딩, 계층 분리, 충돌 방지 규칙)

---

## 검증 요약

| 영역 | 상태 | 주요 이슈 |
|------|------|-----------|
| FE/BE 타입 정합성 | **위반** | ExperimentStatus enum 불일치, ReagentCreateRequest 스키마 불일치 |
| API 계약 준수 | **부분 위반** | ExperimentStatus 코드값 미사용 (한글 라벨 사용 중) |
| BE 계층 분리 | **부분 위반** | reagents.py Router에서 직접 DB 접근 |
| FE 계층 분리 | **부분 위반** | HazardTooltip 컴포넌트에서 직접 fetch() |
| 소프트 코딩 원칙 | **부분 위반** | 하드코딩 자격증명, 상태값 문자열 직접 사용 |
| DB 스키마 규칙 | **부분 위반** | FallEvents 테이블 누락, 컬럼 네이밍 혼용 |

---

## CRITICAL 이슈 (즉시 수정 필요)

### C-1. ExperimentStatus enum FE/BE/API 계약 불일치

**coding_guide 원칙 위반**: Section 5 "상태값 통일: FE/BE enum 불일치 금지", Section 2 "상태/라벨은 코드값(enum) + UI 매핑으로 처리"

| 소스 | 현재 값 |
|------|---------|
| `api_contract.md` (Section 4) | `in_progress \| completed \| pending` |
| `backend/schemas.py:85` | `Literal["진행중", "대기", "완료"]` |
| `chemical-sample-dashboard/lib/types.ts:6` | `"진행중" \| "대기" \| "완료"` |

**문제**: API 계약은 영문 코드값을 명시하지만, FE/BE 모두 한글 라벨을 코드값으로 사용.
**영향**: i18n 확장 시 상태값이 특정 언어에 종속됨.
**수정 방향**: `in_progress/completed/pending`으로 통일 후 UI 라벨 매핑 분리.

---

### C-2. ExperimentCreateRequest 기본값 타입 버그

**위치**: `backend/schemas.py:130`

```python
class ExperimentCreateRequest(BaseModel):
    status: Optional[ExperimentStatus] = "pending"  # "pending"은 Literal에 없음!
```

`ExperimentStatus = Literal["진행중", "대기", "완료"]`에서 `"pending"`은 유효하지 않은 값.
Pydantic v2에서는 validation 오류 발생 가능.

---

### C-3. ReagentCreateRequest FE/BE 스키마 완전 불일치

**coding_guide 원칙 위반**: Section 8(A-2) "타입/상태값 단일 소스"

| 필드 | BE (schemas.py) | FE (types.ts) |
|------|-----------------|---------------|
| 이름 | `reagent_name: str` | `name: string` |
| 전체 용량 | `total_capacity: float` | `originalVolume: Quantity` |
| 현재 용량 | `current_volume: float` | `currentVolume?: Quantity \| null` |
| 순도 | `purity: Optional[float]` | `purity: number` (필수) |
| 화학식 | `formula: Optional[str]` | `formula: string` (필수) |
| ID | 없음 | `id?: string \| null` |
| 상태 | 없음 | `status?: ReagentStatus \| null` |
| 개봉일 | 없음 | `openDate?: string \| null` |

**영향**: FE에서 시약 추가 요청 시 BE 검증 실패 또는 데이터 누락.

---

### C-4. 하드코딩 DB 자격증명 (보안)

**위치**: `backend/routers/reagents.py:57-67`

```python
connection_url = URL.create(
    "mssql+pyodbc",
    username="ai3rdteamsql",           # 하드코딩
    password="Korea20261775!!",        # 하드코딩
    host="8ai-3rd-team-sql-db...",     # 하드코딩
    database="smart-lab-3rd-team-8ai", # 하드코딩
)
```

**coding_guide 원칙 위반**: Section 2 "환경/모드 분리"
**참고**: 같은 파일 `load_dotenv()`가 있음에도 사용하지 않음.
**수정 방향**: `os.getenv()`로 전환 (`sql_agent.py`의 `get_connection_string()` 패턴 참조).

---

### C-5. Router에서 직접 DB 접근 (계층 위반)

**위치**: `backend/routers/reagents.py:85-158` (`search_hazard` 엔드포인트)

**coding_guide 원칙 위반**: Section 3 "Router: 요청/응답 처리만 담당"

```
현재: Router → 직접 SQL 실행
기대: Router → Service → Repository → DB
```

Router에서 `engine.connect()` + `conn.execute(text(...))` 직접 실행 중.
**수정 방향**:
- `services/hazard_service.py` 생성
- `repositories/hazard_repo.py` 생성
- Router는 Service만 호출

---

### C-6. FallEvents 테이블 미생성

**위치**: `backend/sql_agent.py` - `init_db_schema()`에 FallEvents CREATE TABLE 없음

LLM 도구에서 참조하는 FallEvents 테이블:
- `fetch_pending_verification()` (line 565)
- `update_verification_status()` (line 599)
- `get_experiment_summary()` (line 628)

**영향**: 해당 도구 호출 시 런타임 SQL 에러 발생.
**수정 방향**: `init_db_schema()`에 FallEvents CREATE TABLE 추가.

---

## HIGH 이슈 (수정 권장)

### H-1. FE 컴포넌트에서 직접 API 호출

**위치**: `chemical-sample-dashboard/components/dashboard/reagents-view.tsx:116-118`

```typescript
// HazardTooltip 컴포넌트 내부
const res = await fetch(
  `${API_BASE_URL}/api/reagents/hazard-info?chem_name=${encodeURIComponent(chemName)}`,
  { signal: controller.signal },
);
```

**coding_guide 원칙 위반**: Section 3(FE) "Component: UI만 담당", Section 8(D-8) "API 연동은 hooks/ 및 lib/data/에서 처리"

**수정 방향**:
1. `lib/data/reagents.ts`에 `fetchHazardInfo()` 함수 추가
2. 필요 시 `hooks/use-reagents.ts`에 hook 추가
3. 컴포넌트는 hook만 사용

---

### H-2. 데드 코드 (도달 불가능한 return)

**위치**: `backend/services/reagents_service.py`

```python
# Line 39
return ReagentItem(...)
return item  # 도달 불가, 'item' 미정의

# Line 84
return ReagentDisposalResponse(...)
return item  # 도달 불가, 'item' 미정의
```

copy-paste 오류로 보임. 삭제 필요.

---

### H-3. Router에 비즈니스 로직 (캐시)

**위치**: `backend/routers/reagents.py:29-51`

LRU 캐시 + TTL 로직이 Router에 위치.
**수정 방향**: Service 계층으로 이동.

---

## MEDIUM 이슈 (개선 권장)

### M-1. DB 컬럼 네이밍 불일치

| 테이블 | 네이밍 | 예시 |
|--------|--------|------|
| WeightLog | PascalCase | `LogID`, `StorageID`, `WeightValue` |
| Users, Reagents 등 | snake_case | `user_id`, `created_at`, `reagent_id` |

**수정 방향**: 신규 테이블은 snake_case 통일, 기존은 하위 호환 유지.

### M-2. 상태값 하드코딩

다수 파일에서 `"normal"`, `"disposed"` 등 문자열 직접 사용.

| 파일 | 위치 | 값 |
|------|------|----|
| `reagents_service.py:37` | status 기본값 | `"normal"` |
| `reagents_service.py:57` | purity 기본값 | `100.0` |
| `reagents_repo.py:47` | INSERT 상태값 | `'normal'` |
| `reagents_repo.py:78` | UPDATE 상태값 | `'disposed'` |

**수정 방향**: `schemas.py`의 Enum/Literal 상수 사용.

### M-3. 캐시 매직넘버

`routers/reagents.py`에서 캐시 설정값이 상수로 정의되지 않음:
- TTL: `300` (초)
- Max size: `256` (건)
- Timeout: `10` (초)

**수정 방향**: config 파일 또는 환경변수로 분리.

---

## 준수 사항 (양호)

| 영역 | 상태 | 비고 |
|------|------|------|
| Experiments 계층 분리 (BE) | **완벽 준수** | Router → Service → Repository |
| Monitoring 계층 분리 | **완벽 준수** | Router/Hook/Component |
| Experiments 계층 분리 (FE) | **완벽 준수** | API Client → Hook → Component |
| DB FK 타입 정합성 | **완벽 준수** | 모든 FK가 PK 타입과 일치 |
| Mock 플래그 | **준수** | `USE_MOCKS` 정상 구현 |
| api_contract.md 유지 | **대부분 준수** | ExperimentStatus 제외 엔드포인트 일치 |
| additive DB 스키마 | **대부분 준수** | DROP TABLE은 env flag로 보호됨 |
| FE 타입 단일 소스 | **준수** | `lib/types.ts`에만 정의 |
| BE 타입 단일 소스 | **준수** | `schemas.py`에만 정의 |

---

## 권장 수정 우선순위

1. **C-4**: 하드코딩 자격증명 제거 (보안) → 즉시
2. **C-1 + C-2**: ExperimentStatus 통일 (`in_progress/completed/pending`) → 이번 스프린트
3. **C-3**: ReagentCreateRequest FE/BE 동기화 → 이번 스프린트
4. **C-5 + H-3**: reagents.py 계층 분리 리팩토링 → 이번 스프린트
5. **C-6**: FallEvents 테이블 추가 → DB 스키마 변경 시
6. **H-1**: HazardTooltip API 호출 분리 → 다음 스프린트
7. **H-2**: 데드 코드 제거 → 바로 가능
8. **M-1~3**: 네이밍/하드코딩 정리 → 점진적 개선
