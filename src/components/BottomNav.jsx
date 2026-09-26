import { UserRound } from "lucide-react";
import { categories } from "../lib/mediaConfig";

function BottomNav({ activeCategory, activeView, onShowCategory, onShowProfile }) {
  const navItems = [
    ...categories,
    { id: "profile", label: "Profile", icon: UserRound },
  ];

  return (
    <nav className="bottom-nav-shell fixed inset-x-0 z-30">
      <div className="mx-auto grid w-[calc(100%-1rem)] max-w-[24rem] grid-cols-5 gap-1 overflow-hidden rounded-full border border-white/[0.08] bg-[#14120f]/[0.9] p-1.5 shadow-[0_12px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl min-[390px]:w-[calc(100%-1.5rem)]">
        {navItems.map((entry) => {
          const Icon = entry.icon;
          const isProfile = entry.id === "profile";
          const isActive = isProfile ? activeView === "profile" : activeView === "library" && entry.id === activeCategory;
          const label = entry.id === "tv" ? "TV" : entry.label;

          return (
            <button
              key={entry.id}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold leading-none transition ${
                isActive ? "bg-shelf-accent-bright/15 text-shelf-accent-soft ring-1 ring-inset ring-shelf-accent-bright/20" : "text-stone-300 hover:bg-white/5 hover:text-stone-100"
              }`}
              onClick={() => (isProfile ? onShowProfile() : onShowCategory(entry.id))}
              type="button"
              aria-label={entry.label}
              title={entry.label}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 2.1} />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
