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
    <section className="sticky top-0 z-20 border-b border-white/10 bg-[#11100e]/92 backdrop-blur sm:static sm:bg-[#11100e]/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-start justify-between gap-3 lg:items-center">
          <div className="min-w-0">
            <BrandWordmark onClick={onGoHome} />
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-shelf-accent-bright/80 sm:mt-2 sm:text-sm sm:tracking-[0.14em]">
              <Library size={15} />
              Track your media without the noise
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#181715] text-stone-200 transition hover:border-shelf-accent/50 hover:text-shelf-accent-soft sm:hidden"
              onClick={() => (activeView === "home" ? onShowLibrary() : onGoHome())}
              type="button"
              aria-label={activeView === "home" ? "Open library" : "Go home"}
              title={activeView === "home" ? "Library" : "Home"}
            >
              {activeView === "home" ? <Library size={18} /> : <Home size={18} />}
            </button>

            <div className="hidden h-10 grid-cols-2 rounded-md border border-white/10 bg-[#181715] p-0.5 sm:grid sm:w-56">
              <button
                className={`inline-flex h-full items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "home" ? "bg-[#d7cec0] text-[#141210]" : "text-stone-300 hover:bg-white/5"
                }`}
                onClick={onGoHome}
                type="button"
              >
                <Home size={15} />
                Home
              </button>
              <button
                className={`inline-flex h-full items-center justify-center gap-2 rounded text-sm font-semibold transition ${
                  activeView === "library" ? "bg-[#d7cec0] text-[#141210]" : "text-stone-300 hover:bg-white/5"
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#181715] text-stone-200 transition hover:border-shelf-accent/50 hover:text-shelf-accent-soft md:hidden"
                  onClick={onSignOut}
                  type="button"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={17} />
                </button>
                <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-[#181715] p-1 md:flex">
                  <div className="flex min-w-0 items-center gap-2 px-2">
                    <UserRound className="shrink-0 text-shelf-accent-bright/80" size={16} />
                    <span className="max-w-36 truncate text-xs font-semibold text-stone-200">{accountLabel}</span>
                  </div>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
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
                    ? "border-shelf-accent-bright/45 bg-shelf-accent-deep text-white shadow-lift"
                    : "border-white/10 bg-[#181715] text-stone-200 hover:border-white/20"
                }`}
                onClick={() => onShowCategory(entry.id)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-semibold">{entry.label}</span>
                  <span className={`mt-1 block text-xs ${isActive ? "text-shelf-accent-soft" : "text-stone-400"}`}>
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
