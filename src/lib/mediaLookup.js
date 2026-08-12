import {
  omdbTypesByCategory,
  openLibraryCanonicalBookLanguage,
  tmdbCanonicalMediaLanguage,
} from "./mediaConfig";
import {
  cleanOmdbValue,
  cleanTmdbValue,
  createLookupResult,
  getDefaultSubtype,
  getOpenLibraryCoverUrl,
  getTmdbImageUrl,
  normalizeOpenLibraryList,
  parseOmdbRuntime,
  parseReleaseYear,
} from "./mediaUtils";

const omdbApiKey = import.meta.env.VITE_OMDB_API_KEY;
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
const tmdbAccessToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN;

export function getLookupProviders(category, subtype = "") {
  if (category === "books") {
    return subtype === "korean-book" ? [{ id: "aladin", label: "Aladin" }] : [{ id: "open-library", label: "Open Library" }];
  }
  if (category === "movies") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "tv") return [{ id: "tmdb", label: "TMDb" }];
  if (category === "manga") return [{ id: "jikan", label: "Jikan" }];
  return [];
}

export function getFallbackLookupProviders(category, subtype = "", attemptedProviderIds = []) {
  if (category === "books" && subtype === "korean-book" && !attemptedProviderIds.includes("open-library")) {
    return [{ id: "open-library", label: "Open Library" }];
  }
  if (category === "movies" && !attemptedProviderIds.includes("omdb")) {
    return [{ id: "omdb", label: "OMDb" }];
  }
  if (category === "tv" && !attemptedProviderIds.includes("omdb")) {
    return [{ id: "omdb", label: "OMDb" }];
  }
  if (category === "manga" && !attemptedProviderIds.includes("mangadex")) {
    return [{ id: "mangadex", label: "MangaDex" }];
  }
  return [];
}

export function fetchProviderResults(searchText, provider, context = {}) {
  if (provider.id === "omdb") return fetchOmdbResults(searchText, context.category);
  if (provider.id === "tmdb") return fetchTmdbResults(searchText, context);
  if (provider.id === "open-library") return fetchOpenLibraryResults(searchText, context.language);
  if (provider.id === "aladin") return fetchAladinResults(searchText);
  if (provider.id === "jikan-anime") return fetchAnimeResults(searchText);
  if (provider.id === "mangadex") return fetchMangadexResults(searchText);
  return fetchMangaResults(searchText);
}

export async function getItemPatchFromLookupResult(item, lookupResult, options = {}) {
  if (lookupResult.source === "omdb") return getOmdbItemPatch(lookupResult.result, item.category, item.subtype);
  if (lookupResult.source === "tmdb") return getTmdbItemPatch(lookupResult.result, item, options);
  if (lookupResult.source === "open-library") return getOpenLibraryItemPatch(lookupResult.result, item);
  if (lookupResult.source === "aladin") return getAladinItemPatch(lookupResult.result);
  if (lookupResult.source === "jikan-anime") return getAnimeItemPatch(lookupResult.result);
  return getMangaItemPatch(lookupResult.result);
}

async function fetchOmdbResults(searchText, category) {
  const omdbType = omdbTypesByCategory[category];

  if (!omdbApiKey) {
    return { results: [], message: "Add VITE_OMDB_API_KEY to use OMDb." };
  }

  if (!omdbType) {
    return { results: [], message: "" };
  }

  try {
    const url = new URL("https://www.omdbapi.com/");
    url.searchParams.set("apikey", omdbApiKey);
    url.searchParams.set("s", searchText);
    url.searchParams.set("type", omdbType);

    const response = await fetch(url);
    const data = await response.json();

    if (data.Response === "False") {
      return { results: [], message: data.Error || "No OMDb results found." };
    }

    return {
      results: (data.Search || []).slice(0, 10).map((result) => createLookupResult("omdb", result)),
      message: "",
    };
  } catch {
    return { results: [], message: "OMDb lookup failed." };
  }
}

async function fetchTmdbResults(searchText, context = {}) {
  const { category, subtype } = context;
  const mediaType = category === "movies" ? "movie" : category === "tv" ? "tv" : "";

  if (!tmdbAccessToken && !tmdbApiKey) {
    return { results: [], message: "Add VITE_TMDB_ACCESS_TOKEN or VITE_TMDB_API_KEY to use TMDb." };
  }

  if (!mediaType) {
    return { results: [], message: "" };
  }

  const languages = getTmdbSearchLanguages(mediaType, subtype);
  const settledSearches = await Promise.allSettled(
    languages.map((language) => fetchTmdbSearchResults(searchText, mediaType, subtype, language)),
  );
  const failedSearches = settledSearches.filter((entry) => entry.status === "rejected");
  const rawResults = settledSearches.flatMap((entry) => (entry.status === "fulfilled" ? entry.value : []));

  const results = dedupeTmdbResults(rawResults)
    .filter((result) => result.poster_path || result.title || result.name || result.original_title || result.original_name)
    .slice(0, 14)
    .map((result) => normalizeTmdbResult(result, mediaType));

  if (!results.length) {
    const error = failedSearches[0]?.reason;
    return { results: [], message: error?.message || "No TMDb results found." };
  }

  return { results: results.map((result) => createLookupResult("tmdb", result)), message: "" };
}

async function fetchOpenLibraryResults(searchText, language = openLibraryCanonicalBookLanguage) {
  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", buildOpenLibraryQuery(searchText, language));
    url.searchParams.set(
      "fields",
      "key,title,author_name,first_publish_year,cover_i,language,publisher,subject,edition_count,number_of_pages_median",
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

    const results = (data.docs || [])
      .map(normalizeOpenLibraryBookResult)
      .filter((result) => result.title || result.authors)
      .slice(0, 14);

    if (!results.length) {
      return { results: [], message: "No Open Library results found." };
    }

    return { results: results.map((result) => createLookupResult("open-library", result)), message: "" };
  } catch (error) {
    return { results: [], message: error.message || "Open Library lookup failed." };
  }
}

async function fetchAladinResults(searchText) {
  try {
    const url = new URL("/api/aladin/books", window.location.origin);
    url.searchParams.set("query", searchText);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.errorCode) {
      throw new Error(data.errorMessage || data.message || "Aladin lookup failed.");
    }

    const results = (data.item || [])
      .map(normalizeAladinBookResult)
      .filter((result) => result.title || result.authors)
      .slice(0, 14);

    if (!results.length) {
      return { results: [], message: "No Aladin Korean book results found." };
    }

    return { results: results.map((result) => createLookupResult("aladin", result)), message: "" };
  } catch (error) {
    return { results: [], message: error.message || "Aladin lookup failed." };
  }
}

async function fetchMangaResults(searchText) {
  try {
    const url = new URL("https://api.jikan.moe/v4/manga");
    url.searchParams.set("q", searchText);
    url.searchParams.set("limit", "14");
    url.searchParams.set("sfw", "true");

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Jikan lookup failed.");
    }

    const results = (data.data || [])
      .map(normalizeJikanMangaResult)
      .filter((result) => result.title || result.authors)
      .slice(0, 14);

    if (!results.length) {
      return { results: [], message: "No Jikan manga results found." };
    }

    return { results: results.map((result) => createLookupResult("jikan", result)), message: "" };
  } catch (error) {
    return { results: [], message: error.message || "Jikan lookup failed." };
  }
}

async function fetchMangadexResults(searchText) {
  try {
    const url = new URL("/api/mangadex/manga", window.location.origin);
    url.searchParams.set("title", searchText);
    url.searchParams.set("limit", "14");
    url.searchParams.append("includes[]", "cover_art");
    url.searchParams.append("includes[]", "author");
    url.searchParams.append("includes[]", "artist");
    url.searchParams.append("contentRating[]", "safe");
    url.searchParams.append("contentRating[]", "suggestive");
    url.searchParams.set("order[followedCount]", "desc");

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || data.message || "MangaDex lookup failed.");
    }

    const results = (data.data || [])
      .map(normalizeMangadexMangaResult)
      .filter((result) => result.title || result.authors)
      .slice(0, 14);

    if (!results.length) {
      return { results: [], message: "No MangaDex manga results found." };
    }

    return { results: results.map((result) => createLookupResult("mangadex", result)), message: "" };
  } catch (error) {
    return { results: [], message: error.message || "MangaDex lookup failed." };
  }
}

async function fetchAnimeResults(searchText) {
  try {
    const url = new URL("https://api.jikan.moe/v4/anime");
    url.searchParams.set("q", searchText);
    url.searchParams.set("limit", "14");
    url.searchParams.set("sfw", "true");

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Jikan anime lookup failed.");
    }

    const results = (data.data || [])
      .map(normalizeJikanAnimeResult)
      .filter((result) => result.title || result.creators || result.studios)
      .slice(0, 14);

    if (!results.length) {
      return { results: [], message: "No Jikan anime results found." };
    }

    return { results: results.map((result) => createLookupResult("jikan-anime", result)), message: "" };
  } catch (error) {
    return { results: [], message: error.message || "Jikan anime lookup failed." };
  }
}

export async function getOmdbItemPatch(result, category, subtype = "") {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", omdbApiKey);
  url.searchParams.set("i", result.imdbID);
  url.searchParams.set("plot", "short");

  const response = await fetch(url);
  const detail = await response.json();

  if (detail.Response === "False") {
    throw new Error(detail.Error || "Could not load OMDb details.");
  }

  const director = cleanOmdbValue(detail.Director);
  const writer = cleanOmdbValue(detail.Writer);
  const creator = category === "movies" ? director : subtype === "anime" ? writer || director : director || writer;
  const durationMinutes = parseOmdbRuntime(detail.Runtime);
  const genre = cleanOmdbValue(detail.Genre);
  const releaseYear = parseReleaseYear(detail.Year);
  const episodeCount = category === "tv" ? await fetchOmdbEpisodeCount(result.imdbID, detail.totalSeasons) : "";
  const title = cleanOmdbValue(detail.Title) || result.Title || "";

  return {
    title,
    creator: cleanOmdbValue(creator),
    director: category === "movies" ? director : "",
    genre: category === "movies" ? genre : "",
    releaseYear: category === "movies" ? releaseYear : "",
    durationMinutes: category === "movies" ? durationMinutes : "",
    seasonCount: category === "tv" ? Number(cleanOmdbValue(detail.totalSeasons)) || "" : "",
    episodeCount: category === "tv" ? episodeCount : "",
    durationMinutesPerEpisode: category === "tv" ? durationMinutes : "",
    imageUrl: cleanOmdbValue(detail.Poster) || cleanOmdbValue(result.Poster),
    synopsis: cleanOmdbValue(detail.Plot),
  };
}

export async function getTmdbItemPatch(result, currentItem) {
  const url = new URL(`https://api.themoviedb.org/3/${result.mediaType}/${result.id}`);
  applyTmdbAuth(url);
  url.searchParams.set("language", tmdbCanonicalMediaLanguage);
  url.searchParams.set("append_to_response", "credits");

  const response = await fetch(url, getTmdbRequestOptions());
  const detail = await response.json();

  if (!response.ok) {
    throw new Error(detail.status_message || "Could not load TMDb details.");
  }

  const title =
    result.mediaType === "movie" || result.mediaType === "tv"
      ? cleanTmdbValue(detail.title || detail.name) || cleanTmdbValue(result.title)
      : cleanTmdbValue(result.title) || cleanTmdbValue(detail.title || detail.name);
  const creator = result.mediaType === "movie" ? getTmdbDirector(detail) : getTmdbTvDirector(detail) || getTmdbTvCreator(detail);
  const genres = detail.genres?.map((genre) => genre.name).join(", ") || "";
  const releaseYear = parseReleaseYear(
    result.mediaType === "movie"
      ? detail.release_date || result.releaseDate
      : detail.first_air_date || result.releaseDate,
  );
  const durationMinutes = result.mediaType === "movie" ? detail.runtime || "" : "";
  const releasedTvSeasons = result.mediaType === "tv" ? getReleasedTmdbSeasons(detail.seasons) : [];
  const seasonBreakdown = result.mediaType === "tv" ? getTmdbSeasonBreakdown(detail.seasons) : [];

  return {
    category: result.mediaType === "movie" ? "movies" : "tv",
    subtype: result.mediaType === "movie" ? "movie" : getDefaultSubtype("tv", currentItem.subtype),
    title,
    creator,
    director: result.mediaType === "movie" ? creator : "",
    genre: genres,
    releaseYear,
    durationMinutes: result.mediaType === "movie" ? durationMinutes : "",
    seasonCount: result.mediaType === "tv" ? releasedTvSeasons.length || "" : "",
    episodeCount: result.mediaType === "tv" ? getTmdbReleasedEpisodeCount(releasedTvSeasons, detail.number_of_episodes) : "",
    seasonBreakdown,
    durationMinutesPerEpisode: result.mediaType === "tv" ? getFirstRuntime(detail.episode_run_time) : "",
    imageUrl: getTmdbImageUrl(detail.poster_path || result.posterPath),
    synopsis: cleanTmdbValue(detail.overview || result.overview),
  };
}

function getReleasedTmdbSeasons(seasons = []) {
  const today = getLocalDateString(new Date());

  return seasons
    .filter((season) => {
      if (Number(season.season_number) === 0) return false;
      if (!season.air_date) return false;
      return season.air_date <= today;
    })
    .sort((a, b) => Number(a.season_number || 0) - Number(b.season_number || 0));
}

function getTmdbSeasonBreakdown(seasons = []) {
  return getReleasedTmdbSeasons(seasons)
    .map((season) => ({
      seasonNumber: Number(season.season_number) || "",
      name: cleanTmdbValue(season.name) || `Season ${season.season_number}`,
      episodeCount: Number(season.episode_count) || "",
      airDate: cleanTmdbValue(season.air_date),
      status: "released",
    }));
}

function getTmdbReleasedEpisodeCount(releasedSeasons, fallbackEpisodeCount) {
  const releasedEpisodeCount = releasedSeasons.reduce((total, season) => total + (Number(season.episode_count) || 0), 0);
  return releasedEpisodeCount || fallbackEpisodeCount || "";
}

function getLocalDateString(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function getOpenLibraryItemPatch(result, currentItem) {
  const isKoreanBook = result.languages.includes("kor");
  return {
    subtype: isKoreanBook ? "korean-book" : getDefaultSubtype("books", currentItem.subtype),
    title: result.title,
    creator: result.authors,
    imageUrl: result.imageUrl,
    pageCount: result.pageCount,
    publisher: result.publishers,
    synopsis: result.description || "",
  };
}

export function getAladinItemPatch(result) {
  return {
    subtype: "korean-book",
    title: result.title,
    creator: result.authors,
    imageUrl: result.imageUrl,
    pageCount: result.pageCount,
    publisher: result.publisher,
    isbn: result.isbn13,
    synopsis: result.description,
  };
}

export function getAnimeItemPatch(result) {
  return {
    category: "tv",
    subtype: "anime",
    title: result.title,
    creator: result.creators,
    imageUrl: result.imageUrl,
    genre: result.genres,
    releaseYear: parseReleaseYear(result.year || result.aired),
    seasonCount: result.seasonCount,
    episodeCount: result.episodes,
    durationMinutesPerEpisode: parseOmdbRuntime(result.duration),
    studio: result.studios,
    synopsis: result.synopsis,
  };
}

export function getMangaItemPatch(result) {
  return {
    title: result.title,
    creator: result.authors,
    imageUrl: result.imageUrl,
    author: result.authors,
    artist: result.artists || "",
    volumeCount: result.volumes,
    chapterCount: result.chapters,
    synopsis: result.synopsis,
  };
}

function applyTmdbAuth(url) {
  if (!tmdbAccessToken && tmdbApiKey) {
    url.searchParams.set("api_key", tmdbApiKey);
  }
}

function getTmdbRequestOptions() {
  if (!tmdbAccessToken) return {};
  return {
    headers: {
      Authorization: `Bearer ${tmdbAccessToken}`,
    },
  };
}

function getTmdbSearchLanguages(mediaType, subtype) {
  const languages = [tmdbCanonicalMediaLanguage, "ko-KR"];

  if (mediaType === "tv" && subtype === "anime") {
    languages.push("ja-JP");
  }

  return [...new Set(languages)];
}

async function fetchTmdbSearchResults(searchText, mediaType, subtype, language) {
  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
  applyTmdbAuth(url);
  url.searchParams.set("query", searchText);
  url.searchParams.set("language", language);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");
  const response = await fetch(url, getTmdbRequestOptions());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.status_message || "TMDb lookup failed.");
  }

  return data.results || [];
}

function dedupeTmdbResults(results) {
  const seenIds = new Set();

  return results.filter((result) => {
    if (!result.id || seenIds.has(result.id)) return false;
    seenIds.add(result.id);
    return true;
  });
}

function normalizeTmdbResult(result, mediaType) {
  return {
    id: result.id,
    mediaType,
    title: mediaType === "movie" ? result.title : result.name,
    originalTitle: mediaType === "movie" ? result.original_title : result.original_name,
    posterPath: result.poster_path,
    releaseDate: mediaType === "movie" ? result.release_date : result.first_air_date,
    overview: result.overview,
    popularity: result.popularity,
    voteAverage: result.vote_average,
  };
}

function getTmdbDirector(detail) {
  const director = detail.credits?.crew?.find((person) => person.job === "Director");
  return director?.name || "";
}

function getTmdbTvCreator(detail) {
  const creators = detail.created_by?.map((person) => person.name).filter(Boolean) || [];
  if (creators.length) return creators.join(", ");
  return detail.networks?.map((network) => network.name).filter(Boolean).join(", ") || "";
}

function getTmdbTvDirector(detail) {
  const directors = detail.credits?.crew
    ?.filter((person) => person.job === "Director")
    .map((person) => person.name)
    .filter(Boolean) || [];
  return [...new Set(directors)].slice(0, 3).join(", ");
}

function getFirstRuntime(values) {
  return normalizeOpenLibraryList(values).find(Boolean) || "";
}

function buildOpenLibraryQuery(query, language) {
  const languageFilter = language === "ko" ? "language:kor" : language === "en" ? "language:eng" : "";
  return [query, languageFilter].filter(Boolean).join(" ");
}

function normalizeOpenLibraryBookResult(doc) {
  return {
    id: doc.key,
    title: doc.title || "",
    authors: normalizeOpenLibraryList(doc.author_name).join(", "),
    firstPublishYear: doc.first_publish_year || "",
    editionCount: doc.edition_count || "",
    pageCount: doc.number_of_pages_median || "",
    languages: normalizeOpenLibraryList(doc.language),
    publishers: normalizeOpenLibraryList(doc.publisher).slice(0, 3).join(", "),
    subjects: normalizeOpenLibraryList(doc.subject).slice(0, 5).join(", "),
    imageUrl: getOpenLibraryCoverUrl(doc.cover_i),
  };
}

function normalizeJikanMangaResult(result) {
  return {
    id: result.mal_id,
    title: result.title_english || result.title || result.title_japanese || "",
    originalTitle: result.title_japanese || "",
    authors: normalizeJikanPeople(result.authors).join(", "),
    artists: "",
    genres: normalizeJikanNamedList(result.genres).join(", "),
    themes: normalizeJikanNamedList(result.themes).join(", "),
    demographics: normalizeJikanNamedList(result.demographics).join(", "),
    published: result.published?.string || "",
    status: result.status || "",
    chapters: result.chapters || "",
    volumes: result.volumes || "",
    score: result.score || "",
    synopsis: result.synopsis || "",
    imageUrl: result.images?.jpg?.large_image_url || result.images?.jpg?.image_url || "",
  };
}

function normalizeMangadexMangaResult(result) {
  const attributes = result.attributes || {};
  const relationships = normalizeOpenLibraryList(result.relationships);
  const authors = getMangadexRelationshipNames(relationships, "author");
  const artists = getMangadexRelationshipNames(relationships, "artist");
  const coverFileName = relationships.find((relationship) => relationship.type === "cover_art")?.attributes?.fileName;

  return {
    id: result.id,
    title: getMangadexTitle(attributes),
    originalTitle: getLocalizedText(attributes.title, ["ja-ro", "ja", "ko", "zh", "zh-hk"]) || "",
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
  };
}

function normalizeJikanAnimeResult(result) {
  return {
    id: result.mal_id,
    title: result.title_english || result.title || result.title_japanese || "",
    originalTitle: result.title_japanese || "",
    creators: normalizeJikanNamedList(result.producers).join(", "),
    studios: normalizeJikanNamedList(result.studios).join(", "),
    genres: normalizeJikanNamedList(result.genres).join(", "),
    themes: normalizeJikanNamedList(result.themes).join(", "),
    demographics: normalizeJikanNamedList(result.demographics).join(", "),
    aired: result.aired?.string || "",
    year: result.year || "",
    season: [result.season, result.year].filter(Boolean).join(" "),
    status: result.status || "",
    episodes: result.episodes || "",
    duration: result.duration || "",
    seasonCount: result.type === "TV" ? 1 : "",
    score: result.score || "",
    synopsis: result.synopsis || "",
    imageUrl: result.images?.jpg?.large_image_url || result.images?.jpg?.image_url || "",
  };
}

function normalizeJikanPeople(value) {
  return normalizeOpenLibraryList(value).map((person) => person.name).filter(Boolean);
}

function normalizeJikanNamedList(value) {
  return normalizeOpenLibraryList(value).map((entry) => entry.name).filter(Boolean);
}

function getMangadexTitle(attributes) {
  const altTitles = normalizeOpenLibraryList(attributes.altTitles).flatMap((entry) => Object.values(entry || {}));
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
  return normalizeOpenLibraryList(tags)
    .filter((tag) => tag.attributes?.group === group)
    .map((tag) => getLocalizedText(tag.attributes?.name, ["en"]))
    .filter(Boolean);
}

function normalizeAladinBookResult(item) {
  return {
    id: item.itemId || item.isbn13 || item.isbn || item.link,
    title: item.title || "",
    authors: item.author || "",
    publisher: item.publisher || "",
    publishedDate: item.pubDate || "",
    category: item.categoryName || "",
    pageCount: item.itemPage || item.subInfo?.itemPage || "",
    isbn13: item.isbn13 || "",
    description: item.description || "",
    imageUrl: item.cover || "",
    link: item.link || "",
  };
}

async function fetchOmdbEpisodeCount(imdbId, totalSeasons) {
  const seasonCount = Number(cleanOmdbValue(totalSeasons));
  if (!omdbApiKey || !imdbId || !seasonCount) return "";

  try {
    const seasonRequests = Array.from({ length: seasonCount }, (_, index) => {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", omdbApiKey);
      url.searchParams.set("i", imdbId);
      url.searchParams.set("Season", String(index + 1));
      return fetch(url).then((response) => response.json());
    });
    const seasons = await Promise.all(seasonRequests);
    const episodeTotal = seasons.reduce((total, season) => {
      if (season.Response === "False" || !Array.isArray(season.Episodes)) return total;
      return total + season.Episodes.length;
    }, 0);
    return episodeTotal || "";
  } catch {
    return "";
  }
}
