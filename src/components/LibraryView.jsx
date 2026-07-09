import { useState } from "react";
import { Library, Search } from "lucide-react";
import {
  bookSubtypeOptions,
  movieSubtypeOptions,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import { MediaItemCard, MediaPosterCard } from "./MediaCards";
import {
  ShelfSearch,
  SortSelect,
  StatusSegmentedControl,
  SubtypeFilter,
  ViewToggle,
} from "./ShelfControls";

function LibraryView({
  activeBookSubtype,
  activeCategory,
  activeMovieSubtype,
  activeShelfCounts,
  activeStatus,
  activeTvSubtype,
  bookSubtypeCounts,
  category,
  movieSubtypeCounts,
  onActiveBookSubtypeChange,
  onActiveMovieSubtypeChange,
  onActiveStatusChange,
  onActiveTvSubtypeChange,
  onCompleteItem,
  onDeleteItem,
  onEditItem,
  onOpenItem,
  onStartLookup,
  onShelfViewChange,
  onSortOrderChange,
  onQueryChange,
  query,
  shelfView,
  sortOrder,
  tvSubtypeCounts,
  visibleItems,
}) {
  const [logQuery, setLogQuery] = useState("");
  const completedCount = activeShelfCounts?.Completed || 0;
  const plannedCount = activeShelfCounts?.["Want to Watch/Read"] || 0;
  const categoryLabel = category.label.toLowerCase();
  let subtypeFilter = null;

  if (activeCategory === "books") {
    subtypeFilter = (
      <SubtypeFilter
        activeSubtype={activeBookSubtype}
        counts={bookSubtypeCounts}
        onChange={onActiveBookSubtypeChange}
        options={bookSubtypeOptions}
      />
    );
  }

  if (activeCategory === "movies") {
    subtypeFilter = (
      <SubtypeFilter
        activeSubtype={activeMovieSubtype}
        counts={movieSubtypeCounts}
        onChange={onActiveMovieSubtypeChange}
        options={movieSubtypeOptions}
      />
    );
  }

  if (activeCategory === "tv") {
    subtypeFilter = (
      <SubtypeFilter
        activeSubtype={activeTvSubtype}
        counts={tvSubtypeCounts}
        onChange={onActiveTvSubtypeChange}
        options={tvSubtypeOptions}
      />
    );
  }

  function handleLogSearchSubmit(event) {
    event.preventDefault();
    const cleanedQuery = logQuery.trim();
    if (!cleanedQuery) return;

    onStartLookup({
      categoryId: activeCategory,
      query: cleanedQuery,
      status: activeStatus,
    });
    setLogQuery("");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="min-w-0">
        <div className="border-b border-stone-300 pb-3 dark:border-white/10">
          <div>
            <h2 className="text-[1.65rem] font-semibold leading-tight text-stone-950 dark:text-[#eee9df] sm:text-3xl">{category.label}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              <span>
                {completedCount} completed, {plannedCount} planned
              </span>
              {subtypeFilter && (
                <>
                  <span className="text-stone-300 dark:text-white/15" aria-hidden="true">
                    /
                  </span>
                  {subtypeFilter}
                </>
              )}
            </div>
          </div>
        </div>

        <form className="mt-4" onSubmit={handleLogSearchSubmit}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
            <input
              className="h-14 w-full rounded-full border border-stone-300 bg-white pl-12 pr-16 text-base font-medium text-stone-950 shadow-[0_14px_45px_rgba(0,0,0,0.14)] outline-none transition placeholder:text-stone-400 focus:border-shelf-accent focus:ring-4 focus:ring-shelf-accent-deep/35 dark:border-white/10 dark:bg-[#181715] dark:text-stone-100 dark:placeholder:text-stone-500 sm:h-16 sm:pl-14 sm:pr-36"
              value={logQuery}
              onChange={(event) => setLogQuery(event.target.value)}
              placeholder={`Search ${categoryLabel} to log`}
            />
            <button
              className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-shelf-accent-deep text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-white/10 dark:disabled:text-stone-500 sm:right-3 sm:w-auto sm:px-5"
              disabled={!logQuery.trim()}
              type="submit"
              aria-label={`Search ${categoryLabel}`}
              title={`Search ${categoryLabel}`}
            >
              <Search size={17} />
              <span className="hidden text-sm font-semibold sm:ml-2 sm:inline">Search</span>
            </button>
          </label>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <StatusSegmentedControl
            activeStatus={activeStatus}
            counts={activeShelfCounts}
            onChange={onActiveStatusChange}
            variant="shelf"
          />

          <ShelfSearch query={query} onChange={onQueryChange} />
          <SortSelect sortOrder={sortOrder} onChange={onSortOrderChange} />
          <ViewToggle shelfView={shelfView} onChange={onShelfViewChange} />
        </div>

        {visibleItems.length > 0 ? (
          shelfView === "grid" ? (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
              {visibleItems.map((item) => (
                <MediaPosterCard key={item.id} item={item} onComplete={onCompleteItem} onDelete={onDeleteItem} onEdit={onEditItem} onOpen={onOpenItem} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <MediaItemCard key={item.id} item={item} onComplete={onCompleteItem} onDelete={onDeleteItem} onEdit={onEditItem} onOpen={onOpenItem} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 text-center dark:border-white/10 dark:bg-[#181715]/70">
            <Library className="text-stone-400 dark:text-stone-500" size={36} />
            <h3 className="mt-4 text-lg font-semibold text-stone-950 dark:text-[#eee9df]">Nothing here yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400">
              Search {categoryLabel} above to save your first title here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LibraryView;
