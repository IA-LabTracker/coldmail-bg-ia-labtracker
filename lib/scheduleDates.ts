export function parseScheduleDateLocal(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Date-only strings like "2026-03-10" should be treated as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const local = new Date(`${dateStr}T00:00:00`);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatScheduleDateLocal(
  dateStr: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const parsed = parseScheduleDateLocal(dateStr);
  if (!parsed) return "-";
  return parsed.toLocaleDateString(locale, options);
}
