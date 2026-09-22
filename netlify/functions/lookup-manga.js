const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const lookupCache = new Map();
const lookupCacheTtlMs = 6 * 60 * 60 * 1000;
const lookupCacheMaxEntries = 100;

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
    const cacheKey = getLookupCacheKey(query);
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
    .map(normalizeMangadexMangaResult)
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
        coverVolume: firstVolumeCover.volume,
        coverLocale: firstVolumeCover.locale,
        fallbackUsed: false,
      })
      : result;
  });

  return fillMissingMangadexCoverImages(withPreferredCovers, query);
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

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  const data = await response.json();

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
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
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
        imageUrl: `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}`,
      });
      return coverByMangaId;
    }, new Map());
}

function compareMangadexCovers(a, b) {
  return getCoverVolumeSortValue(a) - getCoverVolumeSortValue(b)
    || getLocalePriority(a) - getLocalePriority(b)
    || String(a.attributes?.createdAt || "").localeCompare(String(b.attributes?.createdAt || ""));
}

function getCoverVolumeSortValue(cover) {
  const volume = Number.parseFloat(cover.attributes?.volume);
  return Number.isFinite(volume) ? volume : Number.MAX_SAFE_INTEGER;
}

function getLocalePriority(cover) {
  const locale = cover.attributes?.locale;
  if (locale === "en") return 0;
  if (locale === "ja") return 1;
  return 2;
}

function normalizeMangadexMangaResult(result) {
  const attributes = result.attributes || {};
  const relationships = normalizeList(result.relationships);
  const authors = getMangadexRelationshipNames(relationships, "author");
  const artists = getMangadexRelationshipNames(relationships, "artist");
  const coverFileName = relationships.find((relationship) => relationship.type === "cover_art")?.attributes?.fileName;
  const alternateTitles = normalizeList(attributes.altTitles).flatMap((entry) => Object.values(entry || {}));

  return {
    id: result.id,
    source: "mangadex",
    sourceId: result.id,
    mangadexId: result.id,
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
    coverVolume: "",
    coverLocale: "",
    fallbackUsed: false,
    sourceMetadata: {
      provider: "mangadex",
      mangaId: result.id,
      malId: attributes.links?.mal || "",
      coverSource: coverFileName ? "mangadex-main-cover" : "",
      coverVolume: "",
      coverLocale: "",
      fallbackUsed: false,
    },
  };
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
  const response = await fetch(url);
  const data = await response.json();

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
    const response = await fetch(url);
    const data = await response.json();

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
    coverSource: metadata.coverSource,
    coverVolume: metadata.coverVolume ?? result.coverVolume ?? "",
    coverLocale: metadata.coverLocale ?? result.coverLocale ?? "",
    fallbackUsed: Boolean(metadata.fallbackUsed),
  };

  return {
    ...result,
    imageUrl: metadata.imageUrl || result.imageUrl,
    coverSource: sourceMetadata.coverSource,
    coverVolume: sourceMetadata.coverVolume,
    coverLocale: sourceMetadata.coverLocale,
    fallbackUsed: sourceMetadata.fallbackUsed,
    sourceMetadata,
  };
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

function normalizeList(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function getLookupCacheKey(query) {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
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
