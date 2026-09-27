# Repository instructions

GitHub is the source of truth. Local checkouts are working copies. If they conflict, GitHub wins.

## Documentation authorization

The Owner has authorized Cursor to commit and push documentation without asking again.

This covers product, UX, UI, architecture, and API contracts, plus README, CHANGELOG, CONTRIBUTING, governance docs, and docs indexes.

It does not cover business code, direct commits to `main`, merging without Owner approval, or implementation before Contract Freeze.

The full rule is [`docs/governance/collaboration.md`](docs/governance/collaboration.md).

## Flow

Use a `docs/*` branch, then commit, push, and open a pull request. ChatGPT reviews. The Owner decides. After Contract Freeze, Grok Bot implements against the frozen contract.

If implementation conflicts with a frozen contract, report `CONTRACT_CONFLICT`. Do not silently redesign the product.
