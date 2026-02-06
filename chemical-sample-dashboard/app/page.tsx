"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { getUiText } from "@/lib/ui-text"
import { useUiLanguage } from "@/lib/use-ui-language"
import { LandingToolbar } from "@/components/landing/toolbar"

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
  const { language } = useUiLanguage()
  const uiText = getUiText(language)

  const valueProps = [
    {
      title: "DATA PRECISION",
      desc: uiText.landingValuePrecisionDesc,
    },
    {
      title: "REAL-TIME CONNECTIVITY",
      desc: uiText.landingValueConnectivityDesc,
    },
    {
      title: "PROACTIVE SAFETY",
      desc: uiText.landingValueSafetyDesc,
    },
  ]

  const featureTiles = [
    {
      key: "agent",
      label: "AGENT",
      desc: uiText.landingFeatureAgentDesc,
      image: "/placeholder.jpg",
    },
    {
      key: "monitoring",
      label: "MONITORING",
      desc: uiText.landingFeatureMonitoringDesc,
      image: "/placeholder.jpg",
    },
    {
      key: "experiment",
      label: "EXPERIMENT",
      desc: uiText.landingFeatureExperimentDesc,
      image: "/placeholder.jpg",
    },
    {
      key: "reagent",
      label: "REAGENT",
      desc: uiText.landingFeatureReagentDesc,
      image: "/placeholder.jpg",
    },
    {
      key: "record",
      label: "RECORD",
      desc: uiText.landingFeatureRecordDesc,
      image: "/placeholder.jpg",
    },
  ]

  const painpoints = [
    {
      metric: "-30%~86%",
      title: "FATAL HUMAN ERRORS",
      desc: uiText.landingPainpointErrorDesc,
      image: "/intro/painpoint-01.jpg",
    },
    {
      metric: "-70%",
      title: "LACK OF ASSET VISIBILITY",
      desc: uiText.landingPainpointVisibilityDesc,
      image: "/intro/painpoint-02.jpg",
    },
    {
      metric: "-25%",
      title: "SAFETY MONITORING GAPS",
      desc: uiText.landingPainpointSafetyGapDesc,
      image: "/intro/painpoint-03.jpg",
    },
  ]

  const [activePreview, setActivePreview] = useState(featureTiles[0].key)

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
    <div className="min-h-screen bg-white text-[#1D2559] dark:text-[#FFFFFF]">
      <LandingToolbar />

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
              className="flex h-14 w-24 items-center justify-center rounded-xl bg-[#FF8886] shadow-xl transition-transform hover:scale-105"
              aria-label="Play video"
            >
              <Play className="h-7 w-7 text-white" fill="white" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#4AD4D7]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <Image
            src="/intro/logo-black.svg"
            alt="LabIT"
            width={520}
            height={140}
            className="h-20 w-auto md:h-32 dark:hidden"
            priority
          />
          <Image
            src="/intro/logo-white.svg"
            alt="LabIT"
            width={520}
            height={140}
            className="hidden h-20 w-auto md:h-32 dark:block"
            priority
          />
          <p className="mt-5 text-lg leading-snug text-[#1D2559] dark:text-[#FFFFFF] md:text-2xl">
            Beyond the Flask: Precision
            <br />
            Controlled by Digital Intelligence
          </p>
        </div>
      </section>

      <section className="bg-[#E1E1E1] dark:bg-[#1D2559]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 text-center md:grid-cols-3 md:text-left">
          {valueProps.map((item) => (
            <div key={item.title}>
              <p className="text-[12px] font-semibold tracking-[0.12em]">{item.title}</p>
              <p className="mt-3 text-[12px] leading-relaxed text-[#1D2559]/70 dark:text-[#FFFFFF]/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#4AD4D7]">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-6 py-6 text-left md:grid md:grid-cols-5 md:gap-0 md:overflow-visible md:text-center">
          {featureTiles.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePreview(item.key)}
              className={`relative min-w-[150px] shrink-0 px-4 py-3 text-left transition-colors md:min-w-0 md:text-center ${
                activePreview === item.key ? "text-[#1D2559] dark:text-[#FFFFFF]" : "text-[#1D2559]/70 dark:text-[#FFFFFF]/70"
              }`}
              aria-pressed={activePreview === item.key}
            >
              <p className="text-[12px] font-semibold tracking-[0.18em]">{item.label}</p>
              <p className="mt-2 text-[11px] text-[#1D2559]/70 dark:text-[#FFFFFF]/70">{item.desc}</p>
              <span
                className={`pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 bg-[#1D2559] dark:bg-[#FFFFFF] transition-opacity ${
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
                {uiText.landingDashboardPreviewNote}
              </p>
              <div className="absolute inset-[8%] rounded-md border border-white/40 bg-white/50 shadow-inner" />
              <div className="absolute bottom-5 right-5 rounded-full bg-white/80 px-4 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#1D2559] dark:text-[#FFFFFF]">
                {activePreviewData.label} DASHBOARD
              </div>
            </div>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1D2559] dark:text-[#FFFFFF] shadow-md"
              aria-label="Previous slide"
              onClick={handlePrevPreview}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1D2559] dark:text-[#FFFFFF] shadow-md"
              aria-label="Next slide"
              onClick={handleNextPreview}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section id="painpoint">
        <div className="bg-[#E1E1E1] dark:bg-[#1D2559] py-4 text-center text-[12px] font-semibold tracking-[0.2em]">
          PAINPOINT &amp; SOLUTION
        </div>
        <div>
          {painpoints.map((item) => (
            <div key={item.title} className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="bg-[#4AD4D7] px-6 py-10 md:px-10 md:py-14">
                <p className="font-title text-4xl font-semibold md:text-5xl">{item.metric}</p>
                <p className="mt-3 text-[12px] font-semibold tracking-[0.14em]">{item.title}</p>
                <p className="mt-3 text-[12px] leading-relaxed text-[#1D2559]/70 dark:text-[#FFFFFF]/70">{item.desc}</p>
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
        <div className="bg-[#4AD4D7] py-4 text-center text-[12px] font-semibold tracking-[0.2em]">
          REAL-TIME ASSET MONITORING
        </div>
        <div className="bg-[#E1E1E1] dark:bg-[#1D2559]">
          <div className="mx-auto max-w-5xl space-y-6 px-6 py-10 text-[12px] text-[#1D2559] dark:text-[#FFFFFF]">
            {logEntries.map((entry) => (
              <div key={`${entry.time}-${entry.label}`} className="space-y-1.5">
                <div className="grid grid-cols-[90px_1fr] gap-4">
                  <span className="text-[#1D2559]/70 dark:text-[#FFFFFF]/70">{entry.time}</span>
                  <span className={entry.tone === "alert" ? "font-semibold text-[#FF8886]" : "font-semibold"}>
                    {entry.label}
                  </span>
                </div>
                {entry.lines.map((line) => (
                  <div key={line} className="grid grid-cols-[90px_1fr] gap-4">
                    <span />
                    <span className={entry.tone === "alert" ? "text-[#FF8886]" : "text-[#1D2559]/80 dark:text-[#FFFFFF]/80"}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#4AD4D7] py-6 text-center">
        <p className="mx-auto max-w-4xl text-[11px] font-semibold tracking-[0.2em] text-[#1D2559] dark:text-[#FFFFFF] md:text-[12px]">
          DIVE INTO THE SONIC ERA OF SMART SCIENCE:
          <br className="hidden md:block" />
          WHERE EVERY DROP IS TRACKED AND EVERY RECORD IS FLAWLESS
        </p>
      </section>

      <footer id="footer">
        <div className="bg-[#E1E1E1] dark:bg-[#1D2559] py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-[11px] font-semibold tracking-[0.2em] text-[#1D2559] dark:text-[#FFFFFF] md:flex-row md:items-center md:justify-between">
            <div>
              THE FUTURE TECHNOLOGY
              <br />
              LAB MONITORING SERVICE
            </div>
            <div>SEOUL, SOUTH KOREA</div>
          </div>
        </div>
        <div className="bg-[#4AD4D7] py-16">
          <div className="mx-auto flex max-w-6xl items-end justify-between px-6">
            <Image
              src="/intro/logo-black.svg"
              alt="LabIT"
              width={360}
              height={90}
              className="h-16 w-auto md:h-24 dark:hidden"
            />
            <Image
              src="/intro/logo-white.svg"
              alt="LabIT"
              width={360}
              height={90}
              className="hidden h-16 w-auto md:h-24 dark:block"
            />
            <span className="text-[10px] text-[#1D2559]/70 dark:text-[#FFFFFF]/70">&copy; All rights reserved by LabIT</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
