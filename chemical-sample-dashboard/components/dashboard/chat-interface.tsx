"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Mic, MicOff } from "lucide-react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleVoiceCommand = useCallback(
    async (command: string) => {
      if (command.trim() && !isSending) {
        await onSend(command)
      }
    },
    [isSending, onSend]
  )

  const speechLanguage = language === "KR" ? "ko-KR" : language === "JP" ? "ja-JP" : language === "CN" ? "zh-CN" : "en-US"

  const [wakeWordDetected, setWakeWordDetected] = useState(false)

  const handleWakeWord = useCallback(() => {
    setWakeWordDetected(true)
    setTimeout(() => setWakeWordDetected(false), 2000)
  }, [])

  const {
    isListening,
    transcript,
    interimTranscript,
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

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const content = input
    setInput("")
    await onSend(content)
  }

  const formatTime = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
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
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
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
                 wakeWordDetected ? "Wake word 감지!" :
                 uiText.voiceListening}
              </span>
            </div>
            {(interimTranscript || transcript) && (
              <div className="mt-2 rounded bg-background/80 px-2 py-1 font-mono text-xs">
                {interimTranscript || transcript}
              </div>
            )}
            {!interimTranscript && !transcript && isListening && (
              <div className="mt-1 text-xs text-muted-foreground">
                {uiText.voiceWakeWordHint}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
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