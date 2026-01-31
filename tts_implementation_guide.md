# Azure Speech TTS 구현 가이드

작성일: 2026-01-31
대상: LABY Agent Chatbot (chemical-sample-dashboard)
범위: Text-to-Speech 기능 구현

---

## 1) 개요

```
┌─────────────────────────────────────────────────────────┐
│                    TTS 흐름                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Chat API  →  응답 텍스트  →  Azure Speech SDK  →  🔊   │
│                                                          │
│  [질문]       [답변]          [TTS 변환]        [스피커] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2) 사전 준비

### Azure Speech 리소스
- STT와 동일한 리소스 사용 가능
- 별도 설정 불필요

### 환경변수 (STT와 동일)
```env
# .env.local
NEXT_PUBLIC_AZURE_SPEECH_KEY=your-speech-key
NEXT_PUBLIC_AZURE_SPEECH_REGION=koreacentral
```

### SDK 설치 (STT와 동일)
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

---

## 3) 파일 구조

```
chemical-sample-dashboard/
├── lib/
│   └── speech/
│       ├── config.ts             # Azure Speech 설정 (공유)
│       └── text-to-speech.ts     # TTS 클래스
├── hooks/
│   └── use-speech-synthesis.ts   # TTS React 훅
```

---

## 4) 구현 코드

### A. TTS 클래스 (`lib/speech/text-to-speech.ts`)

```typescript
import * as sdk from "microsoft-cognitiveservices-speech-sdk"
import { createSpeechConfig } from "./config"

export type TTSEventHandlers = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

// 지원 음성 목록
export const VOICES = {
  "ko-KR": {
    female: "ko-KR-SunHiNeural",    // 여성 (기본)
    male: "ko-KR-InJoonNeural",     // 남성
  },
  "en-US": {
    female: "en-US-JennyNeural",
    male: "en-US-GuyNeural",
  },
  "ja-JP": {
    female: "ja-JP-NanamiNeural",
    male: "ja-JP-KeitaNeural",
  },
  "zh-CN": {
    female: "zh-CN-XiaoxiaoNeural",
    male: "zh-CN-YunxiNeural",
  },
} as const

export type VoiceLang = keyof typeof VOICES
export type VoiceGender = "female" | "male"

export class TextToSpeech {
  private synthesizer: sdk.SpeechSynthesizer | null = null
  private isSpeaking = false
  private lang: VoiceLang = "ko-KR"
  private gender: VoiceGender = "female"

  /**
   * 언어 및 성별 설정
   */
  setVoice(lang: VoiceLang, gender: VoiceGender = "female"): void {
    this.lang = lang
    this.gender = gender
  }

  /**
   * 텍스트를 음성으로 변환하여 재생
   */
  async speak(text: string, handlers?: TTSEventHandlers): Promise<void> {
    if (this.isSpeaking) {
      this.stop()
    }

    return new Promise((resolve, reject) => {
      const speechConfig = createSpeechConfig()

      // 음성 설정
      speechConfig.speechSynthesisLanguage = this.lang
      speechConfig.speechSynthesisVoiceName = VOICES[this.lang][this.gender]

      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput()
      this.synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

      this.isSpeaking = true
      handlers?.onStart?.()

      this.synthesizer.speakTextAsync(
        text,
        (result) => {
          this.isSpeaking = false
          handlers?.onEnd?.()

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve()
          } else {
            const error = `TTS 실패: ${result.errorDetails}`
            handlers?.onError?.(error)
            reject(new Error(error))
          }

          this.cleanup()
        },
        (error) => {
          this.isSpeaking = false
          handlers?.onError?.(error)
          this.cleanup()
          reject(error)
        }
      )
    })
  }

  /**
   * SSML로 세밀한 제어 (속도, 피치, 강조 등)
   */
  async speakSSML(ssml: string, handlers?: TTSEventHandlers): Promise<void> {
    if (this.isSpeaking) {
      this.stop()
    }

    return new Promise((resolve, reject) => {
      const speechConfig = createSpeechConfig()
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput()
      this.synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

      this.isSpeaking = true
      handlers?.onStart?.()

      this.synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          this.isSpeaking = false
          handlers?.onEnd?.()

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve()
          } else {
            const error = `TTS 실패: ${result.errorDetails}`
            handlers?.onError?.(error)
            reject(new Error(error))
          }

          this.cleanup()
        },
        (error) => {
          this.isSpeaking = false
          handlers?.onError?.(error)
          this.cleanup()
          reject(error)
        }
      )
    })
  }

  /**
   * 음성 재생 중지
   */
  stop(): void {
    if (this.synthesizer) {
      this.synthesizer.close()
      this.synthesizer = null
      this.isSpeaking = false
    }
  }

  /**
   * 리소스 정리
   */
  private cleanup(): void {
    if (this.synthesizer) {
      this.synthesizer.close()
      this.synthesizer = null
    }
  }

  /**
   * 현재 재생 중인지 확인
   */
  get speaking(): boolean {
    return this.isSpeaking
  }
}
```

### B. React 훅 (`hooks/use-speech-synthesis.ts`)

```typescript
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { TextToSpeech, VoiceLang, VoiceGender } from "@/lib/speech/text-to-speech"

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ttsRef = useRef<TextToSpeech | null>(null)

  // 컴포넌트 마운트 시 TTS 인스턴스 생성
  useEffect(() => {
    ttsRef.current = new TextToSpeech()
    return () => {
      ttsRef.current?.stop()
    }
  }, [])

  /**
   * 텍스트를 음성으로 재생
   */
  const speak = useCallback(async (text: string) => {
    setError(null)
    try {
      await ttsRef.current?.speak(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (err) => setError(err),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "TTS 실패")
    }
  }, [])

  /**
   * SSML로 재생
   */
  const speakSSML = useCallback(async (ssml: string) => {
    setError(null)
    try {
      await ttsRef.current?.speakSSML(ssml, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (err) => setError(err),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "TTS 실패")
    }
  }, [])

  /**
   * 음성 설정 변경
   */
  const setVoice = useCallback((lang: VoiceLang, gender: VoiceGender = "female") => {
    ttsRef.current?.setVoice(lang, gender)
  }, [])

  /**
   * 재생 중지
   */
  const stop = useCallback(() => {
    ttsRef.current?.stop()
    setIsSpeaking(false)
  }, [])

  return {
    isSpeaking,
    error,
    speak,
    speakSSML,
    setVoice,
    stop,
  }
}
```

---

## 5) 사용 예시

### 기본 사용

```typescript
"use client"

import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SpeakButton({ text }: { text: string }) {
  const { isSpeaking, speak, stop } = useSpeechSynthesis()

  const handleClick = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak(text)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      {isSpeaking ? (
        <Volume2 className="size-5 animate-pulse text-blue-500" />
      ) : (
        <VolumeX className="size-5" />
      )}
    </Button>
  )
}
```

### Chat 응답 읽기

```typescript
"use client"

import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { postChatMessage } from "@/lib/data/chat"

export function VoiceChat({ roomId }: { roomId: string }) {
  const { speak, isSpeaking } = useSpeechSynthesis()

  const sendAndSpeak = async (message: string) => {
    // 1. 챗봇 API 호출
    const response = await postChatMessage(roomId, {
      message,
      sender_type: "guest",
    })

    // 2. 응답을 음성으로 출력
    await speak(response.assistantMessage.content)
  }

  return (
    <div>
      <button onClick={() => sendAndSpeak("오늘 실험 일정 알려줘")}>
        질문하기
      </button>
      {isSpeaking && <span>🔊 읽는 중...</span>}
    </div>
  )
}
```

### 언어별 음성 변경

```typescript
const { speak, setVoice } = useSpeechSynthesis()

// 한국어 여성 음성 (기본)
setVoice("ko-KR", "female")
await speak("안녕하세요")

// 영어 남성 음성
setVoice("en-US", "male")
await speak("Hello, how can I help you?")

// 일본어 여성 음성
setVoice("ja-JP", "female")
await speak("こんにちは")
```

---

## 6) SSML 활용

SSML(Speech Synthesis Markup Language)로 세밀한 제어 가능:

### 속도/피치 조절

```typescript
const { speakSSML } = useSpeechSynthesis()

const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
  <voice name="ko-KR-SunHiNeural">
    <prosody rate="slow" pitch="high">
      천천히, 높은 톤으로 말합니다.
    </prosody>
  </voice>
</speak>
`

await speakSSML(ssml)
```

### 강조/일시정지

```typescript
const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
  <voice name="ko-KR-SunHiNeural">
    <emphasis level="strong">경고!</emphasis>
    <break time="500ms"/>
    넘어짐이 감지되었습니다.
  </voice>
</speak>
`
```

### 감정 표현 (Neural 음성)

```typescript
const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR">
  <voice name="ko-KR-SunHiNeural">
    <mstts:express-as style="cheerful" xmlns:mstts="https://www.w3.org/2001/mstts">
      안녕하세요! 무엇을 도와드릴까요?
    </mstts:express-as>
  </voice>
</speak>
`
```

---

## 7) 지원 음성 목록

### 한국어 (ko-KR)

| 음성 이름 | 성별 | 스타일 |
|----------|------|--------|
| ko-KR-SunHiNeural | 여성 | 일반 |
| ko-KR-InJoonNeural | 남성 | 일반 |
| ko-KR-HyunsuNeural | 남성 | 일반 |
| ko-KR-BongJinNeural | 남성 | 일반 |
| ko-KR-GookMinNeural | 남성 | 일반 |
| ko-KR-JiMinNeural | 여성 | 일반 |
| ko-KR-SeoHyeonNeural | 여성 | 일반 |
| ko-KR-SoonBokNeural | 여성 | 일반 |
| ko-KR-YuJinNeural | 여성 | 일반 |

### 영어 (en-US)

| 음성 이름 | 성별 | 스타일 |
|----------|------|--------|
| en-US-JennyNeural | 여성 | 다양한 감정 지원 |
| en-US-GuyNeural | 남성 | 일반 |
| en-US-AriaNeural | 여성 | 뉴스캐스터 스타일 |

---

## 8) 예상 비용

| 항목 | 무료 계층 (F0) | 유료 계층 (S0) |
|------|---------------|---------------|
| Neural TTS | 50만 문자/월 | $16/1M 문자 |
| Standard TTS | 500만 문자/월 | $4/1M 문자 |

**권장:** Neural 음성이 품질이 좋으므로 Neural 사용 권장

---

## 9) 문제 해결

### 소리가 안 들림
- 브라우저 볼륨 확인
- 시스템 오디오 출력 장치 확인
- `AudioConfig.fromDefaultSpeakerOutput()` 확인

### 음성이 끊김
- 네트워크 상태 확인
- 텍스트가 너무 길면 분할 처리

### SSML 오류
```
Error: SSML is invalid
```
- XML 문법 확인
- `xmlns` 네임스페이스 확인
- 음성 이름 오타 확인

---

## 10) 다음 단계

- [ ] 사고 알림 TTS 연동
- [ ] Wake Word 구현 ("Hey LABY")
- [ ] 음성 대화 UI 통합
