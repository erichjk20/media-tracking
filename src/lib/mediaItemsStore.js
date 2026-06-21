import { isSupabaseConfigured, supabase } from "./supabase";

const tableName = "library_items";

const detailTableNames = {
  books: "book_details",
  manga: "manga_details",
  movies: "movie_details",
  tv: "tv_details",
};

const detailTitleColumns = {
  book_details: "book_title",
  manga_details: "manga_title",
  movie_details: "movie_title",
  tv_details: "tv_show_title",
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
    .select("*, movie_details(*), book_details(*), manga_details(*), tv_details(*)")
    .order("added_at", { ascending: true });

  if (error) throw error;
  return data.map(dbRowToMediaItem);
}

export async function saveMediaItem(item) {
  if (!supabase) return item;

  const itemId = isUuid(item.id) ? item.id : crypto.randomUUID();
  const itemToSave = {
    ...item,
    id: itemId,
    category: item.category === "anime" ? "tv" : item.category,
    subtype: item.category === "anime" ? "anime" : item.subtype,
  };
  const row = mediaItemToDbRow(itemToSave);

  const { data, error } = await supabase
    .from(tableName)
    .upsert(row)
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
  const category = row.category === "anime" ? "tv" : row.category;
  const subtype = row.category === "anime" ? "anime" : row.subtype || "";

  return {
    id: row.id,
    category,
    subtype,
    status: appStatusByDbStatus[row.status] || row.status,
    title: row.title || movieDetails.movie_title || bookDetails.book_title || mangaDetails.manga_title || tvDetails.tv_show_title || "",
    creator: row.creator || "",
    director: movieDetails.director || row.director || "",
    genre: movieDetails.genre || row.genre || "",
    releaseYear: movieDetails.release_year || "",
    durationMinutes: movieDetails.duration_minutes || row.duration_minutes || "",
    pageCount: bookDetails.page_count || "",
    publisher: bookDetails.publisher || "",
    isbn: bookDetails.isbn || "",
    author: mangaDetails.author || "",
    artist: mangaDetails.artist || "",
    volumeCount: mangaDetails.volume_count || "",
    chapterCount: mangaDetails.chapter_count || "",
    seasonCount: tvDetails.season_count || "",
    episodeCount: tvDetails.episode_count || "",
    durationMinutesPerEpisode: tvDetails.duration_minutes_per_episode || "",
    studio: tvDetails.studio || "",
    rating: row.rating || 0,
    notes: row.notes || "",
    imageUrl: row.image_url || "",
    addedAt: row.added_at || "",
    updatedAt: row.updated_at || "",
  };
}

function mediaItemToDbRow(item) {
  const isCompleted = item.status === "Completed";
  const category = item.category === "anime" ? "tv" : item.category;
  const subtype = item.category === "anime" ? "anime" : item.subtype || null;

  return {
    id: item.id,
    category,
    subtype,
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
  if (!error) return;

  const detailTitleColumn = detailTitleColumns[table];
  if (detailTitleColumn && row[detailTitleColumn] !== undefined && isMissingColumnError(error, detailTitleColumn)) {
    const { [detailTitleColumn]: _detailTitle, ...rowWithoutDetailTitle } = row;
    const { error: retryError } = await supabase.from(table).upsert(rowWithoutDetailTitle);
    if (!retryError) return;
    if (table === "tv_details" && rowWithoutDetailTitle.studio !== undefined && isMissingColumnError(retryError, "studio")) {
      const { studio, ...rowWithoutDetailTitleOrStudio } = rowWithoutDetailTitle;
      const { error: secondRetryError } = await supabase.from(table).upsert(rowWithoutDetailTitleOrStudio);
      if (!secondRetryError) return;
      throw secondRetryError;
    }
    throw retryError;
  }

  if (table === "tv_details" && row.studio !== undefined && isMissingColumnError(error, "studio")) {
    const { studio, ...rowWithoutStudio } = row;
    const { error: retryError } = await supabase.from(table).upsert(rowWithoutStudio);
    if (!retryError) return;
    throw retryError;
  }

  throw error;
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
      movie_title: item.title || null,
      director: item.director || getLabeledNoteValue(item.notes, "Director") || item.creator || null,
      genre: item.genre || getLabeledNoteValue(item.notes, "Genre") || null,
      release_year: validYearOrNull(item.releaseYear) || validYearOrNull(getLabeledNoteValue(item.notes, "Year")),
      duration_minutes: positiveNumberOrNull(item.durationMinutes) || parseDurationMinutes(getLabeledNoteValue(item.notes, "Duration")),
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "books") {
    return {
      library_item_id: item.id,
      book_title: item.title || null,
      page_count: positiveNumberOrNull(item.pageCount) || parsePositiveInteger(getLabeledNoteValue(item.notes, "Total pages")),
      publisher: item.publisher || getLabeledNoteValue(item.notes, "Publisher") || null,
      isbn: item.isbn || getLabeledNoteValue(item.notes, "ISBN13") || getLabeledNoteValue(item.notes, "ISBN") || null,
      updated_at: new Date().toISOString(),
    };
  }

  if (item.category === "manga") {
    return {
      library_item_id: item.id,
      manga_title: item.title || null,
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
      tv_show_title: item.title || null,
      studio: item.studio || getLabeledNoteValue(item.notes, "Studio") || null,
      season_count: nonNegativeNumberOrNull(item.seasonCount) || parseNonNegativeInteger(getLabeledNoteValue(item.notes, "Seasons")),
      episode_count: nonNegativeNumberOrNull(item.episodeCount) || parseNonNegativeInteger(getLabeledNoteValue(item.notes, "Episodes")),
      duration_minutes_per_episode:
        positiveNumberOrNull(item.durationMinutesPerEpisode) || parseDurationMinutes(getLabeledNoteValue(item.notes, "Duration per episode")),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

function firstRelatedRow(value) {
  if (Array.isArray(value)) return value[0] || {};
  return value || {};
}

function isMissingColumnError(error, columnName) {
  return (
    error?.code === "PGRST204"
    || String(error?.message || "").includes(`'${columnName}' column`)
    || String(error?.message || "").includes(`column "${columnName}"`)
  );
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

function parsePositiveInteger(value) {
  const match = String(value || "").match(/\d+/);
  return match ? positiveNumberOrNull(match[0]) : null;
}

function parseNonNegativeInteger(value) {
  const match = String(value || "").match(/\d+/);
  return match ? nonNegativeNumberOrNull(match[0]) : null;
}

function validYearOrNull(value) {
  const match = String(value || "").match(/\d{4}/);
  if (!match) return null;
  const year = Number(match[0]);
  return year >= 1800 && year <= 2100 ? year : null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
