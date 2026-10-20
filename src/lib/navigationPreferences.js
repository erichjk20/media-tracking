export const defaultNavigationShelves = Object.freeze(["books", "manga", "movies", "tv"]);

export function normalizeNavigationShelves(value) {
  const shelves = Array.isArray(value)
    ? [...new Set(value.filter((id) => defaultNavigationShelves.includes(id)))]
    : [];
  return shelves.length ? shelves : [...defaultNavigationShelves];
}

export function toggleNavigationShelf(value, id) {
  const shelves = normalizeNavigationShelves(value);
  if (!defaultNavigationShelves.includes(id)) return shelves;
  if (!shelves.includes(id)) return [...shelves, id];
  return shelves.length === 1 ? shelves : shelves.filter((entry) => entry !== id);
}

export function moveNavigationShelf(value, id, destination) {
  const shelves = normalizeNavigationShelves(value);
  const source = shelves.indexOf(id);
  if (source < 0 || !Number.isInteger(destination)) return shelves;
  const target = Math.max(0, Math.min(shelves.length - 1, destination));
  shelves.splice(source, 1);
  shelves.splice(target, 0, id);
  return shelves;
}

export function getNavigationLayout(value) {
  const shelves = normalizeNavigationShelves(value);
  const split = Math.ceil(shelves.length / 2);
  return {
    left: shelves.slice(0, split),
    right: shelves.slice(split),
    compact: shelves.length === 1,
    maxWidth: ({ 1: "10rem", 2: "15rem", 3: "20rem", 4: "24rem" })[shelves.length],
  };
}

export function getHomeNavigationCategory(activeCategory, value) {
  const shelves = normalizeNavigationShelves(value);
  return shelves.includes(activeCategory) ? activeCategory : shelves[0];
}
