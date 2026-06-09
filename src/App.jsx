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
    return stored ? JSON.parse(stored) : defaultItems;
  } catch {
    return defaultItems;
  }
}

function App() {
  const [items, setItems] = useState(getStoredItems);
  const [activeCategory, setActiveCategory] = useState("books");
  const [activeStatus, setActiveStatus] = useState("Completed");
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState(() => window.location.pathname);
  const [completedSort, setCompletedSort] = useState("title");
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [editingId, setEditingId] = useState(null);

  const category = categories.find((entry) => entry.id === activeCategory);
  const isCompletedRoute = route === "/completed";
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => item.category === activeCategory && item.status === activeStatus)
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.creator, item.notes].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeCategory, activeStatus, items, query]);

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
      status: activeStatus,
      rating: activeStatus === "Completed" ? current.rating || 3 : 0,
    }));
    setEditingId(null);
  }, [activeCategory, activeStatus]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedTitle = draft.title.trim();
    if (!cleanedTitle) return;

    const nextItem = {
      ...draft,
      id: editingId || crypto.randomUUID(),
      title: cleanedTitle,
      creator: draft.creator.trim(),
      rating: draft.status === "Completed" ? Number(draft.rating) : 0,
      notes: draft.notes.trim(),
      imageUrl: draft.imageUrl.trim(),
    };

    setItems((current) =>
      editingId ? current.map((item) => (item.id === editingId ? nextItem : item)) : [...current, nextItem],
    );
    resetForm();
  }

  function resetForm() {
    setDraft({
      ...emptyDraft,
      category: activeCategory,
      status: activeStatus,
      rating: activeStatus === "Completed" ? 3 : 0,
    });
    setEditingId(null);
  }

  function startEdit(item) {
    setDraft(item);
    setEditingId(item.id);
    setActiveCategory(item.category);
    setActiveStatus(item.status);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  }

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
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

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <section className="border-b border-stone-300/80 bg-[#fffaf2]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                <Library size={18} />
                Personal library
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-stone-950 sm:text-4xl">Media Shelf</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
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

          {visibleItems.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
                  <div className="aspect-[4/5] bg-stone-200">
                    {item.imageUrl ? (
                      <img className="h-full w-full object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
                    ) : (
                      <div className="cover-fallback flex h-full w-full items-end p-4 text-lg font-semibold text-white">
                        {item.title}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold text-stone-950">{item.title}</h3>
                      <p className="mt-1 text-sm text-stone-600">{item.creator || "Unknown creator"}</p>
                    </div>

                    {item.status === "Completed" && <Rating value={item.rating} readOnly />}

                    {item.notes && <p className="line-clamp-3 text-sm leading-6 text-stone-700">{item.notes}</p>}

                    <div className="flex gap-2 pt-1">
                      <button
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                        onClick={() => startEdit(item)}
                        type="button"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        className="inline-flex h-9 w-10 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                        onClick={() => deleteItem(item.id)}
                        type="button"
                        aria-label={`Delete ${item.title}`}
                        title={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
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

        <aside className="h-fit rounded-lg border border-stone-300 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">{editingId ? "Edit item" : "Add item"}</h2>
              <p className="mt-1 text-sm text-stone-600">{category.label} / {activeStatus}</p>
            </div>
            {editingId && (
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100"
                onClick={resetForm}
                type="button"
                aria-label="Cancel editing"
                title="Cancel editing"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <Field label="Title">
              <input
                className="input"
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="The Left Hand of Darkness"
                required
              />
            </Field>

            <Field label={category.creatorLabel}>
              <input
                className="input"
                value={draft.creator}
                onChange={(event) => updateDraft("creator", event.target.value)}
                placeholder="Creator or author"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  className="input"
                  value={draft.category}
                  onChange={(event) => {
                    updateDraft("category", event.target.value);
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
                    updateDraft("status", event.target.value);
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

            {draft.status === "Completed" && (
              <Field label="Rating">
                <Rating value={Number(draft.rating)} onChange={(rating) => updateDraft("rating", rating)} />
              </Field>
            )}

            <Field label="Image URL">
              <input
                className="input"
                value={draft.imageUrl}
                onChange={(event) => updateDraft("imageUrl", event.target.value)}
                placeholder="https://..."
                type="url"
              />
            </Field>

            <Field label="Personal notes">
              <textarea
                className="input min-h-28 resize-y py-3"
                value={draft.notes}
                onChange={(event) => updateDraft("notes", event.target.value)}
                placeholder="Why it belongs here"
              />
            </Field>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
              type="submit"
            >
              {editingId ? <Save size={17} /> : <Plus size={17} />}
              {editingId ? "Save changes" : "Add to shelf"}
            </button>
          </form>
        </aside>
      </section>
      )}
    </main>
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
