# Upstream sync — 2026-11-04

Merged 67 commits from the previous upstream snapshot `0e249397f8` through
`117e4899132553b230cafd902d78c0f8f0020132`, on fork base `203237a37b`.

## Runtime boundaries

- Linux Stable source: `dsh-desktop-next`, `2.0.21-next-linux.1`, DSH `0.2.1-rc.5`.
- Beta source: `2.0.21-beta.2-linux.1`, DSH `0.2.2-alpha.3`.
- Retained legacy family: DSH `0.2.1-rc.3`, no new Linux releases.
- The source submodule follows upstream's Beta pin `05b1cae8db6e674c5685101494d4eec24652424a` and is unmodified.
- Published Stable `v2.0.20-next-linux.2` and the local installation are unchanged.

## Incoming behavior and integration

The merge includes Linux manual-update notices, arm64/static-AppImage packaging,
hicolor icons, GBM/ALSA deb dependencies, the packaged `dsh` CLI, window restoration,
UTF-8/BOM compatibility, HTTP 431 handling, platform views and failure diagnostics.
Official Computer Use on-demand installation remains Beta-only. Upstream's removal
of unused tests/patches and its shared-legacy test selection are retained.

Fork-specific integration preserves Linux Stable routing, data identifiers, menu
hiding/accelerators, upstream Sharp WASM, single Office composition, Terra catalogs
and per-SDK streaming fixes. OAuth settings mounts were ported to both new runtimes.
Workspace peer collection combines upstream's placed-root resolution with the
existing semver contract; it does not copy an incompatible development SDK merely
because it exists in a linked workspace.

For fork versions carrying `-linux.N`, update checks use this fork's public GitHub
Stable/latest endpoint rather than upstream's Next service, send no installation
UUID/current-version headers, and open this fork's release page. Downloads remain
manual; there is no new retry or automatic installation mechanism. Other platform
and upstream-version flows retain their existing service behavior.

## Validation

- Root `yarn check` passed: Market 320, shared legacy 403, Next 992, Beta 1,083
  Vitest tests (**2,798 passed, 23 skipped**), plus layout/compatibility checks.
- The frozen legacy suite was not run in full; upstream's new root gate selects
  the legacy specs covering modules shipped by Next/Beta.
- Native Linux x64 directory package built. Real packaged Host default/override/
  Office-disabled modes, driver/badge, Sharp WASM with/without hooks, and `<app> dsh`
  checks passed (`dsh 0.2.1-rc.5`).
- Beta's real Electron Node-mode Host passed on `0.2.2-alpha.3`, including plugin
  manager operations, recovery, Profile switching and a second computer-use registry.
- Mirrors cover 339 files with declared family/version exceptions; bilingual records
  cover 54 pairs / 108 documents.

No installer release, local GUI restart, real-account OAuth flow or paid model call
is part of this merge. ARM64 and native Windows/macOS packaging were not executed.
