<p align="center">
  <a href="https://github.com/Jic2007/dsh-desktop"><img src="assets/desktop-hero-en.png" alt="DSH Desktop for Linux: a Linux desktop client built on DeepSeek Harness" width="100%"></a>
</p>

<h1 align="center">DSH Desktop for Linux</h1>

<p align="center">
  <strong>An open-source, Linux-focused desktop client built on DeepSeek Harness.</strong>
</p>

<p align="center">
  Everything is a plugin — the desktop itself is a plugin too.
</p>

<p align="center">
  <a href="https://github.com/Jic2007/dsh-desktop/releases"><img src="https://img.shields.io/github/v/release/Jic2007/dsh-desktop?style=flat&amp;label=release&amp;color=4D6BFE" alt="Latest release"></a>
  <a href="https://github.com/Jic2007/dsh-desktop/stargazers"><img src="https://img.shields.io/github/stars/Jic2007/dsh-desktop?style=flat&amp;label=%E2%98%85&amp;color=08C" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F?style=flat" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Linux-x64-4493F8?style=flat-square" alt="Target platform: Linux x64">
</p>

<p align="center"><sub>This repository is a community fork of <a href="https://github.com/anywhere-labs/dsh-desktop">anywhere-labs/dsh-desktop</a> (DSH Desktop <strong>2.0.10</strong>, runtime <code>0.1.5-rc.2</code>). It is independent of DeepSeek and the upstream project, with no affiliation, partnership, authorization, or endorsement.</sub></p>

## What this is

DSH Desktop integrates the local Web UI, Host service, and plugin system of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) into a native desktop application. It pins and runs a specific upstream version unchanged, composing desktop capabilities through the DeepSeek Harness plugin mechanism.

This fork is **Linux-focused**: it fixes the upstream desktop's inability to run stably on Linux, restoring subprocess tools (`bash` / `glob` / `grep`), the plugin market, and attachments.

- Upstream baseline: DSH Desktop **2.0.10** (`8a8225a`)
- Target platform: **Linux x64**
- The build output is a portable directory and is not code-signed

## Changes in this fork

### 1. Route sharp through a real-Node bridge (fixes the Host crash / endless "reconnecting")

Electron on Linux leaks glib symbols into the process space, which corrupts libvips/GObject state and makes the first image operation call a null `g_object_unref`, crashing the DSH Host with SIGSEGV (exit 139). The UI then reconnects forever.

This fork stops loading sharp directly in the Electron host and instead forwards every image operation to a separate **real-Node** process. Outside Electron (build scripts, plain Node, and the worker itself) the unmodified sharp is still used.

### 2. Run the private subprocess runner in Node mode on every Electron host

Fixes all subprocess tools failing on Linux (`subprocess scope exited before its bootstrap consumed the launch request`). The private runner now sets `ELECTRON_RUN_AS_NODE=1` whenever it is launched by a packaged Electron host (previously Windows-only).

### 3. Linux `--dir` packaging verification and unpack allowlist

Adds an architecture fallback for Linux `--dir` and extends `asarUnpack` / the unpack allowlist so Linux packaging completes.

### 4. Synchronized unit tests

Both `tests/package.spec.ts` editions update the Linux `asarUnpack` and RunAsNode cases and add a sharp-bridge case.

See `.yarn/patches/`, `patches/`, and the commit history for details.

## Download and run

Grab the Linux x64 portable archive from [Releases](https://github.com/Jic2007/dsh-desktop/releases):

```sh
tar -xzf DSH-Desktop-2.0.10-linux-x64-portable.tar.gz
cd DSH-Desktop-2.0.10-linux-x64
./dsh-plugin-desktop
```

Requirements:

- Linux x64 with a desktop session able to run Electron
- A **real Node** installation (used by the sharp bridge; searched in `/usr/bin/node`, `/usr/local/bin/node`, `/opt/homebrew/bin/node`, overridable via `DSH_SHARP_NODE`)
- User data is written to `~/.config/DSH Desktop`

## Build from source

```sh
git submodule update --init --recursive
corepack yarn install
DSH_AA_SOURCE_REF=pinned corepack yarn package:dir
# output: dsh-plugin-desktop/dist/linux-unpacked/
```

For development: `corepack yarn dev`

## Known limitations

- Linux only. For Windows / macOS use the [upstream project](https://github.com/anywhere-labs/dsh-desktop).
- The build is unsigned and intended for testing / personal use; Linux tray and native integration details are not additionally polished.
- The sharp bridge starts a real Node process per operation, which adds a small process-startup cost; market icons and attachments are low-frequency, so this is acceptable.

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

## License

[MIT License](LICENSE).

> "DeepSeek Harness" is a registered trademark of DeepSeek. The name is used here only to accurately describe compatibility and technical provenance. This project is fully open source and free; if anyone sells it to you in any form, please refuse the transaction.
