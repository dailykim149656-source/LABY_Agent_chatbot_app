import { useEffect, useState } from "react";

import { USE_MOCKS } from "@/lib/config";
import { formatDate, formatPercent, formatQuantity } from "@/lib/format";
import {
  disposeReagent as disposeReagentApi,
  fetchDisposals,
  fetchReagents,
  fetchStorageEnvironment,
} from "@/lib/data/reagents";
import type {
  ReagentItem as ApiReagentItem,
  ReagentDisposalResponse,
  StorageEnvironmentItem as ApiStorageEnvironmentItem,
} from "@/lib/types";

// --- UI 타입 정의 ---
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
  reason: string;
  disposedBy: string;
};

export type StorageUI = {
  location: string;
  temp: string;
  humidity: string;
  status: string;
};

// --- 매핑 함수 ---
const mapReagentItem = (
  item: ApiReagentItem,
  statusMap: Record<string, string | undefined>,
): ReagentUI => ({
  id: item.id,
  name: item.name ?? "",
  formula: item.formula ?? "",
  purchaseDate: formatDate(item.purchaseDate),
  openDate: item.openDate ? formatDate(item.openDate) : null,
  currentVolume: formatQuantity(item.currentVolume),
  purity: formatPercent(item.purity ?? undefined),
  location: item.location ?? "",
  status: statusMap[item.status ?? "normal"] ?? item.status ?? "normal",
});

const mapDisposalItem = (item: ReagentDisposalResponse): DisposalUI => ({
  id: item.id,
  name: item.name ?? "",
  formula: item.formula ?? "",
  disposalDate: formatDate(item.disposalDate),
  reason: item.reason ?? "",
  disposedBy: item.disposedBy ?? "",
});

const mapStorageItem = (
  item: ApiStorageEnvironmentItem,
  statusMap: Record<string, string | undefined>,
): StorageUI => ({
  location: item.location,
  temp: `${item.temp}°C`,
  humidity: `${item.humidity}%`,
  status: statusMap[item.status] ?? item.status,
});

// --- 메인 훅 ---
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

  const reagentStatusMap = {
    normal: fallbackReagents[0]?.status || "정상",
    low: fallbackReagents[1]?.status || "부족",
    expired: fallbackReagents[2]?.status || "만료임박",
  };

  const storageStatusMap = {
    normal: fallbackStorage[0]?.status || "정상",
    warning: fallbackStorage[1]?.status || "주의",
    critical: fallbackStorage[1]?.status || "위험",
  };

  // 데이터 로드 로직
  useEffect(() => {
    if (usingMocks) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [reagentsResponse, disposalsResponse, storageResponse] =
          await Promise.all([
            fetchReagents(200),
            fetchDisposals(200),
            fetchStorageEnvironment(),
          ]);

        if (reagentsResponse.items.length > 0) {
          setReagents(
            reagentsResponse.items.map((item) =>
              mapReagentItem(item, reagentStatusMap),
            ),
          );
        }
        if (disposalsResponse.items.length > 0) {
          setDisposed(disposalsResponse.items.map(mapDisposalItem));
        }
        if (storageResponse.items.length > 0) {
          setStorageEnvironment(
            storageResponse.items.map((item) =>
              mapStorageItem(item, storageStatusMap),
            ),
          );
        }
      } catch {
        setReagents(fallbackReagents);
        setDisposed(fallbackDisposed);
        setStorageEnvironment(fallbackStorage);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [usingMocks, fallbackReagents, fallbackDisposed, fallbackStorage]);

  // [추가됨] 시약 추가 기능
  const addReagent = async (payload: any) => {
    if (usingMocks) {
      // Mock 모드: 즉시 리스트에 추가
      const mockItem: ReagentUI = {
        id: `NEW-${Date.now()}`,
        name: payload.reagent_name,
        formula: payload.formula || "-",
        purchaseDate: payload.purchase_date,
        openDate: null,
        currentVolume: `${payload.current_volume}ml`,
        purity: `${payload.purity}%`,
        location: payload.location,
        status: "정상",
      };
      setReagents((prev) => [mockItem, ...prev]);
      return;
    }

    try {
      const response = await fetch("/api/reagents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("추가 실패");

      const newItem: ApiReagentItem = await response.json();
      const mapped = mapReagentItem(newItem, reagentStatusMap);

      // 상태 업데이트: 목록 맨 위에 추가
      setReagents((prev) => [mapped, ...prev]);
    } catch (error) {
      console.error("시약 추가 에러:", error);
      alert("시약을 추가하는 중 오류가 발생했습니다.");
    }
  };

  // 시약 폐기 기능
  const disposeReagent = async (reagentId: string) => {
    if (usingMocks) {
      const reagent = reagents.find((r) => r.id === reagentId);
      if (!reagent) return;

      setReagents((prev) => prev.filter((r) => r.id !== reagentId));
      setDisposed((prev) => [
        {
          id: reagent.id,
          name: reagent.name,
          formula: reagent.formula,
          disposalDate: formatDate(new Date().toISOString()),
          reason: "disposed",
          disposedBy: "admin",
        },
        ...prev,
      ]);
      return;
    }

    try {
      const response = await disposeReagentApi(reagentId, {
        reason: "disposed",
        disposedBy: "admin",
      });

      const mapped = mapDisposalItem(response);
      setReagents((prev) => prev.filter((r) => r.id !== reagentId));
      setDisposed((prev) => [mapped, ...prev]);
    } catch {
      // ignore on failure
    }
  };

  return {
    reagents,
    disposed,
    storageEnvironment,
    isLoading,
    usingMocks,
    disposeReagent,
    addReagent, // 리턴값에 추가
  };
}
