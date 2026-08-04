import { Library, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandWordmark from "./BrandWordmark";

function AppHeader({ addLabel = "item", onAddManualClick, onAddSearchClick, onHomeClick }) {
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

          {hasAddMenu && (
            <div className="relative mt-1 shrink-0" ref={menuRef}>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#181715] text-shelf-accent-soft shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition hover:border-shelf-accent-bright/30 hover:bg-shelf-accent-deep hover:text-white focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 active:scale-95 sm:h-11 sm:w-11"
                onClick={() => setIsAddMenuOpen((current) => !current)}
                type="button"
                aria-expanded={isAddMenuOpen}
                aria-haspopup="menu"
                aria-label={`Add ${addLabel}`}
                title={`Add ${addLabel}`}
              >
                <Plus size={21} strokeWidth={2.4} />
              </button>

              {isAddMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#181715] p-1.5 text-stone-100 shadow-[0_18px_46px_rgba(0,0,0,0.34)]"
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
          )}
        </div>
      </div>
    </section>
  );
}

export default AppHeader;
