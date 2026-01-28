"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Clock, MapPin, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { fetchJson } from "@/lib/api"

interface Accident {
  id: string
  title: string
  description: string
  location: string
  severity: "critical" | "high" | "medium" | "low"
  status: "active" | "acknowledged" | "resolved" | "false_alarm"
  reportedAt: string
  reportedBy: string
}

const initialAccidents: Accident[] = [
  {
    id: "1",
    title: "화학물질 유출 - B 구역",
    description: "보관 캐비닛 B-12에서 소량의 황산 유출이 감지되었습니다. 방제 프로토콜이 활성화되었습니다.",
    location: "보관실 1, 캐비닛 B-12",
    severity: "high",
    status: "active",
    reportedAt: "2026-01-28 14:28:00",
    reportedBy: "자동 센서",
  },
  {
    id: "2",
    title: "온도 이상",
    description: "냉장 보관 장치의 온도가 임계값을 초과했습니다. 현재: 8°C, 임계값: 4°C.",
    location: "냉장 보관 장치 C-05",
    severity: "medium",
    status: "acknowledged",
    reportedAt: "2026-01-28 14:15:00",
    reportedBy: "이박사",
  },
  {
    id: "3",
    title: "환기 시스템 경보",
    description: "실험실 섹션 A에서 공기 흐름 감소가 감지되었습니다. 유지보수팀에 통보되었습니다.",
    location: "실험실 섹션 A",
    severity: "low",
    status: "resolved",
    reportedAt: "2026-01-28 13:45:00",
    reportedBy: "기술자 박",
  },
  {
    id: "4",
    title: "접근 위반",
    description: "제한 구역 화학물질 보관소에 대한 무단 접근 시도가 감지되어 차단되었습니다.",
    location: "제한 구역 R-01",
    severity: "critical",
    status: "acknowledged",
    reportedAt: "2026-01-28 13:30:00",
    reportedBy: "보안 시스템",
  },
]

export function AccidentStatus() {
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mapAccident = (item: any): Accident => ({
    id: String(item?.id ?? ""),
    title: item?.title ?? "",
    description: item?.description ?? "",
    location: item?.location ?? "",
    severity: item?.severity ?? "low",
    status: item?.status ?? "active",
    reportedAt: item?.reportedAt ? String(item.reportedAt) : "",
    reportedBy: item?.reportedBy ?? "system",
  })

  const fetchAccidents = async () => {
    setIsLoading(true)
    try {
      const data = await fetchJson<any[]>("/api/accidents")
      setAccidents(data.map(mapAccident))
    } catch (error) {
      setAccidents(initialAccidents)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccidents()
  }, [])

  const activeCount = accidents.filter((a) => a.status === "active").length
  const acknowledgedCount = accidents.filter((a) => a.status === "acknowledged").length
  const resolvedCount = accidents.filter(
    (a) => a.status === "resolved" || a.status === "false_alarm"
  ).length

  const handleAcknowledge = async (id: string) => {
    try {
      const data = await fetchJson<any>(`/api/accidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ verification_status: 1, verify_subject: "ui" }),
      })
      const updated = mapAccident(data)
      setAccidents((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (error) {
      setAccidents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a))
      )
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const data = await fetchJson<any>(`/api/accidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ verification_status: 2, verify_subject: "ui" }),
      })
      const updated = mapAccident(data)
      setAccidents((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (error) {
      setAccidents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "false_alarm" } : a))
      )
    }
  }

  const getSeverityColor = (severity: Accident["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "high":
        return "bg-destructive/80 text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusIcon = (status: Accident["status"]) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="size-4" />
      case "acknowledged":
        return <Clock className="size-4" />
      case "resolved":
        return <CheckCircle className="size-4" />
      case "false_alarm":
        return <XCircle className="size-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">활성 경보</p>
              <p className="text-2xl font-bold text-destructive">{activeCount}</p>
            </div>
            <AlertTriangle className="size-8 text-destructive/50" />
          </CardContent>
        </Card>
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">확인됨</p>
              <p className="text-2xl font-bold text-warning">{acknowledgedCount}</p>
            </div>
            <Clock className="size-8 text-warning/50" />
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">해결됨</p>
              <p className="text-2xl font-bold text-success">{resolvedCount}</p>
            </div>
            <CheckCircle className="size-8 text-success/50" />
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-4 pr-4">
          {accidents.map((accident) => (
            <Card
              key={accident.id}
              className={cn(
                "overflow-hidden transition-colors",
                accident.status === "active" && "border-destructive/50",
                accident.status === "acknowledged" && "border-warning/50",
                (accident.status === "resolved" || accident.status === "false_alarm") &&
                  "border-success/50 opacity-70"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        accident.status === "active" && "bg-destructive/10 text-destructive",
                        accident.status === "acknowledged" && "bg-warning/10 text-warning",
                        (accident.status === "resolved" || accident.status === "false_alarm") &&
                          "bg-success/10 text-success"
                      )}
                    >
                      {getStatusIcon(accident.status)}
                    </div>
                    <CardTitle className="text-base">{accident.title}</CardTitle>
                  </div>
                  <Badge className={getSeverityColor(accident.severity)}>
                    {accident.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{accident.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-4" />
                    {accident.location}
                  </div>
                  <div className="text-muted-foreground">
                    보고: {accident.reportedAt} / {accident.reportedBy}
                  </div>
                </div>

                <div className="flex gap-2">
                  {accident.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-warning text-warning hover:bg-warning hover:text-warning-foreground bg-transparent"
                      onClick={() => handleAcknowledge(accident.id)}
                    >
                      수신 확인
                    </Button>
                  )}
                  {accident.status !== "resolved" && accident.status !== "false_alarm" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success text-success hover:bg-success hover:text-success-foreground bg-transparent"
                      onClick={() => handleResolve(accident.id)}
                    >
                      해결 완료
                    </Button>
                  )}
                  {accident.status === "resolved" && (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      <CheckCircle className="mr-1 size-3" />
                      해결됨
                    </Badge>
                  )}
                  {accident.status === "false_alarm" && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      <XCircle className="mr-1 size-3" />
                      False Alarm
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
