import {
  bookSubtypeOptions,
  defaultItems,
  movieSubtypeOptions,
  openLibraryCanonicalBookLanguage,
  tvSubtypeOptions,
} from "./mediaConfig";

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

    return {
      ...item,
      category,
      director: item.director || (category === "movies" ? item.creator || "" : ""),
      genre: item.genre || "",
      releaseYear: item.releaseYear || "",
      durationMinutes: item.durationMinutes || "",
      pageCount: item.pageCount || "",
      publisher: item.publisher || "",
      isbn: item.isbn || "",
      author: item.author || (category === "manga" ? item.creator || "" : ""),
      artist: item.artist || "",
      volumeCount: item.volumeCount || "",
      chapterCount: item.chapterCount || "",
      seasonCount: item.seasonCount || "",
      episodeCount: item.episodeCount || "",
      durationMinutesPerEpisode: item.durationMinutesPerEpisode || "",
      studio: item.studio || "",
      subtype: getDefaultSubtype(category, subtype),
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

export function compareShelfItems(a, b, sortOrder) {
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

export function normalizeSearchText(value) {
  return String(value || "")
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

  return [item.releaseYear, formatCompactDurationMinutes(item.durationMinutes)].filter(Boolean).join(" • ");
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

function formatSeasonCount(value) {
  const count = Number(value);
  if (!count) return "";
  return `${count} ${count === 1 ? "season" : "seasons"}`;
}

function formatEpisodeCount(value) {
  const count = Number(value);
  if (!count) return "";
  return `${count} eps`;
}

export function getLabeledNoteValue(notes, label) {
  const match = String(notes || "").match(new RegExp(`(?:^|\\n)${label}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() || "";
}

export function getBookTileMeta(item) {
  if (item.category !== "books" || !item.pageCount) return "";

  return `${item.pageCount} pages`;
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
