import { useEffect, useState } from "react"

import { USE_MOCKS } from "@/lib/config"
import { formatDate, formatPercent, formatQuantity } from "@/lib/format"
import { disposeReagent as disposeReagentApi, fetchDisposals, fetchReagents, fetchStorageEnvironment } from "@/lib/data/reagents"
import type { ReagentItem as ApiReagentItem, ReagentDisposalResponse, StorageEnvironmentItem as ApiStorageEnvironmentItem } from "@/lib/types"

export type ReagentUI = {
  id: string
  name: string
  formula: string
  purchaseDate: string
  openDate: string | null
  currentVolume: string
  purity: string
  location: string
  status: string
}

export type DisposalUI = {
  id: string
  name: string
  formula: string
  disposalDate: string
  reason: string
  disposedBy: string
}

export type StorageUI = {
  location: string
  temp: string
  humidity: string
  status: string
}

const mapReagentItem = (
  item: ApiReagentItem,
  statusMap: Record<string, string | undefined>
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
})

const mapDisposalItem = (item: ReagentDisposalResponse): DisposalUI => ({
  id: item.id,
  name: item.name ?? "",
  formula: item.formula ?? "",
  disposalDate: formatDate(item.disposalDate),
  reason: item.reason ?? "",
  disposedBy: item.disposedBy ?? "",
})

const mapStorageItem = (
  item: ApiStorageEnvironmentItem,
  statusMap: Record<string, string | undefined>
): StorageUI => ({
  location: item.location,
  temp: `${item.temp}°C`,
  humidity: `${item.humidity}%`,
  status: statusMap[item.status] ?? item.status,
})

export function useReagentsData(
  fallbackReagents: ReagentUI[],
  fallbackDisposed: DisposalUI[],
  fallbackStorage: StorageUI[]
) {
  const [reagents, setReagents] = useState<ReagentUI[]>(fallbackReagents)
  const [disposed, setDisposed] = useState<DisposalUI[]>(fallbackDisposed)
  const [storageEnvironment, setStorageEnvironment] = useState<StorageUI[]>(fallbackStorage)
  const [isLoading, setIsLoading] = useState(false)

  const usingMocks = USE_MOCKS

  const reagentStatusMap = {
    normal: fallbackReagents[0]?.status,
    low: fallbackReagents[1]?.status,
    expired: fallbackReagents[2]?.status,
  }

  const storageStatusMap = {
    normal: fallbackStorage[0]?.status,
    warning: fallbackStorage[1]?.status,
    critical: fallbackStorage[1]?.status,
  }

  useEffect(() => {
    if (usingMocks) return

    const load = async () => {
      setIsLoading(true)
      try {
        const [reagentsResponse, disposalsResponse, storageResponse] = await Promise.all([
          fetchReagents(200),
          fetchDisposals(200),
          fetchStorageEnvironment(),
        ])

        if (reagentsResponse.items.length > 0) {
          setReagents(reagentsResponse.items.map((item) => mapReagentItem(item, reagentStatusMap)))
        }
        if (disposalsResponse.items.length > 0) {
          setDisposed(disposalsResponse.items.map(mapDisposalItem))
        }
        if (storageResponse.items.length > 0) {
          setStorageEnvironment(
            storageResponse.items.map((item) => mapStorageItem(item, storageStatusMap))
          )
        }
      } catch {
        setReagents(fallbackReagents)
        setDisposed(fallbackDisposed)
        setStorageEnvironment(fallbackStorage)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [usingMocks, fallbackReagents, fallbackDisposed, fallbackStorage])

  const disposeReagent = async (reagentId: string) => {
    if (usingMocks) {
      const reagent = reagents.find((r) => r.id === reagentId)
      if (!reagent) return

      setReagents((prev) => prev.filter((r) => r.id !== reagentId))
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
      ])
      return
    }

    try {
      const response = await disposeReagentApi(reagentId, {
        reason: "disposed",
        disposedBy: "admin",
      })

      const mapped = mapDisposalItem(response)
      setReagents((prev) => prev.filter((r) => r.id !== reagentId))
      setDisposed((prev) => [mapped, ...prev])
    } catch {
      // ignore on failure
    }
  }

  return {
    reagents,
    disposed,
    storageEnvironment,
    isLoading,
    usingMocks,
    disposeReagent,
  }
}
