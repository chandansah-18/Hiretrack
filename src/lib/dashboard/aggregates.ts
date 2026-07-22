import { formatMonthLabel, formatShortDate, monthKey } from "@/lib/utils";

export function buildDailySeries<T extends object>(
  rows: T[],
  field: keyof T,
  days = 7
) {
  const entries: Array<{ name: string; value: number }> = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const count = rows.filter((row) => {
      const value = row[field];
      return typeof value === "string" && value.slice(0, 10) === key;
    }).length;
    entries.push({
      name: formatShortDate(key),
      value: count,
    });
  }
  return entries;
}

export function buildMonthlySeries<T extends object>(
  rows: T[],
  field: keyof T,
  months = 6
) {
  const series: Array<{ key: string; name: string; value: number }> = [];
  const current = new Date();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - offset, 1);
    const key = monthKey(date);
    const count = rows.filter((row) => {
      const value = row[field];
      return typeof value === "string" && monthKey(value) === key;
    }).length;
    series.push({
      key,
      name: formatMonthLabel(key),
      value: count,
    });
  }

  return series;
}

export function countByValue<T>(rows: T[], accessor: (row: T) => string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = accessor(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}
