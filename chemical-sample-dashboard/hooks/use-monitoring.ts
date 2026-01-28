import { useEffect, useState } from "react"

import { USE_MOCKS } from "@/lib/config"
import { fetchMonitoringOverview } from "@/lib/data/monitoring"
import type { MonitoringOverviewResponse } from "@/lib/types"

export function useMonitoringOverview() {
  const [overview, setOverview] = useState<MonitoringOverviewResponse | null>(null)

  useEffect(() => {
    if (USE_MOCKS) return

    const load = async () => {
      try {
        const data = await fetchMonitoringOverview()
        setOverview(data)
      } catch {
        // ignore
      }
    }

    load()
  }, [])

  return overview
}
