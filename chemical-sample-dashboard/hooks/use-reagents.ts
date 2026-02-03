"use client";

import { useEffect, useState } from "react";
import { USE_MOCKS } from "@/lib/config";
import { formatDate, formatPercent } from "@/lib/format";
import {
  fetchDisposals,
  fetchReagents,
  fetchStorageEnvironment,
  createReagent,
  disposeReagent as disposeReagentApi,
  restoreReagent as restoreApi,
  deleteReagentPermanently as deleteApi,
  clearAllDisposals as clearApi,
  updateReagent as updateApi,
} from "@/lib/data/reagents";
import type { ReagentItem as ApiReagentItem } from "@/lib/types";
import {
  type MasterReagent,
  masterReagentInventory,
} from "@/lib/reagent-inventory";

export type ReagentUI = {
  id: string;
  name: string;
  formula: string;
  purchaseDate: string;
  openDate: string | null;
  currentVolume: string;
  totalCapacity: string;
  purity: string;
  location: string;
  density: number;
  mass: number;
  status: string;
  hazardSummary?: string;
};

export type DisposalUI = {
  id: string;
  name: string;
  formula: string;
  disposalDate: string;
  disposedBy: string;
  reason: string;
};

export type StorageUI = {
  location: string;
  temp: string;
  humidity: string;
  status: string;
};

const mapReagentItem = (item: ApiReagentItem): ReagentUI => ({
  id: item.id,
  name: item.nameI18n ?? (item as any).reagent_name ?? item.name ?? "",
  formula: item.formula ?? "",
  purchaseDate: formatDate(item.purchaseDate),
  openDate: item.openDate ? formatDate(item.openDate) : null,
  currentVolume: String(item.currentVolume?.value ?? 0),
  totalCapacity: String((item as any).total_capacity?.value ?? 0),
  purity: formatPercent(item.purity ?? 0),
  location: item.locationI18n ?? item.location ?? "미지정",
  density: (item as any).density ?? 0,
  mass: (item as any).mass ?? 0,
  status: item.status ?? "normal",
  hazardSummary: (item as any).hazardSummary ?? "",
});

const mapDisposalItem = (item: any): DisposalUI => ({
  id: item.id,
  name: item.nameI18n ?? item.reagent_name ?? item.name ?? "",
  formula: item.formula ?? "",
  disposalDate: formatDate(item.disposalDate),
  disposedBy: item.disposedBy ?? "",
  reason: item.reasonI18n ?? item.reason ?? "",
});

const mapMasterToUI = (item: MasterReagent): ReagentUI => ({
  id: item.id,
  name: item.name,
  formula: item.formula,
  purchaseDate: item.purchaseDate,
  openDate: item.openDate,
  currentVolume: item.currentVolume,
  totalCapacity: item.originalVolume,
  purity: item.purity,
  location: item.location,
  density: parseFloat(item.density), // "1.84 g/cm³" -> 1.84
  mass: parseFloat(item.mass), // "920g" -> 920
  status: item.status === "정상" ? "normal" : "warning",
  hazardSummary: item.hazardSummary || "",
});

export function useReagentsData(
  fallbackReagents: ReagentUI[],
  fallbackDisposed: DisposalUI[],
  fallbackStorage: StorageUI[],
  language = "KR",
) {
  const [reagents, setReagents] = useState<ReagentUI[]>(
    masterReagentInventory.map(mapMasterToUI),
  );
  const [disposed, setDisposed] = useState<DisposalUI[]>(fallbackDisposed);
  const [storageEnvironment, setStorageEnvironment] =
    useState<StorageUI[]>(fallbackStorage);
  const [isLoading, setIsLoading] = useState(false);
  const includeI18n = language !== "KR";

  const load = async () => {
    // if (USE_MOCKS) return;

    return;

    setIsLoading(true);
    try {
      const [rRes, dRes, sRes] = await Promise.all([
        fetchReagents(200, undefined, language, includeI18n),
        fetchDisposals(200, undefined, language, includeI18n),
        fetchStorageEnvironment(),
      ]);
      if (rRes.items) setReagents(rRes.items.map(mapReagentItem));
      if (dRes.items) setDisposed(dRes.items.map(mapDisposalItem));
      if (sRes.items)
        setStorageEnvironment(
          sRes.items.map((i: any) => ({
            location: i.location,
            temp: `${i.temp}°C`,
            humidity: `${i.humidity}%`,
            status: i.status === "warning" ? "주의" : "정상",
          })),
        );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [language]);

  const restoreReagent = async (id: string) => {
    const res = await restoreApi(id);
    setDisposed((prev) => prev.filter((i) => i.id !== id));
    setReagents((prev) => [mapReagentItem(res), ...prev]);
  };

  const updateReagent = async (id: string, payload: any) => {
    const res = await updateApi(id, payload);
    setReagents((prev) =>
      prev.map((r) => (r.id === id ? mapReagentItem(res) : r)),
    );
  };

  const deletePermanently = async (id: string) => {
    await deleteApi(id);
    setDisposed((prev) => prev.filter((i) => i.id !== id));
  };

  const clearDisposed = async () => {
    await clearApi();
    setDisposed([]);
  };

  const addReagent = async (p: any) => {
    const newItem = await createReagent(p);
    setReagents((prev) => [mapReagentItem(newItem), ...prev]);
  };

  const disposeReagent = async (id: string) => {
    const res = await disposeReagentApi(id, {
      reason: "사용 완료",
      disposedBy: "관리자",
    });
    setReagents((prev) => prev.filter((r) => r.id !== id));
    setDisposed((prev) => [mapDisposalItem(res), ...prev]);
  };

  return {
    reagents,
    disposed,
    storageEnvironment,
    isLoading,
    disposeReagent,
    addReagent,
    restoreReagent,
    deletePermanently,
    clearDisposed,
    updateReagent,
  };
}
