# Number Sense Lab Launch Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first release candidate with a complete knowledge atlas, a usable Grade 7 rational-number practice loop, a quieter scientific visual experience, layered licensing, and evidence-based four-platform release gates.

**Architecture:** Preserve the existing platform-neutral learning core and split future learning assets into Fact Memory, Calculation Skills, and Knowledge Atlas. Execute four independently reviewable workstreams, then integrate them in one release-candidate branch without allowing content, visual, license, or platform work to silently redesign another contract.

**Tech Stack:** JavaScript ES modules, Node test runner, React 18, Taro 4.3.0, JSON content packages, H5, WeChat/Douyin/Alipay Mini Programs.

**Spec:** `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`

## Global Constraints

- Preserve all existing 173 relation IDs, canonical answers, learner attempts, schedules, and mastery states.
- Fact Memory uses `relation_id`; generated Calculation Skills use `skill_id` plus deterministic `exercise_id`; Knowledge Atlas nodes never enter mastery merely by being viewed.
- Platform APIs remain outside `src/core/`, `src/adapter/`, and shared `app/` components.
- H5, WeChat, Douyin, and Alipay use one shared page/component set and separate adapters.
- No account, cloud sync, AI Tutor, teacher console, CMS, analytics service, or backend in this release.
- License migration is isolated from feature implementation and does not rewrite historical MIT commits.
- Brand, visual, curriculum, teaching copy, and atlas assets remain outside the MPL code grant.
- A platform is not called supported until its corresponding build, tool, device, submission, and public statuses are evidenced separately.
- Owner alone authorizes merge and release.

## Review Focus

- A v3 learner with attempts against any of the 173 existing IDs must migrate without losing or reclassifying evidence; pinned in the knowledge/Grade 7 plan migration tests.
- A generated fraction whose result is negative, zero, reducible, or has a negative denominator must normalize exactly and never use floating point; pinned in rational arithmetic tests.
- Pressing “看原理” during correct feedback must cancel auto-advance exactly once and must not record a second attempt; pinned in the visual plan flow tests.
- H5 at 200% zoom and a 320px-wide mini-program viewport must keep the question, signed input, submit action, and safe-area clearance usable; pinned in visual/platform viewport checks.
- Files added after the license cutover must be classified as MPL, protected content/brand, or third party, and protected source assets must not leak into distributable packages; pinned in license-boundary tests.

---

## Workstream Plans

1. `docs/superpowers/plans/2026-10-12-license-cutover-implementation-plan.md`
2. `docs/superpowers/plans/2026-10-12-knowledge-atlas-grade7-implementation-plan.md`
3. `docs/superpowers/plans/2026-10-12-scientific-visual-experience-implementation-plan.md`
4. `docs/superpowers/plans/2026-10-12-four-platform-release-implementation-plan.md`

## Integration Order

### Task 1: Freeze contracts and create implementation branches

**Files:**
- Modify: `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`
- Create: one contract document under `docs/curriculum/`, `docs/ux/`, `docs/ui/`, and `docs/architecture/` as named by the child plans

**Interfaces:**
- Consumes: the accepted launch-scope design and the current frozen repository contracts.
- Produces: four frozen child contracts that Grok Bot can implement without product invention.

- [ ] **Step 1: Cursor prepares the child contract changes from the four workstream plans**

The contracts must repeat the exact IDs, file boundaries, test commands, visual copy, platform status vocabulary, and stop conditions from the child plans.

- [ ] **Step 2: ChatGPT runs Curriculum, Visual Asset, Architecture, and License Gates**

Expected result: each contract is either `PASS` or returned with a concrete conflict. No implementation branch starts with a `CONTRACT_CONFLICT`.

- [ ] **Step 3: Owner freezes the contracts**

Expected result: an explicit Owner approval identifies the frozen commit. Approval does not yet authorize external publication.

- [ ] **Step 4: Create one implementation branch per workstream from the same frozen base**

```bash
FROZEN_SHA="$(git rev-parse origin/docs/knowledge-license-product-architecture)"
git switch -c legal/mpl-content-brand-cutover "$FROZEN_SHA"
git switch -c feat/atlas-grade7-rational "$FROZEN_SHA"
git switch -c feat/scientific-visual-experience "$FROZEN_SHA"
git switch -c feat/four-platform-release "$FROZEN_SHA"
```

Expected: no branch contains another workstream's unfinished edits.

### Task 2: Execute license and learning-foundation work in parallel

**Files:**
- See license and knowledge/Grade 7 child plans.

**Interfaces:**
- Consumes: frozen license boundary and learning data contracts.
- Produces: a reviewed license cutover branch and a reviewed learning-foundation branch.

- [ ] **Step 1: Cursor implements the license documentation and manifest tasks**

Execution follows the license plan task order. Cursor may commit/push documentation and manifest changes under standing authorization; Owner still controls merge.

- [ ] **Step 2: Grok Bot implements atlas, rational engine, generators, migration, and signed input using TDD**

Execution follows the knowledge/Grade 7 plan task order. Kimi supplies/reviews curriculum artifacts; ChatGPT reviews boundaries and math invariants.

- [ ] **Step 3: Run independent whole-branch reviews**

```bash
npm test
npm run check:licenses
npm run check:atlas
```

Expected: all tests pass; the only allowed skip is a platform package check whose build artifact has not yet been created, and it must become non-skipped before platform release.

### Task 3: Implement the visual experience on top of the learning interfaces

**Files:**
- See scientific visual experience child plan.

**Interfaces:**
- Consumes: `explanations`, Atlas readers, signed inputs, and skill-session views from the learning branch.
- Produces: shared scientific components and accepted H5/WeChat visual behavior.

- [ ] **Step 1: Rebase the visual branch onto the reviewed learning-foundation commit**

```bash
git rebase origin/feat/atlas-grade7-rational
```

Expected: visual code consumes published interfaces and does not duplicate rational or atlas logic.

- [ ] **Step 2: Doubao supplies only the approved replaceable asset pack**

Expected: CSS/image/mascot/icon/decor/theme-manifest inventory passes the Visual Asset Gate. Unapproved design masters remain outside runtime packages.

- [ ] **Step 3: Grok Bot implements the visual plan and runs shared-page tests**

```bash
npm test
npm run build:h5
npm run build:weapp
```

Expected: both builds render the same page and explanation components.

- [ ] **Step 4: ChatGPT runs milestone visual and engineering review**

Review the relationship hierarchy, mascot frequency, feedback language, scientific component semantics, reduced-motion behavior, and absence of learning-logic changes.

- [ ] **Step 5: Owner and family perform real-device H5/WeChat acceptance**

Expected evidence: screen recordings or screenshots plus pass/fail notes for home, map, Grade 7 selection, signed integer, signed fraction, correct→principle, wrong→tools, pause/resume, progress, and safe area.

### Task 4: Adapt and verify four platforms

**Files:**
- See four-platform release child plan.

**Interfaces:**
- Consumes: reviewed learning and visual commits.
- Produces: four independent build/tool/device status records and release artifacts.

- [ ] **Step 1: Rebase the platform branch onto the accepted visual commit**

```bash
git rebase origin/feat/scientific-visual-experience
```

- [ ] **Step 2: WorkBuddy verifies H5 and WeChat; Doubao supports Douyin; the Owner-designated platform executor verifies Alipay**

Expected: platform-specific work changes adapters/configuration only. A core/shared UI change returns to ChatGPT review.

- [ ] **Step 3: Run the full release matrix**

```bash
npm test
npm run check:licenses
npm run check:atlas
npm run build:h5
npm run build:weapp
npm run build:tt
npm run build:alipay
npm run check:packages
```

Expected: zero failures and zero platform-package skips.

### Task 5: Assemble the release candidate

**Files:**
- Create: `docs/releases/first-launch-acceptance.md`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: four reviewed workstream commits.
- Produces: one release-candidate commit with reproducible evidence and no external publication.

- [ ] **Step 1: Merge reviewed workstreams into a fresh release-candidate branch in dependency order**

```bash
git switch -c release/first-launch-candidate origin/main
git merge --no-ff origin/legal/mpl-content-brand-cutover
git merge --no-ff origin/feat/atlas-grade7-rational
git merge --no-ff origin/feat/scientific-visual-experience
git merge --no-ff origin/feat/four-platform-release
```

- [ ] **Step 2: Run every automated gate from a clean checkout**

```bash
npm ci
npm test
npm run check:licenses
npm run check:atlas
npm run build:h5
npm run build:weapp
npm run build:tt
npm run build:alipay
npm run check:packages
```

Expected: all commands exit 0.

- [ ] **Step 3: Fill the release acceptance record with evidence, not claims**

The record must contain commit SHA, content/skill counts, migration fixture results, four build paths, package sizes, accessibility results, tool/device results, known limitations, license cutover SHA, and rollback commit.

- [ ] **Step 4: ChatGPT performs whole-branch review**

Expected: no contract drift, no platform API leak, no protected asset leak, no unsupported accessibility claim, and no `PUBLIC` platform without evidence.

- [ ] **Step 5: Owner performs final human acceptance and decides merge/release**

No AI merges, deploys, submits, publishes, tags, or announces before this Gate.

### Task 6: Publish one platform at a time with rollback

**Files:**
- Modify: `docs/releases/first-launch-acceptance.md`

**Interfaces:**
- Consumes: Owner-approved release candidate and platform credentials.
- Produces: truthful `PUBLIC`/`SUBMITTED` statuses and recorded rollback references.

- [ ] **Step 1: Publish H5 to the Owner-selected hosting target**

Expected: production URL, deployed commit SHA, cache policy, smoke results, and rollback artifact recorded. Hosting selection and credentials are supplied at the Owner Release Gate, not invented by an implementer.

- [ ] **Step 2: Submit WeChat, Douyin, and Alipay independently**

Expected: each platform records project identity, submitted version, review status, privacy declarations, and artifact SHA. A rejection changes only that platform's status.

- [ ] **Step 3: Run post-release smoke and update status**

Expected: `PUBLIC` is written only after the public artifact completes home → Grade 7 practice → correct/wrong → principle → progress without error.

- [ ] **Step 4: Commit the final evidence record**

```bash
git add docs/releases/first-launch-acceptance.md
git commit -m "docs: record first launch evidence"
```
