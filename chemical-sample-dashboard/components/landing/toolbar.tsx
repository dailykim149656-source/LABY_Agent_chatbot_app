"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText,
  FlaskConical,
  Home as HomeIcon,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Sun,
  TestTubes,
  Users,
} from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth } from "@/lib/auth-context"
import { deleteAccount } from "@/lib/data/auth"
import { getUiText, LANGUAGE_OPTIONS } from "@/lib/ui-text"
import { useUiLanguage } from "@/lib/use-ui-language"

const navItems = [
  { label: "HOME", href: "/", icon: HomeIcon },
  { label: "CHATBOT", href: "/dashboard?tab=chatbot", icon: MessageSquare },
  { label: "MONITORING", href: "/dashboard?tab=monitoring", icon: Monitor },
  { label: "EXPERIMENT", href: "/dashboard?tab=experiments", icon: FlaskConical },
  { label: "REAGENT", href: "/dashboard?tab=reagents", icon: TestTubes },
  { label: "RECORD", href: "/dashboard?tab=accident", icon: FileText },
  { label: "USERS", href: "/dashboard?tab=users", icon: Users, adminOnly: true },
]

type LandingToolbarProps = {
  navMode?: "full" | "home-only"
  showMenu?: boolean
  onMenuClick?: () => void
}

export function LandingToolbar({
  navMode = "full",
  showMenu = true,
  onMenuClick,
}: LandingToolbarProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { language, setLanguage } = useUiLanguage()
  const uiText = getUiText(language)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const displayName = user?.name?.trim() || user?.email || uiText.userName
  const roleLabel = user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser
  const avatarFallback = displayName.trim().slice(0, 1).toUpperCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  const visibleNavItems =
    navMode === "home-only"
      ? navItems.filter((item) => item.label === "HOME")
      : navItems.filter((item) => (item.adminOnly ? user?.role === "admin" : true))

  const menuDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center text-[#1D2559] dark:text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        {isAuthenticated && (
          <div className="flex items-center gap-3 rounded-lg bg-[#F4F6FA] px-3 py-2 text-[#1D2559]">
            <Avatar className="size-10">
              <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-[#1D2559]/70">{roleLabel}</p>
            </div>
          </div>
        )}

        <div className={isAuthenticated ? "mt-3 space-y-2" : "space-y-2"}>
          <p className="text-xs text-[#1D2559]/60 dark:text-white/70">{uiText.settingsTheme}</p>
          <div className="flex items-center gap-1">
            {mounted && (
              <>
                <button
                  type="button"
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    theme === "light" ? "bg-[#1D2559] text-white" : "bg-[#F4F6FA] text-[#1D2559]"
                  }`}
                  onClick={() => setTheme("light")}
                  title={uiText.settingsThemeLight}
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    theme === "dark" ? "bg-[#1D2559] text-white" : "bg-[#F4F6FA] text-[#1D2559]"
                  }`}
                  onClick={() => setTheme("dark")}
                  title={uiText.settingsThemeDark}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    theme === "system" ? "bg-[#1D2559] text-white" : "bg-[#F4F6FA] text-[#1D2559]"
                  }`}
                  onClick={() => setTheme("system")}
                  title={uiText.settingsThemeSystem}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#1D2559]/60 dark:text-white/70">{uiText.settingsLanguage}</p>
          <div className="grid gap-1">
            {LANGUAGE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.code}
                onClick={() => setLanguage(option.code)}
                className={language === option.code ? "bg-[#E1E1E1]" : ""}
              >
                {option.label} ({option.code})
              </DropdownMenuItem>
            ))}
          </div>
        </div>

        <div className="mt-3 border-t border-[#E1E1E1] pt-2">
          {isAuthenticated ? (
            <>
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
            </>
          ) : (
            <DropdownMenuItem onClick={() => window.location.assign("/login")}>
              {uiText.loginButton}
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <header className="border-b border-[#E1E1E1] bg-white dark:border-[#1D2559] dark:bg-[#1D2559]">
      <div className="mx-auto flex min-h-[60px] max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <nav className="flex flex-1 items-center gap-2 overflow-x-auto text-[10px] font-semibold tracking-[0.12em] text-[#1D2559] dark:text-white md:gap-5 md:overflow-visible md:text-[11px] md:tracking-[0.18em]">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className="flex min-w-[44px] items-center justify-center rounded-md px-2 py-2 transition-colors hover:bg-[#E1E1E1] dark:hover:bg-white/10 md:min-w-0 md:px-0 md:py-0 md:hover:bg-transparent md:dark:hover:bg-transparent"
              >
                <Icon className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        {showMenu && (
          <div className="ml-auto flex items-center">
            {onMenuClick ? (
              <>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center text-[#1D2559] dark:text-white lg:hidden"
                  aria-label="Open menu"
                  onClick={onMenuClick}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden lg:block">{menuDropdown}</div>
              </>
            ) : (
              menuDropdown
            )}
          </div>
        )}
      </div>
    </header>
  )
}
