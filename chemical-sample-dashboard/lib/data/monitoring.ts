import { fetchJson } from "@/lib/api"
import type { MonitoringOverviewResponse } from "@/lib/types"

export async function fetchMonitoringOverview() {
  return fetchJson<MonitoringOverviewResponse>("/api/monitoring/overview")
}
