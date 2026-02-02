# 사고 알림 TTS 구현 가이드

작성일: 2026-01-31
대상: LABY Agent Chatbot (chemical-sample-dashboard)
범위: 사고(넘어짐) 발생 시 음성 경고 기능 구현

---

## 1) 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      사고 알림 TTS 흐름                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  │  FallEvents  │     │   Frontend   │     │    TTS       │             │
│  │  (DB 테이블)  │────▶│  (폴링/WS)   │────▶│   경고 음성   │────▶ 🔊    │
│  └──────────────┘     └──────────────┘     └──────────────┘             │
│        ↑                                                                 │
│  [넘어짐 감지]                                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**동작 시나리오:**
1. 센서/카메라가 넘어짐 감지 → FallEvents 테이블에 기록
2. 프론트엔드가 주기적으로 새 이벤트 확인 (폴링 또는 WebSocket)
3. 새 사고 감지 시 TTS로 경고 음성 출력

---

## 2) 파일 구조

```
chemical-sample-dashboard/
├── lib/
│   └── speech/
│       ├── config.ts             # Azure Speech 설정
│       ├── text-to-speech.ts     # TTS 클래스
│       └── alert-messages.ts     # 알림 메시지 템플릿
├── hooks/
│   ├── use-speech-synthesis.ts   # TTS 훅
│   └── use-accident-alert.ts     # 사고 알림 훅 (신규)
├── components/
│   └── dashboard/
│       └── accident-alert-speaker.tsx  # 알림 스피커 컴포넌트
```

---

## 3) 구현 코드

### A. 알림 메시지 템플릿 (`lib/speech/alert-messages.ts`)

```typescript
export type AlertSeverity = "critical" | "high" | "medium" | "low"
export type AlertLang = "ko" | "en" | "ja" | "zh"

// 심각도별 메시지 템플릿
export const ALERT_MESSAGES: Record<AlertLang, Record<AlertSeverity, string>> = {
  ko: {
    critical: "긴급 상황입니다! {location}에서 넘어짐이 감지되었습니다. 즉시 확인해 주세요!",
    high: "경고! {location}에서 넘어짐이 감지되었습니다. 확인이 필요합니다.",
    medium: "{location}에서 넘어짐이 감지되었습니다. 상황을 확인해 주세요.",
    low: "{location}에서 경미한 이상이 감지되었습니다.",
  },
  en: {
    critical: "Emergency! A fall has been detected at {location}. Please check immediately!",
    high: "Warning! A fall has been detected at {location}. Attention required.",
    medium: "A fall has been detected at {location}. Please check the situation.",
    low: "Minor incident detected at {location}.",
  },
  ja: {
    critical: "緊急事態です！{location}で転倒が検知されました。すぐに確認してください！",
    high: "警告！{location}で転倒が検知されました。確認が必要です。",
    medium: "{location}で転倒が検知されました。状況を確認してください。",
    low: "{location}で軽微な異常が検知されました。",
  },
  zh: {
    critical: "紧急情况！在{location}检测到跌倒。请立即确认！",
    high: "警告！在{location}检测到跌倒。需要确认。",
    medium: "在{location}检测到跌倒。请确认情况。",
    low: "在{location}检测到轻微异常。",
  },
}

// SSML 템플릿 (강조/속도 조절 포함)
export const ALERT_SSML_TEMPLATES: Record<AlertSeverity, string> = {
  critical: `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{lang}">
  <voice name="{voice}">
    <prosody rate="fast" pitch="high">
      <emphasis level="strong">{message}</emphasis>
    </prosody>
    <break time="300ms"/>
    <prosody rate="medium">
      {message}
    </prosody>
  </voice>
</speak>`,
  high: `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{lang}">
  <voice name="{voice}">
    <prosody rate="medium" pitch="high">
      <emphasis level="moderate">{message}</emphasis>
    </prosody>
  </voice>
</speak>`,
  medium: `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{lang}">
  <voice name="{voice}">
    <prosody rate="medium">
      {message}
    </prosody>
  </voice>
</speak>`,
  low: `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{lang}">
  <voice name="{voice}">
    <prosody rate="slow">
      {message}
    </prosody>
  </voice>
</speak>`,
}

/**
 * 알림 메시지 생성
 */
export function formatAlertMessage(
  severity: AlertSeverity,
  location: string,
  lang: AlertLang = "ko"
): string {
  const template = ALERT_MESSAGES[lang][severity]
  return template.replace("{location}", location || "알 수 없는 위치")
}

/**
 * SSML 알림 메시지 생성
 */
export function formatAlertSSML(
  severity: AlertSeverity,
  location: string,
  lang: AlertLang = "ko",
  voiceName: string = "ko-KR-SunHiNeural"
): string {
  const message = formatAlertMessage(severity, location, lang)
  const langCode = lang === "ko" ? "ko-KR" : lang === "en" ? "en-US" : lang === "ja" ? "ja-JP" : "zh-CN"

  return ALERT_SSML_TEMPLATES[severity]
    .replace(/{message}/g, message)
    .replace("{lang}", langCode)
    .replace("{voice}", voiceName)
}
```

### B. 사고 알림 훅 (`hooks/use-accident-alert.ts`)

```typescript
"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useSpeechSynthesis } from "./use-speech-synthesis"
import {
  formatAlertSSML,
  AlertSeverity,
  AlertLang,
} from "@/lib/speech/alert-messages"

type AccidentEvent = {
  id: number
  title: string
  location: string
  severity: AlertSeverity
  status: string
  reportedAt: string
  verificationStatus?: number
}

type UseAccidentAlertOptions = {
  enabled?: boolean
  pollInterval?: number  // 폴링 주기 (ms)
  lang?: AlertLang
  onAlert?: (event: AccidentEvent) => void
}

export function useAccidentAlert(options: UseAccidentAlertOptions = {}) {
  const {
    enabled = true,
    pollInterval = 5000,
    lang = "ko",
    onAlert,
  } = options

  const { speakSSML, isSpeaking, stop } = useSpeechSynthesis()
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [lastAlertId, setLastAlertId] = useState<number | null>(null)
  const [alertQueue, setAlertQueue] = useState<AccidentEvent[]>([])
  const isProcessingRef = useRef(false)

  // 새 사고 확인
  const checkForNewAccidents = useCallback(async () => {
    if (!isEnabled || isSpeaking) return

    try {
      const response = await fetch("/api/accidents?status=active&limit=5")
      if (!response.ok) return

      const accidents: AccidentEvent[] = await response.json()
      if (!accidents.length) return

      // 새로운 사고만 필터링
      const newAccidents = accidents.filter(
        (acc) => lastAlertId === null || acc.id > lastAlertId
      )

      if (newAccidents.length > 0) {
        // 가장 최신 ID 저장
        const maxId = Math.max(...newAccidents.map((a) => a.id))
        setLastAlertId(maxId)

        // 큐에 추가 (심각도 높은 순으로 정렬)
        const sorted = newAccidents.sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 }
          return order[a.severity] - order[b.severity]
        })

        setAlertQueue((prev) => [...prev, ...sorted])
      }
    } catch (error) {
      console.error("Failed to check accidents:", error)
    }
  }, [isEnabled, isSpeaking, lastAlertId])

  // 알림 큐 처리
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || alertQueue.length === 0 || isSpeaking) {
      return
    }

    isProcessingRef.current = true

    const [current, ...remaining] = alertQueue
    setAlertQueue(remaining)

    try {
      // 콜백 호출
      onAlert?.(current)

      // SSML로 알림 음성 생성
      const ssml = formatAlertSSML(
        current.severity,
        current.location,
        lang
      )

      // 음성 출력
      await speakSSML(ssml)
    } catch (error) {
      console.error("Failed to speak alert:", error)
    } finally {
      isProcessingRef.current = false
    }
  }, [alertQueue, isSpeaking, lang, onAlert, speakSSML])

  // 폴링 설정
  useEffect(() => {
    if (!isEnabled) return

    // 초기 체크
    checkForNewAccidents()

    // 주기적 폴링
    const interval = setInterval(checkForNewAccidents, pollInterval)
    return () => clearInterval(interval)
  }, [isEnabled, pollInterval, checkForNewAccidents])

  // 큐 처리
  useEffect(() => {
    processQueue()
  }, [alertQueue, processQueue])

  // 알림 활성화/비활성화
  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => !prev)
    if (isSpeaking) {
      stop()
    }
  }, [isSpeaking, stop])

  // 현재 알림 스킵
  const skipCurrent = useCallback(() => {
    stop()
    isProcessingRef.current = false
  }, [stop])

  // 모든 알림 지우기
  const clearQueue = useCallback(() => {
    setAlertQueue([])
    stop()
    isProcessingRef.current = false
  }, [stop])

  return {
    isEnabled,
    isSpeaking,
    queueLength: alertQueue.length,
    toggleEnabled,
    skipCurrent,
    clearQueue,
  }
}
```

### C. 알림 스피커 컴포넌트 (`components/dashboard/accident-alert-speaker.tsx`)

```typescript
"use client"

import { Volume2, VolumeX, SkipForward, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAccidentAlert } from "@/hooks/use-accident-alert"
import { cn } from "@/lib/utils"

type AccidentAlertSpeakerProps = {
  lang?: "ko" | "en" | "ja" | "zh"
}

export function AccidentAlertSpeaker({ lang = "ko" }: AccidentAlertSpeakerProps) {
  const {
    isEnabled,
    isSpeaking,
    queueLength,
    toggleEnabled,
    skipCurrent,
    clearQueue,
  } = useAccidentAlert({
    lang,
    pollInterval: 5000,
    onAlert: (event) => {
      console.log("New accident alert:", event)
    },
  })

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* 알림 토글 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleEnabled}
              className={cn(
                "relative",
                isSpeaking && "animate-pulse text-red-500"
              )}
            >
              {isEnabled ? (
                <Volume2 className="size-5" />
              ) : (
                <VolumeX className="size-5 text-muted-foreground" />
              )}
              {queueLength > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {queueLength}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEnabled ? "음성 알림 끄기" : "음성 알림 켜기"}
          </TooltipContent>
        </Tooltip>

        {/* 스킵 버튼 (재생 중일 때만) */}
        {isSpeaking && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={skipCurrent}>
                <SkipForward className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>현재 알림 건너뛰기</TooltipContent>
          </Tooltip>
        )}

        {/* 전체 삭제 버튼 (큐에 항목이 있을 때만) */}
        {queueLength > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={clearQueue}>
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>모든 알림 삭제</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
```

---

## 4) 대시보드 헤더에 통합

### `components/dashboard/header.tsx` 수정

```typescript
import { AccidentAlertSpeaker } from "./accident-alert-speaker"

export function DashboardHeader({ language, ... }) {
  // language를 알림 언어로 매핑
  const alertLang = language === "KR" ? "ko"
                  : language === "EN" ? "en"
                  : language === "JP" ? "ja"
                  : language === "CN" ? "zh"
                  : "ko"

  return (
    <header className="...">
      {/* 기존 헤더 내용 */}

      {/* 사고 알림 스피커 추가 */}
      <div className="flex items-center gap-2">
        <AccidentAlertSpeaker lang={alertLang} />
        {/* 기타 헤더 요소 */}
      </div>
    </header>
  )
}
```

---

## 5) 실시간 알림 (WebSocket 옵션)

폴링 대신 WebSocket으로 실시간 알림 받기:

### Backend WebSocket 엔드포인트

```python
# backend/routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio

router = APIRouter()

# 연결된 클라이언트 목록
connected_clients: List[WebSocket] = []

@router.websocket("/ws/accidents")
async def accident_websocket(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            # 클라이언트로부터 메시지 대기 (keep-alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

# 사고 발생 시 모든 클라이언트에 알림
async def broadcast_accident(accident: dict):
    for client in connected_clients:
        try:
            await client.send_json(accident)
        except:
            connected_clients.remove(client)
```

### Frontend WebSocket 훅

```typescript
// hooks/use-accident-websocket.ts
"use client"

import { useEffect, useRef, useCallback } from "react"

export function useAccidentWebSocket(
  onAccident: (event: any) => void,
  enabled = true
) {
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws/accidents`

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onmessage = (event) => {
      const accident = JSON.parse(event.data)
      onAccident(accident)
    }

    wsRef.current.onclose = () => {
      // 재연결 시도
      setTimeout(connect, 3000)
    }
  }, [enabled, onAccident])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])
}
```

---

## 6) 알림 조건 커스터마이징

### 심각도 필터링

```typescript
const { ... } = useAccidentAlert({
  enabled: true,
  // critical과 high만 음성 알림
  onAlert: (event) => {
    if (event.severity === "low" || event.severity === "medium") {
      return // 낮은 심각도는 음성 알림 스킵
    }
  },
})
```

### 시간대 필터링 (업무 시간만)

```typescript
const isWorkHours = () => {
  const hour = new Date().getHours()
  return hour >= 9 && hour < 18  // 09:00 ~ 18:00
}

const { ... } = useAccidentAlert({
  enabled: isWorkHours(),
})
```

---

## 7) 알림음 추가 (선택)

TTS 전에 경고음을 재생하려면:

```typescript
// lib/speech/alert-sound.ts
export async function playAlertSound(severity: AlertSeverity): Promise<void> {
  const sounds: Record<AlertSeverity, string> = {
    critical: "/sounds/critical-alert.mp3",
    high: "/sounds/warning-alert.mp3",
    medium: "/sounds/info-alert.mp3",
    low: "/sounds/soft-alert.mp3",
  }

  const audio = new Audio(sounds[severity])
  await audio.play()
}

// 사용
await playAlertSound("critical")
await speakSSML(ssml)
```

---

## 8) 테스트 방법

### 1. 수동 테스트

브라우저 콘솔에서:

```javascript
// 가짜 사고 이벤트 발생
fetch("/api/accidents", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "테스트 사고",
    location: "A동 2층",
    severity: "high",
  }),
})
```

### 2. 개발 환경 테스트 버튼

```typescript
// 개발 환경에서만 표시
{process.env.NODE_ENV === "development" && (
  <Button onClick={() => {
    // 테스트 알림 트리거
  }}>
    테스트 알림
  </Button>
)}
```

---

## 9) 주의사항

| 항목 | 설명 |
|------|------|
| **브라우저 정책** | 사용자 상호작용 후에만 오디오 재생 가능 |
| **중복 알림** | 같은 사고에 대해 중복 알림 방지 필요 |
| **배터리** | 모바일에서 폴링은 배터리 소모 증가 |
| **볼륨** | 시스템 볼륨이 꺼져있으면 알림 안 들림 |

---

## 10) 요약

| 파일 | 역할 |
|------|------|
| `alert-messages.ts` | 알림 메시지 템플릿 |
| `use-accident-alert.ts` | 사고 감지 + TTS 알림 훅 |
| `accident-alert-speaker.tsx` | UI 컴포넌트 (토글/스킵) |

**동작 흐름:**
1. 폴링으로 `/api/accidents` 확인
2. 새 사고 감지 시 큐에 추가
3. 심각도순으로 SSML 알림 재생
4. 사용자가 토글/스킵/삭제 가능
