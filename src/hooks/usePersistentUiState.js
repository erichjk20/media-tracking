import { useEffect, useState } from "react";
import {
  bookSubtypeOptions,
  categories,
  sortOptions,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";

const uiStateStorageKey = "media-shelf-ui-state";
const recentUiRestoreWindowMs = 30 * 60 * 1000;

const defaultUiState = {
  activeView: "home",
  activeCategory: "books",
  activeStatus: "Completed",
  activeBookSubtype: "all",
  activeTvSubtype: "all",
  shelfView: "grid",
  sortOrder: "recent",
  query: "",
  historyYear: "",
  historyMonth: "all",
  historyCategory: "all",
};

const allowedUiValues = {
  activeView: ["home", "library", "profile", "settings", "history"],
  activeCategory: categories.map((category) => category.id),
  activeStatus: statuses,
  activeBookSubtype: bookSubtypeOptions.map((option) => option.value),
  activeTvSubtype: tvSubtypeOptions.map((option) => option.value),
  shelfView: ["grid", "list"],
  sortOrder: sortOptions.map((option) => option.value),
  historyMonth: ["all", ...Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"))],
  historyCategory: ["all", ...categories.map((category) => category.id)],
};

function getAllowedValue(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function isRecentUiState(timestamp) {
  const savedAt = Number(timestamp);
  const ageMs = Date.now() - savedAt;

  return Number.isFinite(savedAt) && ageMs >= 0 && ageMs < recentUiRestoreWindowMs;
}

function getStoredUiState() {
  try {
    const stored = window.localStorage.getItem(uiStateStorageKey);
    const parsedState = stored ? JSON.parse(stored) : {};
    const shouldRestoreActiveView = isRecentUiState(parsedState.lastActiveAt);

    return {
      activeView: shouldRestoreActiveView
        ? getAllowedValue(parsedState.activeView, allowedUiValues.activeView, defaultUiState.activeView)
        : defaultUiState.activeView,
      activeCategory: getAllowedValue(parsedState.activeCategory, allowedUiValues.activeCategory, defaultUiState.activeCategory),
      activeStatus: getAllowedValue(parsedState.activeStatus, allowedUiValues.activeStatus, defaultUiState.activeStatus),
      activeBookSubtype: getAllowedValue(parsedState.activeBookSubtype, allowedUiValues.activeBookSubtype, defaultUiState.activeBookSubtype),
      activeTvSubtype: getAllowedValue(parsedState.activeTvSubtype, allowedUiValues.activeTvSubtype, defaultUiState.activeTvSubtype),
      shelfView: getAllowedValue(parsedState.shelfView, allowedUiValues.shelfView, defaultUiState.shelfView),
      sortOrder: getAllowedValue(parsedState.sortOrder, allowedUiValues.sortOrder, defaultUiState.sortOrder),
      query: typeof parsedState.query === "string" ? parsedState.query : defaultUiState.query,
      historyYear: /^(?!0000)\d{4}$/.test(parsedState.historyYear || "") ? parsedState.historyYear : defaultUiState.historyYear,
      historyMonth: getAllowedValue(parsedState.historyMonth, allowedUiValues.historyMonth, defaultUiState.historyMonth),
      historyCategory: getAllowedValue(parsedState.historyCategory, allowedUiValues.historyCategory, defaultUiState.historyCategory),
    };
  } catch {
    return defaultUiState;
  }
}

export function usePersistentUiState() {
  const [initialUiState] = useState(getStoredUiState);
  const [activeView, setActiveView] = useState(initialUiState.activeView);
  const [activeCategory, setActiveCategory] = useState(initialUiState.activeCategory);
  const [activeStatus, setActiveStatus] = useState(initialUiState.activeStatus);
  const [activeBookSubtype, setActiveBookSubtype] = useState(initialUiState.activeBookSubtype);
  const [activeTvSubtype, setActiveTvSubtype] = useState(initialUiState.activeTvSubtype);
  const [shelfView, setShelfView] = useState(initialUiState.shelfView);
  const [sortOrder, setSortOrder] = useState(initialUiState.sortOrder);
  const [query, setQuery] = useState(initialUiState.query);
  const [historyYear, setHistoryYear] = useState(initialUiState.historyYear);
  const [historyMonth, setHistoryMonth] = useState(initialUiState.historyMonth);
  const [historyCategory, setHistoryCategory] = useState(initialUiState.historyCategory);

  useEffect(() => {
    const nextUiState = {
      activeView,
      activeCategory,
      activeStatus,
      activeBookSubtype,
      activeTvSubtype,
      shelfView,
      sortOrder,
      query,
      historyYear,
      historyMonth,
      historyCategory,
      lastActiveAt: Date.now(),
    };

    window.localStorage.setItem(uiStateStorageKey, JSON.stringify(nextUiState));
  }, [
    activeBookSubtype,
    activeCategory,
    activeStatus,
    activeTvSubtype,
    activeView,
    historyYear,
    historyMonth,
    historyCategory,
    query,
    shelfView,
    sortOrder,
  ]);

  return {
    activeBookSubtype,
    activeCategory,
    activeStatus,
    activeTvSubtype,
    activeView,
    historyYear,
    historyMonth,
    historyCategory,
    query,
    setActiveBookSubtype,
    setActiveCategory,
    setActiveStatus,
    setActiveTvSubtype,
    setActiveView,
    setHistoryYear,
    setHistoryMonth,
    setHistoryCategory,
    setQuery,
    setShelfView,
    setSortOrder,
    shelfView,
    sortOrder,
  };
}
