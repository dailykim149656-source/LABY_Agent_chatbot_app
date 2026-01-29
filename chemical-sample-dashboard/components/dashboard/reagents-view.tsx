"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Archive,
  CheckCircle,
  Thermometer,
  Droplets,
  Pencil,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useReagentsData } from "@/hooks/use-reagents";

interface ReagentItem {
  id: string;
  name: string;
  formula: string;
  purchaseDate: string;
  openDate: string | null;
  currentVolume: string;
  purity: string;
  location: string;
  status: "정상" | "부족" | "만료임박";
}

interface DisposedItem {
  id: string;
  name: string;
  formula: string;
  disposalDate: string;
  reason: string;
  disposedBy: string;
}

const initialReagents: ReagentItem[] = [
  {
    id: "H2SO4-001",
    name: "황산 #1",
    formula: "H₂SO₄",
    purchaseDate: "2025-12-15",
    openDate: "2026-01-10",
    currentVolume: "450ml",
    purity: "98%",
    location: "캐비닛 A-01",
    status: "정상",
  },
  {
    id: "NaOH-001",
    name: "수산화나트륨 #1",
    formula: "NaOH",
    purchaseDate: "2025-11-20",
    openDate: "2025-12-05",
    currentVolume: "80ml",
    purity: "99%",
    location: "캐비닛 A-02",
    status: "부족",
  },
  {
    id: "HCl-001",
    name: "염산 #1",
    formula: "HCl",
    purchaseDate: "2025-10-01",
    openDate: "2025-10-15",
    currentVolume: "200ml",
    purity: "37%",
    location: "캐비닛 B-01",
    status: "만료임박",
  },
  {
    id: "CH3COOH-001",
    name: "아세트산 #1",
    formula: "CH₃COOH",
    purchaseDate: "2026-01-05",
    openDate: null,
    currentVolume: "500ml",
    purity: "99.5%",
    location: "캐비닛 A-03",
    status: "정상",
  },
  {
    id: "H2SO4-002",
    name: "황산 #2",
    formula: "H₂SO₄",
    purchaseDate: "2026-01-20",
    openDate: null,
    currentVolume: "500ml",
    purity: "98%",
    location: "캐비닛 A-01",
    status: "정상",
  },
];

const initialDisposed: DisposedItem[] = [
  {
    id: "HNO3-001",
    name: "질산 #1",
    formula: "HNO₃",
    disposalDate: "2026-01-25",
    reason: "만료",
    disposedBy: "김박사",
  },
  {
    id: "NH3-001",
    name: "암모니아 #1",
    formula: "NH₃",
    disposalDate: "2026-01-20",
    reason: "오염",
    disposedBy: "이박사",
  },
];

const initialStorage = [
  { location: "캐비닛 A", temp: "22°C", humidity: "42%", status: "정상" },
  { location: "캐비닛 B", temp: "24°C", humidity: "48%", status: "주의" },
  { location: "냉장실", temp: "4°C", humidity: "55%", status: "정상" },
];


export function ReagentsView() {
  const {
    reagents,
    disposed,
    storageEnvironment,
    disposeReagent,
    addReagent,
    restoreReagent,
    deletePermanently,
    clearDisposed,
    updateReagent,
    isLoading,
  } = useReagentsData([], [], []);
  const [activeTab, setActiveTab] = useState("inventory");
  const [fallenAlert, setFallenAlert] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    formula: "",
    capacity: "",
    density: "",
    mass: "",
    location: "",
    purchaseDate: new Date().toISOString().split("T")[0], // 오늘 날짜 기본값
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    // 폼 초기화 시 오늘 날짜 유지
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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {fallenAlert && (
        <div className="shrink-0 border-b border-destructive/50 bg-destructive/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  시약병 전도 감지!
                </p>
                <p className="text-sm text-destructive/80">
                  캐비닛 B-01에서 시약병 전도가 감지되었습니다. 즉시 확인이
                  필요합니다.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setFallenAlert(false)}
              className="gap-1.5"
            >
              <CheckCircle className="size-3.5" /> 확인
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="inventory">시약 재고</TabsTrigger>
                <TabsTrigger value="disposed">폐기 목록</TabsTrigger>
              </TabsList>
              {activeTab === "inventory" ? (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="size-3.5" /> 시약 추가
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1.5">
                      <Trash2 className="size-3.5" /> 전체 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        모든 폐기 항목 영구 삭제
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        모든 폐기된 시약을 영구적으로 삭제하시겠습니까? 이
                        작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={clearDisposed}>
                        영구 삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <TabsContent
              value="inventory"
              className="mt-0 flex-1 overflow-y-auto"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>시약 이름</TableHead>
                    <TableHead>화학식</TableHead>
                    <TableHead>구매일</TableHead>
                    <TableHead>개봉일</TableHead>
                    <TableHead>현재 용량(ml)</TableHead>
                    <TableHead>밀도(g/cm³)</TableHead>
                    <TableHead>질량(g)</TableHead>
                    <TableHead>순도</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reagents.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.formula}</TableCell>
                      <TableCell>{r.purchaseDate}</TableCell>
                      <TableCell>{r.openDate || "-"}</TableCell>
                      <TableCell>{r.currentVolume}</TableCell>
                      <TableCell>{r.density}</TableCell>
                      <TableCell>{r.mass}</TableCell>
                      <TableCell>{r.purity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEditOpen(r)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
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
                                <AlertDialogTitle>시약 폐기</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {r.name}을 폐기하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => disposeReagent(r.id)}
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

            <TabsContent
              value="disposed"
              className="mt-0 flex-1 overflow-y-auto"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>시약명</TableHead>
                    <TableHead>화학식</TableHead>
                    <TableHead>폐기일</TableHead>
                    <TableHead>처리자</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposed.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.formula}</TableCell>
                      <TableCell>{item.disposalDate}</TableCell>
                      <TableCell>{item.disposedBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-green-600"
                            onClick={() => restoreReagent(item.id)}
                          >
                            <Archive className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-600"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>영구 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {item.name}을(를) 영구적으로 삭제하시겠습니까?
                                  이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePermanently(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  영구 삭제
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
          </Tabs>
        </div>

        {/* 보관 환경 모니터링 */}
        <div className="w-72 shrink-0 border-l border-border p-4 overflow-y-auto">
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
                    >
                      {env.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                  <div className="flex gap-4">
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

      {/* 시약 추가 다이얼로그 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>시약 추가</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>시약명</Label>
                <Input
                  name="name"
                  placeholder="예: 황산"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>화학식</Label>
                <Input
                  name="formula"
                  placeholder="예: H₂SO₄"
                  value={formData.formula}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>용량 (ml)</Label>
                <Input
                  name="capacity"
                  type="number"
                  placeholder="500"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>밀도 (g/cm³)</Label>
                <Input
                  name="density"
                  type="number"
                  step="0.001"
                  placeholder="1.84"
                  value={formData.density}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>질량 (g)</Label>
                <Input
                  name="mass"
                  type="number"
                  step="0.01"
                  placeholder="920"
                  value={formData.mass}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>보관 위치</Label>
                <Input
                  name="location"
                  placeholder="예: A-01"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>구매일</Label>
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddReagent}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>시약 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>시약명</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>화학식</Label>
                <Input
                  name="formula"
                  value={formData.formula}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>용량 (ml)</Label>
                <Input
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>밀도 (g/cm³)</Label>
                <Input
                  name="density"
                  type="number"
                  step="0.001"
                  value={formData.density}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>질량 (g)</Label>
                <Input
                  name="mass"
                  type="number"
                  step="0.01"
                  value={formData.mass}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>보관 위치</Label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
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
                });
                setEditDialogOpen(false);
              }}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}