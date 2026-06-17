import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpZA,
  BookOpen,
  Clapperboard,
  ClockArrowDown,
  Edit3,
  Home,
  LayoutGrid,
  Library,
  List as ListIcon,
  PanelsTopLeft,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import {
  fetchMediaItems,
  isSupabaseConfigured,
  removeMediaItem,
  saveMediaItem,
} from "./lib/mediaItemsStore";

const categories = [
  { id: "books", label: "Books", creatorLabel: "Author", action: "Read", icon: BookOpen },
  { id: "movies", label: "Movies", creatorLabel: "Director", action: "Watch", icon: Clapperboard },
  { id: "tv", label: "TV Shows", creatorLabel: "Director", action: "Watch", icon: Tv },
  { id: "anime", label: "Anime", creatorLabel: "Studio / Creator", action: "Watch", icon: Sparkles },
  { id: "manga", label: "Manga", creatorLabel: "Author / Artist", action: "Read", icon: PanelsTopLeft },
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
const tmdbCanonicalMediaLanguage = "en-US";
const openLibraryCanonicalBookLanguage = "en";

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
  director: "",
  genre: "",
  releaseYear: "",
  durationMinutes: "",
  pageCount: "",
  publisher: "",
  isbn: "",
  author: "",
  artist: "",
  volumeCount: "",
  chapterCount: "",
  seasonCount: "",
  episodeCount: "",
  durationMinutesPerEpisode: "",
  studio: "",
  rating: 3,
  notes: "",
  imageUrl: "",
  addedAt: "",
};

const sortOptions = [
  { value: "recent", label: "Recently added", icon: ClockArrowDown },
  { value: "rating-desc", label: "Highest rated", icon: Star },
  { value: "title-asc", label: "A to Z", icon: ArrowDownAZ },
  { value: "title-desc", label: "Z to A", icon: ArrowUpZA },
];

function getStoredItems() {
  try {
    const stored = window.localStorage.getItem("media-shelf-items");
    return normalizeItems(stored ? JSON.parse(stored) : defaultItems);
  } catch {
    return normalizeItems(defaultItems);
  }
}

function getLocalStorageItems() {
  try {
    const stored = window.localStorage.getItem("media-shelf-items");
    return stored ? normalizeItems(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

function normalizeItems(items) {
  return items.map((item) => ({
    ...item,
    director: item.director || (item.category === "movies" ? item.creator || "" : ""),
    genre: item.genre || "",
    releaseYear: item.releaseYear || "",
    durationMinutes: item.durationMinutes || "",
    pageCount: item.pageCount || "",
    publisher: item.publisher || "",
    isbn: item.isbn || "",
    author: item.author || (item.category === "manga" ? item.creator || "" : ""),
    artist: item.artist || "",
    volumeCount: item.volumeCount || "",
    chapterCount: item.chapterCount || "",
    seasonCount: item.seasonCount || "",
    episodeCount: item.episodeCount || "",
    durationMinutesPerEpisode: item.durationMinutesPerEpisode || "",
    studio: item.studio || "",
    subtype: getDefaultSubtype(item.category, item.subtype),
  }));
}

function getDefaultSubtype(category, subtype = "") {
  if (category === "books") return bookSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "book";
  if (category === "movies") return movieSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "movie";
  if (category === "tv") return tvSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "tv";
  return "";
}

function compareTitles(a, b) {
  return a.title.localeCompare(b.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getAddedSortValue(item, index) {
  const timestamp = Date.parse(item.addedAt || "");
  return Number.isNaN(timestamp) ? index : timestamp;
}

function compareShelfItems(a, b, sortOrder) {
  if (sortOrder === "title-asc") return compareTitles(a.item, b.item);
  if (sortOrder === "title-desc") return compareTitles(b.item, a.item);
  if (sortOrder === "rating-desc") {
    return (
      Number(b.item.rating || 0) - Number(a.item.rating || 0)
      || compareTitles(a.item, b.item)
      || getAddedSortValue(b.item, b.index) - getAddedSortValue(a.item, a.index)
    );
  }

  return getAddedSortValue(b.item, b.index) - getAddedSortValue(a.item, a.index) || compareTitles(a.item, b.item);
}

function getLookupProviders(category, subtype = "") {
  if (category === "books") {
    return subtype === "korean-book" ? [{ id: "aladin", label: "Aladin" }] : [{ id: "open-library", label: "Open Library" }];
  }
  if (category === "movies") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "tv") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "anime") return [{ id: "omdb", label: "OMDb" }];
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

function createLookupResult(source, result) {
  return {
    id: `${source}-${getLookupResultId(source, result)}`,
    source,
    sourceLabel: getLookupSourceLabel(source),
    result,
  };
}

function getLookupSourceLabel(source) {
  const labels = {
    aladin: "Aladin",
    "open-library": "Open Library",
    tmdb: "TMDb",
    omdb: "OMDb",
    jikan: "Jikan",
  };
  return labels[source] || source;
}

function getLookupResultId(source, result) {
  if (source === "omdb") return result.imdbID;
  if (source === "tmdb") return `${result.mediaType}-${result.id}`;
  if (source === "open-library" || source === "jikan" || source === "aladin") return result.id;
  return result.title || result.Title || source;
}

function getLookupResultTitle(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return result.Title;
  if (source === "tmdb") return result.title || result.originalTitle;
  return result.title;
}

function getLookupResultMeta(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return [result.Year, result.Type].filter(Boolean).join(" / ");
  if (source === "tmdb") {
    return [
      result.originalTitle && result.originalTitle !== result.title ? result.originalTitle : "",
      result.releaseDate ? result.releaseDate.slice(0, 4) : "Unknown year",
    ]
      .filter(Boolean)
      .join(" / ");
  }
  if (source === "open-library") {
    return [
      result.authors || "Unknown author",
      result.firstPublishYear,
    ]
      .filter(Boolean)
      .join(" / ");
  }
  if (source === "aladin") {
    return [
      result.authors || "Unknown author",
      result.publishedDate ? result.publishedDate.slice(0, 4) : "",
    ]
      .filter(Boolean)
      .join(" / ");
  }
  return [
    result.authors || "Unknown author",
    result.published,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getLookupResultImage(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return result.Poster && result.Poster !== "N/A" ? result.Poster : "";
  if (source === "tmdb") return getTmdbImageUrl(result.posterPath);
  return result.imageUrl || "";
}

function getLookupResultYear(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return (result.Year || "").slice(0, 4);
  if (source === "tmdb") return (result.releaseDate || "").slice(0, 4);
  if (source === "open-library") return String(result.firstPublishYear || "");
  if (source === "aladin") return (result.publishedDate || "").slice(0, 4);
  return String(result.published || "").slice(0, 4);
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getSearchTokens(query) {
  return normalizeSearchText(query)
    .split(/[\s,;:()[\]{}"'`~!?.\\/|_-]+/)
    .filter(Boolean);
}

function countTokenMatches(text, token) {
  let count = 0;
  let index = text.indexOf(token);

  while (index !== -1) {
    count += 1;
    index = text.indexOf(token, index + token.length);
  }

  return count;
}

function getKeywordMatchScore(text, tokens) {
  const normalizedText = normalizeSearchText(text);
  if (!tokens.every((token) => normalizedText.includes(token))) return -1;
  return tokens.reduce((score, token) => score + countTokenMatches(normalizedText, token), 0);
}

function getLookupSearchText(lookupResult) {
  return [
    getLookupResultTitle(lookupResult),
    getLookupResultMeta(lookupResult),
    lookupResult.sourceLabel,
  ].join(" ");
}

function getLookupDedupKey(lookupResult) {
  const title = normalizeSearchText(getLookupResultTitle(lookupResult)).replace(/[^a-z0-9가-힣]+/g, "");
  const year = getLookupResultYear(lookupResult);
  return `${title}-${year}`;
}

function dedupeLookupResults(results, preferredSource) {
  const selectedByKey = new Map();

  results.forEach((result, index) => {
    const key = getLookupDedupKey(result);
    if (!key || key === "-") {
      selectedByKey.set(`${result.id}-${index}`, { result, index });
      return;
    }

    const current = selectedByKey.get(key);
    if (!current) {
      selectedByKey.set(key, { result, index });
      return;
    }

    const currentIsPreferred = current.result.source === preferredSource;
    const nextIsPreferred = result.source === preferredSource;
    if (nextIsPreferred && !currentIsPreferred) {
      selectedByKey.set(key, { result, index });
    }
  });

  return [...selectedByKey.values()]
    .sort((a, b) => a.index - b.index)
    .map(({ result }) => result);
}

function rankLookupResults(results, query) {
  const tokens = getSearchTokens(query);
  if (!tokens.length) return results;

  return results
    .map((result, index) => ({
      result,
      index,
      score: getKeywordMatchScore(getLookupSearchText(result), tokens),
      priority: getLookupResultPriority(result),
    }))
    .filter(({ score }) => score >= tokens.length)
    .sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index)
    .map(({ result }) => result);
}

function getLookupResultPriority(lookupResult) {
  if (lookupResult.source === "open-library" && hasOpenLibraryLanguage(lookupResult.result, "eng")) return 1;
  return 0;
}

function getLookupMessage(entry) {
  return entry.status === "fulfilled" ? entry.value.message : entry.reason?.message;
}

function getBookLookupLanguage(subtype, selectedLanguage = openLibraryCanonicalBookLanguage) {
  if (subtype === "korean-book") return "ko";
  return selectedLanguage || openLibraryCanonicalBookLanguage;
}

function mergeApiNotes(existingNotes, apiNotes) {
  const cleanedApiNotes = String(apiNotes || "").trim();
  if (!cleanedApiNotes) return String(existingNotes || "").trim();

  const personalNotes = String(existingNotes || "")
    .replace(/(?:^|\n\n)API details:\n[\s\S]*$/u, "")
    .trim();

  return [personalNotes, `API details:\n${cleanedApiNotes}`].filter(Boolean).join("\n\n");
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
    const nextNotes = mergeApiNotes(item.notes, patch.notes);

    return {
      ...item,
      ...patch,
      id: item.id,
      status: item.status,
      rating: item.rating,
      addedAt: item.addedAt,
      title: patch.title || item.title,
      notes: nextNotes,
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
    if (lookupResult.source === "omdb") return getOmdbItemPatch(lookupResult.result, item.category);
    if (lookupResult.source === "tmdb") return getTmdbItemPatch(lookupResult.result, item);
    if (lookupResult.source === "open-library") return getOpenLibraryItemPatch(lookupResult.result, item);
    if (lookupResult.source === "aladin") return getAladinItemPatch(lookupResult.result);
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
        results: (data.Search || []).slice(0, 5).map((result) => createLookupResult("omdb", result)),
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
      .slice(0, 8)
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
      url.searchParams.set("limit", "8");
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
        .slice(0, 8);

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
        .slice(0, 8);

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
        return { results: [], message: "No Jikan manga results found." };
      }

      return { results: results.map((result) => createLookupResult("jikan", result)), message: "" };
    } catch (error) {
      return { results: [], message: error.message || "Jikan lookup failed." };
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
      } else {
        applyMangaResult(lookupResult.result);
      }
      setLookupQuery("");
    } catch (error) {
      setLookupStatus("error");
      setLookupMessage(error.message || "Could not apply that result.");
    }
  }

  async function applyOmdbResult(result) {
    const patch = await getOmdbItemPatch(result, draft.category);

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
      notes: patch.notes || current.notes,
    }));
    setLookupStatus("success");
    setLookupResults([]);
    setLookupMessage("Details added from OMDb. You can edit anything before saving.");
  }

  async function getOmdbItemPatch(result, category) {
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
    const creator = category === "movies" ? director : director || detail.Writer;
    const durationMinutes = parseOmdbRuntime(detail.Runtime);
    const genre = cleanOmdbValue(detail.Genre);
    const releaseYear = parseReleaseYear(detail.Year);
    const episodeCount = category === "tv" || category === "anime" ? await fetchOmdbEpisodeCount(result.imdbID, detail.totalSeasons) : "";
    const title = cleanOmdbValue(detail.Title) || result.Title || "";
    const notes =
      category === "movies"
        ? buildMovieNotes({ title, director, genre, releaseYear, durationMinutes })
        : buildOmdbNotes(detail, episodeCount);

    return {
      title,
      creator: cleanOmdbValue(creator),
      director: category === "movies" ? director : "",
      genre: category === "movies" ? genre : "",
      releaseYear: category === "movies" ? releaseYear : "",
      durationMinutes: category === "movies" ? durationMinutes : "",
      seasonCount: category === "tv" || category === "anime" ? Number(cleanOmdbValue(detail.totalSeasons)) || "" : "",
      episodeCount: category === "tv" || category === "anime" ? episodeCount : "",
      durationMinutesPerEpisode: category === "tv" || category === "anime" ? durationMinutes : "",
      imageUrl: cleanOmdbValue(detail.Poster) || cleanOmdbValue(result.Poster),
      notes,
    };
  }

  async function applyTmdbResult(result) {
    const patch = await getTmdbItemPatch(result, draft);

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
      notes: patch.notes || current.notes,
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
    const country = countries.join(", ");
    const isKorean = countries.includes("KR");
    const title =
      result.mediaType === "movie" || result.mediaType === "tv"
        ? cleanTmdbValue(detail.title || detail.name) || cleanTmdbValue(result.title)
        : cleanTmdbValue(result.title) || cleanTmdbValue(detail.title || detail.name);
    const originalTitle =
      result.mediaType === "movie" || result.mediaType === "tv"
        ? cleanTmdbValue(detail.original_title || detail.original_name) || cleanTmdbValue(result.originalTitle)
        : cleanTmdbValue(result.originalTitle) || cleanTmdbValue(detail.original_title || detail.original_name);
    const creator = result.mediaType === "movie" ? getTmdbDirector(detail) : getTmdbTvDirector(detail) || getTmdbTvCreator(detail);
    const genres = detail.genres?.map((genre) => genre.name).join(", ") || "";
    const releaseYear = parseReleaseYear(result.mediaType === "movie" ? detail.release_date || result.releaseDate : "");
    const durationMinutes = result.mediaType === "movie" ? detail.runtime || "" : "";
    const notes =
      result.mediaType === "movie"
        ? buildMovieNotes({ title, originalTitle, country, director: creator, genre: genres, releaseYear, durationMinutes })
        : buildTmdbNotes(detail, result.mediaType, originalTitle);

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
      notes,
    };
  }

  function applyBookResult(result) {
    const patch = getOpenLibraryItemPatch(result, draft);
    setDraft((current) => ({
      ...current,
      subtype: patch.subtype || current.subtype,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      pageCount: patch.pageCount || current.pageCount,
      publisher: patch.publisher || current.publisher,
      isbn: patch.isbn || current.isbn,
      notes: patch.notes || current.notes,
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
      notes: buildOpenLibraryBookNotes(result),
    };
  }

  function applyAladinBookResult(result) {
    const patch = getAladinItemPatch(result);
    setDraft((current) => ({
      ...current,
      subtype: patch.subtype || current.subtype,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      pageCount: patch.pageCount || current.pageCount,
      publisher: patch.publisher || current.publisher,
      isbn: patch.isbn || current.isbn,
      notes: patch.notes || current.notes,
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
      notes: buildAladinBookNotes(result),
    };
  }

  function applyMangaResult(result) {
    const patch = getMangaItemPatch(result);
    setDraft((current) => ({
      ...current,
      title: patch.title || current.title,
      creator: patch.creator || current.creator,
      imageUrl: patch.imageUrl || current.imageUrl,
      author: patch.author || current.author,
      volumeCount: patch.volumeCount || current.volumeCount,
      chapterCount: patch.chapterCount || current.chapterCount,
      notes: patch.notes || current.notes,
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
      notes: buildJikanMangaNotes(result),
    };
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] pb-28 dark:bg-stone-950 lg:pb-0">
      <section className="sticky top-0 z-20 border-b border-stone-300/80 bg-[#fffaf2]/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:static sm:bg-[#fffaf2] sm:dark:bg-stone-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-3 lg:items-center">
            <div className="min-w-0">
              <BrandWordmark onClick={() => setActiveView("home")} />
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400 sm:text-sm">
                <Library size={16} />
                Track your media without the noise
              </div>
            </div>
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition hover:border-teal-700 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-teal-500 dark:hover:text-teal-300 sm:hidden"
              onClick={() => (activeView === "home" ? showLibrary() : setActiveView("home"))}
              type="button"
              aria-label={activeView === "home" ? "Open library" : "Go home"}
              title={activeView === "home" ? "Library" : "Home"}
            >
              {activeView === "home" ? <Library size={18} /> : <Home size={18} />}
            </button>
            <div className="hidden grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900 sm:grid sm:w-56">
              <button
                className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "home" ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
                onClick={() => setActiveView("home")}
                type="button"
              >
                <Home size={15} />
                Home
              </button>
              <button
                className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "library" ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
                onClick={showLibrary}
                type="button"
              >
                <Library size={15} />
                Library
              </button>
            </div>
          </div>

          <div className={`hidden grid-cols-5 gap-2 lg:grid ${activeView === "home" ? "lg:hidden" : ""}`}>
            {categories.map((entry) => {
              const Icon = entry.icon;
              const isActive = entry.id === activeCategory;
              return (
                <button
                  key={entry.id}
                  className={`flex min-h-16 items-center justify-between rounded-md border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-teal-700 bg-teal-700 text-white shadow-lift dark:border-teal-500 dark:bg-teal-600"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-500"
                  }`}
                  onClick={() => showCategory(entry.id)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold">{entry.label}</span>
                    <span className={`mt-1 block text-xs ${isActive ? "text-teal-50" : "text-stone-500 dark:text-stone-400"}`}>
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

      {storageMessage && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            {storageMessage}
          </p>
        </div>
      )}

      {activeView === "home" ? (
        <HomeView
          counts={counts}
          items={items}
          onStartLookup={startHomeLookup}
          searchResetToken={homeSearchResetToken}
        />
      ) : (
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-stone-300 pb-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{category.label}</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {counts[activeCategory]?.Completed || 0} completed,{" "}
                {counts[activeCategory]?.["Want to Watch/Read"] || 0} planned
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <ShelfSearch query={query} onChange={setQuery} />
              <SortSelect sortOrder={sortOrder} onChange={setSortOrder} />
              <ViewToggle shelfView={shelfView} onChange={setShelfView} />
              <button
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                disabled={!items.length || refreshStatus === "loading"}
                onClick={refreshExistingItems}
                type="button"
              >
                <RefreshCw className={refreshStatus === "loading" ? "animate-spin" : ""} size={14} />
                Update details
              </button>
              <div className="grid flex-1 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900 sm:w-64 sm:flex-none">
                {statuses.map((status) => (
                  <button
                    key={status}
                    className={`min-h-8 rounded px-2 text-xs font-semibold transition ${
                      activeStatus === status ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                    }`}
                    onClick={() => setActiveStatus(status)}
                    type="button"
                  >
                    <span>{statusLabels[status]}</span>
                    <span className={`ml-1 hidden sm:inline ${activeStatus === status ? "text-stone-300 dark:text-stone-700" : "text-stone-400 dark:text-stone-500"}`}>
                      {counts[activeCategory]?.[status] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {refreshMessage && (
            <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-medium ${
              refreshStatus === "error"
                ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200"
            }`}>
              {refreshMessage}
            </p>
          )}

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
            <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 text-center dark:border-stone-700 dark:bg-stone-900">
              <Library className="text-stone-400 dark:text-stone-500" size={36} />
              <h3 className="mt-4 text-lg font-semibold text-stone-950 dark:text-stone-100">Nothing here yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400">
                Add a title to this shelf or switch categories to browse another part of your library.
              </p>
            </div>
          )}
        </div>
      </section>
      )}
      {activeView === "library" && (
      <button
        className="fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lift transition hover:bg-teal-800 lg:bottom-6 lg:right-6"
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
          counts={counts}
          onShowCategory={showCategory}
        />
      )}
    </main>
  );
}

function BrandWordmark({ onClick }) {
  return (
    <h1>
      <button
        aria-label="Go home"
        className="relative inline-flex items-end pb-1 text-4xl font-semibold leading-none tracking-normal text-stone-950 transition hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:text-stone-100 dark:hover:text-teal-300 dark:focus:ring-teal-950 sm:text-5xl"
        onClick={onClick}
        type="button"
      >
        <span>she</span>
        <span
          aria-hidden="true"
          className="mx-0.5 inline-block origin-bottom -rotate-6 rounded-sm bg-teal-700 px-0.5 text-[#fffaf2] shadow-sm dark:bg-teal-500 dark:text-stone-950"
        >
          l
        </span>
        <span>vd</span>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-stone-300 dark:bg-stone-700" />
      </button>
    </h1>
  );
}

function cleanOmdbValue(value) {
  return value && value !== "N/A" ? value : "";
}

function cleanTmdbValue(value) {
  return value || "";
}

function parseOmdbRuntime(value) {
  const match = cleanOmdbValue(value).match(/(\d+)/);
  return match ? Number(match[1]) : "";
}

function parseReleaseYear(value) {
  const match = cleanTmdbValue(value).match(/\d{4}/);
  return match ? Number(match[0]) : "";
}

function formatDurationMinutes(value) {
  return value ? `${value} min` : "";
}

function formatCompactDurationMinutes(value) {
  const minutes = Number(value);
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes}m`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getMovieTileMeta(item) {
  if (item.category !== "movies") return "";

  return [item.releaseYear, formatCompactDurationMinutes(item.durationMinutes)].filter(Boolean).join(" • ");
}

function getBookTileMeta(item) {
  if (item.category !== "books" || !item.pageCount) return "";

  return `${item.pageCount} pages`;
}

function buildLabeledNotes(lines) {
  return lines
    .map(([label, value]) => [label, cleanTmdbValue(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function buildMovieNotes({ title, originalTitle, country, director, genre, releaseYear, durationMinutes }) {
  const nativeTitle = originalTitle && originalTitle !== title ? originalTitle : "";

  return buildLabeledNotes([
    ["Movie title", title],
    ["Original title", nativeTitle],
    ["Year", releaseYear],
    ["Country", country],
    ["Director", director],
    ["Genre", genre],
    ["Duration", formatDurationMinutes(durationMinutes)],
  ]);
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

function getTmdbTvDirector(detail) {
  const directors = detail.credits?.crew
    ?.filter((person) => person.job === "Director")
    .map((person) => person.name)
    .filter(Boolean) || [];
  return [...new Set(directors)].slice(0, 3).join(", ");
}

function formatEpisodeRuntime(values) {
  const runtimes = normalizeOpenLibraryList(values).filter(Boolean);
  if (!runtimes.length) return "";
  if (runtimes.length === 1) return `${runtimes[0]} min`;
  return `${Math.min(...runtimes)}-${Math.max(...runtimes)} min`;
}

function getFirstRuntime(values) {
  return normalizeOpenLibraryList(values).find(Boolean) || "";
}

function buildTmdbNotes(detail, mediaType, originalTitle) {
  const countries = getTmdbCountries(detail, mediaType).join(", ");
  const releaseDate = mediaType === "movie" ? detail.release_date : detail.first_air_date;
  const runtime =
    mediaType === "movie"
      ? detail.runtime
        ? `${detail.runtime} min`
        : ""
      : formatEpisodeRuntime(detail.episode_run_time);
  const totalEpisodes = mediaType === "tv" ? detail.number_of_episodes : "";
  const totalSeasons = mediaType === "tv" ? detail.number_of_seasons : "";
  const genres = detail.genres?.map((genre) => genre.name).join(", ");
  const tmdbRating = detail.vote_average ? `${detail.vote_average.toFixed(1)}/10` : "";

  return buildLabeledNotes([
    ["Original title", originalTitle],
    ["Year", releaseDate ? releaseDate.slice(0, 4) : ""],
    ["Country", countries],
    ["Director", mediaType === "movie" ? getTmdbDirector(detail) : getTmdbTvDirector(detail)],
    ["Genre", genres],
    [mediaType === "movie" ? "Duration" : "Duration per episode", runtime],
    ["Episodes", totalEpisodes],
    ["Seasons", totalSeasons],
    ["TMDb", tmdbRating],
    ["Overview", detail.overview],
  ]);
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

function normalizeOpenLibraryList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function hasOpenLibraryLanguage(result, languageCode) {
  return normalizeOpenLibraryList(result.languages).includes(languageCode);
}

function getOpenLibraryCoverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
}

function buildOpenLibraryBookNotes(result) {
  return [
    ["Author", result.authors],
    ["Genre", result.subjects],
    ["Total pages", result.pageCount],
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
    ["Author", result.authors],
    ["Genre", [result.genres, result.themes, result.demographics].filter(Boolean).join(", ")],
    ["Volumes", result.volumes],
    ["Chapters", result.chapters],
    ["Status", result.status],
    ["Published", result.published],
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
    pageCount: item.itemPage || item.subInfo?.itemPage || "",
    isbn13: item.isbn13 || "",
    description: item.description || "",
    imageUrl: item.cover || "",
    link: item.link || "",
  };
}

function buildAladinBookNotes(result) {
  return [
    ["Author", result.authors],
    ["Genre", result.category],
    ["Total pages", result.pageCount],
    ["Published", result.publishedDate],
    ["Publisher", result.publisher],
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

function HomeView({ counts, items, onStartLookup, searchResetToken }) {
  const [homeQuery, setHomeQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Completed");
  const selectedCategoryDetails = categories.find((entry) => entry.id === selectedCategory);
  const recentItems = items.slice(-6).reverse();

  useEffect(() => {
    setHomeQuery("");
  }, [searchResetToken]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedQuery = homeQuery.trim();
    if (!selectedCategory || !cleanedQuery) return;

    onStartLookup({
      categoryId: selectedCategory,
      query: cleanedQuery,
      status: selectedStatus,
    });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="min-w-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">Log something new</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-stone-950 dark:text-stone-100 sm:text-5xl">Choose a media type.</h2>
        </div>

        <div className="mt-5 flex justify-center gap-2 pb-1">
          {categories.map((entry) => {
            const Icon = entry.icon;
            const isSelected = entry.id === selectedCategory;
            return (
              <button
                key={entry.id}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-stone-950 bg-stone-950 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                    : "border-stone-300 bg-white text-stone-700 hover:border-teal-700 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-teal-500 dark:hover:text-teal-300"
                }`}
                onClick={() => setSelectedCategory(entry.id)}
                type="button"
                aria-label={entry.label}
                title={entry.label}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>

        <form className="mx-auto mt-5 max-w-4xl" onSubmit={handleSubmit}>
          <div
            className={`grid gap-2 rounded-md border bg-white p-1.5 shadow-sm dark:bg-stone-900 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center ${
              selectedCategory ? "border-stone-300 dark:border-stone-700" : "border-dashed border-stone-300 dark:border-stone-700"
            }`}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
              <input
                className="h-12 w-full rounded border-0 bg-white pl-10 pr-3 text-sm font-medium text-stone-950 outline-none placeholder:text-stone-400 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-50 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:ring-teal-950 dark:disabled:bg-stone-800"
                disabled={!selectedCategory}
                value={homeQuery}
                onChange={(event) => setHomeQuery(event.target.value)}
                placeholder={selectedCategoryDetails ? `Search ${selectedCategoryDetails.label.toLowerCase()} to log` : "Pick a media type first"}
              />
            </label>

            <div className="grid grid-cols-2 rounded-md border border-stone-300 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-950 md:w-32">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`h-8 rounded px-2 text-xs font-semibold transition ${
                    selectedStatus === status ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                  }`}
                  onClick={() => setSelectedStatus(status)}
                  type="button"
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950 dark:disabled:bg-stone-700"
              disabled={!selectedCategory}
              type="submit"
            >
              <Search size={17} />
              Search to add
            </button>
          </div>
        </form>

        {recentItems.length > 0 && (
          <div className="mx-auto mt-10 max-w-5xl border-t border-stone-300 pt-6 dark:border-stone-800">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Recently added</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentItems.map((item) => {
                const itemCategory = categories.find((entry) => entry.id === item.category);
                const Icon = itemCategory?.icon || Library;
                return (
                  <div key={item.id} className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-stone-300 bg-white p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                    {item.imageUrl ? (
                      <img className="h-16 w-11 rounded object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
                    ) : (
                      <div className="cover-fallback h-16 w-11 rounded" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-100">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-stone-600 dark:text-stone-400">{item.creator || "Unknown creator"}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-500">{statusLabels[item.status] || item.status}</p>
                    </div>
                    <span className="inline-flex h-8 items-center gap-1 rounded bg-teal-50 px-2 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-900">
                      <Icon size={13} />
                      {itemCategory?.label.replace("TV Shows", "TV") || "Media"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function LibrarySnapshot({ counts, onBrowseCategory }) {
  return (
    <div className="mt-4 rounded-lg border border-stone-300 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Library overview</h3>
      <div className="mt-4 grid grid-cols-6 gap-x-2 gap-y-5">
        {categories.map((entry, index) => {
          const Icon = entry.icon;
          const completedCount = counts[entry.id]?.Completed || 0;
          const plannedCount = counts[entry.id]?.["Want to Watch/Read"] || 0;
          const totalCount = completedCount + plannedCount;
          return (
            <button
              key={entry.id}
              className={`group flex flex-col items-center text-center text-stone-700 transition dark:text-stone-300 sm:col-span-1 ${
                index < 3 ? "col-span-2" : "col-span-3"
              }`}
              onClick={() => onBrowseCategory(entry.id)}
              type="button"
            >
              <Icon size={18} className="text-teal-700 transition group-hover:text-teal-800 dark:text-teal-400 dark:group-hover:text-teal-300" />
              <span className="mt-2 text-3xl font-semibold leading-none text-stone-950 transition group-hover:text-teal-800 dark:text-stone-100 dark:group-hover:text-teal-300">
                {totalCount}
              </span>
              <span className="mt-2 max-w-full truncate text-xs font-semibold text-stone-700 underline-offset-4 transition group-hover:text-teal-800 group-hover:underline dark:text-stone-300 dark:group-hover:text-teal-300">
                {entry.label.replace("TV Shows", "TV")}
              </span>
              <span className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-500">
                {completedCount} done / {plannedCount} want
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShelfSearch({ query, onChange }) {
  return (
    <label className="relative block min-w-0 flex-1 sm:w-44 sm:flex-none md:w-52">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
      <input
        className="h-9 w-full rounded-md border border-stone-300 bg-white/80 pl-8 pr-2 text-xs text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-teal-500 dark:focus:bg-stone-900 dark:focus:ring-teal-950"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter shelf"
      />
    </label>
  );
}

function SortSelect({ sortOrder, onChange }) {
  const activeOption = sortOptions.find((option) => option.value === sortOrder) || sortOptions[0];
  const Icon = activeOption.icon;

  return (
    <label
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-100 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:focus-within:border-teal-500 dark:focus-within:ring-teal-950"
      title={`Sort: ${activeOption.label}`}
    >
      <span className="sr-only">Sort shelf</span>
      <Icon size={15} />
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={sortOrder}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Sort shelf"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewToggle({ shelfView, onChange }) {
  const options = [
    { value: "list", label: "List", icon: ListIcon },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  return (
    <div className="grid w-20 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = shelfView === option.value;
        return (
          <button
            key={option.value}
            className={`inline-flex h-8 items-center justify-center rounded transition ${
              isActive ? "bg-teal-700 text-white dark:bg-teal-600" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
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
  const movieTileMeta = getMovieTileMeta(item);
  const bookTileMeta = getBookTileMeta(item);

  return (
    <article className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:block">
      <div className="h-28 w-[76px] overflow-hidden bg-stone-200 dark:bg-stone-800 sm:aspect-[4/5] sm:h-auto sm:w-full">
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
            <h3 className="line-clamp-2 break-words text-base font-semibold leading-5 text-stone-950 dark:text-stone-100">{item.title}</h3>
            {movieTileMeta && <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{movieTileMeta}</p>}
            {bookTileMeta && <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{bookTileMeta}</p>}
            {item.category !== "movies" && <p className="mt-1 truncate text-sm text-stone-600 dark:text-stone-400">{item.creator || "Unknown creator"}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex gap-1">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                onClick={() => onEdit(item)}
                type="button"
                aria-label={`Edit ${item.title}`}
                title={`Edit ${item.title}`}
              >
                <Edit3 size={14} />
              </button>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
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

      </div>
    </article>
  );
}

function MediaPosterCard({ item, onDelete, onEdit }) {
  const movieTileMeta = getMovieTileMeta(item);
  const bookTileMeta = getBookTileMeta(item);
  const compactTileMeta = movieTileMeta || bookTileMeta;

  return (
    <article className="grid min-w-0 grid-rows-[auto_124px]">
      <button
        className="group block w-full overflow-hidden rounded-md border border-stone-300 bg-white text-left shadow-sm transition hover:border-teal-600 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500"
        onClick={() => onEdit(item)}
        type="button"
      >
        <div className="aspect-[2/3] overflow-hidden bg-stone-200 dark:bg-stone-800">
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
        <h3 className="line-clamp-2 break-words text-xs font-semibold leading-4 text-stone-950 dark:text-stone-100 sm:text-sm">{item.title}</h3>
        <p className="mt-1 h-4 truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">{compactTileMeta}</p>
        <div className="mt-2 h-5">{item.status === "Completed" && <Rating value={item.rating} readOnly compact />}</div>
        <div className="mt-auto grid grid-cols-[1fr_32px] gap-2 pt-3">
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-stone-300 text-xs font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            onClick={() => onEdit(item)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
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
    <div className={`mt-4 grid rounded-md border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-900 ${options.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`min-h-10 rounded px-2 text-sm font-medium transition ${
            activeSubtype === option.value ? "bg-teal-700 text-white dark:bg-teal-600" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          }`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="block truncate">{option.label}</span>
          <span className={`block text-xs ${activeSubtype === option.value ? "text-teal-50" : "text-stone-400 dark:text-stone-500"}`}>
            {counts[option.value] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

function EditorSheet({
  activeStatus,
  bookLanguage,
  canUseBookLookup,
  canUseMangaLookup,
  canUseOmdb,
  canUseTmdb,
  category,
  draft,
  editingId,
  lookupMessage,
  lookupProviders,
  lookupQuery,
  lookupResults,
  lookupStatus,
  onApplyLookupResult,
  onBookLanguageChange,
  onClose,
  onLookupQueryChange,
  onSearchDetails,
  onSubmit,
  onTmdbLanguageChange,
  onUpdateDraft,
  setActiveCategory,
  setActiveStatus,
  tmdbLanguage,
}) {
  const canLookupDetails = canUseBookLookup || canUseMangaLookup || canUseOmdb || canUseTmdb;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-stone-950/45 dark:bg-black/70 sm:items-center sm:justify-center">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-stone-300 bg-white p-4 shadow-lift dark:border-stone-700 dark:bg-stone-900 sm:max-w-xl sm:rounded-xl sm:p-5">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900 sm:-mx-5 sm:-mt-5 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-100">{editingId ? "Edit item" : "Add item"}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{category.label} / {activeStatus}</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {canLookupDetails && (
            <DetailsLookup
              bookLanguage={bookLanguage}
              categoryLabel={category.label}
              canUseBookLookup={canUseBookLookup}
              canUseTmdb={canUseTmdb}
              lookupProviders={lookupProviders}
              message={lookupMessage}
              onApply={onApplyLookupResult}
              onBookLanguageChange={onBookLanguageChange}
              onQueryChange={onLookupQueryChange}
              onSearch={onSearchDetails}
              onTmdbLanguageChange={onTmdbLanguageChange}
              query={lookupQuery}
              results={lookupResults}
              status={lookupStatus}
              tmdbLanguage={tmdbLanguage}
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
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950"
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
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 px-4 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-xl border border-stone-300/80 bg-white/80 p-1 shadow-[0_18px_55px_rgba(31,41,55,0.22)] backdrop-blur-xl dark:border-stone-700/80 dark:bg-stone-950/80 dark:shadow-[0_18px_55px_rgba(0,0,0,0.5)]">
        {categories.map((entry) => {
          const Icon = entry.icon;
          const isActive = entry.id === activeCategory;
          return (
            <button
              key={entry.id}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition ${
                isActive ? "bg-teal-700 text-white shadow-sm dark:bg-teal-600" : "text-stone-600 hover:bg-white/70 dark:text-stone-300 dark:hover:bg-stone-800/80"
              }`}
              onClick={() => onShowCategory(entry.id)}
              type="button"
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{entry.label.replace("TV Shows", "TV")}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
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

function buildOmdbNotes(detail, episodeCount = "") {
  return buildLabeledNotes([
    ["Year", detail.Year],
    ["Director", detail.Director],
    ["Genre", detail.Genre],
    [detail.Type === "series" ? "Duration per episode" : "Duration", detail.Runtime],
    ["Episodes", episodeCount],
    ["Seasons", detail.totalSeasons],
    ["Rated", detail.Rated],
    ["IMDb", detail.imdbRating && detail.imdbRating !== "N/A" ? `${detail.imdbRating}/10` : ""],
    ["Plot", detail.Plot],
  ]);
}

function DetailsLookup({
  bookLanguage,
  categoryLabel,
  canUseBookLookup,
  canUseTmdb,
  lookupProviders,
  message,
  onApply,
  onBookLanguageChange,
  onQueryChange,
  onSearch,
  onTmdbLanguageChange,
  query,
  results,
  status,
  tmdbLanguage,
}) {
  const visibleResults = useMemo(() => rankLookupResults(results, query), [query, results]);

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">Find details</span>
        {lookupProviders.map((provider) => (
          <span key={provider.id} className="rounded bg-white px-2 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-100 dark:bg-stone-900 dark:text-teal-200 dark:ring-teal-900">
            {provider.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search title details</span>
          <input
            className="input bg-white"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(event);
              }
            }}
            placeholder={`Search ${categoryLabel.toLowerCase()} title`}
          />
        </label>
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Find title details"
          title="Find title details"
        >
          <Search size={17} />
        </button>
      </div>

      {(canUseBookLookup || canUseTmdb) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {canUseBookLookup && (
            <label>
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Book language</span>
              <select className="input bg-white" value={bookLanguage} onChange={(event) => onBookLanguageChange(event.target.value)}>
                <option value="en">English</option>
                <option value="all">Any language</option>
                <option value="ko">Korean</option>
              </select>
            </label>
          )}

          {canUseTmdb && (
            <label>
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">TMDb language</span>
              <select className="input bg-white" value={tmdbLanguage} onChange={(event) => onTmdbLanguageChange(event.target.value)}>
                <option value="en-US">English</option>
                <option value="ko-KR">Korean</option>
              </select>
            </label>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-200"}`}>
          {message}
        </p>
      )}

      {visibleResults.length > 0 && (
        <ul className="mt-3 space-y-2">
          {visibleResults.map((lookupResult) => {
            const imageUrl = getLookupResultImage(lookupResult);
            const title = getLookupResultTitle(lookupResult);
            return (
              <li key={lookupResult.id}>
                <button
                  className="grid w-full grid-cols-[42px_minmax(0,1fr)_auto] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500"
                  onClick={() => onApply(lookupResult)}
                  type="button"
                >
                  {imageUrl ? (
                    <img className="h-14 w-10 rounded object-cover" src={imageUrl} alt={`${title} cover`} />
                  ) : (
                    <div className="cover-fallback h-14 w-10 rounded" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-950 dark:text-stone-100">{title}</span>
                    <span className="mt-1 block truncate text-xs text-stone-600 dark:text-stone-400">{getLookupResultMeta(lookupResult)}</span>
                  </span>
                  <span className="self-start rounded bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {lookupResult.sourceLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
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
            <option value="en">English</option>
            <option value="all">Any language</option>
            <option value="ko">Korean</option>
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
      <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
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
        const classes = filled ? "fill-amber-400 text-amber-500" : "text-stone-300 dark:text-stone-600";
        if (readOnly) {
          return <Star key={rating} className={classes} size={starSize} />;
        }

        return (
          <button
            key={rating}
            className={`inline-flex ${buttonSize} items-center justify-center rounded text-stone-400 transition hover:bg-amber-50 hover:text-amber-500 dark:text-stone-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-300`}
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
