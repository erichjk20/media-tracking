import { UserRound } from "lucide-react";
import { categories } from "../lib/mediaConfig";

function BottomNav({ activeCategory, activeView, onShowCategory, onShowProfile }) {
  const navItems = [
    ...categories,
    { id: "profile", label: "Profile", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 px-4">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-xl border border-stone-300/80 bg-white/80 p-1 shadow-[0_18px_55px_rgba(31,41,55,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[#11100e]/90 dark:shadow-[0_18px_55px_rgba(0,0,0,0.5)]">
        {navItems.map((entry) => {
          const Icon = entry.icon;
          const isProfile = entry.id === "profile";
          const isActive = isProfile ? activeView === "profile" : activeView === "library" && entry.id === activeCategory;
          const label = entry.id === "tv" ? "TV" : entry.label;

          return (
            <button
              key={entry.id}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition ${
                isActive ? "bg-shelf-accent-deep text-white shadow-sm" : "text-stone-600 hover:bg-white/70 dark:text-stone-300 dark:hover:bg-white/5"
              }`}
              onClick={() => (isProfile ? onShowProfile() : onShowCategory(entry.id))}
              type="button"
              aria-label={entry.label}
              title={entry.label}
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
