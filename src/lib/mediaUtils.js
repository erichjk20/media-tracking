import {
  bookSubtypeOptions,
  defaultItems,
  emptyDraft,
  movieSubtypeOptions,
  openLibraryCanonicalBookLanguage,
  tvSubtypeOptions,
} from "./mediaConfig";

const localProfileStorageKey = "media-shelf-profile";

export function getStoredProfile() {
  try {
    const stored = window.localStorage.getItem(localProfileStorageKey);
    const profile = stored ? JSON.parse(stored) : {};
    return {
      id: "local",
      email: "",
      display_name: profile.display_name || "",
    };
  } catch {
    return {
      id: "local",
      email: "",
      display_name: "",
    };
  }
}

export function saveStoredProfile(profile) {
  window.localStorage.setItem(localProfileStorageKey, JSON.stringify(profile));
}

export function getStoredItems() {
  try {
    const stored = window.localStorage.getItem("media-shelf-items");
    return normalizeItems(stored ? JSON.parse(stored) : defaultItems);
  } catch {
    return normalizeItems(defaultItems);
  }
}

export function getLocalStorageItems() {
  try {
    const stored = window.localStorage.getItem("media-shelf-items");
    return stored ? normalizeItems(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function normalizeItems(items) {
  return items.map((item) => {
    const category = item.category === "anime" ? "tv" : item.category;
    const subtype = item.category === "anime" ? "anime" : item.subtype;
    const defaultItem = defaultItems.find((previewItem) => previewItem.id === item.id) || {};

    return {
      ...item,
      category,
      director: item.director || defaultItem.director || (category === "movies" ? item.creator || "" : ""),
      genre: item.genre || defaultItem.genre || "",
      releaseYear: item.releaseYear || defaultItem.releaseYear || "",
      durationMinutes: item.durationMinutes || defaultItem.durationMinutes || "",
      pageCount: item.pageCount || defaultItem.pageCount || "",
      publisher: item.publisher || defaultItem.publisher || "",
      isbn: item.isbn || defaultItem.isbn || "",
      author: item.author || defaultItem.author || (category === "manga" ? item.creator || "" : ""),
      artist: item.artist || defaultItem.artist || "",
      volumeCount: item.volumeCount || defaultItem.volumeCount || "",
      chapterCount: item.chapterCount || defaultItem.chapterCount || "",
      seasonCount: item.seasonCount || defaultItem.seasonCount || "",
      episodeCount: item.episodeCount || defaultItem.episodeCount || "",
      durationMinutesPerEpisode: item.durationMinutesPerEpisode || defaultItem.durationMinutesPerEpisode || "",
      studio: item.studio || defaultItem.studio || "",
      synopsis: item.synopsis || defaultItem.synopsis || "",
      subtype: getDefaultSubtype(category, subtype),
      statusChangedAt: item.statusChangedAt || defaultItem.statusChangedAt || item.addedAt || defaultItem.addedAt || "",
    };
  });
}

export function getDefaultSubtype(category, subtype = "") {
  if (category === "books") return bookSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "book";
  if (category === "movies") return movieSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "movie";
  if (category === "tv") return tvSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "tv";
  return "";
}

export function getSelectableSubtype(category, subtype = "") {
  return subtype && subtype !== "all" ? getDefaultSubtype(category, subtype) : getDefaultSubtype(category);
}

export function createMediaDraft({
  category = emptyDraft.category,
  status = emptyDraft.status,
  subtype = "",
  title = "",
} = {}) {
  return {
    ...emptyDraft,
    category,
    subtype: getSelectableSubtype(category, subtype),
    status,
    title,
    rating: status === "Completed" ? 3 : 0,
  };
}

export function compareShelfItems(a, b, sortOrder) {
  if (sortOrder === "title-asc") return compareTitles(a.item, b.item);
  if (sortOrder === "title-desc") return compareTitles(b.item, a.item);
  if (sortOrder === "rating-desc") {
    return (
      Number(b.item.rating || 0) - Number(a.item.rating || 0)
      || compareTitles(a.item, b.item)
      || getShelfSortValue(b.item, b.index) - getShelfSortValue(a.item, a.index)
    );
  }

  return getShelfSortValue(b.item, b.index) - getShelfSortValue(a.item, a.index) || compareTitles(a.item, b.item);
}

function compareTitles(a, b) {
  return a.title.localeCompare(b.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getShelfSortValue(item, index) {
  const timestamp = Date.parse(item.statusChangedAt || item.addedAt || "");
  return Number.isNaN(timestamp) ? index : timestamp;
}

export function createLookupResult(source, result) {
  return {
    id: `${source}-${getLookupResultId(source, result)}`,
    source,
    sourceLabel: getLookupSourceLabel(source),
    result,
  };
}

export function getLookupSourceLabel(source) {
  const labels = {
    aladin: "Aladin",
    "open-library": "Open Library",
    tmdb: "TMDb",
    omdb: "OMDb",
    jikan: "Jikan",
    "jikan-anime": "Jikan",
  };
  return labels[source] || source;
}

function getLookupResultId(source, result) {
  if (source === "omdb") return result.imdbID;
  if (source === "tmdb") return `${result.mediaType}-${result.id}`;
  if (source === "open-library" || source === "jikan" || source === "jikan-anime" || source === "aladin") return result.id;
  return result.title || result.Title || source;
}

export function getLookupResultTitle(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return result.Title;
  if (source === "tmdb") return result.title || result.originalTitle;
  return result.title;
}

export function getLookupResultMeta(lookupResult) {
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
  if (source === "jikan-anime") {
    return [
      result.creators || result.studios || "Unknown creator",
      result.aired || result.year,
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

export function getLookupResultImage(lookupResult) {
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
  if (source === "jikan-anime") return String(result.year || result.aired || "").slice(0, 4);
  return String(result.published || "").slice(0, 4);
}

export function normalizeSearchPunctuation(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u02BC\uFF07]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\uFF02]/g, "\"")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u00A0/g, " ");
}

export function normalizeLookupQuery(value) {
  return normalizeSearchPunctuation(value).replace(/\s+/g, " ").trim();
}

export function normalizeSearchText(value) {
  return normalizeSearchPunctuation(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getSearchTokens(query) {
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

export function getKeywordMatchScore(text, tokens) {
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

export function dedupeLookupResults(results, preferredSource) {
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

export function rankLookupResults(results, query) {
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

export function getLookupMessage(entry) {
  return entry.status === "fulfilled" ? entry.value.message : entry.reason?.message;
}

export function getBookLookupLanguage(subtype, selectedLanguage = openLibraryCanonicalBookLanguage) {
  if (subtype === "korean-book") return "ko";
  return selectedLanguage || openLibraryCanonicalBookLanguage;
}

export function cleanOmdbValue(value) {
  return value && value !== "N/A" ? value : "";
}

export function cleanTmdbValue(value) {
  return value || "";
}

export function parseOmdbRuntime(value) {
  const match = cleanOmdbValue(value).match(/(\d+)/);
  return match ? Number(match[1]) : "";
}

export function parseReleaseYear(value) {
  const match = cleanTmdbValue(value).match(/\d{4}/);
  return match ? Number(match[0]) : "";
}

export function getMovieTileMeta(item) {
  if (item.category !== "movies") return "";

  return [
    getMovieReleaseYear(item),
    formatCompactDurationMinutes(getMovieDurationMinutes(item)),
  ].filter(Boolean).join(" • ");
}

function getMovieReleaseYear(item) {
  return item.releaseYear || getLabeledNoteValue(item.notes, "Year");
}

function getMovieDurationMinutes(item) {
  return item.durationMinutes || getLabeledNoteValue(item.notes, "Duration") || getLabeledNoteValue(item.notes, "Runtime");
}

export function getTvTileMeta(item) {
  if (item.category !== "tv") return "";

  return [
    getTvReleaseYear(item),
    formatSeasonCount(item.seasonCount),
    formatEpisodeCount(item.episodeCount),
  ].filter(Boolean).join(" • ");
}

function getTvReleaseYear(item) {
  return item.releaseYear || getLabeledNoteValue(item.notes, "Year");
}

export function getLabeledNoteValue(notes, label) {
  const match = String(notes || "").match(new RegExp(`(?:^|\\n)${label}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() || "";
}

export function getBookTileMeta(item) {
  if (item.category !== "books" || !item.pageCount) return "";

  return `${item.pageCount} pages`;
}

export function getMangaTileMeta(item) {
  if (item.category !== "manga") return "";

  return [
    formatCount(item.volumeCount, "volume") || "Unknown volumes",
    formatCount(item.chapterCount, "chapter") || "Unknown chapters",
  ].join(" • ");
}

export function getItemTileMeta(item) {
  if (item.category === "books") return getBookTileMeta(item) || "Unknown pages";
  if (item.category === "manga") return getMangaTileMeta(item);
  return getMovieTileMeta(item) || getTvTileMeta(item) || "";
}

export function getPrimaryCreator(item) {
  if (item.category === "books") return item.author || item.creator || "";
  if (item.category === "movies") return item.director || item.creator || "";
  if (item.category === "tv") return item.creator || item.studio || "";
  if (item.category === "manga") return item.author || item.creator || item.artist || "";
  return item.creator || "";
}

export function getCreatorRole(item) {
  if (item.category === "books") return "Author";
  if (item.category === "movies") return "Director";
  if (item.category === "tv") return "Creator";
  if (item.category === "manga") return "Author";
  return "Creator";
}

export function getCardCreatorLabel(item) {
  if (item.category === "books" || item.category === "manga") {
    return getPrimaryCreator(item) || "Unknown author";
  }

  return getPrimaryCreator(item);
}

export function formatCount(value, singular, plural = `${singular}s`) {
  const count = Number(value);
  if (!count) return "";
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatSeasonCount(value) {
  return formatCount(value, "season");
}

function formatEpisodeCount(value) {
  const count = Number(value);
  if (!count) return "";
  return `${count} eps`;
}

export function formatDuration(value) {
  const minutes = Number(value);
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function formatCompactDurationMinutes(value) {
  const minutes = Number(value);
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes}m`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getTmdbImageUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
}

export function normalizeOpenLibraryList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function hasOpenLibraryLanguage(result, languageCode) {
  return normalizeOpenLibraryList(result.languages).includes(languageCode);
}

export function getOpenLibraryCoverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
}

export function getSubtypeLabel(item) {
  if (item.category === "books" && item.subtype === "korean-book") return "Korean book";
  if (item.category === "movies" && item.subtype === "anime-movie") return "Anime movie";
  if (item.category === "movies" && item.subtype === "korean-movie") return "Korean movie";
  if (item.category === "tv" && item.subtype === "anime") return "Anime";
  if (item.category === "tv" && item.subtype === "kdrama") return "Korean TV";
  return "";
}
