import { useEffect, useRef } from "react";
import { ChevronRight, History, Library, Settings, UserRound } from "lucide-react";
import { statusLabels } from "../lib/mediaConfig";
import MediaCover from "./MediaCover";

function formatAverageRating(value) {
  return value ? value.toFixed(1) : "0.0";
}

function ProfileView({
  focusHistory = false,
  metrics,
  onOpenItem,
  onShowHistory,
  onShowSettings,
  onShowCategory,
  profile,
  user,
}) {
  const settingsButtonRef = useRef(null);
  const historyButtonRef = useRef(null);
  const shownName = profile?.display_name || "Your profile";
  const completedPercent = metrics.totalCount
    ? Math.round((metrics.completedCount / metrics.totalCount) * 100)
    : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
    const focusTarget = focusHistory ? historyButtonRef : settingsButtonRef;
    focusTarget.current?.focus({ preventScroll: true });
  }, [focusHistory]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-shelf-accent-deep/20 text-shelf-accent-soft">
              <UserRound size={21} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[#eee9df]">{shownName}</h2>
              <p className="mt-0.5 text-sm text-stone-400">{user ? "Your library" : "Local library"}</p>
            </div>
          </div>
          <button
            ref={settingsButtonRef}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181715] text-stone-300 transition hover:border-shelf-accent-bright/30 hover:text-shelf-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft"
            onClick={onShowSettings}
            type="button"
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="min-w-0">
          <div className="grid gap-5">
            <section className="border-y border-white/10 py-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#eee9df]">Media totals</h3>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 sm:max-w-lg sm:flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Library</p>
                  <div className="mt-1 flex items-end gap-3">
                    <span className="text-6xl font-semibold leading-none text-[#eee9df]">{metrics.totalCount}</span>
                    <span className="pb-1 text-sm font-semibold text-stone-500">
                      {metrics.totalCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
                      <span className="text-stone-300">
                        {metrics.completedCount} done <span className="text-stone-600">/</span> {metrics.plannedCount} want
                      </span>
                      <span className="text-stone-600">/</span>
                      <span className="text-stone-400">{formatAverageRating(metrics.averageRating)} avg rating</span>
                      <span className="ml-auto shrink-0 text-shelf-accent-soft">{completedPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-shelf-accent-bright"
                        style={{ width: `${completedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                {metrics.categoryBreakdown.map((entry) => (
                  <button
                    key={entry.id}
                    className="group min-w-0 text-left focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                    onClick={() => onShowCategory(entry.id)}
                    type="button"
                    aria-label={`Open ${entry.label}`}
                  >
                    <span className="block border-l border-white/10 pl-3 transition group-hover:border-shelf-accent/60">
                      <p className="mt-3 truncate text-sm font-semibold text-stone-100">{entry.label}</p>
                      <span className="mt-1 flex min-w-0 items-end gap-3">
                        <span className="text-5xl font-semibold leading-none text-[#eee9df] transition group-hover:text-shelf-accent-soft">{entry.total}</span>
                        <span className="pb-1 text-xs font-semibold leading-4 text-stone-500">
                          <span className="block whitespace-nowrap text-shelf-accent-soft">{entry.completed} {statusLabels.Completed}</span>
                          <span className="block whitespace-nowrap">{entry.planned} {statusLabels["Want to Watch/Read"]}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <button
              ref={historyButtonRef}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#181715] p-4 text-left transition hover:border-shelf-accent-bright/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft"
              onClick={onShowHistory}
              type="button"
              aria-label="History"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-shelf-accent-deep/15 text-shelf-accent-soft"><History size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-100">History</span>
                <span className="mt-1 block text-xs leading-5 text-stone-400">Revisit what you finished, month by month.</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-stone-500" />
            </button>

            <section className="rounded-lg border border-white/10 bg-[#181715] p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-[#eee9df]">Recently added</h3>
              {metrics.recentItems.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {metrics.recentItems.map((item) => (
                    <button
                      key={item.id}
                      className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-md border border-white/10 bg-[#12110f] p-2 text-left transition hover:border-shelf-accent/40 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                      onClick={() => onOpenItem(item)}
                      type="button"
                    >
                      <MediaCover
                        className="flex h-16 w-11 items-end rounded p-1 text-[10px] font-semibold text-white"
                        imageClassName="h-16 w-11 rounded object-cover"
                        src={item.imageUrl}
                        title={item.title}
                      />
                      <div className="min-w-0 self-center">
                        <p className="truncate text-sm font-semibold text-stone-100">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-stone-500">{item.creator || "Unknown creator"}</p>
                      </div>
                      <span className="self-center rounded bg-white/5 px-2 py-1 text-[11px] font-semibold text-stone-400">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-white/10 px-4 text-center">
                  <Library className="text-stone-500" size={32} />
                  <p className="mt-3 text-sm font-semibold text-stone-300">Nothing logged yet</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileView;
