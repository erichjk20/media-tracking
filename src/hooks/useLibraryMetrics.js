import { useMemo } from "react";
import { categories, statuses } from "../lib/mediaConfig";

function getAddedAtValue(item, fallbackIndex) {
  const timestamp = Date.parse(item.addedAt || "");
  return Number.isNaN(timestamp) ? fallbackIndex : timestamp;
}

export function useLibraryMetrics(items) {
  return useMemo(() => {
    const completedItems = items.filter((item) => item.status === "Completed");
    const plannedItems = items.filter((item) => item.status === "Want to Watch/Read");
    const ratedItems = completedItems.filter((item) => Number(item.rating) > 0);
    const averageRating = ratedItems.length
      ? ratedItems.reduce((total, item) => total + Number(item.rating || 0), 0) / ratedItems.length
      : 0;
    const recentItems = items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => getAddedAtValue(b.item, b.index) - getAddedAtValue(a.item, a.index))
      .slice(0, 6)
      .map(({ item }) => item);

    const categoryBreakdown = categories.map((category) => {
      const categoryItems = items.filter((item) => item.category === category.id);
      const statusCounts = statuses.reduce((counts, status) => {
        counts[status] = categoryItems.filter((item) => item.status === status).length;
        return counts;
      }, {});

      return {
        ...category,
        total: categoryItems.length,
        completed: statusCounts.Completed || 0,
        planned: statusCounts["Want to Watch/Read"] || 0,
      };
    });

    return {
      averageRating,
      categoryBreakdown,
      completedCount: completedItems.length,
      plannedCount: plannedItems.length,
      ratedCount: ratedItems.length,
      recentItems,
      totalCount: items.length,
    };
  }, [items]);
}
