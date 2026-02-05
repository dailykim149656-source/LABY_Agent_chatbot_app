"use client"

import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { useUiLanguage } from "@/lib/use-ui-language"
import { useAuth } from "@/lib/auth-context"
import type { TabType } from "@/components/dashboard/sidebar"

export default function AboutPage() {
  const router = useRouter()
  const { language, setLanguage } = useUiLanguage()
  const { isAuthenticated } = useAuth()

  const goLogin = () => router.push("/login")
  const goDashboard = (tab?: TabType) => {
    if (tab && tab !== "chatbot" && tab !== "about") {
      router.push(`/dashboard?tab=${tab}`)
      return
    }
    router.push("/dashboard")
  }

  const handleCta = (tab?: TabType) => {
    if (isAuthenticated) {
      goDashboard(tab)
      return
    }
    goLogin()
  }

  const handleTabChange = (tab: TabType) => {
    if (tab === "about") return
    if (isAuthenticated) {
      goDashboard(tab)
      return
    }
    goLogin()
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          activeTab="about"
          onTabChange={handleTabChange}
          language={language}
          isAdmin={false}
          showBrand
          showUsersTab={false}
          showMenu
          onLanguageChange={setLanguage}
          alignTabsWithSidebar
        />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="relative overflow-hidden rounded-3xl bg-[#DCE0E6] p-8 text-[#1D2559] md:p-12">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[#4AD4D7]/40 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-28 w-28 -translate-x-10 translate-y-10 rounded-full bg-[#FF6B69]/40 blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#581799]">
              LabIT 소개
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              실험실의 안전과 효율을 한 화면에서 관리하는 AI 파트너
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-[#1D2559]/80 md:text-base">
              LabIT는 실험 환경의 센서 데이터와 대화형 AI를 결합해, 위험 요소를
              빠르게 감지하고 기록을 체계적으로 관리합니다. 필요한 정보는
              실시간으로, 중요한 기록은 안전하게.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                className="bg-[#1D2559] text-white hover:bg-[#1D2559]/90"
                onClick={() => handleCta("monitoring")}
              >
                실시간 모니터링 보기
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#581799] text-[#581799] hover:bg-[#581799]/10"
                onClick={() => handleCta()}
              >
                대시보드로 이동
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-5">
          {[
            { label: "Navy", color: "#1D2559" },
            { label: "Coral", color: "#FF6B69" },
            { label: "Teal", color: "#4AD4D7" },
            { label: "Purple", color: "#581799" },
            { label: "Gray", color: "#DCE0E6" },
          ].map((tone) => (
            <div key={tone.label} className="rounded-2xl border border-[#DCE0E6] bg-white p-4">
              <div className="h-12 rounded-xl" style={{ backgroundColor: tone.color }} />
              <p className="mt-3 text-xs font-semibold text-[#1D2559]">{tone.label}</p>
              <p className="text-[11px] text-[#1D2559]/70">{tone.color}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "현장 중심 경보",
              desc: "센서와 로그를 통합해 이상 징후를 빠르게 감지하고, 사고 대응을 지원합니다.",
              color: "#FF6B69",
            },
            {
              title: "실시간 협업",
              desc: "대화형 챗봇으로 기록과 질의응답을 한 곳에서 관리합니다.",
              color: "#4AD4D7",
            },
            {
              title: "보안 중심 설계",
              desc: "접근 제어와 데이터 보호를 기본값으로 설계했습니다.",
              color: "#581799",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#DCE0E6] bg-white p-6">
              <div className="h-2 w-12 rounded-full" style={{ backgroundColor: item.color }} />
              <h3 className="mt-4 text-lg font-semibold text-[#1D2559]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#1D2559]/70">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[#DCE0E6] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1D2559]">운영 플로우</h3>
            <div className="mt-4 grid gap-3">
              {[
                "센서/로그 수집 및 상태 모니터링",
                "챗봇을 통한 빠른 질의와 기록",
                "알림 및 사고 대응 프로토콜 실행",
                "안전 이슈 리포트 및 데이터 보관",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-[#DCE0E6] px-4 py-3 text-sm text-[#1D2559]"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#1D2559] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#DCE0E6] bg-[#1D2559] p-6 text-white">
            <h3 className="text-lg font-semibold">핵심 지표</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "알림 응답 속도", value: "평균 12초" },
                { label: "기록 자동화율", value: "78%" },
                { label: "위험 감지 정확도", value: "96%" },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{metric.label}</span>
                  <span className="font-semibold">{metric.value}</span>
                </div>
              ))}
              <div className="mt-4 rounded-xl bg-[#4AD4D7] px-4 py-3 text-sm font-semibold text-[#1D2559]">
                더 많은 인사이트는 대시보드에서 확인하세요
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-[#4AD4D7] px-8 py-10 text-[#1D2559]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#581799]">
                LabIT 톤 가이드
              </p>
              <h3 className="mt-3 text-2xl font-semibold">5가지 톤으로 일관된 실험실 UX</h3>
              <p className="mt-2 text-sm text-[#1D2559]/80">
                색상은 경고, 상태, 강조를 명확하게 구분하도록 설계되었습니다.
              </p>
            </div>
            <Button
              type="button"
              className="bg-[#581799] text-white hover:bg-[#581799]/90"
              onClick={() => handleCta("chatbot")}
            >
              챗봇으로 돌아가기
            </Button>
          </div>
        </section>
          </div>
        </main>
      </div>
    </div>
  )
}
