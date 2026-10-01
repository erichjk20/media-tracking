const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
};

const lookupCache = new Map();
const lookupCacheTtlMs = 6 * 60 * 60 * 1000;
const lookupCacheMaxEntries = 100;
const bookLookupVersion = "book-cover-v3";

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
    const cacheVersion = event.queryStringParameters?.version || bookLookupVersion;
    const cacheKey = getLookupCacheKey(query, language, cacheVersion);
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
  const enrichedDocs = await fetchWorkDetails(docs.slice(0, 8));
  const editionSelections = await fetchPreferredEditions(docs.slice(0, 8), preferredLanguage, query);

  return docs
    .map((doc) => normalizeOpenLibraryBookResult(
      {
        ...doc,
        workDetails: enrichedDocs.get(doc.key) || {},
      },
      editionSelections.get(doc.key),
      preferredLanguage,
    ))
    .filter((result) => result.title || result.authors);
}

async function fetchWorkDetails(docs) {
  const settledDetails = await Promise.allSettled(
    docs.map((doc) => fetchWorkDetail(doc.key)),
  );

  return settledDetails.reduce((detailsByWorkKey, entry, index) => {
    if (entry.status === "fulfilled" && entry.value) {
      detailsByWorkKey.set(docs[index].key, entry.value);
    }
    return detailsByWorkKey;
  }, new Map());
}

async function fetchWorkDetail(workKey) {
  if (!workKey) return null;

  const response = await fetch(`https://openlibrary.org${workKey}.json`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;

  return {
    description: normalizeOpenLibraryDescription(data.description),
    descriptionSource: data.description ? "open-library-work-description" : "",
  };
}

async function fetchPreferredEditions(docs, preferredLanguage, query) {
  const settledEditions = await Promise.allSettled(
    docs.map((doc) => fetchPreferredEdition(doc, preferredLanguage, query)),
  );

  return settledEditions.reduce((selectedByWorkKey, entry, index) => {
    if (entry.status === "fulfilled" && entry.value) {
      selectedByWorkKey.set(docs[index].key, entry.value);
    }
    return selectedByWorkKey;
  }, new Map());
}

async function fetchPreferredEdition(doc, preferredLanguage, query) {
  const workKey = doc?.key;
  if (!workKey) return null;

  const url = new URL(`https://openlibrary.org${workKey}/editions.json`);
  url.searchParams.set("limit", "75");
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
      "physical_format",
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
    .map((edition) => ({
      ...edition,
      selection: scoreOpenLibraryEdition(edition, {
        firstPublishYear: doc.first_publish_year,
        preferredLanguage,
        query,
        workTitle: doc.title,
      }),
    }))
    .sort(compareScoredOpenLibraryEditions)
    .at(0) || null;
}

function compareScoredOpenLibraryEditions(a, b) {
  return Number(b.selection?.score || 0) - Number(a.selection?.score || 0)
    || getEditionYear(b) - getEditionYear(a)
    || Number(getEditionCoverId(Boolean(b), b) || 0) - Number(getEditionCoverId(Boolean(a), a) || 0);
}

function scoreOpenLibraryEdition(edition, { firstPublishYear, preferredLanguage, query, workTitle }) {
  const coverId = getEditionCoverId(Boolean(edition), edition);
  const isbn = getEditionIsbn(edition);
  const editionTitle = edition?.title || "";
  const editionText = [
    editionTitle,
    edition?.physical_format,
    ...normalizeList(edition?.publishers),
  ].join(" ");
  const penaltyReasons = getEditionPenaltyReasons(editionText);
  let score = 0;

  if (hasEditionLanguage(edition, preferredLanguage)) score += 45;
  else if (preferredLanguage) score -= 80;

  if (coverId) score += 45;
  else if (isbn) score += 18;

  score += getEditionTitleScore(editionTitle, workTitle, query);
  score += getEditionFormatScore(edition);
  score += getEditionPublisherScore(edition);
  score += getEditionMetadataScore(edition);
  score += getEditionPublicationTimingScore(edition, firstPublishYear);
  score -= penaltyReasons.reduce((total, reason) => total + reason.penalty, 0);

  return {
    score,
    penaltyReasons: penaltyReasons.map((reason) => reason.id),
  };
}

function getEditionTitleScore(editionTitle, workTitle, query) {
  const compactEditionTitle = normalizeCompactText(editionTitle);
  const compactWorkTitle = normalizeCompactText(workTitle);
  const compactQuery = normalizeCompactText(query);

  if (!compactEditionTitle) return 0;
  if (compactWorkTitle && compactEditionTitle === compactWorkTitle) return 25;
  if (compactQuery && compactEditionTitle === compactQuery) return 20;
  if (compactWorkTitle && compactEditionTitle.includes(compactWorkTitle)) return 10;
  if (compactQuery && compactEditionTitle.includes(compactQuery)) return 8;
  return -8;
}

function getEditionMetadataScore(edition) {
  return [
    normalizeList(edition?.publishers).length,
    edition?.publish_date,
    edition?.number_of_pages,
    getEditionIsbn(edition),
  ].filter(Boolean).length * 4;
}

function getEditionFormatScore(edition) {
  const format = normalizeSearchText(edition?.physical_format);
  if (format.includes("paperback")) return 14;
  if (format.includes("hardcover") || format.includes("hardback")) return 10;
  if (format.includes("ebook")) return -4;
  return 0;
}

function getEditionPublisherScore(edition) {
  const publisherText = normalizeSearchText(normalizeList(edition?.publishers).join(" "));
  if (!publisherText) return 0;
  if (publisherText.includes("del rey") || publisherText.includes("del ray")) return 18;
  if (publisherText.includes("random house") || publisherText.includes("penguin random house")) return 14;
  if (publisherText.includes("tor ") || publisherText === "tor" || publisherText.includes("st. martin")) return 10;
  if (publisherText.includes("hodder")) return 4;
  if (publisherText.includes("thorndike") || publisherText.includes("turtleback")) return -22;
  if (publisherText.includes("recorded books") || publisherText.includes("blackstone")) return -35;
  return 0;
}

function getEditionPublicationTimingScore(edition, firstPublishYear) {
  const year = getEditionYear(edition);
  if (!year) return 0;
  const baselineYear = Number(firstPublishYear) || year;
  const yearsAfterFirstPublication = year - baselineYear;

  if (yearsAfterFirstPublication < 0) return -6;
  if (yearsAfterFirstPublication <= 1) return 28;
  if (yearsAfterFirstPublication <= 3) return 20;
  if (yearsAfterFirstPublication <= 6) return 8;
  if (yearsAfterFirstPublication <= 10) return -12;
  return -28;
}

function getEditionPenaltyReasons(value) {
  const normalizedText = normalizeSearchText(value);
  const compactText = normalizeCompactText(value);
  const terms = [
    { id: "summary", penalty: 80, patterns: ["summary", "summaries", "study guide", "analysis", "notes"] },
    { id: "classroom", penalty: 55, patterns: ["teacher", "classroom", "student edition", "workbook"] },
    { id: "audiobook", penalty: 55, patterns: ["audio", "audiobook", "cd"] },
    { id: "large-print", penalty: 35, patterns: ["large print", "largeprint"] },
    { id: "library-binding", penalty: 25, patterns: ["library binding", "librarybinding"] },
    { id: "movie-tie-in", penalty: 25, patterns: ["movie tie-in", "motion picture", "netflix", "film tie-in"] },
    { id: "abridged", penalty: 25, patterns: ["abridged", "adapted"] },
  ];

  return terms.filter((term) => term.patterns.some((pattern) => (
    normalizedText.includes(pattern) || compactText.includes(normalizeCompactText(pattern))
  )));
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
  const coverPenaltyReasons = normalizeList(selectedEdition?.selection?.penaltyReasons);

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
    description: doc.workDetails?.description || "",
    imageUrl,
    coverSource,
    coverPreference: editionIsPreferredLanguage ? "english-edition-cover" : coverPreference,
    isbn13: normalizeList(selectedEdition?.isbn_13).find(Boolean) || "",
    isbn10: normalizeList(selectedEdition?.isbn_10).find(Boolean) || "",
    sourceMetadata: {
      provider: "open-library",
      workId: doc.key,
      editionId: selectedEdition?.key || "",
      editionTitle: selectedEdition?.title || "",
      preferredLanguage,
      editionLanguageMatched: Boolean(editionIsPreferredLanguage),
      coverSource,
      coverPreference: editionIsPreferredLanguage ? "english-edition-cover" : coverPreference,
      editionScore: selectedEdition?.selection?.score || 0,
      coverPenaltyReasons,
      descriptionSource: doc.workDetails?.descriptionSource || "",
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

function normalizeOpenLibraryDescription(description) {
  const value = typeof description === "string" ? description : description?.value || "";
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-");
}

function normalizeCompactText(value) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}]+/gu, "");
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

function getLookupCacheKey(query, language, version = bookLookupVersion) {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
    language,
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
