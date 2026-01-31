"use client"

import { Globe, User, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUiText, LANGUAGE_OPTIONS } from "@/lib/ui-text"

interface HeaderProps {
  title: string
  language: string
  onLanguageChange: (lang: string) => void
  onMenuClick?: () => void
}


export function DashboardHeader({
  title,
  language,
  onLanguageChange,
  onMenuClick,
}: HeaderProps) {
  const uiText = getUiText(language)
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
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Globe className="size-4" />
              {language}
              <ChevronDown className="size-3" />
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

        <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <User className="size-4 text-primary-foreground" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">{uiText.userName}</p>
            <p className="text-xs text-muted-foreground">{uiText.userRole}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
