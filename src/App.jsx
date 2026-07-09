import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AppHeader from "./components/AppHeader";
import AuthView from "./components/AuthView";
import BottomNav from "./components/BottomNav";
import CompleteItemDialog from "./components/CompleteItemDialog";
import DeleteItemDialog from "./components/DeleteItemDialog";
import EditorSheet from "./components/EditorSheet";
import HomeView from "./components/HomeView";
import LibraryView from "./components/LibraryView";
import MediaDetailOverlay from "./components/MediaDetailOverlay";
import ProfileView from "./components/ProfileView";
import {
  fetchMediaItems,
  removeMediaItem,
  saveMediaItem,
} from "./lib/mediaItemsStore";
import {
  ensureUserProfile,
  getCurrentSession,
  isSupabaseConfigured,
  signOut,
  subscribeToAuthChanges,
  updateUserProfileDisplayName,
} from "./lib/supabase";
import {
  createMediaDraft,
  getDefaultSubtype,
  getStoredProfile,
  getStoredItems,
  normalizeItems,
  saveStoredProfile,
} from "./lib/mediaUtils";
import { useLibraryMetrics } from "./hooks/useLibraryMetrics";
import { useMediaLookup } from "./hooks/useMediaLookup";
import { useShelfData } from "./hooks/useShelfData";

function App() {
  const [session, setSession] = useState(null);
  const [authStatus, setAuthStatus] = useState(isSupabaseConfigured ? "loading" : "local");
  const [profile, setProfile] = useState(() => (isSupabaseConfigured ? null : getStoredProfile()));
  const [items, setItems] = useState(() => (isSupabaseConfigured ? [] : getStoredItems()));
  const [storageMode, setStorageMode] = useState(isSupabaseConfigured ? "loading" : "local");
  const [storageMessage, setStorageMessage] = useState(
    isSupabaseConfigured ? "Checking your session..." : "",
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
  const [draft, setDraft] = useState(() => createMediaDraft());
  const [editingId, setEditingId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [completingItemId, setCompletingItemId] = useState(null);
  const [completionRating, setCompletionRating] = useState(3);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [homeSearchResetToken, setHomeSearchResetToken] = useState(0);
  const user = session?.user || null;
  const shouldUseSupabase = Boolean(isSupabaseConfigured && user);
  const libraryMetrics = useLibraryMetrics(items);
  const {
    activeShelfCounts,
    bookSubtypeCounts,
    category,
    counts,
    movieSubtypeCounts,
    tvSubtypeCounts,
    visibleItems,
  } = useShelfData({
    activeBookSubtype,
    activeCategory,
    activeMovieSubtype,
    activeStatus,
    activeTvSubtype,
    items,
    query,
    sortOrder,
  });
  const {
    applyLookupResult,
    bookLanguage,
    canUseBookLookup,
    lookupMessage,
    lookupProviders,
    lookupQuery,
    lookupResults,
    lookupStatus,
    queueLookup,
    resetLookupState,
    searchDetails,
    setBookLanguage,
    setLookupQuery,
  } = useMediaLookup({ draft, isEditorOpen, setDraft });
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );
  const completingItem = useMemo(
    () => items.find((item) => item.id === completingItemId) || null,
    [completingItemId, items],
  );
  const deletingItem = useMemo(
    () => items.find((item) => item.id === deletingItemId) || null,
    [deletingItemId, items],
  );

  useEffect(() => {
    setActiveView("home");
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isCurrent = true;

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession();
        if (!isCurrent) return;
        setSession(currentSession);
        setAuthStatus("ready");
        setStorageMessage("");
      } catch (error) {
        console.error("Supabase session load failed", error);
        if (!isCurrent) return;
        setAuthStatus("ready");
        setStorageMessage(`Could not check your session. ${error.message || ""}`.trim());
      }
    }

    loadSession();
    const unsubscribe = subscribeToAuthChanges((nextSession) => {
      if (!isCurrent) return;
      setSession(nextSession);
      setAuthStatus("ready");
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (authStatus === "loading") return;

    if (!user) {
      setItems([]);
      setProfile(null);
      setStorageMode("signed-out");
      setStorageMessage("");
      setSelectedItemId(null);
      setCompletingItemId(null);
      setDeletingItemId(null);
      setIsEditorOpen(false);
      return;
    }

    let isCurrent = true;

    async function loadUserLibrary() {
      setItems([]);
      setProfile(null);
      setStorageMode("loading");
      setStorageMessage("Loading your library...");

      try {
        const [profileData, databaseItems] = await Promise.all([
          ensureUserProfile(user),
          fetchMediaItems(user.id),
        ]);

        if (!isCurrent) return;
        setProfile(profileData);
        setItems(normalizeItems(databaseItems));
        setStorageMode("supabase");
        setStorageMessage("");
      } catch (error) {
        console.error("Supabase library load failed", error);
        if (!isCurrent) return;
        setItems([]);
        setProfile(null);
        setStorageMode("error");
        setStorageMessage(`Could not load your private library. ${error.message || ""}`.trim());
      }
    }

    loadUserLibrary();

    return () => {
      isCurrent = false;
    };
  }, [authStatus, user]);

  useEffect(() => {
    if (isSupabaseConfigured || storageMode === "loading" || storageMode === "supabase") return;
    window.localStorage.setItem("media-shelf-items", JSON.stringify(items));
  }, [items, storageMode]);

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
      const savedItem = shouldUseSupabase ? await saveMediaItem(nextItem, user.id) : nextItem;

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
      setStorageMessage(`Could not save to your private library. ${error.message || ""}`.trim());
    }
  }

  function resetForm() {
    const subtype = activeCategory === "tv" ? activeTvSubtype : activeCategory === "movies" ? activeMovieSubtype : activeCategory === "books" ? activeBookSubtype : "";

    setDraft(createMediaDraft({
      category: activeCategory,
      subtype,
      status: activeStatus,
    }));
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

  function startCompleteItem(item) {
    setCompletionRating(Number(item.rating) || 3);
    setCompletingItemId(item.id);
  }

  function closeCompleteDialog() {
    setCompletingItemId(null);
    setCompletionRating(3);
  }

  async function completeItem() {
    if (!completingItem) return;

    const completedItem = {
      ...completingItem,
      status: "Completed",
      rating: Number(completionRating) || 3,
    };

    try {
      const savedItem = shouldUseSupabase ? await saveMediaItem(completedItem, user.id) : completedItem;
      setItems((current) => current.map((item) => (item.id === completingItem.id ? savedItem : item)));
      closeCompleteDialog();
    } catch (error) {
      console.error("Supabase completion save failed", error);
      setStorageMessage(`Could not save to your private library. ${error.message || ""}`.trim());
    }
  }

  function startNewItem() {
    const subtype = activeCategory === "tv" ? activeTvSubtype : activeCategory === "movies" ? activeMovieSubtype : activeCategory === "books" ? activeBookSubtype : "";

    setDraft(createMediaDraft({
      category: activeCategory,
      subtype,
      status: activeStatus,
    }));
    setEditingId(null);
    resetLookupState();
    setIsEditorOpen(true);
  }

  function startHomeLookup({ categoryId, query: homeQuery, status, subtype = "" }) {
    const cleanedQuery = homeQuery.trim();
    const selectedSubtype = getDefaultSubtype(categoryId, subtype);

    setActiveCategory(categoryId);
    setActiveStatus(status);
    setDraft(createMediaDraft({
      category: categoryId,
      subtype: selectedSubtype,
      status,
      title: cleanedQuery,
    }));
    setEditingId(null);
    resetLookupState();
    setIsEditorOpen(true);
    queueLookup({
      categoryId,
      query: cleanedQuery,
      status,
      subtype: selectedSubtype,
    });
  }

  function closeEditor() {
    resetForm();
    resetLookupState();
    setIsEditorOpen(false);
  }

  function requestDeleteItem(id) {
    setDeletingItemId(id);
  }

  function closeDeleteDialog() {
    setDeletingItemId(null);
  }

  async function confirmDeleteItem() {
    if (!deletingItem) return;

    await deleteItem(deletingItem.id);
    setDeletingItemId(null);
  }

  async function deleteItem(id) {
    try {
      if (shouldUseSupabase) await removeMediaItem(id, user.id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
      if (editingId === id) resetForm();
    } catch {
      setStorageMessage("Could not delete from Supabase. Try again in a moment.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      setStorageMessage(`Could not sign out. ${error.message || ""}`.trim());
    }
  }

  async function handleSaveDisplayName(displayName) {
    const cleanedName = displayName.trim();
    if (!cleanedName) throw new Error("Add a display name first.");

    if (shouldUseSupabase) {
      const nextProfile = await updateUserProfileDisplayName(user.id, cleanedName);
      setProfile(nextProfile);
      return nextProfile;
    }

    const nextProfile = {
      ...(profile || { id: "local", email: "" }),
      display_name: cleanedName,
      updated_at: new Date().toISOString(),
    };
    saveStoredProfile(nextProfile);
    setProfile(nextProfile);
    return nextProfile;
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

  function showProfile() {
    setActiveView("profile");
  }

  function showCategory(categoryId) {
    showLibrary();
    setActiveCategory(categoryId);
  }

  if (isSupabaseConfigured && authStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0e0d] px-4 text-stone-100">
        <p className="text-sm font-semibold text-stone-400">Loading shelvd...</p>
      </main>
    );
  }

  if (isSupabaseConfigured && !user) {
    return <AuthView />;
  }

  return (
    <main className="min-h-screen bg-transparent pb-28 lg:pb-0">
      <AppHeader
        activeCategory={activeCategory}
        activeView={activeView}
        counts={counts}
        profile={profile}
        user={user}
        onGoHome={() => setActiveView("home")}
        onShowCategory={showCategory}
        onShowLibrary={showLibrary}
        onShowProfile={showProfile}
        onSignOut={handleSignOut}
      />

      {storageMessage && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-200">
            {storageMessage}
          </p>
        </div>
      )}

      {activeView === "home" ? (
        <HomeView
          key={homeSearchResetToken}
          onStartLookup={startHomeLookup}
        />
      ) : activeView === "profile" ? (
        <ProfileView
          metrics={libraryMetrics}
          onOpenItem={openItemDetails}
          onSaveDisplayName={handleSaveDisplayName}
          onShowCategory={showCategory}
          profile={profile}
          user={user}
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
          onCompleteItem={startCompleteItem}
          onDeleteItem={requestDeleteItem}
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
          className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-shelf-accent-deep text-white shadow-lift transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 lg:inline-flex"
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
          onComplete={startCompleteItem}
          onDelete={requestDeleteItem}
          onEdit={editItem}
        />
      )}

      {completingItem && (
        <CompleteItemDialog
          item={completingItem}
          onClose={closeCompleteDialog}
          onConfirm={completeItem}
          onRatingChange={setCompletionRating}
          rating={completionRating}
        />
      )}

      {deletingItem && (
        <DeleteItemDialog
          item={deletingItem}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteItem}
        />
      )}

      {isEditorOpen && (
        <EditorSheet
          activeStatus={activeStatus}
          bookLanguage={bookLanguage}
          canUseBookLookup={canUseBookLookup}
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
          lookupMessage={lookupMessage}
          lookupProviders={lookupProviders}
          lookupQuery={lookupQuery}
          lookupResults={lookupResults}
          lookupStatus={lookupStatus}
          setActiveCategory={setActiveCategory}
          setActiveStatus={setActiveStatus}
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
