import ShelfNavigationPill from "./ShelfNavigationPill";

function BottomNav({ orderedCategories, activeCategory, activeView, onShowCategory }) {
  return (
    <nav aria-label="Media shelves" className="bottom-nav-shell fixed inset-x-0 z-30">
      <ShelfNavigationPill
        orderedCategories={orderedCategories}
        activeCategory={activeCategory}
        activeView={activeView}
        onShowCategory={onShowCategory}
      />
    </nav>
  );
}

export default BottomNav;
