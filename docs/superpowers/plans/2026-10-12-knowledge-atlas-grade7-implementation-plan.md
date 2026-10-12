# Knowledge Atlas and Grade 7 Rational Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete first knowledge atlas and a deterministic, exact Grade 7 rational-number practice system while preserving all existing relation history.

**Architecture:** Keep the finite relation catalog intact, add a separate Atlas reader, and add a generated-skill engine built on exact reduced rational arithmetic. Learner state v4 stores skill evidence beside relation evidence; shared training flow consumes a common exercise view without teaching the relation scheduler about generated exercises.

**Tech Stack:** JavaScript ES modules, versioned JSON, Node test runner, existing v3 state migration, React/Taro shared UI.

**Spec:** `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`

## Global Constraints

- Existing 173 relation IDs and evidence are byte-for-byte preserved through migration.
- Atlas state is descriptive, never mastery evidence.
- Rational judging uses exact integers and never floating point.
- Generated exercises are reproducible from `seed + skill_id + band + index`.
- Division by zero and unsafe integer intermediates are never generated.
- `foundation` and `standard` can enter ordinary Grade 7 practice; `transfer` is opt-in.
- Content files are protected curriculum assets; engine and validators are MPL software.

## Review Focus

- `-0`, `0/-3`, `-2/-4`, reducible negative answers, and zero normalize to canonical rational forms.
- `(-3)^2` and `-3^2` remain distinct prompts with distinct answers and explanations.
- A v3 active relation session resumes after v4 migration; new skill state starts empty and does not alter the queue.
- The same generated exercise is produced on all four clients without platform randomness.
- A mapped-only Atlas topic can be viewed but cannot start a session or create progress.

---

### Task 1: Freeze the Atlas and Grade 7 curriculum contracts

**Files:**
- Create: `docs/curriculum/10_knowledge_atlas_v01_contract.md`
- Create: `docs/curriculum/11_grade7_rational_skills_contract.md`
- Create: `docs/architecture/04_learning_asset_tracks.md`

**Interfaces:**
- Consumes: the launch-scope spec and existing content contracts.
- Produces: exact Atlas node IDs, edge types, eight skill IDs, generator bands, exclusions, and examples.

- [ ] **Step 1: Kimi writes the coverage matrix**

The matrix must contain every topic named in spec section 3 and columns `node_id`, `label`, `band`, `layer`, `track`, `status`, `prerequisites`, `released_entry`, `review_evidence`.

- [ ] **Step 2: Specify the eight Grade 7 skills with accepted and rejected examples**

For every skill and band, include at least three concrete prompts, canonical rational answers, direct/structure/estimate explanations, maximum operand magnitude, maximum step count, and exclusions. Include these mandatory semantic cases:

```text
|-7| = 7
-7 + 12 = 5
8 - (-3) = 11
(-4) × (-6) = 24
(-3/4) + (5/6) = 1/12
(-2/3) ÷ (4/9) = -3/2
(-3)^2 = 9
-3^2 = -9
```

- [ ] **Step 3: ChatGPT reviews identity and mastery boundaries**

Expected: no generated exercise is given a permanent `relation_id`; no Atlas node is used as a scheduler item; old IDs remain authoritative.

- [ ] **Step 4: Owner freezes the contracts**

Stop if content review finds a mathematical ambiguity or age-level mismatch.

### Task 2: Add the Knowledge Atlas data model and validator

**Files:**
- Create: `content/atlas/v0.1/nodes.json`
- Create: `content/atlas/v0.1/edges.json`
- Create: `src/core/atlas.js`
- Create: `scripts/validate-atlas.mjs`
- Modify: `package.json`
- Test: `test/atlas.test.js`

**Interfaces:**
- Produces: `loadAtlas() -> { nodes, edges }`, `nodeById(id)`, `neighbors(id, type?)`, `atlasLayers()`.
- Node: `{ id, label, band, layer, track, status, prerequisites, released_entry }`.
- Edge: `{ id, from, to, type }`, where type is `prerequisite|derives|inverse|representation|verifies|transfers`.

- [ ] **Step 1: Write failing schema and coverage tests**

```js
test("Atlas v0.1 covers every accepted topic family", () => {
  const labels = new Set(loadAtlas().nodes.map((n) => n.id));
  for (const id of REQUIRED_ATLAS_ROOTS) assert.ok(labels.has(id), id);
});

test("mapped-only nodes never expose a released entry", () => {
  for (const node of loadAtlas().nodes.filter((n) => n.status === "mapped")) {
    assert.equal(node.released_entry, null, node.id);
  }
});
```

- [ ] **Step 2: Run the test and see it fail**

Run: `node --test test/atlas.test.js`

Expected: FAIL because `src/core/atlas.js` does not exist.

- [ ] **Step 3: Implement the pure Atlas reader**

Reject duplicate IDs, unknown endpoints, invalid statuses/types, self-edges, and prerequisite cycles. `loadAtlas()` returns detached arrays so callers cannot mutate the cache.

- [ ] **Step 4: Populate Atlas v0.1 from the frozen matrix**

Every requested future family—exponent, logarithm, inequality, geometry models—must appear as `mapped`, not as a released empty card.

- [ ] **Step 5: Add CLI validation**

```json
"check:atlas": "node scripts/validate-atlas.mjs"
```

The CLI prints node counts by status/layer/band and exits non-zero on any schema or graph error.

- [ ] **Step 6: Run and commit**

```bash
npm run check:atlas
node --test test/atlas.test.js
git add content/atlas src/core/atlas.js scripts/validate-atlas.mjs test/atlas.test.js package.json
git commit -m "feat: add versioned knowledge atlas"
```

### Task 3: Make finite relation collections explicit

**Files:**
- Modify: `src/core/content.js`
- Modify: `scripts/sync-content.mjs`
- Create: `content/v0.5/manifest.json`
- Create: `src/core/reference-catalog-data.js` through the sync script
- Test: `test/content-collections.test.js`

**Interfaces:**
- Produces: unchanged `loadCoreCatalog()` for the historical 173; new `loadFactCatalog({ includeReference })`; `collectionOf(item) -> mastery_core|reference_practice|exploration_only`; `dailyCatalog(catalog)`; `focusedCatalog(domain, collection)`.

- [ ] **Step 1: Pin backward-compatible defaults**

```js
test("all 173 historical items default to mastery_core", () => {
  assert.equal(loadCoreCatalog().filter((x) => collectionOf(x) === "mastery_core").length, 173);
});
```

- [ ] **Step 2: Preserve the historical Core loader and add a reference loader**

Do not edit the existing v0.1/v0.2c/v0.4 JSON merely to add metadata. Missing `collection` means `mastery_core`. `loadCoreCatalog()` and `verifyContentCounts()` keep their existing 173-item behavior and tests. `loadFactCatalog({ includeReference: true })` appends generated v0.5 reference facts; daily scheduling continues to call the Core loader. Reject unknown collection values.

- [ ] **Step 3: Define the v0.5 finite-set manifest**

The manifest declares exact enumerators and reuse rules:

```json
{
  "products_1_19": { "pairs": "1 <= a <= b <= 19", "count": 190 },
  "complements": { "targets": [10, 20, 100], "operand": "1 <= a < target", "count": 127 },
  "squares_1_100": { "forward": 100, "inverse": 100 },
  "cubes_1_20": { "forward": 20, "inverse": 20 },
  "common_powers": {
    "families": ["2^1..2^10", "3^1..3^6", "5^1..5^5", "10^1..10^6"],
    "forward": 27,
    "inverse_prompt": "value = base^?"
  },
  "reuse_existing_ids": true,
  "new_default_collection": "reference_practice"
}
```

Kimi marks the Mastery Core subset in the curriculum contract; generators create only missing facts and fail on semantic duplicates.

- [ ] **Step 4: Add collision and count tests**

Tests independently enumerate the 190 unordered multiplication pairs, 127 complement relations, 100 squares, 20 cubes, and 27 common powers; assert one semantic fact each, preserved legacy IDs, unique forward/inverse pairs, and no daily-catalog expansion beyond the frozen 173-item Mastery Core set. Multiplication presentation may swap operands but keeps one relation ID. Overlap is subtraction, not duplication: existing facts retain their old IDs and only missing facts receive v0.5 IDs.

- [ ] **Step 5: Generate and review content**

Run: `npm run sync-content`

Expected: `src/core/catalog-data.js` and the old 173 remain deep-equal; generated v0.5 reference facts live in `src/core/reference-catalog-data.js`; `verifyContentCounts()` still returns 173; a new manifest verifier reports the combined Core/reference counts.

- [ ] **Step 6: Commit**

```bash
git add content/v0.5 src/core/content.js src/core/catalog-data.js src/core/reference-catalog-data.js scripts/sync-content.mjs test/content-collections.test.js
git commit -m "feat: add complete finite fact collections"
```

### Task 4: Implement exact rational arithmetic

**Files:**
- Create: `src/core/rational.js`
- Test: `test/rational.test.js`

**Interfaces:**
- Produces: `rational(n, d=1)`, `parseRational(text)`, `formatRational(value)`, `add`, `subtract`, `multiply`, `divide`, `power`, `compare`, `abs`, `negate`.
- Rational: frozen `{ numerator: number, denominator: number }`, reduced, denominator positive.

- [ ] **Step 1: Write edge-case tests first**

```js
assert.deepEqual(rational(-2, -4), { numerator: 1, denominator: 2 });
assert.deepEqual(rational(0, -7), { numerator: 0, denominator: 1 });
assert.equal(formatRational(add(rational(-3, 4), rational(5, 6))), "1/12");
assert.equal(formatRational(divide(rational(-2, 3), rational(4, 9))), "-3/2");
assert.throws(() => divide(rational(1), rational(0)), /division by zero/);
```

- [ ] **Step 2: Verify the test fails**

Run: `node --test test/rational.test.js`

- [ ] **Step 3: Implement reduced integer arithmetic**

Cross-cancel before multiply/divide and assert `Number.isSafeInteger` after every intermediate. `power` accepts integer exponents `0..6` for this release; negative exponents remain mapped-only.

- [ ] **Step 4: Add algebraic property loops**

For all numerators `-20..20` and denominators `1..12`, verify normalized denominator, gcd 1, `a + 0 = a`, `a × 1 = a`, `a + (-a) = 0`, and compare antisymmetry.

- [ ] **Step 5: Run and commit**

```bash
node --test test/rational.test.js
git add src/core/rational.js test/rational.test.js
git commit -m "feat: add exact rational arithmetic"
```

### Task 5: Build deterministic Grade 7 exercise generators

**Files:**
- Create: `content/skills/v0.1/grade7-rational.json`
- Create: `src/core/exercise-rng.js`
- Create: `src/core/skill-catalog.js`
- Create: `src/core/grade7-rational-generator.js`
- Test: `test/grade7-rational-generator.test.js`

**Interfaces:**
- Produces: `generateExercise({ skillId, band, seed, index }) -> Exercise`.
- Exercise: `{ id, skill_id, band, prompt, canonical_answer, answer_type, explanations, operands, checksum }`.

- [ ] **Step 1: Write deterministic snapshot tests**

```js
const a = generateExercise({ skillId: "g7-integer-add-sub", band: "standard", seed: "family-1", index: 4 });
const b = generateExercise({ skillId: "g7-integer-add-sub", band: "standard", seed: "family-1", index: 4 });
assert.deepEqual(a, b);
assert.match(a.id, /^gx:g7-integer-add-sub:standard:/);
```

- [ ] **Step 2: Define skill constraints in protected JSON**

The file contains the eight exact IDs, labels, allowed bands, operand bounds, step limits, answer types, and explanation templates frozen in the contract. It contains no executable code.

- [ ] **Step 3: Implement seeded generation**

Use a repository-owned integer PRNG in `exercise-rng.js`; never use `Math.random()` in Core. Generate candidates, validate exact answers and bounds, and derive `exercise_id` from the normalized generator inputs plus checksum.

- [ ] **Step 4: Add 1,000-case invariant tests per skill/band**

Assert no zero divisor, no unsafe integer, canonical simplest fraction, allowed step count, correct sign, nonempty three-tool explanations, and no duplicate exercise within one 10-question session seed.

- [ ] **Step 5: Pin precedence cases**

Tests must produce and independently validate both `(-3)^2 = 9` and `-3^2 = -9`; formatting must not collapse parentheses.

- [ ] **Step 6: Run and commit**

```bash
node --test test/grade7-rational-generator.test.js
git add content/skills src/core/exercise-rng.js src/core/skill-catalog.js src/core/grade7-rational-generator.js test/grade7-rational-generator.test.js
git commit -m "feat: generate grade 7 rational exercises"
```

### Task 6: Add signed answer judging and inputs

**Files:**
- Modify: `src/core/answer.js`
- Create: `src/core/signed-fraction-fields.js`
- Modify: `app/pages/train/flow.js`
- Modify: `app/components/Keypad.jsx`
- Create: `app/components/SignedFractionFields.jsx`
- Modify: `app/components/AnswerBox.jsx`
- Modify: `app/platform/h5/index.js`
- Test: `test/signed-answer.test.js`
- Modify: `test/xp-shared-ui.test.js`

**Interfaces:**
- Produces answer types `signed_integer` and `signed_fraction_fields` and flow methods `toggleSign()` plus signed field state.

- [ ] **Step 1: Write judging tests**

```js
assert.equal(judgeAnswer({ answer_type: "signed_integer", canonical_answer: "-7" }, "-07").kind, "correct");
assert.equal(judgeAnswer({ answer_type: "signed_fraction_fields", canonical_answer: "-1/2" }, "-2/4").kind, "needs_simplification");
assert.equal(judgeAnswer({ answer_type: "signed_fraction_fields", canonical_answer: "0" }, "0/9").kind, "correct");
```

- [ ] **Step 2: Implement sign-normalized parsing**

Accept a single leading sign on the whole rational. Reject a sign in the denominator field. Empty, `-`, and denominator zero are no-attempt states.

- [ ] **Step 3: Add the on-screen `±` key and H5 `-` key**

`Keypad` receives `signKey` separately from `extraKey`; it must not displace delete or submit. H5 hardware handler maps both `-` and numpad subtract to `toggle-sign`. Mini programs rely only on the visible key.

- [ ] **Step 4: Add shared UI flow tests**

Exercise negative integer and fraction entry entirely with on-screen actions, physical keyboard on H5, erase, sign toggle after digits, empty sign submit, denominator zero, simplification, correct recording, and pause/resume.

- [ ] **Step 5: Run and commit**

```bash
node --test test/signed-answer.test.js test/xp-shared-ui.test.js
git add src/core app test
git commit -m "feat: support signed rational answers"
```

### Task 7: Add skill sessions and state v4 migration

**Files:**
- Create: `src/core/skill-session.js`
- Modify: `src/core/migrate.js`
- Modify: `src/core/store.js`
- Modify: `app/pages/train/flow.js`
- Modify: `app/pages/train/intent.js`
- Create: `test/fixtures/state-v3-grade7-empty.json`
- Test: `test/migration-v4.test.js`
- Test: `test/skill-session.test.js`

**Interfaces:**
- Produces v4 `skills[skill_id] = { status, attempts, schedule }` and `activeSkillSession` separate from existing `relations` and `activeSession`.
- Produces `startSkillSession`, `submitSkillAnswer`, `finishSkillSession` without changing relation-session signatures.

- [ ] **Step 1: Pin v3→v4 preservation**

Deep-compare every existing learner field, relation, attempt, schedule, session, preference, and result after migration; only add `skills: {}` and `activeSkillSession: null`.

- [ ] **Step 2: Implement one-version migration**

Never regenerate `learner_id`; never recompute existing mastery; unknown future versions remain write-protected.

- [ ] **Step 3: Implement deterministic skill sessions**

A 10-question session stores generator coordinates, not copied curriculum explanations. Resume regenerates the same current exercise and never advances on an unrecorded submission.

- [ ] **Step 4: Define skill evidence**

Attempts store `{ exercise_id, band, outcome, normalized, day, elapsedMs, inputMode }`. Initial mastery labels may reuse `unpracticed|learning|stable|shaky`, but computation occurs in `skill-session.js`; relation mastery functions remain unchanged.

- [ ] **Step 5: Test resume and coexistence**

Cover relation session resume after migration, skill session resume, no cross-write between `relations` and `skills`, wrong reappearance within the same skill, and a fresh device writing v4 directly.

- [ ] **Step 6: Run and commit**

```bash
node --test test/migration-v4.test.js test/skill-session.test.js test/migration-v3.test.js
git add src/core app/pages/train test
git commit -m "feat: add versioned skill practice state"
```

### Task 8: Expose Grade 7 practice without breaking the eight-domain grid

**Files:**
- Modify: `src/core/practice-groups.js`
- Modify: `app/pages/explore/index.jsx`
- Modify: `app/pages/models.js`
- Modify: `app/pages/train/intent.js`
- Modify: `app/app.css`
- Test: `test/xp-pages.test.js`
- Test: `test/fb-specialist.test.js`

**Interfaces:**
- Consumes: `skillCatalog()` and `startSkillSession`.
- Produces: a separate “七年级有理数” skill section; existing eight Fact Memory cards remain unchanged.

- [ ] **Step 1: Pin the old grid**

Existing tests continue to assert exactly eight fact-domain cards and their IDs/assets. Add a new assertion that the Grade 7 section contains exactly the eight skill IDs and is not counted as a fact domain.

- [ ] **Step 2: Add skill selection and confirmation**

Each skill card shows label, band, and skill status; selecting it opens a confirmation screen and passes `intent=start-skill&skill={skillId}&band={band}` using URL-encoded runtime values.

- [ ] **Step 3: Connect the training flow**

The page chooses relation or skill orchestration from the intent, but renders one shared question/feedback/pause/end component tree.

- [ ] **Step 4: Run all learning tests**

```bash
npm test
npm run check:atlas
npm run sync-content
git diff --exit-code src/core/catalog-data.js
```

Expected: all existing tests plus new Atlas/Grade 7 tests pass.

- [ ] **Step 5: Commit and stop at Curriculum + Architecture Gate**

```bash
git add src app content test docs/curriculum docs/architecture
git commit -m "feat: deliver grade 7 rational practice foundation"
```
