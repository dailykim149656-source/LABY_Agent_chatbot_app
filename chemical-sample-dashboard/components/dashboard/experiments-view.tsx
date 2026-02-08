// chemical-sample-dashboard\components\dashboard\experiments-view.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Edit,
  FileText,
  FlaskConical,
  Trash2,
  Check,
  ChevronsUpDown,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  masterReagentInventory,
  type MasterReagent,
} from "@/lib/reagent-inventory";
import { useExperimentsData } from "@/hooks/use-experiments";
import { getUiText } from "@/lib/ui-text";
import type { ExperimentStatus } from "@/lib/types";

// View-model types: display-oriented (all strings) vs API types in lib/types.ts
interface ExperimentReagentView {
  id: string;
  masterReagentId: string;
  name: string;
  formula: string;
  dosage: string;
  volume: string;
  density: string;
  mass: string;
  purity: string;
  location: string;
}

interface ExperimentView {
  id: string;
  title: string;
  date: string;
  status: ExperimentStatus;
  researcher: string;
  reagents: ExperimentReagentView[];
  memo: string;
}

const initialExperimentsData: ExperimentView[] = [];

interface ExperimentsViewProps {
  language: string;
}

const experimentStatuses: { value: ExperimentStatus; label: string }[] = [
  { value: "in_progress", label: "진행중" },
  { value: "pending", label: "대기" },
  { value: "completed", label: "완료" },
];

export function ExperimentsView({ language }: ExperimentsViewProps) {
  const uiText = getUiText(language);
  const {
    experiments,
    selectedExperiment,
    selectExperiment,
    deselectExperiment,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    memo,
    setMemo,
    availableReagents,
    addReagentToExperiment,
    removeReagentFromExperiment,
    saveMemo,
    statusFilter,
    setStatusFilter,
  } = useExperimentsData(
    initialExperimentsData,
    masterReagentInventory,
    language,
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addReagentDialogOpen, setAddReagentDialogOpen] = useState(false);
  const [reagentSearchOpen, setReagentSearchOpen] = useState(false);
  const [selectedMasterReagent, setSelectedMasterReagent] =
    useState<MasterReagent | null>(null);
  const [dosageAmount, setDosageAmount] = useState("");

  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpResearcher, setNewExpResearcher] = useState("");

  const [editExpTitle, setEditExpTitle] = useState("");
  const [editExpStatus, setEditExpStatus] =
    useState<ExperimentStatus>("in_progress");

  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);

  // ✅ 추가: 유효성 검사 상태
  const [showAddValidation, setShowAddValidation] = useState(false);
  const [showExpValidation, setShowExpValidation] = useState(false);

  // 상태별 배지 색상 적용
  const statusLabelMap: Record<ExperimentStatus, string> = {
    in_progress: "진행중",
    pending: "대기",
    completed: "완료",
  };

  const getStatusBadge = (status: ExperimentStatus) => {
    const label = statusLabelMap[status] ?? status;
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-primary text-primary-foreground border-none px-2.5 py-0.5 hover:bg-primary/90">
            {label}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground border-none px-2.5 py-0.5 hover:bg-warning/90">
            {label}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground border-none px-2.5 py-0.5 hover:bg-success/90">
            {label}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // ✅ 수정: 새 실험 추가 핸들러 (유효성 검사 적용)
  const handleCreateExperiment = async () => {
    if (!newExpTitle || !newExpResearcher) {
      setShowExpValidation(true);
      return;
    }
    await createExperiment(newExpTitle, newExpResearcher);
    setNewExpTitle("");
    setNewExpResearcher("");
    setCreateDialogOpen(false);
    setShowExpValidation(false);
  };

  const handleEditExperiment = async () => {
    if (!selectedExperiment || !editExpTitle) return;
    await updateExperiment(selectedExperiment.id, editExpTitle, editExpStatus);
    setEditDialogOpen(false);
  };

  const handleAddReagent = async () => {
    setShowAddValidation(true);
    if (!selectedMasterReagent) return;

    const dosage = parseFloat(dosageAmount);
    if (!dosageAmount || dosage <= 0) return;

    const stock = parseFloat(
      selectedMasterReagent.currentVolume.replace(/[^0-9.]/g, ""),
    );
    if (stock - dosage < 0) return;

    await addReagentToExperiment(selectedMasterReagent, dosageAmount);
    setSelectedMasterReagent(null);
    setDosageAmount("");
    setAddReagentDialogOpen(false);
    setShowAddValidation(false);
  };

  const handleSaveMemo = async () => {
    await saveMemo();
    setSaveSuccessOpen(true);
  };

  const filteredReagents = availableReagents.filter((r) => {
    const stock = parseFloat(r.currentVolume.replace(/[^0-9.]/g, ""));
    return stock > 0;
  });

  return (
    <div className="flex h-full flex-col lg:flex-row lg:overflow-hidden">
      {/* 실험 목록 사이드바 — 모바일에서 실험 선택 시 숨김 */}
      <div className={cn(
        "w-full overflow-y-auto border-b border-border lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r",
        selectedExperiment ? "hidden lg:flex" : "flex flex-1 flex-col lg:flex-none"
      )}>
        <div className="flex items-center justify-between border-b border-[var(--table-border)] p-4">
          <h3 className="font-semibold">실험 목록</h3>
          <Dialog
            open={createDialogOpen}
            onOpenChange={(o) => {
              setCreateDialogOpen(o);
              if (!o) setShowExpValidation(false);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" />새 실험
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
                  <Input
                    id="exp-title"
                    placeholder="실험 제목 입력"
                    value={newExpTitle}
                    onChange={(e) => {
                      setNewExpTitle(e.target.value);
                      if (showExpValidation) setShowExpValidation(false);
                    }}
                    className={cn(
                      showExpValidation &&
                        !newExpTitle &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exp-researcher">담당 연구원</Label>
                  <Input
                    id="exp-researcher"
                    placeholder="연구원 이름"
                    value={newExpResearcher}
                    onChange={(e) => {
                      setNewExpResearcher(e.target.value);
                      if (showExpValidation) setShowExpValidation(false);
                    }}
                    className={cn(
                      showExpValidation &&
                        !newExpResearcher &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                {/* ✅ 추가: 유효성 검사 문구 */}
                <div className="flex w-full items-center justify-between">
                  <div>
                    {showExpValidation &&
                      (!newExpTitle || !newExpResearcher) && (
                        <p className="text-destructive text-[12px] font-medium">
                          입력되지 않은 값이 있습니다.
                        </p>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false);
                        setShowExpValidation(false);
                      }}
                    >
                      취소
                    </Button>
                    <Button onClick={handleCreateExperiment}>추가</Button>
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 border-b border-border p-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="flex-1"
          >
            전체
          </Button>
          {experimentStatuses.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s.value)}
              className="flex-1"
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="p-2">
          {experiments.map((exp, index) => (
            <div
              key={exp.id}
              className={cn(
                "flex items-center gap-1 border-b border-[var(--table-border)] last:border-b-0",
                index % 2 === 0
                  ? "bg-[var(--table-row-odd)]"
                  : "bg-[var(--table-row-even)]"
              )}
            >
              <button
                type="button"
                onClick={() => selectExperiment(exp)}
                className={cn(
                  "flex-1 rounded-lg p-3 text-left transition-colors",
                  selectedExperiment?.id === exp.id
                    ? "bg-[var(--table-hover)]"
                    : "hover:bg-[var(--table-hover)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {exp.id}
                  </span>
                  {getStatusBadge(exp.status)}
                </div>
                <p className="mt-1 font-medium">{exp.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {exp.researcher} · {exp.date}
                </p>
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>영구 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      {exp.title}을(를) 영구적으로 삭제하시겠습니까? 이 작업은
                      되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteExperiment(exp.id)}
                    >
                      영구 삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </div>

      {/* 중앙 상세 영역 */}
      {selectedExperiment ? (
        <div className="flex flex-1 flex-col lg:overflow-hidden">
          {/* 모바일 뒤로가기 버튼 */}
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={deselectExperiment}
            >
              <ArrowLeft className="size-4" />
              목록으로
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {selectedExperiment.title}
                </h2>
                {getStatusBadge(selectedExperiment.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedExperiment.id} · {selectedExperiment.researcher} ·{" "}
                {selectedExperiment.date}
              </p>
            </div>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-[var(--table-row-odd)] border-[var(--table-border)] hover:bg-[var(--table-hover)]"
                  onClick={() => {
                    setEditExpTitle(selectedExperiment.title);
                    setEditExpStatus(selectedExperiment.status);
                  }}
                >
                  <Edit className="size-3.5" />
                  수정
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>실험 정보 수정</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>실험 이름</Label>
                    <Input
                      value={editExpTitle}
                      onChange={(e) => setEditExpTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>상태</Label>
                    <Select
                      value={editExpStatus}
                      onValueChange={(v) =>
                        setEditExpStatus(v as ExperimentStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experimentStatuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button onClick={handleEditExperiment}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col xl:flex-row xl:flex-1 xl:overflow-hidden">
            <div className="flex-1 p-4 xl:overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <FlaskConical className="size-4" />
                  사용 시약
                </h3>
                <Dialog
                  open={addReagentDialogOpen}
                  onOpenChange={(o) => {
                    setAddReagentDialogOpen(o);
                    if (!o) setShowAddValidation(false);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 bg-transparent"
                    >
                      <Plus className="size-3.5" />
                      시약 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>시약 추가</DialogTitle>
                      <DialogDescription>
                        시약 재고에서 시약을 선택하고 사용량을 입력하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>시약 선택</Label>
                        <Popover
                          open={reagentSearchOpen}
                          onOpenChange={setReagentSearchOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
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
                                <CommandEmpty>
                                  검색 결과가 없습니다.
                                </CommandEmpty>
                                <CommandGroup heading="사용 가능한 시약">
                                  {filteredReagents.map((reagent) => (
                                    <CommandItem
                                      key={reagent.id}
                                      value={`${reagent.name} ${reagent.formula}`}
                                      onSelect={() => {
                                        setSelectedMasterReagent(reagent);
                                        setReagentSearchOpen(false);
                                        if (showAddValidation)
                                          setShowAddValidation(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 size-4",
                                          selectedMasterReagent?.id ===
                                            reagent.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <div className="flex flex-1 items-center justify-between">
                                        <div>
                                          <span className="font-medium">
                                            {reagent.name}
                                          </span>
                                          <span className="ml-2 text-muted-foreground text-xs">
                                            {reagent.formula}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px]"
                                        >
                                          {reagent.currentVolume}
                                        </Badge>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {showAddValidation && !selectedMasterReagent && (
                          <p className="text-destructive text-[12px] font-medium mt-1">
                            시약을 선택해주세요.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>사용량 (ml)</Label>
                        <Input
                          type="number"
                          placeholder="사용량 입력"
                          value={dosageAmount}
                          onChange={(e) => {
                            setDosageAmount(e.target.value);
                            if (showAddValidation) setShowAddValidation(false);
                          }}
                          className={cn(
                            showAddValidation &&
                              (!dosageAmount ||
                                parseFloat(dosageAmount) <= 0 ||
                                (selectedMasterReagent &&
                                  parseFloat(
                                    selectedMasterReagent.currentVolume.replace(
                                      /[^0-9.]/g,
                                      "",
                                    ),
                                  ) -
                                    parseFloat(dosageAmount) <
                                    0)) &&
                              "border-red-500",
                          )}
                        />
                        {showAddValidation &&
                          (!dosageAmount || parseFloat(dosageAmount) <= 0) && (
                            <p className="text-destructive text-[12px] font-medium mt-1">
                              0보다 큰 값을 입력해주세요.
                            </p>
                          )}
                        {showAddValidation &&
                          selectedMasterReagent &&
                          dosageAmount &&
                          parseFloat(dosageAmount) > 0 &&
                          parseFloat(
                            selectedMasterReagent.currentVolume.replace(
                              /[^0-9.]/g,
                              "",
                            ),
                          ) -
                            parseFloat(dosageAmount) <
                            0 && (
                            <p className="text-destructive text-[12px] font-medium mt-1">
                              시약의 재고가 사용량보다 적습니다.
                            </p>
                          )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddReagentDialogOpen(false);
                          setSelectedMasterReagent(null);
                          setDosageAmount("");
                          setShowAddValidation(false);
                        }}
                      >
                        취소
                      </Button>
                      <Button onClick={handleAddReagent}>추가</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {selectedExperiment.reagents.map((reagent, index) => (
                  <Card
                    key={reagent.id}
                    className={cn(
                      "transition-colors hover:border-primary/50",
                      index % 2 === 0
                        ? "bg-[var(--table-row-odd)]"
                        : "bg-[var(--table-row-even)]"
                    )}
                  >
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <div className="flex-1 cursor-pointer">
                            <p className="font-medium">
                              {reagent.name}
                              <span className="ml-2 text-muted-foreground">
                                {reagent.formula}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              사용량: {reagent.dosage} ml
                            </p>
                          </div>
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
                                <p className="text-muted-foreground">사용량</p>
                                <p className="font-medium">
                                  {reagent.dosage} ml
                                </p>
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
                          </div>
                        </HoverCardContent>
                      </HoverCard>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{reagent.purity}</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>영구 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                시약 사용 내역을 삭제하시겠습니까? 이 작업은
                                되돌릴 수 없으며, 시약 재고가 자동으로
                                복구됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() =>
                                  removeReagentFromExperiment(reagent.id)
                                }
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="w-full shrink-0 border-t border-border p-4 xl:w-72 xl:border-l xl:border-t-0">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <FileText className="size-4" />
                연구 메모
              </h3>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="실험 관련 메모를 입력하세요..."
                className="min-h-[160px] resize-none bg-[var(--table-row-odd)] border-[var(--table-border)]"
              />
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={handleSaveMemo}
              >
                메모 저장
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center text-muted-foreground lg:flex">
          실험을 선택하세요
        </div>
      )}

      <Dialog open={saveSuccessOpen} onOpenChange={setSaveSuccessOpen}>
        <DialogContent className="sm:max-w-[320px] text-center p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-success/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div className="grid gap-2">
              <DialogTitle className="text-center text-lg font-semibold">
                저장 완료
              </DialogTitle>
              <DialogDescription className="text-center">
                메모가 성공적으로 저장되었습니다.
              </DialogDescription>
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => setSaveSuccessOpen(false)}
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
