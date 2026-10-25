import { Pencil, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

function HeaderAddMenu({ addLabel, onAddSearchClick, onAddManualClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const actions = [
    { label: "Search title", icon: Search, onSelect: onAddSearchClick },
    { label: "Manual entry", icon: Pencil, onSelect: onAddManualClick },
  ];

  useEffect(() => {
    if (!isOpen) return undefined;
    menuRef.current?.querySelector("button")?.focus();

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleTriggerKeyDown(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setIsOpen(true);
  }

  function handleMenuKeyDown(event) {
    if (event.key === "Tab") {
      setIsOpen(false);
      // Return to the trigger before the browser advances to the next header control.
      buttonRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...menuRef.current.querySelectorAll("button")];
    const current = items.indexOf(document.activeElement);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    let next = (current + direction + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
  }

  function runAction(action) {
    setIsOpen(false);
    buttonRef.current?.focus();
    action();
  }

  return (
    <div className="relative justify-self-start" ref={containerRef}>
      <button
        ref={buttonRef}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 bg-[#181715] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition hover:border-white/35 hover:bg-[#24221f] focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        type="button"
        aria-label={`Add ${addLabel}`}
        title={`Add ${addLabel}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label={`Add ${addLabel}`}
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 top-[calc(100%+0.65rem)] z-40 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#181715] p-1.5 text-stone-100 shadow-[0_18px_46px_rgba(0,0,0,0.42)]"
        >
          {actions.map(({ label, icon: Icon, onSelect }) => (
            <button
              key={label}
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-semibold transition hover:bg-white/5 focus:bg-white/5 focus:outline-none"
              onClick={() => runAction(onSelect)}
              type="button"
              role="menuitem"
              tabIndex={-1}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeaderAddMenu;
