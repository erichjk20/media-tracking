import { Home, Library, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  onShowProfile,
  onSignOut,
}) {
  const [menuState, setMenuState] = useState("closed");
  const isMenuVisible = menuState !== "closed";
  const accountLabel = profile?.display_name || user?.email || "Local library";

  function openMenu() {
    setMenuState("open");
  }

  function closeMenu() {
    setMenuState((current) => (current === "closed" ? "closed" : "closing"));
  }

  function navigate(action) {
    action();
    closeMenu();
  }

  useEffect(() => {
    if (!isMenuVisible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") closeMenu();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuVisible]);

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
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#181715] text-stone-200 transition hover:border-shelf-accent/50 hover:text-shelf-accent-soft"
              onClick={openMenu}
              type="button"
              aria-label="Open menu"
              title="Menu"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {isMenuVisible && (
          <div className="fixed inset-0 z-[70]">
            <button
              className={`app-menu-backdrop absolute inset-0 bg-black/75 backdrop-blur-[2px] ${menuState === "closing" ? "is-closing" : ""}`}
              onClick={closeMenu}
              type="button"
              aria-label="Close menu"
            />
            <aside
              className={`app-menu-panel absolute right-0 top-0 flex h-dvh w-[min(86vw,22rem)] flex-col overflow-y-auto border-l border-shelf-accent/25 bg-[#0f0e0d] p-4 shadow-[-24px_0_70px_rgba(0,0,0,0.52)] ${menuState === "closing" ? "is-closing" : ""}`}
              onAnimationEnd={() => {
                if (menuState === "closing") setMenuState("closed");
              }}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-shelf-accent-bright/80">Menu</p>
                  <div className="mt-3 flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/25">
                      <UserRound size={18} />
                    </span>
                    <span className="truncate text-sm font-semibold text-stone-100">{accountLabel}</span>
                  </div>
                </div>
                <button
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-shelf-accent/30 bg-[#151412] text-shelf-accent-soft transition hover:border-shelf-accent/60 hover:bg-shelf-accent-deep/15"
                  onClick={closeMenu}
                  type="button"
                  aria-label="Close menu"
                  title="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-6 grid gap-2">
                <button
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    activeView === "home" ? "bg-[#d7cec0] text-[#141210]" : "bg-[#151412] text-stone-200 hover:bg-white/5"
                  }`}
                  onClick={() => navigate(onGoHome)}
                  type="button"
                >
                  <Home size={17} />
                  Home
                </button>
                <button
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    activeView === "library" ? "bg-[#d7cec0] text-[#141210]" : "bg-[#151412] text-stone-200 hover:bg-white/5"
                  }`}
                  onClick={() => navigate(onShowLibrary)}
                  type="button"
                >
                  <Library size={17} />
                  Library
                </button>
                <button
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    activeView === "profile" ? "bg-[#d7cec0] text-[#141210]" : "bg-[#151412] text-stone-200 hover:bg-white/5"
                  }`}
                  onClick={() => navigate(onShowProfile)}
                  type="button"
                >
                  <UserRound size={17} />
                  Profile
                </button>
              </nav>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Categories</p>
                <div className="mt-3 grid gap-2">
                  {categories.map((entry) => {
                    const Icon = entry.icon;
                    const isActive = activeView === "library" && entry.id === activeCategory;
                    return (
                      <button
                        key={entry.id}
                        className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 text-left transition ${
                          isActive
                            ? "border-shelf-accent-bright/45 bg-shelf-accent-deep text-white"
                            : "border-white/10 bg-[#151412] text-stone-200 hover:border-white/20 hover:bg-white/5"
                        }`}
                        onClick={() => navigate(() => onShowCategory(entry.id))}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon size={17} />
                          <span className="truncate text-sm font-semibold">{entry.label}</span>
                        </span>
                        <span className={`shrink-0 text-xs font-semibold ${isActive ? "text-shelf-accent-soft" : "text-stone-500"}`}>
                          {counts[entry.id]?.Completed || 0} done
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {user && (
                <button
                  className="mt-auto inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#151412] px-4 text-sm font-semibold text-stone-200 transition hover:border-red-400/40 hover:bg-red-950/25 hover:text-red-200"
                  onClick={() => navigate(onSignOut)}
                  type="button"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

export default AppHeader;
