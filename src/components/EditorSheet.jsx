import { Check, ImagePlus, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  bookSubtypeOptions,
  categories,
  movieSubtypeOptions,
  statusLabels,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import {
  getItemTileMeta,
  getPrimaryCreator,
  getSubtypeLabel,
} from "../lib/mediaUtils";
import DetailsLookup from "./DetailsLookup";
import MediaCover from "./MediaCover";
import Rating from "./Rating";

function EditorSheet({
  activeStatus,
  appliedLookupSourceLabel,
  bookLanguage,
  canUseBookLookup,
  category,
  draft,
  editingId,
  editorMode = "search",
  lookupMessage,
  lookupProviders,
  lookupQuery,
  lookupResults,
  lookupStatus,
  onApplyLookupResult,
  onBookLanguageChange,
  onClose,
  onLookupQueryChange,
  onSearchDetails,
  onSubmit,
  onUpdateDraft,
  setActiveCategory,
  setActiveStatus,
}) {
  const canLookupDetails = lookupProviders.length > 0;
  const hasSelectedLookup = !editingId && Boolean(appliedLookupSourceLabel);
  const lookupCategoryLabel = draft.category === "tv" && draft.subtype === "anime" ? "Anime" : category.label;
  const lookupPrompt = editingId ? `Search ${lookupCategoryLabel.toLowerCase()} title` : "Find a title to add";
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [isLookupEditorOpen, setIsLookupEditorOpen] = useState(editorMode !== "manual");
  const shouldShowLookup = canLookupDetails && (isLookupEditorOpen || editingId);
  const shouldShowLookupLauncher = canLookupDetails && !editingId && !hasSelectedLookup && !isLookupEditorOpen;
  const primaryActionLabel = editingId ? "Save changes" : "Add to shelf";
  const canSubmit = Boolean(draft.title.trim());

  useEffect(() => {
    if (appliedLookupSourceLabel) setIsLookupEditorOpen(false);
  }, [appliedLookupSourceLabel]);

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-stone-950/45 dark:bg-black/75 sm:items-center sm:justify-center">
      <section className="editor-sheet-frame w-full overflow-y-auto rounded-t-2xl border border-stone-300 bg-white p-4 shadow-lift dark:border-white/10 dark:bg-[#181715] sm:max-w-xl sm:rounded-xl sm:p-5">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#181715] sm:-mx-5 sm:-mt-5 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-[#eee9df]">{editingId ? "Edit item" : "Add item"}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{category.label} / {getShelfLabel(activeStatus)}</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
            onClick={onClose}
            type="button"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {hasSelectedLookup && (
            <SelectedItemSummary
              category={category}
              draft={draft}
              onChangeLookup={() => {
                onLookupQueryChange(draft.title);
                setIsLookupEditorOpen(true);
              }}
              sourceLabel={appliedLookupSourceLabel}
            />
          )}

          {shouldShowLookup && (
            <DetailsLookup
              bookLanguage={bookLanguage}
              categoryLabel={lookupCategoryLabel}
              canUseBookLookup={canUseBookLookup}
              lookupProviders={lookupProviders}
              message={hasSelectedLookup ? "" : lookupMessage}
              onApply={onApplyLookupResult}
              onBookLanguageChange={onBookLanguageChange}
              onQueryChange={onLookupQueryChange}
              prompt={lookupPrompt}
              onSearch={onSearchDetails}
              query={lookupQuery}
              results={lookupResults}
              status={lookupStatus}
              title={hasSelectedLookup ? "Change result" : editingId ? "Find details" : "Find title to add"}
            />
          )}

          {shouldShowLookupLauncher && (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-shelf-accent/20 bg-shelf-accent-deep/10 px-3 text-sm font-semibold text-shelf-accent-soft transition hover:border-shelf-accent-bright/30 hover:bg-shelf-accent-deep hover:text-white focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
              onClick={() => {
                onLookupQueryChange(draft.title);
                setIsLookupEditorOpen(true);
              }}
              type="button"
            >
              <Search size={15} />
              Search title instead
            </button>
          )}

          <ShelfSelector
            activeStatus={draft.status}
            onChange={(status) => {
              onUpdateDraft("status", status);
              setActiveStatus(status);
            }}
          />

          {draft.status === "Completed" && (
            <FieldGroup label="Rating">
              <Rating value={Number(draft.rating)} onChange={(rating) => onUpdateDraft("rating", rating)} />
            </FieldGroup>
          )}

          {hasSelectedLookup ? (
            <>
              <NotesField notes={draft.notes} onUpdateNotes={(value) => onUpdateDraft("notes", value)} />
              <SubmitButton disabled={!canSubmit} editingId={editingId} label={primaryActionLabel} />
              <details className="rounded-lg border border-stone-300 bg-stone-50 p-3 dark:border-white/10 dark:bg-[#12110f]/70">
                <summary className="cursor-pointer text-sm font-semibold text-stone-700 marker:text-stone-500 dark:text-stone-200">
                  Edit details
                </summary>
                <div className="mt-4 space-y-4">
                  <EditableDetailsFields
                    category={category}
                    draft={draft}
                    isImageEditorOpen={isImageEditorOpen}
                    onImageEditorOpenChange={setIsImageEditorOpen}
                    onUpdateDraft={onUpdateDraft}
                    setActiveCategory={setActiveCategory}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              <EditableDetailsFields
                autoFocusTitle={editorMode === "manual" && !isLookupEditorOpen}
                category={category}
                draft={draft}
                isImageEditorOpen={isImageEditorOpen}
                onImageEditorOpenChange={setIsImageEditorOpen}
                onUpdateDraft={onUpdateDraft}
                setActiveCategory={setActiveCategory}
              />
              <NotesField notes={draft.notes} onUpdateNotes={(value) => onUpdateDraft("notes", value)} />
              <SubmitButton disabled={!canSubmit} editingId={editingId} label={primaryActionLabel} />
            </>
          )}
        </form>
      </section>
    </div>
  );
}

function getShelfLabel(status) {
  return statusLabels[status] || status;
}

function SelectedItemSummary({ category, draft, onChangeLookup, sourceLabel }) {
  const creator = getPrimaryCreator(draft) || draft.creator;
  const meta = getItemTileMeta(draft);
  const subtypeLabel = getSubtypeLabel(draft);

  return (
    <section className="border-b border-stone-200 pb-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold text-stone-500 dark:text-stone-400">
          {sourceLabel ? `${sourceLabel} result selected` : "Result selected"}
        </p>
        <button
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-stone-300 px-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
          onClick={onChangeLookup}
          type="button"
        >
          <Search size={13} />
          Change
        </button>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3">
        <MediaCover
          className="flex h-24 w-16 items-end rounded-md p-2 text-[11px] font-semibold text-white"
          fallbackClassName="justify-center text-center"
          imageClassName="h-24 w-16 rounded-md object-cover"
          src={draft.imageUrl}
          title={draft.title || "Cover"}
        />

        <div className="min-w-0 self-center">
          <h3 className="line-clamp-2 break-words text-lg font-semibold leading-6 text-stone-950 dark:text-[#eee9df]">
            {draft.title || "Untitled"}
          </h3>
          {creator && (
            <p className="mt-1 truncate text-sm text-stone-600 dark:text-stone-400" title={creator}>
              {creator}
            </p>
          )}
          {meta && (
            <p className="mt-1 truncate text-xs font-medium text-stone-500 dark:text-stone-400" title={meta}>
              {meta}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-shelf-accent-deep px-2 py-1 text-[11px] font-semibold text-white">
              {category.label}
            </span>
            {subtypeLabel && (
              <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                {subtypeLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShelfSelector({ activeStatus, onChange }) {
  return (
    <FieldGroup label="Shelf">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-stone-300 bg-stone-100 p-1 dark:border-white/10 dark:bg-[#12110f]">
        {statuses.map((status) => {
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              className={`inline-flex h-10 items-center justify-center rounded px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-stone-950 shadow-sm dark:bg-[#24211e] dark:text-[#eee9df]"
                  : "text-stone-600 hover:bg-white/70 dark:text-stone-400 dark:hover:bg-white/5"
              }`}
              onClick={() => onChange(status)}
              type="button"
              aria-pressed={isActive}
            >
              {getShelfLabel(status)}
            </button>
          );
        })}
      </div>
    </FieldGroup>
  );
}

function EditableDetailsFields({
  autoFocusTitle = false,
  category,
  draft,
  isImageEditorOpen,
  onImageEditorOpenChange,
  onUpdateDraft,
  setActiveCategory,
}) {
  return (
    <>
      <Field label="Title">
        <input
          className="input"
          autoFocus={autoFocusTitle}
          value={draft.title}
          onChange={(event) => onUpdateDraft("title", event.target.value)}
          placeholder="The Left Hand of Darkness"
          required
        />
      </Field>

      <Field label={category.creatorLabel}>
        <input
          className="input"
          value={draft.creator}
          onChange={(event) => onUpdateDraft("creator", event.target.value)}
          placeholder="Creator or author"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select
            className="input"
            value={draft.category}
            onChange={(event) => {
              onUpdateDraft("category", event.target.value);
              setActiveCategory(event.target.value);
            }}
          >
            {categories.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {draft.category === "movies" && (
        <Field label="Movie type">
          <select
            className="input"
            value={draft.subtype || "movie"}
            onChange={(event) => onUpdateDraft("subtype", event.target.value)}
          >
            {movieSubtypeOptions
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.formLabel || option.label}
                </option>
              ))}
          </select>
        </Field>
      )}

      {draft.category === "books" && (
        <Field label="Book type">
          <select
            className="input"
            value={draft.subtype || "book"}
            onChange={(event) => onUpdateDraft("subtype", event.target.value)}
          >
            {bookSubtypeOptions
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.formLabel || option.label}
                </option>
              ))}
          </select>
        </Field>
      )}

      {draft.category === "tv" && (
        <Field label="TV type">
          <select
            className="input"
            value={draft.subtype || "tv"}
            onChange={(event) => onUpdateDraft("subtype", event.target.value)}
          >
            {tvSubtypeOptions
              .filter((option) => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.formLabel || option.label}
                </option>
              ))}
          </select>
        </Field>
      )}

      <CoverField
        imageUrl={draft.imageUrl}
        isImageEditorOpen={isImageEditorOpen}
        onImageEditorOpenChange={onImageEditorOpenChange}
        onUpdateImageUrl={(value) => onUpdateDraft("imageUrl", value)}
        title={draft.title}
      />

      <Field label="Synopsis">
        <textarea
          className="input min-h-32 resize-y py-3"
          value={draft.synopsis}
          onChange={(event) => onUpdateDraft("synopsis", event.target.value)}
          placeholder="What is this about?"
        />
      </Field>
    </>
  );
}

function NotesField({ notes, onUpdateNotes }) {
  return (
    <Field label="Personal notes">
      <textarea
        className="input min-h-28 resize-y py-3"
        value={notes}
        onChange={(event) => onUpdateNotes(event.target.value)}
        placeholder="Why it belongs here"
      />
    </Field>
  );
}

function SubmitButton({ disabled, editingId, label }) {
  return (
    <button
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-shelf-accent-deep px-4 text-sm font-semibold text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-not-allowed disabled:bg-stone-500"
      disabled={disabled}
      type="submit"
    >
      {editingId ? <Save size={17} /> : <Plus size={17} />}
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
      {children}
    </label>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
      {children}
    </div>
  );
}

function CoverField({
  imageUrl,
  isImageEditorOpen,
  onImageEditorOpenChange,
  onUpdateImageUrl,
  title,
}) {
  const coverTitle = title || "Cover";

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Cover</span>
      <div className="flex gap-3 rounded-md border border-stone-300 bg-stone-50 p-3 dark:border-white/10 dark:bg-[#12110f]">
        {imageUrl ? (
          <MediaCover
            className="h-32 w-24 shrink-0 rounded-md text-xs"
            fallbackClassName="flex items-center justify-center p-2 text-center font-semibold"
            imageClassName="h-32 w-24 shrink-0 rounded-md object-cover"
            src={imageUrl}
            title={coverTitle}
          />
        ) : (
          <div className="cover-fallback flex h-32 w-24 shrink-0 items-center justify-center rounded-md p-2 text-center text-xs font-semibold">
            {coverTitle}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {imageUrl ? (
            <p className="text-sm font-medium text-stone-800 dark:text-stone-100">Cover added</p>
          ) : (
            <p className="text-sm font-medium text-stone-800 dark:text-stone-100">No cover yet</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 transition hover:bg-white dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5"
              onClick={() => onImageEditorOpenChange(true)}
              type="button"
            >
              {imageUrl ? <Pencil size={15} /> : <ImagePlus size={15} />}
              {imageUrl ? "Change" : "Add cover"}
            </button>
            {imageUrl && (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 transition hover:bg-white dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5"
                onClick={() => {
                  onUpdateImageUrl("");
                  onImageEditorOpenChange(false);
                }}
                type="button"
              >
                <Trash2 size={15} />
                Remove
              </button>
            )}
          </div>

          {isImageEditorOpen && (
            <div className="mt-3 flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Cover image URL</span>
                <input
                  className="input"
                  value={imageUrl}
                  onChange={(event) => onUpdateImageUrl(event.target.value)}
                  placeholder="Paste image URL"
                  type="url"
                />
              </label>
              <button
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-shelf-accent-deep text-white transition hover:bg-shelf-accent"
                onClick={() => onImageEditorOpenChange(false)}
                type="button"
                aria-label="Done editing cover"
                title="Done editing cover"
              >
                <Check size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorSheet;
