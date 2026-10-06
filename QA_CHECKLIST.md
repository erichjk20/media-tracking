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

## Local Checks

Run these before committing or deploying:

```bash
npm run lint
npm run build
```
