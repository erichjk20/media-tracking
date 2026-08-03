import { ArrowRight, Library, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { categories } from "../lib/mediaConfig";
import BrandWordmark from "./BrandWordmark";

function HomeView({
  activeCategory,
  onBrowseLibrary,
  onCategoryChange,
  onSearch,
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(activeCategory);
  const canSearch = Boolean(query.trim());

  useEffect(() => {
    setSelectedCategory(activeCategory);
  }, [activeCategory]);

  function selectCategory(categoryId) {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSearch) return;
    onSearch({
      categoryId: selectedCategory,
      query: query.trim(),
    });
  }

  return (
    <section className="flex min-h-svh w-full flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
      <div className="w-full max-w-xl">
        <div className="flex justify-center">
          <BrandWordmark animateBook />
        </div>

        <form className="mt-8" onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-lg border border-white/10 bg-[#171512]/75 p-1 shadow-[0_14px_44px_rgba(0,0,0,0.22)] backdrop-blur">
            {categories.map((entry) => {
              const Icon = entry.icon;
              const isActive = selectedCategory === entry.id;
              const label = entry.id === "tv" ? "TV" : entry.label;

              return (
                <button
                  key={entry.id}
                  className={`inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-semibold transition sm:h-10 sm:text-xs ${
                    isActive
                      ? "bg-shelf-accent-deep text-white shadow-sm"
                      : "text-stone-300 hover:bg-white/5 hover:text-stone-100"
                  }`}
                  onClick={() => selectCategory(entry.id)}
                  type="button"
                  aria-pressed={isActive}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.4 : 2.1} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 sm:left-5" size={20} />
            <input
              className="h-14 w-full rounded-full border border-white/10 bg-[#f8f5ee] pl-12 pr-14 text-base font-medium text-stone-950 shadow-[0_18px_56px_rgba(0,0,0,0.28)] outline-none transition placeholder:text-stone-500 focus:border-shelf-accent-bright focus:ring-4 focus:ring-shelf-accent-deep/35 sm:h-16 sm:pl-14 sm:pr-16"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a title"
              autoComplete="off"
            />
            <button
              className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-shelf-accent-deep text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-stone-100 sm:h-11 sm:w-11"
              disabled={!canSearch}
              type="submit"
              aria-label="Search title"
              title="Search title"
            >
              <ArrowRight size={20} />
            </button>
          </label>
        </form>

        <button
          className="mx-auto mt-6 inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold text-stone-400 transition hover:bg-white/5 hover:text-stone-100 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 sm:text-sm"
          onClick={onBrowseLibrary}
          type="button"
        >
          <Library size={16} />
          Browse library
        </button>
      </div>
    </section>
  );
}

export default HomeView;
