import { Library, UserRound } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import HeaderAddMenu from "./HeaderAddMenu";

function AppHeader({
  activeView,
  addLabel = "item",
  onAddManualClick,
  onAddSearchClick,
  onHomeClick,
  onShowProfile,
}) {
  const isProfileActive = activeView === "profile" || activeView === "settings";
  const hasAddMenu = Boolean(onAddSearchClick && onAddManualClick);

  return (
    <section className="app-header sticky top-0 z-20 bg-transparent backdrop-blur sm:static">
      <div className="mx-auto w-full max-w-7xl px-4 pb-3 pt-2 sm:px-6 sm:py-4 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="h-11 w-11 justify-self-start">
            {hasAddMenu && (
              <HeaderAddMenu
                key={addLabel}
                addLabel={addLabel}
                onAddManualClick={onAddManualClick}
                onAddSearchClick={onAddSearchClick}
              />
            )}
          </div>

          <div className="min-w-0 justify-self-center">
            <BrandWordmark onClick={onHomeClick} />
          </div>

          <button
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-lg border shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
              isProfileActive
                ? "border-shelf-accent-bright/30 bg-shelf-accent-bright/15 text-shelf-accent-soft"
                : "border-white/10 bg-[#181715] text-stone-200 hover:border-shelf-accent-bright/30 hover:bg-shelf-accent-deep hover:text-white"
            }`}
            onClick={onShowProfile}
            type="button"
            aria-label="Profile"
            title="Profile"
          >
            <UserRound size={20} strokeWidth={isProfileActive ? 2.4 : 2.1} />
          </button>
        </div>
        <div className="mt-2 hidden items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-shelf-accent-bright/80 sm:flex">
          <Library size={15} />
          Track your media without the noise
        </div>
      </div>
    </section>
  );
}

export default AppHeader;
