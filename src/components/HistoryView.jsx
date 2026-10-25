import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, CalendarDays, ChevronDown, History } from "lucide-react";
import { categories } from "../lib/mediaConfig";
import { formatMediaDate, getLocalDate } from "../lib/mediaDates";
import { getHistoryData, getHistoryYears } from "../lib/mediaHistory";
import MediaActivityDate from "./MediaActivityDate";
import MediaCover from "./MediaCover";
import Rating from "./Rating";

const months = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1).padStart(2, "0");
  return { value, label: new Intl.DateTimeFormat(undefined, { month: "long", timeZone: "UTC" }).format(new Date(`2000-${value}-01T12:00:00Z`)) };
});

function HistoryItem({ item, onOpenItem }) {
  const category = categories.find((entry) => entry.id === item.category);
  const descriptionId = `history-${item.id}-description`;

  return (
    <li className="min-w-0">
      <button
        className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-[#181715] p-3 text-left transition hover:border-shelf-accent-bright/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft"
        onClick={() => onOpenItem(item)}
        type="button"
        aria-label={`Open ${item.title}`}
        aria-describedby={descriptionId}
      >
        <MediaCover
          className="flex h-[72px] w-12 shrink-0 items-end overflow-hidden rounded p-1 text-[10px] font-semibold text-white"
          imageClassName="h-[72px] w-12 shrink-0 rounded object-cover"
          src={item.imageUrl}
          title={item.title}
        />
        <div className="min-w-0 flex-1">
          <span className="line-clamp-2 break-words text-sm font-semibold leading-5 text-[#eee9df]" title={item.title}>{item.title}</span>
          <div id={descriptionId}>
            <span className="mt-1 block truncate text-xs text-stone-400">{category?.label}{item.creator ? ` · ${item.creator}` : ""}</span>
            <MediaActivityDate item={item} className="mt-1 text-xs text-stone-300" />
            <Rating value={item.rating} readOnly compact />
            <span className="sr-only">Your rating: {item.rating} out of 5 stars.</span>
          </div>
        </div>
      </button>
    </li>
  );
}

function HistoryView({ items, year, month, category, onYearChange, onMonthChange, onCategoryChange, onBack, onOpenItem }) {
  const headingRef = useRef(null);
  const currentYear = getLocalDate().slice(0, 4);
  const years = useMemo(() => getHistoryYears(items, currentYear), [items, currentYear]);
  const selectedYear = years.includes(year) ? year : years[0];
  const history = useMemo(() => getHistoryData(items, { year: selectedYear, month, category }), [items, selectedYear, month, category]);
  const periodLabel = month === "all" ? selectedYear : formatMediaDate(`${selectedYear}-${month}`, { dateOnly: true });
  const categoryLabel = categories.find((entry) => entry.id === category)?.label;

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-5" aria-labelledby="history-heading">
      <button
        className="-ml-2 mb-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium text-stone-400 transition hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft"
        onClick={onBack}
        type="button"
        aria-label="Back to profile"
      >
        <ArrowLeft size={17} className="shrink-0" />
        Profile
      </button>
      <h2 ref={headingRef} id="history-heading" tabIndex={-1} className="text-2xl font-semibold text-[#eee9df] outline-none">History</h2>
      <p className="mt-1 text-sm text-stone-400">A look back at what you watched and read.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="min-w-0 flex-[1_1_7rem] sm:flex-initial">
          <label htmlFor="history-year" className="text-xs font-medium text-stone-400">Year</label>
          <div className="relative mt-1.5">
            <select
              id="history-year"
              className="block min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#181715] py-2.5 pl-3 pr-10 text-base leading-5 text-stone-100 outline-none focus:border-shelf-accent-bright/50 focus:ring-2 focus:ring-shelf-accent-deep/35 sm:min-w-28 sm:text-sm"
              value={selectedYear}
              onChange={(event) => onYearChange(event.target.value)}
            >
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
        <div className="min-w-0 flex-[1.4_1_10rem] sm:flex-initial">
          <label htmlFor="history-month" className="text-xs font-medium text-stone-400">Month</label>
          <div className="relative mt-1.5">
            <select
              id="history-month"
              className="block min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#181715] py-2.5 pl-3 pr-10 text-base leading-5 text-stone-100 outline-none focus:border-shelf-accent-bright/50 focus:ring-2 focus:ring-shelf-accent-deep/35 sm:min-w-44 sm:text-sm"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
            >
              <option value="all">All months</option>
              {months.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
            </select>
            <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
      </div>

      <div className="mt-4" role="status" aria-live="polite" aria-atomic="true">
        <p className="text-sm leading-6 text-stone-400">
          <span className="mr-1 text-2xl font-semibold tabular-nums text-[#eee9df]">{history.total}</span>{" "}
          {history.total === 1 ? "title" : "titles"} finished in {periodLabel}{categoryLabel ? ` · ${categoryLabel}` : ""}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter history by media type">
        {[{ id: "all", label: "All media", count: history.periodTotal }, ...categories.map((entry) => ({ ...entry, count: history.categoryCounts[entry.id] || 0 }))].map((entry) => (
          <button
            key={entry.id}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft ${category === entry.id ? "border-shelf-accent-bright/30 bg-shelf-accent-deep/25 text-shelf-accent-soft" : "border-white/10 bg-[#181715] text-stone-400 hover:text-stone-100"}`}
            onClick={() => onCategoryChange(entry.id)}
            type="button"
            aria-pressed={category === entry.id}
          >
            {entry.label}
            <span className="tabular-nums opacity-75">{entry.count}</span>
          </button>
        ))}
      </div>

      {history.groups.length > 0 ? (
        <div className="mt-5 space-y-7">
          {history.groups.map((group) => (
            <section key={group.month} aria-label={formatMediaDate(group.month, { dateOnly: true })}>
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                <CalendarDays size={16} className="shrink-0 text-stone-500" />
                <h3 className="min-w-0 flex-1 text-base font-semibold text-[#eee9df]">{formatMediaDate(group.month, { dateOnly: true })}</h3>
                <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-stone-400">{group.items.length} {group.items.length === 1 ? "title" : "titles"}</span>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.items.map((item) => <HistoryItem key={item.id} item={item} onOpenItem={onOpenItem} />)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center">
          <History size={30} className="text-stone-500" />
          <h3 className="mt-3 text-base font-semibold text-stone-200">No finished titles for this period</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-stone-400">Try another period or media type. Titles appear here when they have a finished date.</p>
        </div>
      )}

      {history.unknownItems.length > 0 && (
        <details className="group mt-8 border-t border-white/10 pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-stone-300 outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft [&::-webkit-details-marker]:hidden">
            Date unknown
            <span className="text-xs font-medium tabular-nums text-stone-500">{history.unknownItems.length}</span>
            <ChevronDown aria-hidden="true" size={17} className="ml-auto shrink-0 text-stone-500 transition group-open:rotate-180" />
          </summary>
          <p className="mb-4 mt-1 max-w-lg text-xs leading-5 text-stone-400">Across all years. These titles aren’t included in dated totals. Open a title and edit it to add a finished date.</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {history.unknownItems.map((item) => <HistoryItem key={item.id} item={item} onOpenItem={onOpenItem} />)}
          </ul>
        </details>
      )}
    </section>
  );
}

export default HistoryView;
