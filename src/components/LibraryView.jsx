import { Library } from "lucide-react";
import {
  bookSubtypeOptions,
  movieSubtypeOptions,
  statuses,
  statusLabels,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import { MediaItemCard, MediaPosterCard } from "./MediaCards";
import {
  ShelfSearch,
  SortSelect,
  SubtypeFilter,
  ViewToggle,
} from "./ShelfControls";

function LibraryView({
  activeBookSubtype,
  activeCategory,
  activeMovieSubtype,
  activeStatus,
  activeTvSubtype,
  bookSubtypeCounts,
  category,
  counts,
  movieSubtypeCounts,
  onActiveBookSubtypeChange,
  onActiveMovieSubtypeChange,
  onActiveStatusChange,
  onActiveTvSubtypeChange,
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
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="min-w-0">
        <div className="border-b border-stone-300 pb-3 dark:border-stone-800">
          <div>
            <h2 className="text-[1.65rem] font-semibold leading-tight text-stone-950 dark:text-stone-100 sm:text-3xl">{category.label}</h2>
            <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
              {counts[activeCategory]?.Completed || 0} completed,{" "}
              {counts[activeCategory]?.["Want to Watch/Read"] || 0} planned
            </p>
          </div>
        </div>

        {activeCategory === "books" && (
          <SubtypeFilter
            activeSubtype={activeBookSubtype}
            counts={bookSubtypeCounts}
            onChange={onActiveBookSubtypeChange}
            options={bookSubtypeOptions}
          />
        )}

        {activeCategory === "movies" && (
          <SubtypeFilter
            activeSubtype={activeMovieSubtype}
            counts={movieSubtypeCounts}
            onChange={onActiveMovieSubtypeChange}
            options={movieSubtypeOptions}
          />
        )}

        {activeCategory === "tv" && (
          <SubtypeFilter
            activeSubtype={activeTvSubtype}
            counts={tvSubtypeCounts}
            onChange={onActiveTvSubtypeChange}
            options={tvSubtypeOptions}
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <div className="grid h-9 w-40 shrink-0 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900 sm:w-48">
            {statuses.map((status) => (
              <button
                key={status}
                className={`h-8 rounded px-2 text-xs font-semibold transition sm:px-3 ${
                  activeStatus === status ? "bg-teal-700 text-white dark:bg-teal-700/80 dark:text-white" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
                onClick={() => onActiveStatusChange(status)}
                type="button"
              >
                <span>{statusLabels[status]}</span>
                <span className={`ml-1 ${activeStatus === status ? "text-teal-100 dark:text-teal-100" : "text-stone-400 dark:text-stone-500"}`}>
                  {counts[activeCategory]?.[status] || 0}
                </span>
              </button>
            ))}
          </div>

          <ShelfSearch query={query} onChange={onQueryChange} />
          <SortSelect sortOrder={sortOrder} onChange={onSortOrderChange} />
          <ViewToggle shelfView={shelfView} onChange={onShelfViewChange} />
        </div>

        {visibleItems.length > 0 ? (
          shelfView === "grid" ? (
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
              {visibleItems.map((item) => (
                <MediaPosterCard key={item.id} item={item} onDelete={onDeleteItem} onEdit={onEditItem} onOpen={onOpenItem} />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <MediaItemCard key={item.id} item={item} onDelete={onDeleteItem} onEdit={onEditItem} onOpen={onOpenItem} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white px-6 text-center dark:border-stone-700 dark:bg-stone-900">
            <Library className="text-stone-400 dark:text-stone-500" size={36} />
            <h3 className="mt-4 text-lg font-semibold text-stone-950 dark:text-stone-100">Nothing here yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400">
              Add a title to this shelf or switch categories to browse another part of your library.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default LibraryView;
