# Number Sense Lab｜数感训练场

> A lightweight, open-source math fluency trainer for building number sense through short, focused practice.

## v0.1 status

Runnable local-first H5 / PC client with Core Learning Engine:

- 75 Core Recall relations from `content/v0.1/*.core.json` (Squares 16 · Products 32 · Fraction→Decimal 27)
- Daily practice interleaves squares, products, and fraction-to-decimal. Focused practice stays in one domain.
- A4 preview shows prompts or answers, never both. Printing uses A4 pages; a long list continues on the next page.
- Judging, mastery, wrong-item reappear, and progress stay local to this browser. v0.2A records when each practiced relation is due again, and upgrades an existing local record in place.
- Practice plays a short cue when sound is on. Home has a sound switch, saved on this device. Screen changes are brief, and reduced-motion settings turn them off.
- Every screen uses the same quiet paper layout: hairline rows, a deep teal primary button, and no answer preview on the home page.
- Fractions the student sees use a horizontal bar, as in a textbook. Stored prompts stay `1/2`, and answers are still decimals.
- No backend, no login, no cloud sync

## How to run

```bash
npm test          # unit tests (node --test)
npm start         # http://localhost:4173/
```

Open the URL on phone or desktop. Progress stays in this browser’s local storage.

## Architecture

```text
Core Learning Engine   (src/core)     — no platform APIs
        ↓
Platform Adapter       (src/adapter)  — localStorage for H5/PC
        ↓
Client Shell           (h5/)          — responsive UI + keypad/keyboard
```

Content source of truth: `content/v0.1/*.core.json`.  
After editing JSON, run `npm run sync-content`.

## Contracts

Upstream Product / UX / UI / Learning / Architecture docs under `docs/` are frozen for this build and were not modified.
