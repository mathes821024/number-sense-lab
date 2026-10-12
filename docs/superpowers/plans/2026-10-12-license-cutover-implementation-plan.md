# Layered License Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut future releases from repository-wide MIT to MPL-2.0 software plus protected curriculum, product, brand, and visual assets without rewriting historical rights.

**Architecture:** A machine-readable boundary manifest classifies every tracked release file. Tests fail on unclassified files and on protected source assets leaking into built packages; human-facing LICENSE/NOTICE/content/brand/contribution documents explain the same boundary.

**Tech Stack:** MPL-2.0, Markdown legal notices, JSON boundary manifest, Node test runner, Git history.

**Spec:** `docs/superpowers/specs/2026-10-12-launch-scope-and-grade7-design.md`

## Global Constraints

- Historical MIT commits remain MIT and are identified by the cutover parent SHA.
- MPL applies only to files classified as software; it does not grant rights to teaching content, product design, names, marks, mascots, themes, or design masters.
- Third-party licenses remain controlling for their files.
- Do not use “non-commercial open source” or any custom license while claiming OSI open source.
- Legal text requires qualified-lawyer review before public release.

## Review Focus

- A newly tracked file under an unknown top-level directory must fail classification.
- A renamed protected PNG copied into `dist/*` must still be detected by source path and runtime allowlist.
- The notice must identify the exact cutover parent and cutover commit, not a vague version label.
- External code contributions must be MPL inbound; protected content/brand contributions remain closed until a separate written agreement exists.
- Package metadata and README must not imply the entire repository is MPL/open source.

---

### Task 1: Freeze the file-classification contract

**Files:**
- Create: `license-boundary.json`
- Create: `docs/legal/02_layered_license_design.md`
- Test: `test/license-boundary.test.js`

**Interfaces:**
- Consumes: tracked paths from `git ls-files`.
- Produces: `license-boundary.json` with named category arrays of repository-relative glob patterns; category metadata in the same file supplies `license` and `distributable`.

- [ ] **Step 1: Write a failing classification test**

```js
test("every tracked release file has exactly one license category", () => {
  const files = gitTrackedFiles().filter((p) => !p.startsWith(".git/"));
  for (const file of files) assert.equal(classify(file).length, 1, file);
});
```

- [ ] **Step 2: Run the focused test**

Run: `node --test test/license-boundary.test.js`

Expected: FAIL because `license-boundary.json` does not exist.

- [ ] **Step 3: Add the ordered boundary rules**

The manifest must classify:

```json
{
  "schema_version": 1,
  "software": ["src/**", "app/**", "h5/**", "config/**", "scripts/**", "test/**", "*.cjs", "project*.json", "package.json", "package-lock.json"],
  "protected_content": ["content/**", "docs/curriculum/**", "docs/product/**", "docs/ux/**", "docs/ui/**", "docs/learning/**", "docs/superpowers/specs/**"],
  "protected_brand": ["assets/**", "concept-design/**", "mockups/**", "*.png", "*.webp"],
  "governance": ["AGENTS.md", "docs/governance/**", "docs/architecture/**", "docs/decisions/**", "docs/superpowers/plans/**", "docs/legal/**", "docs/releases/**"],
  "third_party": [],
  "legal": ["LICENSE", "NOTICE.md", "CONTENT_LICENSE.md", "BRAND_POLICY.md", "CONTRIBUTING.md", "license-boundary.json", "README.md", ".gitignore"],
  "category_meta": {
    "software": { "license": "MPL-2.0", "distributable": true },
    "protected_content": { "license": "LicenseRef-NSL-Content", "distributable": false },
    "protected_brand": { "license": "LicenseRef-NSL-Brand", "distributable": false },
    "governance": { "license": "LicenseRef-NSL-Documentation", "distributable": false },
    "third_party": { "license": "SEE-THIRD-PARTY-NOTICES", "distributable": true },
    "legal": { "license": "SEE-FILE", "distributable": true }
  }
}
```

Add a sibling `category_meta` object mapping each category to its governing license document and distributable flag. Implementation must use repository-relative glob matching and fail on zero or multiple categories. If a current file matches two categories, narrow the patterns; do not accept “first match wins.”

- [ ] **Step 4: Document the classification and historical evidence**

`02_layered_license_design.md` must record the original MIT root commit `643d8f1`, the pre-cutover main SHA, public branches containing brand assets, known commit authors, and the exact exclusions from MPL.

- [ ] **Step 5: Run and commit**

```bash
node --test test/license-boundary.test.js
git add license-boundary.json docs/legal/02_layered_license_design.md test/license-boundary.test.js
git commit -m "test: classify repository license boundaries"
```

### Task 2: Install the legal documents

**Files:**
- Modify: `LICENSE`
- Create: `NOTICE.md`
- Create: `CONTENT_LICENSE.md`
- Create: `BRAND_POLICY.md`
- Create: `CONTRIBUTING.md`
- Test: `test/license-boundary.test.js`

**Interfaces:**
- Consumes: `license-boundary.json`, pre-cutover parent SHA, legal owner name supplied at the legal Gate.
- Produces: complete layered-license disclosure.

- [ ] **Step 1: Extend tests for required legal markers**

```js
assert.match(read("LICENSE"), /Mozilla Public License Version 2\.0/);
assert.match(read("NOTICE.md"), /historical versions.*MIT/is);
assert.match(read("CONTENT_LICENSE.md"), /All Rights Reserved/);
assert.match(read("BRAND_POLICY.md"), /does not grant.*trademark/is);
assert.match(read("CONTRIBUTING.md"), /MPL-2\.0/);
```

- [ ] **Step 2: Verify failure against the current MIT repository**

Run: `node --test test/license-boundary.test.js`

Expected: FAIL on the MPL marker and missing documents.

- [ ] **Step 3: Replace the root license with the unmodified official MPL-2.0 text**

Source: `https://www.mozilla.org/media/MPL/2.0/index.815ca599c9df.txt` or the SPDX canonical `MPL-2.0` text. Do not add content/brand exceptions inside the standard license; explain scope in NOTICE and the boundary manifest.

- [ ] **Step 4: Write NOTICE with exact scope and cutover**

Immediately before staging the legal files, run `git rev-parse HEAD` and paste that full 40-character SHA into both cutover sentences. The opening must state:

```text
Number Sense Lab uses layered licensing beginning after the last repository-wide MIT commit identified below.
Software files classified as "software" in license-boundary.json are licensed under MPL-2.0.
Teaching content, product/UX/UI documents, knowledge maps, names, mascots, themes, and visual assets are not licensed under MPL-2.0; see CONTENT_LICENSE.md and BRAND_POLICY.md.
The last repository-wide MIT commit is the exact 40-character SHA recorded in docs/legal/03_cutover_record.md. Repository versions through that commit were distributed under the MIT License then present in those versions. That historical permission is not revoked.
```

- [ ] **Step 5: Write protected-content and brand policies**

`CONTENT_LICENSE.md` permits viewing for evaluation but grants no right to reproduce, adapt, distribute, train another commercial content product, or use commercially without written permission. It must explicitly say mathematical facts, methods, and ideas are not claimed as exclusive rights.

`BRAND_POLICY.md` reserves Number Sense Lab/数感训练场, logos, mascots, themes, and trade dress; it permits truthful nominative reference and unmodified screenshots for review/commentary, but forbids implying endorsement or shipping a derivative under confusing branding.

- [ ] **Step 6: Write contribution rules**

Code contributions are MPL-2.0 inbound with DCO sign-off. Do not accept external contributions to protected content or brand paths until a separate written agreement exists. State that a pull request touching those paths will be closed or moved to a rights-review process.

- [ ] **Step 7: Run and commit**

```bash
node --test test/license-boundary.test.js
git add LICENSE NOTICE.md CONTENT_LICENSE.md BRAND_POLICY.md CONTRIBUTING.md test/license-boundary.test.js
git commit -m "legal: adopt layered MPL content and brand licensing"
```

### Task 3: Add SPDX and directory notices

**Files:**
- Modify: software source headers selected by `scripts/license-boundary.mjs`
- Create: `content/README.md`
- Create: `assets/README.md`
- Create: `docs/curriculum/README.md`
- Create: `scripts/license-boundary.mjs`
- Modify: `package.json`
- Test: `test/license-boundary.test.js`

**Interfaces:**
- Consumes: classification manifest.
- Produces: `npm run check:licenses` and human-readable directory boundaries.

- [ ] **Step 1: Add failing SPDX checks**

Test every hand-maintained `.js`, `.jsx`, `.mjs`, and `.cjs` software file for `SPDX-License-Identifier: MPL-2.0`; exclude auto-generated `src/core/catalog-data.js` and generated asset modules, whose generator must emit the header.

- [ ] **Step 2: Implement the checker**

`scripts/license-boundary.mjs` must expose and CLI-run:

```js
export function classifyPath(path, manifest) {}
export function auditTrackedFiles(paths, manifest) {}
export function auditDist(root, manifest) {}
```

The CLI exits non-zero with one line per unclassified, multiply classified, missing-SPDX, or protected-package leak.

- [ ] **Step 3: Add directory notices and SPDX headers**

Each protected README must name the governing document and say that repository visibility is not a license grant. Generated software must obtain its SPDX header from the generator, not a manual patch.

- [ ] **Step 4: Add the package script**

```json
"check:licenses": "node scripts/license-boundary.mjs"
```

- [ ] **Step 5: Run and commit**

```bash
npm run check:licenses
npm test
git add src app h5 config scripts test package.json package-lock.json content/README.md assets/README.md docs/curriculum/README.md
git commit -m "chore: enforce layered license boundaries"
```

### Task 4: Prevent protected-source leakage into packages

**Files:**
- Modify: `scripts/license-boundary.mjs`
- Modify: platform package-check scripts under `scripts/`
- Test: `test/license-boundary.test.js`

**Interfaces:**
- Consumes: built `dist/h5`, `dist/weapp`, `dist/tt`, `dist/alipay` trees.
- Produces: package audit allowing only runtime assets explicitly listed by theme/content runtime manifests.

- [ ] **Step 1: Add a fixture that copies a design master into a fake dist tree**

```js
test("protected design masters cannot leak into a client package", () => {
  copyFixture("concept-design/master.png", "dist/h5/static/master.png");
  assert.throws(() => auditDist(tempRoot, manifest), /protected asset leak/);
});
```

- [ ] **Step 2: Implement the runtime allowlist**

Allow only assets referenced by `assets/themes/*/manifest.json`, content JSON intentionally bundled for runtime, application icons, and third-party files with recorded licenses. Reject `concept-design/`, `mockups/`, `_svg/`, source manifests, and unreferenced masters.

- [ ] **Step 3: Run builds and audits**

```bash
npm run build:h5
npm run build:weapp
npm run check:licenses
```

Expected: pass, with design sources absent from both packages.

- [ ] **Step 4: Commit**

```bash
git add scripts test
git commit -m "test: block protected assets from release packages"
```

### Task 5: Update public metadata and capture the cutover

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `NOTICE.md`
- Create: `docs/legal/03_cutover_record.md`

**Interfaces:**
- Consumes: the reviewed cutover commit and its parent.
- Produces: truthful public metadata and an immutable cutover record.

- [ ] **Step 1: Update README and package metadata**

README may say “the software core is open source under MPL-2.0,” but must immediately link to content and brand exclusions. Set `package.json.license` to `MPL-2.0`; do not imply `content/` or `assets/` are covered.

- [ ] **Step 2: Record exact SHAs after the legal commit exists**

`03_cutover_record.md` and NOTICE must contain `git rev-parse HEAD^` as the last all-MIT parent and the final cutover commit SHA after the record is finalized. If recording the commit's own SHA requires a follow-up documentation commit, state both legal-content commit and record commit explicitly rather than creating a self-referential placeholder.

- [ ] **Step 3: Run the final legal gate**

```bash
npm run check:licenses
npm test
CUTOVER_BASE_SHA="$(git merge-base origin/main HEAD)"
git diff "$CUTOVER_BASE_SHA"...HEAD -- LICENSE NOTICE.md CONTENT_LICENSE.md BRAND_POLICY.md CONTRIBUTING.md license-boundary.json README.md package.json
```

Expected: automated pass plus written lawyer/Owner disposition in `03_cutover_record.md`.

- [ ] **Step 4: Commit and stop at Owner merge Gate**

```bash
git add README.md package.json NOTICE.md docs/legal/03_cutover_record.md
git commit -m "docs: record layered license cutover"
```
