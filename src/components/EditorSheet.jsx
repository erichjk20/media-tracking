import { Plus, Save, X } from "lucide-react";
import {
  bookSubtypeOptions,
  categories,
  movieSubtypeOptions,
  statuses,
  tvSubtypeOptions,
} from "../lib/mediaConfig";
import DetailsLookup from "./DetailsLookup";
import Rating from "./Rating";

function EditorSheet({
  activeStatus,
  bookLanguage,
  canUseBookLookup,
  canUseMangaLookup,
  canUseOmdb,
  canUseTmdb,
  category,
  draft,
  editingId,
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
  onTmdbLanguageChange,
  onUpdateDraft,
  setActiveCategory,
  setActiveStatus,
  tmdbLanguage,
}) {
  const canLookupDetails = canUseBookLookup || canUseMangaLookup || canUseOmdb || canUseTmdb;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-stone-950/45 dark:bg-black/70 sm:items-center sm:justify-center">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-stone-300 bg-white p-4 shadow-lift dark:border-stone-700 dark:bg-stone-900 sm:max-w-xl sm:rounded-xl sm:p-5">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900 sm:-mx-5 sm:-mt-5 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-100">{editingId ? "Edit item" : "Add item"}</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{category.label} / {activeStatus}</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            onClick={onClose}
            type="button"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {canLookupDetails && (
            <DetailsLookup
              bookLanguage={bookLanguage}
              categoryLabel={category.label}
              canUseBookLookup={canUseBookLookup}
              canUseTmdb={canUseTmdb}
              lookupProviders={lookupProviders}
              message={lookupMessage}
              onApply={onApplyLookupResult}
              onBookLanguageChange={onBookLanguageChange}
              onQueryChange={onLookupQueryChange}
              onSearch={onSearchDetails}
              onTmdbLanguageChange={onTmdbLanguageChange}
              query={lookupQuery}
              results={lookupResults}
              status={lookupStatus}
              tmdbLanguage={tmdbLanguage}
            />
          )}

          <Field label="Title">
            <input
              className="input"
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

          <div className="grid grid-cols-2 gap-3">
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

            <Field label="Shelf">
              <select
                className="input"
                value={draft.status}
                onChange={(event) => {
                  onUpdateDraft("status", event.target.value);
                  setActiveStatus(event.target.value);
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
                      {option.value === "anime-movie"
                        ? "Anime movie"
                        : option.value === "korean-movie"
                          ? "Korean movie"
                          : "Movie"}
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
                      {option.value === "korean-book" ? "Korean book" : "Book"}
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
                      {option.value === "anime" ? "Anime" : option.value === "kdrama" ? "Korean" : "TV show"}
                    </option>
                  ))}
              </select>
            </Field>
          )}

          {draft.status === "Completed" && (
            <Field label="Rating">
              <Rating value={Number(draft.rating)} onChange={(rating) => onUpdateDraft("rating", rating)} />
            </Field>
          )}

          <Field label="Image URL">
            <input
              className="input"
              value={draft.imageUrl}
              onChange={(event) => onUpdateDraft("imageUrl", event.target.value)}
              placeholder="https://..."
              type="url"
            />
          </Field>

          <Field label="Personal notes">
            <textarea
              className="input min-h-28 resize-y py-3"
              value={draft.notes}
              onChange={(event) => onUpdateDraft("notes", event.target.value)}
              placeholder="Why it belongs here"
            />
          </Field>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:bg-teal-600 dark:hover:bg-teal-500 dark:focus:ring-teal-950"
            type="submit"
          >
            {editingId ? <Save size={17} /> : <Plus size={17} />}
            {editingId ? "Save changes" : "Add to shelf"}
          </button>
        </form>
      </section>
    </div>
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

export default EditorSheet;
