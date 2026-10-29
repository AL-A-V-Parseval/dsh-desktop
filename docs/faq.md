# DSH Desktop 常见问题

[English](faq.en.md)

本页说明 Linux fork 当前 Stable 主线。功能范围以[本 fork 最新 Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest)、[根 README](../README.md)和[新架构工作区说明](../dsh-desktop-next/README.zh.md)为准；当前源码可能领先已发布安装包。

## DSH Desktop 是什么？

本 fork 是面向 Linux x64 的开源 DeepSeek Harness 桌面客户端。它将官方 Web UI、Host 与插件系统装进原生应用，提供系统托盘、桌面设置、终端、Profile 和恢复功能。上游另有 Windows/macOS 产品。

## 这是 DeepSeek 官方产品吗？

不是。DSH Desktop 是社区维护的独立开源项目，不隶属于 DeepSeek，也未获得 DeepSeek 官方背书。项目名称仅用于说明它与官方 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的技术关系。

## 支持哪些操作系统？

本 fork 发布 Linux x64 的 AppImage、便携 tar.gz 和 `.deb`，见 [Releases](https://github.com/AL-A-V-Parseval/dsh-desktop/releases)。Windows/macOS 用户请使用上游。文件名中的 `DSH-NEXT` 与版本中的 `next` 是兼容标识，不表示 Linux 预发布。

## 需要安装 Node.js、pnpm 或 DSH 吗？

不需要。安装包已经包含 Electron、Node.js、pnpm 和固定版本的 DSH 依赖。普通用户下载安装后即可启动，Desktop 也不会修改系统全局 PATH 或用户的 shell 配置。

## 首次启动需要下载运行环境吗？

不需要另行下载 Node.js 或 Harness 核心。安装包较大，是因为运行时和固定版本依赖已经包含在内，以换取更确定的首次启动和版本组合。使用云端模型、检查更新或下载新版本时仍然需要网络。

## DSH Desktop 会修改官方 Harness 吗？

不修改官方源码 checkout。运行时来自固定版本的官方分发包，必要的桌面兼容修改通过显式 Yarn 补丁和插件组合实现。Linux Stable 使用新架构与官方前端；旧版三种窗口模式不是当前 Stable 的功能说明。

## 数据是否保存在本地？

Desktop Host、profile 和 DSH home 位于本机。是否向外部服务发送内容取决于用户配置的模型或工具提供商；使用云端模型时，相应请求仍会发送给该提供商。

## 可以安装 DSH 插件吗？

可以。优先使用官方插件页面与市场的安装、开关、卸载和更新流程；操作由官方插件管理器处理，是否需要重载以页面提示为准。托盘终端仍可运行 `dsh plugin add`、`dsh plugin remove`、`dsh plugin update`，默认作用于当前 Profile；不要同时使用多个进程修改同一 Profile。

## Desktop profile 和已有 web profile 会自动同步吗？

不会自动复制插件。每个 profile 都有自己的 bundle 和依赖组合；切换 profile 后，终端中的默认插件命令会作用于当前 profile，也可以使用 `--profile <name>` 显式指定目标。

## 应用如何更新？

从本 fork 的 Stable/latest Release 下载适合当前安装方式的包，校验来源后备份数据再替换，不要覆盖正在运行的程序目录。AppImage/便携包替换文件，Debian/Ubuntu 用 `apt install ./<文件>.deb`。旧架构已停止发版；切换至新 Stable 前请阅读根 README 的数据目录说明。此处不承诺 Linux 与上游 macOS/Windows 安装器具有相同自动更新流程。

## GPT-6.1 Terra 在哪里？

内置目录包含 OpenAI 与 OpenAI Codex OAuth 的 `gpt-6.1-terra`。在对应服务商下选择；目录存在不保证账号有权限。自定义服务商若使用显式模型列表，不会被内置目录自动覆盖。目录来源与临时补全见 [模型目录维护说明](model-catalog-refresh.md)。

## 应用会走我的系统代理吗？

会。启动时应用会读取操作系统的代理配置——Windows 的 Internet 选项、macOS 的网络设置、Linux 的桌面设置，包含自动配置脚本（PAC/WPAD）——并把它应用到自己发出的全部请求上：模型对话、网页抓取、联网搜索、MCP 服务、插件安装，以及终端里由应用启动的命令。在 Clash、v2rayN 这类客户端里打开“系统代理”开关就够了，不需要在应用里另外填写。

几条需要知道的规则：

- **自己设的环境变量优先。** 启动前设置了 `HTTPS_PROXY`、`HTTP_PROXY` 或 `ALL_PROXY`，应用就用你设的那个，不再读系统代理。`NO_PROXY` 同样生效。
- **改完代理要重启应用。** 代理配置只在启动时读一次。在代理客户端里开关系统代理、或切换节点导致端口变化之后，请退出应用再打开。
- **纯 SOCKS 的配置用不了。** 应用的 HTTP 出口只认 `http://` 和 `https://` 的代理。如果系统代理只配了 SOCKS，请在代理客户端里打开 HTTP 端口或混合端口（Clash 的“混合端口”同时提供两者），再打开系统代理开关。此时应用窗口本身和更新检查仍然正常，只有上面列的那些功能会直连。
- **本机地址永远不走代理。** `localhost`、`127.0.0.1` 和本机的局域网地址会绕过代理，所以本地起的服务、局域网访问不会被代理拦住。
- **已知限制：macOS 和 Linux 上从 Dock 或访达启动时，只写在 `~/.zshrc`、`~/.bashrc` 里的代理变量不会被读取。** 这是刻意的——代理地址里可能带账号密码，应用不从 shell 配置里继承这类变量。请改用系统代理设置，或者从终端启动应用。
- **怎么确认生效了。** 应用每次启动都会在日志里写一行 `outbound proxy = ...`，例如 `outbound proxy = http://127.0.0.1:7890 (source: system, no_proxy: ...)`。`source` 是 `system` 表示用的是系统代理，`environment` 表示用的是你设的环境变量，`none` 表示直连。日志在应用数据目录的 `logs` 文件夹里，也可以用“导出诊断”把它打包出来。报告网络问题时请附上这一行。

## 在哪里下载和报告问题？

从[本 fork 最新 Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest)下载安装包。先导出脱敏诊断，仍无法解决再提交 [GitHub Issue](https://github.com/AL-A-V-Parseval/dsh-desktop/issues)，附系统、版本、复现步骤和错误信息；不要上传凭据、访问 token 或未经检查的完整数据目录。
