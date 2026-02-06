"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Home as HomeIcon,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Play,
  Sun,
  TestTubes,
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
]

const valueProps = [
  {
    title: "DATA PRECISION",
    desc: "인적 오류를 사전에 차단하여 연구 데이터의 신뢰성을 극대화합니다.",
  },
  {
    title: "REAL-TIME CONNECTIVITY",
    desc: "언제 어디서나 실험실의 모든 자산과 환경을 한눈에 파악합니다.",
  },
  {
    title: "PROACTIVE SAFETY",
    desc: "사고를 예측하고 자원 낭비를 방지하여 최적의 환경을 유지합니다.",
  },
]

const featureTiles = [
  {
    key: "agent",
    label: "AGENT",
    desc: "지능형 실험 에이전트",
    image: "/placeholder.jpg",
  },
  {
    key: "monitoring",
    label: "MONITORING",
    desc: "디지털 트윈 실시간 관측",
    image: "/placeholder.jpg",
  },
  {
    key: "experiment",
    label: "EXPERIMENT",
    desc: "실험 환경 설정 구축",
    image: "/placeholder.jpg",
  },
  {
    key: "reagent",
    label: "REAGENT",
    desc: "정밀 시약 재고 관리",
    image: "/placeholder.jpg",
  },
  {
    key: "record",
    label: "RECORD",
    desc: "데이터 기반 실험 리포트",
    image: "/placeholder.jpg",
  },
]

const painpoints = [
  {
    metric: "-30%~86%",
    title: "FATAL HUMAN ERRORS",
    desc: "실험 전 단계에서 발생하는 오류의 30%~86%가 수동 작업에 의한 인적 오류입니다.",
    image: "/intro/painpoint-01.jpg",
  },
  {
    metric: "-70%",
    title: "LACK OF ASSET VISIBILITY",
    desc: "물질 상태나 위치에 대한 실시간 정보 및 자동 업데이트가 부족하다고 응답했습니다.",
    image: "/intro/painpoint-02.jpg",
  },
  {
    metric: "-25%",
    title: "SAFETY MONITORING GAPS",
    desc: "업무 시간의 약 25%를 필요한 시약을 찾거나, 수동으로 데이터를 입력하는 데 소비합니다.",
    image: "/intro/painpoint-03.jpg",
  },
]

const logEntries = [
  {
    time: "10:05:12",
    label: "SYSTEM READY",
    lines: ["LABY SMART LAB INITIALIZED.", "ALL AZURE IOT HUB NODES: ONLINE"],
    tone: "normal",
  },
  {
    time: "10:05:15",
    label: "INVENTORY SYNC",
    lines: ["HCL #1 WEIGHT CHANGE: 238G → 178G DETECTED"],
    tone: "normal",
  },
  {
    time: "11:13:40",
    label: "EMERGENCY PUSH",
    lines: ["EVENT ID 447: FALL_CONFIRMED (SPILLAGE DETECTION)"],
    tone: "alert",
  },
  {
    time: "11:13:42",
    label: "VISUAL WARNING",
    lines: ["RED ALERT TRIGGERED IN ZONE B; 3D MODEL SYNCED"],
    tone: "alert",
  },
  {
    time: "13:00:00",
    label: "STORAGE HUMIDITY",
    lines: ["68% (EXCEEDS THRESHOLD: 60%)"],
    tone: "normal",
  },
]

export default function HomePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const { language, setLanguage } = useUiLanguage()
  const uiText = getUiText(language)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activePreview, setActivePreview] = useState(featureTiles[0].key)

  const displayName = user?.name?.trim() || user?.email || uiText.userName
  const roleLabel = user?.role === "admin" ? uiText.usersRoleAdmin : uiText.usersRoleUser
  const avatarFallback = displayName.trim().slice(0, 1).toUpperCase()

  useEffect(() => {
    setMounted(true)
  }, [])

  const activePreviewData =
    featureTiles.find((tab) => tab.key === activePreview) ?? featureTiles[0]

  const handlePrevPreview = () => {
    setActivePreview((current) => {
      const index = featureTiles.findIndex((tab) => tab.key === current)
      const nextIndex = (index - 1 + featureTiles.length) % featureTiles.length
      return featureTiles[nextIndex].key
    })
  }

  const handleNextPreview = () => {
    setActivePreview((current) => {
      const index = featureTiles.findIndex((tab) => tab.key === current)
      const nextIndex = (index + 1) % featureTiles.length
      return featureTiles[nextIndex].key
    })
  }

  return (
    <div className="min-h-screen bg-white text-[#1C2459]">
      <header className="border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <nav className="flex flex-1 items-center gap-2 overflow-x-auto text-[10px] font-semibold tracking-[0.12em] text-[#1C2459] md:gap-5 md:overflow-visible md:text-[11px] md:tracking-[0.18em]">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className="flex min-w-[44px] items-center justify-center rounded-md px-2 py-2 transition-colors hover:bg-[#E0E0E0] md:min-w-0 md:px-0 md:py-0 md:hover:bg-transparent"
                >
                  <Icon className="h-4 w-4 md:hidden" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-auto flex h-9 w-9 items-center justify-center text-[#1C2459]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3">
              {isAuthenticated && (
                <div className="flex items-center gap-3 rounded-lg bg-[#F4F6FA] px-3 py-2 text-[#1C2459]">
                  <Avatar className="size-10">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-[#1C2459]/70">{roleLabel}</p>
                  </div>
                </div>
              )}

              <div className={isAuthenticated ? "mt-3 space-y-2" : "space-y-2"}>
                <p className="text-xs text-[#1C2459]/60">{uiText.settingsTheme}</p>
                <div className="flex items-center gap-1">
                  {mounted && (
                    <>
                      <button
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${
                          theme === "light" ? "bg-[#1C2459] text-white" : "bg-[#F4F6FA] text-[#1C2459]"
                        }`}
                        onClick={() => setTheme("light")}
                        title={uiText.settingsThemeLight}
                      >
                        <Sun className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${
                          theme === "dark" ? "bg-[#1C2459] text-white" : "bg-[#F4F6FA] text-[#1C2459]"
                        }`}
                        onClick={() => setTheme("dark")}
                        title={uiText.settingsThemeDark}
                      >
                        <Moon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${
                          theme === "system" ? "bg-[#1C2459] text-white" : "bg-[#F4F6FA] text-[#1C2459]"
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
                <p className="text-xs text-[#1C2459]/60">{uiText.settingsLanguage}</p>
                <div className="grid gap-1">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.code}
                      onClick={() => setLanguage(option.code)}
                      className={language === option.code ? "bg-[#E0E0E0]" : ""}
                    >
                      {option.label} ({option.code})
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>

              <div className="mt-3 border-t border-[#E0E0E0] pt-2">
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
        </div>
      </header>

      <section id="home" className="relative">
        <div className="relative h-[340px] w-full md:h-[520px]">
          <Image
            src="/intro/hero.jpg"
            alt="Lab researchers in the lab"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#0B1C2C]/15" />
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              className="flex h-14 w-24 items-center justify-center rounded-xl bg-[#E62117] shadow-xl transition-transform hover:scale-105"
              aria-label="Play video"
            >
              <Play className="h-7 w-7 text-white" fill="white" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#49D4D6]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <Image
            src="/intro/logo-black.svg"
            alt="LabIT"
            width={520}
            height={140}
            className="h-20 w-auto md:h-32"
            priority
          />
          <p className="mt-5 text-lg leading-snug text-[#1C2459] md:text-2xl">
            Beyond the Flask: Precision
            <br />
            Controlled by Digital Intelligence
          </p>
        </div>
      </section>

      <section className="bg-[#E0E0E0]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 text-center md:grid-cols-3 md:text-left">
          {valueProps.map((item) => (
            <div key={item.title}>
              <p className="text-[12px] font-semibold tracking-[0.12em]">{item.title}</p>
              <p className="mt-3 text-[12px] leading-relaxed text-[#1C2459]/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#49D4D6]">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-6 py-6 text-left md:grid md:grid-cols-5 md:gap-0 md:overflow-visible md:text-center">
          {featureTiles.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePreview(item.key)}
              className={`relative min-w-[150px] shrink-0 px-4 py-3 text-left transition-colors md:min-w-0 md:text-center ${
                activePreview === item.key ? "text-[#1C2459]" : "text-[#1C2459]/70"
              }`}
              aria-pressed={activePreview === item.key}
            >
              <p className="text-[12px] font-semibold tracking-[0.18em]">{item.label}</p>
              <p className="mt-2 text-[11px] text-[#1C2459]/70">{item.desc}</p>
              <span
                className={`pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 bg-[#1C2459] transition-opacity ${
                  activePreview === item.key ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>

      <section id="dashboard" className="bg-[#A9A9A9]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="relative">
            <div className="relative h-[240px] overflow-hidden rounded-md bg-[#CFCFCF] md:h-[420px]">
              <Image
                src={activePreviewData.image}
                alt={`${activePreviewData.label} dashboard preview`}
                fill
                sizes="100vw"
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-white/20" />
              <p className="absolute left-6 top-6 text-sm font-semibold text-white/90 md:text-lg">
                #기능별 예시 대시보드 썸네일 들어갈 예정_좌우 넘김
              </p>
              <div className="absolute inset-[8%] rounded-md border border-white/40 bg-white/50 shadow-inner" />
              <div className="absolute bottom-5 right-5 rounded-full bg-white/80 px-4 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#1C2459]">
                {activePreviewData.label} DASHBOARD
              </div>
            </div>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1C2459] shadow-md"
              aria-label="Previous slide"
              onClick={handlePrevPreview}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1C2459] shadow-md"
              aria-label="Next slide"
              onClick={handleNextPreview}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section id="painpoint">
        <div className="bg-[#E0E0E0] py-4 text-center text-[12px] font-semibold tracking-[0.2em]">
          PAINPOINT &amp; SOLUTION
        </div>
        <div>
          {painpoints.map((item) => (
            <div key={item.title} className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="bg-[#49D4D6] px-6 py-10 md:px-10 md:py-14">
                <p className="font-title text-4xl font-semibold md:text-5xl">{item.metric}</p>
                <p className="mt-3 text-[12px] font-semibold tracking-[0.14em]">{item.title}</p>
                <p className="mt-3 text-[12px] leading-relaxed text-[#1C2459]/70">{item.desc}</p>
              </div>
              <div className="relative min-h-[220px] md:min-h-[300px]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="insight" className="relative">
        <div className="relative min-h-[420px] md:min-h-[560px]">
          <Image
            src="/intro/spotlight-bg.jpg"
            alt="Lab background"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center text-white md:min-h-[560px]">
            <p className="text-[12px] font-semibold tracking-[0.2em]">ZERO ERRORS, TOTAL VISIBILITY</p>
            <p className="mt-2 text-[12px] font-semibold tracking-[0.2em]">
              THE FUTURE OF CONNECTED LABORATORIES.
            </p>
            <div className="relative mt-10 h-[220px] w-[220px] overflow-hidden rounded-md border border-white/30 md:h-[320px] md:w-[320px]">
              <Image
                src="/intro/spotlight.jpg"
                alt="Lab experiment"
                fill
                sizes="(min-width: 768px) 320px, 220px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="monitoring">
        <div className="bg-[#49D4D6] py-4 text-center text-[12px] font-semibold tracking-[0.2em]">
          REAL-TIME ASSET MONITORING
        </div>
        <div className="bg-[#E0E0E0]">
          <div className="mx-auto max-w-5xl space-y-6 px-6 py-10 text-[12px] text-[#1C2459]">
            {logEntries.map((entry) => (
              <div key={`${entry.time}-${entry.label}`} className="space-y-1.5">
                <div className="grid grid-cols-[90px_1fr] gap-4">
                  <span className="text-[#1C2459]/70">{entry.time}</span>
                  <span className={entry.tone === "alert" ? "font-semibold text-[#FF5C5C]" : "font-semibold"}>
                    {entry.label}
                  </span>
                </div>
                {entry.lines.map((line) => (
                  <div key={line} className="grid grid-cols-[90px_1fr] gap-4">
                    <span />
                    <span className={entry.tone === "alert" ? "text-[#FF5C5C]" : "text-[#1C2459]/80"}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#49D4D6] py-6 text-center">
        <p className="mx-auto max-w-4xl text-[11px] font-semibold tracking-[0.2em] text-[#1C2459] md:text-[12px]">
          DIVE INTO THE SONIC ERA OF SMART SCIENCE:
          <br className="hidden md:block" />
          WHERE EVERY DROP IS TRACKED AND EVERY RECORD IS FLAWLESS
        </p>
      </section>

      <footer id="footer">
        <div className="bg-[#E0E0E0] py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-[11px] font-semibold tracking-[0.2em] text-[#1C2459] md:flex-row md:items-center md:justify-between">
            <div>
              THE FUTURE TECHNOLOGY
              <br />
              LAB MONITORING SERVICE
            </div>
            <div>SEOUL, SOUTH KOREA</div>
          </div>
        </div>
        <div className="bg-[#49D4D6] py-16">
          <div className="mx-auto flex max-w-6xl items-end justify-between px-6">
            <Image
              src="/intro/logo-black.svg"
              alt="LabIT"
              width={360}
              height={90}
              className="h-16 w-auto md:h-24"
            />
            <span className="text-[10px] text-[#1C2459]/70">&copy; All rights reserved by LabIT</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
