import { useEffect, useMemo, useState } from "react"

import { USE_MOCKS } from "@/lib/config"
import { formatPercent, formatQuantity } from "@/lib/format"
import { fetchExperiments, fetchExperimentDetail, addExperimentReagent, removeExperimentReagent, updateExperiment } from "@/lib/data/experiments"
import { fetchReagents } from "@/lib/data/reagents"
import type { ExperimentDetail, ExperimentSummary, ExperimentReagent as ApiExperimentReagent, ReagentItem as ApiReagentItem } from "@/lib/types"
import type { MasterReagent } from "@/lib/reagent-inventory"

export type ExperimentReagentUI = {
  id: string
  masterReagentId: string
  name: string
  formula: string
  dosage: string
  dosageUnit: string
  volume: string
  density: string
  mass: string
  purity: string
  location: string
}

export type ExperimentUI = {
  id: string
  title: string
  date: string
  status: string
  researcher: string
  reagents: ExperimentReagentUI[]
  memo: string
}

const formatDensity = (value?: number | null) =>
  value === undefined || value === null ? "" : `${value} g/cm3`

const formatMass = (value?: number | null) =>
  value === undefined || value === null ? "" : `${value}g`

const mapApiReagentToUI = (item: ApiExperimentReagent): ExperimentReagentUI => {
  return {
    id: String(item.id),
    masterReagentId: String(item.reagentId),
    name: item.name ?? "",
    formula: item.formula ?? "",
    dosage: item.dosage ? String(item.dosage.value ?? "") : "",
    dosageUnit: item.dosage?.unit ?? "",
    volume: "N/A",
    density: formatDensity(item.density ?? undefined),
    mass: formatMass(item.mass ?? undefined),
    purity: formatPercent(item.purity ?? undefined),
    location: item.location ?? "",
  }
}

const mapDetailToUI = (detail: ExperimentDetail): ExperimentUI => {
  return {
    id: detail.id,
    title: detail.title,
    date: detail.date ?? "",
    status: detail.status,
    researcher: detail.researcher ?? "",
    memo: detail.memo ?? "",
    reagents: detail.reagents.map(mapApiReagentToUI),
  }
}

const mapSummaryToUI = (summary: ExperimentSummary): ExperimentUI => {
  return {
    id: summary.id,
    title: summary.title,
    date: summary.date ?? "",
    status: summary.status,
    researcher: summary.researcher ?? "",
    memo: "",
    reagents: [],
  }
}

const mapCatalogItem = (item: ApiReagentItem): MasterReagent => {
  return {
    id: item.id,
    name: item.name ?? "",
    formula: item.formula ?? "",
    purchaseDate: item.purchaseDate ?? "",
    openDate: item.openDate ?? null,
    currentVolume: formatQuantity(item.currentVolume),
    originalVolume: formatQuantity(item.originalVolume),
    density: formatDensity(item.density ?? undefined),
    mass: formatMass(item.mass ?? undefined),
    purity: formatPercent(item.purity ?? undefined),
    location: item.location ?? "",
    status: (item.status ?? "normal") as MasterReagent["status"],
  }
}

export function useExperimentsData(
  fallbackExperiments: ExperimentUI[],
  fallbackCatalog: MasterReagent[]
) {
  const [experiments, setExperiments] = useState<ExperimentUI[]>(fallbackExperiments)
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentUI>(fallbackExperiments[0])
  const [memo, setMemo] = useState(fallbackExperiments[0]?.memo ?? "")
  const [catalog, setCatalog] = useState<MasterReagent[]>(fallbackCatalog)
  const [isLoading, setIsLoading] = useState(false)

  const usingMocks = USE_MOCKS

  useEffect(() => {
    if (usingMocks) return

    const load = async () => {
      setIsLoading(true)
      try {
        const [experimentsResponse, reagentsResponse] = await Promise.all([
          fetchExperiments(50),
          fetchReagents(200),
        ])

        const mapped = experimentsResponse.items.map(mapSummaryToUI)
        if (mapped.length > 0) {
          setExperiments(mapped)
          setSelectedExperiment(mapped[0])
          setMemo(mapped[0].memo ?? "")
        }

        if (reagentsResponse.items.length > 0) {
          setCatalog(reagentsResponse.items.map(mapCatalogItem))
        }
      } catch {
        setExperiments(fallbackExperiments)
        setCatalog(fallbackCatalog)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [usingMocks, fallbackExperiments, fallbackCatalog])

  useEffect(() => {
    if (usingMocks) return
    if (!selectedExperiment?.id) return

    const loadDetail = async () => {
      try {
        const detail = await fetchExperimentDetail(selectedExperiment.id)
        const mapped = mapDetailToUI(detail)
        setSelectedExperiment(mapped)
        setMemo(mapped.memo)
      } catch {
        // keep current state
      }
    }

    loadDetail()
  }, [usingMocks, selectedExperiment?.id])

  const selectExperiment = (experiment: ExperimentUI) => {
    setSelectedExperiment(experiment)
    setMemo(experiment.memo ?? "")
  }

  const addReagentToExperiment = async (
    selected: ExperimentUI,
    reagent: MasterReagent,
    dosageValue: string,
    dosageUnit: string
  ) => {
    if (!dosageValue) return

    if (usingMocks) {
      const newReagent: ExperimentReagentUI = {
        id: `R${Date.now()}`,
        masterReagentId: reagent.id,
        name: reagent.name,
        formula: reagent.formula,
        dosage: dosageValue,
        dosageUnit,
        volume: reagent.currentVolume,
        density: reagent.density,
        mass: reagent.mass,
        purity: reagent.purity,
        location: reagent.location,
      }

      const updated = {
        ...selected,
        reagents: [...selected.reagents, newReagent],
      }

      setSelectedExperiment(updated)
      setExperiments((prev) => prev.map((exp) => (exp.id === selected.id ? updated : exp)))
      return
    }

    try {
      const response = await addExperimentReagent(selected.id, {
        reagentId: reagent.id,
        dosage: { value: Number(dosageValue), unit: dosageUnit },
      })

      const mapped = {
        ...mapApiReagentToUI(response),
        volume: reagent.currentVolume,
      }
      const updated = {
        ...selected,
        reagents: [...selected.reagents, mapped],
      }

      setSelectedExperiment(updated)
      setExperiments((prev) => prev.map((exp) => (exp.id === selected.id ? updated : exp)))
    } catch {
      // ignore on failure
    }
  }

  const removeReagentFromExperiment = async (selected: ExperimentUI, reagentId: string) => {
    if (usingMocks) {
      const updated = {
        ...selected,
        reagents: selected.reagents.filter((r) => r.id !== reagentId),
      }
      setSelectedExperiment(updated)
      setExperiments((prev) => prev.map((exp) => (exp.id === selected.id ? updated : exp)))
      return
    }

    try {
      await removeExperimentReagent(selected.id, reagentId)
      const updated = {
        ...selected,
        reagents: selected.reagents.filter((r) => r.id !== reagentId),
      }
      setSelectedExperiment(updated)
      setExperiments((prev) => prev.map((exp) => (exp.id === selected.id ? updated : exp)))
    } catch {
      // ignore on failure
    }
  }

  const saveMemo = async () => {
    if (usingMocks) {
      const updated = { ...selectedExperiment, memo }
      setSelectedExperiment(updated)
      setExperiments((prev) => prev.map((exp) => (exp.id === updated.id ? updated : exp)))
      return
    }

    try {
      const updated = await updateExperiment(selectedExperiment.id, { memo })
      const mapped = mapDetailToUI(updated)
      setSelectedExperiment(mapped)
      setExperiments((prev) => prev.map((exp) => (exp.id === mapped.id ? mapped : exp)))
      setMemo(mapped.memo)
    } catch {
      // ignore on failure
    }
  }

  const availableReagents = useMemo(() => {
    if (!selectedExperiment) return []
    return catalog.filter(
      (mr) => !selectedExperiment.reagents.some((er) => er.masterReagentId === mr.id)
    )
  }, [catalog, selectedExperiment])

  return {
    experiments,
    selectedExperiment,
    selectExperiment,
    memo,
    setMemo,
    isLoading,
    usingMocks,
    availableReagents,
    addReagentToExperiment,
    removeReagentFromExperiment,
    saveMemo,
  }
}
