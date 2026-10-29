<p align="center">
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop"><img src="assets/desktop-hero-en.png" alt="DSH Desktop for Linux: a Linux desktop client built on DeepSeek Harness" width="100%"></a>
</p>

<h1 align="center">DSH Desktop for Linux</h1>

<p align="center">
  <strong>An open-source, Linux-focused desktop client built on DeepSeek Harness.</strong>
</p>

<p align="center">
  Everything is a plugin — the desktop itself is a plugin too.
</p>

<p align="center">
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop/releases"><img src="https://img.shields.io/github/v/release/AL-A-V-Parseval/dsh-desktop?style=flat&amp;label=release&amp;color=4D6BFE" alt="Latest release"></a>
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop/stargazers"><img src="https://img.shields.io/github/stars/AL-A-V-Parseval/dsh-desktop?style=flat&amp;label=%E2%98%85&amp;color=08C" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F?style=flat" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Linux-x64-4493F8?style=flat-square" alt="Target platform: Linux x64">
</p>

<p align="center"><sub>This is a Linux community fork of <a href="https://github.com/anywhere-labs/deepseek-harness-desktop">anywhere-labs/deepseek-harness-desktop</a>. It is independent of DeepSeek and upstream, with no affiliation, partnership, authorization, or endorsement.</sub></p>

## What this is

> **Linux release policy change (2026-10-27):** Starting with [`v2.0.20-next-linux.1`](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/tag/v2.0.20-next-linux.1), the former Next framework is this fork's **Stable / latest** mainline. The legacy framework receives no further releases; its last release is `v2.0.18-linux.1`. The `next` version suffix, `DSH NEXT` display name and internal identifiers are retained for installation, data-directory and upstream-merge compatibility; **they no longer identify a prerelease channel in this fork**. Signed packages and tags remain unchanged. Source-directory names are independent of release stability; see [`linux-release-policy.json`](linux-release-policy.json). Root `dev`, `start`, `package:dir` and `dist:linux` commands now use the new framework.
>
> The current published Stable release is [`v2.0.20-next-linux.2`](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/tag/v2.0.20-next-linux.2). Assets use `DSH-NEXT-<version>` and the portable executable is `dsh-desktop-next`. Data defaults to `~/.dsh`; an already selected directory takes precedence. Back up data before migrating from the legacy framework. Source development has continued: **the source version is not the published installer version**.

DSH Desktop integrates the local Web UI, Host service, and plugin system of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) into a native desktop application. It pins and runs a specific upstream version unchanged, composing desktop capabilities through the DeepSeek Harness plugin mechanism.

This fork is **Linux-focused**: it fixes the upstream desktop's inability to run stably on Linux, restoring subprocess tools (`bash` / `glob` / `grep`), the plugin market, and attachments.

- Merged upstream snapshot: `0e249397f8`; this branch's source version is `2.0.21-next-linux.1` (unreleased)
- Source runtimes: Linux Stable workspace `dsh-desktop-next/` → `0.2.1-rc.4`; Beta → `0.2.2-alpha.2`; legacy workspace retains `0.2.1-rc.3`. Pins live in [`upstream.json`](upstream.json); Linux release boundaries are defined by [`linux-release-policy.json`](linux-release-policy.json)
- Published `linux.2` uses `0.2.1-rc.3`; merging source does not change its signed assets
- Target platform: **Linux x64**
- Artifacts: an AppImage, a portable archive (tar.gz) and a Debian/Ubuntu package (.deb). `SHA256SUMS` ships alongside them, and the `.deb` also carries an internal `debsigs` signature

## Changes in this fork

### 1. New Stable shell and Linux menus

The main window uses the official Web frontend with Profiles, recovery, Desktop settings and plugin integration. Linux native menus remain hidden after startup and reload while real Electron keyboard accelerators stay available. The legacy compatibility/extended/enhanced modes are no longer instructions for the current Stable shell.

### 2. Upstream Sharp WASM and attachment regression coverage

Linux image processing uses upstream Sharp 0.35.5's WASM backend. The real-Node subprocess bridge, global Sharp overrides and bypass logic have been removed. No system Node installation, `DSH_SHARP_NODE`, deleted conversations or conversion of valid historical images is required. Packaged checks cover actual attachment reads and full image decoding both with and without Host hooks.

### 3. Run the private subprocess runner in Node mode on every Electron host

Fixes all subprocess tools failing on Linux (`subprocess scope exited before its bootstrap consumed the launch request`). The private runner now sets `ELECTRON_RUN_AS_NODE=1` whenever it is launched by a packaged Electron host (previously Windows-only).

### 4. Fix the upstream packaging smoke's asar stats issue

The new framework uses ASAR with native/Office resources unpacked where needed. Electron's `fs.stat(..., { bigint: true })` can still return Number fields for some ASAR paths; the `dsh-fs-local` patch prevents `Cannot mix BigInt and other types`. Useful compatibility fixes remain in place rather than being removed solely because they are old.

### 5. Model catalog, OAuth and plugin markets

Provider sign-in and custom models are preserved. The bundled catalog includes `gpt-6.1-terra` on OpenAI API and OpenAI Codex OAuth. Catalog updates do not replace protocol/OAuth implementations or alter credentials/default models. Sources and reproduction are documented in [`docs/model-catalog-refresh.md`](docs/model-catalog-refresh.md); catalog presence does not guarantee account entitlement. Plugin installation, toggling, removal and community-plugin updates use the official plugin manager, with Market and AA integration retained.

See `.yarn/patches/`, `patches/`, and the commit history for details.

### 6. Bundled official runtime payload (Python / Node.js / pnpm + Office skills)

Packaged builds carry the upstream-pinned, checksum-verified Python, Node.js, pnpm and Office payload under `resources/runtime/<arch>/`. Office and `load_workspace_dependencies` are mounted by one Host-owned composition. `DSH_PRIMARY_RUNTIME` can select a payload directory containing `runtime.json`; an empty string disables the composition without duplicate tool registrations.

### Upstream improvements in this source merge

This merge brings a separate Next runtime channel, release-specific official plugin indexes and updates, a dshfind source option, bare `dsh-session:` text handling, and renderer-OOM memory evidence with readable Host exit diagnostics. Beta also lists LiveShare, Ralph and session search without enabling them by default. These are source changes, not replacements for published `linux.2` installers. See the [workspace documentation](dsh-desktop-next/README.md) for behavior and verification entry points.

## Download and run

Download a Linux x64 **AppImage**, **portable archive (tar.gz)** or **Debian package** from the [latest Stable release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest). Replace `<version>` with the actual release version, for example `2.0.20-next-linux.2`.

### AppImage (no installation)

```sh
chmod +x DSH-NEXT-<version>-x86_64.AppImage
./DSH-NEXT-<version>-x86_64.AppImage
```

`DSH-NEXT-` is a retained compatibility prefix, not a prerelease designation.

### Portable archive (tar.gz)

```sh
tar -xzf DSH-NEXT-<version>-x64-portable.tar.gz
cd DSH-NEXT-<version>-x64-portable
./dsh-desktop-next
```

Portable builds also use the selected data directory; they do not automatically isolate or copy accounts and conversations.

### Debian / Ubuntu package (.deb)

```sh
sudo apt install ./DSH-NEXT-<version>-amd64.deb
```

The package and launch command are `dsh-desktop-next`; installation lives under `/opt/DSH NEXT`. Uninstall with `sudo apt remove dsh-desktop-next`; data is not automatically deleted. Do not run old and new installations concurrently against the same data directory.

All forms require:

- Linux x64 with a desktop session able to run Electron
- Electron's required system libraries; image WASM and Office payloads are bundled, so system Node is not required
- Conversations, settings, credentials and Profiles default to `~/.dsh`; Electron preferences live in `~/.config/DSH NEXT`. An explicitly selected data directory takes precedence

### Verify downloads and provenance

**1. Provenance and integrity (online, zero configuration, recommended)**

This repository enables GitHub **immutable releases**: since `v2.0.16-linux.1` every release gets a GitHub-generated **release attestation** (Sigstore format, covering the tag, the commit SHA and every asset). Verify it with the GitHub CLI, without importing any public key:

```sh
gh release verify v<version> --repo AL-A-V-Parseval/dsh-desktop
gh release verify-asset v<version> ./DSH-NEXT-<version>-x86_64.AppImage --repo AL-A-V-Parseval/dsh-desktop
```

**2. Checksums (offline, for mirrors and air-gapped hosts)**

Every release ships `SHA256SUMS`:

```sh
sha256sum -c SHA256SUMS
```

**3. Tag and .deb signatures**

- Release tags are **GPG-signed annotated tags** since `v2.0.15-linux.1`; verify locally with `git tag -v v<version>`. Public key: `Jic2007-release-key.asc`, fingerprint `7B0C 9365 5F35 FA86 48AC 58BC 8E97 ED35 D906 329C`.
- The `.deb` also carries an internal `debsigs` **origin** signature. `debsigs --list` only lists signatures, not cryptographic verification. Prefer the release-attestation/asset checks above and independently confirm the release public-key fingerprint.

**4. About `SHA256SUMS.asc`**

To keep release assets lean (the GitHub attestation covers online provenance and `SHA256SUMS` covers offline verification), **newer releases no longer ship `SHA256SUMS.asc`**. `v2.0.16-linux.1` and earlier still carry it, and it remains valid to run:

```sh
gpg --import Jic2007-release-key.asc && gpg --verify SHA256SUMS.asc SHA256SUMS
```

**5. Immutable releases**

Published tags and assets can no longer be changed; publish a new version suffix (for example `-linux.2`) instead of replacing assets. `v2.0.15-linux.1`, `v2.0.15-next-linux.1` and earlier predate immutability and carry no attestation.

## Build from source

```sh
git submodule update --init --recursive
corepack yarn install --immutable
corepack yarn check
corepack yarn package:dir
# output: dsh-desktop-next/dist/linux-unpacked/
# AppImage / deb: corepack yarn dist:linux
```

Builds require Node.js `^22.19.0` or `>=24.0.0`, Corepack and root Yarn `4.18.0`. Root build/start entry points prepare the latest Market and official AA; commit generated dependencies, provenance and lockfile together. The old `pinned` parameter is retired. For development: `corepack yarn dev`. See [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md) for boundaries.

## Known limitations

- Linux only. For Windows / macOS use the [upstream project](https://github.com/anywhere-labs/dsh-desktop).
- Release provenance and integrity come from the GitHub release attestation (`gh release verify`) and `SHA256SUMS`, plus GPG-signed tags and the internal `.deb` signature; Linux tray and native integration details are not additionally polished.
- `next` in a version does not mean prerelease in this fork; Beta is for development checks. Do not replace immutable Release assets with a source rebuild of the same version.

## Documentation

- User guide: [`docs/user-guide.md`](docs/user-guide.md)
- FAQ: [`docs/faq.md`](docs/faq.md)
- Docs index: [`docs/README.md`](docs/README.md)
- Upstream project: [anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop)

## Credits

All core capabilities come from upstream and these open-source projects:

- [DSH Desktop](https://github.com/anywhere-labs/dsh-desktop) and [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [Cordis](https://github.com/cordiverse/cordis)
- [Koishi](https://koishi.chat/)

## About Us

United by a passion for open source, we collaborate to turn the possibilities of AI into accessible tools and meaningful experiences.

<p align="center">
  <a href="https://github.com/anywhere-labs/about-us"><img src="https://img.shields.io/badge/Meet%20the%20Team-Anywhere%20Labs-4D6BFE?style=for-the-badge" alt="Meet the Team"></a>
</p>

## License

[MIT License](LICENSE).

> "DeepSeek Harness" is a registered trademark of DeepSeek. The name is used here only to accurately describe compatibility and technical provenance. This project is fully open source and free; if anyone sells it to you in any form, please refuse the transaction.
