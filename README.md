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

<p align="center"><sub>本仓库是社区 fork，基于 <a href="https://github.com/anywhere-labs/dsh-desktop">anywhere-labs/dsh-desktop</a>（上游 master 清单版本 <strong>2.0.14</strong>，最近发布 <strong>2.0.13</strong>；runtime <code>0.1.7-rc.1</code>）。与 DeepSeek（深度求索）及上游项目不存在隶属、合作、授权或背书关系。</sub></p>

## 这是什么

DSH Desktop 将 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的本地 Web UI、Host 服务和插件系统集成进原生桌面应用。它固定并原样运行特定上游版本，通过 DeepSeek Harness 的插件机制与上游能力组合。

本 fork **聚焦 Linux**：修复上游桌面端在 Linux 上无法稳定运行的问题，让 `bash` / `glob` / `grep` 等子进程工具、插件市场与附件等能力在 Linux 上可用。

- 上游基线：上游 [anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop) 最新 `master`（构建基线 `9c65ef7291`，清单版本 2.0.14，最近发布 tag `v2.0.13`）
- 目标平台：**Linux x64**
- 产物：便携包（tar.gz）与 Debian/Ubuntu 安装包（.deb），随 `SHA256SUMS` 提供 GPG 分离签名，`.deb` 另含 `debsigs` 内部签名

## 本 fork 相对上游的改动

### 1. Linux 支持扩展 / 增强窗口模式

此前 fork 只提供兼容模式。Electron 在 Linux 上支持 **Window Controls Overlay**（`titleBarStyle: "hidden"` + `titleBarOverlay`），因此本 fork 让 **扩展模式** 与 **增强模式** 也能在 Linux 上运行：无边框窗口仍保留原生最小化 / 最大化 / 关闭按钮，扩展模式使用渲染进程内的独立命令栏，增强模式使用 32 像素 caption row。内容为命令栏让出顶部 36 像素，避免与原生窗口按钮重叠。

### 2. sharp 走真实 Node 桥接（修复 Host 反复崩溃 / 前端一直「重连」）

Linux 版 Electron 会向进程空间泄漏 glib 符号，与 sharp/libvips 的 GObject 状态冲突，首次图像操作即触发 `g_object_unref` 空指针，使 Host 进程 SIGSEGV（exit 139），前端因此一直重连。

本 fork 让 sharp 在 Electron 宿主中不再直接加载，而是把每个图像操作转发给一个运行在**真实 Node** 中的独立进程；非 Electron 环境（构建脚本、纯 Node、worker 自身）仍然使用原生 sharp。

### 3. 子进程 runner 统一 Electron RunAsNode

修复 Linux 下所有子进程工具失败（`subprocess scope exited before its bootstrap consumed the launch request`）：私有 runner 通过打包后的 Electron 启动时，现在会设置 `ELECTRON_RUN_AS_NODE=1`（原先仅 Windows 生效）。

### 4. 修复上游打包 smoke 的 asar stats 问题

上游现已全面禁用 ASAR。打包 smoke 会列出 `resources/`（其中包含 Electron 自带的 `default_app.asar`），而 Electron 对该 `.asar` 路径的 `fs.stat(..., { bigint: true })` 返回 Number 字段，导致 `dsh-fs-local` 的 `info.mode & 511n` 抛出 `Cannot mix BigInt and other types`、打包中断。本 fork 让 `dsh-fs-local` 兼容 Number stats，Linux 打包（含 smoke）可完整通过。

### 5. 同步单元测试

两版 `tests/package.spec.ts` 更新了 RunAsNode 用例并新增 sharp bridge 用例；`verify-packaged-runtime.ts` / `verify-electron-fuses.ts` 适配 Linux。

具体实现见 `.yarn/patches/`、`patches/` 与提交历史。

## 下载与运行

从 [Releases](https://github.com/AL-A-V-Parseval/dsh-desktop/releases) 获取 Linux x64 安装包，提供两种形式。下面命令中的 `<version>` 请替换为 Release 页面上的实际版本号（形如 `X.Y.Z-linux.N`）。

### 便携包（tar.gz）

```sh
tar -xzf DSH-Desktop-<version>-x64-portable.tar.gz
cd DSH-Desktop-<version>-x64
./dsh-desktop        # 2.0.13-linux.* 的包内二进制名为 ./dsh-plugin-desktop
```

### Debian / Ubuntu 安装包（.deb）

```sh
sudo apt install ./dsh-desktop_<version>_amd64.deb
# 或：sudo dpkg -i dsh-desktop_<version>_amd64.deb && sudo apt -f install
```

安装后可从应用菜单启动，或在终端运行 `dsh-desktop`。`.deb` 会：

- 安装到 `/opt/dsh-desktop`
- 提供 `/usr/bin/dsh-desktop` 命令、`.desktop` 菜单项与图标
- 在 `postinst` 中设置 `chrome-sandbox` 的 setuid 权限
- 声明 `Recommends: nodejs`（sharp 桥接需要真实 Node）

卸载：`sudo apt remove dsh-desktop`（用户数据 `~/.config/DSH Desktop` 不会被删除）。

两种形式都要求：

- Linux x64，且具备可运行 Electron 的桌面会话
- 系统需安装**真实 Node**（sharp 桥接使用；默认依次查找 `/usr/bin/node`、`/usr/local/bin/node`、`/opt/homebrew/bin/node`，可用环境变量 `DSH_SHARP_NODE` 指定）
- 用户数据写入 `~/.config/DSH Desktop`

### 校验签名

- `SHA256SUMS` 随附 GPG 分离签名 `SHA256SUMS.asc`（密钥 `Jic2007 <ji070122@outlook.com>`，指纹 `7B0C 9365 5F35 FA86 48AC 58BC 8E97 ED35 D906 329C`，公钥 `Jic2007-release-key.asc`）。
- `.deb` 另含 `debsigs` origin 内部签名。

```sh
gpg --import Jic2007-release-key.asc
gpg --verify SHA256SUMS.asc SHA256SUMS
sha256sum -c SHA256SUMS
# 可选：校验 .deb 内部签名（需要 debsigs）
debsigs --verify dsh-desktop_<version>_amd64.deb
```

## 从源码构建

```sh
git submodule update --init --recursive
corepack yarn install
DSH_AA_SOURCE_REF=pinned corepack yarn package:dir
# 产物：dsh-plugin-desktop/dist/linux-unpacked/
```

开发运行：`corepack yarn dev`

## 已知限制

- 仅适配 Linux。Windows / macOS 请使用[上游项目](https://github.com/anywhere-labs/dsh-desktop)。
- 构建产物已签名（`SHA256SUMS.asc` + `.deb` 内部签名）；Linux 的托盘与原生集成等平台细节未额外打磨。
- sharp 桥接按需为每次操作启动真实 Node 进程，会有少量进程启动开销；市场图标与附件处理频率低，可接受。

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

## License

本项目遵循 [MIT License](LICENSE)。

> “DeepSeek Harness”是深度求索公司的注册商标。本文仅为准确说明兼容性与技术来源而使用该名称。本项目完全开源免费；如有人以任何形式向您出售，请拒绝交易。
