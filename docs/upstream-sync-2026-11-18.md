# Upstream sync — 2026-11-18

Merged 24 upstream commits through `e66243ece4`. Next/Beta move to Desktop 2.0.24
and DSH `0.2.2-rc.4`; legacy keeps `0.2.1-rc.3`. The installed and published Linux
Stable remains `2.0.23-next-linux.2`.

- Merged the ARM64 Linux reconnect fix, Desktop settings tabs, classic icon
  selection and diagnostic changes. The Tokens Anywhere workspace is included
  but is not mounted by default.
- Kept the fork’s Linux menu behavior, LibreOffice ASAR fix and Office opt-out;
  ported the Models patch for OAuth and DeepSeek API removal to rc.4.
- Added `gpt-6.2-astra` and `gpt-6.2-sol` to both OpenAI Responses and OpenAI
  Codex OAuth. See [catalog provenance](model-catalog-refresh.md). Kept pi-ai
  `1.3.0` and preserved existing models, defaults and credentials.

Root `yarn check` passed: 3,041 workspace tests and 184 script tests passed,
19 workspace tests skipped. The checks include the 432-file Next/Beta mirror,
Host smokes, model catalog integrity and LibreOffice ASAR regression. No live
model requests, packaging, release or local installation changes were made.
