import { openLibraryCanonicalBookLanguage } from "./mediaConfig";
import {
  getKeywordMatchScore,
  getSearchTokens,
  normalizeCompactSearchText,
  normalizeLookupQuery,
  normalizeSearchText,
} from "./searchUtils";

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
    anilist: "AniList",
  };
  return labels[source] || source;
}

function getLookupResultId(source, result) {
  if (source === "omdb") return result.imdbID;
  if (source === "tmdb") return `${result.mediaType}-${result.id}`;
  if (source === "open-library" || source === "jikan" || source === "jikan-anime" || source === "aladin" || source === "mangadex" || source === "anilist") return result.id;
  return result.title || result.Title || source;
}

export function getLookupResultTitle(lookupResult) {
  const { result, source } = lookupResult;
  if (source === "omdb") return result.Title;
  if (source === "tmdb") return getTmdbCanonicalTitle(result);
  return result.title;
}

export function getTmdbCanonicalTitle(result) {
  const title = result.title || result.originalTitle;
  const collectionTitle = getTmdbCollectionTitle(result.collectionName);

  if (result.mediaType === "movie" && title && collectionTitle && !doesTitleIncludeCollection(title, collectionTitle)) {
    return `${collectionTitle}: ${title}`;
  }

  return title;
}

function getTmdbCollectionTitle(collectionName) {
  return String(collectionName || "")
    .replace(/\s+(collection|series|saga|trilogy|anthology)$/i, "")
    .trim();
}

function doesTitleIncludeCollection(title, collectionTitle) {
  const compactTitle = normalizeCompactSearchText(title);
  const compactCollection = normalizeCompactSearchText(collectionTitle);
  if (!compactTitle || !compactCollection) return true;
  return compactTitle.includes(compactCollection) || compactCollection.includes(compactTitle);
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

function getLookupSearchText(lookupResult) {
  const mangaTitleText = isMangaLookupResult(lookupResult)
    ? [
      lookupResult.result.originalTitle,
      ...normalizeOpenLibraryList(lookupResult.result.alternateTitles),
      lookupResult.result.genres,
      lookupResult.result.themes,
      lookupResult.result.demographics,
    ].join(" ")
    : "";

  return [
    getLookupResultTitle(lookupResult),
    getLookupResultMeta(lookupResult),
    lookupResult.sourceLabel,
    mangaTitleText,
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
      score: getKeywordMatchScore(getLookupSearchText(result), tokens) + getLookupTitleMatchBonus(result, query) + getMangaCanonicalMatchScore(result, query),
      collectionBrowseRank: getTmdbCollectionBrowseRank(result, query),
      releaseSortValue: getLookupReleaseSortValue(result),
      priority: getLookupResultPriority(result),
    }))
    .filter(({ score }) => score >= tokens.length)
    .sort((a, b) => {
      const collectionBrowseSort = compareTmdbCollectionBrowse(a, b);
      return b.score - a.score || collectionBrowseSort || b.priority - a.priority || a.index - b.index;
    })
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

function getTmdbCollectionBrowseRank(lookupResult, query) {
  if (lookupResult.source !== "tmdb" || lookupResult.result.mediaType !== "movie") return Number.MAX_SAFE_INTEGER;

  const collectionTitle = getTmdbCollectionTitle(lookupResult.result.collectionName);
  const compactCollection = normalizeCompactSearchText(collectionTitle);
  const compactQuery = normalizeCompactSearchText(query);
  if (!compactCollection || !compactQuery || !compactCollection.includes(compactQuery)) return Number.MAX_SAFE_INTEGER;

  const compactTitle = normalizeCompactSearchText(lookupResult.result.title || lookupResult.result.originalTitle);
  if (compactTitle === compactQuery) return 0;
  if (collectionTitle) return 1;
  return 2;
}

function getLookupReleaseSortValue(lookupResult) {
  const timestamp = Date.parse(getLookupResultYear(lookupResult));
  if (!Number.isNaN(timestamp)) return timestamp;

  const releaseDate = lookupResult.result?.releaseDate;
  const releaseTimestamp = Date.parse(releaseDate || "");
  return Number.isNaN(releaseTimestamp) ? Number.MAX_SAFE_INTEGER : releaseTimestamp;
}

function compareTmdbCollectionBrowse(a, b) {
  const aRank = a.collectionBrowseRank;
  const bRank = b.collectionBrowseRank;
  const hasCollectionBrowse = aRank !== Number.MAX_SAFE_INTEGER || bRank !== Number.MAX_SAFE_INTEGER;
  if (!hasCollectionBrowse) return 0;

  return aRank - bRank || a.releaseSortValue - b.releaseSortValue;
}

const mangaVariantTerms = [
  { id: "color", compact: "colored", patterns: ["colored"] },
  { id: "color", compact: "color", patterns: ["color"] },
  { id: "color", compact: "fullcolor", patterns: ["full color", "fullcolor"] },
  { id: "oneshot", compact: "oneshot", patterns: ["one shot", "one-shot", "oneshot"] },
  { id: "anthology", compact: "anthology", patterns: ["anthology"] },
  { id: "sidestory", compact: "sidestory", patterns: ["side story", "side-story"] },
  { id: "spinoff", compact: "spinoff", patterns: ["spin off", "spin-off", "spinoff"] },
  { id: "special", compact: "special", patterns: ["special"] },
  { id: "doujinshi", compact: "doujinshi", patterns: ["doujinshi"] },
  { id: "novel", compact: "novel", patterns: ["novel"] },
];

function isMangaLookupResult(lookupResult) {
  return lookupResult.source === "mangadex" || lookupResult.source === "jikan" || lookupResult.source === "anilist";
}

function getMangaCanonicalMatchScore(lookupResult, query) {
  if (!isMangaLookupResult(lookupResult)) return 0;

  const { result, source } = lookupResult;
  const titleBonus = getMangaTitleMatchBonus(result, query);
  const popularityBonus = source === "mangadex" ? getMangadexSearchRankBonus(result.searchRank) : 0;
  const coverBonus = getMangaCoverPreferenceBonus(result);
  const completenessBonus = Math.min(Number(result.metadataCompletenessScore || 0) * 3, 24);
  const sourceBonus = source === "mangadex" ? 30 : 0;
  const primaryTitleBonus = hasMangaVariantTerm(getMangaVariantSearchText(result)) ? 0 : 18;
  const variantPenalty = getMangaVariantPenalty(result, query);

  return titleBonus + popularityBonus + coverBonus + completenessBonus + sourceBonus + primaryTitleBonus - variantPenalty;
}

function getMangaTitleMatchBonus(result, query) {
  const compactQuery = normalizeCompactSearchText(query);
  if (!compactQuery) return 0;

  const titles = getMangaTitleCandidates(result);
  if (titles.some((title) => title === compactQuery)) return 140;
  if (titles.some((title) => title.startsWith(compactQuery))) return 80;
  if (titles.some((title) => title.includes(compactQuery))) return 35;
  return 0;
}

function getMangaTitleCandidates(result) {
  return [
    result.title,
    result.originalTitle,
    ...normalizeOpenLibraryList(result.alternateTitles),
  ]
    .map(normalizeCompactSearchText)
    .filter(Boolean);
}

function getMangadexSearchRankBonus(searchRank) {
  const rank = Number(searchRank);
  if (!Number.isFinite(rank) || rank <= 0) return 0;
  return Math.max(0, 80 - (rank - 1) * 6);
}

function getMangaCoverPreferenceBonus(result) {
  if (result.coverPreference === "volume-1") return 30;
  if (result.coverPreference === "earliest-volume") return 18;
  if (result.coverPreference === "main-cover") return 10;
  if (result.coverPreference === "jikan-fallback") return 6;
  return result.imageUrl ? 4 : 0;
}

function getMangaVariantPenalty(result, query) {
  const resultTerms = getMangaVariantTerms(getMangaVariantSearchText(result));
  if (!resultTerms.length) return 0;

  const queryTerms = getMangaVariantTerms(query);
  const unrequestedTerms = resultTerms.filter((term) => !queryTerms.includes(term));
  const providerPenalty = Number(result.variantPenalty || 0);
  return unrequestedTerms.length ? Math.max(providerPenalty, unrequestedTerms.length * 45) : 0;
}

function getMangaVariantSearchText(result) {
  return [
    result.title,
    result.originalTitle,
    ...normalizeOpenLibraryList(result.alternateTitles),
    result.genres,
    result.themes,
  ].join(" ");
}

function hasMangaVariantTerm(value) {
  return getMangaVariantTerms(value).length > 0;
}

function getMangaVariantTerms(value) {
  const normalizedText = normalizeSearchText(value).replace(/[\u2010-\u2015\u2212]/g, "-");
  const compactText = normalizeCompactSearchText(value);

  return [...new Set(mangaVariantTerms
    .filter((term) => term.patterns.some((pattern) => normalizedText.includes(pattern)) || compactText.includes(term.compact))
    .map((term) => term.id))];
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
  if (lookupResult.source === "mangadex") {
    return getMangadexSearchRankBonus(lookupResult.result.searchRank)
      + getMangaCoverPreferenceBonus(lookupResult.result)
      + Math.min(Number(lookupResult.result.metadataCompletenessScore || 0) * 2, 16)
      - getMangaVariantPenalty(lookupResult.result, "");
  }
  if (lookupResult.source === "anilist") {
    return Number(lookupResult.result.popularity || 0) + Number(lookupResult.result.score || 0) * 100;
  }
  return 0;
}

export function getLookupMessage(entry) {
  const message = entry.status === "fulfilled" ? entry.value.message : entry.reason?.message;
  return message === "Failed to fetch" ? "Lookup service is temporarily unreachable." : message;
}

export function getBookLookupLanguage(subtype, selectedLanguage = openLibraryCanonicalBookLanguage) {
  if (subtype === "korean-book") return "ko";
  return selectedLanguage || openLibraryCanonicalBookLanguage;
}

export function getTmdbImageUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
}

export function normalizeOpenLibraryList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function hasOpenLibraryLanguage(result, languageCode) {
  return normalizeOpenLibraryList(result.languages).includes(languageCode);
}
