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
  canUseTmdb,
  lookupProviders,
  message,
  onApply,
  onBookLanguageChange,
  onQueryChange,
  onSearch,
  onTmdbLanguageChange,
  query,
  results,
  status,
  tmdbLanguage,
}) {
  const visibleResults = useMemo(() => rankLookupResults(results, query), [query, results]);

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-900 dark:bg-teal-950/25">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">Find details</span>
        {lookupProviders.map((provider) => (
          <span key={provider.id} className="rounded bg-white px-2 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-100 dark:bg-stone-900 dark:text-teal-200 dark:ring-teal-900">
            {provider.label}
          </span>
        ))}
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
            placeholder={`Search ${categoryLabel.toLowerCase()} title`}
          />
        </label>
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={status === "loading"}
          onClick={onSearch}
          type="button"
          aria-label="Find title details"
          title="Find title details"
        >
          <Search size={17} />
        </button>
      </div>

      {(canUseBookLookup || canUseTmdb) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {canUseBookLookup && (
            <label>
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Book language</span>
              <select className="input" value={bookLanguage} onChange={(event) => onBookLanguageChange(event.target.value)}>
                <option value="en">English</option>
                <option value="all">Any language</option>
                <option value="ko">Korean</option>
              </select>
            </label>
          )}

          {canUseTmdb && (
            <label>
              <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">TMDb language</span>
              <select className="input" value={tmdbLanguage} onChange={(event) => onTmdbLanguageChange(event.target.value)}>
                <option value="en-US">English</option>
                <option value="ko-KR">Korean</option>
              </select>
            </label>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-sm leading-5 ${status === "error" ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-200"}`}>
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
                  className="grid w-full grid-cols-[42px_minmax(0,1fr)_auto] gap-3 rounded-md border border-stone-200 bg-white p-2 text-left transition hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500"
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
                    <span className="block truncate text-sm font-semibold text-stone-950 dark:text-stone-100">{title}</span>
                    <span className="mt-1 block truncate text-xs text-stone-600 dark:text-stone-400">{getLookupResultMeta(lookupResult)}</span>
                  </span>
                  <span className="self-start rounded bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {lookupResult.sourceLabel}
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
