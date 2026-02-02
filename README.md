# Smart Lab Assistant & Dashboard (지능형 실험실 관리 시스템)

## 🤝 팀 협업 가이드 (병렬 작업 시 충돌 방지)

> **목표**: 팀원들이 기능 구현 및 F/E-B/E 연동 작업을 병렬로 진행해도 충돌이 최소화되도록 합니다.

### 📌 핵심 원칙

| 원칙                      | 설명                                                                                            |
| :------------------------ | :---------------------------------------------------------------------------------------------- |
| **도메인별 파일 분리**    | 실험/시약/모니터링 등 도메인별로 파일이 분리되어 있습니다. **자신의 도메인 파일만 수정**하세요. |
| **공통 파일 변경 최소화** | `backend/main.py`, `backend/schemas.py`, `lib/types.ts`는 **변경 시 반드시 팀 공유**            |
| **API 계약 우선**         | 기능 구현 전 `api_contract.md`에 스키마/엔드포인트를 **먼저 합의**하세요.                       |

### 📂 파일 소유권 규칙

**Backend** (새 기능 추가 시 아래 파일들을 **새로 생성**):

- `backend/routers/<feature>.py` - API 엔드포인트
- `backend/services/<feature>_service.py` - 비즈니스 로직
- `backend/repositories/<feature>_repo.py` - DB 접근 (선택)
- `backend/main.py`에 `include_router()` 한 줄만 추가

**Frontend** (새 기능 추가 시 아래 파일들을 **새로 생성**):

- `lib/data/<feature>.ts` - API 클라이언트
- `hooks/use-<feature>.ts` - 데이터 훅
- 컴포넌트는 훅만 사용하여 데이터 접근

### 🔄 F/E-B/E 연동 규칙

1. **Mock 모드 지원**: B/E API가 준비되지 않으면 환경변수 `NEXT_PUBLIC_USE_MOCKS=1` 사용
2. **타입 정의 동기화**: B/E `schemas.py` ↔ F/E `lib/types.ts` 항상 일치시킬 것
3. **점진적 전환**: 기존 필드 즉시 삭제 금지, 새 필드 추가 → 전환 → 제거 순서

### 📋 체크리스트 (작업 전/후)

- [ ] 작업할 도메인 파일 확인 (다른 도메인 파일 수정 금지)
- [ ] `api_contract.md` 변경사항 반영 여부
- [ ] 공통 파일 변경 시 팀 공유 여부
- [ ] PR 생성 시 `.github/PULL_REQUEST_TEMPLATE.md` 활용

> 💡 상세 규칙은 [`coding_guide.md`](./coding_guide.md) 참조

---

이 프로젝트는 실험실의 안전과 실험 데이터를 효율적으로 관리하기 위한 **지능형 챗봇 및 대시보드 시스템**입니다.
Backend는 **FastAPI**와 **LangChain**을 기반으로 한 SQL Agent를 통해 자연어 질의를 처리하며, Frontend는 **Next.js**로 구축된 대시보드를 통해 실시간 모니터링 및 시각화 된 정보를 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. Backend (FastAPI + AI Agent)

- **SQL Agent (AI 챗봇)**:
  - **자연어 질의 처리**: 사용자의 자연어 질문을 SQL 쿼리로 변환하여 데이터베이스에서 정보를 조회합니다.
  - **실험 관리 (Lab Experiments)**: 새로운 실험 세션 생성, 실험 데이터(물질, 부피, 밀도 등) 기록 및 조회 기능을 제공합니다.
  - **안전 사고 감지 (Fall Detection)**: '넘어짐', '낙상' 등의 키워드를 인식하여 확인되지 않은 최근 사고 데이터를 조회하고 보고합니다.
  - **사고 검증 워크플로우**: 미확인 사고에 대해 사용자가 '확인(True Positive)' 또는 '오탐(False Positive)' 여부를 챗봇을 통해 직접 처리할 수 있습니다.
- **API 서비스**:
  - 건강 상태 확인 (`/health`), 사고 기록 (`/accidents`), 시스템 로그 (`/logs`), 안전 관련 (`/safety`) 등의 API 엔드포인트를 제공합니다.
- **MS SQL Server 연동**: 실험 데이터, 사고 이벤트(FallEvents), 채팅 로그 등을 저장하고 관리합니다.

### 2. Frontend (Next.js Dashboard)

- **통합 대시보드 UI**:
  - **Chatbot Interface**: AI Agent와 대화하며 명령을 내리고 답변을 받을 수 있는 채팅 인터페이스입니다.
  - **실시간 모니터링 (Monitoring View)**: 실험실 내 센서 및 카메라 데이터를 실시간으로 모니터링합니다.
  - **실험 관리 (Experiments View)**: 실험 생성 및 데이터 기록 현황을 시각적으로 관리합니다.
  - **시약 관리 (Reagents View)**: 연구실 내 시약 재고 및 상태를 관리합니다.
  - **사고 확인 (Accident Confirmation)**: 감지된 사고 이벤트에 대한 알림과 검증 인터페이스를 제공합니다.
- **안전 상태 표시 (Safety Status)**: 현재 실험실의 안전 등급 및 상태를 실시간으로 표시합니다.

---

## 📂 파일 구조 (File Structure)

전체 프로젝트는 크게 `backend`와 `frontend` (chemical-sample-dashboard)로 나뉘어져 있습니다.

```
/ (Root)
├── backend/                        # Backend (FastAPI Application)
│   ├── main.py                     # FastAPI 앱 실행 진입점 (Entry Point)
│   ├── sql_agent.py                # LangChain 기반 SQL Agent 로직 (AI 핵심)
│   ├── requirements.txt            # Python 의존성 라이브러리 목록
│   ├── routers/                    # API 라우터 (기능별 분리)
│   │   ├── chat.py                 # 채팅 API (Agent 연동)
│   │   ├── accidents.py, logs.py   # 사고 데이터 및 로그 처리
│   │   └── ...
│   ├── services/                   # 비즈니스 로직 서비스 계층
│   └── schemas.py                  # Pydantic 데이터 스키마 정의
│
├── chemical-sample-dashboard/      # Frontend (Next.js Application)
│   ├── app/                        # Next.js App Router (페이지 및 레이아웃)
│   │   ├── page.tsx                # 메인 대시보드 페이지 (탭 구성)
│   │   └── layout.tsx              # 전역 레이아웃
│   ├── components/                 # UI 컴포넌트
│   │   ├── dashboard/              # 대시보드 전용 컴포넌트 (Sidebar, Chat, Views...)
│   │   └── ui/                     # 공통 UI 요소 (Button, Card, Input...)
│   ├── package.json                # Node.js 프로젝트 설정 및 의존성
│   └── ...
│
├── guide.md                        # 간편 설치 및 실행 가이드 (영문)
└── README.md                       # 프로젝트 상세 문서 (본 파일)
```

---

## 🛠 설치 및 실행 방법 (Installation & Usage)

### 사전 준비 (Prerequisites)

- **Python 3.8+**
- **Node.js 18+** & **npm**
- **MS SQL Server** (데이터베이스 연결 정보가 `.env` 파일에 설정되어 있어야 함)

### 1. Backend 설치 및 실행

1.  **프로젝트 루트 경로에서 진행**:
    (현재 위치: `f:\MS AI School\3rd_PJ_2\LABY_chatbot\LABY_Agent_chatbot_app`)

2.  **가상환경 (venv) 생성 및 활성화**:
    - **Windows (Command Prompt / cmd)**:
      ```cmd
      python -m venv venv
      venv\Scripts\activate.bat
      ```
    - **Windows (PowerShell)**:
      ```powershell
      python -m venv venv
      .\venv\Scripts\Activate.ps1
      ```
    - **macOS / Linux**:
      ```bash
      python3 -m venv venv
      source venv/bin/activate
      ```

3.  **필수 라이브러리 설치**:
    - `requirements.txt`가 `backend` 폴더 내에 있으므로 경로를 지정하여 설치합니다.

    ```bash
    pip install -r requirements.txt
    ```

4.  **서버 실행**:
    - `backend` 패키지의 `main` 모듈을 실행합니다.

    ```bash
    uvicorn backend.main:app --reload
    ```

    _(CMD, PowerShell, macOS/Linux 모두 동일)_
    - 서버 주소: `http://localhost:8000`
    - API 문서: `http://localhost:8000/docs`

### 2. Frontend 설치 및 실행

1.  **Frontend 폴더로 이동** (새 터미널 창 이용):

    ```bash
    cd chemical-sample-dashboard
    ```

2.  **의존성 패키지 설치**:

    ```bash
    npm install
    ```

    _(CMD, PowerShell, macOS/Linux 모두 동일)_

3.  **개발 서버 실행**:

    ```bash
    npm run dev
    ```

    _(CMD, PowerShell, macOS/Linux 모두 동일)_
    - 접속 주소: `http://localhost:3000`

---

## ℹ️ 참고 사항

- **환경 변수**: Backend 실행 전 데이터베이스, Azure OpenAI API 키 등 필요한 환경 변수가 설정된 `.env` 파일이 `backend/` 폴더 내에 존재해야 합니다. (`sql_agent.py` 등에서 참조)
- **DB 스키마**: 앱 실행 시 필요한 테이블(`Experiments`, `ExperimentData`, `FallEvents` 등)이 없으면 자동으로 생성하도록 로직이 포함되어 있습니다 (`sql_agent.py`의 `init_db_schema`).
