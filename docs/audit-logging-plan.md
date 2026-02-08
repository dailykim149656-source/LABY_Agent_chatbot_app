# 감사 로깅(Audit Logging) 구현 계획서

> **작성일:** 2026-02-08
> **대상 프로젝트:** LABY Agent Chatbot App
> **목적:** 사용자 행위 전체를 DB에 기록하여 "누가, 언제, 무엇을" 했는지 추적

---

## 1. 현재 상태 분석

### 1.1 기존 로깅 현황

| 로깅 시스템 | 테이블 | 추적 범위 | 비고 |
|---|---|---|---|
| AuthLogs | `AuthLogs` | 로그인/로그아웃 | IP, User-Agent 포함 |
| ChatLogs | `ChatLogs` | 채팅 명령어 | 레거시, user_name 기반 |

### 1.2 현재 커버리지

- **전체 쓰기 작업:** 31개
- **로깅되는 작업:** 3개 (로그인, 로그아웃, 채팅)
- **커버리지:** 약 **9.7%**

### 1.3 미추적 작업 목록 (28개)

| 카테고리 | 엔드포인트 | 작업 | 인증 여부 |
|---|---|---|---|
| **인증** | `POST /api/auth/signup` | 회원가입 | X |
| | `PATCH /api/auth/me` | 프로필 수정 | O |
| | `DELETE /api/auth/me` | 계정 삭제 | O |
| | `POST /api/auth/refresh` | 토큰 갱신 | CSRF만 |
| | `POST /api/auth/dev-login` | 개발용 로그인 | X |
| **사용자 관리** | `POST /api/users` | 사용자 생성 (관리자) | O (Admin) |
| | `PATCH /api/users/{id}` | 사용자 수정 (관리자) | O (Admin) |
| | `DELETE /api/users/{id}` | 사용자 비활성화 (관리자) | O (Admin) |
| | `PATCH /api/users/{id}/password` | 비밀번호 초기화 (관리자) | O (Admin) |
| | `DELETE /api/users/{id}/hard` | 사용자 영구삭제 (관리자) | O (Admin) |
| | `DELETE /api/users/{id}/auth-logs` | 인증로그 삭제 (관리자) | O (Admin) |
| | `DELETE /api/users/auth-logs` | 전체 인증로그 삭제 (관리자) | O (Admin) |
| **실험** | `POST /api/experiments` | 실험 등록 | X |
| | `PATCH /api/experiments/{id}` | 실험 수정 | X |
| | `PATCH /api/experiments/{id}/memo` | 메모 수정 | X |
| | `DELETE /api/experiments/{id}` | 실험 삭제 | X |
| | `POST /api/experiments/{id}/reagents` | 시약 투입 기록 | X |
| | `DELETE /api/experiments/{id}/reagents/{uid}` | 시약 투입 취소 | X |
| **시약** | `POST /api/reagents` | 시약 등록 | X |
| | `PATCH /api/reagents/{id}` | 시약 수정 | X |
| | `POST /api/reagents/{id}/dispose` | 시약 폐기 | X |
| | `POST /api/reagents/{id}/restore` | 시약 복원 | X |
| | `DELETE /api/reagents/disposals` | 폐기 이력 전체 삭제 | X |
| | `DELETE /api/reagents/{id}` | 시약 영구삭제 | X |
| **채팅** | `POST /api/chat/rooms` | 채팅방 생성 | X |
| | `PATCH /api/chat/rooms/{id}` | 채팅방 제목 수정 | X |
| | `DELETE /api/chat/rooms/{id}` | 채팅방 삭제 | X |
| | `POST /api/chat/rooms/{id}/messages` | 메시지 전송 | X |
| **사고** | `PATCH /api/accidents/{id}` | 사고 확인/오탐 처리 | X |

> **주요 이슈:** 19개 엔드포인트가 인증 없이 공개 접근 가능

---

## 2. AuditLogs 테이블 설계

### 2.1 스키마

```sql
CREATE TABLE AuditLogs (
    audit_id      BIGINT        IDENTITY(1,1) PRIMARY KEY,
    -- 행위자 정보
    actor_user_id INT           NULL,           -- FK → Users(user_id), NULL = 미인증 사용자
    actor_name    NVARCHAR(100) NULL,           -- 당시 사용자 이름 (스냅샷)
    actor_ip      NVARCHAR(45)  NULL,           -- 클라이언트 IP
    -- 행위 정보
    action        NVARCHAR(50)  NOT NULL,       -- 'create', 'update', 'delete', 'login', 'verify' 등
    category      NVARCHAR(30)  NOT NULL,       -- 'auth', 'user', 'experiment', 'reagent', 'chat', 'accident'
    -- 대상 정보
    resource_type NVARCHAR(50)  NOT NULL,       -- 'User', 'Experiment', 'Reagent', 'ChatRoom' 등
    resource_id   NVARCHAR(50)  NULL,           -- 대상 리소스 ID
    -- 변경 내용
    summary       NVARCHAR(500) NULL,           -- 사람이 읽을 수 있는 요약 (예: "실험 #3 상태를 '완료'로 변경")
    details       NVARCHAR(MAX) NULL,           -- JSON: 변경 전후 데이터 (선택적)
    -- 메타데이터
    endpoint      NVARCHAR(200) NULL,           -- 'PATCH /api/experiments/3'
    created_at    DATETIME2     DEFAULT SYSUTCDATETIME()
);
```

### 2.2 인덱스

```sql
-- 사용자별 조회 (관리자 대시보드)
CREATE INDEX idx_audit_actor    ON AuditLogs (actor_user_id, created_at DESC);
-- 카테고리별 조회
CREATE INDEX idx_audit_category ON AuditLogs (category, created_at DESC);
-- 리소스별 조회 (변경 이력 추적)
CREATE INDEX idx_audit_resource ON AuditLogs (resource_type, resource_id, created_at DESC);
-- 시간 범위 조회
CREATE INDEX idx_audit_time     ON AuditLogs (created_at DESC);
```

### 2.3 기존 AuthLogs와의 관계

| 항목 | AuthLogs | AuditLogs |
|---|---|---|
| 목적 | 인증 보안 감사 | 전체 행위 추적 |
| 범위 | 로그인/로그아웃만 | 모든 쓰기 작업 |
| 유지 | 기존 유지 (보안 전용) | 새로 추가 |

> AuthLogs는 삭제하지 않고 기존 기능 유지. AuditLogs는 별도로 모든 행위를 포괄 기록.

---

## 3. 백엔드 구현 설계

### 3.1 파일 구조

```
backend/
├── repositories/
│   └── audit_repo.py          # (신규) AuditLogs DB 접근
├── services/
│   └── audit_service.py       # (신규) 감사 로깅 비즈니스 로직
├── schemas.py                 # AuditLogEntry 스키마 추가
└── routers/
    └── audit.py               # (신규) 감사 로그 조회 API
```

### 3.2 audit_repo.py

```python
# backend/repositories/audit_repo.py

def insert_audit_log(engine, *, actor_user_id, actor_name, actor_ip,
                     action, category, resource_type, resource_id,
                     summary, details, endpoint) -> int:
    """감사 로그 1건 삽입, audit_id 반환"""

def list_audit_logs(engine, *, category=None, actor_user_id=None,
                    resource_type=None, resource_id=None,
                    from_date=None, to_date=None,
                    limit=100, offset=0) -> List[Dict]:
    """필터 조건으로 감사 로그 조회"""

def count_audit_logs(engine, **filters) -> int:
    """필터 조건에 맞는 총 건수"""
```

### 3.3 audit_service.py

```python
# backend/services/audit_service.py
from fastapi import Request

def log_action(engine, request: Request, *,
               action: str,
               category: str,
               resource_type: str,
               resource_id: str = None,
               summary: str = None,
               details: dict = None,
               actor_override: dict = None):
    """
    감사 로그 기록 헬퍼.

    - request에서 IP, 인증 정보 자동 추출
    - actor_override: 인증 미적용 라우터에서 수동으로 actor 정보 전달 시 사용
    - 비동기 실패 시에도 메인 로직에 영향 없도록 예외 무시
    """
    try:
        # 1. 행위자 정보 추출
        user = getattr(request.state, "user", None)
        actor_user_id = user["user_id"] if user else actor_override.get("user_id") if actor_override else None
        actor_name = user["name"] if user else actor_override.get("name") if actor_override else None
        actor_ip = request.client.host if request.client else None

        # 2. 엔드포인트 정보
        endpoint_str = f"{request.method} {request.url.path}"

        # 3. DB 삽입
        audit_repo.insert_audit_log(
            engine,
            actor_user_id=actor_user_id,
            actor_name=actor_name,
            actor_ip=actor_ip,
            action=action,
            category=category,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            summary=summary,
            details=json.dumps(details, ensure_ascii=False) if details else None,
            endpoint=endpoint_str,
        )
    except Exception as e:
        logger.warning(f"Audit log failed: {e}")
```

### 3.4 라우터 적용 예시

**인증된 엔드포인트 (user 자동 추출):**

```python
# backend/routers/users.py
@router.patch("/{user_id}")
async def update_user(user_id: int, body: UpdateUserBody, request: Request,
                      admin=Depends(require_admin), ...):
    result = users_service.update_user(engine, user_id, body)

    audit_service.log_action(
        engine, request,
        action="update",
        category="user",
        resource_type="User",
        resource_id=user_id,
        summary=f"사용자 #{user_id} 정보 수정",
        details={"changed_fields": body.dict(exclude_unset=True)},
    )
    return result
```

**미인증 엔드포인트 (actor 수동 전달):**

```python
# backend/routers/experiments.py
@router.post("")
async def create_experiment(body: CreateExperimentBody, request: Request):
    exp = experiments_service.create(engine, body)

    audit_service.log_action(
        engine, request,
        action="create",
        category="experiment",
        resource_type="Experiment",
        resource_id=exp["exp_id"],
        summary=f"실험 '{body.title}' 등록 (연구자: {body.researcher})",
        actor_override={"name": body.researcher},
    )
    return exp
```

### 3.5 감사 로그 조회 API

```python
# backend/routers/audit.py

@router.get("")       # GET /api/audit?category=experiment&limit=50
@router.get("/{audit_id}")  # GET /api/audit/123
```

> 관리자 전용 (`Depends(require_admin)`)으로 보호

---

## 4. 접근 제어 — 관리자 전용

### 4.1 백엔드 API 보호

감사 로그 조회 API는 **관리자만 접근 가능**하도록 보호합니다.

```python
# backend/routers/audit.py
router = APIRouter(
    prefix="/api/audit",
    tags=["audit"],
    dependencies=[Depends(require_admin), Depends(csrf_protect)],  # 관리자 + CSRF
)
```

> 기존 `routers/users.py`, `routers/consents.py`와 동일한 패턴 적용.
> 일반 사용자(`role="user"`)는 403 Forbidden 반환.

### 4.2 프론트엔드 — Users 탭 내 감사 로그 섹션

기존 **Users 탭** (`components/dashboard/users-view.tsx`)에 감사 로그 뷰어를 통합합니다.
Users 탭은 이미 `adminOnly: true`로 설정되어 있어 일반 사용자에게 노출되지 않습니다.

**UI 구조:**

```
Users 탭
├── 사용자 목록 (기존)
│   ├── 사용자 행 클릭 → 인증 로그 팝오버 (기존)
│   └── 관리 버튼들 (기존)
│
└── 감사 로그 섹션 (신규) ─── 토글/탭으로 전환
    ├── 필터 바
    │   ├── 카테고리 드롭다운 (auth, user, experiment, reagent, chat, accident)
    │   ├── 사용자 검색
    │   ├── 날짜 범위 선택
    │   └── 리소스 타입 필터
    ├── 로그 테이블
    │   ├── 시간 | 사용자 | 행위 | 카테고리 | 대상 | 요약
    │   └── 페이지네이션
    ├── 행 클릭 → 상세 보기 (details JSON 표시)
    └── CSV 다운로드 버튼
```

**구현 방식:**

```tsx
// users-view.tsx 내부에 서브탭 추가
const [subTab, setSubTab] = useState<"users" | "audit">("users");

// 또는 별도 컴포넌트로 분리
// components/dashboard/audit-log-viewer.tsx (신규)
```

### 4.3 이중 보호 요약

| 계층 | 보호 방식 | 미인증/일반 사용자 |
|---|---|---|
| **백엔드 API** | `Depends(require_admin)` + `Depends(csrf_protect)` | 403 Forbidden |
| **프론트엔드 탭** | `adminOnly: true` (header.tsx) | 탭 자체가 렌더링 안 됨 |
| **프론트엔드 API 호출** | admin 토큰 없으면 요청 자체 실패 | 데이터 접근 불가 |

---

## 5. 구현 우선순위

### Phase 1: 핵심 인프라 (필수)

| 순서 | 작업 | 파일 |
|---|---|---|
| 1 | AuditLogs 테이블 생성 | SQL 스크립트 |
| 2 | audit_repo.py 생성 | `backend/repositories/audit_repo.py` |
| 3 | audit_service.py 생성 | `backend/services/audit_service.py` |
| 4 | AuditLog 스키마 추가 | `backend/schemas.py` |

### Phase 2: 인증된 라우터 적용 (높은 우선순위)

이미 `user` 정보를 확인할 수 있는 엔드포인트부터 적용:

| 순서 | 라우터 | 작업 수 | 비고 |
|---|---|---|---|
| 5 | `routers/auth.py` | 5개 | 회원가입, 프로필수정, 계정삭제, 토큰갱신, 개발로그인 |
| 6 | `routers/users.py` | 7개 | 전체 관리자 작업 |

### Phase 3: 미인증 라우터 적용 (중간 우선순위)

`actor_override`로 가용 정보(연구자명 등)를 전달:

| 순서 | 라우터 | 작업 수 | actor 소스 |
|---|---|---|---|
| 7 | `routers/experiments.py` | 6개 | body.researcher |
| 8 | `routers/reagents.py` | 6개 | body.disposedBy 등 |
| 9 | `routers/accidents.py` | 1개 | body.verify_subject |

### Phase 4: 채팅 라우터 적용 (낮은 우선순위)

| 순서 | 라우터 | 작업 수 | 비고 |
|---|---|---|---|
| 10 | `routers/chat_rooms.py` | 4개 | 기존 ChatLogs와 중복 주의 |
| 11 | `routers/chat.py` | 1개 | 레거시 채팅 |

### Phase 5: 조회 API 및 프론트엔드

| 순서 | 작업 | 파일 |
|---|---|---|
| 12 | audit 라우터 생성 (관리자 전용) | `backend/routers/audit.py` |
| 13 | main.py에 라우터 등록 | `backend/main.py` |
| 14 | audit-log-viewer 컴포넌트 생성 | `components/dashboard/audit-log-viewer.tsx` |
| 15 | users-view.tsx에 감사 로그 서브탭 통합 | `components/dashboard/users-view.tsx` |

---

## 6. action / category 값 정의

### 6.1 action 값

| action | 설명 | 예시 |
|---|---|---|
| `create` | 새 리소스 생성 | 실험 등록, 시약 추가, 채팅방 생성 |
| `update` | 기존 리소스 수정 | 실험 수정, 시약 정보 변경 |
| `delete` | 리소스 삭제 | 실험 삭제, 시약 영구삭제 |
| `delete_hard` | 영구 삭제 | 사용자 영구삭제 |
| `deactivate` | 비활성화 | 사용자 비활성화 (soft delete) |
| `login` | 로그인 | 일반 로그인, 개발 로그인 |
| `signup` | 회원가입 | 신규 가입 |
| `logout` | 로그아웃 | 세션 종료 |
| `verify` | 확인 처리 | 사고 확인 |
| `reject` | 오탐 처리 | 사고 오탐 |
| `dispose` | 폐기 처리 | 시약 폐기 |
| `restore` | 복원 | 시약 복원 |
| `reset_password` | 비밀번호 초기화 | 관리자 비밀번호 리셋 |
| `send_message` | 메시지 전송 | 채팅 메시지 |
| `use_reagent` | 시약 투입 | 실험에 시약 사용 |
| `remove_reagent` | 시약 투입 취소 | 실험에서 시약 제거 |
| `clear_logs` | 로그 일괄 삭제 | 인증로그 전체 삭제, 폐기이력 전체 삭제 |

### 6.2 category 값

| category | 대상 라우터 |
|---|---|
| `auth` | auth.py |
| `user` | users.py |
| `experiment` | experiments.py |
| `reagent` | reagents.py |
| `chat` | chat.py, chat_rooms.py |
| `accident` | accidents.py |

### 6.3 resource_type 값

| resource_type | DB 테이블 |
|---|---|
| `User` | Users |
| `Experiment` | Experiments |
| `ExperimentReagent` | ExperimentReagents |
| `Reagent` | Reagents |
| `ReagentDisposal` | ReagentDisposals |
| `ChatRoom` | ChatRooms |
| `ChatMessage` | ChatMessages |
| `FallEvent` | FallEvents |
| `AuthLog` | AuthLogs |

---

## 7. 전체 엔드포인트-로그 매핑

| # | 엔드포인트 | action | category | resource_type | summary 템플릿 |
|---|---|---|---|---|---|
| 1 | `POST /api/auth/signup` | signup | auth | User | "{name} 회원가입" |
| 2 | `PATCH /api/auth/me` | update | auth | User | "프로필 수정 ({fields})" |
| 3 | `DELETE /api/auth/me` | delete | auth | User | "계정 삭제" |
| 4 | `POST /api/auth/refresh` | update | auth | User | "토큰 갱신" |
| 5 | `POST /api/auth/dev-login` | login | auth | User | "개발 로그인" |
| 6 | `POST /api/users` | create | user | User | "관리자가 사용자 '{name}' 생성" |
| 7 | `PATCH /api/users/{id}` | update | user | User | "사용자 #{id} 정보 수정" |
| 8 | `DELETE /api/users/{id}` | deactivate | user | User | "사용자 #{id} 비활성화" |
| 9 | `PATCH /api/users/{id}/password` | reset_password | user | User | "사용자 #{id} 비밀번호 초기화" |
| 10 | `DELETE /api/users/{id}/hard` | delete_hard | user | User | "사용자 #{id} 영구삭제" |
| 11 | `DELETE /api/users/{id}/auth-logs` | clear_logs | user | AuthLog | "사용자 #{id} 인증로그 삭제" |
| 12 | `DELETE /api/users/auth-logs` | clear_logs | user | AuthLog | "전체 인증로그 삭제" |
| 13 | `POST /api/experiments` | create | experiment | Experiment | "실험 '{title}' 등록" |
| 14 | `PATCH /api/experiments/{id}` | update | experiment | Experiment | "실험 #{id} 수정" |
| 15 | `PATCH /api/experiments/{id}/memo` | update | experiment | Experiment | "실험 #{id} 메모 수정" |
| 16 | `DELETE /api/experiments/{id}` | delete | experiment | Experiment | "실험 #{id} 삭제" |
| 17 | `POST /api/experiments/{id}/reagents` | use_reagent | experiment | ExperimentReagent | "실험 #{id}에 시약 투입" |
| 18 | `DELETE /api/experiments/{id}/reagents/{uid}` | remove_reagent | experiment | ExperimentReagent | "실험 #{id}에서 시약 투입 취소" |
| 19 | `POST /api/reagents` | create | reagent | Reagent | "시약 '{name}' 등록" |
| 20 | `PATCH /api/reagents/{id}` | update | reagent | Reagent | "시약 #{id} 정보 수정" |
| 21 | `POST /api/reagents/{id}/dispose` | dispose | reagent | Reagent | "시약 #{id} 폐기 ({reason})" |
| 22 | `POST /api/reagents/{id}/restore` | restore | reagent | Reagent | "시약 #{id} 복원" |
| 23 | `DELETE /api/reagents/disposals` | clear_logs | reagent | ReagentDisposal | "폐기 이력 전체 삭제" |
| 24 | `DELETE /api/reagents/{id}` | delete | reagent | Reagent | "시약 #{id} 영구삭제" |
| 25 | `POST /api/chat/rooms` | create | chat | ChatRoom | "채팅방 생성" |
| 26 | `PATCH /api/chat/rooms/{id}` | update | chat | ChatRoom | "채팅방 #{id} 제목 수정" |
| 27 | `DELETE /api/chat/rooms/{id}` | delete | chat | ChatRoom | "채팅방 #{id} 삭제" |
| 28 | `POST /api/chat/rooms/{id}/messages` | send_message | chat | ChatMessage | "채팅방 #{id}에 메시지 전송" |
| 29 | `POST /api/chat` | send_message | chat | ChatMessage | "레거시 채팅 메시지" |
| 30 | `PATCH /api/accidents/{id}` | verify/reject | accident | FallEvent | "사고 #{id} {확인/오탐} 처리" |

---

## 8. 미인증 라우터의 행위자 식별 전략

현재 실험/시약/채팅/사고 라우터는 인증 없이 동작합니다.
감사 로깅 시 행위자를 식별하기 위한 전략:

### 방법 A: 기존 필드 활용 (단기, 권장)

| 라우터 | 가용 정보 | 매핑 |
|---|---|---|
| experiments | `body.researcher` | actor_name |
| reagents (dispose) | `body.disposedBy` | actor_name |
| reagents (기타) | 없음 | actor_name = NULL |
| accidents | `body.verify_subject` | actor_name |
| chat_rooms | `body.user` / `body.sender_name` | actor_name |
| chat (legacy) | `body.user` | actor_name |

### 방법 B: 선택적 인증 미들웨어 (중기)

```python
# 요청에 JWT 쿠키가 있으면 사용자 정보를 request.state.user에 저장
# 없어도 에러를 발생시키지 않음 (기존 동작 유지)
async def optional_auth(request: Request, ...):
    try:
        user = decode_token(...)
        request.state.user = user
    except:
        request.state.user = None
```

### 방법 C: 전면 인증 적용 (장기)

모든 쓰기 엔드포인트에 `Depends(get_current_user)` 추가.
프론트엔드 로그인 연동 필요.

> **권장:** Phase 2-3에서 방법 A 적용 후, 추후 방법 B → C로 점진적 전환

---

## 9. 성능 고려사항

### 9.1 로깅이 API 응답 속도에 영향을 주지 않도록

```python
# 옵션 1: try-except로 실패 무시 (권장, 단순)
try:
    audit_service.log_action(...)
except Exception:
    logger.warning("Audit log failed")

# 옵션 2: 백그라운드 태스크 (FastAPI 내장)
from fastapi import BackgroundTasks

@router.post("")
async def create_experiment(body, request: Request, bg: BackgroundTasks):
    result = experiments_service.create(engine, body)
    bg.add_task(audit_service.log_action, engine, request, ...)
    return result
```

### 9.2 데이터 보존 정책

| 정책 | 기간 | 방법 |
|---|---|---|
| 활성 데이터 | 최근 90일 | 기본 조회 범위 |
| 아카이브 | 90일~1년 | 별도 테이블 또는 파티셔닝 |
| 삭제 | 1년 초과 | 스케줄 작업으로 자동 삭제 |

> 초기에는 보존 정책 없이 시작하고, 데이터 증가 추이를 보며 적용

---

## 10. 체크리스트

- [ ] AuditLogs 테이블 SQL 스크립트 작성 및 실행
- [ ] `audit_repo.py` 생성
- [ ] `audit_service.py` 생성
- [ ] `schemas.py`에 AuditLog 관련 스키마 추가
- [ ] `routers/auth.py` 감사 로깅 적용 (5개 엔드포인트)
- [ ] `routers/users.py` 감사 로깅 적용 (7개 엔드포인트)
- [ ] `routers/experiments.py` 감사 로깅 적용 (6개 엔드포인트)
- [ ] `routers/reagents.py` 감사 로깅 적용 (6개 엔드포인트)
- [ ] `routers/accidents.py` 감사 로깅 적용 (1개 엔드포인트)
- [ ] `routers/chat_rooms.py` 감사 로깅 적용 (4개 엔드포인트)
- [ ] `routers/chat.py` 감사 로깅 적용 (1개 엔드포인트)
- [ ] `routers/audit.py` 생성 (관리자 전용: `require_admin` + `csrf_protect`)
- [ ] `main.py`에 audit 라우터 등록
- [ ] `audit-log-viewer.tsx` 컴포넌트 생성
- [ ] `users-view.tsx`에 감사 로그 서브탭 통합
- [ ] 데이터 보존 정책 적용 (선택)

---

## 11. 회원가입 약관(동의서) 업데이트 검토

### 11.1 현재 약관 분석

현재 동의서 v0.2 (`lib/consent-text.ts`)에 이미 포함된 내용:

| 약관 항목 | 내용 | 감사 로깅 커버 여부 |
|---|---|---|
| 섹션 1 - 채팅 로그 | "채팅 로그(질의/응답 내용, 타임스탬프, 세션ID)" → 5년 보유 | **부분 커버** (채팅만) |
| 섹션 1 - 접속 로그 | "접속 로그(IP 주소, 접속 일시, 이용 기록)" → 1년 보유 | **부분 커버** (로그인만) |

### 11.2 감사 로깅으로 인한 변경점

감사 로깅 시스템은 다음 **추가 데이터**를 수집합니다:

| 신규 수집 항목 | 기존 약관 커버 여부 | 조치 필요 |
|---|---|---|
| 사용자별 전체 행위 기록 (실험/시약/사고 등) | "이용 기록"에 포함 가능하나 **명시적이지 않음** | **명시 권장** |
| 행위 시점의 IP 주소 | "IP 주소"로 커버됨 | 불필요 |
| 변경 전후 데이터 (details JSON) | 커버 안 됨 | **추가 필요** |
| 행위자 이름 스냅샷 | "성명" 수집 항목으로 커버됨 | 불필요 |

### 11.3 결론: 약관 업데이트 **권장**

**법적으로 필수는 아니지만 권장합니다.** 이유:

1. **투명성 원칙** (개인정보보호법 제3조): "이용 기록"이라는 포괄적 표현보다
   구체적으로 어떤 행위를 기록하는지 명시하는 것이 법적으로 안전합니다.

2. **변경 이력(details JSON)**: 기존 약관에서 커버하지 않는 신규 수집 항목입니다.
   사용자가 수정한 내용의 전후 데이터를 저장하므로 명시가 필요합니다.

3. **보유 기간 명시**: 감사 로그의 보유 기간을 약관에 명시해야 합니다.

### 11.4 약관 수정안 (섹션 1에 추가)

현재 섹션 1 테이블에 다음 행을 추가:

```markdown
| 서비스 이용 행위 로그(실험 등록/수정/삭제, 시약 관리, 사고 처리 등 작업 내역, 변경 전후 데이터, IP 주소, 타임스탬프) | 서비스 운영 감사, 이상행위 탐지, 데이터 무결성 확보 | 1년 |
```

### 11.5 약관 버전 관리

| 항목 | 현재 | 변경 후 |
|---|---|---|
| 버전 | v0.2 | v0.3 |
| consent-text.ts | 업데이트 |  |
| login/page.tsx `consentVersion` | "2026-02-04" → 새 버전 날짜 |  |
| 기존 사용자 | 재동의 불필요 (계약 이행 항목 = 동의 불필요 섹션) |  |

> **참고:** 섹션 1은 "계약 이행을 위해 필수이며 별도의 동의 없이 처리"되는 항목입니다.
> 따라서 기존 사용자에게 재동의를 받을 필요는 없지만, 투명성을 위해 약관 버전을 올리고
> 신규 가입자에게는 업데이트된 약관을 보여주는 것이 좋습니다.
