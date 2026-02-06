"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Play } from "lucide-react"

export default function IntroPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleCta = () => {
    router.push(isAuthenticated ? "/dashboard" : "/login")
  }

  const navItems = ["ABOUT", "FEATURES", "ENVIRONMENT", "MARKET", "DOCS"]

  return (
    <div className="min-h-screen bg-white text-[#1D2559]">
      {/* ──────────── HEADER NAV ──────────── */}
      <header className="sticky top-0 z-50 bg-[#1D2559]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <span className="font-title text-lg tracking-wider text-white">LabIT&trade;</span>
          <nav className="hidden gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs tracking-[0.15em] text-white/70 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleCta}
            className="rounded-full bg-[#4AD4D7] px-5 py-1.5 text-xs font-semibold tracking-wider text-[#1D2559] transition-colors hover:bg-[#4AD4D7]/80"
          >
            {isAuthenticated ? "DASHBOARD" : "LOGIN"}
          </button>
        </div>
      </header>

      {/* ──────────── HERO ──────────── */}
      <section id="about" className="relative overflow-hidden bg-[#1D2559]">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D2559] via-[#232B63] to-[#1D2559]" />
        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#4AD4D7]/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-[#581799]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12">
          {/* 비디오 플레이스홀더 */}
          <div className="relative mx-auto mb-10 aspect-video max-w-4xl overflow-hidden rounded-2xl bg-[#232B63] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1D2559]/60 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF8886] shadow-lg transition-transform hover:scale-110">
                <Play className="ml-1 h-6 w-6 text-white" fill="white" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 text-xs text-white/50">SMART LAB INTRODUCTION VIDEO</div>
          </div>

          {/* 브랜드 타이틀 */}
          <div className="text-center">
            <h1 className="font-title text-5xl font-bold tracking-wider text-white md:text-7xl lg:text-8xl">
              LabIT<sup className="text-lg align-super">&trade;</sup>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed tracking-wide text-white/60 md:text-base">
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
                <h3 className="font-title text-xs tracking-[0.2em] text-[#4AD4D7]">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── DASHBOARD PREVIEW ──────────── */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs tracking-[0.15em] text-[#FF8886]">FEATURES</p>
          <h2 className="mt-3 text-center font-title text-2xl font-semibold md:text-3xl">
            기능별 대시보드
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[#1D2559]/60">
            실험, 시약, 모니터링을 한 화면에서 관리하는 통합 대시보드
          </p>
          {/* 대시보드 목업 */}
          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-[#E1E1E1] bg-[#F4F6FA] p-1 shadow-lg">
            <div className="rounded-xl bg-white p-6">
              <div className="flex items-center gap-4 border-b border-[#E1E1E1] pb-4">
                <div className="h-3 w-3 rounded-full bg-[#FF8886]" />
                <div className="h-3 w-3 rounded-full bg-[#FFC296]" />
                <div className="h-3 w-3 rounded-full bg-[#4AD4D7]" />
                <div className="ml-4 flex-1 rounded-full bg-[#E1E1E1] px-4 py-1.5 text-xs text-[#1D2559]/40">
                  labit.app/dashboard
                </div>
              </div>
              {/* 차트 영역 모의 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 h-48 rounded-xl bg-gradient-to-br from-[#F4F6FA] to-[#E1E1E1] p-4">
                  <div className="text-[10px] font-semibold text-[#1D2559]/40">REAL-TIME CHART</div>
                  <div className="mt-4 flex items-end gap-2">
                    {[60, 40, 70, 55, 80, 65, 90, 75, 85, 60, 72, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${h}%`,
                          maxHeight: `${h * 1.2}px`,
                          backgroundColor: i % 3 === 0 ? "#4AD4D7" : i % 3 === 1 ? "#FFC296" : "#1D2559",
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex-1 rounded-xl bg-[#1D2559] p-4">
                    <div className="text-[10px] text-white/40">TEMPERATURE</div>
                    <div className="mt-2 font-title text-xl text-[#4AD4D7]">22.4&deg;C</div>
                  </div>
                  <div className="flex-1 rounded-xl bg-[#4AD4D7]/10 p-4">
                    <div className="text-[10px] text-[#1D2559]/40">HUMIDITY</div>
                    <div className="mt-2 font-title text-xl text-[#1D2559]">45%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── PAINPOINT & SOLUTION ──────────── */}
      <section className="bg-[#F4F6FA] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs tracking-[0.15em] text-[#581799]">PAINPOINT &amp; SOLUTION</p>
          <div className="mx-auto mt-12 max-w-3xl space-y-12">
            {[
              {
                stat: "-30%~86%",
                title: "실시간 이상감지 대응",
                desc: "실험 도중 이상 신호를 자동 감지하여 즉각적인 대응이 가능합니다. AI 기반 모니터링으로 사고율을 획기적으로 줄입니다.",
                align: "left" as const,
              },
              {
                stat: "-70%",
                title: "수기 기록 시간 절감",
                desc: "실험 데이터의 자동 수집과 디지털 기록으로 연구자의 반복 업무 시간을 대폭 절감합니다.",
                align: "right" as const,
              },
              {
                stat: "-25%",
                title: "안전 모니터링 사각지대",
                desc: "실험실 전역의 센서 네트워크와 AI 분석으로 기존 CCTV만으로는 커버하지 못했던 사각지대를 해소합니다.",
                align: "left" as const,
              },
            ].map((item) => (
              <div
                key={item.stat}
                className={`flex flex-col gap-4 md:flex-row md:items-center ${
                  item.align === "right" ? "md:flex-row-reverse md:text-right" : ""
                }`}
              >
                <div className="shrink-0 md:w-1/3">
                  <span className="font-title text-4xl font-bold tracking-tight text-[#1D2559] md:text-5xl">
                    {item.stat}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FF8886]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#1D2559]/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <p className="font-title text-xs uppercase tracking-[0.2em] text-[#1D2559]/40">
              END-TO-END TOTAL VISIBILITY
            </p>
            <p className="font-title text-xs uppercase tracking-[0.2em] text-[#1D2559]/40">
              THE FUTURE OF CONNECTED LABORATORIES
            </p>
          </div>
        </div>
      </section>

      {/* ──────────── LAB VISUALS ──────────── */}
      <section id="environment" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 왼쪽: 시약 이미지 플레이스홀더 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4AD4D7]/20 to-[#E1E1E1] p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#4AD4D7]/20 blur-2xl" />
              <div className="relative">
                <p className="text-xs tracking-[0.15em] text-[#581799]">LABORATORY</p>
                <h3 className="mt-3 font-title text-xl font-semibold">Smart Lab Environment</h3>
                <p className="mt-2 text-sm text-[#1D2559]/60">
                  최첨단 센서 인프라로 실험실 환경을 실시간 모니터링합니다.
                  온도, 습도, 저울 데이터가 자동으로 수집됩니다.
                </p>
                {/* 시약 아이콘 그리드 */}
                <div className="mt-6 grid grid-cols-4 gap-3">
                  {["H2SO4", "NaOH", "HCl", "CH3OH", "C2H5OH", "HNO3", "NaCl", "KOH"].map((formula) => (
                    <div
                      key={formula}
                      className="flex items-center justify-center rounded-lg bg-white/60 px-2 py-3 text-[10px] font-semibold text-[#1D2559]/60"
                    >
                      {formula}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* 오른쪽: 실험 이미지 플레이스홀더 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFC296]/20 to-[#FF8886]/10 p-8">
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#FF8886]/15 blur-2xl" />
              <div className="relative">
                <p className="text-xs tracking-[0.15em] text-[#FF8886]">EXPERIMENT</p>
                <h3 className="mt-3 font-title text-xl font-semibold">Digital Experiment Records</h3>
                <p className="mt-2 text-sm text-[#1D2559]/60">
                  실험 과정의 모든 단계를 디지털로 기록하고, 시약 사용량을
                  자동으로 추적합니다.
                </p>
                {/* 실험 단계 표시 */}
                <div className="mt-6 space-y-3">
                  {[
                    { step: "01", label: "시약 투입 기록", color: "#FF8886" },
                    { step: "02", label: "반응 데이터 수집", color: "#FFC296" },
                    { step: "03", label: "결과 분석 & 리포트", color: "#4AD4D7" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 rounded-lg bg-white/60 px-4 py-3">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.step}
                      </span>
                      <span className="text-xs font-medium text-[#1D2559]/70">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── REAL-TIME MONITORING ──────────── */}
      <section id="market" className="bg-[#1D2559] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs tracking-[0.15em] text-[#4AD4D7]">REAL-TIME ASSET MONITORING</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-[1fr_1.5fr]">
            {/* 왼쪽: 시스템 상태 */}
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#4AD4D7]" />
                  <span className="text-xs font-semibold tracking-wider text-[#4AD4D7]">SYSTEM READY</span>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  LABY SMART LAB INITIALIZED.<br />
                  ALL AGENTS UP AND RUNNING ONLINE.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FFC296]" />
                  <span className="text-xs font-semibold tracking-wider text-[#FFC296]">INVENTORY SYNC</span>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  H2L #1 WEIGHT CHANGE: 23MS → 17MS DETECTED<br />
                  SYNCED WITH DB.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#FF8886]" />
                  <span className="text-xs font-semibold tracking-wider text-[#FF8886]">VISUAL WARNING</span>
                </div>
                <p className="mt-3 text-xs text-white/40">
                  EVENT ID #42: FALL/ANOMALY (0.91) LAB DETECTION.<br />
                  VISUAL ANOMALY ZONE: B2<br />
                  RED ALERT: DANGER IN ZONE A-2E MODEL SYNCED
                </p>
              </div>
            </div>
            {/* 오른쪽: 터미널 스타일 */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-6 font-mono text-xs">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF8886]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FFC296]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#4AD4D7]" />
                <span className="ml-3 text-white/30">labit-monitor v1.0</span>
              </div>
              <div className="mt-4 space-y-2 text-white/50">
                <p><span className="text-[#4AD4D7]">$</span> labit status --all</p>
                <p className="text-[#4AD4D7]">[OK] Environmental sensors: 6/6 online</p>
                <p className="text-[#4AD4D7]">[OK] Weight scales: 4/4 connected</p>
                <p className="text-[#4AD4D7]">[OK] Camera feeds: 3/3 streaming</p>
                <p className="text-[#FFC296]">[WARN] Storage B-2 humidity: 62% (threshold: 60%)</p>
                <p>&nbsp;</p>
                <p><span className="text-[#4AD4D7]">$</span> labit reagents --low-stock</p>
                <p className="text-white/40">  H2SO4-001  │ 45ml remaining  │ location: A-01</p>
                <p className="text-white/40">  NaOH-003   │ 120ml remaining │ location: B-03</p>
                <p>&nbsp;</p>
                <p><span className="text-[#4AD4D7]">$</span> labit alerts --recent</p>
                <p className="text-[#FF8886]">[ALERT] Fall detection event #42 at 14:23:10</p>
                <p className="text-white/40">  Zone: B2 │ Confidence: 0.91 │ Status: PENDING</p>
                <p>&nbsp;</p>
                <p><span className="text-[#4AD4D7]">$</span> <span className="animate-pulse">_</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer id="docs" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <h2 className="font-title text-3xl font-bold tracking-wider text-[#1D2559] md:text-4xl">
                LabIT<sup className="text-sm align-super">&trade;</sup>
              </h2>
              <p className="mt-1 text-xs text-[#1D2559]/40">
                Beyond the Flask: Precision Controlled by Digital Intelligence
              </p>
            </div>
            <button
              type="button"
              onClick={handleCta}
              className="rounded-full bg-[#1D2559] px-8 py-3 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-[#1D2559]/90"
            >
              {isAuthenticated ? "대시보드로 이동" : "시작하기"}
            </button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between border-t border-[#E1E1E1] pt-6">
            <p className="text-[10px] text-[#1D2559]/30">&copy; 2026 LabIT. All rights reserved.</p>
            <div className="flex gap-6">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-[10px] text-[#1D2559]/30 transition-colors hover:text-[#1D2559]"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
