# Azure Speech STT 구현 가이드

작성일: 2026-01-31
대상: LABY Agent Chatbot (chemical-sample-dashboard)
범위: Speech-to-Text 기능 구현

---

## 1) 개요

```
┌─────────────────────────────────────────────────────────┐
│                    STT 흐름                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🎤 마이크  →  Azure Speech SDK  →  텍스트  →  Chat API  │
│                                                          │
│  [음성 입력]    [STT 변환]         [결과]     [질문 전송] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2) 사전 준비

### Azure Speech 리소스 생성
1. Azure Portal → "Speech" 리소스 생성
2. 리전: `koreacentral` 권장
3. 가격 계층: Free(F0) 또는 Standard(S0)

### 환경변수 설정
```env
# .env.local
NEXT_PUBLIC_AZURE_SPEECH_KEY=your-speech-key
NEXT_PUBLIC_AZURE_SPEECH_REGION=koreacentral
```

### SDK 설치
```bash
cd chemical-sample-dashboard
npm install microsoft-cognitiveservices-speech-sdk
```

---

## 3) 파일 구조

```
chemical-sample-dashboard/
├── lib/
│   └── speech/
│       ├── config.ts             # Azure Speech 설정
│       └── speech-to-text.ts     # STT 클래스
├── hooks/
│   └── use-speech-recognition.ts # STT React 훅
```

---

## 4) 구현 코드

### A. Speech 설정 (`lib/speech/config.ts`)

```typescript
import * as sdk from "microsoft-cognitiveservices-speech-sdk"

export const SPEECH_KEY = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || ""
export const SPEECH_REGION = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || "koreacentral"

export function createSpeechConfig() {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    throw new Error("Azure Speech credentials not configured")
  }
  const config = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION)
  config.speechRecognitionLanguage = "ko-KR"
  return config
}
```

### B. STT 클래스 (`lib/speech/speech-to-text.ts`)

```typescript
import * as sdk from "microsoft-cognitiveservices-speech-sdk"
import { createSpeechConfig } from "./config"

export type STTEventHandlers = {
  onRecognizing?: (text: string) => void   // 실시간 중간 결과
  onRecognized?: (text: string) => void    // 최종 결과
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export class SpeechToText {
  private recognizer: sdk.SpeechRecognizer | null = null
  private isListening = false

  /**
   * 연속 음성 인식 시작
   * - 마이크에서 계속 듣고 결과를 콜백으로 전달
   */
  async startContinuous(handlers: STTEventHandlers): Promise<void> {
    if (this.isListening) return

    const speechConfig = createSpeechConfig()
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

    // 실시간 중간 결과 (말하는 중)
    this.recognizer.recognizing = (_, event) => {
      if (event.result.reason === sdk.ResultReason.RecognizingSpeech) {
        handlers.onRecognizing?.(event.result.text)
      }
    }

    // 최종 인식 결과 (문장 완료)
    this.recognizer.recognized = (_, event) => {
      if (event.result.reason === sdk.ResultReason.RecognizedSpeech) {
        handlers.onRecognized?.(event.result.text)
      } else if (event.result.reason === sdk.ResultReason.NoMatch) {
        handlers.onError?.("음성을 인식하지 못했습니다")
      }
    }

    // 에러 처리
    this.recognizer.canceled = (_, event) => {
      if (event.reason === sdk.CancellationReason.Error) {
        handlers.onError?.(event.errorDetails)
      }
      this.stop()
    }

    this.recognizer.sessionStarted = () => {
      this.isListening = true
      handlers.onStart?.()
    }

    this.recognizer.sessionStopped = () => {
      this.isListening = false
      handlers.onEnd?.()
    }

    // 연속 인식 시작
    this.recognizer.startContinuousRecognitionAsync(
      () => console.log("STT started"),
      (err) => handlers.onError?.(err)
    )
  }

  /**
   * 단일 문장 인식 (질문용)
   * - 한 문장을 인식하고 자동 종료
   */
  async recognizeOnce(): Promise<string> {
    return new Promise((resolve, reject) => {
      const speechConfig = createSpeechConfig()
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close()
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text)
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error("음성을 인식하지 못했습니다"))
          } else {
            reject(new Error(`인식 실패: ${result.reason}`))
          }
        },
        (error) => {
          recognizer.close()
          reject(error)
        }
      )
    })
  }

  /**
   * 음성 인식 중지
   */
  stop(): void {
    if (this.recognizer) {
      this.recognizer.stopContinuousRecognitionAsync(
        () => console.log("STT stopped"),
        (err) => console.error("STT stop error:", err)
      )
      this.recognizer.close()
      this.recognizer = null
      this.isListening = false
    }
  }

  /**
   * 현재 인식 중인지 확인
   */
  get listening(): boolean {
    return this.isListening
  }
}
```

### C. React 훅 (`hooks/use-speech-recognition.ts`)

```typescript
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SpeechToText } from "@/lib/speech/speech-to-text"

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const sttRef = useRef<SpeechToText | null>(null)

  // 컴포넌트 마운트 시 STT 인스턴스 생성
  useEffect(() => {
    sttRef.current = new SpeechToText()
    return () => {
      sttRef.current?.stop()
    }
  }, [])

  /**
   * 연속 음성 인식 시작
   */
  const startListening = useCallback(async () => {
    setError(null)
    setTranscript("")
    setInterimTranscript("")

    try {
      await sttRef.current?.startContinuous({
        onRecognizing: (text) => setInterimTranscript(text),
        onRecognized: (text) => {
          setTranscript((prev) => (prev ? prev + " " + text : text))
          setInterimTranscript("")
        },
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onError: (err) => setError(err),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "STT 시작 실패")
    }
  }, [])

  /**
   * 음성 인식 중지
   */
  const stopListening = useCallback(() => {
    sttRef.current?.stop()
    setIsListening(false)
  }, [])

  /**
   * 단일 문장 인식 (질문용)
   */
  const recognizeOnce = useCallback(async (): Promise<string> => {
    setError(null)
    setIsListening(true)
    try {
      const result = await sttRef.current?.recognizeOnce()
      return result || ""
    } catch (err) {
      const message = err instanceof Error ? err.message : "인식 실패"
      setError(message)
      throw err
    } finally {
      setIsListening(false)
    }
  }, [])

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setTranscript("")
    setInterimTranscript("")
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    recognizeOnce,
    reset,
  }
}
```

---

## 5) 사용 예시

### 단일 문장 인식 (음성 질문)

```typescript
"use client"

import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function VoiceInput({ onResult }: { onResult: (text: string) => void }) {
  const { isListening, error, recognizeOnce } = useSpeechRecognition()

  const handleClick = async () => {
    try {
      const text = await recognizeOnce()
      if (text) {
        onResult(text)
      }
    } catch {
      // 에러는 훅에서 처리됨
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isListening}
      >
        {isListening ? (
          <Mic className="size-5 animate-pulse text-red-500" />
        ) : (
          <MicOff className="size-5" />
        )}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

### 연속 인식 (실시간 자막)

```typescript
"use client"

import { useSpeechRecognition } from "@/hooks/use-speech-recognition"

export function LiveTranscript() {
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition()

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? "중지" : "시작"}
      </button>
      <div>
        <p>{transcript}</p>
        <p className="text-gray-400">{interimTranscript}</p>
      </div>
    </div>
  )
}
```

### Chat 인터페이스 연동

```typescript
"use client"

import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { postChatMessage } from "@/lib/data/chat"

export function VoiceChatInput({ roomId }: { roomId: string }) {
  const { isListening, recognizeOnce } = useSpeechRecognition()

  const handleVoiceInput = async () => {
    try {
      // 1. 음성을 텍스트로 변환
      const question = await recognizeOnce()

      if (question) {
        // 2. 챗봇 API로 질문 전송
        await postChatMessage(roomId, {
          message: question,
          sender_type: "guest",
        })
      }
    } catch (error) {
      console.error("Voice input failed:", error)
    }
  }

  return (
    <button onClick={handleVoiceInput} disabled={isListening}>
      {isListening ? "듣는 중..." : "🎤 음성으로 질문"}
    </button>
  )
}
```

---

## 6) 지원 언어

| 코드 | 언어 |
|------|------|
| `ko-KR` | 한국어 (기본) |
| `en-US` | 영어 (미국) |
| `ja-JP` | 일본어 |
| `zh-CN` | 중국어 (간체) |

언어 변경:
```typescript
config.speechRecognitionLanguage = "en-US"
```

---

## 7) 브라우저 호환성

| 브라우저 | 지원 |
|---------|------|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Safari | ⚠️ 제한적 |

**주의사항:**
- HTTPS 필수 (마이크 접근 권한)
- 사용자 제스처 후 마이크 접근 가능 (자동 시작 불가)

---

## 8) 예상 비용

| 항목 | 무료 계층 (F0) | 유료 계층 (S0) |
|------|---------------|---------------|
| STT | 5시간/월 | $1/시간 |
| 실시간 STT | 5시간/월 | $1.40/시간 |

---

## 9) 문제 해결

### 마이크 권한 오류
```
Error: Microphone access denied
```
→ 브라우저 설정에서 마이크 권한 허용

### 인식 안됨
```
NoMatch: Speech could not be recognized
```
→ 마이크 입력 볼륨 확인, 조용한 환경에서 테스트

### SDK 로드 실패
```
Error: Speech SDK not loaded
```
→ `npm install microsoft-cognitiveservices-speech-sdk` 확인

---

## 10) 다음 단계

- [ ] TTS 구현 (응답 음성 출력)
- [ ] Wake Word 구현 ("Hey LABY")
- [ ] 사고 알림 TTS 연동
