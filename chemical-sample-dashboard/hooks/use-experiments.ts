// hooks/use-experiments.ts
import { useEffect, useMemo, useCallback, useState } from "react";

import { USE_MOCKS } from "@/lib/config";
import { formatPercent, formatQuantity } from "@/lib/format";
import {
  fetchExperiments,
  fetchExperimentDetail,
  createExperiment as createExperimentApi,
  updateExperiment as updateExperimentApi,
  updateExperimentMemo,
  deleteExperiment as deleteExperimentApi,
  addExperimentReagent,
  removeExperimentReagent,
} from "@/lib/data/experiments";
import { fetchReagents } from "@/lib/data/reagents";
import { pickI18n, formatDensity, formatMass } from "@/lib/data-utils";
import type {
  ExperimentDetail,
  ExperimentSummary,
  ExperimentStatus,
  ExperimentReagent as ApiExperimentReagent,
  ReagentItem as ApiReagentItem,
} from "@/lib/types";
import type { MasterReagent } from "@/lib/reagent-inventory";

export type ExperimentReagentUI = {
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
};

export type ExperimentUI = {
  id: string;
  title: string;
  date: string;
  status: ExperimentStatus;
  researcher: string;
  reagents: ExperimentReagentUI[];
  memo: string;
};

// 매퍼 함수들
const mapApiReagentToUI = (item: ApiExperimentReagent): ExperimentReagentUI => {
  return {
    id: String(item.id),
    masterReagentId: String(item.reagentId),
    name: pickI18n(item.nameI18n, item.name),
    formula: item.formula ?? "",
    dosage: item.dosage ? String(item.dosage.value ?? "") : "",
    volume: "N/A",
    density: formatDensity(item.density ?? undefined),
    mass: formatMass(item.mass ?? undefined),
    purity: formatPercent(item.purity ?? undefined),
    location: pickI18n(item.locationI18n, item.location),
  };
};

const mapDetailToUI = (detail: ExperimentDetail): ExperimentUI => {
  return {
    id: detail.id,
    title: pickI18n(detail.titleI18n, detail.title),
    date: detail.date ?? "",
    status: detail.status,
    researcher: detail.researcher ?? "",
    memo: pickI18n(detail.memoI18n, detail.memo),
    reagents: detail.reagents.map(mapApiReagentToUI),
  };
};

const mapSummaryToUI = (summary: ExperimentSummary): ExperimentUI => {
  return {
    id: summary.id,
    title: pickI18n(summary.titleI18n, summary.title),
    date: summary.date ?? "",
    status: summary.status,
    researcher: summary.researcher ?? "",
    memo: "",
    reagents: [],
  };
};

const mapCatalogItem = (item: ApiReagentItem): MasterReagent => {
  return {
    id: item.id,
    name: pickI18n(item.nameI18n, item.name),
    formula: item.formula ?? "",
    purchaseDate: item.purchaseDate ?? "",
    openDate: item.openDate ?? null,
    currentVolume: formatQuantity(item.currentVolume),
    originalVolume: formatQuantity(item.originalVolume),
    density: formatDensity(item.density ?? undefined),
    mass: formatMass(item.mass ?? undefined),
    purity: formatPercent(item.purity ?? undefined),
    location: pickI18n(item.locationI18n, item.location),
    status: (item.status ?? "normal") as MasterReagent["status"],
  };
};

export function useExperimentsData(
  fallbackExperiments: ExperimentUI[],
  fallbackCatalog: MasterReagent[],
  language = "KR",
) {
  const [experiments, setExperiments] =
    useState<ExperimentUI[]>(fallbackExperiments);
  const [selectedExperiment, setSelectedExperiment] =
    useState<ExperimentUI | null>(null);
  const [memo, setMemo] = useState("");
  const [catalog, setCatalog] = useState<MasterReagent[]>(fallbackCatalog);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | null>(
    null,
  );

  const usingMocks = USE_MOCKS;
  const includeI18n = language !== "KR";

  // 실험 목록 로드 (useCallback으로 최적화하여 무한 트리거 방지)
  const load = useCallback(
    async (filter?: ExperimentStatus | null) => {
      if (usingMocks) return;

      setIsLoading(true);
      try {
        const [experimentsResponse, reagentsResponse] = await Promise.all([
          fetchExperiments(
            50,
            undefined,
            language,
            includeI18n,
            filter || undefined,
          ),
          fetchReagents(200, undefined, language, includeI18n),
        ]);

        const mapped = experimentsResponse.items.map(mapSummaryToUI);
        setExperiments(mapped);

        // ✅ [중요] 선택 고정 로직:
        // 이미 선택된 실험이 있다면, 새 목록에서도 해당 ID를 가진 실험이 있는지 확인하고 상태만 체크합니다.
        // 자동으로 첫 번째 항목을 선택하는 로직을 완전히 제거했습니다.
        if (selectedExperiment) {
          const stillExists = mapped.some(
            (exp) => exp.id === selectedExperiment.id,
          );
          if (!stillExists) {
            setSelectedExperiment(null);
            setMemo("");
          }
        }

        if (reagentsResponse.items.length > 0) {
          setCatalog(reagentsResponse.items.map(mapCatalogItem));
        }
      } catch (error) {
        console.error("실험 목록 로드 실패:", error);
        // ✅ [수정] 실패 시 fallbackExperiments로 덮어쓰지 않고 현재 리스트를 유지합니다. (무한 루프 방지)
      } finally {
        setIsLoading(false);
      }
    },
    [language, includeI18n, usingMocks, selectedExperiment],
  );

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter, load]);

  // 상세 정보 로드 (ID가 바뀌었을 때만 실행)
  useEffect(() => {
    if (usingMocks || !selectedExperiment?.id) return;

    // 이미 상세 정보(reagents)가 로드된 상태라면 중복 호출 방지
    if (selectedExperiment.reagents.length > 0) return;

    const loadDetail = async () => {
      try {
        const detail = await fetchExperimentDetail(
          selectedExperiment.id,
          language,
          includeI18n,
        );
        const mapped = mapDetailToUI(detail);

        // 데이터만 업데이트하고 객체 참조는 유지하여 불필요한 이펙트 발생 방지
        setSelectedExperiment((prev) => {
          if (prev?.id === mapped.id) return mapped;
          return prev;
        });
        setMemo(mapped.memo);
      } catch (error) {
        console.error("상세 정보 로드 실패:", error);
      }
    };

    loadDetail();
  }, [selectedExperiment?.id, language, includeI18n, usingMocks]);

  const selectExperiment = (experiment: ExperimentUI) => {
    setSelectedExperiment(experiment);
    setMemo(experiment.memo ?? "");
  };

  const createExperiment = async (title: string, researcher: string) => {
    if (usingMocks) {
      const newExp: ExperimentUI = {
        id: `EXP-${Date.now()}`,
        title,
        researcher,
        status: "진행중",
        date: new Date().toISOString().split("T")[0],
        reagents: [],
        memo: "",
      };
      setExperiments((prev) => [newExp, ...prev]);
      setSelectedExperiment(newExp);
      setMemo("");
      return;
    }

    try {
      const created = await createExperimentApi({ title, researcher });
      const mapped = mapDetailToUI(created);
      setExperiments((prev) => [mapped, ...prev]);
      setSelectedExperiment(mapped);
      setMemo(mapped.memo);
    } catch (error) {
      console.error("실험 생성 실패:", error);
    }
  };

  const updateExperiment = async (
    expId: string,
    title: string,
    status: ExperimentStatus,
  ) => {
    if (usingMocks) {
      const updatedList = experiments.map((exp) =>
        exp.id === expId ? { ...exp, title, status } : exp,
      );
      setExperiments(updatedList);
      const updatedExp = updatedList.find((exp) => exp.id === expId);
      if (updatedExp) setSelectedExperiment(updatedExp);
      return;
    }

    try {
      const updated = await updateExperimentApi(expId, { title, status });
      const mapped = mapDetailToUI(updated);
      setExperiments((prev) =>
        prev.map((exp) => (exp.id === expId ? mapped : exp)),
      );
      setSelectedExperiment(mapped);
    } catch (error) {
      console.error("실험 업데이트 실패:", error);
    }
  };

  const deleteExperiment = async (expId: string) => {
    if (usingMocks) {
      const filtered = experiments.filter((exp) => exp.id !== expId);
      setExperiments(filtered);
      if (selectedExperiment?.id === expId) {
        setSelectedExperiment(null);
        setMemo("");
      }
      return;
    }

    try {
      await deleteExperimentApi(expId);
      const filtered = experiments.filter((exp) => exp.id !== expId);
      setExperiments(filtered);
      if (selectedExperiment?.id === expId) {
        setSelectedExperiment(null);
        setMemo("");
      }
    } catch (error) {
      console.error("실험 삭제 실패:", error);
    }
  };

  const addReagentToExperiment = async (
    reagent: MasterReagent,
    dosageValue: string,
  ) => {
    if (!selectedExperiment || !dosageValue) return;

    try {
      if (usingMocks) {
        // Mock 로직 생략 없이 포함
        const newReagent: ExperimentReagentUI = {
          id: `R${Date.now()}`,
          masterReagentId: reagent.id,
          name: reagent.name,
          formula: reagent.formula,
          dosage: dosageValue,
          volume: reagent.currentVolume,
          density: reagent.density,
          mass: reagent.mass,
          purity: reagent.purity,
          location: reagent.location,
        };
        const updated = {
          ...selectedExperiment,
          reagents: [...selectedExperiment.reagents, newReagent],
        };
        setSelectedExperiment(updated);
        setExperiments((prev) =>
          prev.map((exp) => (exp.id === selectedExperiment.id ? updated : exp)),
        );
        return;
      }

      const response = await addExperimentReagent(selectedExperiment.id, {
        reagentId: reagent.id,
        dosage: { value: Number(dosageValue), unit: "ml" },
      });

      const mapped = {
        ...mapApiReagentToUI(response),
        volume: reagent.currentVolume,
      };
      const updated = {
        ...selectedExperiment,
        reagents: [...selectedExperiment.reagents, mapped],
      };

      setSelectedExperiment(updated);
      setExperiments((prev) =>
        prev.map((exp) => (exp.id === selectedExperiment.id ? updated : exp)),
      );
      await load(statusFilter);
    } catch (error) {
      console.error("시약 추가 실패:", error);
    }
  };

  const removeReagentFromExperiment = async (reagentId: string) => {
    if (!selectedExperiment) return;

    try {
      if (usingMocks) {
        const updated = {
          ...selectedExperiment,
          reagents: selectedExperiment.reagents.filter(
            (r) => r.id !== reagentId,
          ),
        };
        setSelectedExperiment(updated);
        setExperiments((prev) =>
          prev.map((exp) => (exp.id === selectedExperiment.id ? updated : exp)),
        );
        return;
      }

      await removeExperimentReagent(selectedExperiment.id, reagentId);
      const updated = {
        ...selectedExperiment,
        reagents: selectedExperiment.reagents.filter((r) => r.id !== reagentId),
      };
      setSelectedExperiment(updated);
      setExperiments((prev) =>
        prev.map((exp) => (exp.id === selectedExperiment.id ? updated : exp)),
      );
      await load(statusFilter);
    } catch (error) {
      console.error("시약 삭제 실패:", error);
    }
  };

  const saveMemo = async () => {
    if (!selectedExperiment) return;

    try {
      if (usingMocks) {
        const updated = { ...selectedExperiment, memo };
        setSelectedExperiment(updated);
        setExperiments((prev) =>
          prev.map((exp) => (exp.id === updated.id ? updated : exp)),
        );
        return;
      }

      const updated = await updateExperimentMemo(selectedExperiment.id, memo);
      const mapped = mapDetailToUI(updated);
      setSelectedExperiment(mapped);
      setExperiments((prev) =>
        prev.map((exp) => (exp.id === mapped.id ? mapped : exp)),
      );
      setMemo(mapped.memo);
    } catch (error) {
      console.error("메모 저장 실패:", error);
    }
  };

  const availableReagents = useMemo(() => {
    if (!selectedExperiment) return [];
    // ✅ 기존 필터링 로직을 제거하여 중복 등록 제한을 해제함
    return catalog;
  }, [catalog, selectedExperiment]);

  return {
    experiments,
    selectedExperiment,
    selectExperiment,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    memo,
    setMemo,
    isLoading,
    usingMocks,
    availableReagents,
    addReagentToExperiment,
    removeReagentFromExperiment,
    saveMemo,
    statusFilter,
    setStatusFilter,
  };
}
