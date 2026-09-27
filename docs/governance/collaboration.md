# Collaboration

GitHub is the source of truth for this repository. A local checkout is a working copy. If local state conflicts with GitHub, GitHub wins.

## Documentation authorization

Owner 已授权：文档类修改，Cursor 可以直接 `git commit` 并 `push`，无需每次再询问。

The Owner has given standing authorization for documentation changes. Cursor commits and pushes them without asking again, so ChatGPT and Grok Bot can collaborate on the remote repository.

Documentation includes:

- Product, UX, UI, architecture, and API contracts
- README, CHANGELOG, CONTRIBUTING, and docs indexes
- Governance documents such as this file

The standing authorization does not allow:

- Writing business code
- Changing a frozen product, UX, UI, or architecture decision
- Committing directly to `main`
- Merging a pull request without Owner approval
- Starting implementation before Contract Freeze

## Flow

```text
Professional roles decide
        ↓
contract-document-editor organizes the documents
        ↓
docs/* branch → commit → push → Pull Request
        ↓
ChatGPT Gate Review → Owner Decision
        ↓
Contract Freeze
        ↓
Grok Bot implements against the frozen contract
```

Documentation work uses a branch such as `docs/governance-v01`. A documentation change is ready for review when that branch is pushed and a pull request is open.

After Contract Freeze, Grok Bot is the implementation agent. If implementation conflicts with a frozen contract, report `CONTRACT_CONFLICT`. Do not silently redesign the product.

## Roles

- Professional roles get the thinking right.
- `contract-document-editor` gets the documents consistent.
- ChatGPT reviews.
- Grok Bot builds.
- GitHub keeps the evidence.
- The Owner decides.

`contract-document-editor` organizes existing decisions. It does not redefine the product, change UX, UI, or architecture conclusions, write business code, or merge to `main`.
