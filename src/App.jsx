import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import EditorSheet from "./components/EditorSheet";
import HomeView from "./components/HomeView";
import LibraryView from "./components/LibraryView";
import MediaDetailOverlay from "./components/MediaDetailOverlay";
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
  openLibraryCanonicalBookLanguage,
  statuses,
  tvSubtypeOptions,
} from "./lib/mediaConfig";
import {
  compareShelfItems,
  dedupeLookupResults,
  getBookLookupLanguage,
  getDefaultSubtype,
  getKeywordMatchScore,
  getLocalStorageItems,
  getLookupMessage,
  getSearchTokens,
  getSelectableSubtype,
  getStoredItems,
  normalizeItems,
  rankLookupResults,
} from "./lib/mediaUtils";
import {
  fetchProviderResults,
  getAladinItemPatch,
  getAnimeItemPatch,
  getFallbackLookupProviders,
  getLookupProviders,
  getMangaItemPatch,
  getOmdbItemPatch,
  getOpenLibraryItemPatch,
  getTmdbItemPatch,
} from "./lib/mediaLookup";

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
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [tmdbLanguage, setTmdbLanguage] = useState("en-US");
  const [bookLanguage, setBookLanguage] = useState(openLibraryCanonicalBookLanguage);
  const [pendingHomeLookup, setPendingHomeLookup] = useState(null);
  const [shouldRunLookup, setShouldRunLookup] = useState(false);
  const [homeSearchResetToken, setHomeSearchResetToken] = useState(0);

  const category = categories.find((entry) => entry.id === activeCategory);
  const canUseBookLookup = draft.category === "books";
  const canUseMangaLookup = draft.category === "manga";
  const lookupProviders = getLookupProviders(draft.category, draft.subtype);
  const canUseOmdb = lookupProviders.some((provider) => provider.id === "omdb");
  const canUseTmdb = lookupProviders.some((provider) => provider.id === "tmdb");
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );
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

  function resetLookupState() {
    setLookupQuery("");
    setLookupResults([]);
    setLookupStatus("idle");
    setLookupMessage("");
  }

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
    // searchDetails intentionally reads the editor state that this effect just waited for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      synopsis: draft.synopsis.trim(),
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
    resetLookupState();
    setIsEditorOpen(true);
  }

  function openItemDetails(item) {
    setSelectedItemId(item.id);
  }

  function editItem(item) {
    setSelectedItemId(null);
    startEdit(item);
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
    resetLookupState();
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
    resetLookupState();
    setIsEditorOpen(true);
    setPendingHomeLookup({
      categoryId,
      query: cleanedQuery,
      status,
    });
  }

  function closeEditor() {
    resetForm();
    resetLookupState();
    setIsEditorOpen(false);
  }

  async function deleteItem(id) {
    try {
      if (storageMode === "supabase") await removeMediaItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
      if (editingId === id) resetForm();
    } catch {
      setStorageMessage("Could not delete from Supabase. Try again in a moment.");
    }
  }

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "category" ? { subtype: getDefaultSubtype(value, current.subtype) } : {}),
      ...(field === "status" && value !== "Completed" ? { rating: 0 } : {}),
      ...(field === "status" && value === "Completed" ? { rating: current.rating || 3 } : {}),
    }));
    if (field === "category" || field === "subtype") resetLookupState();
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
          tmdbLanguage,
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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Details added from OMDb. You can edit anything before saving.");
  }

  async function applyTmdbResult(result) {
    const patch = withoutPersonalNotes(await getTmdbItemPatch(result, draft, { tmdbLanguage }));

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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage(patch.subtype === "korean-movie" || patch.subtype === "kdrama" ? "Korean media details added from TMDb." : "TMDb details added. You can adjust the subtype before saving.");
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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage(patch.subtype === "korean-book" ? "Korean book details added." : "Book details added. You can adjust the type before saving.");
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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Korean book details added from Aladin.");
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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Anime details added from Jikan. You can edit anything before saving.");
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
      synopsis: patch.synopsis || current.synopsis,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Manga details added from Jikan. You can edit anything before saving.");
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
          key={homeSearchResetToken}
          items={items}
          onOpenItem={openItemDetails}
          onStartLookup={startHomeLookup}
        />
      ) : (
        <LibraryView
          activeBookSubtype={activeBookSubtype}
          activeCategory={activeCategory}
          activeMovieSubtype={activeMovieSubtype}
          activeShelfCounts={activeShelfCounts}
          activeStatus={activeStatus}
          activeTvSubtype={activeTvSubtype}
          bookSubtypeCounts={bookSubtypeCounts}
          category={category}
          movieSubtypeCounts={movieSubtypeCounts}
          onActiveBookSubtypeChange={setActiveBookSubtype}
          onActiveMovieSubtypeChange={setActiveMovieSubtype}
          onActiveStatusChange={setActiveStatus}
          onActiveTvSubtypeChange={setActiveTvSubtype}
          onDeleteItem={deleteItem}
          onEditItem={editItem}
          onOpenItem={openItemDetails}
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

      {selectedItem && (
        <MediaDetailOverlay
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onDelete={deleteItem}
          onEdit={editItem}
        />
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

export default App;
