import { Edit3, Trash2 } from "lucide-react";
import {
  getBookTileMeta,
  getMovieTileMeta,
  getTvTileMeta,
} from "../lib/mediaUtils";
import Rating from "./Rating";

export function MediaItemCard({ item, onDelete, onEdit }) {
  const movieTileMeta = getMovieTileMeta(item);
  const tvTileMeta = getTvTileMeta(item);
  const bookTileMeta = getBookTileMeta(item);

  return (
    <article className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:block">
      <div className="h-28 w-[76px] overflow-hidden bg-stone-200 dark:bg-stone-800 sm:aspect-[4/5] sm:h-auto sm:w-full">
        {item.imageUrl ? (
          <img className="h-full w-full object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
        ) : (
          <div className="cover-fallback flex h-full w-full items-end p-2 text-xs font-semibold text-white sm:p-4 sm:text-lg">
            {item.title}
          </div>
        )}
      </div>
      <div className="min-w-0 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 break-words text-base font-semibold leading-5 text-stone-950 dark:text-stone-100">{item.title}</h3>
            {movieTileMeta && <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{movieTileMeta}</p>}
            {tvTileMeta && <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{tvTileMeta}</p>}
            {bookTileMeta && <p className="mt-1 truncate text-sm font-medium text-stone-500 dark:text-stone-400">{bookTileMeta}</p>}
            {item.category !== "movies" && item.category !== "tv" && <p className="mt-1 truncate text-sm text-stone-600 dark:text-stone-400">{item.creator || "Unknown creator"}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex gap-1">
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
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

export function MediaPosterCard({ item, onDelete, onEdit }) {
  const movieTileMeta = getMovieTileMeta(item);
  const tvTileMeta = getTvTileMeta(item);
  const bookTileMeta = getBookTileMeta(item);
  const compactTileMeta = movieTileMeta || tvTileMeta || bookTileMeta;

  return (
    <article className="grid min-w-0 grid-rows-[auto_minmax(132px,auto)]">
      <button
        className="group block w-full overflow-hidden rounded-md border border-stone-300 bg-white text-left shadow-sm transition hover:border-teal-600 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-500"
        onClick={() => onEdit(item)}
        type="button"
      >
        <div className="aspect-[2/3] overflow-hidden bg-stone-200 dark:bg-stone-800">
          {item.imageUrl ? (
            <img
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              src={item.imageUrl}
              alt={`${item.title} cover`}
            />
          ) : (
            <div className="cover-fallback flex h-full w-full items-end p-2 text-xs font-semibold text-white">
              {item.title}
            </div>
          )}
        </div>
      </button>

      <div className="mt-2 flex min-w-0 flex-col">
        <h3 className="line-clamp-2 break-words text-xs font-semibold leading-4 text-stone-950 dark:text-stone-100 sm:text-sm">{item.title}</h3>
        <p className="mt-1 h-4 truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">{compactTileMeta}</p>
        <div className="mt-2 h-5">{item.status === "Completed" && <Rating value={item.rating} readOnly compact />}</div>
        <div className="mt-auto grid grid-cols-[1fr_32px] gap-2 pt-3">
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-stone-300 text-xs font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            onClick={() => onEdit(item)}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
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
