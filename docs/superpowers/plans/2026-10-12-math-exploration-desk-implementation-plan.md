# Math Exploration Desk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the card-wall feel with a relationship-led Math Exploration Desk, ship a real local “我的” profile and companion-centred product story, and preserve all learning/data identities across H5 and Mini Program clients.

**Architecture:** Keep curriculum, judging, mastery, scheduling and exercise identity untouched. Add pure presentation models and semantic components under `app/`, persist the optional nickname inside the existing active learner profile without a state-version bump, and keep every platform API behind `app/platform/current.*`. H5 and WeChat are the verified first-release clients; Douyin, Alipay, future iOS and Android reuse the shared page/model layer and supply their own adapters later.

**Tech Stack:** Taro 4.3, React 18, JavaScript ES modules, Taro `View`/`Text`/`Input`/`Image`, CSS, Node test runner, deterministic local JSON state.

**Spec:** `docs/superpowers/specs/2026-10-12-math-exploration-desk-redesign.md`

## Global Constraints

- Do not change judging, canonical answers, mastery states, scheduling, mistake reappearance, printing semantics, generator versions, `relation_id`, `skill_id`, or persisted `exercise_id` values.
- Do not add rankings, streak pressure, reward claims, level locks, cloud accounts, avatar upload, family switching, or cloud sync.
- Student-visible fractions remain numerator-over-bar-over-denominator; powers remain textbook superscripts.
- Shared files under `app/` and `src/core/` must not reference `window`, `wx`, `tt`, `my`, iOS or Android APIs.
- H5 and WeChat use one shared UI; Douyin, Alipay, iOS and Android remain future adapter work, not first-release build targets.
- Reuse the three existing mascot images; map four semantic states onto them and CSS motion. Add no raster asset because the WeChat package is already close to the 2 MB limit.
- Motion is one-shot, optional and non-blocking; `.motion-low` and `prefers-reduced-motion` show the final state without animation.
- Touch targets remain at least 44×44 CSS px equivalent; H5 keeps visible focus and 200% zoom support.
- Preserve unrelated untracked files `scripts/_cc-debug-cta.mjs` and `scripts/_cc-h5-smoke.mjs`.
- Do not edit the legacy `h5/` shell into a second product. The shipping H5 is the shared Taro build from `app/`; update legacy assertions only when they incorrectly claim the old page is the shipping UI.

## Review Focus

- Existing v4 records with no `profile.nickname` must open “我的” without migration, retain all relations/sessions/skills, and save a nickname without changing `learner_id` or `created_on`.
- A 12-code-point nickname, whitespace-only input, emoji/surrogate pairs and control characters must normalize deterministically on H5 and Mini Programs.
- Every one of the eight Grade 7 `skill_id` values must appear exactly once in the four-stage path and still open the same skill/band intent.
- A long skill label, 320px viewport, bottom safe-area inset and 200% zoom must not hide the final target or create horizontal overflow.
- Missing mascot/icon assets, reduced motion and image-load failure must leave every label, action and learning route fully usable.

---

## File Structure

New focused units:

- `src/core/learner-profile.js` — nickname normalization and identity-preserving profile update.
- `app/pages/me/model.js` — pure local profile/learning-overview model.
- `app/pages/me/index.jsx` and `index.config.js` — real “我的” page.
- `app/pages/about/index.jsx` and `index.config.js` — static product story and data explanation.
- `app/pages/explore/structure.js` — display-only fact shelf and Grade 7 stage metadata.
- `app/components/MathStructureIcon.jsx` — CSS/DOM mathematical structure icons with no learning logic.
- `app/components/MascotCompanion.jsx` — semantic pose, one-shot motion and optional contextual observation.
- `test/learner-profile.test.js` — profile compatibility and normalization.
- `test/math-exploration-desk.test.js` — structure, copy, navigation and non-regression contracts.

Existing units modified:

- Product/UX/UI contracts listed in the approved spec.
- `app/app.config.js`, `app/pages/tabs.js` — real `me` and `about` routes.
- `app/pages/home/model.js`, `app/pages/home/index.jsx` — remove duplicate re-practice action and compact next steps.
- `app/pages/explore/index.jsx`, `app/pages/models.js` — fact shelves and four-stage Grade 7 path.
- `app/pages/mistakes/index.jsx`, `src/core/mistakes.js` — current-only repair path and calm empty state.
- `app/components/ThemeImage.jsx`, `app/theme/math-lab/index.js` — four semantic mascot states over existing files.
- `app/app.css` — relationship-led layout and reduced motion using the existing theme tokens.
- Existing tests and H5/WeChat experience scripts — new acceptance selectors and viewport assertions.

### Task 1: Freeze the Approved Product, UX and UI Contracts

**Files:**
- Modify: `docs/product/01_prd.md`
- Modify: `docs/ux/02_ux_spec.md`
- Modify: `docs/ux/03_mistake_book_ux.md`
- Modify: `docs/ux/05_specialist_grouped_grid.md`
- Modify: `docs/ui/03_ui_spec.md`
- Modify: `docs/ui/08_fb_specialist_visual.md`
- Modify: `docs/ui/09_scientific_visual_language.md`
- Test: `test/architecture.test.js`

**Interfaces:**
- Consumes: approved redesign spec and existing identity contracts.
- Produces: frozen authority for every following task; no runtime interface.

- [ ] **Step 1: Write the failing contract assertions**

Add assertions to `test/architecture.test.js` that read the seven documents and pin these exact decisions:

```js
const prd = read("docs/product/01_prd.md");
const ux = read("docs/ux/02_ux_spec.md");
const mistakesUx = read("docs/ux/03_mistake_book_ux.md");
const specialistUx = read("docs/ux/05_specialist_grouped_grid.md");
const ui = read("docs/ui/03_ui_spec.md");
const scientificUi = read("docs/ui/09_scientific_visual_language.md");
assert.match(ux, /完成态不显示「再练一小段」/);
assert.match(ux, /「我的」是可用页面/);
assert.match(mistakesUx, /只显示「当前错题」/);
assert.match(specialistUx, /四个学习阶段/);
assert.match(ui, /数学探索台/);
assert.match(scientificUi, /欢迎.*思考.*发现.*休息/s);
assert.match(prd, /父母陪孩子一起做的一间数学实验室/);
for (const text of [prd, ux, ui]) {
  assert.match(text, /不催速度/);
  assert.match(text, /不比排名/);
}
```

- [ ] **Step 2: Run the focused test and verify the old contracts fail**

Run: `node --test test/architecture.test.js`

Expected: FAIL because the existing contracts still freeze the duplicate action, placeholder “我的” and double-column card layout.

- [ ] **Step 3: Revise the seven contracts with explicit supersession notes**

Write exact normative clauses, not a second proposal:

```text
完成态不显示「再练一小段」；继续练习从「专项练习」主动进入。
「我的」是可用页面，昵称是可选本地展示字段，不是 learner_id。
错题本首版只显示「当前错题」，不显示不可用标签。
事实领域使用实验架；七年级使用四阶段能力路径，八个 skill_id 不变且全部可直接进入。
数学探索台以关系线、数轴、分数带、阶段路径和安静陪伴为主要视觉语言。
```

Mark the old conflicting clauses as superseded by this first-release redesign; do not leave two simultaneous authorities.

- [ ] **Step 4: Run the contract test and repository whitespace check**

Run: `node --test test/architecture.test.js`

Expected: PASS.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 5: Commit the contract freeze**

```bash
git add docs/product/01_prd.md docs/ux/02_ux_spec.md docs/ux/03_mistake_book_ux.md docs/ux/05_specialist_grouped_grid.md docs/ui/03_ui_spec.md docs/ui/08_fb_specialist_visual.md docs/ui/09_scientific_visual_language.md test/architecture.test.js
git commit -m "docs: freeze math exploration desk experience"
```

### Task 2: Add a Backward-Compatible Local Learner Profile

**Files:**
- Create: `src/core/learner-profile.js`
- Create: `test/learner-profile.test.js`
- Modify: `src/core/store.js`
- Modify: `test/storage-contract.test.js`

**Interfaces:**
- Consumes: current v4 root state and active learner profile.
- Produces: `normalizeNickname(value) -> string`, `withActiveLearnerNickname(state, value) -> state`, `withActiveLearnerPrefs(state, patch) -> state`.

- [ ] **Step 1: Write failing normalization and identity tests**

Create `test/learner-profile.test.js`:

```js
test("nickname is optional, trimmed, control-free and limited to 12 code points", () => {
  assert.equal(normalizeNickname("  小研究员晨曦  "), "小研究员晨曦");
  assert.equal(normalizeNickname("\u0000小\n明"), "小明");
  assert.equal(Array.from(normalizeNickname("一二三四五六七八九十十一十二十三")).length, 12);
  assert.equal(normalizeNickname("   "), "");
});

test("saving nickname preserves learner identity and learning data", () => {
  const before = {
    version: 4,
    active_learner_id: "L1",
    learners: {
      L1: {
        profile: { learner_id: "L1", created_on: "2026-10-01" },
        relations: { r1: { status: "learning", attempts: [{ correct: false }] } },
        sessions: [], activeSession: null, skills: {}, activeSkillSession: null,
        prefs: { sound: true },
      },
    },
  };
  const after = withActiveLearnerNickname(before, "晨曦");
  assert.equal(after.active_learner_id, before.active_learner_id);
  assert.equal(after.learners.L1.profile.learner_id, "L1");
  assert.equal(after.learners.L1.profile.created_on, "2026-10-01");
  assert.deepEqual(after.learners.L1.relations, before.learners.L1.relations);
  assert.equal(after.learners.L1.profile.nickname, "晨曦");
});
```

Add a storage test that reads an existing v4 fixture with no nickname, writes the updated root, rereads it and compares `relations`, `sessions`, `skills`, `activeSession` and `activeSkillSession` byte-for-byte.

- [ ] **Step 2: Run the tests and verify missing exports fail**

Run: `node --test test/learner-profile.test.js test/storage-contract.test.js`

Expected: FAIL because `learner-profile.js` and the update helpers do not exist.

- [ ] **Step 3: Implement nickname normalization and immutable identity updates**

Implement `src/core/learner-profile.js`:

```js
export function normalizeNickname(value) {
  const clean = Array.from(String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim());
  return clean.slice(0, 12).join("");
}
```

Add to `src/core/store.js`:

```js
export function withActiveLearnerNickname(state, value) {
  const id = state.active_learner_id;
  const learner = getActiveLearner(state);
  const nickname = normalizeNickname(value);
  return {
    ...state,
    learners: {
      ...state.learners,
      [id]: {
        ...learner,
        profile: {
          ...learner.profile,
          learner_id: learner.profile.learner_id,
          created_on: learner.profile.created_on,
          ...(nickname ? { nickname } : { nickname: "" }),
        },
      },
    },
  };
}

export function withActiveLearnerPrefs(state, patch) {
  const id = state.active_learner_id;
  const learner = getActiveLearner(state);
  return {
    ...state,
    learners: { ...state.learners, [id]: { ...learner, prefs: { ...learner.prefs, ...patch } } },
  };
}
```

Import `normalizeNickname` explicitly. Keep `STATE_VERSION = 4`; the field is optional and old records need no migration.

- [ ] **Step 4: Run profile, migration, storage and write-protection tests**

Run: `node --test test/learner-profile.test.js test/storage-contract.test.js test/storage-write-protect.test.js test/migration-v4.test.js`

Expected: PASS with old fixtures unchanged except when the test explicitly saves a nickname.

- [ ] **Step 5: Commit**

```bash
git add src/core/learner-profile.js src/core/store.js test/learner-profile.test.js test/storage-contract.test.js
git commit -m "feat: add compatible local learner profile"
```

### Task 3: Build the Real “我的” and Product Story Pages

**Files:**
- Create: `app/pages/me/model.js`
- Create: `app/pages/me/index.jsx`
- Create: `app/pages/me/index.config.js`
- Create: `app/pages/about/index.jsx`
- Create: `app/pages/about/index.config.js`
- Modify: `app/app.config.js`
- Modify: `app/pages/tabs.js`
- Modify: `app/app.css`
- Test: `test/math-exploration-desk.test.js`
- Test: `test/xp-pages.test.js`

**Interfaces:**
- Consumes: `getRecord(getStore)`, `getActiveLearner`, `withActiveLearnerNickname`, `withActiveLearnerPrefs`, `navigate.toPage`, `navigate.toTab`.
- Produces: routable `me` and `about` pages; `profileView(learner)` pure model.

- [ ] **Step 1: Write failing page-model, route, copy and persistence tests**

Create `test/math-exploration-desk.test.js` with assertions equivalent to:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { profileView } from "../app/pages/me/model.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("profile view is calm evidence, not a score", () => {
  const view = profileView({
    profile: { learner_id: "L1", created_on: "2026-10-01", nickname: "晨曦" },
    relations: {
      a: { status: "stable", attempts: [{ correct: true }] },
      b: { status: "learning", attempts: [{ correct: false }] },
    },
    prefs: { sound: true },
  });
  assert.equal(view.nickname, "晨曦");
  assert.equal(view.practicedRelations, 2);
  assert.equal(view.stableRelations, 1);
  assert.equal(view.sound, true);
  assert.doesNotMatch(JSON.stringify(view), /排名|击败|连续打卡|落后/);
});

test("about page carries the approved parent-companion story", () => {
  const page = read("app/pages/about/index.jsx");
  for (const line of [
    "父母陪孩子一起做的一间数学实验室",
    "不催速度，不比排名，不用题量制造压力",
    "更可靠的计算直觉",
    "错误不是惩罚的理由",
  ]) assert.match(page, new RegExp(line));
});
```

Assert that `app.config.js` includes `pages/me/index` and `pages/about/index`, `TAB_PAGES.me === "me"`, and the `me` tab no longer calls `showSoon`.

- [ ] **Step 2: Run the focused tests and verify the routes/models are missing**

Run: `node --test test/math-exploration-desk.test.js test/xp-pages.test.js`

Expected: FAIL on missing modules/routes.

- [ ] **Step 3: Implement the pure profile model**

Create `app/pages/me/model.js`:

```js
export function profileView(learner = {}) {
  const relations = Object.values(learner.relations || {});
  const practiced = relations.filter((relation) => (relation.attempts || []).length > 0);
  return {
    nickname: learner.profile?.nickname || "",
    displayName: learner.profile?.nickname || "小研究员",
    practicedRelations: practiced.length,
    stableRelations: practiced.filter((relation) => relation.status === "stable").length,
    sound: learner.prefs?.sound !== false,
  };
}
```

- [ ] **Step 4: Implement the pages and safe writes**

`app/pages/me/index.jsx` must:

- read the full root from `getRecord(getStore)`;
- derive the active learner and `profileView`;
- edit nickname through Taro `Input`, normalize/save only on explicit「保存称呼」;
- toggle sound through `withActiveLearnerPrefs`;
- show reduced motion as read-only「跟随系统」;
- link to About and show the local-device data note;
- contain no clear/reset control in this release.

Use this write shape so profile updates never pass a learner object to `withActiveLearner`:

```js
const saveNickname = () => {
  const next = withActiveLearnerNickname(record.read(), draft);
  record.write(next);
  setLearner(getActiveLearner(next));
};
```

`app/pages/about/index.jsx` renders the approved copy as native `Text` blocks, has a back action, no external URL and no hard-coded license name.

- [ ] **Step 5: Register routes and real tab navigation**

Add the two pages to `app/app.config.js`; add `me: "me"` to `TAB_PAGES`; keep About as a pushed ordinary page. Set titles to「我的」and「关于数感训练场」.

- [ ] **Step 6: Style the profile without creating another card wall**

Use one profile header, one two-column evidence strip, and divided setting rows. The nickname field and save button each have a 44px minimum target. Use existing tokens; no platform-specific selectors.

- [ ] **Step 7: Run focused tests and both builds**

Run: `node --test test/math-exploration-desk.test.js test/xp-pages.test.js test/learner-profile.test.js`

Expected: PASS.

Run: `npm run build:h5 && npm run build:weapp && npm run check:weapp-package`

Expected: builds PASS and package remains below 2 MB.

- [ ] **Step 8: Commit**

```bash
git add app/app.config.js app/pages/tabs.js app/pages/me app/pages/about app/app.css test/math-exploration-desk.test.js test/xp-pages.test.js
git commit -m "feat: add local learner profile and product story"
```

### Task 4: Simplify the Home Completion State and Next Steps

**Files:**
- Modify: `app/pages/home/model.js`
- Modify: `app/pages/home/index.jsx`
- Modify: `app/app.css`
- Test: `test/xp-shared-ui.test.js`
- Test: `test/math-exploration-desk.test.js`

**Interfaces:**
- Consumes: existing `homeView(state)` and `HOME_ENTRIES` actions.
- Produces: home view with no duplicate secondary action and compact `home-next` items.

- [ ] **Step 1: Replace the old completion expectation with a failing new one**

```js
test("completed home has one primary action and no duplicate re-practice action", () => {
  const home = homeView({
    sessions: [{ day: "2026-10-12", completed: true, mode: "daily" }],
    activeSession: null,
  }, "2026-10-12");
  assert.equal(home.cta.label, "看看这次");
  assert.equal(home.secondary, null);
});
```

Statically assert the home page contains `home-next` and no `device-note`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --test test/xp-shared-ui.test.js test/math-exploration-desk.test.js`

Expected: FAIL because completed mode still returns「再练一小段」.

- [ ] **Step 3: Implement the new home hierarchy**

Set completed `secondary: null`. Change the entry renderer after the main CTA to a compact three-item `home-next` region headed「下一步」. Keep the default and paused main actions unchanged. Remove `DEVICE_NOTE` from Home; it now lives in My.

Use copy aligned with companionship:

```js
title: "今天这段练完了",
lede: "今天先走到这里。想回看时，我们一起看看刚才的关系。",
```

- [ ] **Step 4: Implement responsive styling and focus states**

At 320px, the three next steps may stack or use a compact grid but each target stays 44px high. Preserve visible focus and do not place mascot/decor over the targets.

- [ ] **Step 5: Run focused tests and Home viewport check**

Run: `node --test test/xp-shared-ui.test.js test/math-exploration-desk.test.js`

Expected: PASS.

Run after `npm run build:h5`: `BASE=http://localhost:4173/ node scripts/home-fold-check.mjs`

Expected: primary action and all next-step entries remain reachable without horizontal overflow at the script’s viewports.

- [ ] **Step 6: Commit**

```bash
git add app/pages/home/model.js app/pages/home/index.jsx app/app.css test/xp-shared-ui.test.js test/math-exploration-desk.test.js
git commit -m "feat: simplify the home completion journey"
```

### Task 5: Add Semantic Mathematical Structure Icons

**Files:**
- Create: `app/pages/explore/structure.js`
- Create: `app/components/MathStructureIcon.jsx`
- Modify: `app/app.css`
- Test: `test/math-exploration-desk.test.js`

**Interfaces:**
- Consumes: existing eight `SKILL_IDS` and eight fact `domain_id` values.
- Produces: `GRADE7_STAGES`, `structureKindForSkill(skillId)`, `MathStructureIcon({ kind })`.

- [ ] **Step 1: Write failing completeness and uniqueness tests**

```js
test("the four Grade 7 stages contain every stable skill id exactly once", () => {
  const ids = GRADE7_STAGES.flatMap((stage) => stage.skills);
  assert.deepEqual(ids.sort(), [...SKILL_IDS].sort());
  assert.equal(new Set(ids).size, SKILL_IDS.length);
  assert.deepEqual(GRADE7_STAGES.map((stage) => stage.label), [
    "认识有理数", "掌握四则", "进入分数", "综合运用",
  ]);
});

test("every Grade 7 skill has a mathematical structure kind", () => {
  for (const id of SKILL_IDS) assert.ok(structureKindForSkill(id), id);
});
```

- [ ] **Step 2: Run and verify missing modules fail**

Run: `node --test test/math-exploration-desk.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement display-only structure metadata**

Export frozen stage objects from `app/pages/explore/structure.js`. Use the actual `SKILL_IDS` constants, not copied display ids. Map each skill to one of:

```js
"number-line" | "compare-points" | "signed-move" | "grouping" |
"fraction-align" | "fraction-area" | "power" | "operation-tree"
```

No stage id or icon kind may be imported by scheduler, mastery, mistakes, content, generators or storage.

- [ ] **Step 4: Implement DOM/CSS icons with textual fallback outside the icon**

`MathStructureIcon` uses only `View`/`Text` and CSS pseudo-elements. It is `aria-hidden`; the adjacent skill name carries meaning. The `power` icon uses a real superscript text node, the fraction icons draw a horizontal bar, and the number-line icons include a zero tick. Do not use emoji, inline SVG or new image files.

- [ ] **Step 5: Run tests and check shared-layer platform purity**

Run: `node --test test/math-exploration-desk.test.js test/xp-architecture.test.js`

Expected: PASS; no shared file references platform globals.

- [ ] **Step 6: Commit**

```bash
git add app/pages/explore/structure.js app/components/MathStructureIcon.jsx app/app.css test/math-exploration-desk.test.js
git commit -m "feat: add semantic math structure icons"
```

### Task 6: Replace the Practice Card Wall with Shelves and a Grade 7 Path

**Files:**
- Modify: `app/pages/models.js`
- Modify: `app/pages/explore/index.jsx`
- Modify: `app/app.css`
- Modify: `test/xp-pages.test.js`
- Modify: `test/fb-specialist.test.js`
- Modify: `scripts/taro-pages-e2e.mjs`
- Modify: `scripts/weapp-devtools-e2e.mjs`
- Test: `test/math-exploration-desk.test.js`

**Interfaces:**
- Consumes: `exploreView`, `grade7View`, `GRADE7_STAGES`, `MathStructureIcon`.
- Produces: `grade7PathView(state) -> { stages: [{ id, label, skills: card[] }] }`; unchanged focus actions and training intents.

- [ ] **Step 1: Write failing path and identity tests**

```js
test("Grade 7 path changes presentation only", () => {
  const learner = {
    relations: {},
    skills: {
      "g7-integer-add-sub": { status: "learning", next_band: "standard" },
    },
  };
  const flat = grade7PathView(learner).stages.flatMap((stage) => stage.skills);
  assert.deepEqual(flat.map((skill) => skill.skillId).sort(), [...SKILL_IDS].sort());
  for (const skill of flat) {
    assert.equal(skill.band, grade7View(learner).cards.find((x) => x.skillId === skill.skillId).band);
  }
});
```

Update old static tests so they require `.practice-shelf`, `.grade7-path`, four `.grade7-stage` groups and no `.skill-grid` two-column contract.

- [ ] **Step 2: Run focused tests and verify the old layout fails**

Run: `node --test test/math-exploration-desk.test.js test/xp-pages.test.js test/fb-specialist.test.js`

Expected: FAIL on old card/grid selectors.

- [ ] **Step 3: Implement `grade7PathView` without new identities**

Build a map from `grade7View(state).cards` and return cards in `GRADE7_STAGES` order. Throw in tests if a stage names an unknown skill; production output must never invent a fallback id.

- [ ] **Step 4: Render fact groups as shelves**

Keep the three existing group keys, labels and cards, but render each fact domain as one `.practice-shelf-item` with the existing domain asset, name, status and a subtle relationship track. The whole row remains the one button and opens the same focus confirmation.

- [ ] **Step 5: Render the four-stage Grade 7 path**

Each stage has a numbered marker, title and two skill rows connected by a decorative path. Each skill row uses `MathStructureIcon`, current band/status and the existing `setFocusedSkill` action. All eight skills remain directly available; no locks or completion gates.

- [ ] **Step 6: Add responsive and accessibility rules**

- 320–430px: one readable path column, no horizontal scroll.
- 768px+: stage content may use two columns while preserving DOM order.
- Decorative connectors use `aria-hidden` and do not carry labels.
- Long labels wrap; the 44px target expands vertically.
- Focus ring encloses the whole row.

- [ ] **Step 7: Update browser and WeChat automation selectors**

Replace assumptions about `.practice-grid` and `.skill-card` with stable semantic selectors:

```text
[data-group]
[data-domain]
[data-stage]
[data-skill]
```

Assert eight fact domains and eight Grade 7 skills, one each, plus no horizontal overflow at 320/375/390/430.

- [ ] **Step 8: Run page, asset and build checks**

Run: `node --test test/math-exploration-desk.test.js test/xp-pages.test.js test/fb-specialist.test.js`

Expected: PASS.

Run: `npm run build:h5 && npm run build:weapp && npm run check:weapp-package`

Expected: PASS; package remains under 2 MB and all nine existing specialist images still resolve.

- [ ] **Step 9: Commit**

```bash
git add app/pages/models.js app/pages/explore/index.jsx app/app.css test/xp-pages.test.js test/fb-specialist.test.js test/math-exploration-desk.test.js scripts/taro-pages-e2e.mjs scripts/weapp-devtools-e2e.mjs
git commit -m "feat: show practice as shelves and a skill path"
```

### Task 7: Turn the Mistake Book into a Calm Repair Path

**Files:**
- Modify: `src/core/mistakes.js`
- Modify: `app/pages/models.js`
- Modify: `app/pages/mistakes/index.jsx`
- Modify: `app/app.css`
- Modify: `test/mistakes.test.js`
- Modify: `test/xp-pages.test.js`
- Test: `test/math-exploration-desk.test.js`

**Interfaces:**
- Consumes: unchanged `buildMistakeBook` grouping and mistake semantics.
- Produces: display copy and `practiceLabel` based only on current count.

- [ ] **Step 1: Write failing current-only and single-item tests**

```js
test("mistake page has no unavailable history tabs", () => {
  const page = read("app/pages/mistakes/index.jsx");
  assert.doesNotMatch(page, /已掌握|全部|seg-soon|敬请期待/);
});

test("one current mistake gets a singular action", () => {
  const view = mistakesView({
    relations: {
      "square-6": { status: "learning", attempts: [{ correct: false, day: "2026-10-12" }] },
    },
  }, catalog);
  assert.equal(view.total, 1);
  assert.equal(view.practiceLabel, "练这 1 题");
});
```

Pin the empty copy to「现在没有需要重新写熟的题。」.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test test/mistakes.test.js test/xp-pages.test.js test/math-exploration-desk.test.js`

Expected: FAIL on old tabs/copy/action.

- [ ] **Step 3: Update the pure view copy without changing semantics**

Keep `isHistoricalMistake`, `isCurrentMistake`, grouping and ids untouched. Change only the returned lede/empty message and add in `mistakesView`:

```js
practiceLabel: book.total === 1 ? "练这 1 题" : "练这些错题",
contextText: "这些关系还在变熟，练习中会继续得到确认。",
```

- [ ] **Step 4: Remove future tabs and render the repair path**

Render title, current-only explanation, ledger groups, context line and the existing print/practice actions. Keep print secondary. Empty state uses semantic mascot `rest` and a home action.

- [ ] **Step 5: Run focused tests and confirm mistake scheduling is unchanged**

Run: `node --test test/mistakes.test.js test/schedule.test.js test/scheduler.test.js test/xp-pages.test.js test/math-exploration-desk.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/mistakes.js app/pages/models.js app/pages/mistakes/index.jsx app/app.css test/mistakes.test.js test/xp-pages.test.js test/math-exploration-desk.test.js
git commit -m "feat: simplify the current mistake repair path"
```

### Task 8: Make the Mascot a Quiet, Cross-Platform Companion

**Files:**
- Create: `app/components/MascotCompanion.jsx`
- Modify: `app/components/ThemeImage.jsx`
- Modify: `app/theme/math-lab/index.js`
- Modify: `app/pages/home/index.jsx`
- Modify: `app/pages/explore/index.jsx`
- Modify: `app/pages/mistakes/index.jsx`
- Modify: `app/pages/me/index.jsx`
- Modify: `app/app.css`
- Modify: `test/theme.test.js`
- Test: `test/math-exploration-desk.test.js`

**Interfaces:**
- Consumes: existing `mascot.welcome`, `mascot.correct`, `mascot.thinking` assets and page-level `motionClass`.
- Produces: `MascotCompanion({ pose, observation, interactive, className })`; semantic poses `welcome`, `thinking`, `discover`, `rest`.

- [ ] **Step 1: Write failing semantic-state and package-budget tests**

```js
test("four semantic mascot states reuse the existing three files", () => {
  assert.equal(theme.mascot.welcome, "mascot.welcome");
  assert.equal(theme.mascot.thinking, "mascot.thinking");
  assert.equal(theme.mascot.discover, "mascot.correct");
  assert.equal(theme.mascot.rest, "mascot.thinking");
});
```

Assert no fourth mascot image import and no new PNG/WebP under runtime theme folders.

- [ ] **Step 2: Run and verify missing states/component fail**

Run: `node --test test/theme.test.js test/math-exploration-desk.test.js`

Expected: FAIL.

- [ ] **Step 3: Map semantic poses and implement the companion wrapper**

Update `Mascot` to resolve through `theme.mascot[pose]`, falling back to `welcome`. `MascotCompanion` renders an optional button only when `interactive === true`; tapping toggles one contextual observation such as「先看关系，再决定怎么算。」. It writes no learner state.

- [ ] **Step 4: Add one-shot, low-cost motion**

Use transform/opacity only:

```css
@keyframes mascot-arrive {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.mascot-companion { animation: mascot-arrive 420ms cubic-bezier(.2,.8,.2,1) both; }
.motion-low .mascot-companion { animation: none; }
@media (prefers-reduced-motion: reduce) { .mascot-companion { animation: none; } }
```

No infinite animation and no JS timer controls navigation.

- [ ] **Step 5: Place the companion only at approved moments**

- Home: welcome/default, rest/completed.
- Explore header: welcome with one optional observation.
- Mistake empty state: rest.
- My header: thinking or welcome.
- Never add it to training, keypad, correct/wrong feedback or print.

- [ ] **Step 6: Run theme, architecture and package tests**

Run: `node --test test/theme.test.js test/math-exploration-desk.test.js test/xp-architecture.test.js`

Expected: PASS.

Run: `npm run build:weapp && npm run check:weapp-package`

Expected: PASS below 2 MB with no new raster asset.

- [ ] **Step 7: Commit**

```bash
git add app/components/MascotCompanion.jsx app/components/ThemeImage.jsx app/theme/math-lab/index.js app/pages/home/index.jsx app/pages/explore/index.jsx app/pages/mistakes/index.jsx app/pages/me/index.jsx app/app.css test/theme.test.js test/math-exploration-desk.test.js
git commit -m "feat: make the mascot a quiet companion"
```

### Task 9: Complete Cross-Platform Regression and Owner Preview Handoff

**Files:**
- Modify: `scripts/taro-pages-e2e.mjs`
- Modify: `scripts/weapp-devtools-e2e.mjs`
- Modify: `scripts/home-fold-check.mjs`
- Modify: `docs/governance/four-platform-release-gate.md`
- Test: full repository suite and build outputs.

**Interfaces:**
- Consumes: final shared pages and existing platform adapters.
- Produces: reproducible H5/WeChat evidence and an explicit unverified list for Douyin, Alipay, iOS and Android.

- [ ] **Step 1: Add final H5 scenarios**

Extend the tracked Taro H5 automation to cover:

```text
Home default / paused / completed
Practice shelves: 8 fact domains exactly once
Grade 7 path: 4 stages, 8 skills exactly once, skill confirmation still opens
Mistake Book: empty, one item, multiple items
My: old record without nickname, save nickname, refresh persistence, sound toggle
About: approved story copy
320 / 375 / 390 / 430 widths
reduced motion
console errors and business-resource 404s
```

- [ ] **Step 2: Add final WeChat developer-tool scenarios**

Reuse semantic `data-*` selectors. Verify safe-area reachability, nickname persistence through `wx` storage, four navigation entries, Grade 7 path, one mistake action and no image-load errors. Do not weaken a scenario merely because the developer tool cannot emulate a real device; mark real-device-only items unverified.

- [ ] **Step 3: Run the complete deterministic suite**

Run:

```bash
npm test
npm run check:atlas
npm run sync-content
git diff --exit-code -- src/core/catalog-data.js src/core/reference-catalog-data.js src/core/practice-variants-data.js
```

Expected: all tests PASS; generated catalogs unchanged.

- [ ] **Step 4: Build both current clients and check package budget**

Run:

```bash
npm run build:h5
npm run build:weapp
npm run check:weapp-package
```

Expected: both builds PASS and the WeChat package remains below 2 MB.

- [ ] **Step 5: Run tracked H5 browser checks**

Serve `dist/h5` and run:

```bash
node scripts/taro-pages-e2e.mjs
node scripts/home-fold-check.mjs
node scripts/h5-specialist-check.mjs
node scripts/h5-viewport-check.mjs
```

Expected: all page/scenario assertions PASS, zero console errors, zero business-resource 404s and no horizontal overflow.

- [ ] **Step 6: Run WeChat automation where the local tool is available**

Run the repository’s existing developer-tool command/path for `scripts/weapp-devtools-e2e.mjs` and preserve its JSON/screenshots. Expected: automated checks PASS; real-device touch, font rendering and safe-area remain Owner/Grok verification rather than inferred success.

- [ ] **Step 7: Record future-platform status honestly**

Update `docs/governance/four-platform-release-gate.md`:

```text
H5: built and browser-smoked
WeChat: built; developer-tool result recorded; real-device result recorded separately
Douyin: shared-layer compatibility preserved; build/devtool unverified until adapter/plugin milestone
Alipay: shared-layer compatibility preserved; build/devtool unverified until adapter/plugin milestone
iOS: future adapter boundary only; no native build in this milestone
Android/APK: future adapter boundary only; no native build in this milestone
```

- [ ] **Step 8: Verify no identity or contract drift**

Run:

```bash
git diff 440455fe9996719c27ea0685cc083791fb866f39 -- src/core/catalog-data.js src/core/grade7-rational-generator.js src/core/grade7-rational-generator-v2.js src/core/schedule.js src/core/scheduler.js
```

Expected: no unintended content/generator/scheduler changes. The deliberate `src/core/mistakes.js` copy-only diff is reviewed separately and contains no predicate or grouping change.

- [ ] **Step 9: Commit verification tooling and gate evidence**

```bash
git add scripts/taro-pages-e2e.mjs scripts/weapp-devtools-e2e.mjs scripts/home-fold-check.mjs docs/governance/four-platform-release-gate.md
git commit -m "test: verify exploration desk across shared clients"
```

## Final Review and Handoff

- Review the whole branch against `440455f`, not only the last commit.
- Confirm changed runtime files are limited to presentation, local profile preference and documented navigation.
- Confirm no `CONTRACT_CONFLICT`, `DATA_MIGRATION_RISK` or `CONTENT_ID_CONFLICT`.
- Push the implementation branch without merging, deploying or submitting a Mini Program.
- Hand Grok Bot the exact SHA for independent full regression, H5 preview deployment and WeChat developer-tool/real-device evidence under the repository’s `AGENTS.md` boundaries.
- Owner and family perform the final H5/WeChat experience review before any formal release decision.
