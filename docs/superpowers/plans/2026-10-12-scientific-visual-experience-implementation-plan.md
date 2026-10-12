# Scientific Visual Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing interface feel like a calm, age-flexible mathematics laboratory by exposing relationships, levels, and reasoning tools while reducing mascot frequency and childish praise.

**Architecture:** Add four accessible, platform-neutral math-visual primitives and one shared reasoning panel. Knowledge-map and feedback screens consume data from Atlas/explanation interfaces; animation is optional presentation, never learning logic.

**Tech Stack:** React 18, Taro `View`/`Text`, shared CSS, semantic theme tokens, Node component/model tests, browser and mini-program viewport checks.

**Spec:** `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`

## Global Constraints

- Do not change judging, mastery, scheduling, mistake, print, or migration semantics in visual tasks.
- No runtime SVG dependency for shared scientific components; use Views/CSS/text so all four clients have a baseline.
- Every visual relationship has a linear text alternative.
- Reduced-motion mode shows the final state without transition.
- Mascot is absent from ordinary training, correct, and wrong feedback screens.
- “今日训练” remains the sole primary home action.
- Correct feedback offers principle access without recording or judging twice.

## Review Focus

- A long negative-fraction expression must wrap without moving submit below the usable viewport.
- “看原理” pressed immediately before the timer fires must cancel one timer and open one panel, with no double advance.
- A relation chain with missing optional neighbors must remain readable and have no dangling line.
- At 200% browser zoom, map layers become a linear list and retain all labels/actions.
- With images blocked and reduced motion enabled, the whole practice and explanation path remains usable.

---

### Task 1: Freeze the visual and explanation contracts

**Files:**
- Create: `docs/ux/06_reasoning_tools_and_correct_explanation.md`
- Create: `docs/ui/09_scientific_visual_language.md`
- Modify: `docs/ui/05_visual_system_v03.md` with a supersession note only

**Interfaces:**
- Consumes: `Exercise.explanations` and legacy `hook/pattern/frames`.
- Produces: exact component hierarchy, copy, motion, mascot frequency, focus order, and responsive states.

- [ ] **Step 1: Define whole-page states**

Include phone and desktop layouts for home, topic selection, Grade 7 selection, knowledge map, question, correct compact feedback, expanded principle, wrong feedback, and end screen.

- [ ] **Step 2: Lock feedback copy**

Use these baseline labels:

```text
Correct title: 正确
Correct relation status: 关系成立
Correct quiet action: 看原理
Expanded-panel action: 继续
Wrong hint heading: 先看这条关系
Reasoning tabs: 直接算 / 结构算 / 估算检查
```

No “太棒了”“真聪明” or fixed teacher-like praise in the baseline theme.

- [ ] **Step 3: Doubao provides the asset decomposition**

The manifest says which visuals are CSS, runtime PNG, mascot, icon, decor, and design-only master. A new picture cannot carry mathematical meaning without a text/CSS fallback.

- [ ] **Step 4: ChatGPT runs Visual Asset Gate; Owner approves the north star**

Do not begin Tasks 2–7 until the accepted mockup and contract commit are identified.

### Task 2: Normalize explanation data

**Files:**
- Create: `src/core/explanations.js`
- Test: `test/explanations.test.js`

**Interfaces:**
- Produces: `explanationsFor(item) -> { direct, structure, estimate }` where each tool is `{ available, summary, steps[] }`.

- [ ] **Step 1: Write legacy compatibility tests**

```js
const tools = explanationsFor(existingRelation);
assert.equal(tools.direct.available, true);
assert.equal(tools.structure.summary, existingRelation.hook);
assert.deepEqual(tools.structure.steps.map((s) => s.title), existingRelation.frames.map((f) => f.title));
assert.equal(tools.estimate.summary, existingRelation.pattern.check);
```

- [ ] **Step 2: Verify failure, then implement the adapter**

Explicit `item.explanations` wins. Otherwise map relation/frames to direct, hook/frames to structure, and pattern.check/family to estimate. Empty tools return `available: false`, not invented copy.

- [ ] **Step 3: Run and commit**

```bash
node --test test/explanations.test.js
git add src/core/explanations.js test/explanations.test.js
git commit -m "feat: normalize mathematical explanations"
```

### Task 3: Build accessible scientific primitives

**Files:**
- Create: `app/components/science/RelationChain.jsx`
- Create: `app/components/science/NumberLine.jsx`
- Create: `app/components/science/DecompositionSteps.jsx`
- Create: `app/components/science/FormulaTransform.jsx`
- Create: `app/components/science/model.js`
- Modify: `app/app.css`
- Test: `test/science-visuals.test.js`

**Interfaces:**
- Every component consumes plain serializable props and renders `aria-label`/visible linear fallback from `science/model.js`.

- [ ] **Step 1: Write pure-model tests**

```js
assert.equal(numberLineText({ from: -7, to: 5, delta: 12 }), "从 -7 向右移动 12，到 5");
assert.equal(relationChainText([{ text: "-3/4" }, { relation: "+ 5/6" }, { text: "1/12" }]), "-3/4，经过 + 5/6，得到 1/12");
```

- [ ] **Step 2: Implement CSS/View primitives**

Use ordinary `View` borders for lines/ticks/arrows, token colors, and ordered DOM. When motion is low, omit staged classes and render final positions immediately.

- [ ] **Step 3: Test partial and extreme data**

Cover one-node chains, negative ranges crossing zero, equal endpoints, long fraction labels, 10 transformation steps, and unavailable animation.

- [ ] **Step 4: Run and commit**

```bash
node --test test/science-visuals.test.js
git add app/components/science app/app.css test/science-visuals.test.js
git commit -m "feat: add accessible math laboratory visuals"
```

### Task 4: Add the shared reasoning-tools panel

**Files:**
- Create: `app/components/ReasoningTools.jsx`
- Modify: `app/components/WrongFeedback.jsx`
- Modify: `app/app.css`
- Test: `test/xp-pages.test.js`

**Interfaces:**
- Consumes: normalized `{ direct, structure, estimate }` and optional scientific visual descriptor.
- Produces: one tab-like control with only applicable tools enabled.

- [ ] **Step 1: Pin focus and labels**

Test DOM/model order: heading, Direct, Structure, Estimate, content, Continue/Next. Disabled tools include a readable “这题不需要” reason and are not clickable.

- [ ] **Step 2: Replace duplicate wrong-feedback expansions**

Remove separate “看看这个规律/看看这几步” states and use one `ReasoningTools`. The relation remains the largest content; no mascot or question-mark decor appears.

- [ ] **Step 3: Verify wrong evidence is unchanged**

Opening tools does not write learner state; “下一题” still performs the existing single advance.

- [ ] **Step 4: Run and commit**

```bash
node --test test/xp-pages.test.js test/xp-shared-ui.test.js
git add app/components app/app.css test
git commit -m "feat: unify direct structure and estimate tools"
```

### Task 5: Allow principle viewing after a correct answer

**Files:**
- Modify: `app/components/CorrectFeedback.jsx`
- Modify: `app/pages/train/index.jsx`
- Modify: `app/pages/train/flow.js`
- Modify: `app/app.css`
- Test: `test/xp-shared-ui.test.js`

**Interfaces:**
- Adds flow states `correct` and `correct_explanation`, plus `openCorrectExplanation()`.
- `openCorrectExplanation()` returns true once, never writes state, and the page cancels the pending timer.

- [ ] **Step 1: Write the timer-race test**

Use a fake timer/cue harness: submit correct, call `openCorrectExplanation`, fire the old timer callback, assert the same exercise remains and attempt count is one; call Continue, assert one advance.

- [ ] **Step 2: Implement compact correct feedback**

Remove mascot/sparkle and “太棒了”. Show the correct relation, “正确 / 关系成立,” and a visible 44px “看原理” action. Keep an auto-advance interval frozen by the UX contract; clicking the action cancels it.

- [ ] **Step 3: Render reasoning tools in expanded state**

Use the same `ReasoningTools` component as wrong feedback. “继续” advances; Back/Hide lifecycle must not record or judge again.

- [ ] **Step 4: Run and commit**

```bash
node --test test/xp-shared-ui.test.js test/flow.integration.test.js
git add app test
git commit -m "feat: let correct answers open the principle"
```

### Task 6: Turn the knowledge-map placeholder into a real page

**Files:**
- Create: `app/pages/atlas/index.jsx`
- Create: `app/pages/atlas/index.config.js`
- Create: `app/pages/atlas/model.js`
- Modify: `app/app.config.js`
- Modify: `app/pages/explore/index.jsx`
- Modify: `app/app.css`
- Test: `test/atlas-page.test.js`

**Interfaces:**
- Consumes: `loadAtlas`, `atlasLayers`, node status, released entries.
- Produces: layered map/list and navigation to released fact/skill entries only.

- [ ] **Step 1: Write page-model tests**

Assert layer order, status wording, prerequisite summaries, mapped-only disabled actions, and released entry navigation.

- [ ] **Step 2: Add the route and replace “敬请期待”**

The Explore segmented control navigates to `/pages/atlas/index`. Phone layout is a layered list with local `RelationChain`; desktop enhances the same DOM with wider connectors.

- [ ] **Step 3: Add filter controls**

Filters are `基础事实 / 运算关系 / 策略与检验 / 迁移方向` and `已发布 / 已契约 / 已映射`. They alter presentation only; they never write progress.

- [ ] **Step 4: Test keyboard/read-screen behavior**

Every node has a heading/label, status text, prerequisite text, and action name. Hidden connectors are `aria-hidden`; information remains in text.

- [ ] **Step 5: Run and commit**

```bash
node --test test/atlas-page.test.js test/xp-pages.test.js
git add app/pages/atlas app/pages/explore app/app.config.js app/app.css test
git commit -m "feat: expose the layered knowledge map"
```

### Task 7: Reduce mascot frequency and harden responsive accessibility

**Files:**
- Modify: `app/pages/home/index.jsx`
- Modify: `app/pages/explore/index.jsx`
- Modify: feedback/end/empty components that currently render mascots
- Modify: `app/app.css`
- Modify: `scripts/viewport-cases.mjs`
- Create: `scripts/h5-accessibility-check.mjs`
- Modify: `scripts/weapp-practice-grid-check.mjs`
- Modify: `package.json`
- Test: `test/theme.test.js`

**Interfaces:**
- Produces: `npm run check:a11y:h5` and expanded small/safe-area cases.

- [ ] **Step 1: Pin mascot slots by screen**

Tests allow welcome mascot only on Home and at most one edge companion on Explore/Atlas. Training, correct, wrong, keypad, reasoning panel, and progress rows must contain no mascot slot.

- [ ] **Step 2: Add viewport cases**

Automate 320×568, 375×667, 390×844, 768×1024, 1366×768, and H5 200% zoom. Test the longest signed-fraction prompt, open reasoning panel, Atlas layer, bottom navigation clearance, and safe-area padding.

- [ ] **Step 3: Add keyboard/focus checks**

H5 check tabs through primary action, topic/skill cards, signed input, submit, principle action, reasoning tools, and continue. Assert visible focus and no keyboard trap.

- [ ] **Step 4: Add read-screen assertions**

Check that math expressions, progress, selected sign, focused numerator/denominator, status, and connector meaning have accessible text; do not claim VoiceOver/TalkBack verification until manually executed.

- [ ] **Step 5: Run the visual gate**

```bash
npm test
npm run build:h5
npm run build:weapp
npm run check:a11y:h5
node scripts/h5-viewport-check.mjs
node scripts/weapp-practice-grid-check.mjs
```

- [ ] **Step 6: Owner/family acceptance and commit**

Record device, OS, viewport, pass/fail, and screenshots for both H5 and WeChat. Then:

```bash
git add app scripts test package.json docs/ux docs/ui
git commit -m "feat: refine the calm scientific learning experience"
```
