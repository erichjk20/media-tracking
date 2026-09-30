import { Pencil, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categories } from "../lib/mediaConfig";

function BottomNav({ activeCategory, activeView, addLabel = "item", onAddManualClick, onAddSearchClick, onShowCategory }) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const hasAddMenu = Boolean(onAddSearchClick && onAddManualClick);
  const navItemsById = Object.fromEntries(categories.map((category) => [category.id, category]));
  const navItems = [
    navItemsById.books,
    navItemsById.manga,
    { id: "add", label: "Add", isAdd: true },
    navItemsById.movies,
    navItemsById.tv,
  ];

  useEffect(() => {
    if (!isAddMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setIsAddMenuOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsAddMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddMenuOpen]);

  function runAddAction(action) {
    setIsAddMenuOpen(false);
    action();
  }

  return (
    <nav className="bottom-nav-shell fixed inset-x-0 z-30">
      <div className="mx-auto grid h-16 w-[calc(100%-1rem)] max-w-[24rem] grid-cols-5 gap-1 overflow-visible rounded-full border border-white/[0.08] bg-[#14120f]/[0.9] px-1.5 py-1 shadow-[0_12px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl min-[390px]:w-[calc(100%-1.5rem)]">
        {navItems.map((entry) => {
          if (entry.isAdd) {
            return (
              <div key={entry.id} className="relative flex items-center justify-center" ref={menuRef}>
                <button
                  className={`flex h-[3.25rem] w-[3.25rem] -translate-y-2.5 items-center justify-center rounded-full border-[5px] text-white shadow-[0_16px_30px_rgba(0,0,0,0.42)] transition hover:-translate-y-3 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 active:-translate-y-2 active:scale-95 ${
                    hasAddMenu
                      ? "border-[#0d0c0b] bg-shelf-accent ring-1 ring-white/10 hover:bg-shelf-accent-bright"
                      : "cursor-not-allowed border-[#0d0c0b] bg-stone-700 text-stone-400 ring-1 ring-white/10"
                  }`}
                  onClick={() => hasAddMenu && setIsAddMenuOpen((current) => !current)}
                  type="button"
                  disabled={!hasAddMenu}
                  aria-expanded={hasAddMenu ? isAddMenuOpen : undefined}
                  aria-haspopup={hasAddMenu ? "menu" : undefined}
                  aria-label={`Add ${addLabel}`}
                  title={`Add ${addLabel}`}
                >
                  <Plus size={24} strokeWidth={2.6} />
                </button>

                {isAddMenuOpen && (
                  <div
                    className="absolute bottom-[calc(100%+0.7rem)] left-1/2 z-40 w-48 -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-[#181715] p-1.5 text-stone-100 shadow-[0_18px_46px_rgba(0,0,0,0.42)]"
                    role="menu"
                  >
                    <button
                      className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-semibold text-stone-100 transition hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                      onClick={() => runAddAction(onAddSearchClick)}
                      type="button"
                      role="menuitem"
                    >
                      <Search size={16} />
                      Search title
                    </button>
                    <button
                      className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-semibold text-stone-100 transition hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                      onClick={() => runAddAction(onAddManualClick)}
                      type="button"
                      role="menuitem"
                    >
                      <Pencil size={16} />
                      Manual entry
                    </button>
                  </div>
                )}
              </div>
            );
          }

          const Icon = entry.icon;
          const isActive = activeView === "library" && entry.id === activeCategory;
          const label = entry.id === "tv" ? "TV" : entry.label;

          return (
            <button
              key={entry.id}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold leading-none transition ${
                isActive ? "bg-shelf-accent-bright/15 text-shelf-accent-soft ring-1 ring-inset ring-shelf-accent-bright/20" : "text-stone-300 hover:bg-white/5 hover:text-stone-100"
              }`}
              onClick={() => onShowCategory(entry.id)}
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
