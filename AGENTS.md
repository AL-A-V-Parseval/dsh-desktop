# DSH Desktop repository rules

This repository owns the desktop product around an unmodified DeepSeek Harness checkout.

## Linux fork release policy

- For Linux release, install, and default-launch work, use `linux-release-policy.json`: the former Next workspace is now the Stable mainline; the legacy workspace is retained for upstream merges and regression checks, not new releases.
- Preserve Next package names, runtime identifiers, and data-directory anchors for compatibility. Release stability is GitHub metadata, not a reason to rename internal paths or rewrite signed assets.

## Prerequisites and setup

- Use Node.js `^22.19.0` or `>=24.0.0` and the root Yarn `4.18.0` release through Corepack.
- Initialize the pinned upstream checkout with `git submodule update --init --recursive`.
- Install root dependencies with `corepack yarn install --immutable`.

## Build, run, and verify

- Start the desktop development workflow with `corepack yarn dev`.
- Build the desktop package with `corepack yarn build`.
- Root build, dev/start, and packaging commands refresh `dshmarket` from npm `latest` for Stable, Beta, and Next via `corepack yarn market:prepare`. Commit its exact dependency versions, Desktop compatibility patch, and lockfile together. `corepack yarn market:check` verifies freshness without writes; offline lookups or incompatible patches fail rather than silently retaining an old market. Installed apps do not hot-update executable plugins on launch.
- Before each release, run `corepack yarn aa:prepare-release` to build the latest official Agents Anywhere `main` for both Desktop channels. Commit the resulting artifact, provenance, manifests, and lockfile before packaging. Signed macOS releases and root Windows distribution commands verify freshness and installed versions; `DSH_AA_SOURCE_REF=pinned` is no longer supported.
- Run unit tests with `corepack yarn test`.
- Run type checking with `corepack yarn typecheck`.
- Run the complete headless gate with `corepack yarn check`.
- `corepack yarn dev:next` explicitly launches the promoted Linux Stable workspace; `corepack yarn check:next` validates it without a graphical application. Next uses the official published Web frontend and the recorded upstream Desktop presentation, with product capabilities composed as a separate bundle.
- Develop shared Next/Beta feature changes in `dsh-plugin-desktop-beta/` first, then synchronize with `node scripts/verify-desktop-variants.mjs --from=beta`. Before committing shared changes, run `corepack yarn check:desktop-variants` and validate both affected packages. The retained legacy workspace is not part of this mirror.
- Run upstream operations through the root scripts, such as `corepack yarn upstream:build`.

- `deepseek-harness/` is a pinned upstream Git submodule. Never edit files inside it from a desktop feature branch.
- `dsh-plugin-desktop/` retains the legacy Cordis Host/Client, Electron bootstrap and packaging helpers for upstream merges and regression checks.
- `dsh-desktop-next/` owns the promoted Linux Stable shell, Profiles and recovery, and AA/Community Market adapters; shared code mirrors Beta through the declared variant transforms. Keep its upstream reference and published runtime versions aligned; do not fork the official main frontend.
- `dsh-community-fabric/` owns the community interoperability RFC. Until schemas and a reviewed reference adapter exist, it remains a private documentation scaffold and must not declare loadable DSH or package entry points.
- `dsh-community-market/` owns the loadable Community Market integration and its compatibility patch.
- The outer repository and all owned packages use the root Yarn release with `nodeLinker: node-modules`.
- The upstream submodule keeps its own pnpm workspace. Run upstream commands through the root `upstream:*` scripts, whose Yarn portable-shell commands enter the submodule before invoking Corepack.
- Compatibility mode must run the upstream default client without overrides. Advanced presentation belongs to desktop-owned client plugins and may replace documented slots or services through profile composition.
- Keep graphical application launch explicit. Builds, typechecks, unit tests, and Loader smokes must remain headless-safe.
- Commit before major changes of direction and keep the submodule pin update separate from desktop behavior changes.
- Keep the repository topology and package-manager split consistent with the [owning Agent Note](.agents/notes/implemented/process/2026-08-15-pinned-upstream-and-isolated-yarn-workspace.md).
