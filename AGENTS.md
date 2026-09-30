# Repository instructions

Number Sense Lab inherits the workspace governance in the parent `AGENTS.md`. On GitHub, this file and [`docs/governance/collaboration.md`](docs/governance/collaboration.md) are the rules agents follow. Documentation authorization and branch hygiene stay in that collaboration document. This file adds only this repository's execution rules.

## Authority

Frozen contracts merged into `main` are authoritative. Conversation instructions may guide work but must not silently override frozen repository contracts.

Implementation must not silently redesign Product, UX, Curriculum, or Architecture contracts.

## Current assignment

- Product, experience, human acceptance, merge, and release: Owner
- Orchestration, Gate Review, and cross-role review: ChatGPT
- Contracts, pull requests, and the professional-role workbench: Cursor
- Curriculum, lessons, and learning content: Kimi
- Visual asset engineering: Doubao
- Primary implementation: Grok Bot
- H5 and WeChat delivery: WorkBuddy
- Douyin Mini Program delivery support: Doubao

Kimi owns lesson design, course design, worked examples, explanation scripts, memory-hook content, learning-content refinement, and instructional sequences. Kimi may propose relation families and learning content. Kimi does not independently change Product, UX, or runtime contracts, and does not own the visual frontend. Visual chains in the content stay teaching material. Their on-screen appearance follows the visual contract.

## Flow

```text
Define → Specify → Freeze → Concentrated Build → ChatGPT Milestone Review → Owner Human Experience Review → Merge / Release
```

Grok Bot delivers the branch, the commits, and a suggested pull-request title and body. Cursor opens and maintains the pull request. Missing pull-request permission is not a build blocker.

## Visual implementation workflow

Number Sense Lab visual work follows the workspace design-to-code pipeline, with these project rules:

1. Owner and family report what real use felt like.
2. ChatGPT sets the whole-page visual direction. An approved mockup is the visual north star.
3. Doubao splits it into CSS versus image, mascot assets, SVG icons, decor, and a theme asset manifest.
4. ChatGPT runs the Visual Asset Gate.
5. Cursor updates the formal UI, UX, and visual contracts.
6. ChatGPT runs the Contract Gate.
7. Grok Bot implements from the contract, the mockup, and the asset pack.
8. ChatGPT runs visual and engineering review.
9. Owner and family check it on real devices.
10. WorkBuddy adapts and releases H5 and WeChat. Doubao supports Douyin Mini Program adaptation and release.

A mockup may upgrade look and ordinary-page experience. It must not silently change learning mechanics. Judging, mastery, mistake semantics, the scheduler, and print semantics stay in the contracts. Future pictures may be placeholders that say 「敬请期待」. A screenshot is not permission to add business logic.

## Theme rule

Themes are semantic and replaceable. The current default is `math-lab` / 澄蓝数学实验室. Later themes may include `magic-academy`, `space`, and `forest`.

A theme may replace colors, background, mascot, icons, decor, motion, and optional sound. It must not replace question logic, judging, mastery, the scheduler, mistake semantics, print semantics, or the learning contract.

Theme-ready does not mean a theme switcher exists in the current build.

## Data

State migration must preserve learner history. A relation id is persistent data identity.

## Stop

Stop and report only when one of these is true:

- `CONTRACT_CONFLICT`
- `DATA_MIGRATION_RISK`
- `CONTENT_ID_CONFLICT`
- backward compatibility cannot be preserved
- security or irreversible-data risk
- a true execution blocker

Otherwise finish the concentrated task, then report.
