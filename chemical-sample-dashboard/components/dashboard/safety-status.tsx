"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api"
import { getUiText } from "@/lib/ui-text"

interface AlertItem {
  id: string
  type: "warning" | "critical" | "info"
  location: string
  time: string
  status?: string
  verificationStatus?: string | number
  experimentId?: string
}

interface SafetyStatusProps {
  language: string
}

const alertsFallback: AlertItem[] = [
  {
    id: "EVT-2401",
    type: "warning",
    location: "Lab Zone 1",
    time: "2026-01-28 14:32",
    status: "active",
    verificationStatus: 0,
    experimentId: "EXP-102",
  },
  {
    id: "EVT-2399",
    type: "info",
    location: "Storage Room C",
    time: "2026-01-28 13:58",
    status: "acknowledged",
    verificationStatus: 1,
    experimentId: "EXP-088",
  },
]

const formatAlertTime = (value?: string) => {
  if (!value) return "-"
  if (value.includes("T")) {
    const [datePart, timePartRaw] = value.split("T")
    const timePart = timePartRaw.replace("Z", "").split(".")[0]
    return `${datePart} ${timePart.slice(0, 5)}`
  }
  return value
}

const toDisplayValue = (value?: string | number) => {
  if (value === null || value === undefined) return "-"
  const text = String(value).trim()
  return text.length > 0 ? text : "-"
}

const buildRow = (label: string, rawValue?: string | number) => ({
  label,
  value: toDisplayValue(rawValue),
})

const buildPageNumbers = (total: number, current: number) => {
  if (total <= 1) return []
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const windowSize = 5
  let start = Math.max(2, current - 2)
  let end = Math.min(total - 1, current + 2)
  const actual = end - start + 1
  if (actual < windowSize) {
    const diff = windowSize - actual
    if (start === 2) {
      end = Math.min(total - 1, end + diff)
    } else if (end === total - 1) {
      start = Math.max(2, start - diff)
    }
  }

  const pages = [1]
  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }
  pages.push(total)
  return pages
}

export function SafetyStatus({ language }: SafetyStatusProps) {
  const uiText = getUiText(language)
  const envFallback = useMemo(
    () => [
      {
        key: "temperature",
        label: uiText.envTemperature,
        value: "22.4C",
        icon: Thermometer,
        status: "normal",
      },
      {
        key: "humidity",
        label: uiText.envHumidity,
        value: "45%",
        icon: Droplets,
        status: "normal",
      },
      {
        key: "ventilation",
        label: uiText.envVentilation,
        value: uiText.envVentilationValue,
        icon: Wind,
        status: "normal",
      },
      {
        key: "air_quality",
        label: uiText.envAirQuality,
        value: uiText.envAirQualityValue,
        icon: Activity,
        status: "normal",
      },
    ],
    [uiText]
  )
  const [alertItems, setAlertItems] = useState<AlertItem[]>([])
  const [envItems, setEnvItems] = useState(envFallback)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 3

  useEffect(() => {
    setEnvItems((prev) => {
      const byKey = new Map(prev.map((item) => [item.key, item]))
      return envFallback.map((item) => {
        const existing = byKey.get(item.key)
        return existing ? { ...item, value: existing.value, status: existing.status } : item
      })
    })
  }, [envFallback])

  const mapAlert = (item: any): AlertItem => ({
    id: String(item?.eventId ?? item?.id ?? ""),
    type: item?.type ?? "info",
    location: item?.location ?? "",
    time: item?.time ?? "",
    status: item?.status ?? "",
    verificationStatus: item?.verificationStatus ?? item?.verification_status ?? "",
    experimentId: item?.experimentId ?? item?.experiment_id ?? "",
  })

  const fetchStatus = async (targetPage: number) => {
    try {
      const query = new URLSearchParams({
        limit: String(limit),
        page: String(targetPage),
      })
      const data = await fetchJson<any>(`/api/safety/status?${query.toString()}`)
      if (Array.isArray(data?.environmental)) {
        setEnvItems(
          envFallback.map((item) => {
            const match = data.environmental.find(
              (e: any) => e.key === item.key || e.label === item.key || e.label === item.label
            )
            return match ? { ...item, value: String(match.value ?? item.value) } : item
          })
        )
      }
      const alerts = Array.isArray(data?.alerts) ? data.alerts.map(mapAlert) : alertsFallback
      setAlertItems(alerts)

      const apiTotalPages = Number(data?.totalPages ?? 0)
      const apiTotalCount = Number(data?.totalCount ?? 0)
      if (apiTotalPages > 0) {
        setTotalPages(apiTotalPages)
        setTotalCount(apiTotalCount > 0 ? apiTotalCount : alerts.length)
        if (targetPage > apiTotalPages) {
          setPage(apiTotalPages)
        }
      } else {
        const fallbackTotalPages = Math.max(1, Math.ceil(alerts.length / limit))
        setTotalPages(fallbackTotalPages)
        setTotalCount(alerts.length)
      }
    } catch {
      setAlertItems(alertsFallback)
      setEnvItems(envFallback)
      setTotalPages(1)
      setTotalCount(alertsFallback.length)
    }
  }

  useEffect(() => {
    fetchStatus(page)
  }, [page, envFallback])

  const renderRows = (rows: { label: string; value: string }[]) => (
    <div className="space-y-1 text-xs text-muted-foreground">
      {rows.map((row) => (
        <div key={row.label} className="flex min-w-0 items-center gap-2">
          <span className="w-28 shrink-0 truncate font-medium text-foreground/70">
            {row.label}
          </span>
          <span className="min-w-0 flex-1 truncate" title={row.value}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )

  const pageNumbers = buildPageNumbers(totalPages, page)
  const paginationItems: Array<number | "ellipsis"> = []
  let lastPage = 0
  pageNumbers.forEach((pageNumber) => {
    if (lastPage && pageNumber - lastPage > 1) {
      paginationItems.push("ellipsis")
    }
    paginationItems.push(pageNumber)
    lastPage = pageNumber
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="size-4 text-success" />
            {uiText.envStatusTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {envItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <item.icon className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-warning" />
              {uiText.alertsTitle}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="size-8 text-success" />
              <p className="mt-2 text-sm text-muted-foreground">{uiText.alertsEmpty}</p>
            </div>
          ) : (
            alertItems.map((alert) => {
              const topRows = [
                buildRow(uiText.alertLabelEventId, alert.id),
                buildRow(uiText.alertLabelTime, formatAlertTime(alert.time)),
                buildRow(uiText.alertLabelLocation, alert.location),
              ]
              const bottomRows = [
                buildRow(uiText.alertLabelStatus, alert.status),
                buildRow(uiText.alertLabelVerificationStatus, alert.verificationStatus),
                buildRow(uiText.alertLabelExperimentId, alert.experimentId),
              ]

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-lg border p-3",
                    Number(alert.verificationStatus) === 0
                      ? "border-destructive/50 bg-destructive/10"
                      : Number(alert.verificationStatus) === 1
                      ? "border-success/50 bg-success/10"
                      : Number(alert.verificationStatus) === 2
                      ? "border-warning/50 bg-warning/10"
                      : "border-border bg-secondary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        Number(alert.verificationStatus) === 0
                          ? "text-destructive"
                          : Number(alert.verificationStatus) === 1
                          ? "text-success"
                          : Number(alert.verificationStatus) === 2
                          ? "text-warning"
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      {renderRows(topRows)}
                      <div className="mt-2 border-t border-border/60 pt-2">
                        {renderRows(bottomRows)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">
              {uiText.paginationSummary
                .replace("{page}", String(page))
                .replace("{total}", String(totalPages))
                .replace("{count}", String(totalCount))}
            </span>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={cn(
                    "min-h-[44px] min-w-[44px] rounded-md px-3 text-xs font-medium transition-colors sm:min-h-[28px] sm:min-w-0 sm:h-7 sm:px-2",
                    page === 1
                      ? "cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                  )}
                  disabled={page === 1}
                >
                  {uiText.paginationPrev}
                </button>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={cn(
                        "min-h-[44px] min-w-[44px] rounded-md text-xs font-medium transition-colors sm:min-h-0 sm:min-w-0 sm:size-7",
                        page === item
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={cn(
                    "min-h-[44px] min-w-[44px] rounded-md px-3 text-xs font-medium transition-colors sm:min-h-[28px] sm:min-w-0 sm:h-7 sm:px-2",
                    page >= totalPages
                      ? "cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                  )}
                  disabled={page >= totalPages}
                >
                  {uiText.paginationNext}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
