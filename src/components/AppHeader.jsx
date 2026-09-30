import { Library, UserRound } from "lucide-react";
import BrandWordmark from "./BrandWordmark";

function AppHeader({ activeView, onHomeClick, onShowProfile }) {
  const isProfileActive = activeView === "profile";

  return (
    <section className="app-header sticky top-0 z-20 border-b border-white/10 bg-[#11100e]/[0.92] backdrop-blur sm:static sm:bg-[#11100e]/90">
      <div className="mx-auto w-full max-w-7xl px-4 pb-3 pt-2 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <BrandWordmark onClick={onHomeClick} />
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-shelf-accent-bright/80 sm:mt-2 sm:text-sm sm:tracking-[0.14em]">
              <Library size={15} />
              Track your media without the noise
            </div>
          </div>

          <button
            className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 active:scale-95 sm:h-11 sm:w-11 ${
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
      </div>
    </section>
  );
}

export default AppHeader;
