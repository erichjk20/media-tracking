import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock3,
  Edit3,
  Hash,
  Layers3,
  Library,
  NotebookText,
  PencilLine,
  RefreshCw,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { categories, statusLabels } from "../lib/mediaConfig";
import {
  getMovieTileMeta,
  getSubtypeLabel,
  getTvTileMeta,
} from "../lib/mediaUtils";
import Rating from "./Rating";

function formatDuration(value) {
  const minutes = Number(value);
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function formatCount(value, singular, plural = `${singular}s`) {
  const count = Number(value);
  if (!count) return "";
  return `${count} ${count === 1 ? singular : plural}`;
}

function getPrimaryCreator(item) {
  if (item.category === "books") return item.author || item.creator || "";
  if (item.category === "movies") return item.director || item.creator || "";
  if (item.category === "tv") return item.creator || item.studio || "";
  if (item.category === "manga") return item.author || item.creator || item.artist || "";
  return item.creator || "";
}

function getCreatorLabel(item) {
  if (item.category === "books") return "Author";
  if (item.category === "movies") return "Director";
  if (item.category === "tv") return "Creator";
  if (item.category === "manga") return "Author";
  return "Creator";
}

function getHeaderMeta(item) {
  if (item.category === "movies") return getMovieTileMeta(item);
  if (item.category === "tv") return getTvTileMeta(item);
  if (item.category === "books" && item.pageCount) return `${item.pageCount} pages`;
  if (item.category === "manga") {
    return [
      formatCount(item.volumeCount, "volume"),
      formatCount(item.chapterCount, "chapter"),
    ].filter(Boolean).join(" • ");
  }
  return "";
}

function getDetailRows(item) {
  const rows = [
    { label: getCreatorLabel(item), value: getPrimaryCreator(item), icon: UserRound },
  ];

  if (item.category === "books") {
    rows.push(
      { label: "Pages", value: item.pageCount ? `${item.pageCount}` : "", icon: BookOpen },
      { label: "Publisher", value: item.publisher, icon: Library },
      { label: "ISBN", value: item.isbn, icon: Hash },
    );
  }

  if (item.category === "movies") {
    rows.push(
      { label: "Year", value: item.releaseYear, icon: Calendar },
      { label: "Runtime", value: formatDuration(item.durationMinutes), icon: Clock3 },
      { label: "Genre", value: item.genre, icon: Tag },
    );
  }

  if (item.category === "tv") {
    rows.push(
      { label: "Year", value: item.releaseYear, icon: Calendar },
      { label: "Seasons", value: formatCount(item.seasonCount, "season"), icon: Layers3 },
      { label: "Episodes", value: formatCount(item.episodeCount, "episode"), icon: Hash },
      { label: "Episode length", value: formatDuration(item.durationMinutesPerEpisode), icon: Clock3 },
      { label: "Studio", value: item.studio, icon: Library },
      { label: "Genre", value: item.genre, icon: Tag },
    );
  }

  if (item.category === "manga") {
    rows.push(
      { label: "Artist", value: item.artist, icon: PencilLine },
      { label: "Volumes", value: formatCount(item.volumeCount, "volume"), icon: Layers3 },
      { label: "Chapters", value: formatCount(item.chapterCount, "chapter"), icon: Hash },
    );
  }

  return rows.filter((row) => row.value);
}

function getSynopsisText(item) {
  return (
    item.synopsis?.trim()
    || getLabeledDetailValue(item.notes, "Synopsis")
    || getLabeledDetailValue(item.notes, "Summary")
    || getLabeledDetailValue(item.notes, "Plot")
    || ""
  );
}

function getLabeledDetailValue(notes, label) {
  const match = String(notes || "").match(new RegExp(`(?:^|\\n)${label}:\\s*([\\s\\S]+?)(?=\\n[A-Z][A-Za-z ]{1,24}:\\s*|$)`, "i"));
  return match?.[1]?.trim() || "";
}

function CoverArt({ item }) {
  return (
    <div className="media-detail-cover relative overflow-hidden rounded bg-stone-200 dark:bg-stone-800">
      {item.imageUrl ? (
        <img className="h-full w-full object-cover" src={item.imageUrl} alt={`${item.title} cover`} />
      ) : (
        <div className="cover-fallback flex h-full w-full items-end p-5 text-2xl font-semibold leading-tight text-white">
          {item.title}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="grid min-w-0 grid-cols-[20px_minmax(0,1fr)] gap-2">
      <Icon className="mt-0.5 text-stone-500 dark:text-stone-500" size={14} />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-stone-500">{label}</p>
        <p className="break-words text-xs font-medium leading-4 text-stone-900 dark:text-stone-100">{value}</p>
      </div>
    </div>
  );
}

function BackCover({ category, CategoryIcon, detailRows, headerMeta, item, notes, subtypeLabel, synopsis }) {
  return (
    <div className="media-detail-back h-full w-full overflow-hidden bg-[#fbfaf7] p-5 text-stone-950 dark:bg-stone-900 dark:text-stone-100 sm:p-6">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-teal-700 px-2 text-[10px] font-semibold text-white dark:bg-teal-600">
            <CategoryIcon size={11} />
            {category?.label || "Media"}
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-stone-200 px-2 text-[10px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
            {statusLabels[item.status] || item.status}
          </span>
          {subtypeLabel && (
            <span className="inline-flex h-6 items-center rounded-full bg-amber-100 px-2 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              {subtypeLabel}
            </span>
          )}
        </div>

        <div className="mt-4">
          <h2 className="line-clamp-2 break-words text-xl font-semibold leading-tight sm:text-2xl">
            {item.title}
          </h2>
          {headerMeta && <p className="mt-1 truncate text-xs font-medium text-stone-600 dark:text-stone-400">{headerMeta}</p>}
          {item.status === "Completed" && (
            <div className="mt-2">
              <Rating value={item.rating} readOnly compact />
            </div>
          )}
        </div>

        {detailRows.length > 0 && (
          <div className="mt-4 grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 border-t border-stone-300/80 pt-3 dark:border-stone-700/80">
            {detailRows.map((row) => (
              <DetailRow key={`${row.label}-${row.value}`} {...row} />
            ))}
          </div>
        )}

        <div className="media-back-scroll mt-4 min-h-0 flex-1 overflow-y-auto border-t border-stone-300/80 pt-3 pr-1 dark:border-stone-700/80">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">Synopsis</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-800 dark:text-stone-200">
            {synopsis || "No synopsis saved yet."}
          </p>

          {notes && (
            <div className="mt-4 border-t border-stone-300/80 pt-3 dark:border-stone-700/80">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-stone-400">
                <NotebookText size={13} />
                Notes
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-stone-700 dark:text-stone-300">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaDetailOverlay({ item, onClose, onDelete, onEdit }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const category = categories.find((entry) => entry.id === item.category);
  const CategoryIcon = category?.icon || Library;
  const subtypeLabel = getSubtypeLabel(item);
  const headerMeta = getHeaderMeta(item);
  const detailRows = getDetailRows(item);
  const synopsis = getSynopsisText(item);
  const notes = item.notes?.trim();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setIsFlipped(false);
  }, [item.id]);

  function handleBackCoverKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    setIsFlipped(false);
  }

  function handleOverlayClick(event) {
    const clickedElement = event.target instanceof Element ? event.target : null;
    if (clickedElement?.closest("[data-media-detail-content]")) return;

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-stone-950/70 px-4 py-5 backdrop-blur-md sm:px-6 sm:py-8"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center">
        <section
          className="media-detail-panel relative w-full max-w-[560px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-detail-title"
        >
          <button
            className="absolute right-0 top-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-lg transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 dark:bg-stone-950/95 dark:text-stone-200 dark:hover:bg-stone-900 dark:focus:ring-teal-950"
            onClick={onClose}
            type="button"
            data-media-detail-content
            aria-label="Close details"
            title="Close details"
          >
            <X size={18} />
          </button>

          <div className="pt-12">
            <div className="media-flip-scene mx-auto aspect-[2/3] w-full max-w-[340px] sm:max-w-[460px]" data-media-detail-content>
              <div className={`media-flip-object h-full w-full ${isFlipped ? "is-flipped" : ""}`}>
                <div className="media-flip-face media-flip-front">
                  <button
                    className="block h-full w-full text-left focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700"
                    onClick={() => setIsFlipped(true)}
                    type="button"
                    aria-label={`Flip ${item.title} to details`}
                  >
                    <CoverArt item={item} />
                  </button>
                </div>
                <div className="media-flip-face media-flip-back">
                  <div
                    className="h-full w-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700"
                    onClick={() => setIsFlipped(false)}
                    onKeyDown={handleBackCoverKeyDown}
                    role="button"
                    tabIndex={isFlipped ? 0 : -1}
                    aria-label={`Flip ${item.title} to cover`}
                  >
                    <BackCover
                      category={category}
                      CategoryIcon={CategoryIcon}
                      detailRows={detailRows}
                      headerMeta={headerMeta}
                      item={item}
                      notes={notes}
                      subtypeLabel={subtypeLabel}
                      synopsis={synopsis}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 max-w-[460px] text-center">
              <h2 id="media-detail-title" className="sr-only">{item.title}</h2>
              <div className="flex flex-wrap justify-center gap-2" data-media-detail-content>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-stone-100 focus:outline-none focus:ring-4 focus:ring-teal-200 dark:bg-stone-100 dark:hover:bg-white"
                  onClick={() => setIsFlipped((current) => !current)}
                  type="button"
                >
                  <RefreshCw size={16} />
                  {isFlipped ? "Front" : "Details"}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-stone-950/70 px-4 text-sm font-semibold text-white shadow-lg ring-1 ring-white/15 transition hover:bg-stone-900 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  onClick={() => onEdit(item)}
                  type="button"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-stone-950/70 px-4 text-sm font-semibold text-red-100 shadow-lg ring-1 ring-red-200/30 transition hover:bg-red-950/80 focus:outline-none focus:ring-4 focus:ring-red-200"
                  onClick={() => onDelete(item.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MediaDetailOverlay;
