import { useState } from "react";
import { Library, Search } from "lucide-react";
import { categories, statusLabels } from "../lib/mediaConfig";
import MediaCover from "./MediaCover";
import { StatusSegmentedControl } from "./ShelfControls";

function HomeView({ items, onOpenItem, onStartLookup }) {
  const [homeQuery, setHomeQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Completed");
  const selectedCategoryDetails = categories.find((entry) => entry.id === selectedCategory);
  const recentItems = items.slice(-6).reverse();

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedQuery = homeQuery.trim();
    if (!selectedCategory || !cleanedQuery) return;

    onStartLookup({
      categoryId: selectedCategory,
      query: cleanedQuery,
      status: selectedStatus,
    });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="min-w-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-shelf-accent-bright/80">Log something new</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-stone-950 dark:text-[#eee9df] sm:text-5xl">Choose a media type.</h2>
        </div>

        <div className="mt-5 flex justify-center gap-2 pb-1">
          {categories.map((entry) => {
            const Icon = entry.icon;
            const isSelected = entry.id === selectedCategory;
            return (
              <button
                key={entry.id}
                className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${
                  isSelected
                    ? "border-shelf-accent-bright/40 bg-shelf-accent-deep text-white shadow-sm"
                    : "border-white/10 bg-[#181715] text-stone-200 hover:border-shelf-accent/50 hover:text-shelf-accent-soft"
                }`}
                onClick={() => setSelectedCategory(entry.id)}
                type="button"
                aria-label={entry.label}
                title={entry.label}
              >
                <Icon size={17} />
                <span>{entry.label}</span>
              </button>
            );
          })}
        </div>

        <form className="mx-auto mt-5 max-w-4xl" onSubmit={handleSubmit}>
          <div
            className={`grid gap-2 rounded-md border bg-white p-1.5 shadow-sm dark:bg-[#181715] md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center ${
              selectedCategory ? "border-stone-300 dark:border-white/10" : "border-dashed border-stone-300 dark:border-white/10"
            }`}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
              <input
                className="h-12 w-full rounded border-0 bg-white pl-10 pr-3 text-sm font-medium text-stone-950 outline-none placeholder:text-stone-400 focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-stone-50 dark:bg-[#181715] dark:text-stone-100 dark:placeholder:text-stone-500 dark:disabled:bg-[#24221f]"
                disabled={!selectedCategory}
                value={homeQuery}
                onChange={(event) => setHomeQuery(event.target.value)}
                placeholder={selectedCategoryDetails ? `Search ${selectedCategoryDetails.label.toLowerCase()} to log` : "Pick a media type first"}
              />
            </label>

            <StatusSegmentedControl
              activeStatus={selectedStatus}
              onChange={setSelectedStatus}
            />

            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-shelf-accent-deep px-4 text-sm font-semibold text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-white/10"
              disabled={!selectedCategory}
              type="submit"
            >
              <Search size={17} />
              Search to add
            </button>
          </div>
        </form>

        {recentItems.length > 0 && (
          <div className="mx-auto mt-10 max-w-5xl border-t border-stone-300 pt-6 dark:border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Recently added</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentItems.map((item) => {
                const itemCategory = categories.find((entry) => entry.id === item.category);
                const Icon = itemCategory?.icon || Library;
                return (
                  <button
                    key={item.id}
                    className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-stone-300 bg-white p-3 text-left shadow-sm transition hover:border-shelf-accent/50 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 dark:border-white/10 dark:bg-[#181715]"
                    onClick={() => onOpenItem(item)}
                    type="button"
                    aria-label={`Open ${item.title}`}
                  >
                    <MediaCover
                      className="h-16 w-11 rounded"
                      imageClassName="h-16 w-11 rounded object-cover"
                      src={item.imageUrl}
                      title={item.title}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-100">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-stone-600 dark:text-stone-400">{item.creator || "Unknown creator"}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-500">{statusLabels[item.status] || item.status}</p>
                    </div>
                    <span className="inline-flex h-8 items-center gap-1 rounded bg-shelf-accent-deep/15 px-2 text-[11px] font-semibold text-shelf-accent-soft ring-1 ring-shelf-accent/20">
                      <Icon size={13} />
                      {itemCategory?.label || "Media"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeView;
