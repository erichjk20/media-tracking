import {
  bookSubtypeOptions,
  defaultItems,
  emptyDraft,
  openLibraryCanonicalBookLanguage,
  tvSubtypeOptions,
} from "./mediaConfig";

const localProfileStorageKey = "media-shelf-profile";
export const localMediaItemsStorageKey = "media-shelf-items";

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
    const stored = window.localStorage.getItem(localMediaItemsStorageKey);
    return normalizeItems(stored ? JSON.parse(stored) : defaultItems);
  } catch {
    return normalizeItems(defaultItems);
  }
}

export function getLocalStorageItems() {
  try {
    const stored = window.localStorage.getItem(localMediaItemsStorageKey);
    return stored ? normalizeItems(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function normalizeItems(items) {
  return items.map((item) => {
    const category = item.category === "anime" ? "tv" : item.category;
    const subtype = getMigratedSubtype(category, item.category === "anime" ? "anime" : item.subtype);
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
      seasonBreakdown: normalizeSeasonBreakdown(item.seasonBreakdown || defaultItem.seasonBreakdown),
      durationMinutesPerEpisode: item.durationMinutesPerEpisode || defaultItem.durationMinutesPerEpisode || "",
      studio: item.studio || defaultItem.studio || "",
      synopsis: item.synopsis || defaultItem.synopsis || "",
      subtype: getDefaultSubtype(category, subtype),
      statusChangedAt: item.statusChangedAt || defaultItem.statusChangedAt || item.addedAt || defaultItem.addedAt || "",
    };
  });
}

export function normalizeSeasonBreakdown(seasons) {
  if (!Array.isArray(seasons)) return [];

  return seasons
    .map((season) => ({
      seasonNumber: Number(season.seasonNumber || season.season_number) || "",
      name: String(season.name || "").trim(),
      episodeCount: Number(season.episodeCount || season.episode_count) || "",
      airDate: String(season.airDate || season.air_date || "").trim(),
      status: season.status === "released" ? "released" : "upcoming",
    }))
    .filter((season) => season.seasonNumber || season.name);
}

export function getDefaultSubtype(category, subtype = "") {
  if (category === "books") return bookSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "book";
  if (category === "movies") return "movie";
  if (category === "tv") return tvSubtypeOptions.some((option) => option.value === subtype) && subtype !== "all" ? subtype : "tv";
  return "";
}

function getMigratedSubtype(category, subtype = "") {
  if (category === "movies" && (subtype === "anime-movie" || subtype === "korean-movie")) return "movie";
  if (category === "tv" && (subtype === "scripted" || subtype === "kdrama")) return "tv";
  return subtype;
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

export function prepareMediaItemForSave({ draft, editingId = "", originalItem = null, now = new Date().toISOString() }) {
  const addedAt = editingId ? draft.addedAt || originalItem?.addedAt || now : now;
  const statusChangedAt =
    !editingId || draft.status !== originalItem?.status
      ? now
      : draft.statusChangedAt || originalItem?.statusChangedAt || addedAt;

  return {
    ...draft,
    id: editingId || crypto.randomUUID(),
    addedAt,
    statusChangedAt,
    title: draft.title.trim(),
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
}

export function findDuplicateMediaItem(items, candidateItem, ignoredItemId = "") {
  const candidateKey = getMediaItemDuplicateKey(candidateItem);
  if (!candidateKey) return null;

  return items.find((item) => item.id !== ignoredItemId && getMediaItemDuplicateKey(item) === candidateKey) || null;
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

function getMediaItemDuplicateKey(item) {
  const normalizedTitle = normalizeDuplicateTitle(item.title);
  if (!normalizedTitle) return "";

  const category = item.category === "anime" ? "tv" : item.category;
  return [category, normalizedTitle].join("|");
}

function normalizeDuplicateTitle(title) {
  return String(title || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    mangadex: "MangaDex",
  };
  return labels[source] || source;
}

function getLookupResultId(source, result) {
  if (source === "omdb") return result.imdbID;
  if (source === "tmdb") return `${result.mediaType}-${result.id}`;
  if (source === "open-library" || source === "jikan" || source === "jikan-anime" || source === "aladin" || source === "mangadex") return result.id;
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

export function normalizeCompactSearchText(value) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}]+/gu, "");
}

export function getSearchTokens(query) {
  return normalizeSearchText(query)
    .split(/[\s,;:()[\]{}"'`~!?.\\/|_-]+/)
    .filter(Boolean);
}

export function getLookupQueryVariants(query) {
  const cleanedQuery = normalizeLookupQuery(query);
  if (!cleanedQuery) return [];

  const variants = [cleanedQuery];
  const withoutPunctuation = cleanedQuery.replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  const compactQuery = normalizeCompactSearchText(cleanedQuery);
  const aliases = getCommonLookupAliases(compactQuery);

  variants.push(withoutPunctuation, compactQuery, ...aliases);

  return [...new Set(variants.filter(Boolean))].slice(0, 5);
}

function getCommonLookupAliases(compactQuery) {
  const aliases = {
    spiderman: ["spider-man", "spider man"],
  };
  return aliases[compactQuery] || [];
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
  const compactText = normalizeCompactSearchText(text);
  const compactTokens = tokens.map(normalizeCompactSearchText).filter(Boolean);
  if (!compactTokens.length) return -1;

  const hasEveryToken = tokens.every((token, index) => {
    const compactToken = compactTokens[index];
    return normalizedText.includes(token) || compactText.includes(compactToken);
  });

  if (!hasEveryToken) return -1;

  const tokenScore = tokens.reduce((score, token, index) => {
    const compactToken = compactTokens[index];
    const normalizedMatches = countTokenMatches(normalizedText, token);
    const compactMatches = compactToken === token ? 0 : countTokenMatches(compactText, compactToken);
    return score + Math.max(normalizedMatches, compactMatches, 1);
  }, 0);
  const compactQuery = compactTokens.join("");
  const compactPhraseBonus = compactQuery && compactText.includes(compactQuery) ? 40 : 0;

  return tokenScore + compactPhraseBonus;
}

function getLookupSearchText(lookupResult) {
  return [
    getLookupResultTitle(lookupResult),
    getLookupResultMeta(lookupResult),
    lookupResult.sourceLabel,
  ].join(" ");
}

function getLookupDedupKey(lookupResult) {
  const title = normalizeCompactSearchText(getLookupResultTitle(lookupResult));
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
      score: getKeywordMatchScore(getLookupSearchText(result), tokens) + getLookupTitleMatchBonus(result, query),
      priority: getLookupResultPriority(result),
    }))
    .filter(({ score }) => score >= tokens.length)
    .sort((a, b) => b.score - a.score || b.priority - a.priority || a.index - b.index)
    .map(({ result }) => result);
}

function getLookupTitleMatchBonus(lookupResult, query) {
  const title = normalizeCompactSearchText(getLookupResultTitle(lookupResult));
  const compactQuery = normalizeCompactSearchText(query);

  if (!title || !compactQuery) return 0;
  if (title === compactQuery) return 100;
  if (title.startsWith(compactQuery)) return 60;
  if (title.includes(compactQuery)) return 20;
  return 0;
}

function getLookupResultPriority(lookupResult) {
  if (lookupResult.source === "tmdb") {
    return Number(lookupResult.result.popularity || 0) + Number(lookupResult.result.voteAverage || 0) * 2;
  }
  if (lookupResult.source === "open-library") {
    return Number(lookupResult.result.editionCount || 0) + (hasOpenLibraryLanguage(lookupResult.result, "eng") ? 2 : 0);
  }
  if (lookupResult.source === "jikan" || lookupResult.source === "jikan-anime") {
    return Number(lookupResult.result.score || 0);
  }
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
  if (item.category === "tv" && getDefaultSubtype("tv", item.subtype) === "anime") return "Anime";
  return "";
}
