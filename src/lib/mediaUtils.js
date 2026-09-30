import {
  bookSubtypeOptions,
  defaultItems,
  emptyDraft,
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

export function getOpenLibraryCoverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "";
}

export function getSubtypeLabel(item) {
  if (item.category === "books" && item.subtype === "korean-book") return "Korean book";
  if (item.category === "tv" && getDefaultSubtype("tv", item.subtype) === "anime") return "Anime";
  return "";
}
