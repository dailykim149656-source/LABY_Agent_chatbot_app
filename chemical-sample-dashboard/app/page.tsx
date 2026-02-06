"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Play, FlaskConical, Server } from "lucide-react"
import Image from "next/image"

/* ────────────────────────────────────────────
   Dashboard 탭 정의
   - image: 나중에 public/intro/ 에 업로드할 파일 경로
   - 현재는 차트 목업 스켈레톤 표시
──────────────────────────────────────────── */
const dashboardTabs = [
  { key: "reagents", label: "REAGENTS", image: "/intro/dashboard-reagents.png" },
  { key: "experiments", label: "EXPERIMENTS", image: "/intro/dashboard-experiments.png" },
  { key: "environment", label: "ENVIRONMENT", image: "/intro/dashboard-environment.png" },
  { key: "chatbot", label: "CHATBOT", image: "/intro/dashboard-chatbot.png" },
  { key: "disposal", label: "DISPOSAL", image: "/intro/dashboard-disposal.png" },
] as const

export default function IntroPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("reagents")

  const handleCta = () => {
    router.push(isAuthenticated ? "/dashboard" : "/login")
  }

  const handleTabNav = (tabKey: string) => {
    router.push(`/dashboard?tab=${tabKey}`)
  }

  const headerNav = [
    { label: "ABOUT", href: "#about" },
    { label: "NAVIGATION", href: "#features" },
    { label: "EXPERIMENT", href: "#environment" },
    { label: "DASHBOARD", href: "#market" },
    { label: "DOCS", href: "#docs" },
  ]
  const sectionAnchors = ["ABOUT", "FEATURES", "ENVIRONMENT", "MARKET", "DOCS"]

  return (
    <div className="min-h-screen bg-white text-[#1D2559]">
      {/* ══════════════ HEADER NAV — 흰색 배경, 좌측 정렬 ══════════════ */}
      <header className="sticky top-0 z-50 border-b border-[#E1E1E1] bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-3">
          {/* 로고 — SVG 교체 가능 */}
          <Image
            src="/intro/logo-black.svg"
            alt="LabIT"
            width={80}
            height={17}
            className="mr-10 shrink-0"
            priority
          />

          <nav className="hidden items-center gap-7 md:flex">
            {headerNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[11px] tracking-[0.12em] text-[#1D2559]/60 transition-colors hover:text-[#1D2559]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto">
            <button
              type="button"
              onClick={handleCta}
              className="rounded-full bg-[#1D2559] px-5 py-1.5 text-[11px] font-semibold tracking-wider text-white transition-colors hover:bg-[#1D2559]/90"
            >
              {isAuthenticated ? "DASHBOARD" : "LOGIN"}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section id="about" className="relative overflow-hidden bg-[#1D2559]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D2559] via-[#232B63] to-[#1D2559]" />
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#4AD4D7]/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-[#581799]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12">
          {/* 비디오 placeholder — 실사 사진 배경 느낌 */}
          <div className="relative mx-auto mb-10 aspect-video max-w-4xl overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1D2559]/80 via-[#232B63]/60 to-[#4AD4D7]/20" />
            <div className="absolute inset-0 bg-[url('/intro/video-bg.jpg')] bg-cover bg-center opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF8886] shadow-lg transition-transform hover:scale-110 cursor-pointer">
                <Play className="ml-1 h-6 w-6 text-white" fill="white" />
              </div>
            </div>
          </div>

          {/* 브랜드 타이틀 — WHITE SVG 로고 */}
          <div className="text-center">
            <Image
              src="/intro/logo-white.svg"
              alt="LabIT"
              width={400}
              height={85}
              className="mx-auto h-16 w-auto md:h-24"
              priority
            />
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed tracking-wide text-white/60 md:text-base">
              Beyond the Flask: Precision<br className="hidden md:block" />
              Controlled by Digital Intelligence
            </p>
          </div>

          {/* 3-컬럼 기능 */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                title: "DATA PRECISION",
                desc: "실험 데이터를 디지털화하여 누적되는 사소한 오류를 체계적으로 관리합니다.",
              },
              {
                title: "REAL-TIME CONNECTIVITY",
                desc: "모든 저울/센서와 실시간 연결로 자동 수집된 데이터를 즉시 활용할 수 있습니다.",
              },
              {
                title: "PROACTIVE SAFETY",
                desc: "시설물 매핑과 이벤트 자동 감시로 실시간 위험 알림을 제공합니다.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#4AD4D7]">{item.title}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 섹션 앵커 pill 버튼 행 */}
          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {sectionAnchors.map((anchor) => (
              <a
                key={anchor}
                href={`#${anchor.toLowerCase()}`}
                className="rounded-full border border-white/20 px-5 py-1.5 text-[10px] tracking-[0.15em] text-white/50 transition-colors hover:border-[#4AD4D7]/60 hover:text-[#4AD4D7]"
              >
                {anchor}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ DASHBOARD PREVIEW ══════════════ */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm text-[#1D2559]/50">
            #기능별 예시 대시보드 세부안 들어갈 예정. 공유 넘김
          </p>

          {/* 5개 탭 */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2 text-[11px] font-semibold tracking-wider transition-all ${
                  activeTab === tab.key
                    ? "bg-[#1D2559] text-white shadow-md"
                    : "bg-[#F4F6FA] text-[#1D2559]/50 hover:bg-[#E1E1E1] hover:text-[#1D2559]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 대시보드 목업 — 차트/카드 스켈레톤 */}
          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-[#E1E1E1] bg-[#F4F6FA] p-1 shadow-lg">
            <div className="rounded-xl bg-white">
              {/* 브라우저 크롬 */}
              <div className="flex items-center gap-3 border-b border-[#E1E1E1] px-5 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF8886]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FFC296]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#4AD4D7]" />
                <div className="ml-3 flex-1 rounded-full bg-[#F4F6FA] px-4 py-1.5 text-[10px] text-[#1D2559]/30">
                  labit.app/dashboard/{activeTab}
                </div>
              </div>

              {/* 차트 목업 스켈레톤 */}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1D2559]/30">
                    {dashboardTabs.find((t) => t.key === activeTab)?.label} DASHBOARD
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded bg-[#F4F6FA]" />
                    <div className="h-5 w-16 rounded bg-[#F4F6FA]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* 차트 영역 */}
                  <div className="col-span-2 rounded-xl bg-[#F4F6FA] p-4">
                    <div className="text-[10px] text-[#1D2559]/25">REAL-TIME CHART</div>
                    <div className="mt-4 flex items-end gap-2 h-36">
                      {[65, 45, 80, 55, 90, 72, 60, 85, 50, 75, 68, 88].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t transition-all duration-300"
                          style={{
                            height: `${h}%`,
                            backgroundColor:
                              i % 3 === 0 ? "#4AD4D7" : i % 3 === 1 ? "#FFC296" : "#1D2559",
                            opacity: 0.5,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-[#1D2559]/20">
                      <span>600</span>
                      <span>28</span>
                      <span>24</span>
                    </div>
                  </div>
                  {/* 온도/습도 카드 */}
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-xl bg-[#1D2559] p-4">
                      <div className="text-[10px] text-white/30">TEMPERATURE</div>
                      <div className="mt-2 font-title text-xl text-[#4AD4D7]">22.4&deg;C</div>
                    </div>
                    <div className="flex-1 rounded-xl bg-[#4AD4D7]/10 p-4">
                      <div className="text-[10px] text-[#1D2559]/30">HUMIDITY</div>
                      <div className="mt-2 font-title text-xl text-[#1D2559]">45%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ PAINPOINT & SOLUTION ══════════════ */}
      <section className="bg-[#F4F6FA] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] tracking-[0.15em] text-[#581799]">PAINPOINT &amp; SOLUTION</p>

          <div className="mx-auto mt-12 max-w-3xl space-y-14">
            {/* -30%~86% */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="shrink-0 md:w-2/5">
                <span className="font-title text-4xl font-bold tracking-tight text-[#1D2559] md:text-5xl">
                  -30%~86%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#FF8886]">
                  REAL-TIME ANOMALY DETECTION
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#1D2559]/50">
                  실험 도중 이상 신호를 자동 감지하여 즉각적인 대응이 가능합니다.
                  AI 기반 모니터링으로 사고율을 획기적으로 줄입니다.
                </p>
              </div>
            </div>

            {/* -70% */}
            <div className="flex flex-col gap-4 md:flex-row-reverse md:items-center md:text-right">
              <div className="shrink-0 md:w-2/5">
                <span className="font-title text-4xl font-bold tracking-tight text-[#1D2559] md:text-5xl">
                  -70%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#FF8886]">
                  LAB DATA TRANSCRIPTION
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#1D2559]/50">
                  실험 데이터의 자동 수집과 디지털 기록으로 연구자의 반복 업무 시간을 대폭 절감합니다.
                </p>
              </div>
            </div>

            {/* -25% */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="shrink-0 md:w-2/5">
                <span className="font-title text-4xl font-bold tracking-tight text-[#1D2559] md:text-5xl">
                  -25%
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#FF8886]">
                  SAFETY MONITORING GAPS
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#1D2559]/50">
                  실험실 전역의 센서 네트워크와 AI 분석으로 기존 CCTV만으로는 커버하지 못했던 사각지대를 해소합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D2559]/30">
              END-TO-END TOTAL VISIBILITY
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#1D2559]/30">
              THE FUTURE OF CONNECTED LABORATORIES
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ LAB VISUALS ══════════════ */}
      <section id="environment" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 좌측 사진 placeholder */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#F4F6FA]">
              <div className="text-center">
                <FlaskConical className="mx-auto h-10 w-10 text-[#E1E1E1]" strokeWidth={1} />
                <p className="mt-2 text-[10px] tracking-wider text-[#1D2559]/25">/intro/lab-left.jpg</p>
                <p className="mt-1 text-[10px] text-[#1D2559]/15">LABORATORY EQUIPMENT</p>
              </div>
            </div>

            {/* 우측 사진 placeholder */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#F4F6FA]">
              <div className="text-center">
                <FlaskConical className="mx-auto h-10 w-10 text-[#E1E1E1]" strokeWidth={1} />
                <p className="mt-2 text-[10px] tracking-wider text-[#1D2559]/25">/intro/lab-right.jpg</p>
                <p className="mt-1 text-[10px] text-[#1D2559]/15">CHEMICAL BEAKERS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ REAL-TIME MONITORING ══════════════ */}
      <section id="market" className="bg-[#1D2559] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] tracking-[0.15em] text-[#4AD4D7]">REAL-TIME ASSET MONITORING</p>

          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-[280px_1fr]">
            {/* 좌측: 서버랙 사진 placeholder */}
            <div className="flex items-center justify-center overflow-hidden rounded-xl bg-[#232B63] md:min-h-[400px]">
              <div className="px-4 py-12 text-center">
                <Server className="mx-auto h-10 w-10 text-white/15" strokeWidth={1} />
                <p className="mt-2 text-[10px] tracking-wider text-white/20">/intro/server-rack.jpg</p>
                <p className="mt-1 text-[10px] text-white/10">SERVER INFRASTRUCTURE</p>
              </div>
            </div>

            {/* 우측: 상태 카드 세로 스택 + 터미널 */}
            <div className="flex flex-col gap-4">
              {/* 상태 카드 — 세로 1열 스택 (PDF 디자인 일치) */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#4AD4D7]" />
                  <span className="text-[10px] font-semibold tracking-wider text-[#4AD4D7]">SYSTEM READY</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/30">
                  LABY SMART LAB INITIALIZED.<br />
                  ALL AGENTS UP AND RUNNING ONLINE.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FFC296]" />
                  <span className="text-[10px] font-semibold tracking-wider text-[#FFC296]">INVENTORY SYNC</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/30">
                  H2L #1 WEIGHT CHANGE: 23MS → 17MS DETECTED<br />
                  SYNCED WITH DB.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FF8886]" />
                  <span className="text-[10px] font-semibold tracking-wider text-[#FF8886]">VISUAL WARNING</span>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/30">
                  EVENT ID #42: FALL/ANOMALY (0.91) LAB DETECTION.<br />
                  VISUAL ANOMALY ZONE: B2<br />
                  RED ALERT: DANGER IN ZONE A-2E MODEL SYNCED
                </p>
              </div>

              {/* 터미널 */}
              <div className="flex-1 rounded-xl border border-white/10 bg-black/20 p-5 font-mono text-[11px]">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FF8886]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FFC296]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#4AD4D7]" />
                  <span className="ml-3 text-white/20">labit-monitor v1.0</span>
                </div>
                <div className="mt-3 space-y-1.5 text-white/40">
                  <p><span className="text-[#4AD4D7]">$</span> labit status --all</p>
                  <p className="text-[#4AD4D7]">[OK] Environmental sensors: 6/6 online</p>
                  <p className="text-[#4AD4D7]">[OK] Weight scales: 4/4 connected</p>
                  <p className="text-[#4AD4D7]">[OK] Camera feeds: 3/3 streaming</p>
                  <p className="text-[#FFC296]">[WARN] Storage B-2 humidity: 62% (threshold: 60%)</p>
                  <p>&nbsp;</p>
                  <p><span className="text-[#4AD4D7]">$</span> labit reagents --low-stock</p>
                  <p className="text-white/30">  H2SO4-001  | 45ml remaining  | location: A-01</p>
                  <p className="text-white/30">  NaOH-003   | 120ml remaining | location: B-03</p>
                  <p>&nbsp;</p>
                  <p><span className="text-[#4AD4D7]">$</span> labit alerts --recent</p>
                  <p className="text-[#FF8886]">[ALERT] Fall detection event #42 at 14:23:10</p>
                  <p className="text-white/30">  Zone: B2 | Confidence: 0.91 | Status: PENDING</p>
                  <p>&nbsp;</p>
                  <p><span className="text-[#4AD4D7]">$</span> <span className="animate-pulse">_</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer id="docs" className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            {/* BLACK SVG 로고 */}
            <div>
              <Image
                src="/intro/logo-black.svg"
                alt="LabIT"
                width={200}
                height={42}
                className="h-8 w-auto"
              />
              <p className="mt-2 text-[10px] text-[#1D2559]/30">
                Beyond the Flask: Precision Controlled by Digital Intelligence
              </p>
            </div>
            <button
              type="button"
              onClick={handleCta}
              className="rounded-full bg-[#1D2559] px-7 py-2.5 text-[11px] font-semibold tracking-wider text-white transition-colors hover:bg-[#1D2559]/90"
            >
              {isAuthenticated ? "DASHBOARD" : "GET STARTED"}
            </button>
          </div>
          <div className="mt-8 border-t border-[#E1E1E1] pt-5">
            <p className="text-[10px] text-[#1D2559]/25">&copy; 2026 LabIT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
