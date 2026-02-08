"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Archive,
  Thermometer,
  Droplets,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useReagentsData } from "@/hooks/use-reagents";
import { getUiText } from "@/lib/ui-text";
import { cn } from "@/lib/utils"; // ✅ 테두리 색상 변경을 위해 cn 유틸리티 추가
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { fetchHazardInfo } from "@/lib/data/reagents";

import CameraPreviewCard from "@/components/camera/CameraPreviewCard";

// ▼▼▼ [수정됨] 유해성 정보 툴팁 컴포넌트 (자동 숨김 + 디자인 개선) ▼▼▼
// ??? [???] ??? ?? ?? ???? (?? ?? + ??? ??) ???
type HazardStatus = "loading" | "success" | "empty" | "error";

// Hazard tooltip component (icon hover only + fallback text)
const hazardInfoCache = new Map<string, string>();

const HazardTooltip = ({ chemName }: { chemName: string }) => {
  const [info, setInfo] = useState("조회 중...");
  const [status, setStatus] = useState<HazardStatus>("loading");
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const updatePosition = useCallback(() => {
    const target = buttonRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setCoords({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  // Check hazard info on demand (hover/focus)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!chemName) {
      setStatus("empty");
      setInfo("정보 없음");
      return;
    }

    const cached = hazardInfoCache.get(chemName);
    if (cached) {
      setInfo(cached);
      setStatus("success");
      return;
    }

    const controller = new AbortController();
    const checkDB = async () => {
      setStatus("loading");
      setInfo("조회 중...");
      try {
        const data = await fetchHazardInfo(chemName, controller.signal);

        if (
          data?.status === "success" &&
          typeof data.hazard === "string" &&
          data.hazard.trim() !== ""
        ) {
          const hazardText = data.hazard.trim();
          hazardInfoCache.set(chemName, hazardText);
          setInfo(hazardText);
          setStatus("success");
        } else {
          setInfo("정보 없음");
          setStatus("empty");
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setInfo("조회 실패");
      }
    };
    checkDB();

    return () => controller.abort();
  }, [chemName, open]);

  const iconClassName = cn(
    "transition-colors flex items-center",
    status === "error" && "text-destructive hover:text-destructive/80",
    status === "empty" && "text-muted-foreground hover:text-foreground",
    status === "loading" && "text-warning hover:text-warning/80",
    status === "success" && "text-success hover:text-success/80",
  );

  const handlePointerOpen = () => {
    setOpen(true);
  };

  const handlePointerClose = () => {
    setOpen(false);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        className={cn("ml-1.5 align-middle", iconClassName)}
        onMouseEnter={handlePointerOpen}
        onMouseLeave={handlePointerClose}
        onFocus={handlePointerOpen}
        onBlur={handlePointerClose}
        onClick={() => setOpen((prev) => !prev)}
      >
        <AlertTriangle className="size-4" />
      </button>

      {isMounted &&
        open &&
        coords &&
        createPortal(
          <div
            className="fixed z-50 w-fit max-w-[300px] whitespace-pre-wrap break-words leading-5 p-3 bg-gray-900 text-white text-xs rounded-md shadow-xl border border-gray-700"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y - 8}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-bold text-warning mb-1 border-b border-gray-700 pb-1">
              유해성 정보
            </div>
            <div className="text-gray-100">{info}</div>
            {status === "error" && (
              <div className="mt-1 text-[10px] text-destructive/80">
                API/DB 조회에 실패했습니다.
              </div>
            )}
            <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body,
        )}
    </div>
  );
};

import type { CabinetType, CabinetStatus } from "@/lib/types";

const cabinetData: Array<{
  id: number;
  name: string;
  type: CabinetType;
  count: number;
  max: number;
  status: CabinetStatus;
  temp: string;
  humidity: string;
}> = [
  {
    id: 1,
    name: "A-01",
    type: "general",
    count: 12,
    max: 20,
    status: "normal",
    temp: "22°C",
    humidity: "45%",
  },
  {
    id: 2,
    name: "A-02",
    type: "general",
    count: 18,
    max: 20,
    status: "warning",
    temp: "23°C",
    humidity: "48%",
  },
  {
    id: 3,
    name: "B-01",
    type: "cold",
    count: 8,
    max: 15,
    status: "normal",
    temp: "4°C",
    humidity: "60%",
  },
  {
    id: 4,
    name: "B-02",
    type: "cold",
    count: 14,
    max: 15,
    status: "warning",
    temp: "5°C",
    humidity: "62%",
  },
  {
    id: 5,
    name: "C-01",
    type: "hazard",
    count: 5,
    max: 10,
    status: "normal",
    temp: "20°C",
    humidity: "40%",
  },
  {
    id: 6,
    name: "C-02",
    type: "hazard",
    count: 3,
    max: 10,
    status: "normal",
    temp: "21°C",
    humidity: "42%",
  },
];

type UiText = ReturnType<typeof getUiText>;

type RightPanelProps = {
  uiText: UiText;
  className?: string;
  getCabinetTypeLabel: (type: CabinetType) => string;
  getCabinetStatusLabel: (status: CabinetStatus) => string;
};

const RightPanel = ({
  uiText,
  className,
  getCabinetTypeLabel,
  getCabinetStatusLabel,
}: RightPanelProps) => (
  <div className={cn("p-4 overflow-y-auto", className)}>
    <h3 className="mb-3 font-semibold">{uiText.reagentsStorageTitle}</h3>
    <CameraPreviewCard className="mb-3" />
    <div className="space-y-3">
      {cabinetData.map((cabinet) => (
        <Card
          key={cabinet.id}
          className={
            cabinet.status === "warning"
              ? "border-warning/50 bg-warning/5"
              : "border-border/50"
          }
        >
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div>
                <div className="font-bold">{cabinet.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getCabinetTypeLabel(cabinet.type)}
                </div>
              </div>
              <Badge
                variant={cabinet.status === "warning" ? "outline" : "secondary"}
              >
                {getCabinetStatusLabel(cabinet.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {uiText.reagentsStorageUsage}
                </span>
                <span className="font-medium text-xs">
                  {cabinet.count}/{cabinet.max}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${cabinet.count / cabinet.max > 0.8 ? "bg-warning" : "bg-primary"}`}
                  style={{
                    width: `${(cabinet.count / cabinet.max) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Thermometer className="size-3" />
                {uiText.reagentsStorageTemp}
              </span>
              <span className="font-medium">{cabinet.temp}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Droplets className="size-3" />
                {uiText.reagentsStorageHumidity}
              </span>
              <span className="font-medium">{cabinet.humidity}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

interface ReagentsViewProps {
  language: string;
}

export function ReagentsView({ language }: ReagentsViewProps) {
  const isMobile = useIsMobile();
  const uiText = getUiText(language);
  const {
    reagents,
    disposed,
    disposeReagent,
    addReagent,
    restoreReagent,
    deletePermanently,
    clearDisposed,
    updateReagent,
  } = useReagentsData([], [], [], language);
  const [activeTab, setActiveTab] = useState("inventory");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<any>(null);

  const [showAddError, setShowAddError] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    formula: "",
    capacity: "",
    density: "",
    mass: "",
    location: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (showAddError) setShowAddError(false);
  };

  const handleEditOpen = (r: any) => {
    setSelectedReagent(r);
    setFormData({
      name: r.name,
      formula: r.formula,
      capacity: r.currentVolume,
      density: r.density,
      mass: r.mass,
      location: r.location,
      purchaseDate: r.purchaseDate,
    });
    setEditDialogOpen(true);
  };

  const handleAddReagent = async () => {
    const isFormIncomplete =
      !formData.name ||
      !formData.formula ||
      !formData.capacity ||
      !formData.density ||
      !formData.mass ||
      !formData.location;

    if (isFormIncomplete) {
      setShowAddError(true);
      return;
    }

    await addReagent({
      reagent_name: formData.name,
      formula: formData.formula,
      current_volume: parseFloat(formData.capacity),
      total_capacity: parseFloat(formData.capacity),
      density: parseFloat(formData.density),
      mass: parseFloat(formData.mass),
      location: formData.location,
      purchase_date: formData.purchaseDate,
    });

    setAddDialogOpen(false);
    setShowAddError(false);
    setFormData({
      name: "",
      formula: "",
      capacity: "",
      density: "",
      mass: "",
      location: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
  };

  const getCabinetTypeLabel = (type: CabinetType) => {
    switch (type) {
      case "general":
        return uiText.reagentsStorageTypeGeneral;
      case "cold":
        return uiText.reagentsStorageTypeCold;
      case "hazard":
        return uiText.reagentsStorageTypeHazard;
      default:
        return type;
    }
  };

  const getCabinetStatusLabel = (status: CabinetStatus) => {
    switch (status) {
      case "normal":
        return uiText.reagentsStorageStatusNormal;
      case "warning":
        return uiText.reagentsStorageStatusWarning;
      default:
        return status;
    }
  };

  // 왼쪽 패널 (재고 목록) 컴포넌트
  const LeftPanel = () => (
    <div className="flex h-full min-h-0 flex-1 min-w-0">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full w-full min-h-0 flex-col"
      >
        <div className="shrink-0 border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="inventory">
              {uiText.reagentsTabInventory}
            </TabsTrigger>
            <TabsTrigger value="disposed">
              {uiText.reagentsTabDisposed}
            </TabsTrigger>
          </TabsList>
          {activeTab === "inventory" ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setAddDialogOpen(true);
                setShowAddError(false);
              }}
            >
              <Plus className="size-3.5" /> {uiText.reagentsAddButton}
            </Button>
          ) : (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="destructive" className="gap-1.5">
                  <Trash2 className="size-3.5" />{" "}
                  {uiText.reagentsClearDisposedButton}
                </Button>
              }
              title={uiText.reagentsClearDisposedTitle}
              description={uiText.reagentsClearDisposedDescription}
              confirmText={uiText.reagentsClearDisposedConfirm}
              cancelText={uiText.actionCancel}
              onConfirm={clearDisposed}
              variant="destructive"
            />
          )}
        </div>

        <TabsContent
          value="inventory"
          className="mt-0 min-h-0 flex-1 overflow-y-auto"
        >
          {isMobile ? (
            <div className="space-y-3 px-3 py-4">
              {reagents.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {/* 모바일 뷰에 HazardTooltip 적용 */}
                      <h4 className="font-semibold text-sm flex items-center">
                        {r.name}
                        <HazardTooltip chemName={r.name} />
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {r.formula}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditOpen(r)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        }
                        title={uiText.reagentsDisposeTitle}
                        description={uiText.reagentsDisposeDescription.replace(
                          "{name}",
                          r.name,
                        )}
                        confirmText={uiText.reagentsDisposeConfirm}
                        cancelText={uiText.actionCancel}
                        onConfirm={() => disposeReagent(r.id)}
                        variant="destructive"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTablePurchaseDate}:{" "}
                      </span>
                      <span>{r.purchaseDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTableOpenDate}:{" "}
                      </span>
                      <span>{r.openDate || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTableCurrentVolume}:{" "}
                      </span>
                      <span>{r.currentVolume}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTableDensity}:{" "}
                      </span>
                      <span>{r.density}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTableMass}:{" "}
                      </span>
                      <span>{r.mass}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsTablePurity}:{" "}
                      </span>
                      <span>{r.purity}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="w-full min-w-[900px] text-sm lg:text-base">
              <TableHeader>
                <TableRow className="">
                  <TableHead>{uiText.reagentsTableName}</TableHead>
                  <TableHead>{uiText.reagentsTableFormula}</TableHead>
                  <TableHead>{uiText.reagentsTablePurchaseDate}</TableHead>
                  <TableHead>{uiText.reagentsTableOpenDate}</TableHead>
                  <TableHead>{uiText.reagentsTableCurrentVolume}</TableHead>
                  <TableHead>{uiText.reagentsTableDensity}</TableHead>
                  <TableHead>{uiText.reagentsTableMass}</TableHead>
                  <TableHead>{uiText.reagentsTablePurity}</TableHead>
                  <TableHead className="text-right pr-1">
                    {uiText.reagentsTableActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reagents.map((r) => (
                  <TableRow key={r.id} className="hover:bg-transparent">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {/* PC 테이블 뷰에 HazardTooltip 적용 */}
                        <HazardTooltip chemName={r.name} />
                      </div>
                    </TableCell>
                    <TableCell>{r.formula}</TableCell>
                    <TableCell>{r.purchaseDate}</TableCell>
                    <TableCell>{r.openDate || "-"}</TableCell>
                    <TableCell>{r.currentVolume}</TableCell>
                    <TableCell>{r.density}</TableCell>
                    <TableCell>{r.mass}</TableCell>
                    <TableCell>{r.purity}</TableCell>
                    <TableCell className="text-right pr-1">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(r)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                          title={uiText.reagentsDisposeTitle}
                          description={uiText.reagentsDisposeDescription.replace(
                            "{name}",
                            r.name,
                          )}
                          confirmText={uiText.reagentsDisposeConfirm}
                          cancelText={uiText.actionCancel}
                          onConfirm={() => disposeReagent(r.id)}
                          variant="destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="disposed"
          className="mt-0 min-h-0 flex-1 overflow-y-auto"
        >
          {isMobile ? (
            <div className="space-y-3 px-3 py-4">
              {disposed.map((item) => (
                <Card key={item.id} className="w-full p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.formula}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-success"
                        onClick={() => restoreReagent(item.id)}
                      >
                        <Archive className="size-4" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        }
                        title={uiText.reagentsDeleteTitle}
                        description={uiText.reagentsDeleteDescription.replace(
                          "{name}",
                          item.name,
                        )}
                        confirmText={uiText.reagentsDeleteConfirm}
                        cancelText={uiText.actionCancel}
                        onConfirm={() => deletePermanently(item.id)}
                        variant="destructive"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsDisposedTableDate}:{" "}
                      </span>
                      <span>{item.disposalDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {uiText.reagentsDisposedTableBy}:{" "}
                      </span>
                      <span>{item.disposedBy}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="w-full min-w-[600px] text-sm lg:text-base">
              <TableHeader>
                <TableRow className="">
                  <TableHead>{uiText.reagentsDisposedTableName}</TableHead>
                  <TableHead>{uiText.reagentsDisposedTableFormula}</TableHead>
                  <TableHead>{uiText.reagentsDisposedTableDate}</TableHead>
                  <TableHead>{uiText.reagentsDisposedTableBy}</TableHead>
                  <TableHead className="text-right pr-1">
                    {uiText.reagentsDisposedTableActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disposed.map((item) => (
                  <TableRow key={item.id} className="hover:bg-transparent">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.formula}</TableCell>
                    <TableCell>{item.disposalDate}</TableCell>
                    <TableCell>{item.disposedBy}</TableCell>
                    <TableCell className="text-right pr-1">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success"
                          onClick={() => restoreReagent(item.id)}
                        >
                          <Archive className="size-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          }
                          title={uiText.reagentsDeleteTitle}
                          description={uiText.reagentsDeleteDescription.replace(
                            "{name}",
                            item.name,
                          )}
                          confirmText={uiText.reagentsDeleteConfirm}
                          cancelText={uiText.actionCancel}
                          onConfirm={() => deletePermanently(item.id)}
                          variant="destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // 오른쪽 패널 (보관함 현황) 컴포넌트
  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* 데스크톱: 리사이즈 가능한 패널 */}
        <div className="hidden lg:flex min-h-0 flex-1">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={70} minSize={40}>
              <LeftPanel />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <RightPanel
                className="h-full border-l border-border"
                uiText={uiText}
                getCabinetTypeLabel={getCabinetTypeLabel}
                getCabinetStatusLabel={getCabinetStatusLabel}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* 모바일: 기존 세로 스택 레이아웃 */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden overflow-hidden">
          <LeftPanel />
          <RightPanel
            className="w-full shrink-0 border-t border-border max-h-[40vh]"
            uiText={uiText}
            getCabinetTypeLabel={getCabinetTypeLabel}
            getCabinetStatusLabel={getCabinetStatusLabel}
          />
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{uiText.reagentsAddDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelName}</Label>
                  <Input
                    name="name"
                    placeholder="예: 황산"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.name &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelFormula}</Label>
                  <Input
                    name="formula"
                    placeholder="예: H₂SO₄"
                    value={formData.formula}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.formula &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelCapacity}</Label>
                  <Input
                    name="capacity"
                    type="number"
                    placeholder="500"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.capacity &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelDensity}</Label>
                  <Input
                    name="density"
                    type="number"
                    step="0.001"
                    placeholder="1.84"
                    value={formData.density}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.density &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelMass}</Label>
                  <Input
                    name="mass"
                    type="number"
                    step="0.01"
                    placeholder="920"
                    value={formData.mass}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.mass &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelLocation}</Label>
                  <Input
                    name="location"
                    placeholder="예: A-01"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={cn(
                      showAddError &&
                        !formData.location &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelPurchaseDate}</Label>
                  <Input
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex w-full items-center justify-between">
                <div>
                  {showAddError && (
                    <p className="text-sm font-medium text-destructive">
                      입력되지 않은 값이 있습니다.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddDialogOpen(false);
                      setShowAddError(false);
                    }}
                  >
                    {uiText.actionCancel}
                  </Button>
                  <Button onClick={handleAddReagent}>{uiText.actionAdd}</Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{uiText.reagentsEditDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelName}</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelFormula}</Label>
                  <Input
                    name="formula"
                    value={formData.formula}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelCapacity}</Label>
                  <Input
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelDensity}</Label>
                  <Input
                    name="density"
                    type="number"
                    step="0.001"
                    value={formData.density}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelMass}</Label>
                  <Input
                    name="mass"
                    type="number"
                    step="0.01"
                    value={formData.mass}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelLocation}</Label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{uiText.reagentsLabelPurchaseDate}</Label>
                  <Input
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {uiText.actionCancel}
              </Button>
              <Button
                onClick={async () => {
                  await updateReagent(selectedReagent.id, {
                    reagent_name: formData.name,
                    formula: formData.formula,
                    current_volume: parseFloat(formData.capacity),
                    density: parseFloat(formData.density),
                    mass: parseFloat(formData.mass),
                    location: formData.location,
                    purchase_date: formData.purchaseDate,
                  });
                  setEditDialogOpen(false);
                }}
              >
                {uiText.actionSave}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
