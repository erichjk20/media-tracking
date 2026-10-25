import assert from "node:assert/strict";
import { test } from "node:test";
import { getHistoryData, getHistoryYears } from "../src/lib/mediaHistory.js";

const fixtures = [
  { id: "book", title: "Piranesi", category: "books", status: "Completed", finishedOn: "2026-10-01", addedAt: "2025-01-01T00:00:00Z" },
  { id: "movie", title: "Arrival", category: "movies", status: "Completed", finishedOn: "2026-10-25", addedAt: "2026-02-01T00:00:00Z" },
  { id: "month", title: "A month remembered", category: "manga", status: "Completed", finishedOn: "2026-10" },
  { id: "tv", title: "Severance", category: "tv", status: "Completed", finishedOn: "2026-09-30" },
  { id: "old", title: "Older book", category: "books", status: "Completed", finishedOn: "2024-12" },
  { id: "unknown", title: "Undated book", category: "books", status: "Completed", addedAt: "2026-10-25T00:00:00Z", statusChangedAt: "2026-10-25T00:00:00Z" },
  { id: "invalid", title: "Invalid date", category: "movies", status: "Completed", finishedOn: "2026-02-30" },
  { id: "want", title: "Want book", category: "books", status: "Want to Watch/Read", finishedOn: "2023-01-01" },
];

test("History years include current and completed years without deriving years from logging dates", () => {
  assert.deepEqual(getHistoryYears(fixtures, "2026"), ["2026", "2024"]);
  assert.deepEqual(getHistoryYears([], "2026"), ["2026"]);
  assert.deepEqual(getHistoryYears([fixtures[5], fixtures[6], fixtures[7]], "2027"), ["2027"]);
});

test("annual History groups all media by finished month, newest first, retaining month precision", () => {
  const original = structuredClone(fixtures);
  const history = getHistoryData(fixtures, { year: "2026" });
  assert.equal(history.total, 4);
  assert.deepEqual(history.categoryCounts, { books: 1, movies: 1, manga: 1, tv: 1 });
  assert.deepEqual(history.groups.map((group) => group.month), ["2026-10", "2026-09"]);
  assert.deepEqual(history.groups[0].items.map((item) => item.id), ["movie", "book", "month"]);
  assert.equal(history.groups[0].items[2].finishedOn, "2026-10");
  assert.deepEqual(fixtures, original);
});

test("month and category filters intersect while category counts describe the selected period", () => {
  const history = getHistoryData(fixtures, { year: "2026", month: "10", category: "movies" });
  assert.equal(history.total, 1);
  assert.equal(history.periodTotal, 3);
  assert.deepEqual(history.categoryCounts, { books: 1, movies: 1, manga: 1 });
  assert.deepEqual(history.groups.flatMap((group) => group.items.map((item) => item.id)), ["movie"]);
  assert.deepEqual(history.unknownItems.map((item) => item.id), ["invalid"]);
  assert.equal(getHistoryData(fixtures, { year: "2024", month: "12" }).total, 1);
  assert.equal(getHistoryData(fixtures, { year: "2026", month: "10", category: "manga" }).total, 1);
});

test("unknown and invalid dates stay separate across every year and never use added or status dates", () => {
  for (const year of ["2024", "2026", "2027"]) {
    const history = getHistoryData(fixtures, { year });
    assert.deepEqual(history.unknownItems.map((item) => item.id), ["invalid", "unknown"]);
    assert.equal(history.groups.flatMap((group) => group.items).some((item) => ["unknown", "invalid", "want"].includes(item.id)), false);
  }
  const empty = getHistoryData(fixtures, { year: "2027" });
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.groups, []);
  assert.deepEqual(getHistoryData([], { year: "2026" }).unknownItems, []);
});

test("backdating, setting a missing date, and moving back to Want immediately change History", () => {
  const changed = fixtures.map((item) => {
    if (item.id === "movie") return { ...item, finishedOn: "2024-12-31" };
    if (item.id === "unknown") return { ...item, finishedOn: "2026-10" };
    if (item.id === "tv") return { ...item, status: "Want to Watch/Read" };
    return item;
  });
  assert.equal(getHistoryData(changed, { year: "2024" }).total, 2);
  const history = getHistoryData(changed, { year: "2026" });
  assert.equal(history.total, 3);
  assert.deepEqual(history.groups.map((group) => group.month), ["2026-10"]);
  assert.deepEqual(history.unknownItems.map((item) => item.id), ["invalid"]);
});

test("History grouping preserves calendar dates across time zones and year boundaries", () => {
  const originalTimezone = process.env.TZ;
  const items = [
    { id: "new", title: "New year", status: "Completed", category: "movies", finishedOn: "2026-01-01" },
    { id: "old", title: "Last year", status: "Completed", category: "movies", finishedOn: "2025-12-31" },
  ];
  try {
    for (const timezone of ["America/Los_Angeles", "Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
      process.env.TZ = timezone;
      const history = getHistoryData(items, { year: "2026", month: "01" });
      assert.equal(history.total, 1);
      assert.equal(history.groups[0].month, "2026-01");
      assert.equal(history.groups[0].items[0].id, "new");
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
