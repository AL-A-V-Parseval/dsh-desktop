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

- Upstream baseline: the latest `master` of [anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop) (build base `580ac428ef`, product version 2.0.10)
- Target platform: **Linux x64**
- Artifacts: a portable archive (tar.gz) and a Debian/Ubuntu package (.deb). `SHA256SUMS` ships with a detached GPG signature, and the `.deb` also carries an internal `debsigs` signature

## Changes in this fork

### 1. Extended and enhanced window modes on Linux

Earlier this fork only provided compatibility mode. Electron supports the **Window Controls Overlay** on Linux (`titleBarStyle: "hidden"` + `titleBarOverlay`), so this fork also enables **extended** and **enhanced** modes: the frameless window keeps the native minimize/maximize/close buttons, extended mode uses an independent command bar, and enhanced mode uses a 32-pixel caption row. Linux window material stays `off`. Switch modes from Desktop settings or the window mode control (applied on restart).

### 2. Route sharp through a real-Node bridge (fixes the Host crash / endless "reconnecting")

Electron on Linux leaks glib symbols into the process space, which corrupts libvips/GObject state and makes the first image operation call a null `g_object_unref`, crashing the DSH Host with SIGSEGV (exit 139). The UI then reconnects forever.

This fork stops loading sharp directly in the Electron host and instead forwards every image operation to a separate **real-Node** process. Outside Electron (build scripts, plain Node, and the worker itself) the unmodified sharp is still used.

### 3. Run the private subprocess runner in Node mode on every Electron host

Fixes all subprocess tools failing on Linux (`subprocess scope exited before its bootstrap consumed the launch request`). The private runner now sets `ELECTRON_RUN_AS_NODE=1` whenever it is launched by a packaged Electron host (previously Windows-only).

### 4. Fix the upstream packaging smoke's asar stats issue

Upstream now disables ASAR entirely. The packaging smoke lists `resources/`, which contains Electron's own `default_app.asar`; Electron's `fs.stat(..., { bigint: true })` returns Number fields for that `.asar` path, so `dsh-fs-local`'s `info.mode & 511n` threw `Cannot mix BigInt and other types` and packaging aborted. This fork makes `dsh-fs-local` tolerate Number stats, so Linux packaging (including the smoke) completes.

### 5. Synchronized unit tests

Both `tests/package.spec.ts` editions update the RunAsNode cases and add a sharp-bridge case; `verify-packaged-runtime.ts` / `verify-electron-fuses.ts` are adapted for Linux.

See `.yarn/patches/`, `patches/`, and the commit history for details.

## Download and run

Grab the Linux x64 build from [Releases](https://github.com/Jic2007/dsh-desktop/releases). Two forms are provided.

### Portable archive (tar.gz)

```sh
tar -xzf DSH-Desktop-2.0.10-linux.1-x64-portable.tar.gz
cd DSH-Desktop-2.0.10-linux.1-x64
./dsh-plugin-desktop
```

### Debian / Ubuntu package (.deb)

```sh
sudo apt install ./dsh-desktop_2.0.10-linux.1_amd64.deb
# or: sudo dpkg -i dsh-desktop_2.0.10-linux.1_amd64.deb && sudo apt -f install
```

After installing, launch it from the application menu or run `dsh-desktop`. The `.deb`:

- installs to `/opt/dsh-desktop`
- provides the `/usr/bin/dsh-desktop` command, a `.desktop` menu entry, and an icon
- sets the `chrome-sandbox` setuid permission in `postinst`
- declares `Recommends: nodejs` (the sharp bridge needs a real Node)

Uninstall with `sudo apt remove dsh-desktop` (user data in `~/.config/DSH Desktop` is kept).

Both forms require:

- Linux x64 with a desktop session able to run Electron
- A **real Node** installation (used by the sharp bridge; searched in `/usr/bin/node`, `/usr/local/bin/node`, `/opt/homebrew/bin/node`, overridable via `DSH_SHARP_NODE`)
- User data is written to `~/.config/DSH Desktop`

### Verify signatures

- `SHA256SUMS` ships with a detached GPG signature, `SHA256SUMS.asc` (key `Jic2007 <ji070122@outlook.com>`, fingerprint `7B0C 9365 5F35 FA86 48AC 58BC 8E97 ED35 D906 329C`, public key `Jic2007-release-key.asc`).
- The `.deb` also carries an internal `debsigs` origin signature.

```sh
gpg --import Jic2007-release-key.asc
gpg --verify SHA256SUMS.asc SHA256SUMS
sha256sum -c SHA256SUMS
# optional: internal .deb signature (requires debsigs)
debsigs --verify dsh-desktop_2.0.10-linux.1_amd64.deb
```

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
- Builds are signed (`SHA256SUMS.asc` plus the internal `.deb` signature); Linux tray and native integration details are not additionally polished.
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
