import { useMemo } from "react";
import {
  bookSubtypeOptions,
  categories,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import {
  compareShelfItems,
  getKeywordMatchScore,
  getSearchTokens,
} from "../lib/mediaUtils";

function getSubtypeCounts(items, activeStatus, options, defaultSubtype) {
  const subtypeCounts = Object.fromEntries(options.map((option) => [option.value, 0]));

  items.forEach((item) => {
    if (item.status !== activeStatus) return;
    const subtype = item.subtype || defaultSubtype;
    subtypeCounts.all += 1;
    if (subtypeCounts[subtype] !== undefined) subtypeCounts[subtype] += 1;
  });

  return subtypeCounts;
}

function createEmptyCategoryCounts() {
  return Object.fromEntries(
    categories.map((currentCategory) => [
      currentCategory.id,
      Object.fromEntries(statuses.map((status) => [status, 0])),
    ]),
  );
}

function getActiveSubtype(activeCategory, activeBookSubtype, activeTvSubtype) {
  if (activeCategory === "books") return activeBookSubtype;
  if (activeCategory === "tv") return activeTvSubtype;
  return "all";
}

function matchesActiveSubtype(item, activeCategory, activeSubtype) {
  if (activeCategory === "books" && activeSubtype !== "all") return (item.subtype || "book") === activeSubtype;
  if (activeCategory === "tv" && activeSubtype !== "all") return (item.subtype || "tv") === activeSubtype;
  return true;
}

export function useShelfData({
  activeBookSubtype,
  activeCategory,
  activeStatus,
  activeTvSubtype,
  items,
  query,
  sortOrder,
}) {
  const category = categories.find((entry) => entry.id === activeCategory);

  const visibleItems = useMemo(() => {
    const activeSubtype = getActiveSubtype(activeCategory, activeBookSubtype, activeTvSubtype);
    const queryTokens = getSearchTokens(query);

    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === activeCategory && item.status === activeStatus)
      .filter(({ item }) => matchesActiveSubtype(item, activeCategory, activeSubtype))
      .filter(({ item }) => {
        if (!queryTokens.length) return true;
        return getKeywordMatchScore([item.title, item.creator, item.synopsis, item.notes].join(" "), queryTokens) >= queryTokens.length;
      })
      .sort((a, b) => compareShelfItems(a, b, sortOrder))
      .map(({ item }) => item);
  }, [activeBookSubtype, activeCategory, activeStatus, activeTvSubtype, items, query, sortOrder]);

  const counts = useMemo(() => {
    const categoryCounts = createEmptyCategoryCounts();

    items.forEach((item) => {
      if (categoryCounts[item.category]?.[item.status] === undefined) return;
      categoryCounts[item.category][item.status] += 1;
    });

    return categoryCounts;
  }, [items]);

  const bookSubtypeCounts = useMemo(() => {
    return getSubtypeCounts(
      items.filter((item) => item.category === "books"),
      activeStatus,
      bookSubtypeOptions,
      "book",
    );
  }, [activeStatus, items]);

  const tvSubtypeCounts = useMemo(() => {
    return getSubtypeCounts(
      items.filter((item) => item.category === "tv"),
      activeStatus,
      tvSubtypeOptions,
      "tv",
    );
  }, [activeStatus, items]);

  const activeShelfCounts = useMemo(() => {
    const activeSubtype = getActiveSubtype(activeCategory, activeBookSubtype, activeTvSubtype);
    const statusCounts = Object.fromEntries(statuses.map((status) => [status, 0]));

    items.forEach((item) => {
      if (item.category !== activeCategory) return;
      if (!matchesActiveSubtype(item, activeCategory, activeSubtype)) return;
      if (statusCounts[item.status] !== undefined) statusCounts[item.status] += 1;
    });

    return statusCounts;
  }, [activeBookSubtype, activeCategory, activeTvSubtype, items]);

  return {
    activeShelfCounts,
    bookSubtypeCounts,
    category,
    counts,
    tvSubtypeCounts,
    visibleItems,
  };
}
