import { Plus } from "lucide-react";

function FloatingAddButton({ categoryLabel, onClick }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-20 px-4">
      <div className="mx-auto flex max-w-md justify-end">
        <button
          className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-shelf-accent-deep text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 active:scale-95"
          onClick={onClick}
          type="button"
          aria-label={`Add ${categoryLabel}`}
          title={`Add ${categoryLabel}`}
        >
          <Plus size={26} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export default FloatingAddButton;
