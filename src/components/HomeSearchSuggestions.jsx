import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import {
  getLookupResultImage,
  getLookupResultMeta,
  getLookupResultTitle,
} from "../lib/lookupResultUtils";
import MediaCover from "./MediaCover";

function HomeSuggestionRow({
  activeCategory,
  isLastResult,
  lookupResult,
  onSuggestionSelect,
  query,
}) {
  const title = getLookupResultTitle(lookupResult);
  const meta = getLookupResultMeta(lookupResult);

  return (
    <li>
      <button
        className="group grid w-full grid-cols-[44px_minmax(0,1fr)_28px] items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-shelf-accent-deep/10 focus:bg-shelf-accent-deep/10 focus:outline-none"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onSuggestionSelect({
          categoryId: activeCategory,
          lookupResult,
          query: title || query.trim(),
        })}
        type="button"
      >
        <MediaCover
          className="h-14 w-10 rounded shadow-sm"
          imageClassName="h-14 w-10 rounded object-cover"
          src={getLookupResultImage(lookupResult)}
          title={title}
        />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-5 text-stone-950">{title}</span>
          {meta && (
            <span className="mt-1 block truncate text-sm leading-5 text-stone-600">{meta}</span>
          )}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-shelf-accent-deep opacity-0 transition group-hover:bg-white/70 group-hover:opacity-100 group-focus:bg-white/70 group-focus:opacity-100">
          <ArrowRight size={16} />
        </span>
      </button>
      {!isLastResult && <div className="ml-[4.75rem] mr-12 h-px bg-stone-950/[0.08]" />}
    </li>
  );
}

function HomeSearchSuggestions({
  activeCategory,
  isLoading,
  lookupMessage,
  onSearch,
  onSuggestionSelect,
  query,
  results,
}) {
  const cleanedQuery = query.trim();

  return (
    <div className="absolute left-2 right-2 top-full z-50 mt-2 overflow-hidden rounded-lg border border-shelf-accent/25 bg-[#fbf8f1]/95 p-1 text-left shadow-[0_22px_64px_rgba(0,0,0,0.38)] ring-1 ring-black/5 backdrop-blur sm:left-4 sm:right-4">
      {isLoading && !results.length ? (
        <div className="flex h-14 items-center gap-2 rounded-md px-4 text-sm font-semibold text-stone-600">
          <LoaderCircle className="animate-spin" size={16} />
          Searching...
        </div>
      ) : results.length > 0 ? (
        <ul className="max-h-[23rem] overflow-y-auto">
          {results.map((lookupResult, index) => (
            <HomeSuggestionRow
              key={lookupResult.id}
              activeCategory={activeCategory}
              isLastResult={index === results.length - 1}
              lookupResult={lookupResult}
              onSuggestionSelect={onSuggestionSelect}
              query={query}
            />
          ))}
        </ul>
      ) : (
        <div>
          {lookupMessage && (
            <p className="px-4 pb-1 pt-2 text-sm font-medium text-stone-600">{lookupMessage}</p>
          )}
          <button
            className="group grid w-full grid-cols-[32px_minmax(0,1fr)_28px] items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-shelf-accent-deep/10 focus:bg-shelf-accent-deep/10 focus:outline-none"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSearch({
              categoryId: activeCategory,
              query: cleanedQuery,
            })}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/70 text-stone-600">
              <Search size={17} />
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-stone-950">Search for "{cleanedQuery}"</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-shelf-accent-deep opacity-70 transition group-hover:bg-white/70 group-hover:opacity-100 group-focus:bg-white/70 group-focus:opacity-100">
              <ArrowRight size={16} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default HomeSearchSuggestions;
