import { useMemo } from "react";
import { Search } from "lucide-react";
import {
  getLookupResultImage,
  getLookupResultMeta,
  getLookupResultTitle,
  rankLookupResults,
} from "../lib/mediaUtils";
import MediaCover from "./MediaCover";

function DetailsLookup({
  bookLanguage,
  categoryLabel,
  canUseBookLookup,
  message,
  onApply,
  onBookLanguageChange,
  onQueryChange,
  onSearch,
  prompt,
  query,
  results,
  status,
  title = "Find details",
}) {
  const visibleResults = useMemo(() => rankLookupResults(results, query), [query, results]);

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
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Find title details"
          title="Find title details"
        >
          <Search size={17} />
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

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700 dark:text-red-300" : "text-shelf-accent-soft"}`}>
          {message}
        </p>
      )}

      {visibleResults.length > 0 && (
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {visibleResults.map((lookupResult) => {
            const imageUrl = getLookupResultImage(lookupResult);
            const title = getLookupResultTitle(lookupResult);
            return (
              <li key={lookupResult.id}>
                <button
                  className="grid w-full grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-shelf-accent/50 dark:border-white/10 dark:bg-[#181715]"
                  onClick={() => onApply(lookupResult)}
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
