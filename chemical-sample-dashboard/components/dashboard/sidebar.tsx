"use client"

import { useState } from "react"
import {
  MessageSquare,
  AlertTriangle,
  Beaker,
  Shield,
  Plus,
  Clock,
  Monitor,
  FlaskConical,
  TestTubes,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type TabType = "chatbot" | "monitoring" | "experiments" | "reagents" | "accident"

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onNewChat: () => void
}

const recentChats = [
  { id: "1", title: "시료 #A-2847 문의", time: "2분 전" },
  { id: "2", title: "안전 프로토콜 확인", time: "1시간 전" },
  { id: "3", title: "캐비닛 B-12 점검", time: "3시간 전" },
]

export function DashboardSidebar({ activeTab, onTabChange, onNewChat }: SidebarProps) {
  const [recentChatsOpen, setRecentChatsOpen] = useState(true)

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
          <Beaker className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">ChemBot</h1>
          <p className="text-xs text-sidebar-foreground/60">관제 센터</p>
        </div>
      </div>

      <div className="p-3">
        <Button
          onClick={() => {
            onNewChat()
            onTabChange("chatbot")
          }}
          variant="outline"
          className="w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-4" />
          새 채팅
        </Button>
      </div>

      {/* Collapsible Recent Chats */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setRecentChatsOpen(!recentChatsOpen)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70"
        >
          최근 대화
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              recentChatsOpen ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
        <div
          className={cn(
            "space-y-1 overflow-hidden transition-all duration-200",
            recentChatsOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {recentChats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => onTabChange("chatbot")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <Clock className="size-3.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate text-left">{chat.title}</span>
              <span className="shrink-0 text-xs text-sidebar-foreground/40">{chat.time}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border" />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={() => onTabChange("chatbot")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "chatbot"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <MessageSquare className="size-4" />
          챗봇
        </button>
        <button
          type="button"
          onClick={() => onTabChange("monitoring")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "monitoring"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Monitor className="size-4" />
          모니터링
        </button>
        <button
          type="button"
          onClick={() => onTabChange("experiments")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "experiments"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <FlaskConical className="size-4" />
          실험 관리
        </button>
        <button
          type="button"
          onClick={() => onTabChange("reagents")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "reagents"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <TestTubes className="size-4" />
          시약 관리
        </button>
        <button
          type="button"
          onClick={() => onTabChange("accident")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "accident"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <AlertTriangle className="size-4" />
          사고 확인
        </button>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <Shield className="size-4 text-success" />
          <span className="text-xs text-sidebar-foreground/80">시스템 온라인</span>
        </div>
      </div>
    </aside>
  )
}
