# Repository instructions

Number Sense Lab inherits the workspace governance in the parent `AGENTS.md`. On GitHub, this file and [`docs/governance/collaboration.md`](docs/governance/collaboration.md) are the rules agents follow. Documentation authorization and branch hygiene stay in that collaboration document. This file adds only this repository's execution rules.

## Authority

Frozen contracts merged into `main` are authoritative. Conversation instructions may guide work but must not silently override frozen repository contracts.

Implementation must not silently redesign Product, UX, Curriculum, or Architecture contracts.

## Current assignment

- Implementation: Grok Bot
- Pull requests and GitHub collaboration: Cursor
- Curriculum and learning content: Kimi
- Gate review: ChatGPT
- Product, experience, merge, and release: Owner

Kimi designs course expansion, relation families, memory hooks, visual chains and frames, and Core Recall / Structured Practice content. Product, UX, and runtime contracts stay with their owning roles.

## Flow

```text
Define → Specify → Freeze → Concentrated Build → ChatGPT Milestone Review → Owner Human Experience Review → Merge / Release
```

Grok Bot delivers the branch, the commits, and a suggested pull-request title and body. Cursor opens and maintains the pull request. Missing pull-request permission is not a build blocker.

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
