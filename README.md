# Smart Lab Assistant & Dashboard

마지막 업데이트: 2026-02-04

## 개요
이 프로젝트는 실험실 데이터를 관리하고 AI 에이전트와 대화할 수 있는 통합 대시보드입니다. Backend는 FastAPI 기반 API와 SQL Agent를 제공하고, Frontend는 Next.js 기반의 대시보드 UI를 제공합니다.

## 아키텍처
- Backend: FastAPI, SQL Server, LangChain 기반 SQL Agent, JWT 인증
- Frontend: Next.js App Router, 대시보드 UI
- 인증: Access/Refresh 토큰을 httpOnly 쿠키로 저장, 역할 기반 권한 분리(Admin/User)

## 인증 흐름
1. `/api/auth/login` 또는 `/api/auth/signup` 호출
2. `access_token`, `refresh_token` 쿠키 발급
3. `access_token` 만료 시 `/api/auth/refresh`로 재발급
4. 로그아웃/회원탈퇴 시 쿠키 삭제 + refresh 토큰 폐기

## 주요 기능
- 로그인/회원가입 UI 분리, 로그인 화면에서만 이메일 기억 기능 제공
- 프로필 페이지에서 사용자 정보 확인, 로그아웃, 회원 탈퇴(영구 삭제)
- 관리자 전용 사용자 관리 탭
- 사용자 정보 필드 확장: 소속, 학과, 신분, 전화번호, 연락용 이메일
- 모든 API 보호: `/api/auth/*` 제외, 나머지 라우터는 인증 필요

## 디렉터리 구조
```
/ (Root)
|-- backend/                       # FastAPI 백엔드
|   |-- main.py                    # 앱 엔트리
|   |-- routers/                   # API 라우터
|   |-- services/                  # 비즈니스 로직
|   |-- repositories/              # DB 접근
|   |-- utils/                     # 보안, 의존성, 레이트리밋 등
|-- chemical-sample-dashboard/     # Next.js 프론트엔드
|   |-- app/                       # 페이지 라우팅
|   |-- components/                # UI 컴포넌트
|   |-- lib/                       # API/스토리지 유틸
|-- scripts/                       # 테스트/진단 스크립트
|-- api_contract.md                # API 계약 문서
```

## 설치 및 실행
### 사전 준비
- Python 3.11+
- Node.js 18+
- MS SQL Server
- Azure OpenAI 환경 변수

### Backend 실행
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Frontend 실행
```powershell
cd chemical-sample-dashboard
npm install
npm run dev
```

## 환경 변수
환경 변수는 `backend/azure_and_sql.env`를 템플릿으로 참고하세요.

필수 (운영에서 반드시 설정):
- `JWT_SECRET_KEY` 랜덤 문자열
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `OPENAI_API_VERSION`
- `AZURE_DEPLOYMENT_NAME`
- `SQL_SERVER`, `SQL_DATABASE`, `SQL_USERNAME`, `SQL_PASSWORD`

권장:
- `APP_ENV` (development/production)
- `CORS_ALLOW_ORIGINS` 허용 도메인 목록 (예: http://localhost:3000)
- `COOKIE_SAMESITE` (production은 `none` 권장)
- `ENABLE_HSTS` (production에서 1 권장)
- `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `LOGIN_RATE_LIMIT`
- `LOGIN_RATE_LIMIT_STORE` (db | memory | hybrid)
- `CSRF_DISABLED` (1?? CSRF ?? ????)

개발 전용:
- `ALLOW_DEV_LOGIN` (운영에서는 0)
- `DEV_LOGIN_SECRET` (dev-login ?? ? ??)
- `NEXT_PUBLIC_DEV_LOGIN_SECRET` (frontend dev-login ???)
- `NEXT_PUBLIC_ALLOW_DEV_BYPASS` (??? ?? ??? ??? ?? ??)
- `NEXT_PUBLIC_TEST_LOGIN_EMAIL`, `NEXT_PUBLIC_TEST_LOGIN_PASSWORD` (??? ??? ??)
- `SEED_TEST_USERS` (테스트 사용자 자동 생성)
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`

## 스크립트
- `scripts/auth-smoke-test.ps1` 로그인/토큰/권한 동작 확인
- `scripts/security-check.ps1` 운영 보안 설정 점검

## 디버깅 가이드
1. `email_validator` 오류가 뜨면 `pip install -r requirements.txt` 실행
2. `/api/health`가 401이면 로그인 후 쿠키가 전달되는지 확인
3. PowerShell에서 `curl`은 `Invoke-WebRequest`로 동작하므로 `curl.exe` 사용 권장
4. 쿠키가 전달되지 않으면 `CORS_ALLOW_ORIGINS`, `COOKIE_SAMESITE`, HTTPS 여부를 확인
5. `JWT_SECRET_KEY` 미설정 시 서버가 즉시 종료됨
6. POST/PATCH/DELETE 401/403?? `X-CSRF-Token` ??? `csrf_token` ?? ??

## 보안 요약
- JWT Secret 기본값 제거
- CORS 허용 도메인 제한
- Dev Login 운영 차단
- 로그인 시도 제한
- httpOnly 쿠키 기반 토큰 저장
- CSRF double-submit ??
- 보안 헤더 및 HSTS 적용 가능

## 참고
- API 계약: `api_contract.md`
- FastAPI 문서: `http://localhost:8000/docs`
