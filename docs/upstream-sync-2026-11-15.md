# Upstream sync — 2026-11-15

Merged 27 upstream commits after `233b76c65d`, through
`b3c0442392` (macOS Universal native-module packaging), on fork base `1345c7e4f8`.
The target Linux Stable version is `2.0.23-next-linux.1`; Beta source version is
`2.0.23-beta.1-linux.1`. Internal Next names and data anchors remain unchanged.

## Integration

- Both active Desktop workspaces move to DSH `0.2.2-rc.3`, with the unmodified
  upstream checkout pinned to `38a6a5c965aa99ab525161efb7cc5cf1fe62fced`.
  Retained legacy stays on DSH `0.2.1-rc.3`; pi-ai compatibility stays version-scoped.
- Upstream adds chat import, account notification rows, a configurable Host startup
  limit with plugin progress, renderer diagnostic evidence, the Porcelain whale-tail
  icon, direct outbound dispatcher fixes, missing-folder skill listing, and an
  AppImage runner sandbox fix. Windows installer and macOS payload fixes are also
  merged, without claiming platform-native validation here.
- The fork retains Linux menu shortcuts, Sharp WASM, single Office composition
  with explicit override/disable, model catalog/OAuth integration and API removal.
  `scripts/patch-models-settings.mjs` reproduces the Models patch against the new
  minified bundle and composes its source map; it never edits upstream source.
- Packaged validation exposed the rc.3 Office ownership change: an empty
  `DSH_PRIMARY_RUNTIME` must disable the official Web-profile Office rows, not
  merely skip Desktop's former manual mount. The follow-up correction explicitly
  disables them and checks real plugin activation/uniqueness in all three packaged
  modes, replacing the obsolete Desktop-only log assertion.
- Existing unused-patch cleanup remains intact. No local application replacement,
  real-account login, paid model call or Tauri migration is part of this release.

Validation and final dependency provenance are recorded in the
[release notes](release-2.0.23-next-linux.1.md) after the gates and package checks.
