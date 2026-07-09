import { useCallback, useEffect, useMemo, useState } from "react";
import { openLibraryCanonicalBookLanguage } from "../lib/mediaConfig";
import {
  dedupeLookupResults,
  getBookLookupLanguage,
  getLookupMessage,
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
    durationMinutesPerEpisode: patch.durationMinutesPerEpisode || current.durationMinutesPerEpisode,
    studio: patch.studio || current.studio,
    imageUrl: patch.imageUrl || current.imageUrl,
    synopsis: patch.synopsis || current.synopsis,
  }));
}

export function useMediaLookup({ draft, isEditorOpen, setDraft }) {
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupStatus, setLookupStatus] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [bookLanguage, setBookLanguage] = useState(openLibraryCanonicalBookLanguage);
  const [pendingLookup, setPendingLookup] = useState(null);
  const [shouldRunLookup, setShouldRunLookup] = useState(false);

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
  }, []);

  const searchDetails = useCallback(async (event) => {
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

      return { messages, providerResults };
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
  }, [bookLanguage, draft.category, draft.subtype, lookupQuery]);

  const applyLookupResult = useCallback(async (lookupResult) => {
    setLookupStatus("loading");
    setLookupMessage("");

    try {
      if (lookupResult.source === "omdb") {
        const patch = withoutPersonalNotes(await getOmdbItemPatch(lookupResult.result, draft.category, draft.subtype));
        applyPatch(setDraft, patch);
        setLookupMessage("Details added from OMDb. You can edit anything before saving.");
      } else if (lookupResult.source === "tmdb") {
        const patch = withoutPersonalNotes(await getTmdbItemPatch(lookupResult.result, draft));
        applyPatch(setDraft, patch);
        setLookupMessage(patch.subtype === "korean-movie" || patch.subtype === "kdrama" ? "Korean media details added from TMDb." : "TMDb details added. You can adjust the subtype before saving.");
      } else if (lookupResult.source === "open-library") {
        const patch = withoutPersonalNotes(getOpenLibraryItemPatch(lookupResult.result, draft));
        applyPatch(setDraft, patch);
        setLookupMessage(patch.subtype === "korean-book" ? "Korean book details added." : "Book details added. You can adjust the type before saving.");
      } else if (lookupResult.source === "aladin") {
        const patch = withoutPersonalNotes(getAladinItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Korean book details added from Aladin.");
      } else if (lookupResult.source === "jikan-anime") {
        const patch = withoutPersonalNotes(getAnimeItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Anime details added from Jikan. You can edit anything before saving.");
      } else {
        const patch = withoutPersonalNotes(getMangaItemPatch(lookupResult.result));
        applyPatch(setDraft, patch);
        setLookupMessage("Manga details added from Jikan. You can edit anything before saving.");
      }

      setLookupQuery("");
      setLookupResults([]);
      setLookupStatus("success");
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
    setShouldRunLookup(Boolean(pendingLookup.query.trim()));
    setPendingLookup(null);
  }, [draft.category, draft.status, draft.subtype, isEditorOpen, pendingLookup]);

  useEffect(() => {
    if (!shouldRunLookup || !isEditorOpen || !lookupQuery.trim()) return;

    setShouldRunLookup(false);
    searchDetails();
  }, [isEditorOpen, lookupQuery, searchDetails, shouldRunLookup]);

  return {
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
