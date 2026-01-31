"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Archive,
  Thermometer,
  Droplets,
  Pencil,
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
import { getUiText } from "@/lib/ui-text";

type CabinetType = "general" | "cold" | "hazard";
type CabinetStatus = "normal" | "warning";

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
  { id: 1, name: "A-01", type: "general", count: 12, max: 20, status: "normal", temp: "22°C", humidity: "45%" },
  { id: 2, name: "A-02", type: "general", count: 18, max: 20, status: "warning", temp: "23°C", humidity: "48%" },
  { id: 3, name: "B-01", type: "cold", count: 8, max: 15, status: "normal", temp: "4°C", humidity: "60%" },
  { id: 4, name: "B-02", type: "cold", count: 14, max: 15, status: "warning", temp: "5°C", humidity: "62%" },
  { id: 5, name: "C-01", type: "hazard", count: 5, max: 10, status: "normal", temp: "20°C", humidity: "40%" },
  { id: 6, name: "C-02", type: "hazard", count: 3, max: 10, status: "normal", temp: "21°C", humidity: "42%" },
];

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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <div className="shrink-0 border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <TabsList className="flex flex-wrap">
                <TabsTrigger value="inventory">{uiText.reagentsTabInventory}</TabsTrigger>
                <TabsTrigger value="disposed">{uiText.reagentsTabDisposed}</TabsTrigger>
              </TabsList>
              {activeTab === "inventory" ? (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="size-3.5" /> {uiText.reagentsAddButton}
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1.5">
                      <Trash2 className="size-3.5" /> {uiText.reagentsClearDisposedButton}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{uiText.reagentsClearDisposedTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {uiText.reagentsClearDisposedDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={clearDisposed}>
                        {uiText.reagentsClearDisposedConfirm}
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
              {isMobile ? (
                <div className="space-y-3 p-4">
                  {reagents.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{r.name}</h4>
                          <p className="text-xs text-muted-foreground">{r.formula}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditOpen(r)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{uiText.reagentsDisposeTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {uiText.reagentsDisposeDescription.replace("{name}", r.name)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => disposeReagent(r.id)}>
                                  {uiText.reagentsDisposeConfirm}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTablePurchaseDate}: </span>
                          <span>{r.purchaseDate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTableOpenDate}: </span>
                          <span>{r.openDate || "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTableCurrentVolume}: </span>
                          <span>{r.currentVolume}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTableDensity}: </span>
                          <span>{r.density}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTableMass}: </span>
                          <span>{r.mass}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsTablePurity}: </span>
                          <span>{r.purity}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>{uiText.reagentsTableName}</TableHead>
                        <TableHead>{uiText.reagentsTableFormula}</TableHead>
                        <TableHead>{uiText.reagentsTablePurchaseDate}</TableHead>
                        <TableHead>{uiText.reagentsTableOpenDate}</TableHead>
                        <TableHead>{uiText.reagentsTableCurrentVolume}</TableHead>
                        <TableHead>{uiText.reagentsTableDensity}</TableHead>
                        <TableHead>{uiText.reagentsTableMass}</TableHead>
                        <TableHead>{uiText.reagentsTablePurity}</TableHead>
                        <TableHead className="text-right">{uiText.reagentsTableActions}</TableHead>
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
                                onClick={() => handleEditOpen(r)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{uiText.reagentsDisposeTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {uiText.reagentsDisposeDescription.replace("{name}", r.name)}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => disposeReagent(r.id)}>
                                      {uiText.reagentsDisposeConfirm}
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
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="disposed"
              className="mt-0 flex-1 overflow-y-auto"
            >
              {isMobile ? (
                <div className="space-y-3 p-4">
                  {disposed.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.formula}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => restoreReagent(item.id)}
                          >
                            <Archive className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{uiText.reagentsDeleteTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {uiText.reagentsDeleteDescription.replace("{name}", item.name)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePermanently(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {uiText.reagentsDeleteConfirm}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsDisposedTableDate}: </span>
                          <span>{item.disposalDate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{uiText.reagentsDisposedTableBy}: </span>
                          <span>{item.disposedBy}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>{uiText.reagentsDisposedTableName}</TableHead>
                        <TableHead>{uiText.reagentsDisposedTableFormula}</TableHead>
                        <TableHead>{uiText.reagentsDisposedTableDate}</TableHead>
                        <TableHead>{uiText.reagentsDisposedTableBy}</TableHead>
                        <TableHead className="text-right">{uiText.reagentsDisposedTableActions}</TableHead>
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
                                className="text-green-600"
                                onClick={() => restoreReagent(item.id)}
                              >
                                <Archive className="size-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{uiText.reagentsDeleteTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {uiText.reagentsDeleteDescription.replace("{name}", item.name)}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{uiText.actionCancel}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePermanently(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {uiText.reagentsDeleteConfirm}
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
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full shrink-0 border-t border-border p-4 overflow-y-auto lg:w-72 lg:border-l lg:border-t-0">
          <h3 className="mb-3 font-semibold">{uiText.reagentsStorageTitle}</h3>
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
                />
              </div>
              <div className="grid gap-2">
                <Label>{uiText.reagentsLabelFormula}</Label>
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
                <Label>{uiText.reagentsLabelCapacity}</Label>
                <Input
                  name="capacity"
                  type="number"
                  placeholder="500"
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
                  placeholder="1.84"
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
                  placeholder="920"
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
                  placeholder="예: A-01"
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
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {uiText.actionCancel}
            </Button>
            <Button onClick={handleAddReagent}>{uiText.actionAdd}</Button>
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
            <div className="grid gap-2">
              <Label>{uiText.reagentsLabelLocation}</Label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
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
  );
}
