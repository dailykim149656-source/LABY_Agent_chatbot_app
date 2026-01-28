"use client"

import { useEffect, useState } from "react"
import { Mail, CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchJson } from "@/lib/api"

interface EmailLog {
  id: string
  sentTime: string
  recipient: string
  recipientEmail: string
  incidentType: string
  deliveryStatus: "delivered" | "pending" | "failed"
}

const emailLogs: EmailLog[] = [
  {
    id: "1",
    sentTime: "2026-01-28 14:30:00",
    recipient: "비상 대응팀",
    recipientEmail: "ert@chemlab.org",
    incidentType: "화학물질 유출 경보",
    deliveryStatus: "delivered",
  },
  {
    id: "2",
    sentTime: "2026-01-28 14:28:45",
    recipient: "김박사",
    recipientEmail: "kim@chemlab.org",
    incidentType: "온도 경고",
    deliveryStatus: "delivered",
  },
  {
    id: "3",
    sentTime: "2026-01-28 14:25:30",
    recipient: "안전 담당관",
    recipientEmail: "safety@chemlab.org",
    incidentType: "프로토콜 오버라이드 요청",
    deliveryStatus: "pending",
  },
  {
    id: "4",
    sentTime: "2026-01-28 14:20:15",
    recipient: "실험실 소장",
    recipientEmail: "director@chemlab.org",
    incidentType: "장비 오작동",
    deliveryStatus: "delivered",
  },
  {
    id: "5",
    sentTime: "2026-01-28 14:15:00",
    recipient: "유지보수팀",
    recipientEmail: "maintenance@chemlab.org",
    incidentType: "환기 시스템 경보",
    deliveryStatus: "failed",
  },
  {
    id: "6",
    sentTime: "2026-01-28 14:10:22",
    recipient: "전 직원",
    recipientEmail: "all@chemlab.org",
    incidentType: "대피 훈련 공지",
    deliveryStatus: "delivered",
  },
]

export function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mapLog = (item: any): EmailLog => ({
    id: String(item?.id ?? ""),
    sentTime: item?.sentTime ? String(item.sentTime) : "",
    recipient: item?.recipient ?? "",
    recipientEmail: item?.recipientEmail ?? "",
    incidentType: item?.incidentType ?? "",
    deliveryStatus: item?.deliveryStatus ?? "pending",
  })

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const data = await fetchJson<any[]>("/api/logs/emails")
      setLogs(data.map(mapLog))
    } catch (error) {
      setLogs(emailLogs)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])
  const getStatusIcon = (status: EmailLog["deliveryStatus"]) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="size-4 text-success" />
      case "pending":
        return <Clock className="size-4 text-warning" />
      case "failed":
        return <XCircle className="size-4 text-destructive" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: EmailLog["deliveryStatus"]) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-success text-success-foreground">전송됨</Badge>
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">대기 중</Badge>
      case "failed":
        return <Badge variant="destructive">실패</Badge>
      default:
        return null
    }
  }

  const getIncidentBadge = (type: string) => {
    if (type.includes("Spill") || type.includes("Emergency")) {
      return <Badge variant="destructive">{type}</Badge>
    }
    if (type.includes("Warning") || type.includes("Malfunction")) {
      return <Badge className="bg-warning text-warning-foreground">{type}</Badge>
    }
    return <Badge variant="secondary">{type}</Badge>
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-3 pr-4">
        {logs.map((email) => (
          <Card key={email.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{email.recipient}</span>
                      {getStatusIcon(email.deliveryStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">{email.recipientEmail}</p>
                    <div className="pt-1">
                      {getIncidentBadge(email.incidentType)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-muted-foreground">{email.sentTime}</p>
                  <div className="mt-2">
                    {getStatusBadge(email.deliveryStatus)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
