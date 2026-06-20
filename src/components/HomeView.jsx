import { useEffect, useState } from "react";
import { Library, Search } from "lucide-react";
import { categories, statuses, statusLabels } from "../lib/mediaConfig";

function HomeView({ items, onOpenItem, onStartLookup, searchResetToken }) {
  const [homeQuery, setHomeQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Completed");
  const selectedCategoryDetails = categories.find((entry) => entry.id === selectedCategory);
  const recentItems = items.slice(-6).reverse();

  useEffect(() => {
    setHomeQuery("");
  }, [searchResetToken]);

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
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">Log something new</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-stone-950 dark:text-stone-100 sm:text-5xl">Choose a media type.</h2>
        </div>

        <div className="mt-5 flex justify-center gap-2 pb-1">
          {categories.map((entry) => {
            const Icon = entry.icon;
            const isSelected = entry.id === selectedCategory;
            return (
              <button
                key={entry.id}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-stone-950 bg-stone-950 text-white shadow-sm dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950"
                    : "border-stone-300 bg-white text-stone-700 hover:border-teal-700 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-teal-500 dark:hover:text-teal-300"
                }`}
                onClick={() => setSelectedCategory(entry.id)}
                type="button"
                aria-label={entry.label}
                title={entry.label}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>

        <form className="mx-auto mt-5 max-w-4xl" onSubmit={handleSubmit}>
          <div
            className={`grid gap-2 rounded-md border bg-white p-1.5 shadow-sm dark:bg-stone-900 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center ${
              selectedCategory ? "border-stone-300 dark:border-stone-700" : "border-dashed border-stone-300 dark:border-stone-700"
            }`}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={18} />
              <input
                className="h-12 w-full rounded border-0 bg-white pl-10 pr-3 text-sm font-medium text-stone-950 outline-none placeholder:text-stone-400 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-50 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:ring-teal-950 dark:disabled:bg-stone-800"
                disabled={!selectedCategory}
                value={homeQuery}
                onChange={(event) => setHomeQuery(event.target.value)}
                placeholder={selectedCategoryDetails ? `Search ${selectedCategoryDetails.label.toLowerCase()} to log` : "Pick a media type first"}
              />
            </label>

            <div className="grid grid-cols-2 rounded-md border border-stone-300 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-950 md:w-32">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`h-8 rounded px-2 text-xs font-semibold transition ${
                    selectedStatus === status ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                  }`}
                  onClick={() => setSelectedStatus(status)}
                  type="button"
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950 dark:disabled:bg-stone-700"
              disabled={!selectedCategory}
              type="submit"
            >
              <Search size={17} />
              Search to add
            </button>
          </div>
        </form>

        {recentItems.length > 0 && (
          <div className="mx-auto mt-10 max-w-5xl border-t border-stone-300 pt-6 dark:border-stone-800">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Recently added</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentItems.map((item) => {
                const itemCategory = categories.find((entry) => entry.id === item.category);
                const Icon = itemCategory?.icon || Library;
                return (
                  <button
                    key={item.id}
                    className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-stone-300 bg-white p-3 text-left shadow-sm transition hover:border-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500 dark:focus:ring-teal-950"
                    onClick={() => onOpenItem(item)}
                    type="button"
                    aria-label={`Open ${item.title}`}
                  >
                    {item.imageUrl ? (
                      <img className="h-16 w-11 rounded object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
                    ) : (
                      <div className="cover-fallback h-16 w-11 rounded" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-950 dark:text-stone-100">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-stone-600 dark:text-stone-400">{item.creator || "Unknown creator"}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-500">{statusLabels[item.status] || item.status}</p>
                    </div>
                    <span className="inline-flex h-8 items-center gap-1 rounded bg-teal-50 px-2 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-900">
                      <Icon size={13} />
                      {itemCategory?.label.replace("TV Shows", "TV") || "Media"}
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
