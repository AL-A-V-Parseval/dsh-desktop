# Upstream sync — 2026-11-09

Merged upstream commit `233b76c65d2a83a777a96419d798cb5582acb8f7`
(PR #1613) after `a8b98656fd`, on fork base `3a62a9646c`.

## Incoming change

The official macOS frontend marks interactive controls as non-draggable.
Chromium collects those boxes without clipping them to scrolling containers,
so scrolled controls could remove drag areas from the conversation header,
sidebar, Plugins header or dock tabs. The Desktop stylesheet now resets regions
inside those macOS scrollers while preserving raised surfaces and pinned rows,
and limits the collapsed Plugins header to its painted area.

Next/Beta both receive the upstream CSS, matching unit specs and the expanded
headless window-controls check with official-rules-only controls. The correction
is scoped to `html[data-platform='darwin']`; Linux menu and accelerator policy,
runtime pins, model/OAuth patches and dependency versions remain unchanged.

## Documentation maintenance

- Remove the upstream team's About Us text and badge from both product READMEs,
  retaining upstream attribution, independence notice and licensing.
- State the current published Stable and DSH versions, distinguish source-only
  changes from immutable installers, and retain x64 release boundaries.
- Replace the user guide's mixed legacy instructions with current Linux usage:
  data selection/backup, shared Profile data, Plugins, `<app> dsh …`, manual
  GitHub Stable updates and bounded JSON diagnostics. Linux has no tray terminal.
- Correct model-catalog SDK status, electron-builder packaging guidance and
  Office payload paths/preparation/activation. The retired environment publisher
  and duplicate Loader setup are not current instructions.
- Update bilingual documentation navigation and README consistency records.

## Validation

- Root `yarn check` passed: Market 320, selected shared legacy 403, Next full
  suite 1,253 and Beta channel-difference suite 683: **2,659 passed, 17 skipped**,
  plus build, type, compatibility and layout checks. Beta/legacy full suites
  are not claimed as run by the selected root gate.
- Next and Beta's new window-style specs each passed (two tests per package).
- `verify:window-controls` passed the official `0.2.2-rc.1` Desktop boot branch,
  including the new scrolled-content drag checks and official-rule controls.
  This uses headless Chromium and simulated preload IPC, not native macOS window
  movement or an installed application's GUI.
- The shared mirror covers 363 files; bilingual checks cover 56 records and
  112 documents. No dependency or runtime-pin changes were required.

## Release boundary

Published Stable remains `v2.0.22-next-linux.1`, with DSH `0.2.2-rc.1`.
The source package version is retained; no package, tag, local installation or
running application is replaced. The pinned upstream submodule is unchanged.
Historical release/sync records and the separate Tauri assessment are preserved.
