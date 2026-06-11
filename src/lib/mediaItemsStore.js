import { isSupabaseConfigured, supabase } from "./supabase";

const tableName = "library_items";

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
    .select("*")
    .order("added_at", { ascending: true });

  if (error) throw error;
  return data.map(dbRowToMediaItem);
}

export async function saveMediaItem(item) {
  if (!supabase) return item;

  const { data, error } = await supabase
    .from(tableName)
    .upsert(mediaItemToDbRow(item))
    .select()
    .single();

  if (error) throw error;
  return dbRowToMediaItem(data);
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
  return {
    id: row.id,
    category: row.category,
    subtype: row.subtype || "",
    status: appStatusByDbStatus[row.status] || row.status,
    title: row.title || "",
    creator: row.creator || "",
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
    id: isUuid(item.id) ? item.id : crypto.randomUUID(),
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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
