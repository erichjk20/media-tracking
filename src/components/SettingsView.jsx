import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, LogOut, Save, SlidersHorizontal } from "lucide-react";
import { categories } from "../lib/mediaConfig";
import CustomizeShelvesSheet from "./CustomizeShelvesSheet";

function SettingsView({ navigationShelves, onBack, onSaveDisplayName, onSaveNavigationShelves, onSignOut, profile, user }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [isCustomizingShelves, setIsCustomizingShelves] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const headingRef = useRef(null);
  const hasDisplayNameChanges = displayName.trim() !== (profile?.display_name || "").trim();
  const isBusy = saveStatus === "saving" || isSigningOut;
  const shelfSummary = `${navigationShelves.length} ${navigationShelves.length === 1 ? "shelf" : "shelves"} shown`;
  const shelfOrder = navigationShelves.map((id) => categories.find((category) => category.id === id)?.label).join(" · ");

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
  }, [profile?.display_name]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isBusy) return;
    const cleanedName = displayName.trim();
    if (!cleanedName) {
      setSaveStatus("error");
      setSaveMessage("Add a display name first.");
      return;
    }
    if (!hasDisplayNameChanges) return;
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      await onSaveDisplayName(cleanedName);
      setSaveStatus("saved");
      setSaveMessage("Display name saved.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error.message || "Could not save your display name. Try again.");
    }
  }

  async function handleSignOut() {
    if (isBusy) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await onSignOut();
    } catch (error) {
      setSignOutError(error.message || "Could not sign out. Try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-7" aria-labelledby="settings-heading">
      <button
        className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-stone-400 transition hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft"
        onClick={onBack}
        type="button"
        aria-label="Back to profile"
      >
        <ArrowLeft size={17} />
        Profile
      </button>
      <h2 ref={headingRef} id="settings-heading" tabIndex={-1} className="text-2xl font-semibold text-[#eee9df] outline-none">Settings</h2>
      <p className="mt-1 text-sm text-stone-400">Library preferences and account details.</p>

      <section className="mt-7" aria-labelledby="library-settings-heading">
        <h3 id="library-settings-heading" className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Library</h3>
        <button
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#181715] p-4 text-left transition hover:border-shelf-accent-bright/30 hover:bg-[#1c1a17] focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-50"
          onClick={() => setIsCustomizingShelves(true)}
          disabled={isBusy}
          type="button"
          aria-label="Customize shelves"
          aria-describedby="navigation-shelves-summary"
          aria-haspopup="dialog"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-shelf-accent-deep/15 text-shelf-accent-soft"><SlidersHorizontal size={20} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-stone-100">Customize shelves</span>
            <span id="navigation-shelves-summary" className="mt-1 block text-xs text-stone-400">{shelfSummary}</span>
            <span className="mt-1 block text-xs leading-relaxed text-stone-500">{shelfOrder}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-stone-500" />
        </button>
      </section>

      <section className="mt-7" aria-labelledby="account-settings-heading">
        <h3 id="account-settings-heading" className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Account</h3>
        <div className="rounded-xl border border-white/10 bg-[#181715] p-4 sm:p-5">
          {user ? (
            <div className="mb-5 border-b border-white/10 pb-4">
              <p className="text-sm font-medium text-stone-300">Email</p>
              <p className="mt-1 break-words text-sm text-stone-400">{user.email}</p>
            </div>
          ) : <p className="mb-4 text-sm text-stone-400">Local library</p>}
          <form onSubmit={handleSubmit} aria-busy={saveStatus === "saving"}>
            <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="settings-display-name">Display name</label>
            <input
              id="settings-display-name"
              className="h-11 w-full rounded-lg border border-white/10 bg-[#12110f] px-3 text-base text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-shelf-accent-bright/50 focus:ring-2 focus:ring-shelf-accent-deep/35 disabled:opacity-50"
              value={displayName}
              disabled={isBusy}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setSaveStatus("idle");
                setSaveMessage("");
              }}
              placeholder="Name your shelf"
              autoComplete="nickname"
              aria-invalid={saveStatus === "error"}
              aria-describedby={saveMessage ? "display-name-save-message" : undefined}
            />
            {saveMessage && <p id="display-name-save-message" className={`mt-3 text-sm ${saveStatus === "error" ? "text-red-300" : "text-shelf-accent-soft"}`} role={saveStatus === "error" ? "alert" : "status"}>{saveMessage}</p>}
            {(hasDisplayNameChanges || saveStatus === "saving") && (
              <div className="mt-3 flex justify-end">
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-shelf-accent-deep px-4 text-sm font-semibold text-white hover:bg-shelf-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-50" disabled={isBusy} type="submit" aria-label="Save display name">
                  <Save size={16} />
                  {saveStatus === "saving" ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      {user && (
        <div className="mt-7 border-t border-white/10 pt-4">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-stone-400 transition hover:bg-red-950/20 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-shelf-accent-soft disabled:opacity-50" disabled={isBusy} onClick={handleSignOut} type="button">
            <LogOut size={17} />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
          {signOutError && <p className="mt-2 text-sm text-red-300" role="alert">{signOutError}</p>}
        </div>
      )}

      {isCustomizingShelves && <CustomizeShelvesSheet shelves={navigationShelves} onSave={onSaveNavigationShelves} onClose={() => setIsCustomizingShelves(false)} />}
    </section>
  );
}

export default SettingsView;
