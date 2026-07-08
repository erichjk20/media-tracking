import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  Clock3,
  Library,
  Save,
  Star,
  UserRound,
} from "lucide-react";
import { statusLabels } from "../lib/mediaConfig";
import MediaCover from "./MediaCover";

function formatAverageRating(value) {
  return value ? value.toFixed(1) : "0.0";
}

function ProfileMetric({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#181715] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#eee9df]">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-shelf-accent-deep/15 text-shelf-accent-soft ring-1 ring-shelf-accent/20">
          <Icon size={19} />
        </span>
      </div>
      {detail && <p className="mt-2 text-sm text-stone-400">{detail}</p>}
    </article>
  );
}

function ProfileView({
  metrics,
  onOpenItem,
  onSaveDisplayName,
  onShowCategory,
  profile,
  user,
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const accountLabel = user?.email || "Local library";
  const shownName = profile?.display_name || "Your profile";

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
  }, [profile?.display_name]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanedName = displayName.trim();
    if (!cleanedName) {
      setSaveStatus("error");
      setSaveMessage("Add a display name first.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      await onSaveDisplayName(cleanedName);
      setSaveStatus("saved");
      setSaveMessage("Saved.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error.message || "Could not save your profile.");
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.35fr)_minmax(0,1fr)]">
        <aside className="rounded-lg border border-white/10 bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-shelf-accent-deep text-white">
              <UserRound size={23} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[#eee9df]">{shownName}</h2>
              <p className="mt-1 truncate text-sm text-stone-400">{accountLabel}</p>
            </div>
          </div>

          <form className="mt-5" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-stone-500" htmlFor="profile-display-name">
              Display name
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="profile-display-name"
                className="input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Name your shelf"
              />
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-shelf-accent-deep px-4 text-sm font-semibold text-white transition hover:bg-shelf-accent focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35 disabled:cursor-wait disabled:bg-shelf-accent-deep/60"
                disabled={saveStatus === "saving"}
                type="submit"
              >
                <Save size={16} />
                {saveStatus === "saving" ? "Saving" : "Save"}
              </button>
            </div>
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveStatus === "error" ? "text-red-300" : "text-shelf-accent-soft"}`}>
                {saveMessage}
              </p>
            )}
          </form>
        </aside>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileMetric
              icon={Library}
              label="Library"
              value={metrics.totalCount}
              detail={`${metrics.completedCount} completed, ${metrics.plannedCount} planned`}
            />
            <ProfileMetric
              icon={BookOpenCheck}
              label="Completed"
              value={metrics.completedCount}
              detail={metrics.totalCount ? `${Math.round((metrics.completedCount / metrics.totalCount) * 100)}% of library` : "No completed titles yet"}
            />
            <ProfileMetric
              icon={Clock3}
              label="Planned"
              value={metrics.plannedCount}
              detail="Want to Watch/Read"
            />
            <ProfileMetric
              icon={Star}
              label="Avg rating"
              value={formatAverageRating(metrics.averageRating)}
              detail={`${metrics.ratedCount} rated completed ${metrics.ratedCount === 1 ? "item" : "items"}`}
            />
          </div>

          <div className="mt-5 grid gap-5">
            <section className="border-y border-white/10 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#eee9df]">Media totals</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                {metrics.categoryBreakdown.map((entry) => (
                  <button
                    key={entry.id}
                    className="group min-w-0 text-left focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                    onClick={() => onShowCategory(entry.id)}
                    type="button"
                    aria-label={`Open ${entry.label}`}
                  >
                    <span className="block border-l border-white/10 pl-3 transition group-hover:border-shelf-accent/60">
                      <p className="mt-3 truncate text-sm font-semibold text-stone-100">{entry.label}</p>
                      <span className="mt-1 flex min-w-0 items-end gap-3">
                        <span className="text-5xl font-semibold leading-none text-[#eee9df] transition group-hover:text-shelf-accent-soft">{entry.total}</span>
                        <span className="pb-1 text-xs font-semibold leading-4 text-stone-500">
                          <span className="block whitespace-nowrap text-shelf-accent-soft">{entry.completed} {statusLabels.Completed}</span>
                          <span className="block whitespace-nowrap">{entry.planned} {statusLabels["Want to Watch/Read"]}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#181715] p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-[#eee9df]">Recently added</h3>
              {metrics.recentItems.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {metrics.recentItems.map((item) => (
                    <button
                      key={item.id}
                      className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-md border border-white/10 bg-[#12110f] p-2 text-left transition hover:border-shelf-accent/40 focus:outline-none focus:ring-4 focus:ring-shelf-accent-deep/35"
                      onClick={() => onOpenItem(item)}
                      type="button"
                    >
                      <MediaCover
                        className="flex h-16 w-11 items-end rounded p-1 text-[10px] font-semibold text-white"
                        imageClassName="h-16 w-11 rounded object-cover"
                        src={item.imageUrl}
                        title={item.title}
                      />
                      <div className="min-w-0 self-center">
                        <p className="truncate text-sm font-semibold text-stone-100">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-stone-500">{item.creator || "Unknown creator"}</p>
                      </div>
                      <span className="self-center rounded bg-white/5 px-2 py-1 text-[11px] font-semibold text-stone-400">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-white/10 px-4 text-center">
                  <Library className="text-stone-500" size={32} />
                  <p className="mt-3 text-sm font-semibold text-stone-300">Nothing logged yet</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileView;
