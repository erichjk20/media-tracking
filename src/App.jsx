import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import EditorSheet from "./components/EditorSheet";
import HomeView from "./components/HomeView";
import LibraryView from "./components/LibraryView";
import {
  fetchMediaItems,
  isSupabaseConfigured,
  removeMediaItem,
  saveMediaItem,
} from "./lib/mediaItemsStore";
import {
  bookSubtypeOptions,
  categories,
  emptyDraft,
  movieSubtypeOptions,
  omdbTypesByCategory,
  openLibraryCanonicalBookLanguage,
  statuses,
  tmdbCanonicalMediaLanguage,
  tvSubtypeOptions,
} from "./lib/mediaConfig";
import {
  cleanOmdbValue,
  cleanTmdbValue,
  compareShelfItems,
  createLookupResult,
  dedupeLookupResults,
  getBookLookupLanguage,
  getDefaultSubtype,
  getKeywordMatchScore,
  getLabeledNoteValue,
  getLocalStorageItems,
  getLookupMessage,
  getOpenLibraryCoverUrl,
  getSearchTokens,
  getSelectableSubtype,
  getStoredItems,
  getTmdbImageUrl,
  normalizeItems,
  normalizeOpenLibraryList,
  parseOmdbRuntime,
  parseReleaseYear,
  rankLookupResults,
} from "./lib/mediaUtils";

const omdbApiKey = import.meta.env.VITE_OMDB_API_KEY;
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbAccessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

function getLookupProviders(category, subtype = "") {
  if (category === "books") {
    return subtype === "korean-book" ? [{ id: "aladin", label: "Aladin" }] : [{ id: "open-library", label: "Open Library" }];
  }
  if (category === "movies") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "tv") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "manga") return [{ id: "jikan", label: "Jikan" }];
  return [];
}

function getFallbackLookupProviders(category, subtype = "", attemptedProviderIds = []) {
  if (category === "books" && subtype === "korean-book" && !attemptedProviderIds.includes("open-library")) {
    return [{ id: "open-library", label: "Open Library" }];
  }
  if (category === "movies" && subtype !== "korean-movie" && !attemptedProviderIds.includes("omdb")) {
    return [{ id: "omdb", label: "OMDb" }];
  }
  if (category === "tv" && subtype !== "kdrama" && !attemptedProviderIds.includes("omdb")) {
    return [{ id: "omdb", label: "OMDb" }];
  }
  return [];
}

function App() {
  const [items, setItems] = useState(getStoredItems);
  const [storageMode, setStorageMode] = useState(isSupabaseConfigured ? "loading" : "local");
  const [storageMessage, setStorageMessage] = useState(
    isSupabaseConfigured ? "Connecting to Supabase..." : "",
  );
  const [activeView, setActiveView] = useState("home");
  const [activeCategory, setActiveCategory] = useState("books");
  const [activeStatus, setActiveStatus] = useState("Completed");
  const [activeBookSubtype, setActiveBookSubtype] = useState("all");
  const [activeMovieSubtype, setActiveMovieSubtype] = useState("all");
  const [activeTvSubtype, setActiveTvSubtype] = useState("all");
  const [shelfView, setShelfView] = useState("grid");
  const [sortOrder, setSortOrder] = useState("recent");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [editingId, setEditingId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupStatus, setLookupStatus] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [tmdbLanguage, setTmdbLanguage] = useState("en-US");
  const [bookLanguage, setBookLanguage] = useState(openLibraryCanonicalBookLanguage);
  const [pendingHomeLookup, setPendingHomeLookup] = useState(null);
  const [shouldRunLookup, setShouldRunLookup] = useState(false);
  const [homeSearchResetToken, setHomeSearchResetToken] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState("idle");
  const [refreshMessage, setRefreshMessage] = useState("");

  const category = categories.find((entry) => entry.id === activeCategory);
  const canUseBookLookup = draft.category === "books";
  const canUseMangaLookup = draft.category === "manga";
  const lookupProviders = getLookupProviders(draft.category, draft.subtype);
  const canUseOmdb = lookupProviders.some((provider) => provider.id === "omdb");
  const canUseTmdb = lookupProviders.some((provider) => provider.id === "tmdb");
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
        return getKeywordMatchScore([item.title, item.creator, item.notes].join(" "), queryTokens) >= queryTokens.length;
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
    const movieItems = items.filter((item) => item.category === "movies" && item.status === activeStatus);
    return movieSubtypeOptions.reduce((subtypeCounts, option) => {
      subtypeCounts[option.value] =
        option.value === "all"
          ? movieItems.length
          : movieItems.filter((item) => (item.subtype || "movie") === option.value).length;
      return subtypeCounts;
    }, {});
  }, [activeStatus, items]);

  const bookSubtypeCounts = useMemo(() => {
    const bookItems = items.filter((item) => item.category === "books" && item.status === activeStatus);
    return bookSubtypeOptions.reduce((subtypeCounts, option) => {
      subtypeCounts[option.value] =
        option.value === "all" ? bookItems.length : bookItems.filter((item) => (item.subtype || "book") === option.value).length;
      return subtypeCounts;
    }, {});
  }, [activeStatus, items]);

  const tvSubtypeCounts = useMemo(() => {
    const tvItems = items.filter((item) => item.category === "tv" && item.status === activeStatus);
    return tvSubtypeOptions.reduce((subtypeCounts, option) => {
      subtypeCounts[option.value] =
        option.value === "all" ? tvItems.length : tvItems.filter((item) => (item.subtype || "tv") === option.value).length;
      return subtypeCounts;
    }, {});
  }, [activeStatus, items]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isCurrent = true;

    async function loadDatabaseItems() {
      try {
        let databaseItems = await fetchMediaItems();
        const localItems = getLocalStorageItems();

        if (!databaseItems.length && localItems.length) {
          databaseItems = await Promise.all(localItems.map((item) => saveMediaItem(item)));
        }

        if (!isCurrent) return;
        setItems(normalizeItems(databaseItems));
        setStorageMode("supabase");
        setStorageMessage("");
      } catch (error) {
        console.error("Supabase load failed", error);
        if (!isCurrent) return;
        setStorageMode("local");
        setStorageMessage(`Supabase is unavailable. Changes are being saved in this browser. ${error.message || ""}`.trim());
      }
    }

    loadDatabaseItems();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (storageMode === "loading" || storageMode === "supabase") return;
    window.localStorage.setItem("media-shelf-items", JSON.stringify(items));
  }, [items, storageMode]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      category: activeCategory,
      subtype: getDefaultSubtype(activeCategory, current.subtype),
      status: activeStatus,
      rating: activeStatus === "Completed" ? current.rating || 3 : 0,
    }));
    setEditingId(null);
  }, [activeCategory, activeStatus]);

  useEffect(() => {
    setLookupQuery("");
    setLookupResults([]);
    setLookupStatus("idle");
    setLookupMessage("");
  }, [draft.category, draft.subtype]);

  useEffect(() => {
    if (!pendingHomeLookup || !isEditorOpen) return;
    if (draft.category !== pendingHomeLookup.categoryId || draft.status !== pendingHomeLookup.status) return;

    setLookupQuery(pendingHomeLookup.query);
    setLookupResults([]);
    setLookupStatus("idle");
    setLookupMessage("");
    setShouldRunLookup(Boolean(pendingHomeLookup.query.trim()));
    setPendingHomeLookup(null);
  }, [draft.category, draft.status, isEditorOpen, pendingHomeLookup]);

  useEffect(() => {
    if (!shouldRunLookup || !isEditorOpen || !lookupQuery.trim()) return;

    setShouldRunLookup(false);
    searchDetails();
  }, [isEditorOpen, lookupQuery, shouldRunLookup]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedTitle = draft.title.trim();
    if (!cleanedTitle) return;
    const isAddingNewItem = !editingId;

    const nextItem = {
      ...draft,
      id: editingId || crypto.randomUUID(),
      addedAt: editingId ? draft.addedAt || "" : new Date().toISOString(),
      title: cleanedTitle,
      creator: draft.creator.trim(),
      director: draft.director.trim(),
      genre: draft.genre.trim(),
      releaseYear: draft.releaseYear ? Number(draft.releaseYear) : "",
      durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : "",
      pageCount: draft.pageCount ? Number(draft.pageCount) : "",
      publisher: draft.publisher.trim(),
      isbn: draft.isbn.trim(),
      author: draft.author.trim(),
      artist: draft.artist.trim(),
      volumeCount: draft.volumeCount ? Number(draft.volumeCount) : "",
      chapterCount: draft.chapterCount ? Number(draft.chapterCount) : "",
      seasonCount: draft.seasonCount ? Number(draft.seasonCount) : "",
      episodeCount: draft.episodeCount ? Number(draft.episodeCount) : "",
      durationMinutesPerEpisode: draft.durationMinutesPerEpisode ? Number(draft.durationMinutesPerEpisode) : "",
      studio: draft.studio.trim(),
      subtype: getDefaultSubtype(draft.category, draft.subtype),
      rating: draft.status === "Completed" ? Number(draft.rating) : 0,
      notes: draft.notes.trim(),
      imageUrl: draft.imageUrl.trim(),
    };

    try {
      const savedItem = storageMode === "supabase" ? await saveMediaItem(nextItem) : nextItem;

      setItems((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? savedItem : item))
          : [...current, savedItem],
      );
      resetForm();
      if (isAddingNewItem) {
        setHomeSearchResetToken((current) => current + 1);
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Supabase save failed", error);
      setStorageMode("local");
      setStorageMessage(`Could not save to Supabase. This change was saved in this browser instead. ${error.message || ""}`.trim());
      setItems((current) =>
        editingId ? current.map((item) => (item.id === editingId ? nextItem : item)) : [...current, nextItem],
      );
      resetForm();
      if (isAddingNewItem) {
        setHomeSearchResetToken((current) => current + 1);
      }
      setIsEditorOpen(false);
    }
  }

  function resetForm() {
    const subtype = activeCategory === "tv" ? activeTvSubtype : activeCategory === "movies" ? activeMovieSubtype : activeCategory === "books" ? activeBookSubtype : "";

    setDraft({
      ...emptyDraft,
      category: activeCategory,
      subtype: getSelectableSubtype(activeCategory, subtype),
      status: activeStatus,
      rating: activeStatus === "Completed" ? 3 : 0,
    });
    setEditingId(null);
  }

  function startEdit(item) {
    setDraft(normalizeItems([item])[0]);
    setEditingId(item.id);
    setActiveCategory(item.category);
    setActiveStatus(item.status);
    setIsEditorOpen(true);
  }

  function startNewItem() {
    const subtype = activeCategory === "tv" ? activeTvSubtype : activeCategory === "movies" ? activeMovieSubtype : activeCategory === "books" ? activeBookSubtype : "";

    setDraft({
      ...emptyDraft,
      category: activeCategory,
      subtype: getSelectableSubtype(activeCategory, subtype),
      status: activeStatus,
      rating: activeStatus === "Completed" ? 3 : 0,
    });
    setEditingId(null);
    setIsEditorOpen(true);
  }

  function startHomeLookup({ categoryId, query: homeQuery, status }) {
    const cleanedQuery = homeQuery.trim();

    setActiveCategory(categoryId);
    setActiveStatus(status);
    setDraft({
      ...emptyDraft,
      category: categoryId,
      subtype: getDefaultSubtype(categoryId),
      status,
      title: cleanedQuery,
      rating: status === "Completed" ? 3 : 0,
    });
    setEditingId(null);
    setIsEditorOpen(true);
    setPendingHomeLookup({
      categoryId,
      query: cleanedQuery,
      status,
    });
  }

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  async function deleteItem(id) {
    try {
      if (storageMode === "supabase") await removeMediaItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setStorageMessage("Could not delete from Supabase. Try again in a moment.");
    }
  }

  async function refreshExistingItems() {
    if (refreshStatus === "loading") return;

    setRefreshStatus("loading");
    setRefreshMessage(`Updating ${items.length} saved item${items.length === 1 ? "" : "s"}...`);

    const refreshedItems = [];
    const failures = [];

    for (const item of items) {
      try {
        const refreshedItem = await refreshItemDetails(item);
        const savedItem = storageMode === "supabase" ? await saveMediaItem(refreshedItem) : refreshedItem;
        refreshedItems.push(savedItem);
      } catch {
        refreshedItems.push(item);
        failures.push(item.title);
      }
    }

    setItems(normalizeItems(refreshedItems));
    setRefreshStatus(failures.length ? "error" : "success");
    setRefreshMessage(
      failures.length
        ? `Updated ${items.length - failures.length} item${items.length - failures.length === 1 ? "" : "s"}. ${failures.length} could not be matched.`
        : `Updated ${items.length} saved item${items.length === 1 ? "" : "s"} with API details.`,
    );
  }

  async function refreshItemDetails(item) {
    const lookupResult = await findBestLookupResultForItem(item);
    if (!lookupResult) throw new Error("No matching API result found.");

    const patch = await getItemPatchFromLookupResult(item, lookupResult);

    return {
      ...item,
      ...patch,
      id: item.id,
      status: item.status,
      rating: item.rating,
      addedAt: item.addedAt,
      title: patch.title || item.title,
      notes: item.notes,
      creator: patch.creator || item.creator,
      director: patch.director || item.director,
      genre: patch.genre || item.genre,
      releaseYear: patch.releaseYear || item.releaseYear,
      durationMinutes: patch.durationMinutes || item.durationMinutes,
      pageCount: patch.pageCount || item.pageCount,
      publisher: patch.publisher || item.publisher,
      isbn: patch.isbn || item.isbn,
      author: patch.author || item.author,
      artist: patch.artist || item.artist,
      volumeCount: patch.volumeCount || item.volumeCount,
      chapterCount: patch.chapterCount || item.chapterCount,
      seasonCount: patch.seasonCount || item.seasonCount,
      episodeCount: patch.episodeCount || item.episodeCount,
      durationMinutesPerEpisode: patch.durationMinutesPerEpisode || item.durationMinutesPerEpisode,
      studio: patch.studio || item.studio,
      imageUrl: patch.imageUrl || item.imageUrl,
      subtype: getDefaultSubtype(patch.category || item.category, patch.subtype || item.subtype),
    };
  }

  async function findBestLookupResultForItem(item) {
    const providers = getLookupProviders(item.category, item.subtype);
    const fallbackProviders = getFallbackLookupProviders(item.category, item.subtype, providers.map((provider) => provider.id));
    const providerResults = [];

    for (const provider of [...providers, ...fallbackProviders]) {
      const providerSearch = await fetchProviderResults(item.title, provider, {
        category: item.category,
        language: item.category === "books" ? getBookLookupLanguage(item.subtype, bookLanguage) : bookLanguage,
        subtype: item.subtype,
      });
      providerResults.push(...providerSearch.results);
    }

    const dedupedResults = dedupeLookupResults(providerResults, providers[0]?.id);
    return rankLookupResults(dedupedResults, item.title)[0];
  }

  async function getItemPatchFromLookupResult(item, lookupResult) {
    if (lookupResult.source === "omdb") return getOmdbItemPatch(lookupResult.result, item.category, item.subtype);
    if (lookupResult.source === "tmdb") return getTmdbItemPatch(lookupResult.result, item);
    if (lookupResult.source === "open-library") return getOpenLibraryItemPatch(lookupResult.result, item);
    if (lookupResult.source === "aladin") return getAladinItemPatch(lookupResult.result);
    if (lookupResult.source === "jikan-anime") return getAnimeItemPatch(lookupResult.result);
    return getMangaItemPatch(lookupResult.result);
  }

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "category" ? { subtype: getDefaultSubtype(value, current.subtype) } : {}),
      ...(field === "status" && value !== "Completed" ? { rating: 0 } : {}),
      ...(field === "status" && value === "Completed" ? { rating: current.rating || 3 } : {}),
    }));
  }

  function showLibrary() {
    setShelfView("grid");
    setActiveView("library");
  }

  function showCategory(categoryId) {
    showLibrary();
    setActiveCategory(categoryId);
  }

  async function searchDetails(event) {
    event?.preventDefault();
    const cleanedQuery = lookupQuery.trim();
    const providers = getLookupProviders(draft.category, draft.subtype);

    if (!cleanedQuery || !providers.length) {
      setLookupStatus("error");
      setLookupMessage("Enter a title to search.");
      return;
    }

    setLookupStatus("loading");
    setLookupMessage("");
    setLookupResults([]);

    const runProviderSearches = async (activeProviders) => {
      const searches = activeProviders.map((provider) => {
        return fetchProviderResults(cleanedQuery, provider, {
          category: draft.category,
          language: draft.category === "books" ? getBookLookupLanguage(draft.subtype, bookLanguage) : bookLanguage,
          subtype: draft.subtype,
        });
      });

      const settledResults = await Promise.allSettled(searches);
      const providerResults = settledResults.flatMap((entry) => (entry.status === "fulfilled" ? entry.value.results : []));
      const messages = settledResults.map(getLookupMessage).filter(Boolean);

      return { messages, providerResults, settledResults };
    };

    const preferredProvider = providers[0]?.id;
    let { messages, providerResults } = await runProviderSearches(providers);
    const fallbackProviders = getFallbackLookupProviders(draft.category, draft.subtype, providers.map((provider) => provider.id));

    if (!providerResults.length && fallbackProviders.length) {
      const fallbackSearch = await runProviderSearches(fallbackProviders);
      providerResults = fallbackSearch.providerResults;
      messages = fallbackSearch.messages.length ? fallbackSearch.messages : messages;
    }

    const dedupedResults = dedupeLookupResults(providerResults, preferredProvider);
    const results = rankLookupResults(dedupedResults, cleanedQuery);

    if (!results.length) {
      setLookupStatus("error");
      setLookupMessage(messages[0] || "No matching results found.");
      return;
    }

    setLookupResults(results);
    setLookupStatus("success");
    setLookupMessage(messages.length ? messages.join(" ") : "");
  }

  function fetchProviderResults(searchText, provider, context = {}) {
    if (provider.id === "omdb") return fetchOmdbResults(searchText, context.category);
    if (provider.id === "tmdb") return fetchTmdbResults(searchText, context.category, context.subtype);
    if (provider.id === "open-library") return fetchOpenLibraryResults(searchText, context.language);
    if (provider.id === "aladin") return fetchAladinResults(searchText);
    if (provider.id === "jikan-anime") return fetchAnimeResults(searchText);
    return fetchMangaResults(searchText);
  }

  async function fetchOmdbResults(searchText, category = draft.category) {
    const omdbType = omdbTypesByCategory[category];

    if (!omdbApiKey) {
      return { results: [], message: "Add VITE_OMDB_API_KEY to use OMDb." };
    }

    if (!omdbType) {
      return { results: [], message: "" };
    }

    try {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", omdbApiKey);
      url.searchParams.set("s", searchText);
      url.searchParams.set("type", omdbType);

      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === "False") {
        return { results: [], message: data.Error || "No OMDb results found." };
      }

      return {
        results: (data.Search || []).slice(0, 10).map((result) => createLookupResult("omdb", result)),
        message: "",
      };
    } catch {
      return { results: [], message: "OMDb lookup failed." };
    }
  }

  async function fetchTmdbResults(searchText, category = draft.category, subtype = draft.subtype) {
    const mediaType = category === "movies" ? "movie" : category === "tv" ? "tv" : "";

    if (!tmdbAccessToken && !tmdbApiKey) {
      return { results: [], message: "Add VITE_TMDB_ACCESS_TOKEN or VITE_TMDB_API_KEY to use TMDb." };
    }

    if (!mediaType) {
      return { results: [], message: "" };
    }

    const languages = getTmdbSearchLanguages(mediaType, subtype, tmdbLanguage);
    const settledSearches = await Promise.allSettled(
      languages.map((language) => fetchTmdbSearchResults(searchText, mediaType, subtype, language)),
    );
    const failedSearches = settledSearches.filter((entry) => entry.status === "rejected");
    const rawResults = settledSearches.flatMap((entry) => (entry.status === "fulfilled" ? entry.value : []));

    const results = dedupeTmdbResults(rawResults)
      .filter((result) => result.poster_path || result.title || result.name || result.original_title || result.original_name)
      .slice(0, 14)
      .map((result) => normalizeTmdbResult(result, mediaType));

    if (!results.length) {
      const error = failedSearches[0]?.reason;
      return { results: [], message: error?.message || "No TMDb results found." };
    }

    return { results: results.map((result) => createLookupResult("tmdb", result)), message: "" };
  }

  async function fetchOpenLibraryResults(searchText, language = bookLanguage) {
    try {
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("q", buildOpenLibraryQuery(searchText, language));
      url.searchParams.set(
        "fields",
        "key,title,author_name,first_publish_year,cover_i,language,publisher,subject,edition_count,number_of_pages_median",
      );
      url.searchParams.set("limit", "14");
      if (language !== "all") {
        url.searchParams.set("lang", language);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Open Library lookup failed.");
      }

      const results = (data.docs || [])
        .map(normalizeOpenLibraryBookResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 14);

      if (!results.length) {
        return { results: [], message: "No Open Library results found." };
      }

      return { results: results.map((result) => createLookupResult("open-library", result)), message: "" };
    } catch (error) {
      return { results: [], message: error.message || "Open Library lookup failed." };
    }
  }

  async function fetchAladinResults(searchText) {
    try {
      const url = new URL("/api/aladin/books", window.location.origin);
      url.searchParams.set("query", searchText);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.errorCode) {
        throw new Error(data.errorMessage || data.message || "Aladin lookup failed.");
      }

      const results = (data.item || [])
        .map(normalizeAladinBookResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 14);

      if (!results.length) {
        return { results: [], message: "No Aladin Korean book results found." };
      }

      return { results: results.map((result) => createLookupResult("aladin", result)), message: "" };
    } catch (error) {
      return { results: [], message: error.message || "Aladin lookup failed." };
    }
  }

  async function fetchMangaResults(searchText) {
    try {
      const url = new URL("https://api.jikan.moe/v4/manga");
      url.searchParams.set("q", searchText);
      url.searchParams.set("limit", "14");
      url.searchParams.set("sfw", "true");

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Jikan lookup failed.");
      }

      const results = (data.data || [])
        .map(normalizeJikanMangaResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 14);

      if (!results.length) {
        return { results: [], message: "No Jikan manga results found." };
      }

      return { results: results.map((result) => createLookupResult("jikan", result)), message: "" };
    } catch (error) {
      return { results: [], message: error.message || "Jikan lookup failed." };
    }
  }

  async function fetchAnimeResults(searchText) {
    try {
      const url = new URL("https://api.jikan.moe/v4/anime");
      url.searchParams.set("q", searchText);
      url.searchParams.set("limit", "14");
      url.searchParams.set("sfw", "true");

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Jikan anime lookup failed.");
      }

      const results = (data.data || [])
        .map(normalizeJikanAnimeResult)
        .filter((result) => result.title || result.creators || result.studios)
        .slice(0, 14);

      if (!results.length) {
        return { results: [], message: "No Jikan anime results found." };
      }

      return { results: results.map((result) => createLookupResult("jikan-anime", result)), message: "" };
    } catch (error) {
      return { results: [], message: error.message || "Jikan anime lookup failed." };
    }
  }

  async function applyLookupResult(lookupResult) {
    setLookupStatus("loading");
    setLookupMessage("");

    try {
      if (lookupResult.source === "omdb") {
        await applyOmdbResult(lookupResult.result);
      } else if (lookupResult.source === "tmdb") {
        await applyTmdbResult(lookupResult.result);
      } else if (lookupResult.source === "open-library") {
        applyBookResult(lookupResult.result);
      } else if (lookupResult.source === "aladin") {
        applyAladinBookResult(lookupResult.result);
      } else if (lookupResult.source === "jikan-anime") {
        applyAnimeResult(lookupResult.result);
      } else {
        applyMangaResult(lookupResult.result);
      }
      setLookupQuery("");
    } catch (error) {
      setLookupStatus("error");
      setLookupMessage(error.message || "Could not apply that result.");
    }
  }

  function withoutPersonalNotes(patch) {
    const { notes, ...safePatch } = patch;
    return safePatch;
  }

  async function applyOmdbResult(result) {
    const patch = withoutPersonalNotes(await getOmdbItemPatch(result, draft.category, draft.subtype));

    setDraft((current) => ({
      ...current,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      director: patch.director || current.director,
      genre: patch.genre || current.genre,
      releaseYear: patch.releaseYear || current.releaseYear,
      durationMinutes: patch.durationMinutes || current.durationMinutes,
      seasonCount: patch.seasonCount || current.seasonCount,
      episodeCount: patch.episodeCount || current.episodeCount,
      durationMinutesPerEpisode: patch.durationMinutesPerEpisode || current.durationMinutesPerEpisode,
      imageUrl: patch.imageUrl || current.imageUrl,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Details added from OMDb. You can edit anything before saving.");
  }

  async function getOmdbItemPatch(result, category, subtype = "") {
    const url = new URL("https://www.omdbapi.com/");
    url.searchParams.set("apikey", omdbApiKey);
    url.searchParams.set("i", result.imdbID);
    url.searchParams.set("plot", "short");

    const response = await fetch(url);
    const detail = await response.json();

    if (detail.Response === "False") {
      throw new Error(detail.Error || "Could not load OMDb details.");
    }

    const director = cleanOmdbValue(detail.Director);
    const writer = cleanOmdbValue(detail.Writer);
    const creator = category === "movies" ? director : subtype === "anime" ? writer || director : director || writer;
    const durationMinutes = parseOmdbRuntime(detail.Runtime);
    const genre = cleanOmdbValue(detail.Genre);
    const releaseYear = parseReleaseYear(detail.Year);
    const episodeCount = category === "tv" ? await fetchOmdbEpisodeCount(result.imdbID, detail.totalSeasons) : "";
    const title = cleanOmdbValue(detail.Title) || result.Title || "";

    return {
      title,
      creator: cleanOmdbValue(creator),
      director: category === "movies" ? director : "",
      genre: category === "movies" ? genre : "",
      releaseYear: category === "movies" ? releaseYear : "",
      durationMinutes: category === "movies" ? durationMinutes : "",
      seasonCount: category === "tv" ? Number(cleanOmdbValue(detail.totalSeasons)) || "" : "",
      episodeCount: category === "tv" ? episodeCount : "",
      durationMinutesPerEpisode: category === "tv" ? durationMinutes : "",
      imageUrl: cleanOmdbValue(detail.Poster) || cleanOmdbValue(result.Poster),
    };
  }

  async function applyTmdbResult(result) {
    const patch = withoutPersonalNotes(await getTmdbItemPatch(result, draft));

    setDraft((current) => ({
      ...current,
      category: patch.category || current.category,
      subtype: patch.subtype || current.subtype,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      director: patch.director || current.director,
      genre: patch.genre || current.genre,
      releaseYear: patch.releaseYear || current.releaseYear,
      durationMinutes: patch.durationMinutes || current.durationMinutes,
      seasonCount: patch.seasonCount || current.seasonCount,
      episodeCount: patch.episodeCount || current.episodeCount,
      durationMinutesPerEpisode: patch.durationMinutesPerEpisode || current.durationMinutesPerEpisode,
      imageUrl: patch.imageUrl || current.imageUrl,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage(patch.subtype === "korean-movie" || patch.subtype === "kdrama" ? "Korean media details added from TMDb." : "TMDb details added. You can adjust the subtype before saving.");
  }

  async function getTmdbItemPatch(result, currentItem) {
    const url = new URL(`https://api.themoviedb.org/3/${result.mediaType}/${result.id}`);
    applyTmdbAuth(url);
    url.searchParams.set("language", result.mediaType === "movie" || result.mediaType === "tv" ? tmdbCanonicalMediaLanguage : tmdbLanguage);
    url.searchParams.set("append_to_response", "credits");

    const response = await fetch(url, getTmdbRequestOptions());
    const detail = await response.json();

    if (!response.ok) {
      throw new Error(detail.status_message || "Could not load TMDb details.");
    }

    const countries = getTmdbCountries(detail, result.mediaType);
    const isKorean = countries.includes("KR");
    const title =
      result.mediaType === "movie" || result.mediaType === "tv"
        ? cleanTmdbValue(detail.title || detail.name) || cleanTmdbValue(result.title)
        : cleanTmdbValue(result.title) || cleanTmdbValue(detail.title || detail.name);
    const creator = result.mediaType === "movie" ? getTmdbDirector(detail) : getTmdbTvDirector(detail) || getTmdbTvCreator(detail);
    const genres = detail.genres?.map((genre) => genre.name).join(", ") || "";
    const releaseYear = parseReleaseYear(result.mediaType === "movie" ? detail.release_date || result.releaseDate : "");
    const durationMinutes = result.mediaType === "movie" ? detail.runtime || "" : "";

    return {
      category: result.mediaType === "movie" ? "movies" : "tv",
      subtype:
        result.mediaType === "movie"
          ? isKorean
            ? "korean-movie"
            : currentItem.subtype || "movie"
          : isKorean
            ? "kdrama"
            : currentItem.subtype || "tv",
      title,
      creator,
      director: result.mediaType === "movie" ? creator : "",
      genre: result.mediaType === "movie" ? genres : "",
      releaseYear: result.mediaType === "movie" ? releaseYear : "",
      durationMinutes: result.mediaType === "movie" ? durationMinutes : "",
      seasonCount: result.mediaType === "tv" ? detail.number_of_seasons || "" : "",
      episodeCount: result.mediaType === "tv" ? detail.number_of_episodes || "" : "",
      durationMinutesPerEpisode: result.mediaType === "tv" ? getFirstRuntime(detail.episode_run_time) : "",
      imageUrl: getTmdbImageUrl(detail.poster_path || result.posterPath),
    };
  }

  function applyBookResult(result) {
    const patch = withoutPersonalNotes(getOpenLibraryItemPatch(result, draft));
    setDraft((current) => ({
      ...current,
      subtype: patch.subtype || current.subtype,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      pageCount: patch.pageCount || current.pageCount,
      publisher: patch.publisher || current.publisher,
      isbn: patch.isbn || current.isbn,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage(patch.subtype === "korean-book" ? "Korean book details added." : "Book details added. You can adjust the type before saving.");
  }

  function getOpenLibraryItemPatch(result, currentItem) {
    const isKoreanBook = result.languages.includes("kor");
    return {
      subtype: isKoreanBook ? "korean-book" : getDefaultSubtype("books", currentItem.subtype),
      title: result.title,
      creator: result.authors,
      imageUrl: result.imageUrl,
      pageCount: result.pageCount,
      publisher: result.publishers,
    };
  }

  function applyAladinBookResult(result) {
    const patch = withoutPersonalNotes(getAladinItemPatch(result));
    setDraft((current) => ({
      ...current,
      subtype: patch.subtype || current.subtype,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      pageCount: patch.pageCount || current.pageCount,
      publisher: patch.publisher || current.publisher,
      isbn: patch.isbn || current.isbn,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Korean book details added from Aladin.");
  }

  function getAladinItemPatch(result) {
    return {
      subtype: "korean-book",
      title: result.title,
      creator: result.authors,
      imageUrl: result.imageUrl,
      pageCount: result.pageCount,
      publisher: result.publisher,
      isbn: result.isbn13,
    };
  }

  function applyAnimeResult(result) {
    const patch = withoutPersonalNotes(getAnimeItemPatch(result));
    setDraft((current) => ({
      ...current,
      category: "tv",
      subtype: "anime",
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      seasonCount: patch.seasonCount || current.seasonCount,
      episodeCount: patch.episodeCount || current.episodeCount,
      durationMinutesPerEpisode: patch.durationMinutesPerEpisode || current.durationMinutesPerEpisode,
      studio: patch.studio || current.studio,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Anime details added from Jikan. You can edit anything before saving.");
  }

  function getAnimeItemPatch(result) {
    return {
      category: "tv",
      subtype: "anime",
      title: result.title,
      creator: result.creators,
      imageUrl: result.imageUrl,
      seasonCount: result.seasonCount,
      episodeCount: result.episodes,
      durationMinutesPerEpisode: parseOmdbRuntime(result.duration),
      studio: result.studios,
    };
  }

  function applyMangaResult(result) {
    const patch = withoutPersonalNotes(getMangaItemPatch(result));
    setDraft((current) => ({
      ...current,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      author: patch.author || current.author,
      volumeCount: patch.volumeCount || current.volumeCount,
      chapterCount: patch.chapterCount || current.chapterCount,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Manga details added from Jikan. You can edit anything before saving.");
  }

  function getMangaItemPatch(result) {
    return {
      title: result.title,
      creator: result.authors,
      imageUrl: result.imageUrl,
      author: result.authors,
      volumeCount: result.volumes,
      chapterCount: result.chapters,
    };
  }

  return (
    <main className="min-h-screen bg-[#f4f6f5] pb-28 dark:bg-stone-950 lg:pb-0">
      <AppHeader
        activeCategory={activeCategory}
        activeView={activeView}
        counts={counts}
        onGoHome={() => setActiveView("home")}
        onShowCategory={showCategory}
        onShowLibrary={showLibrary}
      />

      {storageMessage && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            {storageMessage}
          </p>
        </div>
      )}

      {activeView === "home" ? (
        <HomeView
          items={items}
          onOpenItem={startEdit}
          onStartLookup={startHomeLookup}
          searchResetToken={homeSearchResetToken}
        />
      ) : (
        <LibraryView
          activeBookSubtype={activeBookSubtype}
          activeCategory={activeCategory}
          activeMovieSubtype={activeMovieSubtype}
          activeStatus={activeStatus}
          activeTvSubtype={activeTvSubtype}
          bookSubtypeCounts={bookSubtypeCounts}
          category={category}
          counts={counts}
          items={items}
          movieSubtypeCounts={movieSubtypeCounts}
          onActiveBookSubtypeChange={setActiveBookSubtype}
          onActiveMovieSubtypeChange={setActiveMovieSubtype}
          onActiveStatusChange={setActiveStatus}
          onActiveTvSubtypeChange={setActiveTvSubtype}
          onDeleteItem={deleteItem}
          onEditItem={startEdit}
          onQueryChange={setQuery}
          onShelfViewChange={setShelfView}
          onSortOrderChange={setSortOrder}
          query={query}
          shelfView={shelfView}
          sortOrder={sortOrder}
          tvSubtypeCounts={tvSubtypeCounts}
          visibleItems={visibleItems}
        />
      )}

      {activeView === "library" && (
        <button
          className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lift transition hover:bg-teal-800 lg:inline-flex"
          onClick={startNewItem}
          type="button"
          aria-label="Add item"
          title="Add item"
        >
          <Plus size={24} />
        </button>
      )}

      {isEditorOpen && (
        <EditorSheet
          activeStatus={activeStatus}
          bookLanguage={bookLanguage}
          canUseBookLookup={canUseBookLookup}
          canUseMangaLookup={canUseMangaLookup}
          canUseOmdb={canUseOmdb}
          canUseTmdb={canUseTmdb}
          category={category}
          draft={draft}
          editingId={editingId}
          onClose={closeEditor}
          onLookupQueryChange={setLookupQuery}
          onApplyLookupResult={applyLookupResult}
          onSubmit={handleSubmit}
          onUpdateDraft={updateDraft}
          onBookLanguageChange={setBookLanguage}
          onSearchDetails={searchDetails}
          onTmdbLanguageChange={setTmdbLanguage}
          lookupMessage={lookupMessage}
          lookupProviders={lookupProviders}
          lookupQuery={lookupQuery}
          lookupResults={lookupResults}
          lookupStatus={lookupStatus}
          setActiveCategory={setActiveCategory}
          setActiveStatus={setActiveStatus}
          tmdbLanguage={tmdbLanguage}
        />
      )}

      {activeView === "library" && (
        <BottomNav
          activeCategory={activeCategory}
          onAddItem={startNewItem}
          onShowCategory={showCategory}
        />
      )}
    </main>
  );

}

function applyTmdbAuth(url) {
  if (!tmdbAccessToken && tmdbApiKey) {
    url.searchParams.set("api_key", tmdbApiKey);
  }
}

function getTmdbRequestOptions() {
  if (!tmdbAccessToken) return {};
  return {
    headers: {
      Authorization: `Bearer ${tmdbAccessToken}`,
    },
  };
}

function getTmdbSearchLanguages(mediaType, subtype, selectedLanguage) {
  const languages = [selectedLanguage || tmdbCanonicalMediaLanguage];

  if ((mediaType === "movie" && subtype === "korean-movie") || (mediaType === "tv" && subtype === "kdrama")) {
    languages.push(selectedLanguage === "ko-KR" ? tmdbCanonicalMediaLanguage : "ko-KR");
  }

  if (mediaType === "tv" && subtype === "anime") {
    languages.push(selectedLanguage === "ja-JP" ? tmdbCanonicalMediaLanguage : "ja-JP");
  }

  return [...new Set(languages)];
}

async function fetchTmdbSearchResults(searchText, mediaType, subtype, language) {
  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
  applyTmdbAuth(url);
  url.searchParams.set("query", searchText);
  url.searchParams.set("language", language);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");
  if (mediaType === "movie" && subtype === "korean-movie") {
    url.searchParams.set("region", "KR");
  }

  const response = await fetch(url, getTmdbRequestOptions());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.status_message || "TMDb lookup failed.");
  }

  return data.results || [];
}

function dedupeTmdbResults(results) {
  const seenIds = new Set();

  return results.filter((result) => {
    if (!result.id || seenIds.has(result.id)) return false;
    seenIds.add(result.id);
    return true;
  });
}

function normalizeTmdbResult(result, mediaType) {
  return {
    id: result.id,
    mediaType,
    title: mediaType === "movie" ? result.title : result.name,
    originalTitle: mediaType === "movie" ? result.original_title : result.original_name,
    posterPath: result.poster_path,
    releaseDate: mediaType === "movie" ? result.release_date : result.first_air_date,
    overview: result.overview,
    voteAverage: result.vote_average,
  };
}

function getTmdbCountries(detail, mediaType) {
  if (mediaType === "movie") {
    return (detail.production_countries || []).map((country) => country.iso_3166_1);
  }
  return detail.origin_country || [];
}

function getTmdbDirector(detail) {
  const director = detail.credits?.crew?.find((person) => person.job === "Director");
  return director?.name || "";
}

function getTmdbTvCreator(detail) {
  const creators = detail.created_by?.map((person) => person.name).filter(Boolean) || [];
  if (creators.length) return creators.join(", ");
  return detail.networks?.map((network) => network.name).filter(Boolean).join(", ") || "";
}

function getTmdbTvDirector(detail) {
  const directors = detail.credits?.crew
    ?.filter((person) => person.job === "Director")
    .map((person) => person.name)
    .filter(Boolean) || [];
  return [...new Set(directors)].slice(0, 3).join(", ");
}

function getFirstRuntime(values) {
  return normalizeOpenLibraryList(values).find(Boolean) || "";
}

function buildOpenLibraryQuery(query, language) {
  const languageFilter = language === "ko" ? "language:kor" : language === "en" ? "language:eng" : "";
  return [query, languageFilter].filter(Boolean).join(" ");
}

function normalizeOpenLibraryBookResult(doc) {
  return {
    id: doc.key,
    title: doc.title || "",
    authors: normalizeOpenLibraryList(doc.author_name).join(", "),
    firstPublishYear: doc.first_publish_year || "",
    editionCount: doc.edition_count || "",
    pageCount: doc.number_of_pages_median || "",
    languages: normalizeOpenLibraryList(doc.language),
    publishers: normalizeOpenLibraryList(doc.publisher).slice(0, 3).join(", "),
    subjects: normalizeOpenLibraryList(doc.subject).slice(0, 5).join(", "),
    imageUrl: getOpenLibraryCoverUrl(doc.cover_i),
  };
}

function normalizeJikanMangaResult(result) {
  return {
    id: result.mal_id,
    title: result.title_english || result.title || result.title_japanese || "",
    originalTitle: result.title_japanese || "",
    authors: normalizeJikanPeople(result.authors).join(", "),
    genres: normalizeJikanNamedList(result.genres).join(", "),
    themes: normalizeJikanNamedList(result.themes).join(", "),
    demographics: normalizeJikanNamedList(result.demographics).join(", "),
    published: result.published?.string || "",
    status: result.status || "",
    chapters: result.chapters || "",
    volumes: result.volumes || "",
    score: result.score || "",
    synopsis: result.synopsis || "",
    imageUrl: result.images?.jpg?.large_image_url || result.images?.jpg?.image_url || "",
  };
}

function normalizeJikanAnimeResult(result) {
  return {
    id: result.mal_id,
    title: result.title_english || result.title || result.title_japanese || "",
    originalTitle: result.title_japanese || "",
    creators: normalizeJikanNamedList(result.producers).join(", "),
    studios: normalizeJikanNamedList(result.studios).join(", "),
    genres: normalizeJikanNamedList(result.genres).join(", "),
    themes: normalizeJikanNamedList(result.themes).join(", "),
    demographics: normalizeJikanNamedList(result.demographics).join(", "),
    aired: result.aired?.string || "",
    year: result.year || "",
    season: [result.season, result.year].filter(Boolean).join(" "),
    status: result.status || "",
    episodes: result.episodes || "",
    duration: result.duration || "",
    seasonCount: result.type === "TV" ? 1 : "",
    score: result.score || "",
    synopsis: result.synopsis || "",
    imageUrl: result.images?.jpg?.large_image_url || result.images?.jpg?.image_url || "",
  };
}

function normalizeJikanPeople(value) {
  return normalizeOpenLibraryList(value).map((person) => person.name).filter(Boolean);
}

function normalizeJikanNamedList(value) {
  return normalizeOpenLibraryList(value).map((entry) => entry.name).filter(Boolean);
}

function normalizeAladinBookResult(item) {
  return {
    id: item.itemId || item.isbn13 || item.isbn || item.link,
    title: item.title || "",
    authors: item.author || "",
    publisher: item.publisher || "",
    publishedDate: item.pubDate || "",
    category: item.categoryName || "",
    pageCount: item.itemPage || item.subInfo?.itemPage || "",
    isbn13: item.isbn13 || "",
    description: item.description || "",
    imageUrl: item.cover || "",
    link: item.link || "",
  };
}

async function fetchOmdbEpisodeCount(imdbId, totalSeasons) {
  const seasonCount = Number(cleanOmdbValue(totalSeasons));
  if (!omdbApiKey || !imdbId || !seasonCount) return "";

  try {
    const seasonRequests = Array.from({ length: seasonCount }, (_, index) => {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", omdbApiKey);
      url.searchParams.set("i", imdbId);
      url.searchParams.set("Season", String(index + 1));
      return fetch(url).then((response) => response.json());
    });
    const seasons = await Promise.all(seasonRequests);
    const episodeTotal = seasons.reduce((total, season) => {
      if (season.Response === "False" || !Array.isArray(season.Episodes)) return total;
      return total + season.Episodes.length;
    }, 0);
    return episodeTotal || "";
  } catch {
    return "";
  }
}

export default App;
