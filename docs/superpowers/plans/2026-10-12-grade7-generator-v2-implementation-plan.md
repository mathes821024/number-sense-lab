# Grade 7 Generator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand all eight Grade 7 rational-number skills to the frozen three-band coverage matrix while preserving every v1 coordinate and exercise identity.

**Architecture:** Keep the current generator as the immutable v1 path. Add an explicit v2 dispatcher and persist `generator_version: 2` on new coordinates; missing version remains v1. Template tags make coverage testable without changing student-facing identity semantics.

**Tech Stack:** Node.js ESM, exact rational arithmetic, node:test, Taro shared training flow.

**Spec:** `docs/curriculum/12_first_release_content_completion_contract.md`

## Global Constraints

- V1 output is byte-for-byte frozen for every existing coordinate.
- Existing active skill sessions and reappearance coordinates resume without migration or clearing.
- V2 continues final-answer judging only and uses exact rational arithmetic.
- Do not add skill IDs, change mastery semantics, redesign UI, deploy, merge, or submit a Mini Program.

## Review Focus

- Missing `generator_version` must always dispatch to v1.
- V2 version must participate in checksum identity without changing v1 payload order.
- Division templates must never produce a zero divisor or approximate answer.
- Fraction powers and mixed expressions must stay inside safe integers and configured step limits.
- Wrong-answer reappearance must regenerate the identical v2 exercise after refresh.

---

### Task 1: Freeze v1 with broad golden evidence

**Files:**
- Modify: `test/grade7-rational-generator.test.js`
- Create: `test/fixtures/grade7-v1-golden.json`

**Interfaces:**
- Consumes: current `generateExercise({ skillId, band, seed, index })`.
- Produces: a checked-in golden set for all 24 skill-band pairs and representative indices.

- [ ] **Step 1: Generate a fixture** from the current `a169920d3c8bd915a175b03d889a889ce2e03f90` implementation for indices `0..19` with seed `v1-golden`, storing prompt, canonical answer, operands, explanations, checksum, and ID.
- [ ] **Step 2: Add a test** that passes no version and deep-compares every fixture row.
- [ ] **Step 3: Run** `node --test test/grade7-rational-generator.test.js`; expect PASS before v2 work.

### Task 2: Add backward-compatible versioned coordinates

**Files:**
- Modify: `src/core/skill-session.js`
- Modify: `src/core/grade7-rational-generator.js`
- Modify: `test/skill-session.test.js`
- Modify: `test/grade7-rational-generator.test.js`

**Interfaces:**
- Consumes: optional `generatorVersion` at generator boundary and optional `generator_version` in persisted coordinates.
- Produces: v1 default dispatch and v2 new-session coordinates.

- [ ] **Step 1: Write failing tests** proving old coordinates omit the field and regenerate v1, while newly started sessions contain `generator_version: 2` in every original and reappearance coordinate.
- [ ] **Step 2: Run** the two tests and confirm the v2 assertions fail.
- [ ] **Step 3: Split** the current dispatcher into an immutable v1 path and a version switch. Include version only in the v2 checksum payload; preserve v1 key order and RNG seed exactly.
- [ ] **Step 4: Update** `startSkillSession` so new sessions use v2. `generate(coordinate)` must map absent version to 1.
- [ ] **Step 5: Rerun** both tests and the v1 golden test.

### Task 3: Implement the v2 template matrix

**Files:**
- Create: `src/core/grade7-rational-generator-v2.js`
- Modify: `src/core/grade7-rational-generator.js`
- Modify: `test/grade7-rational-generator-v2.test.js`

**Interfaces:**
- Consumes: frozen skill catalog bounds, exact rational helpers, coordinate and deterministic RNG.
- Produces: v2 exercises with `operands.template` identifying one frozen template family.

- [ ] **Step 1: Write failing table-driven tests** for every cell of spec section 4.2, including zero, positive/negative signs, same/unlike denominators, exact division, parentheses, outside signs, fractional powers, and mixed-operation limits.
- [ ] **Step 2: Run** `node --test test/grade7-rational-generator-v2.test.js`; expect missing-module failures.
- [ ] **Step 3: Implement** one focused generator per existing skill ID. Use integer/rational operations only; never evaluate prompt text or JavaScript arithmetic expressions.
- [ ] **Step 4: Add** `operands.template` and derive direct/structure/estimate explanations from the chosen template and operands.
- [ ] **Step 5: Rerun** the v2 test and confirm all canonical answers are reduced, denominators positive, and numeric fields safe integers.

### Task 4: Prove distribution and session persistence

**Files:**
- Modify: `test/grade7-rational-generator-v2.test.js`
- Modify: `test/skill-session.test.js`
- Modify: `test/train-flow.test.js`

**Interfaces:**
- Consumes: v2 generator and versioned coordinates.
- Produces: coverage evidence for all 24 skill-band pairs.

- [ ] **Step 1: Add coverage tests** over seed `v2-coverage` and indices `0..239`, asserting every required template tag appears for its skill-band cell.
- [ ] **Step 2: Add invariant tests** over 1,000 exercises per skill-band pair for exact answers, no zero divisor, bounds, step limits, three explanations, and deterministic IDs.
- [ ] **Step 3: Add persistence tests** serializing midway through a v2 session with a pending wrong reappearance, then restoring and deep-comparing the current exercise and remaining queue.
- [ ] **Step 4: Run** the three test files and fix only failures inside the frozen matrix.

### Task 5: Full verification and evidence

**Files:**
- Modify only if a failing test identifies an in-scope defect.

- [ ] **Step 1: Run** `npm test`.
- [ ] **Step 2: Run** `npm run check:atlas` and `npm run sync-content`; confirm no unrelated catalog identity diff.
- [ ] **Step 3: Run** `npm run build:h5`, `npm run build:weapp`, and `npm run check:weapp-package`.
- [ ] **Step 4: Smoke at 375px** one session in every skill, covering foundation, standard, and transfer across the set; include fraction power, three-term integer arithmetic, and mixed exact division.
- [ ] **Step 5: Report** branch/SHA, files, v1 golden result, v2 coverage counts, commands, pass/fail/skip/unverified items, console errors and 404s, and confirm no deploy/merge occurred.
