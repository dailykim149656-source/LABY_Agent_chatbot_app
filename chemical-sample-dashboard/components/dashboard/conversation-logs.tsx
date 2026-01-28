"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchJson } from "@/lib/api"

interface LogEntry {
  id: string
  timestamp: string
  user: string
  command: string
  status: "completed" | "pending" | "failed"
}

const logData: LogEntry[] = [
  {
    id: "1",
    timestamp: "2026-01-28 14:32:15",
    user: "김박사",
    command: "시료 #A-2847 상태 확인",
    status: "completed",
  },
  {
    id: "2",
    timestamp: "2026-01-28 14:28:42",
    user: "이박사",
    command: "구역 B 비상 프로토콜 시작",
    status: "completed",
  },
  {
    id: "3",
    timestamp: "2026-01-28 14:25:10",
    user: "기술자 박",
    command: "캐비닛 C-05 온도 오버라이드 요청",
    status: "pending",
  },
  {
    id: "4",
    timestamp: "2026-01-28 14:22:33",
    user: "김박사",
    command: "실험실 섹션 A 안전 체크리스트 조회",
    status: "completed",
  },
  {
    id: "5",
    timestamp: "2026-01-28 14:18:05",
    user: "관리자",
    command: "시스템 진단 요청",
    status: "completed",
  },
  {
    id: "6",
    timestamp: "2026-01-28 14:15:22",
    user: "최박사",
    command: "시료 #B-1923 냉장 보관소로 이동",
    status: "failed",
  },
  {
    id: "7",
    timestamp: "2026-01-28 14:10:48",
    user: "기술자 정",
    command: "재고 목록 업데이트",
    status: "completed",
  },
  {
    id: "8",
    timestamp: "2026-01-28 14:05:30",
    user: "이박사",
    command: "환기 장치 유지보수 일정 예약",
    status: "pending",
  },
]

export function ConversationLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mapLog = (item: any): LogEntry => ({
    id: String(item?.id ?? ""),
    timestamp: item?.timestamp ? String(item.timestamp) : "",
    user: item?.user ?? "system",
    command: item?.command ?? "",
    status: item?.status ?? "pending",
  })

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const data = await fetchJson<any[]>("/api/logs/conversations")
      setLogs(data.map(mapLog))
    } catch (error) {
      setLogs(logData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])
  const getStatusBadge = (status: LogEntry["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">완료</Badge>
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">대기 중</Badge>
      case "failed":
        return <Badge variant="destructive">실패</Badge>
      default:
        return null
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">시간</TableHead>
            <TableHead className="font-semibold">사용자</TableHead>
            <TableHead className="font-semibold">명령/지시</TableHead>
            <TableHead className="font-semibold">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {log.timestamp}
              </TableCell>
              <TableCell className="font-medium">{log.user}</TableCell>
              <TableCell className="max-w-md truncate">{log.command}</TableCell>
              <TableCell>{getStatusBadge(log.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
