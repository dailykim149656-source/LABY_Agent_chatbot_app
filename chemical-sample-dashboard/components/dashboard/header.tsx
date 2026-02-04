"use client"

import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { deleteAccount } from "@/lib/data/auth"
import { getUiText } from "@/lib/ui-text"

interface HeaderProps {
  title: string
  language: string
  onMenuClick?: () => void
}


export function DashboardHeader({
  title,
  language,
  onMenuClick,
}: HeaderProps) {
  const uiText = getUiText(language)
  const router = useRouter()
  const { user, logout } = useAuth()
  const displayName = user?.name?.trim() || user?.email || uiText.userName
  const roleLabel =
    user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser
  const avatarFallback = displayName.trim().slice(0, 1).toUpperCase()
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick && (
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
        )}
        <h2 className="min-w-0 truncate text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-1.5 text-left transition-colors hover:bg-secondary/80"
            >
              <Avatar className="size-9">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
    </header>
  )
}
