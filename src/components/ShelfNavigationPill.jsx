import { getNavigationLayout } from "../lib/navigationPreferences";

function ShelfNavigationPill({ orderedCategories, activeCategory, activeView, onShowCategory, preview = false }) {
  const layout = getNavigationLayout(orderedCategories.map((entry) => entry.id));
  const byId = Object.fromEntries(orderedCategories.map((entry) => [entry.id, entry]));

  function renderShelf(id) {
    const entry = byId[id];
    const Icon = entry.icon;
    const isActive = activeView === "library" && id === activeCategory;
    const className = `flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-semibold leading-none transition motion-reduce:transition-none ${
      isActive ? "bg-shelf-accent-bright/15 text-shelf-accent-soft ring-1 ring-inset ring-shelf-accent-bright/20" : "text-stone-300 hover:bg-white/5 hover:text-stone-100"
    }`;
    const content = <><Icon size={19} strokeWidth={isActive ? 2.4 : 2.1} /><span className="max-w-full truncate">{id === "tv" ? "TV" : entry.label}</span></>;

    return preview
      ? <span key={id} className={className}>{content}</span>
      : <button key={id} className={`${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft`} onClick={() => onShowCategory(id)} type="button" aria-label={entry.label} aria-current={isActive ? "page" : undefined} title={entry.label}>{content}</button>;
  }

  return (
    <div
      className="mx-auto grid h-16 w-[calc(100%-1rem)] items-center gap-1 overflow-visible rounded-full border border-white/[0.08] bg-[#14120f]/[0.9] px-1.5 py-1 shadow-[0_12px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl"
      style={{ maxWidth: layout.maxWidth, gridTemplateColumns: layout.gridTemplateColumns }}
    >
      {layout.shelves.map(renderShelf)}
    </div>
  );
}

export default ShelfNavigationPill;
