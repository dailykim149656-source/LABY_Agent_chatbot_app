import { useEffect, useState } from "react";
import { USE_MOCKS } from "@/lib/config";
import { formatDate, formatPercent, formatQuantity } from "@/lib/format";
import {
  fetchDisposals,
  fetchReagents,
  fetchStorageEnvironment,
  createReagent,
  disposeReagent as disposeReagentApi,
} from "@/lib/data/reagents";
import type {
  ReagentItem as ApiReagentItem,
  ReagentDisposalResponse,
  StorageEnvironmentItem as ApiStorageEnvironmentItem,
} from "@/lib/types";

export type ReagentUI = {
  id: string;
  name: string;
  formula: string;
  purchaseDate: string;
  openDate: string | null;
  currentVolume: string;
  purity: string;
  location: string;
  status: string;
};
export type DisposalUI = {
  id: string;
  name: string;
  formula: string;
  disposalDate: string;
  remainingVolume: string;
  reason: string;
  disposedBy: string;
};
export type StorageUI = {
  location: string;
  temp: string;
  humidity: string;
  status: string;
};

const REAGENT_STATUS_MAP: Record<string, string> = {
  normal: "정상",
  low: "부족",
  expired: "만료임박",
  disposed: "폐기",
};
const STORAGE_STATUS_MAP: Record<string, string> = {
  normal: "정상",
  warning: "주의",
  critical: "위험",
};

const mapReagentItem = (item: ApiReagentItem): ReagentUI => ({
  id: item.id,
  name: (item as any).reagent_name ?? item.name ?? "",
  formula: item.formula ?? "",
  purchaseDate: formatDate(item.purchaseDate),
  openDate: item.openDate ? formatDate(item.openDate) : null,
  currentVolume: formatQuantity(item.currentVolume),
  purity: formatPercent(item.purity ?? undefined),
  location: item.location ?? "",
  status:
    REAGENT_STATUS_MAP[item.status ?? "normal"] ?? item.status ?? "normal",
});

// [중요] item.currentVolume 정보를 remainingVolume 문자열로 변환합니다.
const mapDisposalItem = (item: any): DisposalUI => ({
  id: item.id,
  name: item.reagent_name ?? item.name ?? "",
  formula: item.formula ?? "",
  disposalDate: formatDate(item.disposalDate),
  remainingVolume: formatQuantity(item.currentVolume),
  reason: item.reason ?? "",
  disposedBy: item.disposedBy ?? item.disposed_by ?? "",
});

export function useReagentsData(
  fallbackReagents: ReagentUI[],
  fallbackDisposed: DisposalUI[],
  fallbackStorage: StorageUI[],
) {
  const [reagents, setReagents] = useState<ReagentUI[]>(fallbackReagents);
  const [disposed, setDisposed] = useState<DisposalUI[]>(fallbackDisposed);
  const [storageEnvironment, setStorageEnvironment] =
    useState<StorageUI[]>(fallbackStorage);
  const [isLoading, setIsLoading] = useState(false);
  const usingMocks = USE_MOCKS;

  useEffect(() => {
    if (usingMocks) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [rRes, dRes, sRes] = await Promise.all([
          fetchReagents(200),
          fetchDisposals(200),
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
              status: STORAGE_STATUS_MAP[i.status] ?? i.status,
            })),
          );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [usingMocks]);

  const addReagent = async (payload: any) => {
    try {
      const newItem = await createReagent(payload);
      setReagents((prev) => [mapReagentItem(newItem), ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  const disposeReagent = async (reagentId: string) => {
    try {
      const res = await disposeReagentApi(reagentId, {
        reason: "사용 완료",
        disposedBy: "관리자",
      });
      setReagents((prev) => prev.filter((r) => r.id !== reagentId));
      setDisposed((prev) => [mapDisposalItem(res), ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    reagents,
    disposed,
    storageEnvironment,
    isLoading,
    disposeReagent,
    addReagent,
  };
}
