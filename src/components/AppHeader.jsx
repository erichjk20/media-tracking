import { Home, Library, LogOut, UserRound } from "lucide-react";
import { categories } from "../lib/mediaConfig";
import BrandWordmark from "./BrandWordmark";

function AppHeader({
  activeCategory,
  activeView,
  counts,
  profile,
  user,
  onGoHome,
  onShowCategory,
  onShowLibrary,
  onSignOut,
}) {
  const accountLabel = profile?.display_name || user?.email || "Account";

  return (
    <section className="sticky top-0 z-20 border-b border-stone-300/80 bg-[#fafbf8]/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:static sm:bg-[#fafbf8] sm:dark:bg-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-start justify-between gap-3 lg:items-center">
          <div className="min-w-0">
            <BrandWordmark onClick={onGoHome} />
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-800/80 dark:text-teal-400 sm:mt-2 sm:text-sm sm:tracking-[0.14em]">
              <Library size={15} />
              Track your media without the noise
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition hover:border-teal-700 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-teal-500 dark:hover:text-teal-300 sm:hidden"
              onClick={() => (activeView === "home" ? onShowLibrary() : onGoHome())}
              type="button"
              aria-label={activeView === "home" ? "Open library" : "Go home"}
              title={activeView === "home" ? "Library" : "Home"}
            >
              {activeView === "home" ? <Library size={18} /> : <Home size={18} />}
            </button>

            <div className="hidden grid-cols-2 rounded-md border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900 sm:grid sm:w-56">
              <button
                className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "home" ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
                onClick={onGoHome}
                type="button"
              >
                <Home size={15} />
                Home
              </button>
              <button
                className={`inline-flex h-9 items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "library" ? "bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
                onClick={onShowLibrary}
                type="button"
              >
                <Library size={15} />
                Library
              </button>
            </div>

            {user && (
              <>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 transition hover:border-teal-700 hover:text-teal-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-teal-500 dark:hover:text-teal-300 md:hidden"
                  onClick={onSignOut}
                  type="button"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={17} />
                </button>
                <div className="hidden items-center gap-2 rounded-md border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-900 md:flex">
                  <div className="flex min-w-0 items-center gap-2 px-2">
                    <UserRound className="shrink-0 text-teal-700 dark:text-teal-400" size={16} />
                    <span className="max-w-36 truncate text-xs font-semibold text-stone-700 dark:text-stone-200">{accountLabel}</span>
                  </div>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                    onClick={onSignOut}
                    type="button"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`hidden grid-cols-4 gap-2 lg:grid ${activeView === "home" ? "lg:hidden" : ""}`}>
          {categories.map((entry) => {
            const Icon = entry.icon;
            const isActive = entry.id === activeCategory;
            return (
              <button
                key={entry.id}
                className={`flex min-h-16 items-center justify-between rounded-md border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-teal-700 bg-teal-700 text-white shadow-lift dark:border-teal-500 dark:bg-teal-600"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-500"
                }`}
                onClick={() => onShowCategory(entry.id)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-semibold">{entry.label}</span>
                  <span className={`mt-1 block text-xs ${isActive ? "text-teal-50" : "text-stone-500 dark:text-stone-400"}`}>
                    {counts[entry.id]?.Completed || 0} done
                  </span>
                </span>
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AppHeader;
