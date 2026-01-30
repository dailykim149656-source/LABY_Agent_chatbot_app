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
    purchaseDate: new Date().toISOString().split("T")[0],
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

        {/* 캐비닛 관리 사이드바 */}
        <div className="w-72 shrink-0 border-l border-border p-4 overflow-y-auto">
          <h3 className="mb-3 font-semibold">보관 환경 모니터링</h3>
          <div className="space-y-3">
            {[
              {
                id: 1,
                name: "A-01",
                type: "일반",
                count: 12,
                max: 20,
                status: "정상",
                temp: "22°C",
                humidity: "45%",
              },
              {
                id: 2,
                name: "A-02",
                type: "일반",
                count: 18,
                max: 20,
                status: "주의",
                temp: "23°C",
                humidity: "48%",
              },
              {
                id: 3,
                name: "B-01",
                type: "냉장",
                count: 8,
                max: 15,
                status: "정상",
                temp: "4°C",
                humidity: "60%",
              },
              {
                id: 4,
                name: "B-02",
                type: "냉장",
                count: 14,
                max: 15,
                status: "주의",
                temp: "5°C",
                humidity: "62%",
              },
              {
                id: 5,
                name: "C-01",
                type: "위험물",
                count: 5,
                max: 10,
                status: "정상",
                temp: "20°C",
                humidity: "40%",
              },
              {
                id: 6,
                name: "C-02",
                type: "위험물",
                count: 3,
                max: 10,
                status: "정상",
                temp: "21°C",
                humidity: "42%",
              },
            ].map((cabinet) => (
              <Card
                key={cabinet.id}
                className={
                  cabinet.status === "주의"
                    ? "border-warning/50 bg-warning/5"
                    : "border-border/50"
                }
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-bold">{cabinet.name}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {cabinet.type}
                      </div>
                    </div>
                    <Badge
                      variant={
                        cabinet.status === "주의" ? "outline" : "secondary"
                      }
                    >
                      {cabinet.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {/* 수용률 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">수용률</span>
                      <span className="font-medium text-xs">
                        {cabinet.count}/{cabinet.max}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          cabinet.count / cabinet.max > 0.8
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${(cabinet.count / cabinet.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 환경 정보 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Thermometer className="size-3" />
                      온도
                    </span>
                    <span className="font-medium">{cabinet.temp}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Droplets className="size-3" />
                      습도
                    </span>
                    <span className="font-medium">{cabinet.humidity}</span>
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
