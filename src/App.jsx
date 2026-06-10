import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Clapperboard,
  Edit3,
  LayoutGrid,
  Library,
  List as ListIcon,
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

const statusLabels = {
  Completed: "Done",
  "Want to Watch/Read": "Want",
};

const omdbTypesByCategory = {
  movies: "movie",
  tv: "series",
  anime: "series",
};

const omdbApiKey = import.meta.env.VITE_OMDB_API_KEY;
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbAccessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

const movieSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "anime-movie", label: "Anime" },
  { value: "korean-movie", label: "Korean" },
];

const bookSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "book", label: "Books" },
  { value: "korean-book", label: "Korean" },
];

const tvSubtypeOptions = [
  { value: "all", label: "All" },
  { value: "tv", label: "TV" },
  { value: "kdrama", label: "K-Drama" },
];

const defaultItems = [
  {
    id: "book-1",
    category: "books",
    subtype: "book",
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
    subtype: getDefaultSubtype(item.category, item.subtype),
  }));
}

function getDefaultSubtype(category, subtype = "") {
  if (category === "books") return bookSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "book";
  if (category === "movies") return movieSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "movie";
  if (category === "tv") return tvSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "tv";
  return "";
}

function App() {
  const [items, setItems] = useState(getStoredItems);
  const [activeCategory, setActiveCategory] = useState("books");
  const [activeStatus, setActiveStatus] = useState("Completed");
  const [activeBookSubtype, setActiveBookSubtype] = useState("all");
  const [activeMovieSubtype, setActiveMovieSubtype] = useState("all");
  const [activeTvSubtype, setActiveTvSubtype] = useState("all");
  const [shelfView, setShelfView] = useState("list");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [editingId, setEditingId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [omdbQuery, setOmdbQuery] = useState("");
  const [omdbResults, setOmdbResults] = useState([]);
  const [omdbStatus, setOmdbStatus] = useState("idle");
  const [omdbMessage, setOmdbMessage] = useState("");
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbLanguage, setTmdbLanguage] = useState("en-US");
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbStatus, setTmdbStatus] = useState("idle");
  const [tmdbMessage, setTmdbMessage] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [bookLanguage, setBookLanguage] = useState("all");
  const [bookResults, setBookResults] = useState([]);
  const [bookStatus, setBookStatus] = useState("idle");
  const [bookMessage, setBookMessage] = useState("");
  const [aladinQuery, setAladinQuery] = useState("");
  const [aladinResults, setAladinResults] = useState([]);
  const [aladinStatus, setAladinStatus] = useState("idle");
  const [aladinMessage, setAladinMessage] = useState("");
  const [mangaQuery, setMangaQuery] = useState("");
  const [mangaResults, setMangaResults] = useState([]);
  const [mangaStatus, setMangaStatus] = useState("idle");
  const [mangaMessage, setMangaMessage] = useState("");

  const category = categories.find((entry) => entry.id === activeCategory);
  const canUseOmdb = Object.hasOwn(omdbTypesByCategory, draft.category);
  const canUseTmdb = draft.category === "movies" || draft.category === "tv";
  const canUseBookLookup = draft.category === "books";
  const canUseMangaLookup = draft.category === "manga";
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => item.category === activeCategory && item.status === activeStatus)
      .filter((item) => {
        if (activeCategory !== "books" || activeBookSubtype === "all") return true;
        return (item.subtype || "book") === activeBookSubtype;
      })
      .filter((item) => {
        if (activeCategory !== "movies" || activeMovieSubtype === "all") return true;
        return (item.subtype || "movie") === activeMovieSubtype;
      })
      .filter((item) => {
        if (activeCategory !== "tv" || activeTvSubtype === "all") return true;
        return (item.subtype || "tv") === activeTvSubtype;
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.creator, item.notes].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeBookSubtype, activeCategory, activeMovieSubtype, activeStatus, activeTvSubtype, items, query]);

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
    window.localStorage.setItem("media-shelf-items", JSON.stringify(items));
  }, [items]);

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
    setOmdbQuery("");
    setOmdbResults([]);
    setOmdbStatus("idle");
    setOmdbMessage("");
    setTmdbQuery("");
    setTmdbResults([]);
    setTmdbStatus("idle");
    setTmdbMessage("");
    setBookQuery("");
    setBookResults([]);
    setBookStatus("idle");
    setBookMessage("");
    setAladinQuery("");
    setAladinResults([]);
    setAladinStatus("idle");
    setAladinMessage("");
    setMangaQuery("");
    setMangaResults([]);
    setMangaStatus("idle");
    setMangaMessage("");
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
      subtype: getDefaultSubtype(draft.category, draft.subtype),
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
      subtype: getDefaultSubtype(activeCategory),
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
      subtype: getDefaultSubtype(activeCategory),
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
      ...(field === "category" ? { subtype: getDefaultSubtype(value, current.subtype) } : {}),
      ...(field === "status" && value !== "Completed" ? { rating: 0 } : {}),
      ...(field === "status" && value === "Completed" ? { rating: current.rating || 3 } : {}),
    }));
  }

  function showCategory(categoryId) {
    setActiveCategory(categoryId);
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
      setOmdbResults([]);
      setOmdbMessage("Details added from OMDb. You can edit anything before saving.");
    } catch {
      setOmdbStatus("error");
      setOmdbMessage("Could not apply that OMDb result.");
    }
  }

  async function searchTmdb(event) {
    event?.preventDefault();
    const cleanedQuery = tmdbQuery.trim();
    const mediaType = draft.category === "movies" ? "movie" : draft.category === "tv" ? "tv" : "";

    if (!tmdbAccessToken && !tmdbApiKey) {
      setTmdbStatus("error");
      setTmdbMessage("Add VITE_TMDB_ACCESS_TOKEN or VITE_TMDB_API_KEY to use Korean media lookup.");
      return;
    }

    if (!cleanedQuery || !mediaType) {
      setTmdbStatus("error");
      setTmdbMessage("Enter an English or Korean title to search.");
      return;
    }

    setTmdbStatus("loading");
    setTmdbMessage("");
    setTmdbResults([]);

    try {
      const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
      applyTmdbAuth(url);
      url.searchParams.set("query", cleanedQuery);
      url.searchParams.set("language", tmdbLanguage);
      url.searchParams.set("include_adult", "false");
      url.searchParams.set("page", "1");
      if (mediaType === "movie") {
        url.searchParams.set("region", "KR");
      }

      const response = await fetch(url, getTmdbRequestOptions());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.status_message || "TMDb lookup failed.");
      }

      const results = (data.results || [])
        .filter((result) => result.poster_path || result.title || result.name || result.original_title || result.original_name)
        .slice(0, 8)
        .map((result) => normalizeTmdbResult(result, mediaType));

      if (!results.length) {
        setTmdbStatus("error");
        setTmdbMessage("No TMDb results found.");
        return;
      }

      setTmdbResults(results);
      setTmdbStatus("success");
    } catch (error) {
      setTmdbStatus("error");
      setTmdbMessage(error.message || "TMDb lookup failed. Check your key and try again.");
    }
  }

  async function applyTmdbResult(result) {
    setTmdbStatus("loading");
    setTmdbMessage("");

    try {
      const url = new URL(`https://api.themoviedb.org/3/${result.mediaType}/${result.id}`);
      applyTmdbAuth(url);
      url.searchParams.set("language", tmdbLanguage);
      url.searchParams.set("append_to_response", "credits");

      const response = await fetch(url, getTmdbRequestOptions());
      const detail = await response.json();

      if (!response.ok) {
        throw new Error(detail.status_message || "Could not load TMDb details.");
      }

      const isKorean = getTmdbCountries(detail, result.mediaType).includes("KR");
      const title = cleanTmdbValue(result.title) || cleanTmdbValue(detail.title || detail.name);
      const originalTitle = cleanTmdbValue(result.originalTitle) || cleanTmdbValue(detail.original_title || detail.original_name);
      const creator = result.mediaType === "movie" ? getTmdbDirector(detail) : getTmdbTvCreator(detail);
      const notes = buildTmdbNotes(detail, result.mediaType, originalTitle);

      setDraft((current) => ({
        ...current,
        category: result.mediaType === "movie" ? "movies" : "tv",
        subtype:
          result.mediaType === "movie"
            ? isKorean
              ? "korean-movie"
              : current.subtype || "movie"
            : isKorean
              ? "kdrama"
              : current.subtype || "tv",
        title: title || current.title,
        creator: creator || current.creator,
        imageUrl: getTmdbImageUrl(detail.poster_path || result.posterPath) || current.imageUrl,
        notes: notes || current.notes,
      }));
      setTmdbStatus("success");
      setTmdbResults([]);
      setTmdbMessage(isKorean ? "Korean media details added from TMDb." : "TMDb details added. You can adjust the subtype before saving.");
    } catch (error) {
      setTmdbStatus("error");
      setTmdbMessage(error.message || "Could not apply that TMDb result.");
    }
  }

  async function searchBooks(event) {
    event?.preventDefault();
    const cleanedQuery = bookQuery.trim();

    if (!cleanedQuery || !canUseBookLookup) {
      setBookStatus("error");
      setBookMessage("Enter an English or Korean book title to search.");
      return;
    }

    setBookStatus("loading");
    setBookMessage("");
    setBookResults([]);

    try {
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("q", buildOpenLibraryQuery(cleanedQuery, bookLanguage));
      url.searchParams.set(
        "fields",
        "key,title,author_name,first_publish_year,cover_i,language,publisher,subject,edition_count",
      );
      url.searchParams.set("limit", "8");
      if (bookLanguage !== "all") {
        url.searchParams.set("lang", bookLanguage);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Open Library lookup failed.");
      }

      const results = (data.docs || [])
        .map(normalizeOpenLibraryBookResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 8);

      if (!results.length) {
        setBookStatus("error");
        setBookMessage("No Open Library results found.");
        return;
      }

      setBookResults(results);
      setBookStatus("success");
    } catch (error) {
      setBookStatus("error");
      setBookMessage(error.message || "Open Library lookup failed. Check your connection and try again.");
    }
  }

  function applyBookResult(result) {
    const isKoreanBook = result.languages.includes("kor");
    setDraft((current) => ({
      ...current,
      subtype: isKoreanBook ? "korean-book" : getDefaultSubtype("books", current.subtype),
      title: result.title || current.title,
      creator: result.authors || current.creator,
      imageUrl: result.imageUrl || current.imageUrl,
      notes: buildOpenLibraryBookNotes(result) || current.notes,
    }));
    setBookStatus("success");
    setBookResults([]);
    setBookMessage(isKoreanBook ? "Korean book details added." : "Book details added. You can adjust the type before saving.");
  }

  async function searchAladinBooks(event) {
    event?.preventDefault();
    const cleanedQuery = aladinQuery.trim();

    if (!cleanedQuery || !canUseBookLookup) {
      setAladinStatus("error");
      setAladinMessage("Enter a Korean book title or author to search.");
      return;
    }

    setAladinStatus("loading");
    setAladinMessage("");
    setAladinResults([]);

    try {
      const url = new URL("/api/aladin/books", window.location.origin);
      url.searchParams.set("query", cleanedQuery);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.errorCode) {
        throw new Error(data.errorMessage || data.message || "Aladin lookup failed.");
      }

      const results = (data.item || [])
        .map(normalizeAladinBookResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 8);

      if (!results.length) {
        setAladinStatus("error");
        setAladinMessage("No Aladin Korean book results found.");
        return;
      }

      setAladinResults(results);
      setAladinStatus("success");
    } catch (error) {
      setAladinStatus("error");
      setAladinMessage(error.message || "Aladin lookup failed. Check your key and try again.");
    }
  }

  function applyAladinBookResult(result) {
    setDraft((current) => ({
      ...current,
      subtype: "korean-book",
      title: result.title || current.title,
      creator: result.authors || current.creator,
      imageUrl: result.imageUrl || current.imageUrl,
      notes: buildAladinBookNotes(result) || current.notes,
    }));
    setAladinStatus("success");
    setAladinResults([]);
    setAladinMessage("Korean book details added from Aladin.");
  }

  async function searchManga(event) {
    event?.preventDefault();
    const cleanedQuery = mangaQuery.trim();

    if (!cleanedQuery || !canUseMangaLookup) {
      setMangaStatus("error");
      setMangaMessage("Enter a manga title to search.");
      return;
    }

    setMangaStatus("loading");
    setMangaMessage("");
    setMangaResults([]);

    try {
      const url = new URL("https://api.jikan.moe/v4/manga");
      url.searchParams.set("q", cleanedQuery);
      url.searchParams.set("limit", "8");
      url.searchParams.set("sfw", "true");

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Jikan lookup failed.");
      }

      const results = (data.data || [])
        .map(normalizeJikanMangaResult)
        .filter((result) => result.title || result.authors)
        .slice(0, 8);

      if (!results.length) {
        setMangaStatus("error");
        setMangaMessage("No Jikan manga results found.");
        return;
      }

      setMangaResults(results);
      setMangaStatus("success");
    } catch (error) {
      setMangaStatus("error");
      setMangaMessage(error.message || "Jikan lookup failed. Check your connection and try again.");
    }
  }

  function applyMangaResult(result) {
    setDraft((current) => ({
      ...current,
      title: result.title || current.title,
      creator: result.authors || current.creator,
      imageUrl: result.imageUrl || current.imageUrl,
      notes: buildJikanMangaNotes(result) || current.notes,
    }));
    setMangaStatus("success");
    setMangaResults([]);
    setMangaMessage("Manga details added from Jikan. You can edit anything before saving.");
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] pb-28 sm:pb-0">
      <section className="sticky top-0 z-20 border-b border-stone-300/80 bg-[#fffaf2]/95 backdrop-blur sm:static sm:bg-[#fffaf2]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                <Library size={18} />
                Personal library
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-stone-950 sm:text-3xl">Media Shelf</h1>
            </div>
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ShelfSearch query={query} onChange={setQuery} />
              <ViewToggle shelfView={shelfView} onChange={setShelfView} />
              <div className="grid flex-1 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 sm:w-64 sm:flex-none">
                {statuses.map((status) => (
                  <button
                    key={status}
                    className={`min-h-8 rounded px-2 text-xs font-semibold transition ${
                      activeStatus === status ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"
                    }`}
                    onClick={() => setActiveStatus(status)}
                    type="button"
                  >
                    <span>{statusLabels[status]}</span>
                    <span className={`ml-1 ${activeStatus === status ? "text-stone-300" : "text-stone-400"}`}>
                      {counts[activeCategory]?.[status] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeCategory === "books" && (
            <SubtypeFilter
              activeSubtype={activeBookSubtype}
              counts={bookSubtypeCounts}
              onChange={setActiveBookSubtype}
              options={bookSubtypeOptions}
            />
          )}

          {activeCategory === "movies" && (
            <SubtypeFilter
              activeSubtype={activeMovieSubtype}
              counts={movieSubtypeCounts}
              onChange={setActiveMovieSubtype}
              options={movieSubtypeOptions}
            />
          )}

          {activeCategory === "tv" && (
            <SubtypeFilter
              activeSubtype={activeTvSubtype}
              counts={tvSubtypeCounts}
              onChange={setActiveTvSubtype}
              options={tvSubtypeOptions}
            />
          )}

          {visibleItems.length > 0 ? (
            shelfView === "grid" ? (
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                {visibleItems.map((item) => (
                  <MediaPosterCard key={item.id} item={item} onDelete={deleteItem} onEdit={startEdit} />
                ))}
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {visibleItems.map((item) => (
                  <MediaItemCard key={item.id} item={item} onDelete={deleteItem} onEdit={startEdit} />
                ))}
              </div>
            )
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
      <button
        className="fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lift transition hover:bg-teal-800 sm:bottom-6 sm:right-6"
        onClick={startNewItem}
        type="button"
        aria-label="Add item"
        title="Add item"
      >
        <Plus size={24} />
      </button>
      {isEditorOpen && (
        <EditorSheet
          activeStatus={activeStatus}
          aladinMessage={aladinMessage}
          aladinQuery={aladinQuery}
          aladinResults={aladinResults}
          aladinStatus={aladinStatus}
          bookLanguage={bookLanguage}
          bookMessage={bookMessage}
          bookQuery={bookQuery}
          bookResults={bookResults}
          bookStatus={bookStatus}
          canUseBookLookup={canUseBookLookup}
          canUseMangaLookup={canUseMangaLookup}
          canUseOmdb={canUseOmdb}
          canUseTmdb={canUseTmdb}
          category={category}
          draft={draft}
          editingId={editingId}
          onApplyAladinBook={applyAladinBookResult}
          onApplyBook={applyBookResult}
          onApplyManga={applyMangaResult}
          onClose={closeEditor}
          onSubmit={handleSubmit}
          onUpdateDraft={updateDraft}
          mangaMessage={mangaMessage}
          mangaQuery={mangaQuery}
          mangaResults={mangaResults}
          mangaStatus={mangaStatus}
          omdbMessage={omdbMessage}
          omdbQuery={omdbQuery}
          omdbResults={omdbResults}
          omdbStatus={omdbStatus}
          onApplyOmdb={applyOmdbResult}
          onApplyTmdb={applyTmdbResult}
          onAladinQueryChange={setAladinQuery}
          onBookLanguageChange={setBookLanguage}
          onBookQueryChange={setBookQuery}
          onMangaQueryChange={setMangaQuery}
          onOmdbQueryChange={setOmdbQuery}
          onSearchAladinBooks={searchAladinBooks}
          onSearchBooks={searchBooks}
          onSearchManga={searchManga}
          onSearchOmdb={searchOmdb}
          onSearchTmdb={searchTmdb}
          onTmdbLanguageChange={setTmdbLanguage}
          onTmdbQueryChange={setTmdbQuery}
          setActiveCategory={setActiveCategory}
          setActiveStatus={setActiveStatus}
          tmdbLanguage={tmdbLanguage}
          tmdbMessage={tmdbMessage}
          tmdbQuery={tmdbQuery}
          tmdbResults={tmdbResults}
          tmdbStatus={tmdbStatus}
        />
      )}
      <BottomNav
        activeCategory={activeCategory}
        counts={counts}
        onShowCategory={showCategory}
      />
    </main>
  );
}

function cleanOmdbValue(value) {
  return value && value !== "N/A" ? value : "";
}

function cleanTmdbValue(value) {
  return value || "";
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

function getTmdbImageUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
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

function buildTmdbNotes(detail, mediaType, originalTitle) {
  const countries = getTmdbCountries(detail, mediaType).join(", ");
  const releaseDate = mediaType === "movie" ? detail.release_date : detail.first_air_date;
  const runtime =
    mediaType === "movie"
      ? detail.runtime
        ? `${detail.runtime} min`
        : ""
      : detail.number_of_seasons
        ? `${detail.number_of_seasons} season${detail.number_of_seasons === 1 ? "" : "s"}`
        : "";
  const genres = detail.genres?.map((genre) => genre.name).join(", ");
  const tmdbRating = detail.vote_average ? `${detail.vote_average.toFixed(1)}/10` : "";

  return [
    ["Original title", originalTitle],
    ["Year", releaseDate ? releaseDate.slice(0, 4) : ""],
    ["Country", countries],
    ["Genre", genres],
    ["Runtime", runtime],
    ["TMDb", tmdbRating],
    ["Overview", detail.overview],
  ]
    .map(([label, value]) => [label, cleanTmdbValue(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
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
    languages: normalizeOpenLibraryList(doc.language),
    publishers: normalizeOpenLibraryList(doc.publisher).slice(0, 3).join(", "),
    subjects: normalizeOpenLibraryList(doc.subject).slice(0, 5).join(", "),
    imageUrl: getOpenLibraryCoverUrl(doc.cover_i),
  };
}

function normalizeOpenLibraryList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function getOpenLibraryCoverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
}

function buildOpenLibraryBookNotes(result) {
  return [
    ["First published", result.firstPublishYear],
    ["Editions", result.editionCount],
    ["Publisher", result.publishers],
    ["Language", result.languages.join(", ")],
    ["Subjects", result.subjects],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
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

function normalizeJikanPeople(value) {
  return normalizeOpenLibraryList(value).map((person) => person.name).filter(Boolean);
}

function normalizeJikanNamedList(value) {
  return normalizeOpenLibraryList(value).map((entry) => entry.name).filter(Boolean);
}

function buildJikanMangaNotes(result) {
  return [
    ["Volumes", result.volumes],
    ["Chapters", result.chapters],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function normalizeAladinBookResult(item) {
  return {
    id: item.itemId || item.isbn13 || item.isbn || item.link,
    title: item.title || "",
    authors: item.author || "",
    publisher: item.publisher || "",
    publishedDate: item.pubDate || "",
    category: item.categoryName || "",
    isbn13: item.isbn13 || "",
    description: item.description || "",
    imageUrl: item.cover || "",
    link: item.link || "",
  };
}

function buildAladinBookNotes(result) {
  return [
    ["Published", result.publishedDate],
    ["Publisher", result.publisher],
    ["Category", result.category],
    ["ISBN13", result.isbn13],
    ["Description", result.description],
    ["Aladin", result.link],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function getSubtypeLabel(item) {
  if (item.category === "books" && item.subtype === "korean-book") return "Korean book";
  if (item.category === "movies" && item.subtype === "anime-movie") return "Anime movie";
  if (item.category === "movies" && item.subtype === "korean-movie") return "Korean movie";
  if (item.category === "tv" && item.subtype === "kdrama") return "K-Drama";
  return "";
}

function ShelfSearch({ query, onChange }) {
  return (
    <label className="relative block w-full min-w-0 sm:w-44 md:w-52">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
      <input
        className="h-9 w-full rounded-md border border-stone-300 bg-white/80 pl-8 pr-2 text-xs text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter shelf"
      />
    </label>
  );
}

function ViewToggle({ shelfView, onChange }) {
  const options = [
    { value: "list", label: "List", icon: ListIcon },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  return (
    <div className="grid w-20 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = shelfView === option.value;
        return (
          <button
            key={option.value}
            className={`inline-flex h-8 items-center justify-center rounded transition ${
              isActive ? "bg-teal-700 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
            onClick={() => onChange(option.value)}
            type="button"
            aria-label={`${option.label} view`}
            title={`${option.label} view`}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

function MediaItemCard({ item, onDelete, onEdit }) {
  const subtypeLabel = getSubtypeLabel(item);

  return (
    <article className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm sm:block">
      <div className="h-28 w-[76px] overflow-hidden bg-stone-200 sm:aspect-[4/5] sm:h-auto sm:w-full">
        {item.imageUrl ? (
          <img className="h-full w-full object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
        ) : (
          <div className="cover-fallback flex h-full w-full items-end p-2 text-xs font-semibold text-white sm:p-4 sm:text-lg">
            {item.title}
          </div>
        )}
      </div>
      <div className="min-w-0 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 break-words text-base font-semibold leading-5 text-stone-950">{item.title}</h3>
            <p className="mt-1 truncate text-sm text-stone-600">{item.creator || "Unknown creator"}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex gap-1">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-700 transition hover:bg-stone-100"
                onClick={() => onEdit(item)}
                type="button"
                aria-label={`Edit ${item.title}`}
                title={`Edit ${item.title}`}
              >
                <Edit3 size={14} />
              </button>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
                onClick={() => onDelete(item.id)}
                type="button"
                aria-label={`Delete ${item.title}`}
                title={`Delete ${item.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {item.status === "Completed" && <Rating value={item.rating} readOnly compact />}
          </div>
        </div>

        <div className="min-w-0">
          {subtypeLabel && (
            <span className="mt-2 inline-flex rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              {subtypeLabel}
            </span>
          )}
          {item.notes && <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-700 sm:line-clamp-3">{item.notes}</p>}
        </div>
      </div>
    </article>
  );
}

function MediaPosterCard({ item, onDelete, onEdit }) {
  const subtypeLabel = getSubtypeLabel(item);

  return (
    <article className="grid min-w-0 grid-rows-[auto_116px]">
      <button
        className="group block w-full overflow-hidden rounded-md border border-stone-300 bg-white text-left shadow-sm transition hover:border-teal-600"
        onClick={() => onEdit(item)}
        type="button"
      >
        <div className="aspect-[2/3] overflow-hidden bg-stone-200">
          {item.imageUrl ? (
            <img
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              src={item.imageUrl}
              alt={`${item.title} cover`}
            />
          ) : (
            <div className="cover-fallback flex h-full w-full items-end p-2 text-xs font-semibold text-white">
              {item.title}
            </div>
          )}
        </div>
      </button>

      <div className="mt-2 flex min-h-0 min-w-0 flex-col">
        <h3 className="line-clamp-2 h-8 break-words text-xs font-semibold leading-4 text-stone-950 sm:text-sm">{item.title}</h3>
        <p className="mt-1 h-4 truncate text-[11px] font-medium text-amber-700">{subtypeLabel}</p>
        <div className="h-5">{item.status === "Completed" && <Rating value={item.rating} readOnly compact />}</div>
        <div className="mt-auto grid grid-cols-[1fr_32px] gap-1">
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-stone-300 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
            onClick={() => onEdit(item)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
            onClick={() => onDelete(item.id)}
            type="button"
            aria-label={`Delete ${item.title}`}
            title={`Delete ${item.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function SubtypeFilter({ activeSubtype, counts, onChange, options }) {
  return (
    <div className={`mt-4 grid rounded-md border border-stone-300 bg-white p-1 ${options.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {options.map((option) => (
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
  aladinMessage,
  aladinQuery,
  aladinResults,
  aladinStatus,
  bookLanguage,
  bookMessage,
  bookQuery,
  bookResults,
  bookStatus,
  canUseBookLookup,
  canUseMangaLookup,
  canUseOmdb,
  canUseTmdb,
  category,
  draft,
  editingId,
  onApplyAladinBook,
  onApplyBook,
  onApplyManga,
  onApplyOmdb,
  onApplyTmdb,
  onAladinQueryChange,
  onBookLanguageChange,
  onBookQueryChange,
  onClose,
  onMangaQueryChange,
  onOmdbQueryChange,
  onSearchAladinBooks,
  onSearchBooks,
  onSearchManga,
  onSearchOmdb,
  onSearchTmdb,
  onSubmit,
  onTmdbLanguageChange,
  onTmdbQueryChange,
  onUpdateDraft,
  mangaMessage,
  mangaQuery,
  mangaResults,
  mangaStatus,
  omdbMessage,
  omdbQuery,
  omdbResults,
  omdbStatus,
  setActiveCategory,
  setActiveStatus,
  tmdbLanguage,
  tmdbMessage,
  tmdbQuery,
  tmdbResults,
  tmdbStatus,
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
          {canUseBookLookup && (
            <>
              <AladinBookLookup
                message={aladinMessage}
                onApply={onApplyAladinBook}
                onQueryChange={onAladinQueryChange}
                onSearch={onSearchAladinBooks}
                query={aladinQuery}
                results={aladinResults}
                status={aladinStatus}
              />
              <BookLookup
                language={bookLanguage}
                message={bookMessage}
                onApply={onApplyBook}
                onLanguageChange={onBookLanguageChange}
                onQueryChange={onBookQueryChange}
                onSearch={onSearchBooks}
                query={bookQuery}
                results={bookResults}
                status={bookStatus}
              />
            </>
          )}

          {canUseMangaLookup && (
            <MangaLookup
              message={mangaMessage}
              onApply={onApplyManga}
              onQueryChange={onMangaQueryChange}
              onSearch={onSearchManga}
              query={mangaQuery}
              results={mangaResults}
              status={mangaStatus}
            />
          )}

          {canUseTmdb && (
            <TmdbLookup
              categoryLabel={category.label}
              language={tmdbLanguage}
              message={tmdbMessage}
              onApply={onApplyTmdb}
              onLanguageChange={onTmdbLanguageChange}
              onQueryChange={onTmdbQueryChange}
              onSearch={onSearchTmdb}
              query={tmdbQuery}
              results={tmdbResults}
              status={tmdbStatus}
            />
          )}

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
                      {option.value === "anime-movie"
                        ? "Anime movie"
                        : option.value === "korean-movie"
                          ? "Korean movie"
                          : "Movie"}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {draft.category === "books" && (
            <Field label="Book type">
              <select
                className="input"
                value={draft.subtype || "book"}
                onChange={(event) => onUpdateDraft("subtype", event.target.value)}
              >
                {bookSubtypeOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "korean-book" ? "Korean book" : "Book"}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {draft.category === "tv" && (
            <Field label="TV type">
              <select
                className="input"
                value={draft.subtype || "tv"}
                onChange={(event) => onUpdateDraft("subtype", event.target.value)}
              >
                {tvSubtypeOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "kdrama" ? "K-Drama" : "TV show"}
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

function BottomNav({ activeCategory, counts, onShowCategory }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_35px_rgba(31,41,55,0.12)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {categories.map((entry) => {
          const Icon = entry.icon;
          const isActive = entry.id === activeCategory;
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

function BookLookup({ language, message, onApply, onLanguageChange, onQueryChange, onSearch, query, results, status }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
      <div className="grid gap-3">
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-2 block text-sm font-medium text-stone-700">Open Library lookup</span>
            <input
              className="input bg-white"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearch(event);
                }
              }}
              placeholder="Search books in English or Korean"
            />
          </label>
          <button
            className="mt-7 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-700 text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={status === "loading"}
            onClick={onSearch}
            type="button"
            aria-label="Search Open Library"
            title="Search Open Library"
          >
            <Search size={17} />
          </button>
        </div>

        <label>
          <span className="mb-2 block text-sm font-medium text-stone-700">Language filter</span>
          <select className="input bg-white" value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="all">Any language</option>
            <option value="ko">Korean</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700" : "text-sky-800"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={result.id}>
              <button
                className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-sky-500"
                onClick={() => onApply(result)}
                type="button"
              >
                {result.imageUrl ? (
                  <img className="h-14 w-10 rounded object-cover" src={result.imageUrl} alt={`${result.title} cover`} />
                ) : (
                  <div className="cover-fallback h-14 w-10 rounded" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-950">{result.title}</span>
                  <span className="mt-1 block truncate text-xs text-stone-600">
                    {result.authors || "Unknown author"}
                    {result.firstPublishYear ? ` / ${result.firstPublishYear}` : ""}
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

function AladinBookLookup({ message, onApply, onQueryChange, onSearch, query, results, status }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3">
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium text-stone-700">Korean book lookup</span>
          <input
            className="input bg-white"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(event);
              }
            }}
            placeholder="한국어 제목 또는 저자 검색"
          />
        </label>
        <button
          className="mt-7 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-rose-700 text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Search Aladin"
          title="Search Aladin"
        >
          <Search size={17} />
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700" : "text-rose-800"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={result.id}>
              <button
                className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-rose-500"
                onClick={() => onApply(result)}
                type="button"
              >
                {result.imageUrl ? (
                  <img className="h-14 w-10 rounded object-cover" src={result.imageUrl} alt={`${result.title} cover`} />
                ) : (
                  <div className="cover-fallback h-14 w-10 rounded" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-950">{result.title}</span>
                  <span className="mt-1 block truncate text-xs text-stone-600">
                    {result.authors || "Unknown author"}
                    {result.publishedDate ? ` / ${result.publishedDate.slice(0, 4)}` : ""}
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

function MangaLookup({ message, onApply, onQueryChange, onSearch, query, results, status }) {
  return (
    <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50/70 p-3">
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block text-sm font-medium text-stone-700">Jikan manga lookup</span>
          <input
            className="input bg-white"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(event);
              }
            }}
            placeholder="Search manga by title"
          />
        </label>
        <button
          className="mt-7 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-fuchsia-700 text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Search Jikan"
          title="Search Jikan"
        >
          <Search size={17} />
        </button>
      </div>

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700" : "text-fuchsia-800"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={result.id}>
              <button
                className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-fuchsia-500"
                onClick={() => onApply(result)}
                type="button"
              >
                {result.imageUrl ? (
                  <img className="h-14 w-10 rounded object-cover" src={result.imageUrl} alt={`${result.title} cover`} />
                ) : (
                  <div className="cover-fallback h-14 w-10 rounded" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-950">{result.title}</span>
                  <span className="mt-1 block truncate text-xs text-stone-600">
                    {result.authors || "Unknown author"}
                    {result.published ? ` / ${result.published}` : ""}
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

function TmdbLookup({
  categoryLabel,
  language,
  message,
  onApply,
  onLanguageChange,
  onQueryChange,
  onSearch,
  query,
  results,
  status,
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
      <div className="grid gap-3">
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-2 block text-sm font-medium text-stone-700">Korean media lookup</span>
            <input
              className="input bg-white"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearch(event);
                }
              }}
              placeholder={`Search ${categoryLabel.toLowerCase()} in English or Korean`}
            />
          </label>
          <button
            className="mt-7 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-700 text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={status === "loading"}
            onClick={onSearch}
            type="button"
            aria-label="Search TMDb"
            title="Search TMDb"
          >
            <Search size={17} />
          </button>
        </div>

        <label>
          <span className="mb-2 block text-sm font-medium text-stone-700">Result language</span>
          <select className="input bg-white" value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="en-US">English</option>
            <option value="ko-KR">Korean</option>
          </select>
        </label>
      </div>

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700" : "text-amber-800"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={`${result.mediaType}-${result.id}`}>
              <button
                className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-amber-500"
                onClick={() => onApply(result)}
                type="button"
              >
                {result.posterPath ? (
                  <img className="h-14 w-10 rounded object-cover" src={getTmdbImageUrl(result.posterPath)} alt={`${result.title} poster`} />
                ) : (
                  <div className="cover-fallback h-14 w-10 rounded" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-950">{result.title || result.originalTitle}</span>
                  <span className="mt-1 block truncate text-xs text-stone-600">
                    {result.originalTitle && result.originalTitle !== result.title ? `${result.originalTitle} / ` : ""}
                    {result.releaseDate ? result.releaseDate.slice(0, 4) : "Unknown year"}
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function Rating({ value, onChange, readOnly = false, compact = false }) {
  const starSize = compact ? 13 : 18;
  const buttonSize = compact ? "h-6 w-6" : "h-8 w-8";

  return (
    <div className={`flex items-center gap-0.5 ${compact ? "mt-1 h-5" : "h-8 gap-1"}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = rating <= value;
        const classes = filled ? "fill-amber-400 text-amber-500" : "text-stone-300";
        if (readOnly) {
          return <Star key={rating} className={classes} size={starSize} />;
        }

        return (
          <button
            key={rating}
            className={`inline-flex ${buttonSize} items-center justify-center rounded text-stone-400 transition hover:bg-amber-50 hover:text-amber-500`}
            onClick={() => onChange(rating)}
            type="button"
            aria-label={`${rating} stars`}
            title={`${rating} stars`}
          >
            <Star className={classes} size={compact ? 15 : 20} />
          </button>
        );
      })}
    </div>
  );
}

export default App;
