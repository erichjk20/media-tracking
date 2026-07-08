import { Search } from "lucide-react";
import { categories } from "../lib/mediaConfig";
import { StatusSegmentedControl } from "./ShelfControls";

function HomeCommand({
  homeQuery,
  onCategoryChange,
  onQueryChange,
  onStatusChange,
  onSubmit,
  selectedCategory,
  selectedCategoryLabel,
  selectedStatus,
}) {
  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold leading-tight text-[#eee9df] sm:text-5xl">
          What would you like to log?
        </h2>
      </div>

      <MediaTypeSelector
        selectedCategory={selectedCategory}
        onChange={onCategoryChange}
      />

      <form className="mx-auto mt-4 w-full max-w-[42rem]" onSubmit={onSubmit}>
        <div className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StatusSegmentedControl
            activeStatus={selectedStatus}
            className="w-full max-w-[16rem] sm:w-48"
            onChange={onStatusChange}
          />
        </div>

        <CommandSearch
          query={homeQuery}
          selectedCategoryLabel={selectedCategoryLabel}
          onQueryChange={onQueryChange}
        />
      </form>
    </>
  );
}

function MediaTypeSelector({ selectedCategory, onChange }) {
  return (
    <div className="mx-auto mt-7 grid w-full max-w-[42rem] grid-cols-4 gap-1 rounded-full border border-white/10 bg-[#181715]/70 p-1 shadow-[0_14px_45px_rgba(0,0,0,0.2)]">
      {categories.map((entry) => {
        const Icon = entry.icon;
        const isSelected = entry.id === selectedCategory;
        const compactLabel = entry.id === "tv" ? "TV" : entry.label;

        return (
          <button
            key={entry.id}
            className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition sm:h-11 sm:gap-2 sm:text-sm ${
              isSelected
                ? "bg-[#d7cec0] text-[#141210] shadow-sm"
                : "text-stone-300 hover:bg-white/5 hover:text-shelf-accent-soft"
            }`}
            onClick={() => onChange(entry.id)}
            type="button"
            aria-label={entry.label}
            title={entry.label}
          >
            <Icon className="shrink-0" size={16} />
            <span className="truncate sm:hidden">{compactLabel}</span>
            <span className="hidden truncate sm:inline">{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CommandSearch({ query, selectedCategoryLabel, onQueryChange }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={22} />
      <input
        className="h-16 w-full rounded-full border border-stone-300 bg-white pl-14 pr-16 text-base font-medium text-stone-950 shadow-[0_18px_60px_rgba(0,0,0,0.18)] outline-none transition placeholder:text-stone-400 focus:border-shelf-accent focus:ring-4 focus:ring-shelf-accent-deep/35 dark:border-white/10 dark:bg-[#181715] dark:text-stone-100 dark:placeholder:text-stone-500 sm:h-[4.5rem] sm:pl-16 sm:pr-40 sm:text-lg"
        autoFocus
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={`Search ${selectedCategoryLabel} to log`}
      />
      <button
        className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center gap-2 rounded-full bg-shelf-accent-deep text-sm font-semibold text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-white/10 dark:disabled:text-stone-500 sm:right-3 sm:w-auto sm:px-5"
        disabled={!query.trim()}
        type="submit"
        aria-label={`Search ${selectedCategoryLabel}`}
        title={`Search ${selectedCategoryLabel}`}
      >
        <Search size={17} />
        <span className="hidden sm:inline">Search {selectedCategoryLabel}</span>
      </button>
    </label>
  );
}

export default HomeCommand;
