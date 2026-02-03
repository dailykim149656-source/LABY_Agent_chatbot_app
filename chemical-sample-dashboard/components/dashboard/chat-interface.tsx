"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Mic, MicOff } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getUiLocale, getUiText } from "@/lib/ui-text"
import { useSpeech } from "@/hooks/use-speech"
import type { ChatMessage } from "@/lib/types"

interface ChatInterfaceProps {
  language: string
  roomId?: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  onSend: (message: string) => Promise<void>
}

export function ChatInterface({
  language,
  roomId,
  messages,
  isLoading,
  isSending,
  onSend,
}: ChatInterfaceProps) {
  const uiText = getUiText(language)
  const timeLocale = getUiLocale(language)
  const [input, setInput] = useState("")
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingCommandRef = useRef<string | null>(null)

  // 자동 전송 타이머 정리
  const clearAutoSend = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current)
      autoSendTimerRef.current = null
    }
    setAutoSendCountdown(null)
    pendingCommandRef.current = null
  }, [])

  const handleVoiceCommand = useCallback(
    (command: string) => {
      if (command.trim() && !isSending) {
        setInput(command)
        pendingCommandRef.current = command
        setAutoSendCountdown(3) // 3초 카운트다운

        // 기존 타이머 정리
        if (autoSendTimerRef.current) {
          clearInterval(autoSendTimerRef.current)
        }

        // 1초마다 카운트다운
        let count = 3
        autoSendTimerRef.current = setInterval(() => {
          count -= 1
          if (count <= 0) {
            clearInterval(autoSendTimerRef.current!)
            autoSendTimerRef.current = null
            setAutoSendCountdown(null)
            // 자동 전송
            if (pendingCommandRef.current) {
              const cmd = pendingCommandRef.current
              pendingCommandRef.current = null
              setInput("")
              onSend(cmd)
            }
          } else {
            setAutoSendCountdown(count)
          }
        }, 1000)
      }
    },
    [isSending, onSend]
  )

  // 사용자가 입력을 수정하면 자동 전송 취소
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (autoSendCountdown !== null) {
      clearAutoSend()
    }
  }, [autoSendCountdown, clearAutoSend])

  const speechLanguage = language === "KR" ? "ko-KR" : language === "JP" ? "ja-JP" : language === "CN" ? "zh-CN" : "en-US"

  const [wakeWordDetected, setWakeWordDetected] = useState(false)

  const handleWakeWord = useCallback(() => {
    setWakeWordDetected(true)
    setTimeout(() => setWakeWordDetected(false), 10000) // 10초 대기
  }, [])

  const {
    isListening,
    transcript,
    interimTranscript,
    rawTranscript,
    isSupported,
    status,
    toggleListening,
  } = useSpeech({
    onCommand: handleVoiceCommand,
    onWakeWord: handleWakeWord,
    language: speechLanguage,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSendTimerRef.current) {
        clearInterval(autoSendTimerRef.current)
      }
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    clearAutoSend()
    const content = input
    setInput("")
    await onSend(content)
  }

  const formatTime = (value?: string) => {
    if (!value) return ""
    // DB에서 UTC로 저장된 시간을 파싱 (Z 접미사가 없으면 추가)
    let dateStr = value
    if (!dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
      dateStr = dateStr.replace(" ", "T") + "Z"
    }
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ""
    // 사용자 로컬 시간으로 표시
    return date.toLocaleTimeString(timeLocale, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {!roomId && messages.length === 0 && !isLoading && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {uiText.chatEmpty}
            </div>
          )}
          {isLoading && messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {uiText.chatLoading}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  message.role !== "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.role !== "user" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-3",
                  message.role !== "user"
                    ? "bg-card border border-border"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {message.role !== "user" ? (
                  <div className="prose max-w-none [&>*:first-child]:mt-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="prose max-w-none whitespace-pre-wrap !mt-0">{message.content}</p>
                )}
                <p
                  className={cn(
                    "mt-2 text-xs",
                    message.role !== "user"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70"
                  )}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Bar */}
      <div className="shrink-0 border-t border-border bg-card p-4">
        {/* Voice status indicator */}
        {(isListening || status === "processing") && (
          <div className={cn(
            "mb-2 rounded-md border p-3 text-sm",
            wakeWordDetected
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "border-primary/30 bg-primary/5"
          )}>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                  wakeWordDetected ? "bg-green-500" : "bg-primary"
                )} />
                <span className={cn(
                  "relative inline-flex size-2 rounded-full",
                  wakeWordDetected ? "bg-green-500" : "bg-primary"
                )} />
              </span>
              <span className={wakeWordDetected ? "font-medium text-green-700 dark:text-green-400" : "text-primary"}>
                {status === "processing" ? "연결 중..." :
                 wakeWordDetected ? "✓ Wake word 감지!" :
                 uiText.voiceListening}
              </span>
            </div>
            {/* 실제로 들은 텍스트 표시 */}
            {rawTranscript && (
              <div className="mt-2 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                <span className="font-medium">인식: </span>{rawTranscript}
              </div>
            )}
            {/* wake word 후 명령어 부분 */}
            {(interimTranscript || transcript) && (
              <div className="mt-1 rounded bg-green-100 dark:bg-green-900/50 px-2 py-1 font-mono text-xs text-green-800 dark:text-green-200">
                <span className="font-medium">명령: </span>{interimTranscript || transcript}
              </div>
            )}
            {!rawTranscript && !interimTranscript && !transcript && isListening && (
              <div className="mt-1 text-xs text-muted-foreground">
                {uiText.voiceWakeWordHint}
              </div>
            )}
          </div>
        )}
        {/* 자동 전송 카운트다운 */}
        {autoSendCountdown !== null && (
          <div className="mb-2 flex items-center justify-between rounded-md border border-blue-500 bg-blue-50 dark:bg-blue-950 p-2 text-sm">
            <span className="text-blue-700 dark:text-blue-400">
              {autoSendCountdown}초 후 자동 전송... (수정하면 취소됨)
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={clearAutoSend}
            >
              취소
            </Button>
          </div>
        )}
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                clearAutoSend()
                handleSend()
              }
            }}
            placeholder={isListening ? uiText.voiceListening : uiText.chatPlaceholder}
            suppressHydrationWarning
            className="flex-1 focus-visible:ring-primary"
          />
          {isSupported && (
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              title={isListening ? uiText.voiceStop : uiText.voiceStart}
            >
              {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
          )}
          <Button
            onClick={handleSend}
            className="gap-2 bg-primary hover:bg-primary/90"
            disabled={isSending}
          >
            <Send className="size-4" />
            {uiText.send}
          </Button>
        </div>
      </div>
    </div>
  )
}