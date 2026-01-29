"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api"

interface AlertItem {
  id: string
  type: "warning" | "critical" | "info"
  location: string
  time: string
  status?: string
  verificationStatus?: string | number
  experimentId?: string
}

const ENV_KEYS = ["temperature", "humidity", "ventilation", "air_quality"]

const environmentalFallback = [
  { label: "Temperature", value: "22.4C", icon: Thermometer, status: "normal" },
  { label: "Humidity", value: "45%", icon: Droplets, status: "normal" },
  { label: "Ventilation", value: "Active", icon: Wind, status: "normal" },
  { label: "Air Quality", value: "Good", icon: Activity, status: "normal" },
]

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

export function SafetyStatus() {
  const [alertItems, setAlertItems] = useState<AlertItem[]>([])
  const [envItems, setEnvItems] = useState(environmentalFallback)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 3

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
          environmentalFallback.map((item, index) => {
            const key = ENV_KEYS[index]
            const match = data.environmental.find(
              (e: any) => e.key === key || e.label === key || e.label === item.label
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
      setEnvItems(environmentalFallback)
      setTotalPages(1)
      setTotalCount(alertsFallback.length)
    }
  }

  useEffect(() => {
    fetchStatus(page)
  }, [page])

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
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {envItems.map((item) => (
            <div
              key={item.label}
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
              Active Alerts
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {alertItems.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="size-8 text-success" />
              <p className="mt-2 text-sm text-muted-foreground">No active alerts</p>
            </div>
          ) : (
            alertItems.map((alert) => {
              const topRows = [
                buildRow("EventID", alert.id),
                buildRow("Time", formatAlertTime(alert.time)),
                buildRow("Location", alert.location),
              ]
              const bottomRows = [
                buildRow("Status", alert.status),
                buildRow("Verification Status", alert.verificationStatus),
                buildRow("Experiment ID", alert.experimentId),
              ]

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-lg border p-3",
                    alert.type === "critical"
                      ? "border-destructive/50 bg-destructive/10"
                      : alert.type === "warning"
                      ? "border-warning/50 bg-warning/10"
                      : "border-border bg-secondary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        alert.type === "critical"
                          ? "text-destructive"
                          : alert.type === "warning"
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
              Page {page} / {totalPages} · Total {totalCount}
            </span>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={cn(
                    "h-7 rounded-md px-2 text-xs font-medium transition-colors",
                    page === 1
                      ? "cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                  )}
                  disabled={page === 1}
                >
                  Prev
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
                        "size-7 rounded-md text-xs font-medium transition-colors",
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
                    "h-7 rounded-md px-2 text-xs font-medium transition-colors",
                    page >= totalPages
                      ? "cursor-not-allowed bg-secondary/40 text-muted-foreground"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                  )}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">System Status</p>
              <p className="text-xs text-muted-foreground">All systems operating normally.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium text-success">Normal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
