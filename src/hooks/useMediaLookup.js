import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openLibraryCanonicalBookLanguage } from "../lib/mediaConfig";
import {
  dedupeLookupResults,
  getBookLookupLanguage,
  getLookupQueryVariants,
  getLookupMessage,
  normalizeLookupQuery,
  rankLookupResults,
} from "../lib/mediaUtils";
import {
  fetchProviderResults,
  getAladinItemPatch,
  getAnimeItemPatch,
  getFallbackLookupProviders,
  getLookupProviders,
  getMangaItemPatch,
  getOmdbItemPatch,
  getOpenLibraryItemPatch,
  getTmdbItemPatch,
} from "../lib/mediaLookup";

function withoutPersonalNotes(patch) {
  const { notes, ...safePatch } = patch;
  return safePatch;
}

function applyPatch(setDraft, patch) {
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
    pageCount: patch.pageCount || current.pageCount,
    publisher: patch.publisher || current.publisher,
    isbn: patch.isbn || current.isbn,
    author: patch.author || current.author,
    artist: patch.artist || current.artist,
    volumeCount: patch.volumeCount || current.volumeCount,
    chapterCount: patch.chapterCount || current.chapterCount,
    seasonCount: patch.seasonCount || current.seasonCount,
    episodeCount: patch.episodeCount || current.episodeCount,
    seasonBreakdown: patch.seasonBreakdown || current.seasonBreakdown,
    durationMinutesPerEpisode: patch.durationMinutesPerEpisode || current.durationMinutesPerEpisode,
    studio: patch.studio || current.studio,
    imageUrl: patch.imageUrl || current.imageUrl,
    synopsis: patch.synopsis || current.synopsis,
  }));
}

const lookupSuggestionDelayMs = 350;
const minLookupSuggestionLength = 2;
const lookupCacheMaxEntries = 40;

function getLookupCacheKey({ bookLanguage, category, query, subtype }) {
  return JSON.stringify({
    bookLanguage,
    category,
    query: query.toLowerCase(),
    subtype,
  });
}

function rememberLookup(cache, key, value) {
  if (cache.size >= lookupCacheMaxEntries && !cache.has(key)) {
    cache.delete(cache.keys().next().value);
  }

  cache.set(key, value);
}

function dedupeMessages(messages) {
  return [...new Set(messages.filter(Boolean))];
}

export function useMediaLookup({ draft, isEditorOpen, setDraft }) {
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupStatus, setLookupStatus] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [bookLanguage, setBookLanguage] = useState(openLibraryCanonicalBookLanguage);
  const [pendingLookup, setPendingLookup] = useState(null);
  const [shouldRunLookup, setShouldRunLookup] = useState(false);
  const [appliedLookupSourceLabel, setAppliedLookupSourceLabel] = useState("");
  const lookupCacheRef = useRef(new Map());
  const lookupRequestIdRef = useRef(0);
  const lookupInFlightKeysRef = useRef(new Set());

  const lookupProviders = useMemo(
    () => getLookupProviders(draft.category, draft.subtype),
    [draft.category, draft.subtype],
  );
  const canUseBookLookup = draft.category === "books";

  const resetLookupState = useCallback(() => {
    setLookupQuery("");
    setLookupResults([]);
    setLookupStatus("idle");
    setLookupMessage("");
    setAppliedLookupSourceLabel("");
  }, []);

  const runLookup = useCallback(async (cleanedQuery, mode = "manual") => {
    const providers = getLookupProviders(draft.category, draft.subtype);
    const isManualLookup = mode === "manual";

    if (!cleanedQuery || !providers.length) {
      if (isManualLookup) {
        setLookupStatus("error");
        setLookupMessage("Enter a title to search.");
      }
      return;
    }

    const cacheKey = getLookupCacheKey({
      bookLanguage: draft.category === "books" ? getBookLookupLanguage(draft.subtype, bookLanguage) : bookLanguage,
      category: draft.category,
      query: cleanedQuery,
      subtype: draft.subtype,
    });

    if (lookupInFlightKeysRef.current.has(cacheKey)) return;

    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;

    const cachedLookup = lookupCacheRef.current.get(cacheKey);
    if (cachedLookup) {
      setLookupResults(cachedLookup.results);
      setLookupStatus(cachedLookup.results.length ? "success" : isManualLookup ? "error" : "idle");
      setLookupMessage(isManualLookup ? cachedLookup.message : "");
      setAppliedLookupSourceLabel("");
      return;
    }

    setLookupStatus("loading");
    setLookupMessage("");
    setLookupResults([]);
    setAppliedLookupSourceLabel("");
    lookupInFlightKeysRef.current.add(cacheKey);

    const runProviderSearches = async (activeProviders) => {
      const queryVariants = getLookupQueryVariants(cleanedQuery);
      const searches = activeProviders.flatMap((provider) => queryVariants.map((queryVariant) => {
        return fetchProviderResults(queryVariant, provider, {
          category: draft.category,
          language: draft.category === "books" ? getBookLookupLanguage(draft.subtype, bookLanguage) : bookLanguage,
          subtype: draft.subtype,
        });
      }));

      const settledResults = await Promise.allSettled(searches);
      const providerResults = settledResults.flatMap((entry) => (entry.status === "fulfilled" ? entry.value.results : []));
      const messages = providerResults.length
        ? []
        : settledResults.map(getLookupMessage).filter(Boolean);

      return { messages, providerResults };
    };

    try {
      const preferredProvider = providers[0]?.id;
      let { messages, providerResults } = await runProviderSearches(providers);
      const fallbackProviders = getFallbackLookupProviders(draft.category, draft.subtype, providers.map((provider) => provider.id));

      if (!providerResults.length && fallbackProviders.length) {
        const primaryMessages = messages;
        const fallbackSearch = await runProviderSearches(fallbackProviders);
        providerResults = fallbackSearch.providerResults;
        messages = fallbackSearch.providerResults.length
          ? fallbackSearch.messages
          : dedupeMessages([...primaryMessages, ...fallbackSearch.messages]);
      }

      if (lookupRequestIdRef.current !== requestId) return;

      const dedupedResults = dedupeLookupResults(providerResults, preferredProvider);
      const results = rankLookupResults(dedupedResults, cleanedQuery);
      const message = messages[0] || "No matching results found.";

      rememberLookup(lookupCacheRef.current, cacheKey, { message, results });

      if (!results.length) {
        setLookupResults([]);
        setLookupStatus(isManualLookup ? "error" : "idle");
        setLookupMessage(isManualLookup ? message : "");
        return;
      }

      setLookupResults(results);
      setLookupStatus("success");
      setLookupMessage(isManualLookup && messages.length ? messages.join(" ") : "");
    } finally {
      lookupInFlightKeysRef.current.delete(cacheKey);
    }
  }, [bookLanguage, draft.category, draft.subtype]);

  const searchDetails = useCallback(async (event) => {
    event?.preventDefault();
    const cleanedQuery = normalizeLookupQuery(lookupQuery);
    await runLookup(cleanedQuery, "manual");
  }, [lookupQuery, runLookup]);

  const applyLookupResult = useCallback(async (lookupResult) => {
    setLookupStatus("loading");
    setLookupMessage("");

    try {
      if (lookupResult.source === "omdb") {
        const patch = withoutPersonalNotes(await getOmdbItemPatch(lookupResult.result, draft.category, draft.subtype));
        applyPatch(setDraft, patch);
        setLookupMessage("Details added. You can edit anything before saving.");
      } else if (lookupResult.source === "tmdb") {
        const patch = withoutPersonalNotes(await getTmdbItemPatch(lookupResult.result, draft));
        applyPatch(setDraft, patch);
        setLookupMessage("Details added. You can adjust the type before saving.");
      } else if (lookupResult.source === "open-library") {
        const patch = withoutPersonalNotes(getOpenLibraryItemPatch(lookupResult.result, draft));
        applyPatch(setDraft, patch);
        setLookupMessage(patch.subtype === "korean-book" ? "Korean book details added." : "Book details added. You can adjust the type before saving.");
      } else if (lookupResult.source === "aladin") {
        const patch = withoutPersonalNotes(getAladinItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Korean book details added.");
      } else if (lookupResult.source === "jikan-anime") {
        const patch = withoutPersonalNotes(getAnimeItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Anime details added. You can edit anything before saving.");
      } else {
        const patch = withoutPersonalNotes(getMangaItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Manga details added. You can edit anything before saving.");
      }

      setLookupQuery("");
      setLookupResults([]);
      setLookupStatus("success");
      setAppliedLookupSourceLabel(lookupResult.sourceLabel);
    } catch (error) {
      setLookupStatus("error");
      setLookupMessage(error.message || "Could not apply that result.");
    }
  }, [draft, setDraft]);

  const queueLookup = useCallback((lookup) => {
    setPendingLookup(lookup);
  }, []);

  useEffect(() => {
    if (!pendingLookup || !isEditorOpen) return;
    if (draft.category !== pendingLookup.categoryId || draft.status !== pendingLookup.status) return;
    if (pendingLookup.subtype && draft.subtype !== pendingLookup.subtype) return;

    setLookupQuery(pendingLookup.query);
    setLookupResults([]);
    setLookupStatus("idle");
    setLookupMessage("");
    setAppliedLookupSourceLabel("");
    setShouldRunLookup(Boolean(pendingLookup.query.trim()));
    setPendingLookup(null);
  }, [draft.category, draft.status, draft.subtype, isEditorOpen, pendingLookup]);

  useEffect(() => {
    if (!shouldRunLookup || !isEditorOpen || !lookupQuery.trim()) return;

    setShouldRunLookup(false);
    searchDetails();
  }, [isEditorOpen, lookupQuery, searchDetails, shouldRunLookup]);

  useEffect(() => {
    if (!isEditorOpen || shouldRunLookup) return;

    const cleanedQuery = normalizeLookupQuery(lookupQuery);
    if (cleanedQuery.length < minLookupSuggestionLength) {
      lookupRequestIdRef.current += 1;
      setLookupResults([]);
      setLookupStatus("idle");
      setLookupMessage("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      runLookup(cleanedQuery, "suggestion");
    }, lookupSuggestionDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [isEditorOpen, lookupQuery, runLookup, shouldRunLookup]);

  return {
    appliedLookupSourceLabel,
    bookLanguage,
    canUseBookLookup,
    lookupMessage,
    lookupProviders,
    lookupQuery,
    lookupResults,
    lookupStatus,
    queueLookup,
    resetLookupState,
    searchDetails,
    setBookLanguage,
    setLookupQuery,
    applyLookupResult,
  };
}
