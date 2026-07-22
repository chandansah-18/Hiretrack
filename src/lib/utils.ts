import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value + "T00:00:00"));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01`));
}

export function isDateInRange(value: string, start?: string, end?: string) {
  const timestamp = new Date(value).getTime();
  const startTimestamp = start
    ? new Date(start.length === 7 ? `${start}-01T00:00:00.000Z` : start).getTime()
    : undefined;
  const endTimestamp = end
    ? new Date(
        end.length === 7
          ? (() => {
              const [year, month] = end.split("-").map(Number);
              return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
            })()
          : end
      ).getTime()
    : undefined;

  if (startTimestamp !== undefined && timestamp < startTimestamp) {
    return false;
  }
  if (endTimestamp !== undefined && timestamp > endTimestamp) {
    return false;
  }
  return true;
}

export function monthKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function createMonthOptions(count = 6) {
  const options: Array<{ label: string; value: string }> = [];
  const current = new Date();

  for (let index = 0; index < count; index += 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    options.push({
      label: formatMonthLabel(monthKey(date)),
      value: monthKey(date),
    });
  }

  return options;
}
