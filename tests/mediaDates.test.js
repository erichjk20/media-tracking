import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";
import {
  formatMediaDate,
  getFinishedDateError,
  getLocalDate,
  isValidDateOnly,
  isValidMonthOnly,
  getFinishedDatePrecision,
  getMediaActivityDate,
} from "../src/lib/mediaDates.js";

let server;
let media;
let store;
let savedRow;
let saveError;
let probeError;
let saveAttempts = [];
const now = "2026-10-20T18:00:00.000Z";
const addedAt = "2026-09-01T18:00:00.000Z";

before(async () => {
  // Exercise the real store save/load path without touching a user's database.
  globalThis.__mediaDateTestSupabase = {
    from(table) {
      return {
        upsert(row) {
          if (table === "library_items") {
            savedRow = structuredClone(row);
            saveAttempts.push(structuredClone(row));
          }
          return this;
        },
        select() { return this; },
        delete() { return this; },
        eq() { return this; },
        order() { return Promise.resolve({ data: [savedRow], error: null }); },
        single() { return Promise.resolve({ data: savedRow, error: typeof saveError === "function" ? saveError(savedRow) : saveError }); },
        limit() { return Promise.resolve({ data: [], error: probeError }); },
        maybeSingle() { return Promise.resolve({ data: null, error: null }); },
        then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
      };
    },
  };
  server = await createServer({
    configFile: false,
    envFile: false,
    server: { middlewareMode: true, watch: null, ws: false },
    plugins: [{
      name: "mock-library-database",
      enforce: "pre",
      load(id) {
        if (id.endsWith("/src/lib/supabase.js")) {
          return "export const supabase = globalThis.__mediaDateTestSupabase; export const isSupabaseConfigured = true;";
        }
      },
    }],
  });
  media = await server.ssrLoadModule("/src/lib/mediaUtils.js");
  store = await server.ssrLoadModule("/src/lib/mediaItemsStore.js");
});

after(async () => {
  await server?.close();
  delete globalThis.__mediaDateTestSupabase;
});

test("new Done entries default to an unknown date, Want entries have no finished date", () => {
  assert.equal(media.createMediaDraft({ status: "Completed" }).finishedOn, "");
  assert.equal(media.createMediaDraft({ status: "Want to Watch/Read" }).finishedOn, "");
});

test("backdated completion survives edits without changing library or shelf timestamps", () => {
  const draft = { ...media.createMediaDraft(), title: "Arrival", finishedOn: "2025-06-15" };
  const original = media.prepareMediaItemForSave({ draft, now: addedAt });
  const edited = media.prepareMediaItemForSave({
    draft: { ...original, rating: 5, notes: "Loved it", addedAt: now },
    editingId: original.id,
    originalItem: original,
    now,
  });
  assert.equal(edited.addedAt, addedAt);
  assert.equal(edited.statusChangedAt, addedAt);
  assert.equal(edited.finishedOn, "2025-06-15");
});

test("Want to Done records shelf movement while preserving the original added date", () => {
  const original = {
    ...media.createMediaDraft({ status: "Want to Watch/Read" }),
    id: crypto.randomUUID(), title: "Arrival", addedAt, statusChangedAt: addedAt,
  };
  const done = media.prepareMediaItemForSave({
    draft: { ...original, status: "Completed", finishedOn: "2026-10-18" },
    editingId: original.id, originalItem: original, now,
  });
  assert.equal(done.addedAt, addedAt);
  assert.equal(done.statusChangedAt, now);
  assert.equal(done.finishedOn, "2026-10-18");
  const want = media.prepareMediaItemForSave({
    draft: { ...done, status: "Want to Watch/Read" },
    editingId: done.id, originalItem: done, now,
  });
  assert.equal(want.finishedOn, "");
  assert.equal(want.rating, 0);
  assert.equal(want.addedAt, addedAt);
});

test("legacy completion dates stay unknown through loading and ordinary edits", () => {
  const [legacy] = media.normalizeItems([{
    ...media.createMediaDraft(),
    id: crypto.randomUUID(), title: "Old entry", status: "Completed", category: "books",
    addedAt, statusChangedAt: addedAt, finishedOn: undefined,
  }]);
  assert.equal(legacy.finishedOn, "");
  const edited = media.prepareMediaItemForSave({
    draft: { ...legacy, notes: "Updated" }, editingId: legacy.id, originalItem: legacy, now,
  });
  assert.equal(edited.finishedOn, "");
  const [undated] = media.normalizeItems([{ ...legacy, addedAt: "", statusChangedAt: "" }]);
  assert.equal(media.prepareMediaItemForSave({
    draft: undated, editingId: undated.id, originalItem: undated, now,
  }).addedAt, "");
});

test("blank dates are allowed, invalid and future completion dates are rejected", () => {
  assert.equal(getFinishedDateError("", "2026-10-20"), "");
  assert.equal(getFinishedDateError("2025-01-01", "2026-10-20"), "");
  assert.ok(getFinishedDateError("2026-10-21", "2026-10-20"));
  for (const value of ["2026-02-29", "2026-13-01", "0000-01-01", "bad date"]) {
    assert.equal(isValidDateOnly(value), false);
    assert.ok(getFinishedDateError(value, "2026-10-20"));
  }
  assert.equal(isValidDateOnly("2024-02-29"), true);
  assert.throws(() => media.prepareMediaItemForSave({
    draft: { ...media.createMediaDraft(), finishedOn: "2026-10-21" }, now,
  }), /future/);
});

test("month-only dates keep their precision, accept this month, and reject future or invalid months", () => {
  assert.equal(isValidMonthOnly("2024-10"), true);
  assert.equal(getFinishedDatePrecision("2024-10"), "month");
  assert.equal(getFinishedDatePrecision("2024-10-18"), "day");
  assert.equal(getFinishedDatePrecision(""), "unknown");
  assert.equal(getFinishedDateError("2026-10", "2026-10-20"), "");
  assert.equal(getFinishedDateError("2024-10", "2026-10-20"), "");
  assert.match(getFinishedDateError("2026-11", "2026-10-20"), /future/);
  for (const value of ["2026-00", "2026-13", "0000-10", "2026-1"]) {
    assert.equal(isValidMonthOnly(value), false);
    assert.ok(getFinishedDateError(value, "2026-10-20"));
  }
  const [original] = media.normalizeItems([{
    ...media.createMediaDraft({ category: "movies" }),
    id: crypto.randomUUID(), title: "Arrival", finishedOn: "2024-10", addedAt, statusChangedAt: addedAt,
  }]);
  const edited = media.prepareMediaItemForSave({
    draft: { ...original, notes: "Updated" }, editingId: original.id, originalItem: original, now,
  });
  assert.equal(edited.finishedOn, "2024-10");
  assert.equal(edited.addedAt, addedAt);
  assert.equal(edited.statusChangedAt, addedAt);
  const display = getMediaActivityDate(edited);
  assert.equal(display.dateTime, "2024-10");
  assert.equal(display.value, "October 2024");
});

test("local defaults and date-only display work across UTC boundaries and DST", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const [timezone, expectedDay] of [
      ["America/Los_Angeles", "2026-10-19"],
      ["Pacific/Kiritimati", "2026-10-20"],
      ["Pacific/Pago_Pago", "2026-10-19"],
    ]) {
      process.env.TZ = timezone;
      assert.equal(getLocalDate("2026-10-20T01:00:00Z"), expectedDay);
      assert.equal(formatMediaDate("2026-10-20", { dateOnly: true }), "Oct 20, 2026");
      assert.equal(formatMediaDate("2026-03-08", { dateOnly: true }), "Mar 8, 2026");
      assert.equal(formatMediaDate("2024-10", { dateOnly: true }), "October 2024");
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test("Supabase saves, loads, clears, and preserves finished dates separately from addedAt", async () => {
  const original = {
    ...media.createMediaDraft({ category: "movies" }),
    id: crypto.randomUUID(), title: "Arrival", addedAt, statusChangedAt: now, finishedOn: "2025-06-15",
  };
  const saved = await store.saveMediaItem(original, "test-user");
  assert.equal(savedRow.finished_on, "2025-06-15");
  assert.equal(savedRow.finished_month, null);
  assert.equal(savedRow.added_at, addedAt);
  assert.equal(saved.finishedOn, "2025-06-15");
  const [reloaded] = await store.fetchMediaItems("test-user");
  assert.equal(reloaded.finishedOn, original.finishedOn);
  assert.equal(reloaded.addedAt, addedAt);
  const want = await store.saveMediaItem({ ...original, status: "Want to Watch/Read" }, "test-user");
  assert.equal(savedRow.finished_on, null);
  assert.equal(want.finishedOn, "");
  assert.equal(want.addedAt, addedAt);
  const unknown = await store.saveMediaItem({ ...original, finishedOn: "" }, "test-user");
  assert.equal(unknown.finishedOn, "");
  assert.equal(savedRow.finished_on, null);
  assert.equal(savedRow.finished_month, null);
});

test("Supabase round trips months without a fabricated day and clears stale precision when changed", async () => {
  const original = {
    ...media.createMediaDraft({ category: "books" }),
    id: crypto.randomUUID(), title: "Piranesi", addedAt, statusChangedAt: now, finishedOn: "2024-10",
  };
  const saved = await store.saveMediaItem(original, "test-user");
  assert.equal(savedRow.finished_on, null);
  assert.equal(savedRow.finished_month, "2024-10");
  assert.equal(saved.finishedOn, "2024-10");
  const [reloaded] = await store.fetchMediaItems("test-user");
  assert.equal(reloaded.finishedOn, "2024-10");
  const exact = await store.saveMediaItem({ ...reloaded, finishedOn: "2024-10-18" }, "test-user");
  assert.equal(exact.finishedOn, "2024-10-18");
  assert.equal(savedRow.finished_on, "2024-10-18");
  assert.equal(savedRow.finished_month, null);
  await store.saveMediaItem({ ...exact, finishedOn: "2024-10" }, "test-user");
  assert.equal(savedRow.finished_on, null);
  assert.equal(savedRow.finished_month, "2024-10");
  await store.saveMediaItem({ ...original, status: "Want to Watch/Read" }, "test-user");
  assert.equal(savedRow.finished_on, null);
  assert.equal(savedRow.finished_month, null);
  const unknown = await store.saveMediaItem({ ...original, finishedOn: "" }, "test-user");
  assert.equal(unknown.finishedOn, "");
  assert.equal(savedRow.finished_on, null);
  assert.equal(savedRow.finished_month, null);
});

test("a missing database migration fails explicitly instead of silently losing the date", async () => {
  try {
    for (const column of ["finished_on", "finished_month"]) {
      saveError = { code: "PGRST204", message: `Could not find the '${column}' column` };
      await assert.rejects(store.saveMediaItem({
        ...media.createMediaDraft(), title: "Arrival", finishedOn: "2024-10",
      }, "test-user"), column === "finished_month" ? /Month-only dates aren’t available/ : /database needs an update/);
    }
  } finally {
    saveError = null;
  }
});

test("ordinary edits and exact dates save on a database without the month column", async () => {
  const original = {
    ...media.createMediaDraft({ category: "movies" }),
    id: crypto.randomUUID(), title: "Arrival", addedAt, statusChangedAt: now,
  };
  saveError = (row) => Object.hasOwn(row, "finished_month")
    ? { code: "PGRST204", message: "Could not find the 'finished_month' column" }
    : null;
  probeError = { code: "42703", message: "column library_items.finished_month does not exist" };
  try {
    for (const finishedOn of ["2024-10-18", ""]) {
      saveAttempts = [];
      const saved = await store.saveMediaItem({ ...original, finishedOn, notes: "Edited notes" }, "test-user");
      assert.equal(saved.finishedOn, finishedOn);
      assert.equal(saved.notes, "Edited notes");
      assert.equal(saved.addedAt, addedAt);
      assert.equal(saveAttempts.length, 2);
      assert.equal(Object.hasOwn(saveAttempts[1], "finished_month"), false);
      assert.equal(saveAttempts[1].finished_on, finishedOn || null);
    }
    saveAttempts = [];
    await assert.rejects(store.saveMediaItem({ ...original, finishedOn: "2024-10" }, "test-user"), /Month-only dates aren’t available/);
    assert.equal(saveAttempts.length, 1);
  } finally {
    saveError = null;
    probeError = null;
  }
});

test("a stale API schema cannot silently keep a month the user intended to clear", async () => {
  saveError = { code: "PGRST204", message: "Could not find the 'finished_month' column" };
  probeError = null; // The column exists; the API schema is merely stale.
  saveAttempts = [];
  try {
    await assert.rejects(store.saveMediaItem({
      ...media.createMediaDraft(), title: "Arrival", finishedOn: "",
    }, "test-user"), /database needs an update/);
    assert.equal(saveAttempts.length, 1);
  } finally {
    saveError = null;
  }
});
