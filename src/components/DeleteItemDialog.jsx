import { Trash2, X } from "lucide-react";

function DeleteItemDialog({ item, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 px-4 py-5 backdrop-blur-sm dark:bg-black/70 sm:items-center sm:justify-center">
      <section
        className="w-full rounded-xl border border-red-200 bg-white p-4 shadow-lift dark:border-red-900 dark:bg-stone-900 sm:max-w-sm sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-item-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700 dark:text-red-300">Delete item</p>
            <h2 id="delete-item-title" className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-stone-950 dark:text-stone-100">
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

        <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
          This will remove the item from your library.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-100 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-950"
            onClick={onConfirm}
            type="button"
          >
            <Trash2 size={17} />
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteItemDialog;
