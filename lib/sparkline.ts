import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";

export interface SparklinePoint {
  date: string;
  value: number;
}

/**
 * Generates sparkline data from an array of items with date fields.
 * Groups items by day over the last N days.
 */
export function generateSparkline<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  days: number = 14,
): SparklinePoint[] {
  const start = startOfDay(subDays(new Date(), days));
  const interval = eachDayOfInterval({ start, end: new Date() });

  const countMap = new Map<string, number>();
  for (const day of interval) {
    countMap.set(format(day, "yyyy-MM-dd"), 0);
  }

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    try {
      const d = startOfDay(parseISO(raw));
      if (d < start) continue;
      const key = format(d, "yyyy-MM-dd");
      if (countMap.has(key)) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    } catch {
      continue;
    }
  }

  return Array.from(countMap.entries()).map(([date, value]) => ({
    date: format(parseISO(date), "dd/MM"),
    value,
  }));
}
