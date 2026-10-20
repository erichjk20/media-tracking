# QA Checklist

Use this before deploying lookup-heavy changes, especially manga ranking or cover selection.

## Manga Lookup

Run the app locally and search:

```bash
npm run dev
```

Check these titles:

- Vagabond
  - Canonical series appears near the top.
  - Cover stays true to volume 1, not VIZBIG or 3-in-1 when a first-volume cover exists.
- Eyeshield 21
  - Canonical series appears first.
  - Cover is volume 1.
- One Piece
  - Canonical series appears first.
  - Cover is volume 1.
- Berserk
  - Canonical series appears first.
  - Deluxe or omnibus covers do not replace a first-volume cover.
- Monster
  - Canonical series appears first.
  - Perfect Edition or omnibus covers do not replace a first-volume cover.
- Slam Dunk
  - Canonical series appears first.
  - Cover is volume 1 when available.

## Date Tracking

- Shelf cards omit activity dates in both list and grid layouts, for Done and Want items across all four categories. Open details to see the dates.
- Done item details show Watched/Finished near the title, with Logged as smaller secondary text below the content. A missing completion date must never display the logged date instead.
- Add directly to Done: watched/finished date defaults to unknown, with Don't remember selected. Today fills the local date, the date picker supports earlier dates, and Don't remember clears the date.
- Switching Want → Done before saving a new item must also default to unknown.
- Choose Month & year in both the editor and quick completion dialog: save October 2024, reload, and verify item details show October 2024 without a day. Notes/rating edits must preserve month precision.
- Switching an exact date to Month & year keeps its month; switching back to Exact date requires choosing a day. Today sets an exact date; Don't remember clears either precision.
- Current-month entries are valid; future months and invalid months are rejected. Changing to Want clears month-only dates as well as exact dates.
- Add to Want: details show the added date without a completion date.
- Move Want → Done through both quick completion and the edit sheet: completion date defaults to today; original added date is preserved.
- Edit rating, notes, or cover: added and completion dates stay unchanged.
- Move Done → Want: completion date clears. Move back to Done: defaults to today.
- Reload in local mode and signed-in Supabase mode: dates persist.
- Historical Done items without a finished date display Unknown, including after ordinary edits.
- A backdated completion can precede the added date; a future completion is rejected.
- Check narrow mobile screens and time zones on either side of UTC: completion dates keep the chosen calendar day.
- Existing Supabase databases must have the new migration applied before deployment.
- On an older database without `finished_month`, edits with exact or unknown dates must still save. Month-only saves must give a visible error next to Save without discarding the selected month or other edits.

## Local Checks

Run these before committing or deploying:

```bash
npm run lint
npm test
npm run build
```
