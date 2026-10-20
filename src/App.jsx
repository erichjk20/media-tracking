import { useEffect, useMemo, useRef, useState } from "react";
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
import SettingsView from "./components/SettingsView";
import {
  fetchMediaItems,
  removeMediaItem,
  saveMediaItem,
} from "./lib/mediaItemsStore";
import {
  ensureUserProfile,
  getCurrentSession,
  hasPasswordRecoveryRedirect,
  isSupabaseConfigured,
  signOut,
  subscribeToAuthChanges,
  updateUserProfileDisplayName,
  updateUserNavigationShelves,
} from "./lib/supabase";
import {
  createMediaDraft,
  findDuplicateMediaItem,
  getDefaultSubtype,
  getStoredProfile,
  getStoredItems,
  localMediaItemsStorageKey,
  normalizeItems,
  prepareMediaItemForSave,
  saveStoredProfile,
} from "./lib/mediaUtils";
import { useLibraryMetrics } from "./hooks/useLibraryMetrics";
import { useMediaLookup } from "./hooks/useMediaLookup";
import { usePersistentUiState } from "./hooks/usePersistentUiState";
import { useShelfData } from "./hooks/useShelfData";
import { getFinishedDateError, getLocalDate } from "./lib/mediaDates";
import { categories } from "./lib/mediaConfig";
import { getHomeNavigationCategory, normalizeNavigationShelves } from "./lib/navigationPreferences";

function getAddLabel(categoryId) {
  if (categoryId === "books") return "book";
  if (categoryId === "movies") return "movie";
  if (categoryId === "tv") return "TV show";
  if (categoryId === "manga") return "manga";
  return "item";
}

function App() {
  const [session, setSession] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(hasPasswordRecoveryRedirect);
  const [authStatus, setAuthStatus] = useState(isSupabaseConfigured ? "loading" : "local");
  const [profile, setProfile] = useState(() => (isSupabaseConfigured ? null : getStoredProfile()));
  const [items, setItems] = useState(() => (isSupabaseConfigured ? [] : getStoredItems()));
  const [storageMode, setStorageMode] = useState(isSupabaseConfigured ? "loading" : "local");
  const [storageMessage, setStorageMessage] = useState(
    isSupabaseConfigured ? "Checking your session..." : "",
  );
  const {
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
  } = usePersistentUiState();
  const [draft, setDraft] = useState(() => createMediaDraft());
  const [editingId, setEditingId] = useState(null);
  const [editorOrigin, setEditorOrigin] = useState("library");
  const [editorMode, setEditorMode] = useState("search");
  const [editorMessage, setEditorMessage] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [completingItemId, setCompletingItemId] = useState(null);
  const [completionRating, setCompletionRating] = useState(3);
  const [completionDate, setCompletionDate] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [pendingLookupResult, setPendingLookupResult] = useState(null);
  const user = session?.user || null;
  const userId = user?.id || null;
  const userEmail = user?.email || "";
  const userDisplayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || "";
  const shouldUseSupabase = Boolean(isSupabaseConfigured && user);
  const accountGenerationRef = useRef(0);
  const currentProfile = shouldUseSupabase && profile?.id !== user.id ? null : profile;
  const navigationShelves = useMemo(() => normalizeNavigationShelves(currentProfile?.navigation_shelves), [currentProfile?.navigation_shelves]);
  const orderedCategories = useMemo(() => navigationShelves.map((id) => categories.find((entry) => entry.id === id)), [navigationShelves]);
  const libraryMetrics = useLibraryMetrics(items);
  const {
    activeShelfCounts,
    bookSubtypeCounts,
    category,
    tvSubtypeCounts,
    visibleItems,
  } = useShelfData({
    activeBookSubtype,
    activeCategory,
    activeStatus,
    activeTvSubtype,
    items,
    query,
    sortOrder,
  });
  const {
    appliedLookupSourceLabel,
    applyLookupResult,
    bookLanguage,
    canUseBookLookup,
    clearLookupResults,
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
  } = useMediaLookup({
    draft,
    isEditorOpen,
    isLookupActive: isEditorOpen || activeView === "home",
    setDraft,
  });
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId],
  );
  const lookupExistingItems = useMemo(
    () => items.filter((item) => item.category === draft.category && item.id !== editingId),
    [draft.category, editingId, items],
  );
  const completingItem = useMemo(
    () => items.find((item) => item.id === completingItemId) || null,
    [completingItemId, items],
  );
  const deletingItem = useMemo(
    () => items.find((item) => item.id === deletingItemId) || null,
    [deletingItemId, items],
  );

  useEffect(() => { accountGenerationRef.current += 1; }, [userId]);

  // Only Home requires a selected shortcut. Hidden shelves remain valid library
  // destinations when opened from Profile or restored after a recent reload.
  useEffect(() => {
    if (activeView !== "home" || isEditorOpen || (isSupabaseConfigured && !currentProfile)) return;
    const categoryId = getHomeNavigationCategory(activeCategory, navigationShelves);
    if (categoryId === activeCategory) return;
    setActiveCategory(categoryId);
    setDraft(createMediaDraft({ category: categoryId, status: activeStatus, title: lookupQuery }));
    clearLookupResults();
  }, [activeCategory, activeStatus, activeView, clearLookupResults, currentProfile, isEditorOpen, lookupQuery, navigationShelves, setActiveCategory]);

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

    const unsubscribe = subscribeToAuthChanges((nextSession, event) => {
      if (!isCurrent) return;
      setSession(nextSession);
      setAuthStatus("ready");
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
    });
    loadSession();

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (authStatus === "loading") return;

    if (!userId) {
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
          ensureUserProfile({ id: userId, email: userEmail, user_metadata: { display_name: userDisplayName } }),
          fetchMediaItems(userId),
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
  }, [authStatus, userDisplayName, userEmail, userId]);

  useEffect(() => {
    if (isSupabaseConfigured || storageMode === "loading" || storageMode === "supabase") return;
    window.localStorage.setItem(localMediaItemsStorageKey, JSON.stringify(items));
  }, [items, storageMode]);

  useEffect(() => {
    if (!pendingLookupResult || !isEditorOpen) return;
    if (draft.category !== pendingLookupResult.categoryId) return;
    if (pendingLookupResult.subtype && draft.subtype !== pendingLookupResult.subtype) return;

    const lookupResult = pendingLookupResult.lookupResult;
    setPendingLookupResult(null);
    applyLookupResult(lookupResult);
  }, [applyLookupResult, draft.category, draft.subtype, isEditorOpen, pendingLookupResult]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedTitle = draft.title.trim();
    if (!cleanedTitle) return;
    const dateError = draft.status === "Completed" ? getFinishedDateError(draft.finishedOn) : "";
    if (dateError) {
      setEditorMessage(dateError);
      return;
    }
    const originalItem = editingId ? items.find((item) => item.id === editingId) : null;
    try {
      const nextItem = prepareMediaItemForSave({ draft, editingId, originalItem });
      const duplicateItem = findDuplicateMediaItem(items, nextItem, editingId);
      if (duplicateItem) {
        setEditorMessage(`"${nextItem.title}" is already in your ${category.label.toLowerCase()} shelf.`);
        return;
      }
      const savedItem = shouldUseSupabase ? await saveMediaItem(nextItem, user.id) : nextItem;

      setItems((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? savedItem : item))
          : [...current, savedItem],
      );
      if (!editingId && editorOrigin === "home") {
        setActiveCategory(savedItem.category);
        setActiveView("library");
      }
      resetForm();
      setIsEditorOpen(false);
      setEditorOrigin("library");
      setEditorMode("search");
    } catch (error) {
      console.error("Supabase save failed", error);
      setEditorMessage(`Could not save to your private library. ${error.message || ""}`.trim());
    }
  }

  function createActiveShelfDraft({ title = "" } = {}) {
    const subtype = activeCategory === "tv" ? activeTvSubtype : activeCategory === "books" ? activeBookSubtype : "";

    return createMediaDraft({
      category: activeCategory,
      status: activeStatus,
      subtype,
      title,
    });
  }

  function resetForm() {
    setDraft(createActiveShelfDraft());
    setEditingId(null);
    setEditorMessage("");
  }

  function startEdit(item) {
    setDraft(normalizeItems([item])[0]);
    setEditingId(item.id);
    setActiveCategory(item.category);
    setActiveStatus(item.status);
    setEditorOrigin("library");
    setEditorMode("search");
    setEditorMessage("");
    resetLookupState();
    setIsEditorOpen(true);
  }

  function openExistingItemFromLookup(item) {
    startEdit(item);
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
    setCompletionDate(getLocalDate());
    setCompletionError("");
    setCompletingItemId(item.id);
  }

  function closeCompleteDialog() {
    setCompletingItemId(null);
    setCompletionRating(3);
    setCompletionDate("");
    setCompletionError("");
  }

  async function completeItem() {
    if (!completingItem) return;
    const dateError = getFinishedDateError(completionDate);
    if (dateError) {
      setCompletionError(dateError);
      return;
    }

    const completedItem = {
      ...completingItem,
      status: "Completed",
      statusChangedAt: new Date().toISOString(),
      finishedOn: completionDate,
      rating: Number(completionRating) || 3,
    };

    try {
      const savedItem = shouldUseSupabase ? await saveMediaItem(completedItem, user.id) : completedItem;
      setItems((current) => current.map((item) => (item.id === completingItem.id ? savedItem : item)));
      closeCompleteDialog();
    } catch (error) {
      console.error("Supabase completion save failed", error);
      setCompletionError(`Could not save to your private library. ${error.message || ""}`.trim());
    }
  }

  function startAddItem(mode = "search") {
    setDraft(createActiveShelfDraft());
    setEditingId(null);
    setEditorOrigin("library");
    setEditorMode(mode);
    setEditorMessage("");
    resetLookupState();
    setIsEditorOpen(true);
  }

  function closeEditor() {
    resetForm();
    resetLookupState();
    setEditorMessage("");
    setIsEditorOpen(false);
    setEditorOrigin("library");
    setEditorMode("search");
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

  function handlePasswordUpdated() {
    setIsPasswordRecovery(false);
  }

  async function handleSignOut() {
    await signOut();
  }

  async function handleSaveDisplayName(displayName) {
    const cleanedName = displayName.trim();
    if (!cleanedName) throw new Error("Add a display name first.");

    if (shouldUseSupabase) {
      const nextProfile = await updateUserProfileDisplayName(user.id, cleanedName);
      setProfile((current) => current?.id === nextProfile.id ? nextProfile : current);
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

  async function handleSaveNavigationShelves(shelves) {
    const nextShelves = normalizeNavigationShelves(shelves);
    const generation = accountGenerationRef.current;
    const nextProfile = shouldUseSupabase
      ? await updateUserNavigationShelves(user.id, nextShelves)
      : { ...profile, navigation_shelves: nextShelves, updated_at: new Date().toISOString() };
    if (generation !== accountGenerationRef.current) return;
    if (!shouldUseSupabase) saveStoredProfile(nextProfile);
    setProfile((current) => current?.id === nextProfile.id ? nextProfile : current);
    const categoryId = getHomeNavigationCategory(activeCategory, nextShelves);
    if (categoryId !== activeCategory) {
      setActiveCategory(categoryId);
      setDraft(createMediaDraft({ category: categoryId, status: activeStatus }));
      clearLookupResults();
    }
  }

  function updateDraft(field, value) {
    setEditorMessage("");
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "category" ? { subtype: getDefaultSubtype(value, current.subtype) } : {}),
      ...(field === "status" && value !== "Completed" ? { rating: 0, finishedOn: "" } : {}),
      ...(field === "status" && value === "Completed" ? {
        rating: current.rating || 3,
        finishedOn: current.status === "Completed" ? current.finishedOn : editingId ? getLocalDate() : "",
      } : {}),
    }));
    if (field === "category" || field === "subtype") resetLookupState();
  }

  function showLibrary() {
    setShelfView("grid");
    setActiveView("library");
  }

  function showHome() {
    setSelectedItemId(null);
    setCompletingItemId(null);
    setDeletingItemId(null);
    const categoryId = getHomeNavigationCategory(activeCategory, navigationShelves);
    if (categoryId !== activeCategory) changeHomeCategory(categoryId);
    setActiveView("home");
  }

  function showProfile() {
    setActiveView("profile");
  }

  function showCategory(categoryId) {
    showLibrary();
    setActiveCategory(categoryId);
  }

  function startHomeLookup({ categoryId, query: homeQuery }) {
    const subtype = getDefaultSubtype(categoryId);

    setActiveCategory(categoryId);
    setDraft(createMediaDraft({
      category: categoryId,
      subtype,
      status: activeStatus,
      title: homeQuery,
    }));
    setEditingId(null);
    setEditorOrigin("home");
    setEditorMode("search");
    setEditorMessage("");
    resetLookupState();
    queueLookup({
      categoryId,
      query: homeQuery,
      status: activeStatus,
      subtype,
    });
    setIsEditorOpen(true);
  }

  function updateHomeLookupQuery(homeQuery) {
    const subtype = getDefaultSubtype(activeCategory);

    setLookupQuery(homeQuery);
    setDraft(createMediaDraft({
      category: activeCategory,
      subtype,
      status: activeStatus,
      title: homeQuery,
    }));
  }

  function changeHomeCategory(categoryId) {
    const subtype = getDefaultSubtype(categoryId);

    setActiveCategory(categoryId);
    setDraft(createMediaDraft({
      category: categoryId,
      subtype,
      status: activeStatus,
      title: lookupQuery,
    }));
    clearLookupResults();
  }

  function startHomeLookupFromSuggestion({ categoryId, lookupResult, query: homeQuery }) {
    const subtype = getDefaultSubtype(categoryId);

    setActiveCategory(categoryId);
    setDraft(createMediaDraft({
      category: categoryId,
      subtype,
      status: activeStatus,
      title: homeQuery,
    }));
    setEditingId(null);
    setEditorOrigin("home");
    setEditorMode("search");
    setEditorMessage("");
    resetLookupState();
    setPendingLookupResult({ categoryId, lookupResult, subtype });
    setIsEditorOpen(true);
  }

  if (isSupabaseConfigured && (authStatus === "loading" || (user && storageMode !== "error" && !currentProfile))) {
    return (
      <main className="app-screen flex items-center justify-center bg-[#0f0e0d] px-4 text-stone-100">
        <p className="text-sm font-semibold text-stone-400">Loading shelvd...</p>
      </main>
    );
  }

  if (isSupabaseConfigured && (isPasswordRecovery || !user)) {
    return (
      <AuthView
        isPasswordRecovery={isPasswordRecovery}
        onPasswordUpdated={handlePasswordUpdated}
      />
    );
  }

  return (
    <>
      <main className={`app-screen bg-transparent ${activeView === "home" ? "" : "app-shell"}`}>
        {activeView !== "home" && (
          <AppHeader
            activeView={activeView}
            onHomeClick={showHome}
            onShowProfile={showProfile}
          />
        )}

        {storageMessage && (
          <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-200">
              {storageMessage}
            </p>
          </div>
        )}

        {activeView === "home" ? (
          <HomeView
            orderedCategories={orderedCategories}
            activeCategory={activeCategory}
            lookupMessage={lookupMessage}
            lookupResults={lookupResults}
            lookupStatus={lookupStatus}
            onBrowseLibrary={showLibrary}
            onCategoryChange={changeHomeCategory}
            onQueryChange={updateHomeLookupQuery}
            onSearch={startHomeLookup}
            onSuggestionSelect={startHomeLookupFromSuggestion}
            query={lookupQuery}
          />
        ) : activeView === "profile" ? (
          <ProfileView
            key={user?.id || "local"}
            metrics={libraryMetrics}
            onOpenItem={openItemDetails}
            onShowSettings={() => setActiveView("settings")}
            onShowCategory={showCategory}
            profile={currentProfile}
            user={user}
          />
        ) : activeView === "settings" ? (
          <SettingsView
            key={user?.id || "local"}
            onBack={showProfile}
            onSaveDisplayName={handleSaveDisplayName}
            onSaveNavigationShelves={handleSaveNavigationShelves}
            navigationShelves={navigationShelves}
            onSignOut={handleSignOut}
            profile={currentProfile}
            user={user}
          />
        ) : (
          <LibraryView
            activeBookSubtype={activeBookSubtype}
            activeCategory={activeCategory}
            activeShelfCounts={activeShelfCounts}
            activeStatus={activeStatus}
            activeTvSubtype={activeTvSubtype}
            bookSubtypeCounts={bookSubtypeCounts}
            category={category}
            onActiveBookSubtypeChange={setActiveBookSubtype}
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
            errorMessage={completionError}
            finishedOn={completionDate}
            onClose={closeCompleteDialog}
            onConfirm={completeItem}
            onRatingChange={setCompletionRating}
            onFinishedOnChange={(value) => {
              setCompletionDate(value);
              setCompletionError("");
            }}
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
            appliedLookupSourceLabel={appliedLookupSourceLabel}
            bookLanguage={bookLanguage}
            canUseBookLookup={canUseBookLookup}
            category={category}
            draft={draft}
            editingId={editingId}
            editorMessage={editorMessage}
            editorMode={editorMode}
            existingItems={lookupExistingItems}
            onClose={closeEditor}
            onLookupQueryChange={setLookupQuery}
            onOpenExistingItem={openExistingItemFromLookup}
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
      </main>

      {activeView !== "home" && (
        <BottomNav
          orderedCategories={orderedCategories}
          activeCategory={activeCategory}
          activeView={activeView}
          addLabel={getAddLabel(activeCategory)}
          onAddManualClick={activeView === "library" && !isEditorOpen && !selectedItem ? () => startAddItem("manual") : undefined}
          onAddSearchClick={activeView === "library" && !isEditorOpen && !selectedItem ? () => startAddItem("search") : undefined}
          onShowCategory={showCategory}
        />
      )}
    </>
  );

}

export default App;
