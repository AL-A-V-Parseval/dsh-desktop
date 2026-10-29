<p align="center">
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop"><img src="assets/desktop-hero-zh.png" alt="DSH Desktop for Linux：基于 DeepSeek Harness 的 Linux 桌面客户端" width="100%"></a>
</p>

<h1 align="center">DSH Desktop for Linux</h1>

<p align="center">
  <strong>基于 DeepSeek Harness 构建、面向 Linux 的社区桌面客户端。</strong>
</p>

<p align="center">
  万物皆「插件」，桌面本身也是「插件」。
</p>

<p align="center">
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop/releases"><img src="https://img.shields.io/github/v/release/AL-A-V-Parseval/dsh-desktop?style=flat&amp;label=release&amp;color=4D6BFE" alt="Latest release"></a>
  <a href="https://github.com/AL-A-V-Parseval/dsh-desktop/stargazers"><img src="https://img.shields.io/github/stars/AL-A-V-Parseval/dsh-desktop?style=flat&amp;label=%E2%98%85&amp;color=08C" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F?style=flat" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Linux-x64-4493F8?style=flat-square" alt="Target platform: Linux x64">
</p>

<p align="center"><sub>本仓库是 <a href="https://github.com/anywhere-labs/deepseek-harness-desktop">anywhere-labs/deepseek-harness-desktop</a> 的 Linux 社区 fork。与 DeepSeek（深度求索）及上游项目不存在隶属、合作、授权或背书关系。</sub></p>

## 这是什么

> **Linux 发版主线调整（2026-10-27）：** 自 [`v2.0.20-next-linux.1`](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/tag/v2.0.20-next-linux.1) 起，原 Next 新架构成为本 fork 的 **Stable / latest**，旧架构停止发版（最后一版为 `v2.0.18-linux.1`）。为兼容已有安装、数据目录及后续上游合并，保留版本中的 `next`、`DSH NEXT` 显示名称和内部标识，**它们不再表示本 fork 的预发布通道**。已签名的安装包及 tag 不变；源码目录名与发布稳定性分开管理，规则见 [`linux-release-policy.json`](linux-release-policy.json)。根目录的 `dev`、`start`、`package:dir`、`dist:linux` 默认使用新架构。
>
> 当前正式版为 [`v2.0.20-next-linux.2`](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/tag/v2.0.20-next-linux.2)。文件名前缀为 `DSH-NEXT-<version>`，便携程序为 `dsh-desktop-next`；默认数据目录为 `~/.dsh`，已选择的数据目录优先。首次从旧架构切换前请备份数据。当前源码已继续合并上游，**源码版本不等于已经发布的安装包版本**。

DSH Desktop 将 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的本地 Web UI、Host 服务和插件系统集成进原生桌面应用。它固定并原样运行特定上游版本，通过 DeepSeek Harness 的插件机制与上游能力组合。

本 fork **聚焦 Linux**：修复上游桌面端在 Linux 上无法稳定运行的问题，让 `bash` / `glob` / `grep` 等子进程工具、插件市场与附件等能力在 Linux 上可用。

- 上游合并快照：`0e249397f8`；本分支源码版本为 `2.0.21-next-linux.1`（尚未发布）
- 源码运行时：Linux Stable 工作区 `dsh-desktop-next/` → `0.2.1-rc.4`；Beta → `0.2.2-alpha.2`；旧工作区保留 `0.2.1-rc.3`。各源码 pin 见 [`upstream.json`](upstream.json)，Linux 发布边界见 [`linux-release-policy.json`](linux-release-policy.json)
- 已发布 `linux.2` 使用 `0.2.1-rc.3`，不会因源码合并而改变已签名资产
- 目标平台：**Linux x64**
- 产物：AppImage、便携包（tar.gz）与 Debian/Ubuntu 安装包（.deb），随 `SHA256SUMS` 提供校验和，`.deb` 另含 `debsigs` 内部签名

## 本 fork 相对上游的改动

### 1. 新 Stable 桌面与 Linux 菜单

主窗口使用官方 Web 前端，保留 Profile、恢复助手、桌面设置和插件集成。Linux 原生菜单栏在启动及刷新后保持隐藏，同时保留真实 Electron 键盘快捷键。旧版兼容／扩展／增强三模式不再作为当前 Stable 的使用说明。

### 2. 上游 Sharp WASM 与真实附件回归

Linux 图像处理使用上游 Sharp 0.35.5 的 WASM 后端。旧的真实 Node 子进程桥接、全局 Sharp 补丁覆盖及绕过逻辑已移除；无需安装系统 Node、设置 `DSH_SHARP_NODE`，也无需删除会话或转换有效历史图片。成品检查覆盖有／无 Host 钩子时的附件读取和完整图像解码。

### 3. 子进程 runner 统一 Electron RunAsNode

修复 Linux 下所有子进程工具失败（`subprocess scope exited before its bootstrap consumed the launch request`）：私有 runner 通过打包后的 Electron 启动时，现在会设置 `ELECTRON_RUN_AS_NODE=1`（原先仅 Windows 生效）。

### 4. 修复上游打包 smoke 的 asar stats 问题

新架构使用 ASAR 与按需解包的原生／Office 资源。Electron 对部分 ASAR 路径的 `fs.stat(..., { bigint: true })` 仍可能返回 Number 字段，`dsh-fs-local` 兼容补丁避免 `Cannot mix BigInt and other types`；不为清理历史代码而删除仍有用途的兼容修复。

### 5. 模型目录、OAuth 与插件市场

保留服务商登录和自定义模型。内置目录包含 OpenAI API 与 OpenAI Codex OAuth 的 `gpt-6.1-terra`，目录数据更新不替换协议／OAuth 实现，也不改默认模型或凭据。来源与重建方式见 [`docs/model-catalog-refresh.md`](docs/model-catalog-refresh.md)。模型目录不保证账号访问权限。插件安装、启停、卸载与社区插件更新使用官方插件管理器，保留 Market 与 AA 集成。

具体实现见 `.yarn/patches/`、`patches/` 与提交历史。

### 6. 内置官方运行时载荷（Python / Node.js / pnpm + Office 技能）

打包版携带与上游同源、按锁定清单校验的 Python、Node.js、pnpm 和 Office 技能，位于 `resources/runtime/<arch>/`。Office 与 `load_workspace_dependencies` 由单一 Host 组合挂载；`DSH_PRIMARY_RUNTIME` 可指定含 `runtime.json` 的 payload 目录，空字符串禁用该组合，避免新旧两套工具重复注册。

### 本次源码合并的上游改进

新增独立的 Next 运行时通道、按版本选择的官方插件索引与更新流程、dshfind 来源选项、裸 `dsh-session:` 文本处理修复，以及渲染进程 OOM 的内存证据和可读 Host 退出诊断。Beta 另补齐 LiveShare、Ralph 和会话搜索的插件列表入口，不表示默认启用。这些是当前源码改进，不表示已发布 `linux.2` 安装包被更新；具体行为与验证入口见 [工作区文档](dsh-desktop-next/README.zh.md)。

## 下载与运行

从 [最新正式版](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest) 获取 Linux x64 的 **AppImage**、**便携包（tar.gz）** 或 **Debian 包**。将 `<version>` 替换为 Release 页面上的实际版本，例如 `2.0.20-next-linux.2`。

### AppImage（免安装）

```sh
chmod +x DSH-NEXT-<version>-x86_64.AppImage
./DSH-NEXT-<version>-x86_64.AppImage
```

`DSH-NEXT-` 是保留的兼容文件名前缀，不表示预发布。

### 便携包（tar.gz）

```sh
tar -xzf DSH-NEXT-<version>-x64-portable.tar.gz
cd DSH-NEXT-<version>-x64-portable
./dsh-desktop-next
```

便携程序同样使用已选择的数据目录；它不会自动隔离或复制现有账号与会话。

### Debian / Ubuntu 安装包（.deb）

```sh
sudo apt install ./DSH-NEXT-<version>-amd64.deb
```

包名与启动命令为 `dsh-desktop-next`，安装路径为 `/opt/DSH NEXT`。卸载使用 `sudo apt remove dsh-desktop-next`；数据不会因此自动删除。不要同时运行共享同一数据目录的新旧安装。

各形式都要求：

- Linux x64，且具备可运行 Electron 的桌面会话
- 具备 Electron 所需的系统动态库；图像 WASM 和 Office 载荷随包携带，不要求系统安装 Node
- 会话、设置、凭据与 Profile 默认在 `~/.dsh`；Electron 偏好在 `~/.config/DSH NEXT`，手动选择的数据目录优先

### 校验下载完整性与来源

**一、来源与完整性证明（在线，零配置，推荐）**

本仓库已开启 GitHub **immutable releases**：自 `v2.0.16-linux.1` 起，每个版本都会由 GitHub 自动生成 **release attestation**（Sigstore 格式，覆盖 tag、commit SHA 与全部资产），用 GitHub CLI 即可验证，无需导入任何公钥：

```sh
gh release verify v<version> --repo AL-A-V-Parseval/dsh-desktop
gh release verify-asset v<version> ./DSH-NEXT-<version>-x86_64.AppImage --repo AL-A-V-Parseval/dsh-desktop
```

**二、校验和（离线可用，适用于镜像 / 内网）**

每个 Release 提供 `SHA256SUMS`：

```sh
sha256sum -c SHA256SUMS
```

**三、tag 与 .deb 的签名**

- release tag 是 **GPG 签名的注解 tag**（自 `v2.0.15-linux.1` 起），可 `git tag -v v<version>` 本地验证；公钥为 `Jic2007-release-key.asc`，指纹 `7B0C 9365 5F35 FA86 48AC 58BC 8E97 ED35 D906 329C`。
- `.deb` 另含 `debsigs` **origin** 内部签名。`debsigs --list` 只能列举签名，不等于密码学验签；下载验证优先使用上面的 release attestation／资产验证，并独立核对发布公钥指纹。

**四、关于 `SHA256SUMS.asc`**

为精简发布资产（GitHub attestation 已覆盖在线来源验证，`SHA256SUMS` 覆盖离线校验），**较新的版本不再附带 `SHA256SUMS.asc`**。`v2.0.16-linux.1` 及更早的版本仍带该文件，可继续用：

```sh
gpg --import Jic2007-release-key.asc && gpg --verify SHA256SUMS.asc SHA256SUMS
```

**五、不可变发布**

已发布的 tag 与资产**不可再修改**；需要变更时请发布新的版本后缀（例如 `-linux.2`）。`v2.0.15-linux.1`、`v2.0.15-next-linux.1` 及更早的版本生于开启 immutable 之前，没有 attestation。

## 从源码构建

```sh
git submodule update --init --recursive
corepack yarn install --immutable
corepack yarn check
corepack yarn package:dir
# 产物：dsh-desktop-next/dist/linux-unpacked/
# AppImage / deb：corepack yarn dist:linux
```

构建需要 Node.js `^22.19.0` 或 `>=24.0.0`、Corepack 与根 Yarn `4.18.0`。根构建／启动入口会准备最新版 Market 与官方 AA；生成的依赖、来源记录及 lockfile 需一起提交，旧 `pinned` 参数已废止。开发运行：`corepack yarn dev`。详细边界见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 已知限制

- 仅适配 Linux。Windows / macOS 请使用[上游项目](https://github.com/anywhere-labs/dsh-desktop)。
- 发布来源与完整性由 GitHub release attestation（`gh release verify`）与 `SHA256SUMS` 共同保证，另有 GPG 签名 tag 与 `.deb` 内部签名；Linux 的托盘与原生集成等平台细节未额外打磨。
- 版本中的 `next` 不代表本 fork 的预发布；Beta 仅用于开发验证。不要用源码构建结果覆盖同版本的不可变 Release。

## 文档

- 用户指南：[`docs/user-guide.md`](docs/user-guide.md)
- 常见问题：[`docs/faq.md`](docs/faq.md)
- 文档索引：[`docs/README.md`](docs/README.md)
- 上游项目：[anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop)

## 致谢

本 fork 的全部核心能力均来自上游与以下开源项目：

- [DSH Desktop](https://github.com/anywhere-labs/dsh-desktop) 与 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [Cordis](https://github.com/cordiverse/cordis)
- [Koishi](https://koishi.chat/)

## 关于我们

我们因对开源的热爱而相聚，以协作推动创新，共同将 AI 的可能性转化为触手可及的工具与体验。

<p align="center">
  <a href="https://github.com/anywhere-labs/about-us"><img src="https://img.shields.io/badge/%E8%AE%A4%E8%AF%86%E6%88%91%E4%BB%AC%E7%9A%84%E5%9B%A2%E9%98%9F-Anywhere%20Labs-4D6BFE?style=for-the-badge" alt="认识我们的团队"></a>
</p>

## License

本项目遵循 [MIT License](LICENSE)。

> “DeepSeek Harness”是深度求索公司的注册商标。本文仅为准确说明兼容性与技术来源而使用该名称。本项目完全开源免费；如有人以任何形式向您出售，请拒绝交易。
