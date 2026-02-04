"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Shield,
  Plus,
  Clock,
  Pencil,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatRoom } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { deleteAccount } from "@/lib/data/auth"
import { getUiLocale, getUiText, LANGUAGE_OPTIONS } from "@/lib/ui-text"

export type TabType =
  | "chatbot"
  | "monitoring"
  | "experiments"
  | "reagents"
  | "accident"
  | "about"
  | "users"

interface SidebarProps {
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
  // DB에서 UTC로 저장된 시간을 파싱 (Z 접미사가 없으면 추가)
  let dateStr = timestamp
  if (!dateStr.endsWith("Z") && !dateStr.includes("+") && !dateStr.includes("-", 10)) {
    dateStr = dateStr.replace(" ", "T") + "Z"
  }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ""
  // 사용자 로컬 시간으로 표시
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
}

export function DashboardSidebar({
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
  const router = useRouter()
  const { user, logout } = useAuth()
  const [recentChatsOpen, setRecentChatsOpen] = useState(true)
  const [displayCount, setDisplayCount] = useState(10)
  const sortedRooms = useMemo(() => rooms, [rooms])
  const displayedRooms = useMemo(() => sortedRooms.slice(0, displayCount), [sortedRooms, displayCount])
  const hasMore = sortedRooms.length > displayCount
  const remainingCount = sortedRooms.length - displayCount
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const displayName = user?.name?.trim() || user?.email || uiText.userName
  const roleLabel =
    user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser
  const avatarFallback = displayName.trim().slice(0, 1).toUpperCase()

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
    <aside className="flex h-full w-72 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <Link
        href="/about"
        className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5"
        aria-label="LabIT 소개 페이지"
      >
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg">
          <Image
            src="/laby-logo.PNG"
            alt="LabIT Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">LabIT</h1>
        </div>
      </Link>

      <div className="border-b border-sidebar-border p-3 lg:p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-sidebar/80 px-4 py-3 text-left text-sidebar-foreground shadow-sm transition-colors hover:bg-sidebar/90"
            >
              <Avatar className="size-12">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/70">{roleLabel}</p>
              </div>
              <ChevronDown className="size-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              {uiText.profileMenuProfile}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void logout()}>
              {uiText.logoutButton}
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  {uiText.profileMenuDelete}
                </DropdownMenuItem>
              }
              title={uiText.profileDeleteTitle}
              description={uiText.profileDeleteDescription}
              confirmText={uiText.profileDeleteConfirm}
              cancelText={uiText.actionCancel}
              onConfirm={async () => {
                try {
                  await deleteAccount()
                  await logout()
                } catch {
                  window.alert(uiText.profileDeleteFailed)
                }
              }}
              variant="destructive"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapsible Recent Chats */}
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <Button
          onClick={() => {
            onNewChat()
            onTabChange("chatbot")
          }}
          variant="outline"
          className="mb-3 w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-4" />
          {uiText.newChat}
        </Button>
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
            "min-h-0 space-y-1 transition-all duration-200",
            recentChatsOpen ? "flex-1 overflow-y-auto opacity-100" : "max-h-0 overflow-hidden opacity-0"
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
          {displayedRooms.map((chat) => (
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
          {hasMore && (
            <button
              type="button"
              onClick={() => setDisplayCount((prev) => prev + 10)}
              className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/70"
            >
              <ChevronDown className="size-3" />
              {uiText.showMore || "더보기"} ({remainingCount})
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3 lg:p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <Shield className="size-4 text-success" />
          <span className="text-xs text-sidebar-foreground/80">{uiText.systemNormal}</span>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3 lg:p-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-sidebar-border bg-sidebar text-xs text-sidebar-foreground hover:bg-sidebar/90 hover:text-sidebar-foreground"
                >
                  <Globe className="size-3.5" />
                  {language}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-sidebar text-sidebar-foreground border-sidebar-border"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={cn(
                      "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground",
                      language === lang.code &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
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
