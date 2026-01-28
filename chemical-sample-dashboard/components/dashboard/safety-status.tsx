"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Thermometer, Droplets, Wind, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api"

interface Alert {
  id: string
  type: "warning" | "critical" | "info"
  message: string
  location: string
  time: string
}

const ENV_KEYS = ["temperature", "humidity", "ventilation", "air_quality"]

const environmentalData = [
  { label: "온도", value: "22.4°C", icon: Thermometer, status: "normal" },
  { label: "습도", value: "45%", icon: Droplets, status: "normal" },
  { label: "환기", value: "작동 중", icon: Wind, status: "normal" },
  { label: "공기질", value: "양호", icon: Activity, status: "normal" },
]

const alerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    message: "캐비닛 B-07 온도 상승 중",
    location: "보관실 1",
    time: "5분 전",
  },
  {
    id: "2",
    type: "info",
    message: "2시간 후 예정된 유지보수",
    location: "실험실 섹션 C",
    time: "10분 전",
  },
]

export function SafetyStatus() {
  const [alertItems, setAlertItems] = useState<Alert[]>([])
  const [envItems, setEnvItems] = useState(environmentalData)

  const mapAlert = (item: any): Alert => ({
    id: String(item?.id ?? ""),
    type: item?.type ?? "info",
    message: item?.message ?? "",
    location: item?.location ?? "",
    time: item?.time ?? "",
  })

  const fetchStatus = async () => {
    try {
      const data = await fetchJson<any>("/api/safety/status")
      if (Array.isArray(data?.environmental)) {
        setEnvItems(
          environmentalData.map((item, index) => {
            const key = ENV_KEYS[index]
            const match = data.environmental.find(
              (e: any) => e.key === key || e.label === key || e.label === item.label
            )
            return match ? { ...item, value: String(match.value ?? item.value) } : item
          })
        )
      }
      if (Array.isArray(data?.alerts)) {
        setAlertItems(data.alerts.map(mapAlert))
      } else {
        setAlertItems(alerts)
      }
    } catch (error) {
      setAlertItems(alerts)
      setEnvItems(environmentalData)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="size-4 text-success" />
            환경 상태
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
              활성 알림
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
              <p className="mt-2 text-sm text-muted-foreground">활성 알림 없음</p>
            </div>
          ) : (
            alertItems.map((alert) => (
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
                <div className="flex items-start gap-2">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{alert.location}</span>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">시스템 상태</p>
              <p className="text-xs text-muted-foreground">모든 시스템 정상 작동 중</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium text-success">온라인</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
