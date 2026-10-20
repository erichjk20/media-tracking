import { ArrowDown, ArrowUp, Check, GripVertical, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categories } from "../lib/mediaConfig";
import { defaultNavigationShelves, moveNavigationShelf, normalizeNavigationShelves, toggleNavigationShelf } from "../lib/navigationPreferences";
import ShelfNavigationPill from "./ShelfNavigationPill";

const controlClass = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-30 disabled:hover:bg-transparent";

function CustomizeShelvesSheet({ shelves, onSave, onClose }) {
  const [selected, setSelected] = useState(() => normalizeNavigationShelves(shelves));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const dragRef = useRef(null);
  const savingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const byId = Object.fromEntries(categories.map((entry) => [entry.id, entry]));
  const orderedCategories = selected.map((id) => byId[id]);
  const hidden = defaultNavigationShelves.filter((id) => !selected.includes(id));

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (!savingRef.current) onCloseRef.current();
      }
      if (event.key !== "Tab") return;
      const controls = [...sheetRef.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]')];
      if (!controls.length) {
        event.preventDefault();
        sheetRef.current.focus();
        return;
      }
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !sheetRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sheetRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  function toggleShelf(id) {
    if (isSaving) return;
    if (selected.length === 1 && selected.includes(id)) {
      setAnnouncement("Keep at least one shelf selected.");
      return;
    }
    const next = toggleNavigationShelf(selected, id);
    setSelected(next);
    setError("");
    setAnnouncement(`${byId[id].label} ${next.includes(id) ? "shown" : "hidden"}.`);
    requestAnimationFrame(() => sheetRef.current?.querySelector(`[data-shelf-toggle="${id}"]`)?.focus());
  }

  function moveShelf(id, destination, direction) {
    setSelected((current) => moveNavigationShelf(current, id, destination));
    setError("");
    setAnnouncement(`${byId[id].label} moved to position ${destination + 1} of ${selected.length}.`);
    if (direction) requestAnimationFrame(() => {
      const row = sheetRef.current?.querySelector(`[data-selected-shelf="${id}"]`);
      const preferred = row?.querySelector(`[data-move="${direction}"]:not(:disabled)`);
      (preferred || row?.querySelector("button:not(:disabled)"))?.focus();
    });
  }

  function startDrag(event, id) {
    if (isSaving || selected.length === 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    // Capture on the stable sheet: React moves row DOM nodes during reordering,
    // which would release capture if the handle itself owned it.
    sheetRef.current.setPointerCapture(event.pointerId);
    dragRef.current = { id, pointerId: event.pointerId, startY: event.clientY };
  }

  function dragMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || Math.abs(event.clientY - drag.startY) < 6) return;
    setDraggedId(drag.id);
    const rows = [...sheetRef.current.querySelectorAll("[data-selected-shelf]")];
    const destination = rows.filter((row) => {
      if (row.dataset.selectedShelf === drag.id) return false;
      const rect = row.getBoundingClientRect();
      return event.clientY > rect.top + rect.height / 2;
    }).length;
    if (selected.indexOf(drag.id) !== destination) moveShelf(drag.id, destination);
  }

  function endDrag() {
    dragRef.current = null;
    setDraggedId(null);
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setError("");
    try {
      await onSave(selected);
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not save your shelves. Try again.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-5">
      <section ref={sheetRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="customize-shelves-title" aria-describedby="customize-shelves-description" aria-busy={isSaving} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} className="editor-sheet-frame w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#181715] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-stone-100 shadow-lift sm:max-w-lg sm:rounded-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="customize-shelves-title" className="text-lg font-semibold">Customize shelves</h2>
            <p id="customize-shelves-description" className="mt-1 text-sm text-stone-400">Choose your shortcuts for Home and the bottom menu. Hidden shelves stay in your library.</p>
          </div>
          <button ref={closeRef} className={controlClass} onClick={onClose} disabled={isSaving} type="button" aria-label="Close customization"><X size={20} /></button>
        </div>

        <div className="mt-5 rounded-xl border border-white/5 bg-[#100f0d] px-1 py-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-stone-500">Menu preview</p>
          <div aria-hidden="true"><ShelfNavigationPill orderedCategories={orderedCategories} activeCategory={selected[0]} activeView="library" preview /></div>
          <p className="sr-only">Menu order: {selected.length === 1 ? `${byId[selected[0]].label}, Add` : [...selected.slice(0, Math.ceil(selected.length / 2)).map((id) => byId[id].label), "Add", ...selected.slice(Math.ceil(selected.length / 2)).map((id) => byId[id].label)].join(", ")}</p>
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold">Shown shelves</h3>
        <p id="shelf-reorder-help" className="mb-3 text-xs text-stone-400">Drag the handles or use the arrows to reorder. Keep at least one shelf selected.</p>
        <ol className="space-y-2" aria-label="Selected shelves">
          {orderedCategories.map((entry, index) => {
            const Icon = entry.icon;
            return (
              <li key={entry.id} data-selected-shelf={entry.id} className={`flex items-center gap-1 rounded-lg border p-1 ${draggedId === entry.id ? "border-shelf-accent-bright bg-shelf-accent-deep/20" : "border-white/10 bg-[#12110f]"}`}>
                <span aria-hidden="true" className={`inline-flex h-11 w-7 shrink-0 touch-none items-center justify-center text-stone-500 ${isSaving ? "" : "cursor-grab active:cursor-grabbing"}`} onPointerDown={(event) => startDrag(event, entry.id)}><GripVertical size={19} /></span>
                <Icon size={18} className="shrink-0 text-stone-400" />
                <span className="min-w-0 flex-1 truncate pl-1 text-sm font-semibold">{entry.label}</span>
                <button className={controlClass} type="button" data-move="up" disabled={isSaving || index === 0} aria-label={`Move ${entry.label} up`} aria-describedby="shelf-reorder-help" onClick={() => moveShelf(entry.id, index - 1, "up")}><ArrowUp size={17} /></button>
                <button className={controlClass} type="button" data-move="down" disabled={isSaving || index === selected.length - 1} aria-label={`Move ${entry.label} down`} aria-describedby="shelf-reorder-help" onClick={() => moveShelf(entry.id, index + 1, "down")}><ArrowDown size={17} /></button>
                <button className={`${controlClass} text-shelf-accent-soft aria-disabled:opacity-40`} type="button" data-shelf-toggle={entry.id} disabled={isSaving} aria-pressed="true" aria-disabled={selected.length === 1} aria-label={`Show ${entry.label}`} aria-describedby={selected.length === 1 ? "shelf-reorder-help" : undefined} onClick={() => toggleShelf(entry.id)}><Check size={19} /></button>
              </li>
            );
          })}
        </ol>

        {hidden.length > 0 && <>
          <h3 className="mb-2 mt-5 text-sm font-semibold text-stone-400">Hidden shelves</h3>
          <ul className="space-y-1" aria-label="Hidden shelves">
            {hidden.map((id) => {
              const entry = byId[id];
              const Icon = entry.icon;
              return <li key={id} className="flex items-center gap-3 rounded-lg px-3 py-1 text-stone-400"><Icon size={18} /><span className="flex-1 text-sm">{entry.label}</span><button data-shelf-toggle={id} className={controlClass} type="button" disabled={isSaving} aria-label={`Show ${entry.label}`} aria-pressed="false" onClick={() => toggleShelf(id)}><Plus size={19} /></button></li>;
            })}
          </ul>
        </>}

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
        <div className="mt-5 border-t border-white/10 pt-4">
          <button className="min-h-11 rounded px-2 text-sm text-stone-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-40" type="button" disabled={isSaving} onClick={() => { setSelected([...defaultNavigationShelves]); setError(""); setAnnouncement("Default shelves restored in preview. Save to apply."); }}>Reset to default</button>
          {error && <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="h-11 rounded-lg border border-white/10 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-40" type="button" disabled={isSaving} onClick={onClose}>Cancel</button>
            <button className="h-11 rounded-lg bg-shelf-accent-deep text-sm font-semibold text-white hover:bg-shelf-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-40" type="button" disabled={isSaving} onClick={save}>{isSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CustomizeShelvesSheet;
