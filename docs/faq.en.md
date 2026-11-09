# DSH Desktop FAQ

[中文](faq.md)

This page covers this Linux fork's Stable mainline. Consult [this fork's latest Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest), the [root README](../README.en.md) and [new-shell documentation](../dsh-desktop-next/README.md). Source may be ahead of installers; upstream arm64 source support does not mean this fork has published arm64 assets.

## What is DSH Desktop?

This fork is an open-source DeepSeek Harness desktop client for Linux x64. It hosts the official Web UI, Host and plugin system with a tray, Desktop settings, a bundled CLI, Profiles and recovery. Current Stable is `v2.0.22-next-linux.1`, using DSH `0.2.2-rc.1`; upstream separately ships Windows/macOS products.

## Is this an official DeepSeek product?

No. DSH Desktop is an independent, community-maintained open-source project. It is not affiliated with or endorsed by DeepSeek. The name only describes its technical relationship with the official [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

## Which operating systems are supported?

This fork ships Linux x64 AppImage, portable tar.gz and `.deb` assets; see [Releases](https://github.com/AL-A-V-Parseval/dsh-desktop/releases). Use upstream for Windows/macOS. `DSH-NEXT` filenames and the `next` suffix are compatibility identifiers, not Linux prerelease labels.

## Do I need to install Node.js, pnpm, or DSH?

No. The installer includes Electron, Node.js, pnpm, and pinned DSH dependencies. Ordinary users can install and launch directly, and Desktop does not modify the global system PATH or user shell configuration.

## Does the first launch download a runtime?

No separate Node.js or Harness core download is required. The installer is larger because it contains the runtime and pinned dependencies, trading download size for a more deterministic first launch and dependency set. Cloud models, update checks, and new-version downloads still require network access.

## Does DSH Desktop modify official Harness?

The official source checkout is unmodified. Runtime packages come from pinned official distributions, with explicit Yarn compatibility patches and plugin composition. Linux Stable uses the new shell and official frontend; the legacy three window modes do not describe the current Stable product.

## Is data stored locally?

The Desktop Host, profiles, and DSH home live on the local machine. Whether content is sent to an external service depends on the model or tool providers the user configures; requests to cloud models still go to those providers.

## Can I install DSH plugins?

Yes. Prefer the official Plugins page and market installation, toggling, removal and update flows; the official plugin manager owns these operations. Follow any reload prompt shown by the UI. Linux has no tray terminal; run bundled CLI commands such as `dsh-desktop-next dsh plugin --profile <name> add <plugin>` from a system terminal. Avoid concurrent processes modifying one Profile.

## Does the Desktop profile automatically sync with an existing web profile?

No plugins are copied automatically. Each Profile has its own bundle and dependency composition; select the CLI target explicitly with `--profile <name>`. Switching Profiles does not isolate conversations, settings or credentials within the same data home.

## How are updates installed?

Linux `-linux.N` versions check this repository's GitHub Stable/latest without sending an installation UUID; the app does not automatically download or install updates. Download the appropriate asset, verify it, back up data and quit before replacement. Replace AppImage/portable files or use `sudo apt install ./<file>.deb` on Debian/Ubuntu. The legacy framework is retired; source merges do not change immutable published assets.

## Where is GPT-6.1 Terra?

The built-in OpenAI and OpenAI Codex OAuth catalogs include `gpt-6.1-terra`. Select it under the corresponding provider; catalog presence does not guarantee account entitlement. Explicit model lists on custom providers are not overwritten by catalog refreshes. See [catalog maintenance](model-catalog-refresh.md) for sources and reviewed backports.

## Does the app use my system proxy?

Yes. At startup the app reads the operating system's proxy configuration — Windows Internet options, macOS network settings, Linux desktop settings, including automatic configuration scripts (PAC/WPAD) — and applies it to everything it sends: model conversations, web fetches, web search, MCP servers, plugin installs, and commands the app starts in its terminal. Turning on the "system proxy" switch in a client such as Clash or v2rayN is enough; nothing needs to be entered in the app.

A few rules worth knowing:

- **A proxy you set yourself wins.** If `HTTPS_PROXY`, `HTTP_PROXY`, or `ALL_PROXY` is set before launch, the app uses that one and ignores the system configuration. `NO_PROXY` is honored the same way.
- **Restart the app after changing the proxy.** The configuration is read once, at startup. After toggling the system proxy in your client, or switching to a node that changes the port, quit the app and open it again.
- **A SOCKS-only configuration cannot be used.** The app's HTTP egress accepts only `http://` and `https://` proxies. If the system proxy is configured for SOCKS alone, enable the HTTP port or the mixed port in your proxy client (Clash's "mixed port" serves both), then turn the system proxy on. The application window itself and the update check keep working either way; only the features listed above connect directly.
- **Local addresses never go through the proxy.** `localhost`, `127.0.0.1`, and this machine's own LAN addresses bypass it, so a locally running server or a LAN address is never blocked by the proxy.
- **Known limitation: on macOS and Linux, launching from the Dock or Finder does not pick up proxy variables written only in `~/.zshrc` or `~/.bashrc`.** This is deliberate — a proxy address can carry a username and password, and the app does not inherit that class of variable from shell configuration. Use the system proxy settings instead, or start the app from a terminal.
- **How to confirm it worked.** Every start writes one `outbound proxy = ...` line to the log, for example `outbound proxy = http://127.0.0.1:7890 (source: system, no_proxy: ...)`. A `source` of `system` means the system configuration was used, `environment` means a variable you set was used, and `none` means the app is connecting directly. The log lives in the `logs` folder of the application data directory, and "Export diagnostics" packages it up. Please include that line when reporting a network problem.

## Where can I download the app or report a problem?

Download from [this fork's latest Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest). Export redacted diagnostics first; then open a [GitHub Issue](https://github.com/AL-A-V-Parseval/dsh-desktop/issues) with system, version, reproduction steps and errors. Do not upload credentials, access tokens or an unchecked complete data directory.
