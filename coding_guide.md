# LABY Chatbot Coding Guide (Refactor Notes)

작성일: 2026-01-28
대상: Smart Lab Backend (FastAPI) + Dashboard Frontend (Next.js)
목표: 소프트 코딩/객체지향적 확장을 위한 구조, 파일 체계, 확장 규칙 공유

---

## 1) 전체 구조 개요
```
/ (Root)
├─ backend/                        # FastAPI 백엔드
│  ├─ main.py                      # 앱 엔트리 (라우터 등록)
│  ├─ schemas.py                   # Pydantic DTO + 공통 타입/enum
│  ├─ sql_agent.py                 # DB 스키마 초기화/LLM 에이전트
│  ├─ routers/                     # API 레이어 (얇은 컨트롤러)
│  │  ├─ accidents.py
│  │  ├─ chat.py
│  │  ├─ safety.py
│  │  ├─ logs.py
│  │  ├─ experiments.py           # 신규: 실험 API
│  │  ├─ reagents.py              # 신규: 시약 API
│  │  └─ monitoring.py            # 신규: 모니터링 API
│  ├─ services/                    # 비즈니스 로직 계층
│  │  ├─ agent_service.py
│  │  ├─ experiments_service.py   # 신규
│  │  ├─ experiments_service_helpers.py
│  │  └─ reagents_service.py      # 신규
│  ├─ repositories/                # 데이터 접근 계층 (SQL)
│  │  ├─ experiments_repo.py      # 신규
│  │  ├─ reagents_repo.py         # 신규
│  │  └─ __init__.py
│  └─ ...
│
├─ chemical-sample-dashboard/      # Next.js 프론트엔드
│  ├─ app/
│  ├─ components/                  # UI 컴포넌트
│  │  └─ dashboard/
│  ├─ hooks/                       # 데이터 훅 (API 연동)
│  │  ├─ use-experiments.ts        # 신규
│  │  ├─ use-reagents.ts           # 신규
│  │  └─ use-monitoring.ts         # 신규
│  ├─ lib/
│  │  ├─ api.ts                    # fetchJson 유틸
│  │  ├─ config.ts                 # USE_MOCKS 플래그
│  │  ├─ format.ts                 # 날짜/단위 포맷
│  │  ├─ types.ts                  # FE 타입 정의
│  │  └─ data/                     # 도메인별 API 클라이언트
│  │     ├─ experiments.ts
│  │     ├─ reagents.ts
│  │     └─ monitoring.ts
│  └─ ...
```

---

## 2) 소프트 코딩 원칙
1. **하드코딩 최소화**
   - 상태/라벨은 코드값(enum) + UI 매핑으로 처리
   - 예: `status = "in_progress"` → UI 라벨 매핑
2. **환경/모드 분리**
   - `NEXT_PUBLIC_USE_MOCKS=1`이면 FE 더미 사용, 기본은 실 API
3. **데이터 구조 분리**
   - UI 컴포넌트는 표현만 담당
   - 데이터 로딩/변환은 `hooks/`에서 수행

---

## 3) 객체지향/계층 분리 가이드
### Backend (FastAPI)
- **Router**: 요청/응답 처리만 담당
- **Service**: 도메인 로직/정책 처리
- **Repository**: SQL/DB 접근 전담

이 구조로 확장 시 **라우터 충돌 최소화** 가능.

### Frontend (Next.js)
- **API Client (lib/data)**: API 호출 책임
- **Hook (hooks)**: 데이터 상태/변환/캐시
- **Component (components)**: UI만 담당

---

## 4) 기능 확장 방법
### Backend
1. 새 기능 추가 시
   - `backend/routers/<feature>.py` 생성
   - `backend/services/<feature>_service.py` 생성
   - `backend/repositories/<feature>_repo.py` 생성
   - `backend/main.py`에 `include_router()` 추가
2. DB 테이블 추가 시
   - `backend/sql_agent.py`의 `init_db_schema()`에 CREATE TABLE 추가
   - 기존 테이블 컬럼 추가는 `ALTER TABLE` 분기 사용

### Frontend
1. 새 도메인 추가
   - `lib/types.ts`에 타입 정의
   - `lib/data/<feature>.ts`에 API 클라이언트 정의
   - `hooks/use-<feature>.ts`에서 데이터 로딩/변환
   - 컴포넌트는 훅 사용
2. 더미 데이터 유지
   - `NEXT_PUBLIC_USE_MOCKS`로 전환 가능

---

## 5) 확장 시 주의사항
- **상태값 통일**: FE/BE enum 불일치 금지
- **FK 타입 정합성**: DB 컬럼 타입/길이 일치 확인
- **에러 핸들링**: FE에서 API 실패 시 더미 fallback 가능
- **인코딩 주의**: 텍스트 모지박 현상 발생 시 UTF-8 파일 저장 확인

---

## 6) 운영 팁
- FE/BE 스키마 변경 시 반드시 `api_contract.md` 업데이트
- 작은 기능이라도 `routers/services/repositories` 체계 유지
- 신규 팀원이 바로 이해할 수 있도록 **도메인별 책임 분리** 유지

---

## 7) 참고 파일
- 계약 문서: `api_contract.md`
- 구조 분석: `analysis_report.md`

---

## 8) 충돌 방지 규칙 (필수)
다음 규칙을 지키면 **병렬 작업 시 충돌을 최소화**할 수 있습니다.  
※ 기술적으로 100% 무충돌은 불가능하지만, 아래 원칙을 지키면 대부분 예방됩니다.

### A. 계약/인터페이스 규칙
1. **API 계약 우선**  
   - 기능 구현 전에 `api_contract.md`에 스키마/엔드포인트 변경사항을 먼저 반영하고 합의한다.
2. **타입/상태값 단일 소스**  
   - FE 타입은 `chemical-sample-dashboard/lib/types.ts`에만 정의한다.  
   - BE 타입은 `backend/schemas.py`에만 정의한다.
3. **하위 호환 유지**  
   - 기존 필드/엔드포인트는 즉시 제거하지 않는다.  
   - 변경이 필요하면 **새 필드 추가 → 점진적 전환 → 제거** 순서를 따른다.

### B. 파일/모듈 소유 규칙
4. **도메인 단위 책임 분리**  
   - 실험/시약/모니터링 등 도메인별로 파일을 분리하고, 다른 도메인 파일을 직접 수정하지 않는다.
5. **공통 파일 변경 최소화**  
   - `backend/main.py`, `backend/schemas.py`, `chemical-sample-dashboard/lib/types.ts`는  
     최소 변경만 허용하며 변경 시 반드시 팀 공유한다.

### C. DB/스키마 규칙
6. **테이블 추가는 Additive**  
   - `init_db_schema()`에서 테이블/컬럼은 추가만 허용.  
   - Drop/Alter는 별도 승인 절차 후 진행.
7. **FK 타입 정합성 유지**  
   - FK 컬럼 타입/길이는 참조 테이블과 반드시 동일하게 맞춘다.

### D. FE/BE 연동 규칙
8. **FE는 데이터 훅만 수정**  
   - API 연동 변경은 `hooks/` 및 `lib/data/`에서 처리하고  
     UI 컴포넌트는 표현 로직만 유지한다.
9. **모의데이터 플래그 사용**  
   - 실제 API가 준비되지 않았으면 `NEXT_PUBLIC_USE_MOCKS=1`로 유지한다.

### E. 협업 규칙
10. **기능별 브랜치 작업**  
    - 한 기능 = 한 브랜치. 공통 파일 변경은 PR 설명에 명시.
11. **상호 리뷰**  
    - 계약/API/타입 변경은 반드시 리뷰 대상.
12. **작업 전/후 공유**  
    - 변경 범위(파일/기능)를 작업 시작/완료 시 공유한다.

---

## 9) 커밋 규칙 (Git Commit Convention)
### A. 기본 형식
```
<type>(scope): <subject>

[optional body]
[optional footer]
```

### B. Type 목록
- `feat`: 기능 추가
- `fix`: 버그 수정
- `refactor`: 리팩토링 (기능 변화 없음)
- `docs`: 문서 변경
- `style`: 포맷/세미콜론 등 코드 의미 없는 변경
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정/의존성 변경

### C. Scope 예시
- `backend`, `frontend`, `api`, `experiments`, `reagents`, `monitoring`

### D. 예시
```
feat(experiments): add experiment CRUD API
refactor(frontend): move data fetch into hooks
fix(api): handle false_alarm status mapping
```

---

## 10) PR 템플릿 (Pull Request Template)
아래 내용을 PR 본문에 복사해서 사용하세요.

```
## 작업 요약
- 무엇을 변경/추가했는지 간단히 정리

## 변경 범위
- [ ] Backend
- [ ] Frontend
- [ ] DB Schema
- [ ] Docs

## 체크리스트
- [ ] api_contract.md 반영 여부 확인
- [ ] FE/BE 타입 정의 동기화
- [ ] 로컬 테스트 완료 (가능한 범위)
- [ ] 모의데이터/실데이터 전환 확인

## 테스트 방법
- 실행 명령 및 확인 사항

## 위험/이슈
- 잠재적 리스크나 후속 작업 필요 사항
```

---
