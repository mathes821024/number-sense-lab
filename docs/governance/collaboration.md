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
Professional roles analyze, design, and propose
        ↓
contract-document-editor organizes the documents
        ↓
docs/* branch → commit → push → Cursor opens the Pull Request
        ↓
ChatGPT Gate Review
        ↓
Owner decides
        ↓
Contract Freeze
        ↓
Grok Bot builds against the frozen contract
```

Documentation work uses a branch such as `docs/governance-v01`. A documentation change is ready for review when that branch is pushed and a pull request is open.

After Contract Freeze, Grok Bot is the implementation agent. Delivery is the branch, the commits, and a suggested pull-request title and body. Cursor opens the pull request. If implementation conflicts with a frozen contract, report `CONTRACT_CONFLICT`. Do not silently redesign the product.

## Branch hygiene

分支卫生。新分支必须从该工作的正确目标基线创建，不从其他进行中的 feature/docs 分支顺手切出。

开 PR 前必须确认：

- base / merge-base 正确；
- `git diff <base>...HEAD --name-only` 只包含本 PR 预期文件；
- docs PR 不夹带 build 代码；
- build PR 不夹带未授权的 contract 修改。

文件范围超出预期时，先重建干净分支，再开 PR。PR 前必须完成核对动作；必要时在 PR 描述中注明文件清单，但不强制每次都附完整清单。

## Roles

- **Owner** decides product, scope, experience, merge, and release.
- **ChatGPT** coordinates and performs Gate Review. ChatGPT does not do daily implementation.
- **Cursor** owns professional SDD documents and GitHub pull requests.
- **Kimi** designs curriculum and learning content. Kimi does not change Product, UX, or runtime contracts.
- **Grok Bot** implements after Contract Freeze. Opening the pull request belongs to Cursor.
- **GitHub** keeps the evidence.

Repository execution rules are in [`AGENTS.md`](../../AGENTS.md).

Professional roles analyze, design, and propose. They do not hold final decision authority. The Owner decides.

`contract-document-editor` organizes documents produced by professional roles. It does not decide, redefine the product, change UX, UI, or architecture conclusions, write business code, or merge to `main`.
