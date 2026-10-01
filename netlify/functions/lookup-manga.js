const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const lookupCache = new Map();
const lookupCacheTtlMs = 6 * 60 * 60 * 1000;
const lookupCacheMaxEntries = 100;
const mangadexLookupTimeoutMs = 12000;
const mangadexCoverTimeoutMs = 8000;
const jikanLookupTimeoutMs = 6000;
const openLibraryLookupTimeoutMs = 7000;
const mangaLookupVersion = "manga-canonical-rank-v3";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return sendJson(405, { message: "Method not allowed." });
  }

  const query = event.queryStringParameters?.query?.trim();

  if (!query) {
    return sendJson(400, { message: "Enter a manga title to search." });
  }

  try {
    const cacheVersion = event.queryStringParameters?.version || mangaLookupVersion;
    const cacheKey = getLookupCacheKey(query, cacheVersion);
    const cachedLookup = getCachedLookup(cacheKey);
    if (cachedLookup) {
      return sendJson(200, { ...cachedLookup, cache: getCacheInfo(true) }, cacheHeaders("HIT"));
    }

    const results = await searchManga(query);
    const body = results.length
      ? { results, message: "" }
      : { results: [], message: "No MangaDex manga results found." };

    setCachedLookup(cacheKey, body);
    return sendJson(200, { ...body, cache: getCacheInfo(false) }, cacheHeaders("MISS"));
  } catch (error) {
    return sendJson(502, { results: [], message: error.message || "MangaDex lookup failed." });
  }
}

async function searchManga(query) {
  const data = await fetchMangadexSearch(query);
  const results = normalizeList(data.data)
    .map((result, index) => normalizeMangadexMangaResult(result, index))
    .filter((result) => result.title || result.authors)
    .slice(0, 14);

  if (!results.length) return [];

  const coverByMangaId = await fetchFirstVolumeCovers(results.map((result) => result.id));
  const withPreferredCovers = results.map((result) => {
    const firstVolumeCover = coverByMangaId.get(result.id);
    return firstVolumeCover
      ? applyCoverMetadata(result, {
        imageUrl: firstVolumeCover.imageUrl,
        coverSource: "mangadex-volume-cover",
        coverPreference: firstVolumeCover.coverPreference,
        coverVolume: firstVolumeCover.volume,
        coverLocale: firstVolumeCover.locale,
        fallbackUsed: false,
      })
      : result;
  });

  const withEnglishCovers = await applyEnglishMangaCoverImages(withPreferredCovers);
  return fillMissingMangadexCoverImages(withEnglishCovers, query);
}

async function fetchMangadexSearch(query) {
  const url = new URL("https://api.mangadex.org/manga");
  url.searchParams.set("title", query);
  url.searchParams.set("limit", "14");
  url.searchParams.append("includes[]", "cover_art");
  url.searchParams.append("includes[]", "author");
  url.searchParams.append("includes[]", "artist");
  url.searchParams.append("contentRating[]", "safe");
  url.searchParams.append("contentRating[]", "suggestive");
  url.searchParams.set("order[followedCount]", "desc");

  const { data, response } = await fetchJsonWithTimeout(url, {
    headers: {
      Accept: "application/json",
    },
  }, mangadexLookupTimeoutMs, "MangaDex lookup timed out.", "MangaDex lookup failed.");

  if (!response.ok) {
    throw new Error(data.errors?.[0]?.detail || data.message || "MangaDex lookup failed.");
  }

  return data;
}

async function fetchFirstVolumeCovers(mangaIds) {
  const uniqueMangaIds = [...new Set(mangaIds.filter(Boolean))];
  if (!uniqueMangaIds.length) return new Map();

  const url = new URL("https://api.mangadex.org/cover");
  uniqueMangaIds.forEach((mangaId) => url.searchParams.append("manga[]", mangaId));
  url.searchParams.set("limit", "100");
  url.searchParams.set("order[volume]", "asc");

  try {
    const { data, response } = await fetchJsonWithTimeout(url, {
      headers: {
        Accept: "application/json",
      },
    }, mangadexCoverTimeoutMs, "MangaDex cover lookup timed out.", "MangaDex cover lookup failed.");
    if (!response.ok) return new Map();

    return chooseFirstVolumeCovers(data.data);
  } catch {
    return new Map();
  }
}

function chooseFirstVolumeCovers(covers) {
  return normalizeList(covers)
    .filter((cover) => cover.attributes?.fileName)
    .sort(compareMangadexCovers)
    .reduce((coverByMangaId, cover) => {
      const mangaId = cover.relationships?.find((relationship) => relationship.type === "manga")?.id;
      if (!mangaId || coverByMangaId.has(mangaId)) return coverByMangaId;

      coverByMangaId.set(mangaId, {
        volume: cover.attributes?.volume || "",
        locale: cover.attributes?.locale || "",
        coverPreference: getCoverPreference(cover),
        imageUrl: `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}`,
      });
      return coverByMangaId;
    }, new Map());
}

function compareMangadexCovers(a, b) {
  return getCoverVolumeGroup(a) - getCoverVolumeGroup(b)
    || getCoverVolumeSortValue(a) - getCoverVolumeSortValue(b)
    || getLocalePriority(a) - getLocalePriority(b)
    || String(a.attributes?.createdAt || "").localeCompare(String(b.attributes?.createdAt || ""));
}

function getCoverVolumeGroup(cover) {
  const volume = Number.parseFloat(cover.attributes?.volume);
  if (volume === 1) return 0;
  if (Number.isFinite(volume) && volume > 0) return 1;
  return 2;
}

function getCoverVolumeSortValue(cover) {
  const volume = Number.parseFloat(cover.attributes?.volume);
  return Number.isFinite(volume) ? volume : Number.MAX_SAFE_INTEGER;
}

function getCoverPreference(cover) {
  return Number.parseFloat(cover.attributes?.volume) === 1 ? "volume-1" : "earliest-volume";
}

function getLocalePriority(cover) {
  const locale = cover.attributes?.locale;
  if (locale === "en") return 0;
  if (locale === "ja") return 1;
  return 2;
}

function normalizeMangadexMangaResult(result, index = 0) {
  const attributes = result.attributes || {};
  const relationships = normalizeList(result.relationships);
  const authors = getMangadexRelationshipNames(relationships, "author");
  const artists = getMangadexRelationshipNames(relationships, "artist");
  const coverFileName = relationships.find((relationship) => relationship.type === "cover_art")?.attributes?.fileName;
  const alternateTitles = normalizeList(attributes.altTitles).flatMap((entry) => Object.values(entry || {}));

  const mangaResult = {
    id: result.id,
    source: "mangadex",
    sourceId: result.id,
    mangadexId: result.id,
    searchRank: index + 1,
    title: getMangadexTitle(attributes),
    originalTitle: getLocalizedText(attributes.title, ["ja-ro", "ja", "ko", "zh", "zh-hk"]) || "",
    alternateTitles,
    malId: attributes.links?.mal || "",
    authors: authors.join(", "),
    artists: artists.join(", "),
    genres: getMangadexTagNames(attributes.tags, "genre").join(", "),
    themes: getMangadexTagNames(attributes.tags, "theme").join(", "),
    demographics: attributes.publicationDemographic || "",
    published: attributes.year ? String(attributes.year) : "",
    status: attributes.status || "",
    chapters: attributes.lastChapter || "",
    volumes: attributes.lastVolume || "",
    score: "",
    synopsis: getLocalizedText(attributes.description, ["en", "ja-ro", "ja", "ko"]) || "",
    imageUrl: coverFileName ? `https://uploads.mangadex.org/covers/${result.id}/${coverFileName}` : "",
    coverSource: coverFileName ? "mangadex-main-cover" : "",
    coverPreference: coverFileName ? "main-cover" : "no-cover",
    coverVolume: "",
    coverLocale: "",
    fallbackUsed: false,
    sourceMetadata: {
      provider: "mangadex",
      mangaId: result.id,
      malId: attributes.links?.mal || "",
      searchRank: index + 1,
      coverSource: coverFileName ? "mangadex-main-cover" : "",
      coverPreference: coverFileName ? "main-cover" : "no-cover",
      coverVolume: "",
      coverLocale: "",
      fallbackUsed: false,
    },
  };

  return {
    ...mangaResult,
    metadataCompletenessScore: getMetadataCompletenessScore(mangaResult),
    variantPenalty: getMangaVariantPenalty(mangaResult),
  };
}

async function applyEnglishMangaCoverImages(results) {
  const coverCandidates = await fetchOpenLibraryEnglishCovers(results.slice(0, 6));
  if (!coverCandidates.size) return results;

  return results.map((result) => {
    const candidate = coverCandidates.get(result.id);
    if (!candidate?.imageUrl || result.coverLocale === "en") return result;

    return applyCoverMetadata(result, {
      imageUrl: candidate.imageUrl,
      coverSource: "open-library-english-cover",
      coverPreference: "english-reader-cover",
      coverVolume: candidate.volume || result.coverVolume,
      coverLocale: "en",
      fallbackUsed: false,
      extraMetadata: {
        openLibraryWorkId: candidate.workId,
        openLibraryCoverId: candidate.coverId,
        openLibraryCoverTitle: candidate.title,
        openLibraryCoverPublisher: candidate.publisher,
        englishCoverScore: candidate.score,
      },
    });
  });
}

async function fetchOpenLibraryEnglishCovers(results) {
  const settledCovers = await Promise.allSettled(
    results.map(fetchOpenLibraryEnglishCover),
  );

  return settledCovers.reduce((coverByMangaId, entry, index) => {
    if (entry.status === "fulfilled" && entry.value?.imageUrl) {
      coverByMangaId.set(results[index].id, entry.value);
    }
    return coverByMangaId;
  }, new Map());
}

async function fetchOpenLibraryEnglishCover(result) {
  const queries = getOpenLibraryMangaCoverQueries(result);
  if (!queries.length) return null;

  const settledSearches = await Promise.allSettled(
    queries.map((query) => fetchOpenLibraryMangaCoverCandidates(query)),
  );
  const candidates = settledSearches.flatMap((entry) => (entry.status === "fulfilled" ? entry.value : []));
  const scoredCandidates = candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreOpenLibraryMangaCover(candidate, result),
    }))
    .filter((candidate) => candidate.score >= 60 && candidate.coverId)
    .sort((a, b) => b.score - a.score || getOpenLibraryMangaCoverVolume(a) - getOpenLibraryMangaCoverVolume(b));

  return scoredCandidates[0] || null;
}

function getOpenLibraryMangaCoverQueries(result) {
  const title = result.title || result.originalTitle || normalizeList(result.alternateTitles).find(Boolean) || "";
  const creator = getPrimaryMangaCreator(result);
  return [
    [title, "Vol 1", creator].filter(Boolean).join(" "),
    [title, "Volume 1", creator].filter(Boolean).join(" "),
    [title, "Book One", creator].filter(Boolean).join(" "),
    [title, creator].filter(Boolean).join(" "),
  ]
    .map((query) => query.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((query, index, queries) => queries.indexOf(query) === index);
}

function getPrimaryMangaCreator(result) {
  return String(result.authors || result.artists || "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean) || "";
}

async function fetchOpenLibraryMangaCoverCandidates(query) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set(
    "fields",
    [
      "key",
      "title",
      "author_name",
      "first_publish_year",
      "cover_i",
      "language",
      "publisher",
      "edition_count",
    ].join(","),
  );
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");

  const { data, response } = await fetchJsonWithTimeout(
    url,
    {},
    openLibraryLookupTimeoutMs,
    "Open Library manga cover lookup timed out.",
    "Open Library manga cover lookup failed.",
  );

  if (!response.ok) return [];

  return normalizeList(data.docs)
    .filter((doc) => doc.cover_i && normalizeList(doc.language).includes("eng"))
    .map((doc) => ({
      workId: doc.key || "",
      title: doc.title || "",
      authors: normalizeList(doc.author_name).join(", "),
      publisher: normalizeList(doc.publisher).find(Boolean) || "",
      publishers: normalizeList(doc.publisher),
      firstPublishYear: doc.first_publish_year || "",
      editionCount: doc.edition_count || "",
      coverId: doc.cover_i,
      imageUrl: getOpenLibraryCoverUrl(doc.cover_i, "L"),
    }));
}

function scoreOpenLibraryMangaCover(candidate, result) {
  const candidateTitle = normalizeCompactSearchText(candidate.title);
  const mangaTitleKeys = getMangaTitleKeys(result);
  const publisherText = normalizeSearchText(candidate.publishers.join(" "));
  const authorText = normalizeCompactSearchText(candidate.authors);
  const creatorKey = normalizeCompactSearchText(getPrimaryMangaCreator(result));
  let score = 0;

  if (mangaTitleKeys.some((title) => candidateTitle.includes(title) || title.includes(candidateTitle))) score += 55;
  if (candidate.coverId) score += 30;
  if (creatorKey && authorText.includes(creatorKey)) score += 20;
  score += getOpenLibraryMangaVolumeScore(candidate.title);
  score += getOpenLibraryMangaPublisherScore(publisherText);
  score -= getOpenLibraryMangaNoisePenalty(candidate.title, publisherText);

  return score;
}

function getOpenLibraryMangaVolumeScore(title) {
  const normalizedTitle = normalizeSearchText(title);
  const compactTitle = normalizeCompactSearchText(title);
  const volume = getOpenLibraryMangaCoverVolume({ title });

  if (/\b(book|vol(?:ume)?\.?)\s*one\b/i.test(normalizedTitle)) return 40;
  if (/(^|[^\d])1\s*[-‐-]\s*2($|[^\d])/.test(normalizedTitle)) return 38;
  if (/\b(vol(?:ume)?\.?|book)\s*1\b/i.test(normalizedTitle)) return 36;
  if (/(^|[^\d])1($|[^\d])/.test(normalizedTitle) || compactTitle.endsWith("1")) return 32;
  if (volume > 0 && volume <= 4) return Math.max(0, 24 - (volume - 1) * 6);
  if (volume > 4) return -30;
  return 0;
}

function getOpenLibraryMangaCoverVolume(candidate) {
  const match = String(candidate.title || "").match(/\b(?:vol(?:ume)?\.?|book)?\s*(\d{1,3})(?:\s*[-‐-]\s*\d{1,3})?\b/i);
  return match ? Number(match[1]) || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}

function getOpenLibraryMangaPublisherScore(publisherText) {
  if (!publisherText) return 0;
  if (publisherText.includes("kodansha")) return 26;
  if (publisherText.includes("viz")) return 24;
  if (publisherText.includes("dark horse")) return 22;
  if (publisherText.includes("yen press")) return 22;
  if (publisherText.includes("seven seas")) return 20;
  if (publisherText.includes("vertical")) return 18;
  return 0;
}

function getOpenLibraryMangaNoisePenalty(title, publisherText) {
  const text = `${normalizeSearchText(title)} ${publisherText}`;
  const compactText = normalizeCompactSearchText(text);
  const terms = [
    { penalty: 80, patterns: ["novel", "light novel", "summary", "study guide"] },
    { penalty: 45, patterns: ["deluxe", "collector", "box set", "omnibus"] },
    { penalty: 35, patterns: ["calendar", "art book", "artbook"] },
  ];

  return terms.reduce((penalty, term) => (
    term.patterns.some((pattern) => text.includes(pattern) || compactText.includes(normalizeCompactSearchText(pattern)))
      ? penalty + term.penalty
      : penalty
  ), 0);
}

async function fillMissingMangadexCoverImages(results, searchText) {
  const missingCoverResults = results.filter((result) => !result.imageUrl);
  if (!missingCoverResults.length) return results;

  const coverByMalId = await fetchJikanCoversByMalId(missingCoverResults);
  const unresolvedResults = missingCoverResults.filter((result) => !coverByMalId.get(String(result.malId || "")));
  const coverByTitle = unresolvedResults.length ? await fetchJikanCoversByTitle(searchText, unresolvedResults) : new Map();

  return results.map((result) => {
    if (result.imageUrl) return result;

    const malCover = coverByMalId.get(String(result.malId || ""));
    const titleCover = coverByTitle.get(result.id);
    const imageUrl = malCover || titleCover || "";

    return imageUrl
      ? applyCoverMetadata(result, {
        imageUrl,
        coverSource: malCover ? "jikan-mal-id-cover" : "jikan-title-match-cover",
        coverPreference: "jikan-fallback",
        fallbackUsed: true,
      })
      : result;
  });
}

async function fetchJikanCoversByMalId(results) {
  const malIds = [...new Set(results.map((result) => String(result.malId || "")).filter(Boolean))].slice(0, 3);
  if (!malIds.length) return new Map();

  const settledCovers = await Promise.allSettled(malIds.map(fetchJikanMangaCoverById));
  return settledCovers.reduce((coverByMalId, entry, index) => {
    if (entry.status === "fulfilled" && entry.value) {
      coverByMalId.set(malIds[index], entry.value);
    }
    return coverByMalId;
  }, new Map());
}

async function fetchJikanMangaCoverById(malId) {
  const url = new URL(`https://api.jikan.moe/v4/manga/${malId}`);
  const { data, response } = await fetchJsonWithTimeout(
    url,
    {},
    jikanLookupTimeoutMs,
    "Jikan cover lookup timed out.",
    "Jikan cover lookup failed.",
  );

  if (!response.ok) {
    throw new Error(data.message || "Jikan cover lookup failed.");
  }

  return getJikanImageUrl(data.data);
}

async function fetchJikanCoversByTitle(searchText, mangadexResults) {
  const url = new URL("https://api.jikan.moe/v4/manga");
  url.searchParams.set("q", searchText);
  url.searchParams.set("limit", "10");
  url.searchParams.set("sfw", "true");

  try {
    const { data, response } = await fetchJsonWithTimeout(
      url,
      {},
      jikanLookupTimeoutMs,
      "Jikan cover lookup timed out.",
      "Jikan cover lookup failed.",
    );

    if (!response.ok) {
      throw new Error(data.message || "Jikan cover lookup failed.");
    }

    const jikanResults = normalizeList(data.data).map(normalizeJikanMangaResult);
    return matchJikanCoversByTitle(mangadexResults, jikanResults);
  } catch {
    return new Map();
  }
}

function normalizeJikanMangaResult(result) {
  return {
    id: result.mal_id,
    title: result.title_english || result.title || result.title_japanese || "",
    originalTitle: result.title_japanese || "",
    alternateTitles: normalizeList(result.titles).map((entry) => entry.title).filter(Boolean),
    imageUrl: getJikanImageUrl(result),
  };
}

function matchJikanCoversByTitle(mangadexResults, jikanResults) {
  return mangadexResults.reduce((coverByMangadexId, mangadexResult) => {
    const mangadexTitleKeys = getMangaTitleKeys(mangadexResult);
    const match = jikanResults.find((jikanResult) => {
      const jikanTitleKeys = getMangaTitleKeys(jikanResult);
      return jikanResult.imageUrl && mangadexTitleKeys.some((key) => jikanTitleKeys.includes(key));
    });

    if (match?.imageUrl) {
      coverByMangadexId.set(mangadexResult.id, match.imageUrl);
    }

    return coverByMangadexId;
  }, new Map());
}

function getMangaTitleKeys(result) {
  return [
    result.title,
    result.originalTitle,
    ...normalizeList(result.alternateTitles),
  ]
    .map(normalizeCompactSearchText)
    .filter(Boolean);
}

function getJikanImageUrl(result) {
  return result?.images?.jpg?.large_image_url || result?.images?.jpg?.image_url || "";
}

function applyCoverMetadata(result, metadata) {
  const sourceMetadata = {
    ...result.sourceMetadata,
    ...metadata.extraMetadata,
    coverSource: metadata.coverSource,
    coverPreference: metadata.coverPreference ?? result.coverPreference ?? "no-cover",
    coverVolume: metadata.coverVolume ?? result.coverVolume ?? "",
    coverLocale: metadata.coverLocale ?? result.coverLocale ?? "",
    fallbackUsed: Boolean(metadata.fallbackUsed),
  };

  return {
    ...result,
    imageUrl: metadata.imageUrl || result.imageUrl,
    coverSource: sourceMetadata.coverSource,
    coverPreference: sourceMetadata.coverPreference,
    coverVolume: sourceMetadata.coverVolume,
    coverLocale: sourceMetadata.coverLocale,
    fallbackUsed: sourceMetadata.fallbackUsed,
    sourceMetadata,
  };
}

function getMetadataCompletenessScore(result) {
  return [
    result.title,
    result.authors,
    result.artists,
    result.published,
    result.status,
    result.volumes,
    result.chapters,
    result.genres,
    result.synopsis,
    result.malId,
  ].filter(Boolean).length;
}

function getMangaVariantPenalty(result) {
  const text = [
    result.title,
    result.originalTitle,
    ...normalizeList(result.alternateTitles),
    result.genres,
    result.themes,
  ].join(" ");

  return getMangaVariantTerms(text).length * 80;
}

function getMangaVariantTerms(value) {
  const normalizedText = normalizeSearchText(value);
  const compactText = normalizeCompactSearchText(value);
  const terms = [
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

  return [...new Set(terms
    .filter((term) => term.patterns.some((pattern) => normalizedText.includes(pattern)) || compactText.includes(term.compact))
    .map((term) => term.id))];
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-");
}

function getMangadexTitle(attributes) {
  const altTitles = normalizeList(attributes.altTitles).flatMap((entry) => Object.values(entry || {}));
  return getLocalizedText(attributes.title, ["en", "ja-ro", "ja", "ko", "zh", "zh-hk"]) || altTitles.find(Boolean) || "";
}

function getLocalizedText(value, preferredLocales) {
  if (!value || typeof value !== "object") return "";
  const preferredValue = preferredLocales.map((locale) => value[locale]).find(Boolean);
  return preferredValue || Object.values(value).find(Boolean) || "";
}

function getMangadexRelationshipNames(relationships, type) {
  const names = relationships
    .filter((relationship) => relationship.type === type)
    .map((relationship) => relationship.attributes?.name)
    .filter(Boolean);

  return [...new Set(names)];
}

function getMangadexTagNames(tags, group) {
  return normalizeList(tags)
    .filter((tag) => tag.attributes?.group === group)
    .map((tag) => getLocalizedText(tag.attributes?.name, ["en"]))
    .filter(Boolean);
}

function normalizeCompactSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function getOpenLibraryCoverUrl(coverId, size = "M") {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : "";
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs, timeoutMessage, failureMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { data, response };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(timeoutMessage, { cause: error });
    }
    throw new Error(failureMessage || error.message, { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeList(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function getLookupCacheKey(query, version = mangaLookupVersion) {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
    version,
  });
}

function getCachedLookup(cacheKey) {
  const cachedLookup = lookupCache.get(cacheKey);
  if (!cachedLookup) return null;

  if (Date.now() > cachedLookup.expiresAt) {
    lookupCache.delete(cacheKey);
    return null;
  }

  return cachedLookup.body;
}

function setCachedLookup(cacheKey, body) {
  if (lookupCache.size >= lookupCacheMaxEntries && !lookupCache.has(cacheKey)) {
    lookupCache.delete(lookupCache.keys().next().value);
  }

  lookupCache.set(cacheKey, {
    body,
    expiresAt: Date.now() + lookupCacheTtlMs,
  });
}

function getCacheInfo(hit) {
  return {
    hit,
    ttlSeconds: Math.round(lookupCacheTtlMs / 1000),
  };
}

function cacheHeaders(status) {
  return {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=21600",
    "X-Lookup-Cache": status,
  };
}

function sendJson(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      ...jsonHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}
