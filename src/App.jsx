import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Edit3,
  Library,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Tv,
  X,
} from "lucide-react";

const categories = [
  { id: "books", label: "Books", creatorLabel: "Author", action: "Read", icon: BookOpen },
  { id: "movies", label: "Movies", creatorLabel: "Director", action: "Watch", icon: Clapperboard },
  { id: "tv", label: "TV Shows", creatorLabel: "Creator", action: "Watch", icon: Tv },
  { id: "anime", label: "Anime", creatorLabel: "Studio / Creator", action: "Watch", icon: Tv },
  { id: "manga", label: "Manga", creatorLabel: "Author / Artist", action: "Read", icon: BookOpen },
];

const statuses = ["Completed", "Want to Watch/Read"];

const omdbTypesByCategory = {
  movies: "movie",
  tv: "series",
  anime: "series",
};

const omdbApiKey = import.meta.env.VITE_OMDB_API_KEY;

const movieSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "anime-movie", label: "Anime" },
];

const completedSortOptions = [
  { value: "title", label: "Title" },
  { value: "creator", label: "Author" },
  { value: "category", label: "Category" },
  { value: "rating", label: "Rating" },
];

const defaultItems = [
  {
    id: "book-1",
    category: "books",
    status: "Completed",
    title: "Piranesi",
    creator: "Susanna Clarke",
    rating: 5,
    notes: "Dreamlike, precise, and oddly comforting.",
    imageUrl:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "movie-1",
    category: "movies",
    subtype: "movie",
    status: "Completed",
    title: "Arrival",
    creator: "Denis Villeneuve",
    rating: 5,
    notes: "A quiet sci-fi favorite with a huge emotional turn.",
    imageUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "tv-1",
    category: "tv",
    status: "Want to Watch/Read",
    title: "Severance",
    creator: "Dan Erickson",
    rating: 0,
    notes: "Start when there is room for weird corporate dread.",
    imageUrl:
      "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "anime-1",
    category: "anime",
    status: "Completed",
    title: "Frieren: Beyond Journey's End",
    creator: "Madhouse",
    rating: 5,
    notes: "Slow fantasy done with real patience.",
    imageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "manga-1",
    category: "manga",
    status: "Want to Watch/Read",
    title: "Witch Hat Atelier",
    creator: "Kamome Shirahama",
    rating: 0,
    notes: "Art looks gorgeous. Save for a quiet weekend.",
    imageUrl:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=600&q=80",
  },
];

const emptyDraft = {
  id: "",
  category: "books",
  subtype: "",
  status: "Completed",
  title: "",
  creator: "",
  rating: 3,
  notes: "",
  imageUrl: "",
};

function getStoredItems() {
  try {
    const stored = window.localStorage.getItem("media-shelf-items");
    return normalizeItems(stored ? JSON.parse(stored) : defaultItems);
  } catch {
    return normalizeItems(defaultItems);
  }
}

function normalizeItems(items) {
  return items.map((item) => ({
    ...item,
    subtype: item.category === "movies" ? item.subtype || "movie" : "",
  }));
}

function App() {
  const [items, setItems] = useState(getStoredItems);
  const [activeCategory, setActiveCategory] = useState("books");
  const [activeStatus, setActiveStatus] = useState("Completed");
  const [activeMovieSubtype, setActiveMovieSubtype] = useState("all");
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState(() => window.location.pathname);
  const [completedSort, setCompletedSort] = useState("title");
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [editingId, setEditingId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [omdbQuery, setOmdbQuery] = useState("");
  const [omdbResults, setOmdbResults] = useState([]);
  const [omdbStatus, setOmdbStatus] = useState("idle");
  const [omdbMessage, setOmdbMessage] = useState("");

  const category = categories.find((entry) => entry.id === activeCategory);
  const isCompletedRoute = route === "/completed";
  const canUseOmdb = Object.hasOwn(omdbTypesByCategory, draft.category);
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => item.category === activeCategory && item.status === activeStatus)
      .filter((item) => {
        if (activeCategory !== "movies" || activeMovieSubtype === "all") return true;
        return (item.subtype || "movie") === activeMovieSubtype;
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.creator, item.notes].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeCategory, activeMovieSubtype, activeStatus, items, query]);

  const completedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const getCategoryLabel = (item) => categories.find((entry) => entry.id === item.category)?.label || item.category;

    return items
      .filter((item) => item.status === "Completed")
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.creator, getCategoryLabel(item)].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => {
        if (completedSort === "creator") {
          return (a.creator || "").localeCompare(b.creator || "") || a.title.localeCompare(b.title);
        }
        if (completedSort === "category") {
          return getCategoryLabel(a).localeCompare(getCategoryLabel(b)) || a.title.localeCompare(b.title);
        }
        if (completedSort === "rating") {
          return Number(b.rating) - Number(a.rating) || a.title.localeCompare(b.title);
        }
        return a.title.localeCompare(b.title);
      });
  }, [completedSort, items, query]);

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

  useEffect(() => {
    window.localStorage.setItem("media-shelf-items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    function handlePopState() {
      setRoute(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      category: activeCategory,
      subtype: activeCategory === "movies" ? current.subtype || "movie" : "",
      status: activeStatus,
      rating: activeStatus === "Completed" ? current.rating || 3 : 0,
    }));
    setEditingId(null);
  }, [activeCategory, activeStatus]);

  useEffect(() => {
    setOmdbQuery("");
    setOmdbResults([]);
    setOmdbStatus("idle");
    setOmdbMessage("");
  }, [draft.category]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedTitle = draft.title.trim();
    if (!cleanedTitle) return;

    const nextItem = {
      ...draft,
      id: editingId || crypto.randomUUID(),
      title: cleanedTitle,
      creator: draft.creator.trim(),
      subtype: draft.category === "movies" ? draft.subtype || "movie" : "",
      rating: draft.status === "Completed" ? Number(draft.rating) : 0,
      notes: draft.notes.trim(),
      imageUrl: draft.imageUrl.trim(),
    };

    setItems((current) =>
      editingId ? current.map((item) => (item.id === editingId ? nextItem : item)) : [...current, nextItem],
    );
    resetForm();
    setIsEditorOpen(false);
  }

  function resetForm() {
    setDraft({
      ...emptyDraft,
      category: activeCategory,
      subtype: activeCategory === "movies" ? "movie" : "",
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
    setDraft({
      ...emptyDraft,
      category: activeCategory,
      subtype: activeCategory === "movies" ? "movie" : "",
      status: activeStatus,
      rating: activeStatus === "Completed" ? 3 : 0,
    });
    setEditingId(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    resetForm();
    setIsEditorOpen(false);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  }

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "category" && value === "movies" ? { subtype: current.subtype || "movie" } : {}),
      ...(field === "category" && value !== "movies" ? { subtype: "" } : {}),
      ...(field === "status" && value !== "Completed" ? { rating: 0 } : {}),
      ...(field === "status" && value === "Completed" ? { rating: current.rating || 3 } : {}),
    }));
  }

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function showCategory(categoryId) {
    setActiveCategory(categoryId);
    if (isCompletedRoute) navigate("/");
  }

  async function searchOmdb(event) {
    event?.preventDefault();
    const cleanedQuery = omdbQuery.trim();
    const omdbType = omdbTypesByCategory[draft.category];

    if (!omdbApiKey) {
      setOmdbStatus("error");
      setOmdbMessage("Add VITE_OMDB_API_KEY to your environment to use OMDb lookup.");
      return;
    }

    if (!cleanedQuery || !canUseOmdb) {
      setOmdbStatus("error");
      setOmdbMessage("Enter a movie, TV show, or anime title to search.");
      return;
    }

    setOmdbStatus("loading");
    setOmdbMessage("");
    setOmdbResults([]);

    try {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", omdbApiKey);
      url.searchParams.set("s", cleanedQuery);
      if (omdbType) {
        url.searchParams.set("type", omdbType);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === "False") {
        setOmdbStatus("error");
        setOmdbMessage(data.Error || "No matching OMDb results found.");
        return;
      }

      setOmdbResults((data.Search || []).slice(0, 5));
      setOmdbStatus("success");
    } catch {
      setOmdbStatus("error");
      setOmdbMessage("OMDb lookup failed. Check your connection and try again.");
    }
  }

  async function applyOmdbResult(result) {
    setOmdbStatus("loading");
    setOmdbMessage("");

    try {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", omdbApiKey);
      url.searchParams.set("i", result.imdbID);
      url.searchParams.set("plot", "short");

      const response = await fetch(url);
      const detail = await response.json();

      if (detail.Response === "False") {
        setOmdbStatus("error");
        setOmdbMessage(detail.Error || "Could not load OMDb details.");
        return;
      }

      const creator = draft.category === "movies" ? detail.Director : detail.Writer || detail.Director;
      const notes = buildOmdbNotes(detail);

      setDraft((current) => ({
        ...current,
        title: cleanOmdbValue(detail.Title) || result.Title || current.title,
        creator: cleanOmdbValue(creator) || current.creator,
        imageUrl: cleanOmdbValue(detail.Poster) || cleanOmdbValue(result.Poster) || current.imageUrl,
        notes: notes || current.notes,
      }));
      setOmdbStatus("success");
      setOmdbMessage("Details added from OMDb. You can edit anything before saving.");
    } catch {
      setOmdbStatus("error");
      setOmdbMessage("Could not apply that OMDb result.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] pb-28 sm:pb-0">
      <section className="sticky top-0 z-20 border-b border-stone-300/80 bg-[#fffaf2]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                <Library size={18} />
                Personal library
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-stone-950 sm:mt-3 sm:text-4xl">Media Shelf</h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-stone-600 sm:block">
                Keep finished favorites and future picks organized across books, movies, shows, anime, and manga.
              </p>
            </div>

            <label className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                className="h-11 w-full rounded-md border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your shelf"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                !isCompletedRoute
                  ? "border-stone-950 bg-stone-950 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
              }`}
              onClick={() => navigate("/")}
              type="button"
            >
              <Library size={17} />
              Shelf
            </button>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                isCompletedRoute
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
              }`}
              onClick={() => navigate("/completed")}
              type="button"
            >
              <CheckCircle2 size={17} />
              All completed
            </button>
          </div>

          <div className="hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((entry) => {
              const Icon = entry.icon;
              const isActive = entry.id === activeCategory;
              return (
                <button
                  key={entry.id}
                  className={`flex min-h-16 items-center justify-between rounded-md border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-teal-700 bg-teal-700 text-white shadow-lift"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                  }`}
                  onClick={() => showCategory(entry.id)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold">{entry.label}</span>
                    <span className={`mt-1 block text-xs ${isActive ? "text-teal-50" : "text-stone-500"}`}>
                      {counts[entry.id]?.Completed || 0} done
                    </span>
                  </span>
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {isCompletedRoute ? (
        <CompletedRoute
          completedItems={completedItems}
          completedSort={completedSort}
          onSortChange={setCompletedSort}
          onBack={() => navigate("/")}
        />
      ) : (
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-stone-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-950">{category.label}</h2>
              <p className="mt-1 text-sm text-stone-600">
                {counts[activeCategory]?.Completed || 0} completed,{" "}
                {counts[activeCategory]?.["Want to Watch/Read"] || 0} planned
              </p>
            </div>

            <div className="grid grid-cols-2 rounded-md border border-stone-300 bg-white p-1">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`min-h-9 rounded px-3 text-sm font-medium transition ${
                    activeStatus === status ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"
                  }`}
                  onClick={() => setActiveStatus(status)}
                  type="button"
                >
                  {status === "Completed" ? "Completed" : `Want to ${category.action}`}
                </button>
              ))}
            </div>
          </div>

          {activeCategory === "movies" && (
            <MovieSubtypeFilter
              activeSubtype={activeMovieSubtype}
              counts={movieSubtypeCounts}
              onChange={setActiveMovieSubtype}
            />
          )}

          {visibleItems.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <MediaItemCard key={item.id} item={item} onDelete={deleteItem} onEdit={startEdit} />
              ))}
            </div>
          ) : (
            <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 text-center">
              <Library className="text-stone-400" size={36} />
              <h3 className="mt-4 text-lg font-semibold text-stone-950">Nothing here yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
                Add a title to this shelf or switch categories to browse another part of your library.
              </p>
            </div>
          )}
        </div>
      </section>
      )}
      {!isCompletedRoute && (
        <button
          className="fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lift transition hover:bg-teal-800 sm:bottom-6 sm:right-6"
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
          canUseOmdb={canUseOmdb}
          category={category}
          draft={draft}
          editingId={editingId}
          onClose={closeEditor}
          onSubmit={handleSubmit}
          onUpdateDraft={updateDraft}
          omdbMessage={omdbMessage}
          omdbQuery={omdbQuery}
          omdbResults={omdbResults}
          omdbStatus={omdbStatus}
          onApplyOmdb={applyOmdbResult}
          onOmdbQueryChange={setOmdbQuery}
          onSearchOmdb={searchOmdb}
          setActiveCategory={setActiveCategory}
          setActiveStatus={setActiveStatus}
        />
      )}
      <BottomNav
        activeCategory={activeCategory}
        counts={counts}
        isCompletedRoute={isCompletedRoute}
        onNavigate={navigate}
        onShowCategory={showCategory}
      />
    </main>
  );
}

function cleanOmdbValue(value) {
  return value && value !== "N/A" ? value : "";
}

function MediaItemCard({ item, onDelete, onEdit }) {
  const subtypeLabel = item.category === "movies" && item.subtype === "anime-movie" ? "Anime movie" : "";

  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm sm:block">
      <div className="aspect-[3/4] h-full min-h-28 bg-stone-200 sm:aspect-[4/5] sm:h-auto">
        {item.imageUrl ? (
          <img className="h-full w-full object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
        ) : (
          <div className="cover-fallback flex h-full w-full items-end p-2 text-xs font-semibold text-white sm:p-4 sm:text-lg">
            {item.title}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-5 text-stone-950">{item.title}</h3>
          <p className="mt-1 truncate text-sm text-stone-600">{item.creator || "Unknown creator"}</p>
          {subtypeLabel && (
            <span className="mt-2 inline-flex rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              {subtypeLabel}
            </span>
          )}
          {item.status === "Completed" && <Rating value={item.rating} readOnly />}
          {item.notes && <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-700 sm:line-clamp-3">{item.notes}</p>}
        </div>

        <div className="flex gap-2">
          <button
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            onClick={() => onEdit(item)}
            type="button"
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            className="inline-flex h-10 w-11 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
            onClick={() => onDelete(item.id)}
            type="button"
            aria-label={`Delete ${item.title}`}
            title={`Delete ${item.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function MovieSubtypeFilter({ activeSubtype, counts, onChange }) {
  return (
    <div className="mt-4 grid grid-cols-3 rounded-md border border-stone-300 bg-white p-1">
      {movieSubtypeOptions.map((option) => (
        <button
          key={option.value}
          className={`min-h-10 rounded px-2 text-sm font-medium transition ${
            activeSubtype === option.value ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="block truncate">{option.label}</span>
          <span className={`block text-xs ${activeSubtype === option.value ? "text-teal-50" : "text-stone-400"}`}>
            {counts[option.value] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

function EditorSheet({
  activeStatus,
  canUseOmdb,
  category,
  draft,
  editingId,
  onApplyOmdb,
  onClose,
  onOmdbQueryChange,
  onSearchOmdb,
  onSubmit,
  onUpdateDraft,
  omdbMessage,
  omdbQuery,
  omdbResults,
  omdbStatus,
  setActiveCategory,
  setActiveStatus,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-stone-950/45 sm:items-center sm:justify-center">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-stone-300 bg-white p-4 shadow-lift sm:max-w-xl sm:rounded-xl sm:p-5">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:-mx-5 sm:-mt-5 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">{editingId ? "Edit item" : "Add item"}</h2>
            <p className="mt-1 text-sm text-stone-600">{category.label} / {activeStatus}</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100"
            onClick={onClose}
            type="button"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {canUseOmdb && (
            <OmdbLookup
              categoryLabel={category.label}
              message={omdbMessage}
              onApply={onApplyOmdb}
              onQueryChange={onOmdbQueryChange}
              onSearch={onSearchOmdb}
              query={omdbQuery}
              results={omdbResults}
              status={omdbStatus}
            />
          )}

          <Field label="Title">
            <input
              className="input"
              value={draft.title}
              onChange={(event) => onUpdateDraft("title", event.target.value)}
              placeholder="The Left Hand of Darkness"
              required
            />
          </Field>

          <Field label={category.creatorLabel}>
            <input
              className="input"
              value={draft.creator}
              onChange={(event) => onUpdateDraft("creator", event.target.value)}
              placeholder="Creator or author"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                className="input"
                value={draft.category}
                onChange={(event) => {
                  onUpdateDraft("category", event.target.value);
                  setActiveCategory(event.target.value);
                }}
              >
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Shelf">
              <select
                className="input"
                value={draft.status}
                onChange={(event) => {
                  onUpdateDraft("status", event.target.value);
                  setActiveStatus(event.target.value);
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {draft.category === "movies" && (
            <Field label="Movie type">
              <select
                className="input"
                value={draft.subtype || "movie"}
                onChange={(event) => onUpdateDraft("subtype", event.target.value)}
              >
                {movieSubtypeOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label === "Anime" ? "Anime movie" : "Movie"}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {draft.status === "Completed" && (
            <Field label="Rating">
              <Rating value={Number(draft.rating)} onChange={(rating) => onUpdateDraft("rating", rating)} />
            </Field>
          )}

          <Field label="Image URL">
            <input
              className="input"
              value={draft.imageUrl}
              onChange={(event) => onUpdateDraft("imageUrl", event.target.value)}
              placeholder="https://..."
              type="url"
            />
          </Field>

          <Field label="Personal notes">
            <textarea
              className="input min-h-28 resize-y py-3"
              value={draft.notes}
              onChange={(event) => onUpdateDraft("notes", event.target.value)}
              placeholder="Why it belongs here"
            />
          </Field>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
            type="submit"
          >
            {editingId ? <Save size={17} /> : <Plus size={17} />}
            {editingId ? "Save changes" : "Add to shelf"}
          </button>
        </form>
      </section>
    </div>
  );
}

function BottomNav({ activeCategory, counts, isCompletedRoute, onNavigate, onShowCategory }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_35px_rgba(31,41,55,0.12)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
        {categories.map((entry) => {
          const Icon = entry.icon;
          const isActive = !isCompletedRoute && entry.id === activeCategory;
          return (
            <button
              key={entry.id}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold transition ${
                isActive ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
              onClick={() => onShowCategory(entry.id)}
              type="button"
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{entry.label.replace("TV Shows", "TV")}</span>
              <span className={`text-[10px] ${isActive ? "text-teal-50" : "text-stone-400"}`}>
                {counts[entry.id]?.Completed || 0}
              </span>
            </button>
          );
        })}
        <button
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold transition ${
            isCompletedRoute ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
          onClick={() => onNavigate("/completed")}
          type="button"
        >
          <CheckCircle2 size={18} />
          <span>Done</span>
          <span className={`text-[10px] ${isCompletedRoute ? "text-stone-200" : "text-stone-400"}`}>All</span>
        </button>
      </div>
    </nav>
  );
}

function buildOmdbNotes(detail) {
  const lines = [
    ["Year", detail.Year],
    ["Genre", detail.Genre],
    ["Runtime", detail.Runtime],
    ["Rated", detail.Rated],
    ["IMDb", detail.imdbRating && detail.imdbRating !== "N/A" ? `${detail.imdbRating}/10` : ""],
    ["Plot", detail.Plot],
  ]
    .map(([label, value]) => [label, cleanOmdbValue(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);

  return lines.join("\n");
}

function OmdbLookup({ categoryLabel, message, onApply, onQueryChange, onSearch, query, results, status }) {
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3">
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium text-stone-700">OMDb lookup</span>
          <input
            className="input bg-white"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(event);
              }
            }}
            placeholder={`Search ${categoryLabel.toLowerCase()}`}
          />
        </label>
        <button
          className="mt-7 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Search OMDb"
          title="Search OMDb"
        >
          <Search size={17} />
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700" : "text-teal-800"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={result.imdbID}>
              <button
                className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-teal-500"
                onClick={() => onApply(result)}
                type="button"
              >
                {result.Poster && result.Poster !== "N/A" ? (
                  <img className="h-14 w-10 rounded object-cover" src={result.Poster} alt={`${result.Title} poster`} />
                ) : (
                  <div className="cover-fallback h-14 w-10 rounded" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-950">{result.Title}</span>
                  <span className="mt-1 block text-xs text-stone-600">
                    {result.Year} / {result.Type}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CompletedRoute({ completedItems, completedSort, onSortChange, onBack }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-stone-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            className="mb-4 inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={16} />
            Back to shelf
          </button>
          <h2 className="text-xl font-semibold text-stone-950">All completed</h2>
          <p className="mt-1 text-sm text-stone-600">
            {completedItems.length} finished {completedItems.length === 1 ? "title" : "titles"} across every category
          </p>
        </div>

        <label className="w-full sm:w-56">
          <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
            <ArrowUpDown size={16} />
            Sort by
          </span>
          <select className="input" value={completedSort} onChange={(event) => onSortChange(event.target.value)}>
            {completedSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {completedItems.length > 0 ? (
        <ul className="mt-5 divide-y divide-stone-200 rounded-lg border border-stone-300 bg-white shadow-sm">
          {completedItems.map((item) => (
            <li key={item.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] sm:gap-4">
              <span className="truncate text-sm font-semibold text-stone-950">{item.title}</span>
              <span className="truncate text-sm text-stone-600">{item.creator || "Unknown author"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 text-center">
          <CheckCircle2 className="text-stone-400" size={36} />
          <h3 className="mt-4 text-lg font-semibold text-stone-950">No completed titles found</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
            Clear the search or mark something complete to see it in this list.
          </p>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function Rating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex h-8 items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = rating <= value;
        const classes = filled ? "fill-amber-400 text-amber-500" : "text-stone-300";
        if (readOnly) {
          return <Star key={rating} className={classes} size={18} />;
        }

        return (
          <button
            key={rating}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-stone-400 transition hover:bg-amber-50 hover:text-amber-500"
            onClick={() => onChange(rating)}
            type="button"
            aria-label={`${rating} stars`}
            title={`${rating} stars`}
          >
            <Star className={classes} size={20} />
          </button>
        );
      })}
    </div>
  );
}

export default App;
