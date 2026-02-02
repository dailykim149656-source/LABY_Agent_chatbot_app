export function buildI18nQuery(lang?: string, includeI18n?: boolean): string {
  const params: Record<string, any> = {};
  if (lang) params.lang = lang;
  if (includeI18n !== undefined) params.includeI18n = includeI18n;
  return buildApiQuery(params);
}

export function buildApiQuery(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);

  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}

export function pickI18n(
  i18n: string | null | undefined,
  fallback: string | null | undefined,
): string {
  return i18n || fallback || "";
}

export function formatDensity(density: number | undefined): string {
  if (density === undefined) return "N/A";
  return `${density} g/cm³`;
}

export function formatMass(mass: number | undefined): string {
  if (mass === undefined) return "N/A";
  return `${mass} g`;
}
