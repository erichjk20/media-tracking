import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer } from "vite";
import {
  defaultNavigationShelves,
  getHomeNavigationCategory,
  getNavigationLayout,
  moveNavigationShelf,
  normalizeNavigationShelves,
  toggleNavigationShelf,
} from "../src/lib/navigationPreferences.js";

let server;
let auth;
let media;
let row;
let updateError;
let writes;
const local = new Map();
const oldWindow = globalThis.window;

before(async () => {
  globalThis.window = {
    location: { search: "", hash: "" },
    localStorage: {
      getItem: (key) => local.get(key) ?? null,
      setItem: (key, value) => local.set(key, value),
    },
  };
  globalThis.__navigationTestClient = {
    from(table) {
      assert.equal(table, "user_profiles");
      let operation = "read";
      let payload;
      let options;
      let userId;
      const query = {
        select() { return this; },
        eq(column, value) { assert.equal(column, "id"); userId = value; return this; },
        upsert(value, config) { operation = "upsert"; payload = value; options = config; return this; },
        update(value) { operation = "update"; payload = value; return this; },
        maybeSingle() { return Promise.resolve({ data: row?.id === userId ? structuredClone(row) : null, error: null }); },
        single() { return Promise.resolve(execute()); },
        then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); },
      };
      function execute() {
        if (operation === "update") {
          writes.push({ ...payload });
          if (updateError) return { data: null, error: updateError };
          assert.equal(userId, row.id);
          row = { ...row, ...payload };
        }
        if (operation === "upsert") {
          writes.push({ ...payload });
          assert.equal(options.ignoreDuplicates, true);
          row ??= { ...payload, navigation_shelves: [...defaultNavigationShelves] };
        }
        return { data: structuredClone(row), error: null };
      }
      return query;
    },
  };
  server = await createServer({
    configFile: false,
    envFile: false,
    ssr: { noExternal: ["@supabase/supabase-js"] },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://example.test"),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify("test-key"),
    },
    server: { middlewareMode: true, watch: null, ws: false },
    plugins: [{
      name: "mock-profile-client",
      enforce: "pre",
      resolveId(id) { if (id === "@supabase/supabase-js") return "\0test-profile-client"; },
      load(id) { if (id === "\0test-profile-client") return "export const createClient = () => globalThis.__navigationTestClient;"; },
    }],
  });
  auth = await server.ssrLoadModule("/src/lib/supabase.js");
  media = await server.ssrLoadModule("/src/lib/mediaUtils.js");
});

beforeEach(() => {
  row = { id: "user-a", email: "a@example.test", display_name: "My shelves", navigation_shelves: ["movies", "books"] };
  updateError = null;
  writes = [];
  local.clear();
});

after(async () => {
  await server?.close();
  if (oldWindow === undefined) delete globalThis.window;
  else globalThis.window = oldWindow;
  delete globalThis.__navigationTestClient;
});

test("navigation defaults and malformed preferences retain only unique known shelves", () => {
  for (const value of [undefined, null, {}, "movies", [], [null, "unknown"]]) {
    assert.deepEqual(normalizeNavigationShelves(value), defaultNavigationShelves);
  }
  assert.deepEqual(normalizeNavigationShelves(["tv", "tv", "unknown", null, "books"]), ["tv", "books"]);
  const normalized = normalizeNavigationShelves();
  normalized.pop();
  assert.equal(defaultNavigationShelves.length, 4);
});

test("selection protects the final shelf and appends re-enabled shelves", () => {
  assert.deepEqual(toggleNavigationShelf(["movies"], "movies"), ["movies"]);
  assert.deepEqual(toggleNavigationShelf(["movies", "books"], "movies"), ["books"]);
  assert.deepEqual(toggleNavigationShelf(["movies"], "books"), ["movies", "books"]);
  assert.deepEqual(toggleNavigationShelf(["movies"], "unknown"), ["movies"]);
});

test("reordering moves shelves without mutating its input and clamps positions", () => {
  const initial = ["books", "manga", "movies", "tv"];
  assert.deepEqual(moveNavigationShelf(initial, "tv", 0), ["tv", "books", "manga", "movies"]);
  assert.deepEqual(moveNavigationShelf(initial, "books", 99), ["manga", "movies", "tv", "books"]);
  assert.deepEqual(moveNavigationShelf(initial, "manga", -1), ["manga", "books", "movies", "tv"]);
  assert.deepEqual(moveNavigationShelf(initial, "unknown", 0), initial);
  assert.deepEqual(moveNavigationShelf(initial, "books", NaN), initial);
  assert.deepEqual(initial, defaultNavigationShelves);
});

test("all menu counts preserve shelf order and the centered Add layout", () => {
  const cases = [
    [["tv"], ["tv"], [], true],
    [["tv", "books"], ["tv"], ["books"], false],
    [["tv", "books", "manga"], ["tv", "books"], ["manga"], false],
    [["tv", "books", "manga", "movies"], ["tv", "books"], ["manga", "movies"], false],
  ];
  for (const [shelves, left, right, compact] of cases) {
    const layout = getNavigationLayout(shelves);
    assert.deepEqual(layout.left, left);
    assert.deepEqual(layout.right, right);
    assert.equal(layout.compact, compact);
  }
});

test("Home falls back to a selected shelf while library destinations remain independent", () => {
  assert.equal(getHomeNavigationCategory("manga", ["movies", "books"]), "movies");
  assert.equal(getHomeNavigationCategory("books", ["movies", "books"]), "books");
});

test("local profile round trips retain customization and display-name changes", () => {
  assert.deepEqual(media.getStoredProfile().navigation_shelves, defaultNavigationShelves);
  media.saveStoredProfile({ ...media.getStoredProfile(), navigation_shelves: ["tv", "books"], display_name: "First" });
  let profile = media.getStoredProfile();
  assert.deepEqual(profile.navigation_shelves, ["tv", "books"]);
  media.saveStoredProfile({ ...profile, display_name: "Second" });
  profile = media.getStoredProfile();
  assert.equal(profile.display_name, "Second");
  assert.deepEqual(profile.navigation_shelves, ["tv", "books"]);
  local.set("media-shelf-profile", "invalid json");
  assert.deepEqual(media.getStoredProfile().navigation_shelves, defaultNavigationShelves);
});

test("cloud preference saves change only navigation and timestamp; sign-in and name edits preserve them", async () => {
  const saved = await auth.updateUserNavigationShelves("user-a", ["tv", "manga"]);
  assert.deepEqual(Object.keys(writes[0]).sort(), ["navigation_shelves", "updated_at"]);
  assert.deepEqual(saved.navigation_shelves, ["tv", "manga"]);
  assert.equal(saved.display_name, "My shelves");
  const profile = await auth.ensureUserProfile({ id: "user-a", email: row.email, user_metadata: { display_name: "Stale metadata" } });
  assert.equal(writes.length, 1);
  assert.equal(profile.display_name, "My shelves");
  assert.deepEqual(profile.navigation_shelves, ["tv", "manga"]);
  const renamed = await auth.updateUserProfileDisplayName("user-a", "New name");
  assert.deepEqual(renamed.navigation_shelves, ["tv", "manga"]);
  assert.equal(renamed.display_name, "New name");
});

test("missing profiles are created without explicitly resetting navigation defaults", async () => {
  row = null;
  const profile = await auth.ensureUserProfile({ id: "user-b", email: "b@example.test" });
  assert.equal(profile.id, "user-b");
  assert.deepEqual(profile.navigation_shelves, defaultNavigationShelves);
  assert.equal(Object.hasOwn(writes[0], "navigation_shelves"), false);
});

test("sign-in refreshes a changed email without resetting saved profile fields", async () => {
  const profile = await auth.ensureUserProfile({ id: "user-a", email: "new@example.test" });
  assert.deepEqual(Object.keys(writes[0]).sort(), ["email", "updated_at"]);
  assert.equal(profile.email, "new@example.test");
  assert.equal(profile.display_name, "My shelves");
  assert.deepEqual(profile.navigation_shelves, ["movies", "books"]);
});

test("missing migration and other save failures do not change persisted preferences", async () => {
  const before = structuredClone(row);
  updateError = { code: "PGRST204", message: "Could not find the 'navigation_shelves' column of 'user_profiles' in the schema cache" };
  await assert.rejects(auth.updateUserNavigationShelves("user-a", ["tv"]), /migration/);
  assert.deepEqual(row, before);
  updateError = new Error("Connection failed");
  await assert.rejects(auth.updateUserNavigationShelves("user-a", ["tv"]), /Connection failed/);
  assert.deepEqual(row, before);
  await assert.rejects(auth.updateUserNavigationShelves("", ["tv"]), /Sign in/);
});
