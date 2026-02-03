"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  MessageSquare,
  AlertTriangle,
  Beaker,
  Shield,
  Plus,
  Clock,
  Pencil,
  Monitor,
  FlaskConical,
  TestTubes,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChatRoom } from "@/lib/types"
import { getUiLocale, getUiText, LANGUAGE_OPTIONS } from "@/lib/ui-text"

export type TabType = "chatbot" | "monitoring" | "experiments" | "reagents" | "accident"

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onNewChat: () => void
  language: string
  onLanguageChange: (lang: string) => void
  rooms: ChatRoom[]
  activeRoomId: string | null
  onSelectRoom: (roomId: string) => void
  isRoomsLoading: boolean
  onRenameRoom: (roomId: string, title: string) => void
  onDeleteRoom: (roomId: string) => void
}

const formatRoomTime = (room: ChatRoom, locale: string) => {
  const timestamp = room.lastMessageAt || room.createdAt
  if (!timestamp) return ""
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onNewChat,
  language,
  onLanguageChange,
  rooms,
  activeRoomId,
  onSelectRoom,
  isRoomsLoading,
  onRenameRoom,
  onDeleteRoom,
}: SidebarProps) {
  const uiText = getUiText(language)
  const timeLocale = getUiLocale(language)
  const [recentChatsOpen, setRecentChatsOpen] = useState(true)
  const sortedRooms = useMemo(() => rooms, [rooms])
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRename = (room: ChatRoom) => {
    const nextTitle = window.prompt(uiText.renameChatPrompt, room.title)
    if (nextTitle === null) return
    onRenameRoom(room.id, nextTitle)
  }

  const handleDelete = (room: ChatRoom) => {
    const confirmDelete = window.confirm(
      uiText.deleteChatConfirm.replace("{title}", room.title)
    )
    if (!confirmDelete) return
    onDeleteRoom(room.id)
  }

  return (
    <aside className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg">
          <Image
            src="/laby-logo.PNG"
            alt="LABY Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">LabbyIT</h1>
          <p className="text-xs text-sidebar-foreground/60">{uiText.labDashboard}</p>
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
          {uiText.newChat}
        </Button>
      </div>

      {/* Collapsible Recent Chats */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setRecentChatsOpen(!recentChatsOpen)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70"
        >
          {uiText.recentChats}
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
          {isRoomsLoading && (
            <div className="px-3 py-2 text-xs text-sidebar-foreground/50">{uiText.loading}</div>
          )}
          {!isRoomsLoading && sortedRooms.length === 0 && (
            <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
              {uiText.noChats}
            </div>
          )}
          {sortedRooms.map((chat) => (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelectRoom(chat.id)
                onTabChange("chatbot")
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onSelectRoom(chat.id)
                  onTabChange("chatbot")
                }
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                activeRoomId === chat.id && "bg-sidebar-accent/50 text-sidebar-foreground"
              )}
            >
              <Clock className="size-3.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate text-left">{chat.title}</span>
              <span className="shrink-0 text-xs text-sidebar-foreground/40">
                {formatRoomTime(chat, timeLocale)}
              </span>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRename(chat)
                  }}
                  className="rounded-md p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label={uiText.renameChatLabel}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleDelete(chat)
                  }}
                  className="rounded-md p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label={uiText.deleteChatLabel}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border" />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={() => onTabChange("chatbot")}
          className={cn(
            "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "chatbot"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <MessageSquare className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{uiText.tabChatbot}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("monitoring")}
          className={cn(
            "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "monitoring"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Monitor className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{uiText.tabMonitoring}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("experiments")}
          className={cn(
            "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "experiments"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <FlaskConical className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{uiText.tabExperiments}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("reagents")}
          className={cn(
            "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "reagents"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <TestTubes className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{uiText.tabReagents}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("accident")}
          className={cn(
            "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            activeTab === "accident"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{uiText.tabAccidents}</span>
        </button>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <Shield className="size-4 text-success" />
          <span className="text-xs text-sidebar-foreground/80">{uiText.systemNormal}</span>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/70">{uiText.settingsTheme}</span>
            <div className="flex items-center gap-1">
              {mounted && (
                <>
                  <Button
                    variant={theme === "light" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-7"
                    onClick={() => setTheme("light")}
                    title={uiText.settingsThemeLight}
                  >
                    <Sun className="size-3.5" />
                  </Button>
                  <Button
                    variant={theme === "dark" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-7"
                    onClick={() => setTheme("dark")}
                    title={uiText.settingsThemeDark}
                  >
                    <Moon className="size-3.5" />
                  </Button>
                  <Button
                    variant={theme === "system" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-7"
                    onClick={() => setTheme("system")}
                    title={uiText.settingsThemeSystem}
                  >
                    <Monitor className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/70">{uiText.settingsLanguage}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 bg-transparent text-xs">
                  <Globe className="size-3.5" />
                  {language}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={language === lang.code ? "bg-accent" : ""}
                  >
                    {lang.label} ({lang.code})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </aside>
  )
}
