"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { DEFAULT_UI_LANG, normalizeUiLang, type UiLang } from "@/lib/ui-text"

const STORAGE_KEY = "laby-ui-lang"

type UiLanguageContextValue = {
  language: UiLang
  setLanguage: (lang: UiLang | string) => void
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null)

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLang>(DEFAULT_UI_LANG)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setLanguageState(normalizeUiLang(saved))
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language, isReady])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      setLanguageState(normalizeUiLang(event.newValue))
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const setLanguage = (next: UiLang | string) => {
    setLanguageState(normalizeUiLang(next))
  }

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language]
  )

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  )
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext)
  if (!context) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider")
  }
  return context
}
