import { useEffect, useRef, useState } from "react";
import { LayoutGrid, List as ListIcon, Search } from "lucide-react";
import { sortOptions } from "../lib/mediaConfig";

export function ShelfSearch({ query, onChange }) {
  const [isExpanded, setIsExpanded] = useState(Boolean(query));
  const inputRef = useRef(null);
  const showInput = isExpanded || Boolean(query);

  useEffect(() => {
    if (query) setIsExpanded(true);
  }, [query]);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  return (
    <div className={`min-w-0 ${showInput ? "basis-full" : "shrink-0"} sm:min-w-64 sm:flex-1 sm:basis-auto sm:shrink`}>
      <button
        className={`h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-100 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:focus:border-teal-500 dark:focus:ring-teal-950 sm:hidden ${
          showInput ? "hidden" : "inline-flex"
        }`}
        onClick={() => setIsExpanded(true)}
        type="button"
        aria-label="Search shelf"
        title="Search shelf"
      >
        <Search size={16} />
      </button>

      <label className={`relative min-w-0 ${showInput ? "block" : "hidden"} sm:block`}>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        <input
          ref={inputRef}
          className="h-9 w-full rounded-md border border-stone-300 bg-white/85 pl-9 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-teal-500 dark:focus:bg-stone-900 dark:focus:ring-teal-950 sm:text-xs"
          value={query}
          onBlur={() => {
            if (!query) setIsExpanded(false);
          }}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search shelf"
        />
      </label>
    </div>
  );
}

export function SortSelect({ sortOrder, onChange }) {
  const activeOption = sortOptions.find((option) => option.value === sortOrder) || sortOptions[0];
  const Icon = activeOption.icon;

  return (
    <label
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-100 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:focus-within:border-teal-500 dark:focus-within:ring-teal-950"
      title={`Sort: ${activeOption.label}`}
    >
      <span className="sr-only">Sort shelf</span>
      <Icon size={15} />
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={sortOrder}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Sort shelf"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ViewToggle({ shelfView, onChange }) {
  const options = [
    { value: "list", label: "List", icon: ListIcon },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  return (
    <div className="grid w-20 grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = shelfView === option.value;
        return (
          <button
            key={option.value}
            className={`inline-flex h-8 items-center justify-center rounded transition ${
              isActive ? "bg-teal-700 text-white dark:bg-teal-600" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            }`}
            onClick={() => onChange(option.value)}
            type="button"
            aria-label={`${option.label} view`}
            title={`${option.label} view`}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}

export function SubtypeFilter({ activeSubtype, counts, onChange, options }) {
  return (
    <div className={`mt-4 grid rounded-md border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-900 ${options.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`min-h-10 rounded px-2 text-sm font-medium transition ${
            activeSubtype === option.value ? "bg-teal-700 text-white dark:bg-teal-600" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          }`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="block truncate">{option.label}</span>
          <span className={`block text-xs ${activeSubtype === option.value ? "text-teal-50" : "text-stone-400 dark:text-stone-500"}`}>
            {counts[option.value] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}
