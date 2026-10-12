# First-release Reference Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bounded complete fact collections available as opt-in reference practice without changing the 173 historical mastery relations.

**Architecture:** Generate missing deterministic reference facts during content sync, expose a union catalog by domain, and add a separate reference-session flow that reuses answer judging but never calls mastery, mistake, or scheduler writes. Shared Taro pages serve H5 and WeChat.

**Tech Stack:** Node.js ESM, node:test, Taro React, JSON content manifests, H5 and WeChat builds.

**Spec:** `docs/curriculum/12_first_release_content_completion_contract.md`

## Global Constraints

- Preserve all historical IDs and semantic keys.
- Reference practice never enters daily practice, mastery, Mistake Book, or scheduler state.
- Do not modify legacy `h5/app.js` as a second product implementation.
- Do not redesign visual style, deploy, merge, or submit a Mini Program.

## Review Focus

- Core and reference duplicates must collapse by semantic key while preserving the historical core ID.
- Percentage answers must be exact decimal strings with a visible `%` suffix and no floating comparison.
- Repeating decimals must round-trip exactly through the existing repeating representation.
- Refreshing a reference session must not turn it into a mastery-focused session.
- Existing learner relations must be byte-for-byte unchanged after a complete reference session.

---

### Task 1: Pin the complete finite content contract

**Files:**
- Modify: `test/content-collections.test.js`
- Modify: `scripts/sync-content.mjs`
- Modify: `src/core/content.js`

**Interfaces:**
- Consumes: `semanticKeyOf`, `collectionOf`, `loadFactCatalog`.
- Produces: `completeDomainCatalog(domain)` returning the semantic-key-deduplicated union.

- [ ] **Step 1: Write failing tests** for 43 finite fractions in four directions, 16 repeating fractions in two directions, and 50 half plus 50 double facts. Assert historical core IDs win every overlap.
- [ ] **Step 2: Run** `node --test test/content-collections.test.js` and confirm the new assertions fail because the generated references and union API are absent.
- [ ] **Step 3: Generate only missing reference facts** in `scripts/sync-content.mjs`; use integer arithmetic and canonical strings, then add `completeDomainCatalog(domain)` in `src/core/content.js`.
- [ ] **Step 4: Run** `npm run sync-content && node --test test/content-collections.test.js`; expect exact semantic coverage, no duplicate ID, and no duplicate semantic key.
- [ ] **Step 5: Confirm** `git diff -- src/core/catalog-data.js` is empty and generated changes are limited to reference data.

### Task 2: Add exact percentage answer presentation

**Files:**
- Modify: `src/core/content.js`
- Modify: `src/core/answer.js`
- Modify: `app/components/AnswerBox.jsx`
- Modify: `app/pages/train/index.jsx`
- Test: `test/answer.test.js`
- Test: `test/xp-pages.test.js`

**Interfaces:**
- Consumes: canonical percent numeric string and `answer_type: "percent_number"`.
- Produces: exact numeric judging and a student-visible non-editable `%` suffix.

- [ ] **Step 1: Write failing tests** proving `12.5` is correct for `1/8 = ?%`, `12.50` normalizes correctly, `%` typed into the answer is invalid, and no binary floating comparison is used.
- [ ] **Step 2: Run** `node --test test/answer.test.js test/xp-pages.test.js`; expect failures for the unknown answer type and missing suffix.
- [ ] **Step 3: Implement** `percent_number` by reusing canonical finite-decimal normalization; render `%` outside the editable answer and include it in the accessible name.
- [ ] **Step 4: Rerun** the two tests and verify empty or sign-only input still records no attempt.

### Task 3: Build a non-mastery reference session

**Files:**
- Create: `src/core/reference-session.js`
- Modify: `app/pages/train/flow.js`
- Modify: `app/pages/train/intent.js`
- Test: `test/reference-session.test.js`
- Test: `test/train-flow.test.js`

**Interfaces:**
- Consumes: `completeDomainCatalog(domain)`, day, seed, domain, size.
- Produces: `startReferenceSession`, `peekReferenceItem`, `submitReferenceAnswer`, `finishReferenceSession`.

- [ ] **Step 1: Write failing tests** for deterministic 10-item queues, ordinary answer judging, wrong reappearance after two answered items, pause/resume, and a full session leaving `relations`, `skills`, schedules, and mistake predicates unchanged.
- [ ] **Step 2: Run** `node --test test/reference-session.test.js test/train-flow.test.js`; expect module/API failures.
- [ ] **Step 3: Implement** the isolated session module. It may keep `outcomes` and transient reappearance data in `activeSession`, but it must not call `applyAttempt`, `scheduleAfterAttempt`, or write a relation.
- [ ] **Step 4: Add** `intent=start-reference&domain=<domain>` to the shared training flow and preserve that intent across refresh/resume.
- [ ] **Step 5: Rerun** both tests; inspect one serialized learner before and after reference completion and assert only the transient/summary session fields allowed by the spec changed.

### Task 4: Expose the opt-in entry in the shared UI

**Files:**
- Modify: `app/pages/explore/index.jsx`
- Modify: `app/pages/models.js`
- Modify: `app/app.css`
- Test: `test/xp-pages.test.js`
- Test: `test/practice-groups.test.js`

**Interfaces:**
- Consumes: complete-domain count and the existing focus-confirm model.
- Produces: a weak secondary action labelled `完整关系练习` and a clear reference-session summary.

- [ ] **Step 1: Write failing source/DOM tests** proving the existing core CTA remains primary, the reference CTA appears only when a complete domain catalog exists, and its accessible label includes the domain and complete count.
- [ ] **Step 2: Run** the two tests and confirm they fail before UI wiring.
- [ ] **Step 3: Implement** the secondary action with existing tokens. Do not introduce new colors, mascots, navigation tabs, or mastery wording.
- [ ] **Step 4: Rerun** the two tests and confirm the ordinary focused route is unchanged.

### Task 5: Full verification and evidence

**Files:**
- Modify only if a failing test identifies an in-scope defect.

- [ ] **Step 1: Run** `npm test`.
- [ ] **Step 2: Run** `npm run check:atlas` and `npm run sync-content`; confirm core catalog has no diff.
- [ ] **Step 3: Run** `npm run build:h5`, `npm run build:weapp`, and `npm run check:weapp-package`.
- [ ] **Step 4: Smoke at 375px**: open a complete products session, a percentage item, a repeating-decimal reverse item, and a double item; verify submit, wrong feedback, pause/resume, refresh, console errors, and static 404s.
- [ ] **Step 5: Report** exact branch/SHA, changed files, generated counts, commands, pass/fail/skip/unverified items, screenshots for failures, and confirm no deploy/merge occurred.
