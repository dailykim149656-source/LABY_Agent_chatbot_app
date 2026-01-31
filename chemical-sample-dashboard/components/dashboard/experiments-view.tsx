"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Edit,
  FileText,
  FlaskConical,
  Trash2,
  Check,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { useExperimentsData } from "@/hooks/use-experiments"
import { getUiText } from "@/lib/ui-text"

type ExperimentStatus = "in_progress" | "completed" | "pending"

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
  status: ExperimentStatus
  researcher: string
  reagents: ExperimentReagent[]
  memo: string
}

const initialExperimentsData: Experiment[] = [
  {
    id: "EXP-2026-001",
    title: "산화 환원 반응 실험",
    date: "2026-01-28",
    status: "in_progress",
    researcher: "김박사",
    reagents: [
      {
        id: "R1",
        masterReagentId: "H2SO4-001",
        name: "황산 #1",
        formula: "H₂SO₄",
        dosage: "50",
        dosageUnit: "ml",
        volume: "450ml",
        density: "1.84 g/cm³",
        mass: "828g",
        purity: "98%",
        location: "캐비닛 A-01",
      },
      {
        id: "R2",
        masterReagentId: "NaOH-001",
        name: "수산화나트륨 #1",
        formula: "NaOH",
        dosage: "25",
        dosageUnit: "g",
        volume: "80ml",
        density: "2.13 g/cm³",
        mass: "170g",
        purity: "99%",
        location: "캐비닛 A-02",
      },
    ],
    memo: "반응 온도 25°C 유지. 배기 시스템 가동 확인.",
  },
  {
    id: "EXP-2026-002",
    title: "촉매 산화 테스트",
    date: "2026-01-27",
    status: "completed",
    researcher: "이교수",
    reagents: [
      {
        id: "R3",
        masterReagentId: "HCl-001",
        name: "염산 #1",
        formula: "HCl",
        dosage: "30",
        dosageUnit: "ml",
        volume: "200ml",
        density: "1.19 g/cm³",
        mass: "238g",
        purity: "37%",
        location: "캐비닛 B-01",
      },
      {
        id: "R4",
        masterReagentId: "Zn-001",
        name: "아연 분말",
        formula: "Zn",
        dosage: "10",
        dosageUnit: "g",
        volume: "100g",
        density: "7.14 g/cm³",
        mass: "100g",
        purity: "99.9%",
        location: "캐비닛 C-01",
      },
    ],
    memo: "촉매 반응 완료. 수소 발생량 측정 완료.",
  },
  {
    id: "EXP-2026-003",
    title: "pH 버퍼 용액 제조",
    date: "2026-01-26",
    status: "pending",
    researcher: "최학생",
    reagents: [
      {
        id: "R5",
        masterReagentId: "CH3COOH-001",
        name: "아세트산 #1",
        formula: "CH₃COOH",
        dosage: "100",
        dosageUnit: "ml",
        volume: "500ml",
        density: "1.05 g/cm³",
        mass: "525g",
        purity: "99.5%",
        location: "캐비닛 A-03",
      },
    ],
    memo: "pH 4.76 버퍼 용액 제조 예정.",
  },
]

interface ExperimentsViewProps {
  language: string
}

const experimentStatuses: ExperimentStatus[] = ["in_progress", "completed", "pending"]

export function ExperimentsView({ language }: ExperimentsViewProps) {
  const uiText = getUiText(language)
  const {
    experiments,
    selectedExperiment,
    selectExperiment,
    memo,
    setMemo,
    availableReagents,
    addReagentToExperiment,
    removeReagentFromExperiment,
    saveMemo,
  } = useExperimentsData(initialExperimentsData, masterReagentInventory)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addReagentDialogOpen, setAddReagentDialogOpen] = useState(false)
  const [reagentSearchOpen, setReagentSearchOpen] = useState(false)
  const [selectedMasterReagent, setSelectedMasterReagent] = useState<MasterReagent | null>(null)
  const [dosageAmount, setDosageAmount] = useState("")
  const [dosageUnit, setDosageUnit] = useState("ml")
  const [listOpen, setListOpen] = useState(false)
  const [reagentsOpen, setReagentsOpen] = useState(false)
  const [memoOpen, setMemoOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    if (isDesktop) {
      setListOpen(true)
      setReagentsOpen(true)
      setMemoOpen(true)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    if (!experimentStatuses.includes(status as ExperimentStatus)) {
      return <Badge variant="secondary">{status}</Badge>
    }

    switch (status as ExperimentStatus) {
      case "in_progress":
        return (
          <Badge className="bg-primary text-primary-foreground">
            {uiText.experimentStatusInProgress}
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            {uiText.experimentStatusCompleted}
          </Badge>
        )
      case "pending":
        return <Badge variant="secondary">{uiText.experimentStatusPending}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleAddReagent = () => {
    if (!selectedMasterReagent || !dosageAmount) return
    addReagentToExperiment(
      selectedExperiment,
      selectedMasterReagent,
      dosageAmount,
      dosageUnit
    )

    setSelectedMasterReagent(null)
    setDosageAmount("")
    setDosageUnit("ml")
    setAddReagentDialogOpen(false)
  }

  const handleRemoveReagent = (reagentId: string) => {
    removeReagentFromExperiment(selectedExperiment, reagentId)
  }

  return (
    <div className="flex h-full flex-col lg:flex-row lg:items-start lg:overflow-y-auto">
      <Collapsible
        open={listOpen}
        onOpenChange={setListOpen}
        className="w-full shrink-0 border-b border-border lg:w-80 lg:border-b-0 lg:border-r"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">{uiText.experimentsListTitle}</h3>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" />
                {uiText.experimentsNewButton}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{uiText.experimentsDialogTitle}</DialogTitle>
                <DialogDescription>{uiText.experimentsDialogDescription}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="exp-title">{uiText.experimentsLabelTitle}</Label>
                  <Input id="exp-title" placeholder="실험 제목 입력" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-researcher">{uiText.experimentsLabelResearcher}</Label>
                  <Input id="exp-researcher" placeholder="연구원 이름" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {uiText.actionCancel}
                </Button>
                <Button onClick={() => setDialogOpen(false)}>{uiText.actionAdd}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              aria-label={listOpen ? "Collapse experiment list" : "Expand experiment list"}
            >
              <span>{listOpen ? uiText.actionCollapse : uiText.actionExpand}</span>
              <ChevronDown
                className={cn("size-4 transition-transform", listOpen ? "rotate-180" : "")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        </div>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
        <div className="space-y-1 p-2">
          {experiments.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  selectExperiment(exp)
                }}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors",
                  selectedExperiment.id === exp.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
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
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-col lg:flex-1">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{selectedExperiment.title}</h2>
              {getStatusBadge(selectedExperiment.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedExperiment.id} · {selectedExperiment.researcher} · {selectedExperiment.date}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
            <Edit className="size-3.5" />
            {uiText.actionEdit}
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row">
          <Collapsible
            open={reagentsOpen}
            onOpenChange={setReagentsOpen}
            className="flex-1 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <FlaskConical className="size-4" />
                {uiText.experimentsReagentsTitle}
              </h3>
              <div className="flex items-center gap-2">
                <Dialog open={addReagentDialogOpen} onOpenChange={setAddReagentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 bg-transparent">
                    <Plus className="size-3.5" />
                    {uiText.experimentsAddReagentButton}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{uiText.experimentsAddReagentTitle}</DialogTitle>
                    <DialogDescription>{uiText.experimentsAddReagentDescription}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>{uiText.experimentsReagentSelectLabel}</Label>
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
                        <PopoverContent className="w-[90vw] max-w-[375px] p-0">
                          <Command>
                            <CommandInput placeholder="시약 검색..." />
                            <CommandList>
                              <CommandEmpty>{uiText.experimentsReagentSearchEmpty}</CommandEmpty>
                              <CommandGroup heading={uiText.experimentsReagentAvailableHeading}>
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
                                        <span className="ml-2 text-muted-foreground">
                                          {reagent.formula}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{reagent.currentVolume}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {reagent.purity}
                                        </Badge>
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
                          <span className="font-medium">{uiText.experimentsLabelLocation}:</span>{" "}
                          {selectedMasterReagent.location} ·{" "}
                          <span className="font-medium">{uiText.experimentsLabelStock}:</span>{" "}
                          {selectedMasterReagent.currentVolume} ·{" "}
                          <span className="font-medium">{uiText.experimentsLabelPurity}:</span>{" "}
                          {selectedMasterReagent.purity}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>{uiText.experimentsLabelDosage}</Label>
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
                      {uiText.actionCancel}
                    </Button>
                    <Button
                      onClick={handleAddReagent}
                      disabled={!selectedMasterReagent || !dosageAmount}
                    >
                      {uiText.actionAdd}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  aria-label={reagentsOpen ? "Collapse reagents" : "Expand reagents"}
                >
                  <span>{reagentsOpen ? uiText.actionCollapse : uiText.actionExpand}</span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", reagentsOpen ? "rotate-180" : "")}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="space-y-3">
              {selectedExperiment.reagents.map((reagent) => (
                <HoverCard key={reagent.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Card className="cursor-pointer transition-colors hover:border-primary/50">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div>
                          <p className="font-medium">
                            {reagent.name}
                            <span className="ml-2 text-muted-foreground">{reagent.formula}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {uiText.experimentsReagentDosageLabel}: {reagent.dosage}
                            {reagent.dosageUnit}
                          </p>
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
                        <h4 className="font-semibold">
                          {reagent.name} ({reagent.formula})
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {reagent.location}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">{uiText.experimentsLabelCurrentVolume}</p>
                          <p className="font-medium">{reagent.volume}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{uiText.experimentsLabelDensity}</p>
                          <p className="font-medium">{reagent.density}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{uiText.experimentsLabelMass}</p>
                          <p className="font-medium">{reagent.mass}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{uiText.experimentsLabelPurity}</p>
                          <p className="font-medium">{reagent.purity}</p>
                        </div>
                      </div>
                      <div className="border-t pt-2 text-xs text-muted-foreground">
                        {uiText.experimentsLabelReagentId}: {reagent.masterReagentId}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={memoOpen}
            onOpenChange={setMemoOpen}
            className="w-full shrink-0 border-t border-border p-4 xl:w-72 xl:border-l xl:border-t-0"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <FileText className="size-4" />
                {uiText.experimentsMemoTitle}
              </h3>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  aria-label={memoOpen ? "Collapse memo" : "Expand memo"}
                >
                  <span>{memoOpen ? uiText.actionCollapse : uiText.actionExpand}</span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", memoOpen ? "rotate-180" : "")}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <div className="pt-3">
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="실험 관련 메모를 입력하세요..."
              className="min-h-[160px] resize-none"
            />
            <Button size="sm" className="mt-3 w-full" onClick={saveMemo}>
              {uiText.experimentsMemoSave}
            </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
