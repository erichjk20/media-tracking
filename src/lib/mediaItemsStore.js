import { isSupabaseConfigured, supabase } from "./supabase";

const tableName = "library_items";

const detailTableNames = {
  anime: "anime_details",
  books: "book_details",
  manga: "manga_details",
  movies: "movie_details",
  tv: "tv_details",
};

const appStatusByDbStatus = {
  completed: "Completed",
  want: "Want to Watch/Read",
};

const dbStatusByAppStatus = {
  Completed: "completed",
  "Want to Watch/Read": "want",
};

export { isSupabaseConfigured };

export async function fetchMediaItems() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(tableName)
    .select("*, movie_details(*), book_details(*), manga_details(*), tv_details(*), anime_details(*)")
    .order("added_at", { ascending: true });

  if (error) throw error;
  return data.map(dbRowToMediaItem);
}

export async function saveMediaItem(item) {
  if (!supabase) return item;

  const itemId = isUuid(item.id) ? item.id : crypto.randomUUID();
  const itemToSave = { ...item, id: itemId };
  const { data, error } = await supabase
    .from(tableName)
    .upsert(mediaItemToDbRow(itemToSave))
    .select()
    .single();

  if (error) throw error;

  await saveMediaItemDetails(itemToSave);
  const details = await fetchMediaItemDetails(itemToSave.id, itemToSave.category);
  return dbRowToMediaItem({ ...data, ...details });
}

export async function removeMediaItem(id) {
  if (!supabase) return;

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

function dbRowToMediaItem(row) {
  const movieDetails = firstRelatedRow(row.movie_details);
  const bookDetails = firstRelatedRow(row.book_details);
  const mangaDetails = firstRelatedRow(row.manga_details);
  const tvDetails = firstRelatedRow(row.tv_details);
  const animeDetails = firstRelatedRow(row.anime_details);

  return {
    id: row.id,
    category: row.category,
    subtype: row.subtype || "",
    status: appStatusByDbStatus[row.status] || row.status,
    title: row.title || "",
    creator: row.creator || "",
    director: movieDetails.director || row.director || "",
    genre: movieDetails.genre || row.genre || "",
    durationMinutes: movieDetails.duration_minutes || row.duration_minutes || "",
    pageCount: bookDetails.page_count || "",
    publisher: bookDetails.publisher || "",
    isbn: bookDetails.isbn || "",
    language: bookDetails.language || "",
    author: mangaDetails.author || "",
    artist: mangaDetails.artist || "",
    volumeCount: mangaDetails.volume_count || "",
    chapterCount: mangaDetails.chapter_count || "",
    seasonCount: tvDetails.season_count || animeDetails.season_count || "",
    episodeCount: tvDetails.episode_count || animeDetails.episode_count || "",
    durationMinutesPerEpisode: tvDetails.duration_minutes_per_episode || animeDetails.duration_minutes_per_episode || "",
    studio: animeDetails.studio || "",
    rating: row.rating || 0,
    notes: row.notes || "",
    imageUrl: row.image_url || "",
    addedAt: row.added_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mediaItemToDbRow(item) {
  const isCompleted = item.status === "Completed";

  return {
    id: item.id,
    category: item.category,
    subtype: item.subtype || null,
    status: dbStatusByAppStatus[item.status] || item.status,
    title: item.title,
    creator: item.creator || null,
    rating: isCompleted ? Number(item.rating) : null,
    notes: item.notes || null,
    image_url: item.imageUrl || null,
    added_at: item.addedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function saveMediaItemDetails(item) {
  await removeStaleDetailRows(item.id, item.category);

  const table = detailTableNames[item.category];
  const row = mediaItemToDetailRow(item);
  if (!table || !row) return;

  const { error } = await supabase.from(table).upsert(row);
  if (error) throw error;
}

async function removeStaleDetailRows(itemId, category) {
  const staleTables = Object.entries(detailTableNames)
    .filter(([detailCategory]) => detailCategory !== category)
    .map(([, table]) => table);

  await Promise.all(
    staleTables.map(async (table) => {
      const { error } = await supabase.from(table).delete().eq("library_item_id", itemId);
      if (error) throw error;
    }),
  );
}

async function fetchMediaItemDetails(itemId, category) {
  const table = detailTableNames[category];
  if (!table) return {};

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("library_item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data ? { [table]: data } : {};
}

function mediaItemToDetailRow(item) {
  if (item.category === "movies") {
    return {
      library_item_id: item.id,
      director: item.director || getLabeledNoteValue(item.notes, "Director") || item.creator || null,
      genre: item.genre || getLabeledNoteValue(item.notes, "Genre") || null,
      duration_minutes: positiveNumberOrNull(item.durationMinutes) || parseDurationMinutes(getLabeledNoteValue(item.notes, "Duration")),
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "books") {
    return {
      library_item_id: item.id,
      page_count: positiveNumberOrNull(item.pageCount),
      publisher: item.publisher || null,
      isbn: item.isbn || null,
      language: item.language || null,
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "manga") {
    return {
      library_item_id: item.id,
      author: item.author || getLabeledNoteValue(item.notes, "Author") || item.creator || null,
      artist: item.artist || null,
      volume_count: nonNegativeNumberOrNull(item.volumeCount) || parseNonNegativeInteger(getLabeledNoteValue(item.notes, "Volumes")),
      chapter_count: nonNegativeNumberOrNull(item.chapterCount) || parseNonNegativeInteger(getLabeledNoteValue(item.notes, "Chapters")),
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "tv") {
    return {
      library_item_id: item.id,
      season_count: nonNegativeNumberOrNull(item.seasonCount),
      episode_count: nonNegativeNumberOrNull(item.episodeCount),
      duration_minutes_per_episode: positiveNumberOrNull(item.durationMinutesPerEpisode),
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "anime") {
    return {
      library_item_id: item.id,
      studio: item.studio || null,
      season_count: nonNegativeNumberOrNull(item.seasonCount),
      episode_count: nonNegativeNumberOrNull(item.episodeCount),
      duration_minutes_per_episode: positiveNumberOrNull(item.durationMinutesPerEpisode),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

function firstRelatedRow(value) {
  if (Array.isArray(value)) return value[0] || {};
  return value || {};
}

function positiveNumberOrNull(value) {
  const number = Number(value);
  return number > 0 ? number : null;
}

function nonNegativeNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return number >= 0 ? number : null;
}

function getLabeledNoteValue(notes, label) {
  const match = String(notes || "").match(new RegExp(`(?:^|\\n)${label}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() || "";
}

function parseDurationMinutes(value) {
  const match = String(value || "").match(/\d+/);
  return match ? positiveNumberOrNull(match[0]) : null;
}

function parseNonNegativeInteger(value) {
  const match = String(value || "").match(/\d+/);
  return match ? nonNegativeNumberOrNull(match[0]) : null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
