import { useMemo } from "react";
import {
  bookSubtypeOptions,
  categories,
  movieSubtypeOptions,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import {
  compareShelfItems,
  getKeywordMatchScore,
  getSearchTokens,
} from "../lib/mediaUtils";

function getSubtypeCounts(items, activeStatus, options, defaultSubtype) {
  const shelfItems = items.filter((item) => item.status === activeStatus);

  return options.reduce((subtypeCounts, option) => {
    subtypeCounts[option.value] =
      option.value === "all"
        ? shelfItems.length
        : shelfItems.filter((item) => (item.subtype || defaultSubtype) === option.value).length;
    return subtypeCounts;
  }, {});
}

export function useShelfData({
  activeBookSubtype,
  activeCategory,
  activeMovieSubtype,
  activeStatus,
  activeTvSubtype,
  items,
  query,
  sortOrder,
}) {
  const category = categories.find((entry) => entry.id === activeCategory);

  const visibleItems = useMemo(() => {
    const queryTokens = getSearchTokens(query);
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === activeCategory && item.status === activeStatus)
      .filter(({ item }) => {
        if (activeCategory !== "books" || activeBookSubtype === "all") return true;
        return (item.subtype || "book") === activeBookSubtype;
      })
      .filter(({ item }) => {
        if (activeCategory !== "movies" || activeMovieSubtype === "all") return true;
        return (item.subtype || "movie") === activeMovieSubtype;
      })
      .filter(({ item }) => {
        if (activeCategory !== "tv" || activeTvSubtype === "all") return true;
        return (item.subtype || "tv") === activeTvSubtype;
      })
      .filter(({ item }) => {
        if (!queryTokens.length) return true;
        return getKeywordMatchScore([item.title, item.creator, item.synopsis, item.notes].join(" "), queryTokens) >= queryTokens.length;
      })
      .sort((a, b) => compareShelfItems(a, b, sortOrder))
      .map(({ item }) => item);
  }, [activeBookSubtype, activeCategory, activeMovieSubtype, activeStatus, activeTvSubtype, items, query, sortOrder]);

  const counts = useMemo(() => {
    return categories.reduce((categoryCounts, currentCategory) => {
      categoryCounts[currentCategory.id] = statuses.reduce((statusCounts, status) => {
        statusCounts[status] = items.filter(
          (item) => item.category === currentCategory.id && item.status === status,
        ).length;
        return statusCounts;
      }, {});
      return categoryCounts;
    }, {});
  }, [items]);

  const movieSubtypeCounts = useMemo(() => {
    return getSubtypeCounts(
      items.filter((item) => item.category === "movies"),
      activeStatus,
      movieSubtypeOptions,
      "movie",
    );
  }, [activeStatus, items]);

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
    let activeSubtype = "all";

    if (activeCategory === "books") activeSubtype = activeBookSubtype;
    if (activeCategory === "movies") activeSubtype = activeMovieSubtype;
    if (activeCategory === "tv") activeSubtype = activeTvSubtype;

    const shelfItems = items.filter((item) => {
      if (item.category !== activeCategory) return false;
      if (activeCategory === "books" && activeSubtype !== "all") return (item.subtype || "book") === activeSubtype;
      if (activeCategory === "movies" && activeSubtype !== "all") return (item.subtype || "movie") === activeSubtype;
      if (activeCategory === "tv" && activeSubtype !== "all") return (item.subtype || "tv") === activeSubtype;
      return true;
    });

    return statuses.reduce((statusCounts, status) => {
      statusCounts[status] = shelfItems.filter((item) => item.status === status).length;
      return statusCounts;
    }, {});
  }, [activeBookSubtype, activeCategory, activeMovieSubtype, activeTvSubtype, items]);

  return {
    activeShelfCounts,
    bookSubtypeCounts,
    category,
    counts,
    movieSubtypeCounts,
    tvSubtypeCounts,
    visibleItems,
  };
}
