"use client"

import { useState } from "react"
import { Plus, Edit, FileText, FlaskConical, Trash2, Check, ChevronsUpDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { masterReagentInventory, dosageUnits, type MasterReagent } from "@/lib/reagent-inventory"

interface ExperimentReagent {
  id: string
  masterReagentId: string
  name: string
  formula: string
  dosage: string
  dosageUnit: string
  volume: string
  density: string
  mass: string
  purity: string
  location: string
}

interface Experiment {
  id: string
  title: string
  date: string
  status: "진행중" | "완료" | "대기"
  researcher: string
  reagents: ExperimentReagent[]
  memo: string
}

const initialExperimentsData: Experiment[] = [
  {
    id: "EXP-2026-001",
    title: "산화 환원 반응 실험",
    date: "2026-01-28",
    status: "진행중",
    researcher: "김박사",
    reagents: [
      { id: "R1", masterReagentId: "H2SO4-001", name: "황산 #1", formula: "H₂SO₄", dosage: "50", dosageUnit: "ml", volume: "450ml", density: "1.84 g/cm³", mass: "828g", purity: "98%", location: "캐비닛 A-01" },
      { id: "R2", masterReagentId: "NaOH-001", name: "수산화나트륨 #1", formula: "NaOH", dosage: "25", dosageUnit: "g", volume: "80ml", density: "2.13 g/cm³", mass: "170g", purity: "99%", location: "캐비닛 A-02" },
    ],
    memo: "반응 온도 25°C 유지 필요. 환기 시스템 가동 확인.",
  },
  {
    id: "EXP-2026-002",
    title: "촉매 효율 테스트",
    date: "2026-01-27",
    status: "완료",
    researcher: "이박사",
    reagents: [
      { id: "R3", masterReagentId: "HCl-001", name: "염산 #1", formula: "HCl", dosage: "30", dosageUnit: "ml", volume: "200ml", density: "1.19 g/cm³", mass: "238g", purity: "37%", location: "캐비닛 B-01" },
      { id: "R4", masterReagentId: "Zn-001", name: "아연 분말", formula: "Zn", dosage: "10", dosageUnit: "g", volume: "100g", density: "7.14 g/cm³", mass: "100g", purity: "99.9%", location: "캐비닛 C-01" },
    ],
    memo: "촉매 반응 완료. 수소 발생량 측정 완료.",
  },
  {
    id: "EXP-2026-003",
    title: "pH 버퍼 용액 제조",
    date: "2026-01-26",
    status: "대기",
    researcher: "최박사",
    reagents: [
      { id: "R5", masterReagentId: "CH3COOH-001", name: "아세트산 #1", formula: "CH₃COOH", dosage: "100", dosageUnit: "ml", volume: "500ml", density: "1.05 g/cm³", mass: "525g", purity: "99.5%", location: "캐비닛 A-03" },
    ],
    memo: "pH 4.76 버퍼 용액 제조 예정.",
  },
]

export function ExperimentsView() {
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperimentsData)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment>(initialExperimentsData[0])
  const [memo, setMemo] = useState(initialExperimentsData[0].memo)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addReagentDialogOpen, setAddReagentDialogOpen] = useState(false)
  const [reagentSearchOpen, setReagentSearchOpen] = useState(false)
  const [selectedMasterReagent, setSelectedMasterReagent] = useState<MasterReagent | null>(null)
  const [dosageAmount, setDosageAmount] = useState("")
  const [dosageUnit, setDosageUnit] = useState("ml")

  const getStatusBadge = (status: Experiment["status"]) => {
    switch (status) {
      case "진행중":
        return <Badge className="bg-primary text-primary-foreground">진행중</Badge>
      case "완료":
        return <Badge className="bg-success text-success-foreground">완료</Badge>
      case "대기":
        return <Badge variant="secondary">대기</Badge>
    }
  }

  const handleAddReagent = () => {
    if (!selectedMasterReagent || !dosageAmount) return

    const newReagent: ExperimentReagent = {
      id: `R${Date.now()}`,
      masterReagentId: selectedMasterReagent.id,
      name: selectedMasterReagent.name,
      formula: selectedMasterReagent.formula,
      dosage: dosageAmount,
      dosageUnit: dosageUnit,
      volume: selectedMasterReagent.currentVolume,
      density: selectedMasterReagent.density,
      mass: selectedMasterReagent.mass,
      purity: selectedMasterReagent.purity,
      location: selectedMasterReagent.location,
    }

    const updatedExperiment = {
      ...selectedExperiment,
      reagents: [...selectedExperiment.reagents, newReagent],
    }

    setExperiments(experiments.map((exp) =>
      exp.id === selectedExperiment.id ? updatedExperiment : exp
    ))
    setSelectedExperiment(updatedExperiment)

    // Reset form
    setSelectedMasterReagent(null)
    setDosageAmount("")
    setDosageUnit("ml")
    setAddReagentDialogOpen(false)
  }

  const handleRemoveReagent = (reagentId: string) => {
    const updatedExperiment = {
      ...selectedExperiment,
      reagents: selectedExperiment.reagents.filter((r) => r.id !== reagentId),
    }

    setExperiments(experiments.map((exp) =>
      exp.id === selectedExperiment.id ? updatedExperiment : exp
    ))
    setSelectedExperiment(updatedExperiment)
  }

  // Get reagents that are not already in the experiment
  const availableReagents = masterReagentInventory.filter(
    (mr) => !selectedExperiment.reagents.some((er) => er.masterReagentId === mr.id)
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* Experiment List */}
      <div className="w-80 shrink-0 border-r border-border">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">실험 목록</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                새 실험
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 실험 추가</DialogTitle>
                <DialogDescription>
                  새로운 실험 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="exp-title">실험 제목</Label>
                  <Input id="exp-title" placeholder="실험 제목 입력" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-researcher">담당 연구원</Label>
                  <Input id="exp-researcher" placeholder="연구원 이름" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setDialogOpen(false)}>추가</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-[calc(100%-57px)]">
          <div className="space-y-1 p-2">
            {experiments.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  setSelectedExperiment(exp)
                  setMemo(exp.memo)
                }}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selectedExperiment.id === exp.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{exp.id}</span>
                  {getStatusBadge(exp.status)}
                </div>
                <p className="mt-1 font-medium">{exp.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {exp.researcher} · {exp.date}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Experiment Detail */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedExperiment.title}</h2>
              {getStatusBadge(selectedExperiment.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedExperiment.id} · {selectedExperiment.researcher} · {selectedExperiment.date}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
            <Edit className="size-3.5" />
            편집
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Reagents Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <FlaskConical className="size-4" />
                사용 시약
              </h3>
              <Dialog open={addReagentDialogOpen} onOpenChange={setAddReagentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 bg-transparent">
                    <Plus className="size-3.5" />
                    시약 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>시약 추가</DialogTitle>
                    <DialogDescription>
                      시약 관리 재고에서 시약을 선택하고 사용량을 입력하세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>시약 선택</Label>
                      <Popover open={reagentSearchOpen} onOpenChange={setReagentSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={reagentSearchOpen}
                            className="w-full justify-between bg-transparent"
                          >
                            {selectedMasterReagent
                              ? `${selectedMasterReagent.name} (${selectedMasterReagent.formula})`
                              : "시약을 검색하세요..."}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[375px] p-0">
                          <Command>
                            <CommandInput placeholder="시약 검색..." />
                            <CommandList>
                              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                              <CommandGroup heading="사용 가능한 시약">
                                {availableReagents.map((reagent) => (
                                  <CommandItem
                                    key={reagent.id}
                                    value={`${reagent.name} ${reagent.formula} ${reagent.id}`}
                                    onSelect={() => {
                                      setSelectedMasterReagent(reagent)
                                      setReagentSearchOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 size-4",
                                        selectedMasterReagent?.id === reagent.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-1 items-center justify-between">
                                      <div>
                                        <span className="font-medium">{reagent.name}</span>
                                        <span className="ml-2 text-muted-foreground">{reagent.formula}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{reagent.currentVolume}</span>
                                        <Badge variant="secondary" className="text-xs">{reagent.purity}</Badge>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedMasterReagent && (
                        <div className="mt-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                          <span className="font-medium">위치:</span> {selectedMasterReagent.location} ·{" "}
                          <span className="font-medium">재고:</span> {selectedMasterReagent.currentVolume} ·{" "}
                          <span className="font-medium">순도:</span> {selectedMasterReagent.purity}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>사용량</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="사용량 입력"
                          value={dosageAmount}
                          onChange={(e) => setDosageAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={dosageUnit} onValueChange={setDosageUnit}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="단위" />
                          </SelectTrigger>
                          <SelectContent>
                            {dosageUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddReagentDialogOpen(false)
                        setSelectedMasterReagent(null)
                        setDosageAmount("")
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleAddReagent}
                      disabled={!selectedMasterReagent || !dosageAmount}
                    >
                      추가
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {selectedExperiment.reagents.map((reagent) => (
                <HoverCard key={reagent.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Card className="cursor-pointer transition-colors hover:border-primary/50">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">
                            {reagent.name}
                            <span className="ml-2 text-muted-foreground">{reagent.formula}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">투입량: {reagent.dosage}{reagent.dosageUnit}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{reagent.purity}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveReagent(reagent.id)
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{reagent.name} ({reagent.formula})</h4>
                        <Badge variant="secondary" className="text-xs">{reagent.location}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">현재 재고</p>
                          <p className="font-medium">{reagent.volume}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">밀도</p>
                          <p className="font-medium">{reagent.density}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">질량</p>
                          <p className="font-medium">{reagent.mass}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">순도</p>
                          <p className="font-medium">{reagent.purity}</p>
                        </div>
                      </div>
                      <div className="border-t pt-2 text-xs text-muted-foreground">
                        시약 ID: {reagent.masterReagentId}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </div>

          {/* Memo Panel */}
          <div className="w-72 shrink-0 border-l border-border p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <FileText className="size-4" />
              연구 메모
            </h3>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="실험 관련 메모를 입력하세요..."
              className="min-h-[200px] resize-none"
            />
            <Button size="sm" className="mt-3 w-full">
              메모 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
