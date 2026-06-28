import { Check, X } from "lucide-react";
import Rating from "./Rating";

function CompleteItemDialog({
  item,
  onClose,
  onConfirm,
  onRatingChange,
  rating,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 px-4 py-5 backdrop-blur-sm dark:bg-black/70 sm:items-center sm:justify-center">
      <section
        className="w-full rounded-xl border border-stone-300 bg-white p-4 shadow-lift dark:border-stone-700 dark:bg-stone-900 sm:max-w-sm sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-item-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-400">Move to completed</p>
            <h2 id="complete-item-title" className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-stone-950 dark:text-stone-100">
              {item.title}
            </h2>
          </div>
          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
            aria-label="Close"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Your rating</p>
          <Rating value={rating} onChange={onRatingChange} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950"
            onClick={onConfirm}
            type="button"
          >
            <Check size={17} />
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

export default CompleteItemDialog;
