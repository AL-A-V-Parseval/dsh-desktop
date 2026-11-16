# Upstream sync — 2026-11-16

Merged 11 upstream commits after `b3c0442392`, through `3bee0528fb` (#1673),
on fork base `e2c41152fb`. Desktop source versions remain
`2.0.23-next-linux.1` and `2.0.23-beta.1-linux.1`; DSH stays on `0.2.2-rc.3`
and the unmodified upstream checkout stays at `38a6a5c965`.

## Integration

- Adopt Linux bilingual role-menu templates while retaining the fork's hidden
  menu strip, native keyboard accelerators, tray actions and live language refresh.
- Merge Windows update download/staging fixes, CPU-specific macOS DMG/update
  work and CI changes. These do not switch Linux updates to upstream's service.
- Adopt upstream's patched pi-ai `1.3.0` and pi-coding-agent `1.3.0` instead of
  forcing `1.4.0`. Retain upstream's tool-streaming and Gemini replay-signature
  fixes, and reproduce the fork's reviewed catalog on top using
  `pi-model-catalog-1.3.0.json`. The loader, provider file set, schema, protocol
  set and npm integrity gates passed. Legacy keeps patched pi-ai `1.1.0`.
- Merge upstream removal of unreferenced patches, vendored runtimes and retired
  SDK shims. Keep the fork's explicit Office override/disable and activation-based
  smoke; remove its now-unused manual Office plugin body with upstream's cleanup.
  The new unused-runtime gate also retires the fork's rc.1 Models patch: no active
  resolution or lockfile entry uses it, and its functionality already lives in the
  active rc.3 patch. The dated November 10 note remains a historical record.
- Keep the newer AA artifact from official commit `aa12e7a2c181`, Linux Sharp WASM,
  provider OAuth mounts, DeepSeek API removal, data anchors and prior immutable
  release records. Market follows upstream's `1.73.20` adaptation.
- Preserve the fork's product READMEs without reintroducing upstream's sponsor
  table into the Linux compatibility notes.

## Scope

This is a source-only merge: no new release, package build, installed-app
replacement, GUI restart, account login or paid model request. Published and
locally installed Stable remain `v2.0.23-next-linux.1` with the earlier SDK pins.

## Validation

- Root `yarn check` passed: Market 328, shared legacy 403, Next full suite 1,354
  and Beta difference suite 815 — **2,900 workspace tests passed, 19 skipped**.
  Root script tests also passed all 178 cases, including the new pi-ai graph checks.
  Beta follows the existing reduced-suite policy when the runtimes match; no Beta
  or legacy full-suite run is claimed.
- Focused Models/API/Office/menu/lifecycle/package checks passed: 118 tests,
  2 skipped. Six pi-ai checks verified the model adapter, OAR and OAR's
  pi-coding-agent load the patched SDK in each active workspace.
- Real isolated source Hosts passed default, override and disabled Office modes;
  both official Office rows remain unique and have the expected activation state.
  This reused the already prepared interpreter payload, not a new package build.
- Immutable Yarn install, 388-file mirror, 54 bilingual records / 108 documents,
  active vendored-runtime validation and whitespace checks passed.
