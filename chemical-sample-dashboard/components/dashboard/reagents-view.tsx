"use client"

import { useState } from "react"
import { AlertTriangle, Plus, Trash2, Archive, CheckCircle, Thermometer, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ReagentItem {
  id: string
  name: string
  formula: string
  purchaseDate: string
  openDate: string | null
  currentVolume: string
  purity: string
  location: string
  status: "정상" | "부족" | "만료임박"
}

interface DisposedItem {
  id: string
  name: string
  formula: string
  disposalDate: string
  reason: string
  disposedBy: string
}

const initialReagents: ReagentItem[] = [
  { id: "H2SO4-001", name: "황산 #1", formula: "H₂SO₄", purchaseDate: "2025-12-15", openDate: "2026-01-10", currentVolume: "450ml", purity: "98%", location: "캐비닛 A-01", status: "정상" },
  { id: "NaOH-001", name: "수산화나트륨 #1", formula: "NaOH", purchaseDate: "2025-11-20", openDate: "2025-12-05", currentVolume: "80ml", purity: "99%", location: "캐비닛 A-02", status: "부족" },
  { id: "HCl-001", name: "염산 #1", formula: "HCl", purchaseDate: "2025-10-01", openDate: "2025-10-15", currentVolume: "200ml", purity: "37%", location: "캐비닛 B-01", status: "만료임박" },
  { id: "CH3COOH-001", name: "아세트산 #1", formula: "CH₃COOH", purchaseDate: "2026-01-05", openDate: null, currentVolume: "500ml", purity: "99.5%", location: "캐비닛 A-03", status: "정상" },
  { id: "H2SO4-002", name: "황산 #2", formula: "H₂SO₄", purchaseDate: "2026-01-20", openDate: null, currentVolume: "500ml", purity: "98%", location: "캐비닛 A-01", status: "정상" },
]

const initialDisposed: DisposedItem[] = [
  { id: "HNO3-001", name: "질산 #1", formula: "HNO₃", disposalDate: "2026-01-25", reason: "만료", disposedBy: "김박사" },
  { id: "NH3-001", name: "암모니아 #1", formula: "NH₃", disposalDate: "2026-01-20", reason: "오염", disposedBy: "이박사" },
]

const storageEnvironment = [
  { location: "캐비닛 A", temp: "22°C", humidity: "42%", status: "정상" },
  { location: "캐비닛 B", temp: "24°C", humidity: "48%", status: "주의" },
  { location: "냉장실", temp: "4°C", humidity: "55%", status: "정상" },
]

export function ReagentsView() {
  const [reagents, setReagents] = useState<ReagentItem[]>(initialReagents)
  const [disposed, setDisposed] = useState<DisposedItem[]>(initialDisposed)
  const [fallenAlert, setFallenAlert] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const handleDispose = (id: string) => {
    const reagent = reagents.find((r) => r.id === id)
    if (reagent) {
      setReagents(reagents.filter((r) => r.id !== id))
      setDisposed([
        {
          id: reagent.id,
          name: reagent.name,
          formula: reagent.formula,
          disposalDate: new Date().toISOString().split("T")[0],
          reason: "폐기 처리",
          disposedBy: "관리자",
        },
        ...disposed,
      ])
    }
  }

  const getStatusBadge = (status: ReagentItem["status"]) => {
    switch (status) {
      case "정상":
        return <Badge className="bg-success text-success-foreground">정상</Badge>
      case "부족":
        return <Badge className="bg-warning text-warning-foreground">부족</Badge>
      case "만료임박":
        return <Badge variant="destructive">만료임박</Badge>
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Fallen Reagent Alert Banner */}
      {fallenAlert && (
        <div className="shrink-0 border-b border-destructive/50 bg-destructive/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">시약병 전도 감지!</p>
                <p className="text-sm text-destructive/80">
                  캐비닛 B-01에서 시약병 전도가 감지되었습니다. 즉시 확인이 필요합니다.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setFallenAlert(false)}
              className="gap-1.5"
            >
              <CheckCircle className="size-3.5" />
              확인 및 해결
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="inventory" className="flex h-full flex-col">
            <div className="shrink-0 border-b border-border px-4">
              <div className="flex items-center justify-between py-3">
                <TabsList>
                  <TabsTrigger value="inventory">시약 재고</TabsTrigger>
                  <TabsTrigger value="disposed">폐기 목록</TabsTrigger>
                </TabsList>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="size-3.5" />
                      시약 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 시약 추가</DialogTitle>
                      <DialogDescription>
                        새로운 시약 정보를 입력하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-name">시약 이름</Label>
                          <Input id="reagent-name" placeholder="예: 황산 #3" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-formula">화학식</Label>
                          <Input id="reagent-formula" placeholder="예: H₂SO₄" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-volume">용량</Label>
                          <Input id="reagent-volume" placeholder="예: 500ml" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-purity">순도</Label>
                          <Input id="reagent-purity" placeholder="예: 98%" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reagent-location">보관 위치</Label>
                        <Input id="reagent-location" placeholder="예: 캐비닛 A-01" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={() => setAddDialogOpen(false)}>추가</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="inventory" className="mt-0 flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">시약명</TableHead>
                    <TableHead className="font-semibold">화학식</TableHead>
                    <TableHead className="font-semibold">구매일</TableHead>
                    <TableHead className="font-semibold">개봉일</TableHead>
                    <TableHead className="font-semibold">현재 용량</TableHead>
                    <TableHead className="font-semibold">순도</TableHead>
                    <TableHead className="font-semibold">위치</TableHead>
                    <TableHead className="font-semibold">상태</TableHead>
                    <TableHead className="font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reagents.map((reagent) => (
                    <TableRow key={reagent.id}>
                      <TableCell className="font-medium">{reagent.name}</TableCell>
                      <TableCell>{reagent.formula}</TableCell>
                      <TableCell>{reagent.purchaseDate}</TableCell>
                      <TableCell>{reagent.openDate || "-"}</TableCell>
                      <TableCell>{reagent.currentVolume}</TableCell>
                      <TableCell>{reagent.purity}</TableCell>
                      <TableCell>{reagent.location}</TableCell>
                      <TableCell>{getStatusBadge(reagent.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="size-8">
                            <Archive className="size-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>시약 폐기 확인</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {reagent.name}을(를) 폐기 목록으로 이동하시겠습니까?
                                  이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDispose(reagent.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  폐기
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="disposed" className="mt-0 flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">시약명</TableHead>
                    <TableHead className="font-semibold">화학식</TableHead>
                    <TableHead className="font-semibold">폐기일</TableHead>
                    <TableHead className="font-semibold">폐기 사유</TableHead>
                    <TableHead className="font-semibold">처리자</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposed.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.formula}</TableCell>
                      <TableCell>{item.disposalDate}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>{item.disposedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>

        {/* Storage Environment Panel */}
        <div className="w-72 shrink-0 border-l border-border overflow-y-auto p-4">
          <h3 className="mb-3 font-semibold">보관 환경 모니터링</h3>
          <div className="space-y-3">
            {storageEnvironment.map((env) => (
              <Card
                key={env.location}
                className={
                  env.status === "주의"
                    ? "border-warning/50 bg-warning/5"
                    : "border-border/50"
                }
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{env.location}</span>
                    <Badge
                      variant={env.status === "주의" ? "outline" : "secondary"}
                      className={
                        env.status === "주의"
                          ? "border-warning text-warning"
                          : "bg-success/10 text-success"
                      }
                    >
                      {env.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Thermometer className="size-3" />
                      {env.temp}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="size-3" />
                      {env.humidity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
