import { X } from "lucide-react";

const variantStyles = {
  default: {
    border: "border-stone-300 dark:border-stone-700",
    eyebrow: "text-teal-700 dark:text-teal-400",
    confirm:
      "bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-100 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950",
  },
  danger: {
    border: "border-red-200 dark:border-red-900",
    eyebrow: "text-red-700 dark:text-red-300",
    confirm:
      "bg-red-700 text-white hover:bg-red-800 focus:ring-red-100 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-red-950",
  },
};

function ConfirmDialog({
  cancelLabel = "Cancel",
  children,
  confirmIcon: ConfirmIcon,
  confirmLabel,
  eyebrow,
  onClose,
  onConfirm,
  title,
  titleId,
  variant = "default",
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/50 px-4 py-5 backdrop-blur-sm dark:bg-black/70 sm:items-center sm:justify-center">
      <section
        className={`w-full rounded-xl border bg-white p-4 shadow-lift dark:bg-stone-900 sm:max-w-sm sm:p-5 ${styles.border}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${styles.eyebrow}`}>{eyebrow}</p>
            <h2 id={titleId} className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-stone-950 dark:text-stone-100">
              {title}
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

        {children}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 ${styles.confirm}`}
            onClick={onConfirm}
            type="button"
          >
            {ConfirmIcon && <ConfirmIcon size={17} />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
