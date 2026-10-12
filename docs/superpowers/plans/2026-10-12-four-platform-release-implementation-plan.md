# Four-Platform Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce independently verified H5, WeChat, Douyin, and Alipay artifacts from one shared learning/UI codebase and stop at an explicit Owner release decision.

**Architecture:** Add Taro 4.3.0 `tt` and `alipay` plugins, implement thin platform adapters beside existing H5/WeChat adapters, and run the same scripted critical path against every build. Status records distinguish build, tool, device, submission, and public availability.

**Tech Stack:** Taro 4.3.0, React 18, `@tarojs/plugin-platform-tt`, `@tarojs/plugin-platform-alipay`, platform developer tools, Node/Playwright checks where supported.

**Spec:** `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`

## Global Constraints

- One Core and one shared UI; no `pages-tt`, `pages-alipay`, or duplicated learning logic.
- Platform implementations live only under `app/platform/` and platform project/config files.
- The target build directories are `dist/h5`, `dist/weapp`, `dist/tt`, and `dist/alipay`.
- Platform credentials, app IDs, secrets, signing material, and review accounts never enter Git.
- `BUILD_VERIFIED` is not `TOOL_VERIFIED`, `DEVICE_ACCEPTED`, `SUBMITTED`, or `PUBLIC`.
- Owner retains release authority; an implementer may build and test but not claim publication.

## Review Focus

- Safe-area insets that are missing, malformed, or zero must degrade to zero padding without hiding actions.
- Mini-program storage failures or corrupt JSON must remain write-protected and must not erase learner history.
- Platform lifecycle interruptions during correct feedback/principle viewing must neither double-advance nor double-record.
- Runtime packages must stay within each platform's package limit and exclude protected design masters.
- A tool-only screenshot cannot satisfy real-device accessibility or touch acceptance.

---

### Task 1: Freeze the platform capability and release-status contracts

**Files:**
- Modify: `docs/architecture/01_platform_capability_matrix.md`
- Create: `docs/governance/four-platform-release-gate.md`
- Modify: `docs/decisions/02_cross_platform_framework.md`

**Interfaces:**
- Produces: one row per capability/platform with `verified|fallback|unsupported`, and the five release statuses.

- [ ] **Step 1: Re-test and record the H5/WeChat baseline**

Record exact commit, commands, build paths, developer-tool versions, device/OS, and critical-path result. Update the old “technical hypothesis” wording only where current evidence proves it.

- [ ] **Step 2: Define Douyin/Alipay fallbacks before implementation**

For storage, audio, lifecycle, safe area, navigation, image formats, share, export, print, reduced motion, and physical keyboard, specify the baseline and fallback. Print remains H5-only; a mini program must use preview/share/save language.

- [ ] **Step 3: Freeze truthful status transitions**

Each platform record contains `status`, `commit`, `artifact`, `build_command`, `tool_evidence`, `device_evidence`, `submission_id`, `public_url_or_version`, `known_limits`, and `rollback`.

- [ ] **Step 4: ChatGPT Architecture Gate and Owner approval**

Stop if a platform limitation would require changing Core or shared learning semantics.

### Task 2: Add Taro platform plugins and isolated outputs

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `config/index.js`
- Create: `project.tt.json.example`
- Create: `project.alipay.json.example`
- Test: `test/xp-architecture.test.js`

**Interfaces:**
- Produces scripts `build:tt`, `build:alipay`, `dev:tt`, `dev:alipay`.

- [ ] **Step 1: Write architecture assertions**

```js
assert.equal(pkg.dependencies["@tarojs/plugin-platform-tt"], "4.3.0");
assert.equal(pkg.dependencies["@tarojs/plugin-platform-alipay"], "4.3.0");
assert.match(pkg.scripts["build:tt"], /taro build --type tt/);
assert.match(pkg.scripts["build:alipay"], /taro build --type alipay/);
```

- [ ] **Step 2: Install exact matching plugins**

```bash
npm install --save-exact @tarojs/plugin-platform-tt@4.3.0 @tarojs/plugin-platform-alipay@4.3.0
```

Do not upgrade unrelated Taro packages in this task.

- [ ] **Step 3: Add scripts and configuration**

```json
"build:tt": "taro build --type tt",
"build:alipay": "taro build --type alipay",
"dev:tt": "taro build --type tt --watch",
"dev:alipay": "taro build --type alipay --watch"
```

Keep `outputRoot: dist/${TARO_ENV}`. Example project files contain no real app ID or credential.

- [ ] **Step 4: Run plugin-resolution builds**

```bash
npm run build:tt
npm run build:alipay
```

Expected: builds reach platform resolution; missing adapters may fail with the repository's explicit fallback error, proving the plugins are active.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json config project.tt.json.example project.alipay.json.example test/xp-architecture.test.js
git commit -m "build: add douyin and alipay targets"
```

### Task 3: Implement thin Douyin and Alipay adapters

**Files:**
- Create: `app/platform/current.tt.js`
- Create: `app/platform/current.alipay.js`
- Create: `app/platform/douyin/index.js`
- Create: `app/platform/douyin/store.js`
- Create: `app/platform/douyin/theme-assets.js`
- Create: `app/platform/alipay/index.js`
- Create: `app/platform/alipay/store.js`
- Create: `app/platform/alipay/theme-assets.js`
- Create: `app/platform/mini/shared.js`
- Test: `test/platform-adapters.test.js`
- Modify: `test/xp-architecture.test.js`

**Interfaces:**
- Each current file exports the same interface as H5/WeChat: `platformName`, `getStore`, `createCue`, `monotonicNow`, `useScreenLifecycle`, `useHardwareKeys`, `safeArea`, `motionClass`, `navigate`, `useRouteParams`, `printing`, `themeAssets`.

- [ ] **Step 1: Write interface-parity tests**

Statically import/mock each adapter and compare exported keys. Scan Core/shared UI for `wx`, `tt`, `my`, `window`, and `document` leaks using the existing architecture test.

- [ ] **Step 2: Extract only truly shared mini-program helpers**

`mini/shared.js` may normalize safe-area values, query strings, no-op printing, and storage-result handling. Hooks and platform globals remain in named adapters; do not create a service locator in Core.

- [ ] **Step 3: Implement Douyin**

Use the `tt` platform global only inside `app/platform/douyin/`. Storage reads/writes the same v4 JSON contract/key; audio failure becomes silent; lifecycle and navigation use Taro hooks/APIs; missing safe-area values return `0px`.

- [ ] **Step 4: Implement Alipay**

Use the `my` platform global only inside `app/platform/alipay/` with the same contract and fallbacks. Alipay-specific return shapes are normalized before reaching shared code.

- [ ] **Step 5: Reuse approved mini-program PNG assets**

Both theme asset modules point to runtime-approved PNGs. Do not copy design masters or introduce another brand.

- [ ] **Step 6: Run and commit**

```bash
node --test test/platform-adapters.test.js test/xp-architecture.test.js
npm run build:tt
npm run build:alipay
git add app/platform test
git commit -m "feat: add douyin and alipay platform adapters"
```

### Task 4: Generalize package and smoke checks

**Files:**
- Create: `scripts/platform-package-check.mjs`
- Create: `scripts/platform-smoke-model.mjs`
- Modify: `scripts/weapp-package-check.mjs` to call shared logic or retire it with a compatibility wrapper
- Modify: `package.json`
- Test: `test/platform-package.test.js`

**Interfaces:**
- Produces `check:package:h5|weapp|tt|alipay` and `check:packages`.

- [ ] **Step 1: Write a fixture-driven package test**

Check required pages, theme manifest assets, absence of design masters/source SVG where unsupported, no source maps containing protected content, no platform-global leak into other targets, and configured size limits.

- [ ] **Step 2: Implement target descriptors**

```js
export const TARGETS = {
  h5: { root: "dist/h5", print: true },
  weapp: { root: "dist/weapp", print: false },
  tt: { root: "dist/tt", print: false },
  alipay: { root: "dist/alipay", print: false }
};
```

Package-size limits come from the frozen capability contract and are printed with measured bytes; do not guess a limit in code comments.

- [ ] **Step 3: Add scripts**

```json
"check:package:h5": "node scripts/platform-package-check.mjs h5",
"check:package:weapp": "node scripts/platform-package-check.mjs weapp",
"check:package:tt": "node scripts/platform-package-check.mjs tt",
"check:package:alipay": "node scripts/platform-package-check.mjs alipay",
"check:packages": "node scripts/platform-package-check.mjs all"
```

- [ ] **Step 4: Run all builds and package checks**

```bash
npm run build:h5
npm run build:weapp
npm run build:tt
npm run build:alipay
npm run check:packages
```

- [ ] **Step 5: Commit**

```bash
git add scripts test package.json
git commit -m "test: verify all four client packages"
```

### Task 5: Execute identical critical-path checks

**Files:**
- Create: `docs/releases/checklists/h5.md`
- Create: `docs/releases/checklists/weapp.md`
- Create: `docs/releases/checklists/tt.md`
- Create: `docs/releases/checklists/alipay.md`
- Modify/Create platform automation scripts only where developer tools expose a stable automation interface

**Interfaces:**
- Consumes: four built packages.
- Produces one evidence record per platform with the same scenario IDs.

- [ ] **Step 1: Define the shared scenario list**

```text
S01 fresh open and local learner creation
S02 existing v3 history migrates to v4
S03 daily fact practice correct and wrong
S04 Grade 7 negative-integer answer
S05 Grade 7 signed-fraction answer and simplification nudge
S06 correct → 看原理 → three tools → continue
S07 wrong → three tools → next → reappearance
S08 pause/background/resume with no double record
S09 knowledge map mapped-only vs released entry
S10 progress/mistake/print-preview semantics
S11 safe area, narrow viewport, large text/zoom fallback
S12 offline reopen with existing local package/data
```

- [ ] **Step 2: Automate H5 and supported developer-tool paths**

Reuse shared scenario seeds and assert learner-state checksums after each scenario. Automation evidence never substitutes for device acceptance.

- [ ] **Step 3: Execute developer-tool checks**

WorkBuddy runs WeChat Developer Tools; Doubao/support runs Douyin Developer Tools; the Owner-designated executor runs Alipay Developer Tools. Record tool version, emulator/device, artifact SHA, and failures.

- [ ] **Step 4: Execute real-device acceptance**

At minimum one representative iOS and one Android path across the mini-program set where accounts permit. Record untested combinations as `NOT_RUN`, not PASS.

- [ ] **Step 5: Commit evidence templates/results**

```bash
git add docs/releases/checklists scripts
git commit -m "test: record four-platform acceptance evidence"
```

### Task 6: Prepare release artifacts and rollback without publishing

**Files:**
- Create: `docs/releases/first-launch-acceptance.md`
- Create: `docs/releases/release-manifest.json`
- Create: `scripts/create-release-manifest.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces a content-addressed manifest with commit, license cutover, build checksums, package sizes, and statuses.

- [ ] **Step 1: Generate checksums**

`scripts/create-release-manifest.mjs` reads Git and the frozen contract records and writes real SHAs and directory checksums. Its output shape is:

```js
const manifest = {
  commit: git("rev-parse", "HEAD"),
  license_cutover: readRecordedSha("docs/legal/03_cutover_record.md"),
  content_contract: git("log", "-1", "--format=%H", "--", "docs/curriculum/11_grade7_rational_skills_contract.md"),
  artifacts: Object.fromEntries(["h5", "weapp", "tt", "alipay"].map((target) => [
    target,
    { path: `dist/${target}`, sha256: hashDirectory(`dist/${target}`), status: "BUILD_VERIFIED" }
  ]))
};
```

The committed JSON must contain real 40-character SHAs and 64-character SHA-256 values; the generator fails if a record or build directory is missing.

- [ ] **Step 2: Record rollback**

H5 keeps the previous immutable artifact/commit. Each mini program records the last public version and the platform rollback/re-review procedure. Do not store credentials.

- [ ] **Step 3: Run the final non-public release gate**

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

Expected: all exit 0; acceptance record distinguishes automated, tool, and device evidence.

- [ ] **Step 4: Stop for Owner merge/release authority**

At this point Cursor may prepare/maintain the PR and Grok Bot may supply its title/body. No deployment, platform submission, merge, tag, or public announcement occurs until Owner explicitly accepts the release candidate.

## Official platform references used by this plan

- [Taro 4 implementation details and official platform plugins](https://docs.taro.zone/docs/implement-note)
- [Taro 4 cross-platform environment names](https://docs.taro.zone/docs/envs/)
- [Taro 4 platform-specific project configuration files](https://docs.taro.zone/docs/project-config)
- [Taro 4 isolated multi-platform output directories](https://docs.taro.zone/docs/envs-debug)
