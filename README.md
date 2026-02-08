# LABY - Smart Lab Assistant & Dashboard

마지막 업데이트: 2026-02-08

## 개요

LABY는 실험실 데이터를 관리하고 AI 에이전트와 대화할 수 있는 통합 실험실 관리 시스템입니다.
화학 실험 추적, 시약 재고 관리, 안전 모니터링, 다국어 AI 챗봇을 하나의 대시보드에서 제공합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | FastAPI, SQLAlchemy, pyodbc |
| **Frontend** | Next.js 16 (App Router), TypeScript, Radix UI, Tailwind CSS 4 |
| **Database** | Microsoft SQL Server |
| **AI/LLM** | Azure OpenAI (GPT), LangChain SQL Agent |
| **캐시** | Redis 7 (Docker) / Azure Cache for Redis (프로덕션) |
| **인증** | JWT (Access/Refresh Token), httpOnly Cookie, CSRF |
| **번역** | Azure Translator (Redis + SQL 2단계 캐시) |
| **음성** | Azure Speech Service (STT/TTS) |
| **모니터링** | Azure Monitor OpenTelemetry |
| **배포** | GitHub Actions → Azure App Service (BE) + Azure Static Web Apps (FE) |

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│   Next.js (Static Export) → Azure Static Web Apps           │
│   ┌──────────┬───────────┬──────────┬───────────────────┐   │
│   │ 대시보드  │ 챗 인터페이스│ 실험 관리 │ 시약/안전 모니터링 │   │
│   └──────────┴───────────┴──────────┴───────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (HTTPS)
┌───────────────────────▼─────────────────────────────────────┐
│                        Backend                              │
│   FastAPI → Azure App Service                               │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ Routers (13) → Services (15) → Repositories (14)    │  │
│   └──────┬───────────────┬───────────────┬───────────────┘  │
│          │               │               │                  │
│   ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐          │
│   │ LangChain   │ │  Redis    │  │  SQL Server  │          │
│   │ SQL Agent   │ │  (캐시)   │  │  (영구저장)   │          │
│   └─────────────┘ └───────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 주요 기능

### AI 챗봇 (SQL Agent)
- Azure OpenAI 기반 자연어 데이터베이스 질의
- 5개 도메인 Few-Shot 프롬프트 (실험, 시약, 낙하감지, 자산모니터링, 검증)
- 6개 커스텀 도구 (실험 생성, 데이터 기록, 검증 상태 변경 등)
- 다국어 응답 지원 (한국어, 영어, 일본어)

### 실험 관리
- 실험 CRUD (생성, 조회, 수정, 삭제)
- 실험-시약 연결 관리 (투입량 추적)
- 상태 필터링 (진행중/대기/완료)
- 메모 기능

### 시약 재고 관리
- 시약 CRUD + 위험물질 정보(MSDS) 조회
- 폐기 워크플로우 (폐기/복원/이력 관리)
- 보관환경 모니터링 (온도/습도)

### 안전 모니터링
- 실린더 낙하 감지 이벤트 (Risk Angle 분류)
- 검증 워크플로우 (대기→확인/오탐 판정)
- 환경 센서 데이터 (온습도)
- 장비 연결 상태 추적 (카메라, 저울)

### 인증 및 보안
- JWT Access/Refresh 토큰 (httpOnly 쿠키)
- CSRF Double-Submit 보호
- 역할 기반 접근 제어 (Admin/User)
- 로그인 Rate Limiting (Redis/메모리/DB 혼합)
- 보안 헤더 (CSP, HSTS, X-Frame-Options 등)
- 인증 감사 로그 (IP, User-Agent 추적)

### 데이터 내보내기
- CSV 스트리밍 다운로드 (대화로그, 인증로그, 사고, 실험, 환경데이터)
- 관리자 전용 인증 로그 내보내기

### 다국어 지원 (i18n)
- Azure Translator 연동 (Redis 1차 캐시 + SQL 2차 캐시)
- 한국어/영어/일본어 UI 및 API 응답 번역
- Accept-Language 헤더 기반 언어 자동 감지

## 디렉터리 구조

```
/ (Root)
├── backend/                          # FastAPI 백엔드
│   ├── main.py                       # 앱 엔트리, 미들웨어, 라우터 등록
│   ├── sql_agent.py                  # LangChain SQL Agent, DB 스키마 초기화
│   ├── schemas.py                    # Pydantic 요청/응답 모델
│   ├── routers/                      # API 라우터 (13개)
│   │   ├── auth.py                   #   인증 (로그인/가입/로그아웃/토큰갱신)
│   │   ├── chat.py                   #   AI 채팅 (SQL Agent 호출)
│   │   ├── chat_rooms.py             #   채팅방 CRUD, 메시지 관리
│   │   ├── experiments.py            #   실험 CRUD + 시약 연결
│   │   ├── reagents.py               #   시약 CRUD + 위험정보 + 폐기
│   │   ├── accidents.py              #   낙하 이벤트 조회/검증
│   │   ├── safety.py                 #   환경 모니터링 상태
│   │   ├── users.py                  #   사용자 관리 (관리자)
│   │   ├── consents.py               #   동의 관리 (GDPR)
│   │   ├── logs.py                   #   대화 로그 조회
│   │   ├── export.py                 #   CSV 내보내기
│   │   ├── speech.py                 #   Azure Speech 토큰 발급
│   │   ├── monitoring.py             #   시스템 모니터링
│   │   └── health.py                 #   헬스 체크
│   ├── services/                     # 비즈니스 로직 (15개)
│   │   ├── agent_service.py          #   앱 상태 초기화, SQL Agent 설정
│   │   ├── auth_service.py           #   인증 로직 (가입/로그인/토큰)
│   │   ├── chat_rooms_service.py     #   채팅방 관리, 대화 이력
│   │   ├── translation_service.py    #   번역 (Redis+SQL 2단계 캐시)
│   │   ├── i18n_service.py           #   응답 객체 번역 필드 첨부
│   │   ├── experiments_service.py    #   실험 비즈니스 로직
│   │   ├── reagents_service.py       #   시약 비즈니스 로직
│   │   ├── safety_service.py         #   안전 데이터 집계
│   │   ├── accidents_service.py      #   낙하 이벤트 필터링/검증
│   │   ├── hazard_service.py         #   위험물질 정보 조회
│   │   ├── users_service.py          #   사용자 관리 로직
│   │   ├── export_service.py         #   CSV 생성
│   │   ├── auth_logs_service.py      #   인증 감사 로그
│   │   └── consents_service.py       #   동의 기록 관리
│   ├── repositories/                 # DB 접근 계층 (14개)
│   │   ├── users_repo.py             #   Users 테이블
│   │   ├── refresh_tokens_repo.py    #   RefreshTokens 테이블
│   │   ├── chat_rooms_repo.py        #   ChatRooms, ChatMessages 테이블
│   │   ├── chat_logs_repo.py         #   ChatLogs 테이블
│   │   ├── experiments_repo.py       #   Experiments, ExperimentData 테이블
│   │   ├── reagents_repo.py          #   Reagents, ReagentDisposals 테이블
│   │   ├── accidents_repo.py         #   FallEvents 테이블
│   │   ├── safety_repo.py            #   환경 센서 테이블
│   │   ├── translation_cache_repo.py #   TranslationCache 테이블
│   │   ├── hazard_repo.py            #   MSDS_Table
│   │   ├── auth_logs_repo.py         #   AuthLogs 테이블
│   │   ├── consents_repo.py          #   UserConsents 테이블
│   │   └── export_repo.py            #   CSV 내보내기 쿼리
│   ├── utils/                        # 유틸리티
│   │   ├── redis_client.py           #   Redis 연결 관리 (init/get)
│   │   ├── rate_limit.py             #   Rate Limiter (Redis + 메모리 fallback)
│   │   ├── security.py               #   JWT, bcrypt, CSRF 토큰
│   │   ├── dependencies.py           #   인증/CSRF 미들웨어
│   │   ├── i18n_handler.py           #   언어 감지
│   │   ├── translation.py            #   텍스트 해싱/정규화
│   │   ├── db_helpers.py             #   동적 테이블 탐색
│   │   └── query_builder.py          #   쿼리 빌더 유틸
│   ├── sql/                          # SQL 스키마 파일
│   └── tests/                        # 테스트
├── chemical-sample-dashboard/        # Next.js 프론트엔드
│   ├── app/                          # 페이지 라우팅
│   │   ├── page.tsx                  #   랜딩 페이지
│   │   ├── login/page.tsx            #   로그인/회원가입
│   │   ├── dashboard/page.tsx        #   메인 대시보드
│   │   ├── profile/page.tsx          #   프로필/설정
│   │   └── about/page.tsx            #   소개 페이지
│   ├── components/                   # UI 컴포넌트
│   │   ├── dashboard/                #   대시보드 모듈 (11+)
│   │   │   ├── chat-interface.tsx    #     AI 챗 인터페이스
│   │   │   ├── accident-status.tsx   #     사고 현황
│   │   │   ├── safety-status.tsx     #     안전 상태
│   │   │   ├── experiments-view.tsx  #     실험 관리
│   │   │   ├── reagents-view.tsx     #     시약 관리
│   │   │   ├── users-view.tsx        #     사용자 관리 (관리자)
│   │   │   ├── monitoring-view.tsx   #     모니터링
│   │   │   ├── conversation-logs.tsx #     대화 로그
│   │   │   └── csv-download.tsx      #     CSV 다운로드
│   │   └── ui/                       #   Radix UI 프리미티브 (40+)
│   ├── hooks/                        # 커스텀 React 훅
│   ├── lib/                          # API 클라이언트, 스토리지, 언어 유틸
│   └── public/                       # 정적 자산 (아바타, 아이콘)
├── docker-compose.yml                # Docker 로컬 개발 환경 (Redis + Backend)
├── Dockerfile                        # Backend 컨테이너 이미지
├── requirements.txt                  # Python 의존성
├── scripts/                          # 테스트/진단 스크립트
├── docs/                             # 문서
└── .github/workflows/                # CI/CD 파이프라인
    ├── backend-deploy.yml            #   Backend → Azure App Service
    └── azure-static-web-apps-*.yml   #   Frontend → Azure Static Web Apps
```

## API 엔드포인트

| 라우터 | 메서드 | 경로 | 설명 |
|--------|--------|------|------|
| **auth** | POST | `/api/auth/signup` | 회원가입 |
| | POST | `/api/auth/login` | 로그인 |
| | POST | `/api/auth/refresh` | 토큰 갱신 |
| | POST | `/api/auth/logout` | 로그아웃 |
| | GET | `/api/auth/me` | 내 정보 조회 |
| | PATCH | `/api/auth/me` | 내 정보 수정 |
| | DELETE | `/api/auth/me` | 회원 탈퇴 |
| **chat** | POST | `/api/chat` | AI 에이전트 대화 |
| **chat_rooms** | GET/POST | `/api/chat/rooms` | 채팅방 목록/생성 |
| | GET/PATCH/DELETE | `/api/chat/rooms/{id}` | 채팅방 조회/수정/삭제 |
| | GET/POST | `/api/chat/rooms/{id}/messages` | 메시지 목록/전송 |
| **experiments** | GET/POST | `/api/experiments` | 실험 목록/생성 |
| | GET/PATCH/DELETE | `/api/experiments/{id}` | 실험 조회/수정/삭제 |
| | PATCH | `/api/experiments/{id}/memo` | 메모 수정 |
| | POST/DELETE | `/api/experiments/{id}/reagents` | 시약 연결/해제 |
| **reagents** | GET/POST | `/api/reagents` | 시약 목록/등록 |
| | PATCH/DELETE | `/api/reagents/{id}` | 시약 수정/삭제 |
| | POST | `/api/reagents/{id}/dispose` | 시약 폐기 |
| | POST | `/api/reagents/{id}/restore` | 시약 복원 |
| | GET | `/api/reagents/hazard-info` | 위험물질 정보 조회 |
| | GET | `/api/reagents/storage-environment` | 보관환경 조회 |
| | GET/DELETE | `/api/reagents/disposals` | 폐기 이력 |
| **accidents** | GET | `/api/accidents` | 낙하 이벤트 목록 |
| | PATCH | `/api/accidents/{event_id}` | 검증 상태 변경 |
| **safety** | GET | `/api/safety/status` | 안전 현황 조회 |
| **users** | GET | `/api/users` | 사용자 목록 (관리자) |
| | GET | `/api/users/{id}` | 사용자 상세 |
| | GET | `/api/users/{id}/auth-logs` | 사용자 인증 로그 |
| **export** | GET | `/api/export/{type}` | CSV 내보내기 |
| **speech** | GET | `/api/speech/token` | Azure Speech 토큰 |
| **logs** | GET | `/api/logs/conversations` | 대화 로그 |
| **monitoring** | GET | `/api/monitoring/overview` | 시스템 현황 |
| **consents** | GET | `/api/consents` | 동의 목록 (관리자) |
| **health** | GET | `/api/health` | 헬스 체크 |

## 데이터베이스 스키마

```
Users (1) ──── (N) RefreshTokens
  │
  ├──── (N) AuthLogs
  ├──── (N) UserConsents
  │
  ├──── (N) ChatRooms (1) ──── (N) ChatMessages
  │
  └──── (N) Experiments (1) ──── (N) ExperimentData
                    │
                    └──── (N) ExperimentReagents ──── (N) Reagents
                                                        │
                                                        └──── (N) ReagentDisposals

FallEvents          ← 낙하 감지 이벤트 (Risk Angle, 검증 상태)
StorageEnvironment  ← 보관 환경 센서 데이터
WeightLog           ← Arduino 저울 데이터
humid_temp_log      ← 온습도 센서 데이터
TranslationCache    ← 번역 캐시 (hash 기반, TTL 만료)
ChatLogs            ← 대화 명령 감사 로그
MSDS_Table          ← 위험물질 안전 데이터
```

## 캐시 구조 (Redis)

```
Redis (1차 캐시, < 1ms)                SQL Server (2차 캐시/영구 저장)
┌──────────────────────────┐           ┌──────────────────────────┐
│ rate_limit:{ip}:{action} │           │                          │
│  → INCR + EXPIRE (TTL)  │           │  AuthLogs 테이블 (DB 기반   │
│                          │           │  rate limit 보조)         │
├──────────────────────────┤           ├──────────────────────────┤
│ trans:{hash}:{lang}      │  miss →   │  TranslationCache 테이블   │
│  → 번역 결과 캐시 (TTL)   │ ────────→ │  (hash, lang, provider,  │
│                          │ ← backfill│   hit_count, expires_at) │
└──────────────────────────┘           └──────────────────────────┘

Redis 미연결 시 → 인메모리 Rate Limiter + SQL 직접 조회로 자동 fallback
```

---

## 로컬 개발 환경 설정

### 사전 준비
- Docker Desktop (Redis 컨테이너용)
- Python 3.11+
- Node.js 18+
- MS SQL Server (Azure SQL 또는 로컬)

### 방법 1: Docker Compose (권장)

전체 Backend + Redis를 컨테이너로 실행합니다.

```bash
# 1. 환경 변수 설정
cp backend/azure_and_sql.env.example backend/azure_and_sql.env
# → azure_and_sql.env 파일에 SQL Server, Azure OpenAI 등 값 입력

# 2. 전체 서비스 실행 (Backend + Redis)
docker compose up

# Backend:  http://localhost:8000
# Redis:    localhost:6379
```

```bash
# Redis만 실행 (Backend는 로컬에서 직접 실행할 때)
docker compose up redis -d
```

### 방법 2: Redis만 Docker + Backend 직접 실행

```bash
# 1. Redis 컨테이너 실행
docker compose up redis -d

# 2. Python 가상환경 설정
python -m venv venv
source venv/bin/activate          # Linux/Mac
# .\venv\Scripts\Activate.ps1     # Windows PowerShell

# 3. 의존성 설치
pip install -r requirements.txt

# 4. Backend 실행 (Redis 연결 포함)
REDIS_URL=redis://localhost:6379/0 uvicorn backend.main:app --reload
```

### 방법 3: Redis 없이 실행 (기존 방식)

Redis 없이도 모든 기능이 동작합니다. Rate Limit은 인메모리, 번역 캐시는 SQL Server를 사용합니다.

```bash
# REDIS_URL을 설정하지 않으면 자동으로 fallback
uvicorn backend.main:app --reload
```

### Frontend 실행

```bash
cd chemical-sample-dashboard
npm install
npm run dev
# → http://localhost:3000
```

### 로컬 환경 요약

| 방법 | Redis | Backend | 장점 |
|------|-------|---------|------|
| Docker Compose 전체 | 컨테이너 | 컨테이너 | 한 줄로 전체 실행 |
| Redis Docker + 로컬 BE | 컨테이너 | 로컬 Python | 코드 수정 시 빠른 반영 |
| Redis 없이 | 없음 | 로컬 Python | 가장 간단, Docker 불필요 |

---

## 클라우드 배포 (Azure)

### 배포 아키텍처

```
GitHub (main branch push)
    │
    ├── GitHub Actions ─→ Azure Static Web Apps (Frontend)
    │     └── Next.js 정적 빌드 (npm ci && npm run build → out/)
    │
    └── GitHub Actions ─→ Azure App Service (Backend)
          └── Python FastAPI (requirements.txt + backend/)

Azure Cache for Redis ←── Backend (REDIS_URL 환경변수로 연결)
Azure SQL Server     ←── Backend (SQL_* 환경변수로 연결)
Azure OpenAI         ←── Backend (AZURE_OPENAI_* 환경변수로 연결)
```

### 배포 절차

**1. Azure 리소스 생성**

| 리소스 | 용도 | 권장 티어 |
|--------|------|----------|
| Azure App Service | Backend API | B1 (Basic) |
| Azure Static Web Apps | Frontend | Free |
| Azure SQL Database | 데이터베이스 | Basic (5 DTU) |
| Azure OpenAI | AI 모델 | Standard |
| Azure Cache for Redis | 캐시 (선택) | Basic C0 (~$22/월) |
| Azure Speech Service | 음성 (선택) | Free (5시간/월) |
| Azure Translator | 번역 (선택) | Free (2M 문자/월) |

**2. GitHub Secrets 설정**

```
AZUREAPPSERVICE_PUBLISHPROFILE          # Azure App Service 게시 프로필
AZURE_STATIC_WEB_APPS_API_TOKEN_*       # Azure SWA 배포 토큰
```

**3. Azure App Service 환경 변수 설정**

필수:
```
JWT_SECRET_KEY                  # 랜덤 시크릿 (반드시 변경)
SQL_SERVER                      # Azure SQL 서버 주소
SQL_DATABASE                    # 데이터베이스 이름
SQL_USERNAME                    # DB 사용자
SQL_PASSWORD                    # DB 비밀번호
AZURE_OPENAI_ENDPOINT           # Azure OpenAI 엔드포인트
AZURE_OPENAI_API_KEY            # Azure OpenAI API 키
OPENAI_API_VERSION              # API 버전 (예: 2024-10-21)
AZURE_DEPLOYMENT_NAME           # 모델 배포 이름
```

권장 (프로덕션):
```
APP_ENV=production              # 프로덕션 모드 활성화
REDIS_URL=rediss://:key@host:6380/0  # Azure Redis 연결 (SSL)
CORS_ALLOW_ORIGINS=https://your-frontend-domain.com
AUTH_COOKIE_ENABLED=1           # 쿠키 기반 인증 활성화
COOKIE_SAMESITE=none            # 크로스 도메인 쿠키 허용
ENABLE_HSTS=1                   # HSTS 보안 헤더 활성화
```

번역/음성 (선택):
```
AZURE_TRANSLATOR_ENABLED=1
AZURE_TRANSLATOR_ENDPOINT       # Translator 엔드포인트
AZURE_TRANSLATOR_KEY            # Translator API 키
AZURE_TRANSLATOR_REGION         # Translator 리전
AZURE_SPEECH_KEY                # Speech 서비스 키
AZURE_SPEECH_REGION             # Speech 서비스 리전
```

**4. 배포 실행**

```bash
# main 브랜치에 push하면 자동 배포
git push origin main

# 또는 GitHub Actions에서 수동 트리거
# → Actions 탭 → "Build and deploy" → Run workflow
```

### 배포 시 주의사항

- `backend/azure_and_sql.env`는 배포에 포함되지 않음 (`.gitignore` + workflow 제외)
- Azure App Service의 환경 변수(Application Settings)에서 직접 설정
- `REDIS_URL` 미설정 시 Redis 없이 정상 동작 (fallback)
- Azure Cache for Redis는 SSL 기본 (포트 6380, `rediss://` 프로토콜 사용)

---

## 환경 변수 전체 목록

### 필수

| 변수 | 설명 | 예시 |
|------|------|------|
| `JWT_SECRET_KEY` | JWT 서명 시크릿 | 랜덤 64자 문자열 |
| `SQL_SERVER` | SQL Server 주소 | `your-server.database.windows.net` |
| `SQL_DATABASE` | 데이터베이스 이름 | `labydb` |
| `SQL_USERNAME` | DB 사용자 | `admin` |
| `SQL_PASSWORD` | DB 비밀번호 | (URL 인코딩 자동 처리) |
| `AZURE_OPENAI_ENDPOINT` | OpenAI 엔드포인트 | `https://xxx.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | OpenAI API 키 | |
| `OPENAI_API_VERSION` | API 버전 | `2024-10-21` |
| `AZURE_DEPLOYMENT_NAME` | 모델 배포명 | `gpt-4o` |

### 보안/인증

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `APP_ENV` | 환경 구분 | `development` |
| `CORS_ALLOW_ORIGINS` | 허용 도메인 (쉼표 구분) | `http://localhost:3000` |
| `AUTH_COOKIE_ENABLED` | 쿠키 인증 활성화 | `0` |
| `COOKIE_SAMESITE` | SameSite 정책 | dev: `lax`, prod: `none` |
| `COOKIE_DOMAIN` | 쿠키 도메인 | (미설정) |
| `CSRF_DISABLED` | CSRF 보호 해제 | `0` (활성화) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 액세스 토큰 만료 | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 리프레시 토큰 만료 | `7` |
| `ENABLE_HSTS` | HSTS 헤더 | `0` |
| `LOGIN_RATE_LIMIT` | Rate Limit 설정 | `5/60` (5회/60초) |
| `LOGIN_RATE_LIMIT_STORE` | Rate Limit 저장소 | `hybrid` |

### 캐시/번역/음성

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `REDIS_URL` | Redis 연결 URL | (미설정 시 fallback) |
| `AZURE_TRANSLATOR_ENABLED` | 번역 활성화 | `0` |
| `AZURE_TRANSLATOR_ENDPOINT` | Translator 엔드포인트 | |
| `AZURE_TRANSLATOR_KEY` | Translator API 키 | |
| `AZURE_TRANSLATOR_REGION` | Translator 리전 | |
| `AZURE_TRANSLATOR_CACHE_TTL_HOURS` | 번역 캐시 TTL | `168` (7일) |
| `AZURE_SPEECH_KEY` | Speech 서비스 키 | |
| `AZURE_SPEECH_REGION` | Speech 서비스 리전 | |

### 개발 전용

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `ALLOW_DEV_LOGIN` | 개발 로그인 허용 | `0` |
| `DEV_LOGIN_SECRET` | 개발 로그인 시크릿 | |
| `SEED_TEST_USERS` | 테스트 사용자 자동 생성 | `0` |
| `TEST_USER_EMAIL` | 테스트 사용자 이메일 | `msu@msu.lab.kr` |
| `TEST_USER_PASSWORD` | 테스트 사용자 비밀번호 | `Test1234` |

## 인증 흐름

```
1. POST /api/auth/login (or /signup)
   → access_token + refresh_token 발급 (쿠키 또는 JSON)
   → csrf_token 발급 (쿠키 httponly=false)

2. 인증 필요 API 호출
   → Authorization: Bearer {access_token} 또는 쿠키 자동 전송
   → POST/PATCH/DELETE 시 X-CSRF-Token 헤더 필수

3. access_token 만료 (30분)
   → POST /api/auth/refresh 로 재발급

4. POST /api/auth/logout
   → 쿠키 삭제 + refresh_token 폐기
```

## 스크립트

| 스크립트 | 용도 |
|----------|------|
| `scripts/auth-smoke-test.ps1` | 로그인/토큰/권한 동작 확인 |
| `scripts/security-check.ps1` | 운영 보안 설정 점검 |

## 디버깅 가이드

1. `JWT_SECRET_KEY` 미설정 시 서버가 즉시 종료됨
2. `/api/health`가 401이면 로그인 후 쿠키/토큰이 전달되는지 확인
3. POST/PATCH/DELETE에서 401/403이면 `X-CSRF-Token` 헤더와 `csrf_token` 쿠키 확인
4. 쿠키 미전달 시 `CORS_ALLOW_ORIGINS`, `COOKIE_SAMESITE`, HTTPS 여부 점검
5. Redis 연결 실패 시 자동으로 인메모리/SQL fallback (로그에서 경고 확인)
6. PowerShell에서 `curl`은 `Invoke-WebRequest`로 동작하므로 `curl.exe` 사용 권장
7. Azure SQL 타임아웃 시 `pool_recycle=1800` 설정이 적용되어 있는지 확인

## 보안 요약

- JWT Secret 기본값 제거 (미설정 시 서버 시작 실패)
- CORS 허용 도메인 제한 (프로덕션 시 명시적 설정 필요)
- Dev Login 프로덕션 차단 (`APP_ENV=production` 시 자동 비활성화)
- 로그인 시도 제한 (Redis/메모리/DB 혼합 Rate Limiting)
- httpOnly 쿠키 기반 토큰 저장
- CSRF Double-Submit 보호
- 보안 헤더 (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- 비밀번호 정책 (8자 이상, 영문+숫자 포함)
- 인증 감사 로그 (IP, User-Agent 추적)

## 참고

- API 계약: `api_contract.md`
- FastAPI Swagger 문서: `http://localhost:8000/docs`
