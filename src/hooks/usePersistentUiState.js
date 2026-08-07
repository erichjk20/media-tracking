import { useEffect, useState } from "react";
import {
  bookSubtypeOptions,
  categories,
  sortOptions,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";

const uiStateStorageKey = "media-shelf-ui-state";

const defaultUiState = {
  activeView: "home",
  activeCategory: "books",
  activeStatus: "Completed",
  activeBookSubtype: "all",
  activeTvSubtype: "all",
  shelfView: "grid",
  sortOrder: "recent",
  query: "",
};

const allowedUiValues = {
  activeView: ["home", "library", "profile"],
  activeCategory: categories.map((category) => category.id),
  activeStatus: statuses,
  activeBookSubtype: bookSubtypeOptions.map((option) => option.value),
  activeTvSubtype: tvSubtypeOptions.map((option) => option.value),
  shelfView: ["grid", "list"],
  sortOrder: sortOptions.map((option) => option.value),
};

function getAllowedValue(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function getStoredUiState() {
  try {
    const stored = window.localStorage.getItem(uiStateStorageKey);
    const parsedState = stored ? JSON.parse(stored) : {};

    return {
      activeView: getAllowedValue(parsedState.activeView, allowedUiValues.activeView, defaultUiState.activeView),
      activeCategory: getAllowedValue(parsedState.activeCategory, allowedUiValues.activeCategory, defaultUiState.activeCategory),
      activeStatus: getAllowedValue(parsedState.activeStatus, allowedUiValues.activeStatus, defaultUiState.activeStatus),
      activeBookSubtype: getAllowedValue(parsedState.activeBookSubtype, allowedUiValues.activeBookSubtype, defaultUiState.activeBookSubtype),
      activeTvSubtype: getAllowedValue(parsedState.activeTvSubtype, allowedUiValues.activeTvSubtype, defaultUiState.activeTvSubtype),
      shelfView: getAllowedValue(parsedState.shelfView, allowedUiValues.shelfView, defaultUiState.shelfView),
      sortOrder: getAllowedValue(parsedState.sortOrder, allowedUiValues.sortOrder, defaultUiState.sortOrder),
      query: typeof parsedState.query === "string" ? parsedState.query : defaultUiState.query,
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
    };

    window.localStorage.setItem(uiStateStorageKey, JSON.stringify(nextUiState));
  }, [
    activeBookSubtype,
    activeCategory,
    activeStatus,
    activeTvSubtype,
    activeView,
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
    query,
    setActiveBookSubtype,
    setActiveCategory,
    setActiveStatus,
    setActiveTvSubtype,
    setActiveView,
    setQuery,
    setShelfView,
    setSortOrder,
    shelfView,
    sortOrder,
  };
}
