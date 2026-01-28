import type { Quantity } from "@/lib/types"

export function formatQuantity(quantity?: Quantity | null, fallback = "-") {
  if (!quantity || quantity.value === undefined || quantity.value === null) {
    return fallback
  }
  const unit = quantity.unit ?? ""
  return `${quantity.value}${unit}`
}

export function formatDate(value?: string | null) {
  if (!value) return ""
  if (typeof value !== "string") return String(value)
  return value.includes("T") ? value.split("T")[0] : value
}

export function formatPercent(value?: number | null) {
  if (value === undefined || value === null) return ""
  return `${value}%`
}
