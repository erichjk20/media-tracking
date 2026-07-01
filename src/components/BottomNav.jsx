import { Plus } from "lucide-react";
import { categories } from "../lib/mediaConfig";

function BottomNav({ activeCategory, onAddItem, onShowCategory }) {
  const centerIndex = Math.ceil(categories.length / 2);
  const navItems = [
    ...categories.slice(0, centerIndex),
    { id: "add", isAddAction: true },
    ...categories.slice(centerIndex),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 px-4 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-xl border border-stone-300/80 bg-white/80 p-1 shadow-[0_18px_55px_rgba(31,41,55,0.22)] backdrop-blur-xl dark:border-stone-700/80 dark:bg-stone-950/80 dark:shadow-[0_18px_55px_rgba(0,0,0,0.5)]">
        {navItems.map((entry) => {
          if (entry.isAddAction) {
            return (
              <div key={entry.id} className="flex min-h-12 items-center justify-center">
                <button
                  className="inline-flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full border-4 border-white bg-teal-700 text-white shadow-lift transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:border-stone-950 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950"
                  onClick={onAddItem}
                  type="button"
                  aria-label="Add item"
                  title="Add item"
                >
                  <Plus size={24} />
                </button>
              </div>
            );
          }

          const Icon = entry.icon;
          const isActive = entry.id === activeCategory;
          return (
            <button
              key={entry.id}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold transition ${
                isActive ? "bg-teal-700 text-white shadow-sm dark:bg-teal-600" : "text-stone-600 hover:bg-white/70 dark:text-stone-300 dark:hover:bg-stone-800/80"
              }`}
              onClick={() => onShowCategory(entry.id)}
              type="button"
            >
              <Icon size={18} />
              <span className="max-w-full truncate">{entry.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
