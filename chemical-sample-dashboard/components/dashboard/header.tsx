"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlignJustify,
  FileText,
  FlaskConical,
  Menu,
  MessageSquare,
  Monitor,
  TestTubes,
  Users,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { getUiText, LANGUAGE_OPTIONS } from "@/lib/ui-text"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { deleteAccount } from "@/lib/data/auth"
import type { TabType } from "@/components/dashboard/sidebar"

interface HeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  language: string
  isAdmin: boolean
  onMenuClick?: () => void
  showBrand?: boolean
  showUsersTab?: boolean
  showMenu?: boolean
  onLanguageChange?: (lang: string) => void
  alignTabsWithSidebar?: boolean
}

export function DashboardHeader({
  activeTab,
  onTabChange,
  language,
  isAdmin,
  onMenuClick,
  showBrand = false,
  showUsersTab = true,
  showMenu = true,
  onLanguageChange,
  alignTabsWithSidebar = false,
}: HeaderProps) {
  const uiText = getUiText(language)
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const displayName = user?.name?.trim() || user?.email || uiText.userName
  const roleLabel =
    user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser
  const avatarFallback = displayName.trim().slice(0, 1).toUpperCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  const tabs = [
    { id: "chatbot", label: uiText.tabChatbot, icon: MessageSquare },
    { id: "monitoring", label: uiText.tabMonitoring, icon: Monitor },
    { id: "experiments", label: uiText.tabExperiments, icon: FlaskConical },
    { id: "reagents", label: uiText.tabReagents, icon: TestTubes },
    { id: "accident", label: uiText.tabRecords, icon: FileText },
    { id: "users", label: uiText.tabUsers, icon: Users, adminOnly: true },
  ]
    .filter((tab) => (tab.adminOnly ? isAdmin : true))
    .filter((tab) => (tab.id === "users" ? showUsersTab : true)) as Array<{
    id: TabType
    label: string
    icon: typeof MessageSquare
  }>

  return (
    <header className="relative grid h-20 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-sidebar-border bg-sidebar px-2 text-sidebar-foreground sm:px-4">
      <div
        className={cn(
          "flex items-center gap-2 min-w-[44px]",
          showBrand ? "md:min-w-[180px]" : "md:min-w-0"
        )}
      >
        {onMenuClick && (
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
        )}
        {showBrand && (
          <Link href="/about" className="flex items-center gap-3 pl-4 sm:pl-2">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg">
              <Image
                src="/laby-logo.PNG"
                alt="LabIT Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="hidden text-lg font-semibold tracking-tight sm:inline font-title">
              LabIT
            </span>
          </Link>
        )}
      </div>

      <nav
        className={cn(
          "flex items-center gap-1 overflow-hidden md:justify-start md:gap-[2px]",
          alignTabsWithSidebar &&
            "lg:absolute lg:left-72 lg:right-20 lg:h-full lg:items-center lg:pl-6"
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-[11px] transition-colors sm:text-xs md:flex-none md:text-sm",
                isActive
                  ? "bg-sidebar/70 font-semibold text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar/60"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              title={tab.label}
            >
              <Icon className="size-4 shrink-0 md:hidden" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex items-center justify-end">
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar"
                aria-label="Open settings"
              >
                <AlignJustify className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 text-[#1D2559]">
              <Avatar className="size-10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-[#1D2559]/70">{roleLabel}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">{uiText.settingsTheme}</p>
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

            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">{uiText.settingsLanguage}</p>
              <div className="grid gap-1">
                {LANGUAGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onClick={() => onLanguageChange?.(option.code)}
                    className={language === option.code ? "bg-accent" : ""}
                  >
                    {option.label} ({option.code})
                  </DropdownMenuItem>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-border pt-2">
              <DropdownMenuItem onClick={() => window.location.assign("/profile")}>
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
            </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
