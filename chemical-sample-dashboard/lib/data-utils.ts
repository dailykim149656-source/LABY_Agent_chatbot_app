/**
 * Data utility functions for common data transformations
 */

/**
 * Select i18n value if available, otherwise fallback to original
 */
export function pickI18n(
  i18nValue?: string | null,
  fallback?: string | null
): string {
  const trimmed = i18nValue?.trim()
  if (trimmed) return trimmed
  return fallback ?? ""
}

/**
 * Format density value with unit
 */
export function formatDensity(value?: number | null, emptyValue: string = ""): string {
  if (value === undefined || value === null) return emptyValue
  return `${value} g/cm³`
}

/**
 * Format mass value with unit
 */
export function formatMass(value?: number | null, emptyValue: string = ""): string {
  if (value === undefined || value === null) return emptyValue
  return `${value}g`
}

/**
 * Format volume value with unit
 */
export function formatVolume(value?: number | null, unit: string = "ml", emptyValue: string = "-"): string {
  if (value === undefined || value === null) return emptyValue
  return `${value}${unit}`
}

/**
 * Format percent value
 */
export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null) return "-"
  return `${value}%`
}

/**
 * Format date string (extract date part from ISO string)
 */
export function formatDate(value?: string | null): string {
  if (!value) return "-"
  return value.split("T")[0]
}

/**
 * Format timestamp string for display
 */
export function formatTimestamp(value?: string | null): string {
  if (!value) return "-"
  return String(value)
}

/**
 * Build i18n query parameters
 */
export function buildI18nQuery(
  language: string,
  baseParams?: Record<string, string>
): string {
  if (language === "KR") {
    if (!baseParams || Object.keys(baseParams).length === 0) return ""
    return `?${new URLSearchParams(baseParams).toString()}`
  }

  const params = new URLSearchParams(baseParams)
  params.set("lang", language)
  params.set("includeI18n", "1")
  return `?${params.toString()}`
}

/**
 * Safe string conversion with fallback
 */
export function safeString(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback
  return String(value)
}

/**
 * Safe number conversion with fallback
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

/**
 * Build API query string with optional i18n and pagination parameters
 */
export function buildApiQuery(options: {
  limit?: number
  cursor?: string | number
  lang?: string
  includeI18n?: boolean
  extra?: Record<string, string>
}): string {
  const params = new URLSearchParams()

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit))
  }
  if (options.cursor !== undefined) {
    params.set("cursor", String(options.cursor))
  }
  if (options.lang) {
    params.set("lang", options.lang)
  }
  if (options.includeI18n) {
    params.set("includeI18n", "1")
  }
  if (options.extra) {
    for (const [key, value] of Object.entries(options.extra)) {
      params.set(key, value)
    }
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}
