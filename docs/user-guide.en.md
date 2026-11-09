# DSH Desktop User Guide

[中文](user-guide.md)

This guide covers this fork's Linux Stable. The current published version is `v2.0.22-next-linux.1`, using DSH `0.2.2-rc.1`. `dsh-desktop-next`, `DSH NEXT` and `next` in the version are compatibility identifiers, not prerelease labels. Source may contain fixes not yet included in installers.

## Installation and launch

Get Linux x64 AppImage, portable tar.gz or deb assets from [this fork's latest Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest). See the [root README](../README.en.md#download-and-run) for verification, installation and launch commands. Packages include Electron, DSH, Python/Node.js/pnpm and Office resources; no system Node or legacy Sharp bridge variables are needed.

Installed apps do not automatically update plugin code on launch. Cloud models, plugin installation, AA connections and update checks may still use the network. Linux ARM64 source entry points do not mean a corresponding official package is available.

## Data and backups

- Data defaults to `~/.dsh`. An in-app directory selection takes precedence, followed by `DSH_DESKTOP_NEXT_HOME` set before launch, then the default. The old `DSH_HOME` does not select the desktop data directory.
- The directory selection is recorded under `~/.config/DSH NEXT/home/`; browser state lives in `electron-user-data/` inside the selected data directory. Do not place data inside the application installation.
- Back up from Desktop settings, quit normally, then replace the package. Avoid multiple installations or CLI operations modifying the same Profile concurrently.
- Profiles have separate plugin dependencies, activation lists and patches. Conversations, settings and credentials remain shared within one data directory; Profiles are not account-isolation containers.

## Windows, settings and Profiles

Open **Settings → Desktop settings** in the official interface for background behavior, data directories, access permissions, logging and Desktop tools. Linux native menus are hidden by default while keyboard accelerators remain available. The legacy compatibility/extended/enhanced window modes do not apply.

With background operation enabled and a working tray, closing the main window does not quit; use the tray's quit action to stop the Host. Without an available tray, closing the window quits the app.

The tray offers Profile creation/switching, recovery and diagnostics. Switching Profiles fully restarts the application and interrupts current tasks; changing the port restarts the Host. Browser-access switches take effect immediately.

## Models and plugins

Provider sign-in, custom models and credentials keep their existing configuration. OpenAI API and OpenAI Codex OAuth catalogs include `gpt-6.1-terra`; access depends on account entitlement. Catalog refreshes do not overwrite explicit custom model lists.

Prefer the official **Plugins** page for installation, updates, toggling and removal, following its reload prompts. Markets, AA remote control and Computer Use have entries above the list; remote control and computer access default to off. Selecting one market disables the other without deleting installed plugins.

LiveShare, Ralph, session search and OAR subagents are optional. OAR uses locally installed, signed-in Codex/Claude Code CLIs with permissions controlled by its plugin settings; not every optional tool's external CLI is bundled.

After a DSH upgrade, official Codex/Claude Code subagents or official Computer Use installed for another release may be removed and shown as not installed. Enable them again in Plugins to install matching versions; conversations need not be deleted. On-demand official Computer Use is macOS-only; Linux uses Computer Use (Next).

## Linux command line

Linux currently has no tray terminal launcher. Use the application's `dsh` subcommand from your system terminal; for a portable installation:

```sh
./dsh-desktop-next dsh --version
./dsh-desktop-next dsh plugin --profile desktop add <plugin>
./dsh-desktop-next dsh plugin --profile desktop remove <plugin>
```

After deb installation, replace `./dsh-desktop-next` with `dsh-desktop-next`; for AppImage, use its file path. Select the target Profile explicitly and stop other operations that could modify it. This entry does not open a desktop window and requires neither a global `dsh` installation nor shell configuration changes.

## Browser access and remote control

Browser access defaults to off. Enabling local access provides an authenticated link; LAN access separately enables HTTPS/WSS while the Host stays bound to `127.0.0.1`. Share links only with trusted devices, verify the LAN CA fingerprint, and keep access tokens out of screenshots and issue reports.

AA remote control is enabled independently in Plugins; it does not enable ordinary browser access. Profile changes, quitting and restarting stop the old Host and its connections. Enabling remote control does not automatically grant computer-control permissions.

## Updates

Linux `-linux.N` versions query this repository's GitHub Stable/latest Release, not upstream's Next service, without sending an installation UUID. Check from the tray or Desktop settings; open the release page, verify the download, then replace AppImage/portable files manually or run `sudo apt install ./<file>.deb`.

Background checks do not automatically download or install updates, nor replace already published assets under the same version. The legacy framework receives no new releases.

## Troubleshooting and recovery

Start by exporting diagnostics from the tray or Desktop settings. Current diagnostics are bounded JSON containing versions, runtime state, logs and recent evidence, not the legacy ZIP format; they do not proactively traverse conversation or credential files. Logs may still include local paths and plugin output, so review them before sharing.

Recovery can show failures without a healthy Host and offers retry, Profile selection, safe mode, repair, rollback and diagnostics:

- **Safe mode** uses temporary data without existing credentials. Exiting returns to the original Profile; temporary content is not retained.
- **Repair Profile** backs up configuration, disables extra plugins and resets patch selections. Shared conversations and credentials remain, but plugins may need reconfiguration.
- **Rollback Profile** restores the latest healthy-start configuration, not all plugin versions or shared data. Backups live under `recovery/` in the data directory.

Host failure reports, plugin-operation history and OOM memory snapshots help investigation; one large memory sample does not prove a leak. Do not upload unchecked complete data directories, credentials or access links.

See the [workspace reference](../dsh-desktop-next/README.md), [FAQ](faq.en.md) and [documentation index](README.en.md) for full behavior and technical boundaries. The [legacy architecture](architecture.en.md) is historical, not configuration guidance for current Stable.
