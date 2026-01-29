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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
    storageEnvironment: storageItems,
    disposeReagent,
    addReagent,
  } = useReagentsData(initialReagents, initialDisposed, initialStorage);

  const [fallenAlert, setFallenAlert] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newFormula, setNewFormula] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [newDensity, setNewDensity] = useState("");
  const [newMass, setNewMass] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPurchaseDate, setNewPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleDispose = (id: string) => {
    disposeReagent(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "정상":
        return (
          <Badge className="bg-success text-success-foreground">정상</Badge>
        );
      case "부족":
        return (
          <Badge className="bg-warning text-warning-foreground">부족</Badge>
        );
      case "만료임박":
        return <Badge variant="destructive">만료임박</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
              <CheckCircle className="size-3.5" /> 확인 및 해결
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
                      <Plus className="size-3.5" /> 시약 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>새 시약 추가</DialogTitle>
                      <DialogDescription>
                        데이터베이스에 등록할 시약 정보를 입력하세요.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-name">시약 이름</Label>
                          <Input
                            id="reagent-name"
                            placeholder="예: 황산 #3"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-formula">화학식</Label>
                          <Input
                            id="reagent-formula"
                            placeholder="예: H2SO4"
                            value={newFormula}
                            onChange={(e) => setNewFormula(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-capacity">용량 (ml/g)</Label>
                          <Input
                            id="reagent-capacity"
                            type="number"
                            placeholder="500"
                            value={newCapacity}
                            onChange={(e) => setNewCapacity(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-density">밀도 (g/cm³)</Label>
                          <Input
                            id="reagent-density"
                            type="number"
                            step="0.01"
                            placeholder="1.84"
                            value={newDensity}
                            onChange={(e) => setNewDensity(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-mass">질량 (g)</Label>
                          <Input
                            id="reagent-mass"
                            type="number"
                            placeholder="920"
                            value={newMass}
                            onChange={(e) => setNewMass(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-location">보관 위치</Label>
                          <Input
                            id="reagent-location"
                            placeholder="예: 캐비닛 A-01"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="reagent-purchase">구매 일자</Label>
                          <Input
                            id="reagent-purchase"
                            type="date"
                            value={newPurchaseDate}
                            onChange={(e) => setNewPurchaseDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={async () => {
                          const payload = {
                            reagent_name: newName,
                            formula: newFormula,
                            purchase_date: newPurchaseDate,
                            current_volume: parseFloat(newCapacity) || 0,
                            total_capacity: parseFloat(newCapacity) || 0,
                            density: parseFloat(newDensity) || 0,
                            mass: parseFloat(newMass) || 0,
                            purity: 98.0,
                            location: newLocation,
                          };
                          await addReagent(payload);
                          setAddDialogOpen(false);
                        }}
                      >
                        추가
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent
              value="inventory"
              className="mt-0 flex-1 overflow-y-auto"
            >
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
                      <TableCell className="font-medium">
                        {reagent.name}
                      </TableCell>
                      <TableCell>{reagent.formula}</TableCell>
                      <TableCell>{reagent.purchaseDate}</TableCell>
                      <TableCell>{reagent.openDate || "-"}</TableCell>
                      <TableCell>{reagent.currentVolume}</TableCell>
                      <TableCell>{reagent.purity}</TableCell>
                      <TableCell>{reagent.location}</TableCell>
                      <TableCell>{getStatusBadge(reagent.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
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
                                <AlertDialogTitle>
                                  시약 폐기 확인
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {reagent.name}을(를) 폐기 목록으로
                                  이동하시겠습니까?
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

            <TabsContent
              value="disposed"
              className="mt-0 flex-1 overflow-y-auto"
            >
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

        <div className="w-72 shrink-0 border-l border-border overflow-y-auto p-4">
          <h3 className="mb-3 font-semibold">보관 환경 모니터링</h3>
          <div className="space-y-3">
            {storageItems.map((env) => (
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
  );
}