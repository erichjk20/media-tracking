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

## History

- Open Profile → History below media totals. Back to profile focuses the History entry; History starts at the top with a focused heading. Profile remains highlighted in the global header; the bottom menu still contains shelves only.
- A year shows the completion total and monthly groups, newest first. All four media types, including hidden shelves, appear. Want items never appear.
- Year choices include the current year and populated historical years. Month selection restricts the timeline and total; media filters further narrow it. Filter counts describe the selected period across media types.
- Exact and month-only dates both group into their recorded month, with no fabricated day or time-zone shift. Dates reflect completion, not when an item was logged or moved shelves.
- Date unknown expands separately across all years, respects the media filter, and does not contribute to dated totals. Invalid/legacy missing dates never fall back to logged timestamps.
- Open a title and edit its date: the timeline, available years, counts, and unknown group update. Moving it back to Want or deleting it removes it from History.
- Recent reloads restore History and year/month/media filters. Cold opens still start on Home. Test empty libraries, unknown-only libraries, empty periods, and media filters with no matches.
- Check 320px/375px phones and desktop: no horizontal overflow, long titles use up to two lines, creators stay on one truncated line, fallback covers fit, controls remain reachable, and the bottom menu does not obscure the last item.
- The completion summary is a compact line stating the total and selected year/month, rather than a large card with a repeated year label. Check that the tighter top spacing brings the first card above the floating navigation at typical phone sizes.
- Check History controls at 320px–1280px and 200% text size: dropdown text has reserved arrow space, chevrons sit inside the border with a visible inset, buttons retain at least 44px height, and selectors wrap when needed. Verify the native select menu and Date unknown disclosure still work.

## Profile and Settings

- Profile shows a compact name/avatar header with a Settings gear; library stats appear directly below. Display-name inputs, email, shelf customization, and Sign out live in Settings.
- Open Settings from the gear, return with Back to profile or the global Profile action, and verify the gear receives focus on return. Settings starts at the top with a focused heading.
- Settings groups Library and Account, shows the selected shelf count/order, and opens the existing customization sheet. Save updates the summary; Cancel/Escape keeps it unchanged and returns focus to the row.
- Edit and save the display name, then return to Profile and reload. Failures keep unsaved edits and show an error beside Save; blank names are rejected. Existing shelf preferences remain intact.
- Signed-in accounts show a read-only email and Sign out below the account section. Sign-out failures are visible and retryable. Local demo mode omits email and Sign out.
- Recent reloads restore Settings; cold opens still start on Home. Check 320px/375px phone layouts and desktop for wrapping, safe-area spacing, keyboard focus, and unobstructed bottom navigation.

## Shelf Customization

- Profile → Settings → Library → Customize shelves starts with Books, Manga, Movies, TV. Drag using touch/mouse and use Move up/down buttons; preview reflects the chosen left-to-right order. Only dragging the handles should suppress ordinary touch scrolling.
- Hide shelves down to one. The final shelf stays selected with an explanation. Re-enable a hidden shelf and verify it appends; Reset changes only the preview until Save.
- Cancel, Close, and Escape discard changes. Save applies both Home and bottom navigation. Failed saves keep the draft and current menu, with a visible error beside Save.
- Check 320px/375px phone and desktop layouts with one to four shelves: tabs have equal widths and the shelf-only pill shrinks with fewer selections. The preview matches the actual menu. Targets stay usable, with no horizontal overflow. Check iOS safe areas and reduced motion.
- On Library, the neutral + is top-left, the wordmark is centered, and Profile is top-right; both icon buttons have 44px targets. The header has no divider or separate background tint, blends with the page gradient, and retains blur/mobile sticky behavior. Check readability when content scrolls beneath it. The tagline is hidden on phones. Search title / Manual entry use the current category, including hidden shelves. Check menu keyboard arrows, Escape/focus return, Tab, and outside dismissal. Profile and Settings keep the centered wordmark with no contextual Add action.
- Keyboard focus starts inside the sheet, cycles with Tab/Shift+Tab, and returns to Customize shelves on dismissal. Reordering is announced by screen readers and move controls remain usable at list boundaries.
- Hidden shelves still appear in Profile totals/recent items and the editor's category selector. Open a hidden shelf, reload, and verify it stays open without an active bottom tab. Contextual Add still works. Entering Home selects the first visible shelf and clears old-category lookup results.
- Reload local demo mode and signed-in mode: selected shelves and order persist. Sign-in and display-name changes preserve customization. Another signed-in device loads the same order on sign-in/reload. Changing accounts must not display another account's preferences, including when a save was in flight.
- Apply `supabase/migrations/20261020020000_add_navigation_shelves.sql` before cloud customization. Without it, browsing uses the default order and customization saves explain the required migration without dropping the draft.

## Local Checks

Run these before committing or deploying:

```bash
npm run lint
npm test
npm run build
```
