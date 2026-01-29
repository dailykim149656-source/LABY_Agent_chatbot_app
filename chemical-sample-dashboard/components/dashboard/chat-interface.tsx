"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/types"

interface ChatInterfaceProps {
  roomId?: string | null
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  onSend: (message: string) => Promise<void>
}

export function ChatInterface({
  roomId,
  messages,
  isLoading,
  isSending,
  onSend,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    return date.toLocaleTimeString("ko-KR", {
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
              Select a chat room or start a new one to begin.
            </div>
          )}
          {isLoading && messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Loading messages...
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
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about chemical samples or safety protocols..."
            suppressHydrationWarning
            className="flex-1 focus-visible:ring-primary"
          />
          <Button
            onClick={handleSend}
            className="gap-2 bg-primary hover:bg-primary/90"
            disabled={isSending}
          >
            <Send className="size-4" />
            전송
          </Button>
        </div>
      </div>
    </div>
  )
}
