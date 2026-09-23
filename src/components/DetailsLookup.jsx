import { useMemo } from "react";
import { LoaderCircle, Search } from "lucide-react";
import {
  getItemTileMeta,
  getKeywordMatchScore,
  getLookupResultImage,
  getLookupResultMeta,
  getLookupResultTitle,
  getPrimaryCreator,
  getSearchTokens,
  normalizeCompactSearchText,
  rankLookupResults,
} from "../lib/mediaUtils";
import { statusLabels } from "../lib/mediaConfig";
import MediaCover from "./MediaCover";

function getShelfMatchSearchText(item) {
  return [
    item.title,
    getPrimaryCreator(item),
    getItemTileMeta(item),
    statusLabels[item.status],
  ].join(" ");
}

function getShelfMatches(items, query) {
  const tokens = getSearchTokens(query);
  if (!tokens.length) return [];

  return items
    .map((item, index) => ({
      item,
      index,
      score: getKeywordMatchScore(getShelfMatchSearchText(item), tokens),
    }))
    .filter(({ score }) => score >= tokens.length)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map(({ item }) => item);
}

function getSavedItemKey(title) {
  return normalizeCompactSearchText(title);
}

function getSavedItemByTitle(items) {
  return items.reduce((savedItems, item) => {
    const key = getSavedItemKey(item.title);
    if (key && !savedItems.has(key)) savedItems.set(key, item);
    return savedItems;
  }, new Map());
}

function DetailsLookup({
  bookLanguage,
  categoryLabel,
  canUseBookLookup,
  existingItems = [],
  message,
  onApply,
  onBookLanguageChange,
  onOpenExisting,
  onQueryChange,
  onSearch,
  prompt,
  query,
  results,
  status,
  title = "Find details",
}) {
  const visibleResults = useMemo(() => rankLookupResults(results, query), [query, results]);
  const shelfMatches = useMemo(() => getShelfMatches(existingItems, query), [existingItems, query]);
  const savedItemByTitle = useMemo(() => getSavedItemByTitle(existingItems), [existingItems]);
  const isLoading = status === "loading";

  return (
    <div className="rounded-lg border border-shelf-accent/20 bg-shelf-accent-deep/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">{title}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search title details</span>
          <input
            className="input"
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch(event);
              }
            }}
            placeholder={prompt || `Search ${categoryLabel.toLowerCase()} title`}
          />
        </label>
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-shelf-accent-deep text-white transition hover:bg-shelf-accent disabled:cursor-not-allowed disabled:bg-white/10"
          disabled={isLoading}
          onClick={onSearch}
          type="button"
          aria-label="Find title details"
          title="Find title details"
        >
          {isLoading ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={17} />}
        </button>
      </div>

      {canUseBookLookup && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Book language</span>
            <select className="input" value={bookLanguage} onChange={(event) => onBookLanguageChange(event.target.value)}>
              <option value="en">English</option>
              <option value="all">Any language</option>
              <option value="ko">Korean</option>
            </select>
          </label>
        </div>
      )}

      {message && !shelfMatches.length && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700 dark:text-red-300" : "text-shelf-accent-soft"}`}>
          {message}
        </p>
      )}

      {shelfMatches.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">In your shelf</p>
          <ul className="mt-2 space-y-2">
            {shelfMatches.map((item) => {
              const creator = getPrimaryCreator(item);
              const meta = getItemTileMeta(item);
              const shelfLabel = statusLabels[item.status] || item.status;

              return (
                <li key={item.id}>
                  <button
                    className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-shelf-accent/25 bg-shelf-accent-deep/10 p-2 text-left transition hover:border-shelf-accent/60 dark:border-shelf-accent/30 dark:bg-shelf-accent-deep/15"
                    onClick={() => onOpenExisting?.(item)}
                    type="button"
                  >
                    <MediaCover
                      className="h-14 w-10 rounded"
                      imageClassName="h-14 w-10 rounded object-cover"
                      src={item.imageUrl}
                      title={item.title}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-stone-950 dark:text-[#eee9df]">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-stone-600 dark:text-stone-400">
                        {[creator, meta].filter(Boolean).join(" / ")}
                      </span>
                      <span className="mt-1 inline-flex rounded bg-shelf-accent-deep px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {shelfLabel}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {visibleResults.length > 0 && (
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {visibleResults.map((lookupResult) => {
            const imageUrl = getLookupResultImage(lookupResult);
            const title = getLookupResultTitle(lookupResult);
            const savedItem = savedItemByTitle.get(getSavedItemKey(title));
            const savedShelfLabel = savedItem ? statusLabels[savedItem.status] || savedItem.status : "";
            return (
              <li key={lookupResult.id}>
                <button
                  className={`grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border p-2 text-left transition ${
                    savedItem
                      ? "border-shelf-accent/25 bg-shelf-accent-deep/10 hover:border-shelf-accent/60 dark:border-shelf-accent/30 dark:bg-shelf-accent-deep/15"
                      : "border-stone-200 bg-white hover:border-shelf-accent/50 dark:border-white/10 dark:bg-[#181715]"
                  }`}
                  onClick={() => (savedItem ? onOpenExisting?.(savedItem) : onApply(lookupResult))}
                  type="button"
                >
                  <MediaCover
                    className="h-14 w-10 rounded"
                    imageClassName="h-14 w-10 rounded object-cover"
                    src={imageUrl}
                    title={title}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-950 dark:text-[#eee9df]">{title}</span>
                    <span className="mt-1 block truncate text-xs text-stone-600 dark:text-stone-400">{getLookupResultMeta(lookupResult)}</span>
                    {savedShelfLabel && (
                      <span className="mt-1 inline-flex rounded bg-shelf-accent-deep px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        Already in {savedShelfLabel}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default DetailsLookup;
