const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const lookupCache = new Map();
const lookupCacheTtlMs = 6 * 60 * 60 * 1000;
const lookupCacheMaxEntries = 100;

const languageCodes = {
  all: "",
  en: "eng",
  ko: "kor",
};

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
  const language = event.queryStringParameters?.language || "en";

  if (!query) {
    return sendJson(400, { message: "Enter a book title or author to search." });
  }

  try {
    const cacheKey = getLookupCacheKey(query, language);
    const cachedLookup = getCachedLookup(cacheKey);
    if (cachedLookup) {
      return sendJson(200, { ...cachedLookup, cache: getCacheInfo(true) }, cacheHeaders("HIT"));
    }

    const results = await searchOpenLibraryBooks(query, language);
    const body = results.length
      ? { results, message: "" }
      : { results: [], message: "No Open Library results found." };

    setCachedLookup(cacheKey, body);
    return sendJson(200, { ...body, cache: getCacheInfo(false) }, cacheHeaders("MISS"));
  } catch (error) {
    return sendJson(502, { results: [], message: error.message || "Open Library lookup failed." });
  }
}

async function searchOpenLibraryBooks(query, language) {
  const url = new URL("https://openlibrary.org/search.json");
  const preferredLanguage = getPreferredLanguage(language);
  url.searchParams.set("q", buildOpenLibraryQuery(query, language));
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
      "subject",
      "edition_count",
      "number_of_pages_median",
    ].join(","),
  );
  url.searchParams.set("limit", "14");
  if (language !== "all") {
    url.searchParams.set("lang", language);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Open Library lookup failed.");
  }

  const docs = normalizeList(data.docs)
    .filter((doc) => doc.title || normalizeList(doc.author_name).length)
    .slice(0, 14);
  const editionSelections = await fetchPreferredEditions(docs.slice(0, 6), preferredLanguage);

  return docs
    .map((doc) => normalizeOpenLibraryBookResult(doc, editionSelections.get(doc.key), preferredLanguage))
    .filter((result) => result.title || result.authors);
}

async function fetchPreferredEditions(docs, preferredLanguage) {
  const settledEditions = await Promise.allSettled(
    docs.map((doc) => fetchPreferredEdition(doc.key, preferredLanguage)),
  );

  return settledEditions.reduce((selectedByWorkKey, entry, index) => {
    if (entry.status === "fulfilled" && entry.value) {
      selectedByWorkKey.set(docs[index].key, entry.value);
    }
    return selectedByWorkKey;
  }, new Map());
}

async function fetchPreferredEdition(workKey, preferredLanguage) {
  if (!workKey) return null;

  const url = new URL(`https://openlibrary.org${workKey}/editions.json`);
  url.searchParams.set("limit", "50");
  url.searchParams.set(
    "fields",
    [
      "key",
      "title",
      "languages",
      "covers",
      "isbn_10",
      "isbn_13",
      "publish_date",
      "publishers",
      "number_of_pages",
    ].join(","),
  );

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) return null;

  const editions = normalizeList(data.entries).filter((edition) => hasCoverIdentifier(edition));
  if (!editions.length) return null;

  const preferredEditions = editions.filter((edition) => hasEditionLanguage(edition, preferredLanguage));
  return [...(preferredEditions.length ? preferredEditions : editions)]
    .sort(compareOpenLibraryEditions)
    .at(0) || null;
}

function compareOpenLibraryEditions(a, b) {
  return getEditionYear(b) - getEditionYear(a) || Number(getEditionCoverId(Boolean(b), b) || 0) - Number(getEditionCoverId(Boolean(a), a) || 0);
}

function normalizeOpenLibraryBookResult(doc, selectedEdition, preferredLanguage) {
  const editionCoverId = getEditionCoverId(Boolean(selectedEdition), selectedEdition);
  const editionIsbn = getEditionIsbn(selectedEdition);
  const editionIsPreferredLanguage = selectedEdition && hasEditionLanguage(selectedEdition, preferredLanguage);
  const coverSource = editionCoverId
    ? "open-library-edition-cover-id"
    : editionIsbn
      ? "open-library-edition-isbn"
      : doc.cover_i
        ? "open-library-work-cover-id"
        : "";
  const imageUrl = editionCoverId
    ? getOpenLibraryCoverUrl(editionCoverId, "L")
    : editionIsbn
      ? getOpenLibraryIsbnCoverUrl(editionIsbn, "L")
      : getOpenLibraryCoverUrl(doc.cover_i, "L");
  const coverPreference = editionIsPreferredLanguage ? "newest-preferred-language-edition" : imageUrl ? "fallback-edition-or-work" : "";

  return {
    id: doc.key,
    source: "open-library",
    sourceId: doc.key,
    openLibraryWorkId: doc.key,
    editionId: selectedEdition?.key || "",
    openLibraryEditionId: selectedEdition?.key || "",
    editionTitle: selectedEdition?.title || "",
    title: doc.title || selectedEdition?.title || "",
    authors: normalizeList(doc.author_name).join(", "),
    firstPublishYear: doc.first_publish_year || "",
    editionCount: doc.edition_count || "",
    pageCount: selectedEdition?.number_of_pages || doc.number_of_pages_median || "",
    languages: normalizeList(doc.language),
    publishers: normalizeList(selectedEdition?.publishers).join(", ") || normalizeList(doc.publisher).slice(0, 3).join(", "),
    subjects: normalizeList(doc.subject).slice(0, 5).join(", "),
    imageUrl,
    coverSource,
    coverPreference,
    sourceMetadata: {
      provider: "open-library",
      workId: doc.key,
      editionId: selectedEdition?.key || "",
      editionTitle: selectedEdition?.title || "",
      preferredLanguage,
      editionLanguageMatched: Boolean(editionIsPreferredLanguage),
      coverSource,
      coverPreference,
    },
  };
}

function buildOpenLibraryQuery(query, language) {
  const languageFilter = language === "ko" ? "language:kor" : language === "en" ? "language:eng" : "";
  return [query, languageFilter].filter(Boolean).join(" ");
}

function getPreferredLanguage(language) {
  return languageCodes[language] || languageCodes.en;
}

function hasEditionLanguage(edition, preferredLanguage) {
  if (!preferredLanguage) return true;
  return normalizeList(edition?.languages).some((entry) => {
    const key = typeof entry === "string" ? entry : entry?.key;
    return key === preferredLanguage || key === `/languages/${preferredLanguage}`;
  });
}

function hasCoverIdentifier(edition) {
  return getEditionCoverId(Boolean(edition), edition) || getEditionIsbn(edition);
}

function getEditionCoverId(hasEdition, edition) {
  if (!hasEdition) return "";
  return normalizeList(edition?.covers).find(Boolean) || "";
}

function getEditionIsbn(edition) {
  return normalizeList(edition?.isbn_13).find(Boolean) || normalizeList(edition?.isbn_10).find(Boolean) || "";
}

function getEditionYear(edition) {
  const publishDate = normalizeList(edition?.publish_date).find(Boolean) || edition?.publish_date || "";
  const match = String(publishDate).match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? Number(match[1]) : 0;
}

function getOpenLibraryCoverUrl(coverId, size = "M") {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : "";
}

function getOpenLibraryIsbnCoverUrl(isbn, size = "M") {
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false` : "";
}

function normalizeList(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function getLookupCacheKey(query, language) {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
    language,
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
