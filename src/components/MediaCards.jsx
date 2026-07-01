import { Check, Edit3, Trash2 } from "lucide-react";
import {
  getCardCreatorLabel,
  getItemTileMeta,
} from "../lib/mediaUtils";
import MediaCover from "./MediaCover";
import Rating from "./Rating";

export function MediaItemCard({ item, onComplete, onDelete, onEdit, onOpen }) {
  const creatorLabel = getCardCreatorLabel(item);
  const factLabel = getItemTileMeta(item);
  const canComplete = item.status === "Want to Watch/Read";

  return (
    <article className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm transition hover:border-teal-600 hover:shadow-lift dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500 sm:block">
      <button
        className="block h-28 w-[76px] overflow-hidden bg-stone-200 text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-teal-100 dark:bg-stone-800 dark:focus:ring-teal-950 sm:aspect-[4/5] sm:h-auto sm:w-full"
        onClick={() => onOpen(item)}
        type="button"
        aria-label={`Open ${item.title}`}
      >
        <MediaCover
          className="flex h-full w-full items-end p-2 text-xs font-semibold text-white sm:p-4 sm:text-lg"
          imageClassName="h-full w-full object-cover"
          src={item.imageUrl}
          title={item.title}
        />
      </button>
      <div className="min-w-0 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <button
            className="min-w-0 text-left focus:outline-none focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-950"
            onClick={() => onOpen(item)}
            type="button"
          >
            <h3 className="line-clamp-2 break-words text-base font-semibold leading-5 text-stone-950 dark:text-stone-100">{item.title}</h3>
            {creatorLabel && <p className="mt-1 truncate text-sm text-stone-600 dark:text-stone-400" title={creatorLabel}>{creatorLabel}</p>}
            <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400" title={factLabel}>{factLabel}</p>
          </button>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex gap-1">
              {canComplete && (
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-teal-200 text-teal-700 transition hover:bg-teal-50 dark:border-teal-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
                  onClick={() => onComplete(item)}
                  type="button"
                  aria-label={`Mark ${item.title} completed`}
                  title={`Mark ${item.title} completed`}
                >
                  <Check size={14} />
                </button>
              )}
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                onClick={() => onEdit(item)}
                type="button"
                aria-label={`Edit ${item.title}`}
                title={`Edit ${item.title}`}
              >
                <Edit3 size={14} />
              </button>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-300 text-red-700 transition hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:border-red-700 dark:hover:bg-red-950/50"
                onClick={() => onDelete(item.id)}
                type="button"
                aria-label={`Delete ${item.title}`}
                title={`Delete ${item.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {item.status === "Completed" && <Rating value={item.rating} readOnly compact />}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MediaPosterCard({ item, onComplete, onDelete, onEdit, onOpen }) {
  const creatorLabel = getCardCreatorLabel(item);
  const factLabel = getItemTileMeta(item);
  const canComplete = item.status === "Want to Watch/Read";

  return (
    <article className="grid min-w-0 grid-rows-[auto_minmax(132px,auto)]">
      <button
        className="group block w-full overflow-hidden rounded-md border border-stone-300 bg-white text-left shadow-sm transition hover:border-teal-600 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500"
        onClick={() => onOpen(item)}
        type="button"
        aria-label={`Open ${item.title}`}
      >
        <div className="aspect-[2/3] overflow-hidden bg-stone-200 dark:bg-stone-800">
          <MediaCover
            className="flex h-full w-full items-end p-2 text-xs font-semibold text-white"
            imageClassName="h-full w-full object-cover transition group-hover:scale-[1.02]"
            src={item.imageUrl}
            title={item.title}
          />
        </div>
      </button>

      <div className="mt-2 flex min-w-0 flex-col">
        <h3 className="truncate text-xs font-semibold leading-4 text-stone-950 dark:text-stone-100 sm:text-sm" title={item.title}>{item.title}</h3>
        {creatorLabel && <p className="mt-1 h-4 truncate text-[11px] text-stone-600 dark:text-stone-400" title={creatorLabel}>{creatorLabel}</p>}
        <p className={`${creatorLabel ? "" : "mt-1"} h-4 truncate text-[11px] font-medium text-stone-500 dark:text-stone-400`} title={factLabel}>{factLabel}</p>
        <div className="mt-2 h-5">{item.status === "Completed" && <Rating value={item.rating} readOnly compact />}</div>
        <div className={`mt-auto grid gap-2 pt-3 ${canComplete ? "grid-cols-[1fr_32px_32px]" : "grid-cols-[1fr_32px]"}`}>
          {canComplete ? (
            <>
              <button
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-teal-200 text-xs font-medium text-teal-700 transition hover:bg-teal-50 dark:border-teal-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
                onClick={() => onComplete(item)}
                type="button"
              >
                <Check size={13} />
                Done
              </button>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stone-300 text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                onClick={() => onEdit(item)}
                type="button"
                aria-label={`Edit ${item.title}`}
                title={`Edit ${item.title}`}
              >
                <Edit3 size={14} />
              </button>
            </>
          ) : (
            <button
              className="inline-flex h-8 items-center justify-center rounded-md border border-stone-300 text-xs font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              onClick={() => onEdit(item)}
              type="button"
            >
              Edit
            </button>
          )}
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-300 text-red-700 transition hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:border-red-700 dark:hover:bg-red-950/50"
            onClick={() => onDelete(item.id)}
            type="button"
            aria-label={`Delete ${item.title}`}
            title={`Delete ${item.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
