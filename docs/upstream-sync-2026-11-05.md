# Upstream sync — 2026-11-05

Merged 17 upstream commits after `117e489913`, through
`a8b98656fd8bcaa888bcc63489b2ecda68a61084`, on fork base `7696393b21`.
This follows upstream Desktop `v2.0.22-next` and `v2.0.22-beta.1`.

## Runtime and product boundaries

- Linux Stable: `dsh-desktop-next`, version `2.0.22-next-linux.1`.
- Beta: version `2.0.22-beta.1-linux.1`.
- Both now use DSH `0.2.2-rc.1` and the existing version-scoped pi-ai `1.4.0` patch.
- Retained legacy remains DSH `0.2.1-rc.3`, not a Linux release target.
- Unmodified upstream submodule: `66491b05e3f05ad35bcdd4f6cd7ed26041d9e3db`.

## Integration

Incoming commits add native file actions/image dragging, LiveShare owner sign-in
and reader compatibility fixes, packaged CLI Node-mode preservation, Windows ACL
temporary-directory repair and Mac CPU architecture in update requests.

The fork retains Linux Stable routing and update discovery, menu accelerators,
Sharp WASM attachment handling, single Office composition, Terra model catalogs
and streaming fixes. The OAuth settings mount patch is ported to `0.2.2-rc.1`.
Bundled-plugin Profile layers remain combined with upstream's new stale on-demand
bundle removal, so Codex/Claude Code/official Computer Use packages pinned to an
older DSH can be removed before resolution and reinstalled from Plugins.

Next and Beta now mirror 362 files without runtime-family exceptions. Product
names and data anchors retain their established channel transforms.
Market was refreshed to npm latest `1.73.11` with the upstream-adapted Desktop patch.
AA was rebuilt from official main `296f70ed4036be3da039f1614b782fdbdbf8d150`,
using upstream's rc.1 build-graph correction; all generated provenance and package
pins are committed with the artifact.

## Headless validation

- Root `yarn check` passed: Market 320; selected shared legacy 403; Next full suite
  1,251; Beta channel-difference suite 681. Total **2,655 passed, 17 skipped**,
  plus type, layout, compatibility and loader checks.
- Beta's reduced suite is the existing root policy when runtimes match; its full
  suite and the frozen legacy full suite are not claimed as run by this gate.
- Focused Next model-catalog/update/Profile/package checks passed (78 tests).
- 58 bilingual records / 116 documents and the 362-file mirror passed.

Package validation is recorded in the [release notes](release-2.0.22-next-linux.1.md).
No Tauri/memory refactor, local installation replacement, GUI restart, real-account
OAuth or paid model call is part of this merge. ARM64 and Windows/macOS native
packaging are outside this release's executed validation.
