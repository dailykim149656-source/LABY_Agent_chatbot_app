"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const buildInitialMessages = (): Message[] => [
  {
    id: "1",
    role: "assistant",
    content: "ChemBot ???????. ??? ???????",
    timestamp: new Date(Date.now() - 3600000),
  },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages(buildInitialMessages())
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const content = input
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    setIsSending(true)
    try {
      const data = await fetchJson<{ output: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: content }),
      })
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.output || "No response",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    } catch (error) {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "??? ??????. ?? ??????.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date) => {
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
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="size-4" />
                ) : (
                  <User className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-4 py-3",
                  message.role === "assistant"
                    ? "bg-card border border-border"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p
                  className={cn(
                    "mt-2 text-xs",
                    message.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70"
                  )}
                >
                  {formatTime(message.timestamp)}
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
