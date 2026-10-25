import { getFinishedDatePrecision, getLocalDate } from "./mediaDates.js";

export function getHistoryYears(items, currentYear = getLocalDate().slice(0, 4)) {
  const years = new Set([currentYear]);
  for (const item of items) {
    if (item.status === "Completed" && getFinishedDatePrecision(item.finishedOn) !== "unknown") {
      years.add(item.finishedOn.slice(0, 4));
    }
  }
  return [...years].sort().reverse();
}

function compareTitles(a, b) {
  return a.title.localeCompare(b.title) || String(a.id).localeCompare(String(b.id));
}

export function getHistoryData(items, { year, month = "all", category = "all" }) {
  const periodItems = [];
  const unknownItems = [];

  for (const item of items) {
    if (item.status !== "Completed") continue;
    if (getFinishedDatePrecision(item.finishedOn) === "unknown") {
      if (category === "all" || item.category === category) unknownItems.push(item);
      continue;
    }
    if (item.finishedOn.slice(0, 4) !== year) continue;
    if (month !== "all" && item.finishedOn.slice(5, 7) !== month) continue;
    periodItems.push(item);
  }

  const categoryCounts = {};
  for (const item of periodItems) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }
  const visibleItems = periodItems.filter((item) => category === "all" || item.category === category);
  const groups = new Map();
  for (const item of visibleItems) {
    const key = item.finishedOn.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return {
    total: visibleItems.length,
    periodTotal: periodItems.length,
    categoryCounts,
    groups: [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, entries]) => ({
      month,
      // Month-only entries follow known days; no day is invented for ordering.
      items: entries.sort((a, b) => b.finishedOn.localeCompare(a.finishedOn) || compareTitles(a, b)),
    })),
    // Undated items span all years and never enter the selected period's totals.
    unknownItems: unknownItems.sort(compareTitles),
  };
}
