# LABY Agent Chatbot - 확장성/연동 분석 요약 (2026-01-28)

## 1. 현재 구조 요약
- Backend: FastAPI 라우터 중심 구조. 라우터에서 직접 SQL 실행 (`backend/routers/*.py`), 앱 상태에 DB 엔진/에이전트 주입 (`backend/services/agent_service.py`).
- Frontend: Next.js App Router 기반, 대시보드 대부분이 client component (`chemical-sample-dashboard/components/dashboard/*`).
- FE/BE 연결: `fetchJson` 유틸 하나로 통일 (`chemical-sample-dashboard/lib/api.ts`). 환경변수 `NEXT_PUBLIC_API_BASE_URL`로 베이스 URL 전환 가능.

## 2. FE 더미 vs BE 연동 현황
| 영역 | FE 파일 | 호출 API | BE 파일 | 상태 |
| --- | --- | --- | --- | --- |
| Chat | `chemical-sample-dashboard/components/dashboard/chat-interface.tsx` | `/api/chat` | `backend/routers/chat.py` | 연동됨 (실패 시 더미 메시지) |
| Safety Status | `chemical-sample-dashboard/components/dashboard/safety-status.tsx` | `/api/safety/status` | `backend/routers/safety.py` | 연동됨 (실패 시 더미) |
| Accident Status | `chemical-sample-dashboard/components/dashboard/accident-status.tsx` | `/api/accidents`, `PATCH /api/accidents/{id}` | `backend/routers/accidents.py` | 연동됨 (실패 시 더미) |
| Conversation Logs | `chemical-sample-dashboard/components/dashboard/conversation-logs.tsx` | `/api/logs/conversations` | `backend/routers/logs.py` | 연동됨 (실패 시 더미) |
| Email Logs | `chemical-sample-dashboard/components/dashboard/email-logs.tsx` | `/api/logs/emails` | `backend/routers/logs.py` | 연동됨 (실패 시 더미) |
| Experiments | `chemical-sample-dashboard/components/dashboard/experiments-view.tsx` | 없음 | 없음 | 더미만 사용 |
| Reagents | `chemical-sample-dashboard/components/dashboard/reagents-view.tsx` | 없음 | 없음 | 더미만 사용 |
| Monitoring View | `chemical-sample-dashboard/components/dashboard/monitoring-view.tsx` | 없음 | 없음 | 3D 플레이스홀더 |

## 3. “새 BE 파일 추가” 방식으로 확장 가능 여부
- 가능함. 현재 `main.py`에 `include_router`로 라우터만 추가하면 기능 확장이 가능.
- 다만 라우터에 SQL/비즈니스 로직이 직접 들어가 있어, 기능이 늘수록 충돌 위험이 커짐.
- 안전한 확장을 위해 **라우터-서비스-리포지토리** 계층 분리 권장.

## 4. 구조적 리스크/충돌 지점
- Safety 환경 라벨 매칭 문제: FE는 한글 라벨 기반 매칭, BE는 `temperature/humidity` 같은 영문 키를 반환.
- 상태값 의미 불일치: `verification_status=2`가 사고 라우터에서는 `resolved`, 채팅 라우터에서는 “오탐”으로 사용됨.
- FE 상태값이 한글 문자열에 고정됨(실험/시약 등). BE 연동 시 enum/매핑 표준화 필요.
- 더미 fallback이 넓어 실제 연동 오류가 숨겨질 수 있음.
- 라우터에 SQL이 직접 존재하여 재사용성/테스트성이 낮음.

## 5. 확장/충돌 방지 설계 제안
### Backend
- `routers/`는 얇게 유지하고, 로직은 `services/`, SQL은 `repositories/`로 분리.
- 예시 파일 구조:
  - `backend/routers/experiments.py`
  - `backend/services/experiments_service.py`
  - `backend/repositories/experiments_repo.py`
- 공통 enum/상태값은 `schemas.py` 혹은 `domain/`에 통일.
- `Depends`로 DB 세션/서비스 주입해 테스트와 교체 용이성 확보.

### Frontend
- API 호출을 화면에서 분리: `chemical-sample-dashboard/lib/api/experiments.ts` 등 도메인별 클라이언트.
- 데이터 훅(`hooks/useExperiments`)으로 화면은 표현 중심으로 단순화.
- 더미 데이터는 `fixtures/`로 분리하고 `NEXT_PUBLIC_USE_MOCKS` 같은 플래그로 전환.
- 공통 타입/enum을 `lib/types.ts` 등으로 중앙화.

## 6. 결론
- 현재 구조에서도 **새 BE 파일 추가 방식으로 연동 가능**함.
- 다만 라우터 집중 구조와 상태/라벨 불일치가 커질수록 충돌 위험이 증가.
- 계층 분리 + 타입/상태 표준화만 적용해도 이후 기능 확장이 안정적으로 가능.

## 7. 진행 계획 (초안)
1) 계약/스키마 합의
   - FE/BE 공통 상태값, 필드명, 에러 규격 확정
   - Safety 환경 라벨/키 매칭 통일
2) Backend 기능 추가
   - Experiments/Reagents/Monitoring 라우터 + 서비스/리포지토리 구현
   - 최소 단위 테스트 및 샘플 데이터 준비
3) Frontend 전환
   - 도메인 API 클라이언트/훅 추가
   - 더미 → 실 API 스위칭 플래그 적용
4) 통합 검증
   - 주요 화면 시나리오별 통합 테스트
   - 더미 fallback 축소 및 오류 가시화
