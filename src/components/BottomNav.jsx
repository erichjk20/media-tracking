import { Pencil, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ShelfNavigationPill from "./ShelfNavigationPill";

function BottomNav({ orderedCategories, activeCategory, activeView, addLabel = "item", onAddManualClick, onAddSearchClick, onShowCategory }) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const hasAddMenu = Boolean(onAddSearchClick && onAddManualClick);

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
    <nav aria-label="Media shelves" className="bottom-nav-shell fixed inset-x-0 z-30">
      <ShelfNavigationPill
        orderedCategories={orderedCategories}
        activeCategory={activeCategory}
        activeView={activeView}
        onShowCategory={onShowCategory}
      >
        <div className="relative flex items-center justify-center" ref={menuRef}>
          <button
            className={`flex h-[3.25rem] w-[3.25rem] -translate-y-2.5 items-center justify-center rounded-full border-[5px] text-white shadow-[0_16px_30px_rgba(0,0,0,0.42)] transition motion-reduce:transition-none motion-reduce:hover:-translate-y-2.5 motion-reduce:active:-translate-y-2.5 motion-reduce:active:scale-100 hover:-translate-y-3 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 active:-translate-y-2 active:scale-95 ${
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
      </ShelfNavigationPill>
    </nav>
  );
}

export default BottomNav;
