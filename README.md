# Number Sense Lab｜数感训练场

> A lightweight, open-source math fluency trainer for building number sense through short, focused practice.

## v0.1 status

Runnable local-first H5 / PC client with Core Learning Engine:

- 75 Core Recall relations from `content/v0.1/*.core.json` (Squares 16 · Products 32 · Fraction→Decimal 27)
- Daily + focused practice, judging, mastery, wrong-item reappear, progress, A4 preview/print
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
