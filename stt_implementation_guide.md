# Azure Speech STT 구현 가이드 (Updated)

작성일: 2026-02-02
대상: LABY Agent Chatbot (chemical-sample-dashboard)
범위: Speech-to-Text 기능 구현 (현재 구현 기준)

---

## 1) 개요

```
┌─────────────────────────────────────────────────────────┐
│                    STT 흐름                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎤 마이크  →  Azure Speech SDK  →  텍스트  →  Chat API  │
│                   ↑                                      │
│                🔑 토큰 발급 (/api/speech/token)           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**주요 특징:**

- **보안**: 백엔드에서 발급한 임시 토큰 사용 (Key 노출 방지)
- **Wake Word**: "헤이 라비", "Hey LABY" 등 호출어 감지
- **연속 듣기**: 끊김 없는 상시 대기 모드 (자동 재연결)

---

## 2) 사전 준비

### Azure Speech 리소스

- 리전: `koreacentral` (또는 설정된 리전)
- 키: 백엔드 환경변수 `AZURE_SPEECH_KEY`로 관리

### 환경변수 설정 (Backend)

```env
# backend/.env
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=koreacentral
```

### SDK 설치 (Frontend)

```bash
cd chemical-sample-dashboard
npm install microsoft-cognitiveservices-speech-sdk
```

---

## 3) 파일 구조

```
chemical-sample-dashboard/
├── lib/
│   └── data/
│       └── speech.ts        # 토큰 발급 API 클라이언트
├── hooks/
│   └── use-speech.ts        # STT 로직 (Wake Word, 연속 듣기)
```

**Backend:**

```
backend/
└── routers/
    └── speech.py            # 토큰 발급 API 구현
```

---

## 4) 백엔드 구현 (`backend/routers/speech.py`)

프론트엔드에 직접 Key를 노출하지 않고, 임시 토큰을 발급하는 API를 제공합니다.

- **Endpoint**: `GET /api/speech/token`
- **Response**: `{ token: string, region: string }`
- **유효기간**: 10분

---

## 5) 프론트엔드 구현 (`hooks/use-speech.ts`)

`useSpeech` 훅은 다음과 같은 기능을 제공합니다.

### 주요 기능

1. **Wake Word 감지**:
   - 정규식 패턴을 사용하여 "헤이 라비", "라비야" 등을 로컬에서 감지
   - Wake Word 감지 시 `onWakeWord` 콜백 실행
   - 감지된 명령어(Wake Word 뒤의 문장)는 `onCommand` 콜백으로 전달

2. **연속 듣기 (Continuous Recognition)**:
   - `startListening()`으로 시작
   - 세션이 끊기거나 에러 발생 시 자동으로 재시작하여 상시 대기 상태 유지

3. **단일 문장 인식 (Added)**:
   - `recognizeOnce()`: 한 문장만 인식하고 종료 (질문용)
   - 질문 버튼을 누르고 음성으로 명령할 때 사용

### 사용 예시

```typescript
"use client";

import { useSpeech } from "@/hooks/use-speech";

export function SpeechComponent() {
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    recognizeOnce, // 추가된 기능
  } = useSpeech({
    onWakeWord: () => console.log("Wake word detected!"),
    onCommand: (cmd) => console.log("Command:", cmd),
  });

  const handleVoiceCommand = async () => {
    try {
      const text = await recognizeOnce();
      console.log("Recognized:", text);
    } catch (e) {
      console.error(e);
    }
  };
}
```

---

## 6) 주요 로직 상세

### Wake Word 패턴

`WAKE_WORD_PATTERNS` 배열에 정의된 정규식을 사용합니다.

- **영어**: `Hey Laby`, `Hi Laby`, `Hello Laby`
- **한국어 지원 목록**:
  - `라비`, `래비`, `레비`, `레이비`, `라비야` 등
  - `래빗`, `레빗`, `레빗츠`, `래빗츠`, `래비츠`, `레비츠`, `라비츠`, `라빗츠`
- **유연한 처리**: 띄어쓰기(`헤 이 라 비`), 호칭형(`라비야`), 문장 시작점 단독 인식 등을 지원합니다.

### 토큰 관리

- `fetchSpeechToken`을 통해 토큰을 받아옵니다.
- 토큰 만료(9분) 전까지 재사용하여 API 호출을 최소화합니다.

---

## 7) 브라우저 호환성 및 주의사항

- **HTTPS 필수**: 마이크 접근을 위해 보안 컨텍스트가 필요합니다.
- **사용자 상호작용**: 브라우저 정책상 최초 오디오 컨텍스트 실행은 사용자 클릭 등이 필요할 수 있습니다.

---

## 8) 향후 계획 (TODO)

- **TTS 연동**: 응답을 음성으로 출력
- **화자 분리**: 다화자 인식 기능 검토
