import { Library } from "lucide-react";
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
  onShelfViewChange,
  onSortOrderChange,
  onQueryChange,
  query,
  shelfView,
  sortOrder,
  tvSubtypeCounts,
  visibleItems,
}) {
  const doneCount = activeShelfCounts?.Completed || 0;
  const wantCount = activeShelfCounts?.["Want to Watch/Read"] || 0;
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

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="min-w-0">
        <div className="border-b border-stone-300 pb-3 dark:border-white/10">
          <div>
            <h2 className="text-[1.65rem] font-semibold leading-tight text-stone-950 dark:text-[#eee9df] sm:text-3xl">{category.label}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              <span>
                {doneCount} done, {wantCount} want
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
              Add your first {categoryLabel} title and it will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LibraryView;
