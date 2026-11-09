# DSH Desktop 用户指南

[English](user-guide.en.md)

本指南适用于本 fork 的 Linux Stable，当前已发布版为 `v2.0.22-next-linux.1`，内核为 DSH `0.2.2-rc.1`。`dsh-desktop-next`、`DSH NEXT` 和版本中的 `next` 都是兼容标识，不表示预发布。源码可能包含尚未进入安装包的修复。

## 安装与启动

从[本 fork 最新 Release](https://github.com/AL-A-V-Parseval/dsh-desktop/releases/latest)获取 Linux x64 AppImage、便携 tar.gz 或 deb。下载验证、安装和启动命令见[根 README](../README.md#下载与运行)。包内已有 Electron、DSH、Python/Node.js/pnpm 和 Office 资源，无需另装系统 Node 或设置旧 Sharp 桥接变量。

安装版不会在启动时自动更新插件代码。云端模型、插件安装、AA 连接和更新检查仍可能联网。Linux ARM64 源码入口不代表已提供对应的正式包。

## 数据与备份

- 默认数据目录为 `~/.dsh`。应用内选择优先，其次是启动前设置的 `DSH_DESKTOP_NEXT_HOME`，最后使用默认值；旧 `DSH_HOME` 不用于选择桌面数据目录。
- 数据目录选择记录位于 `~/.config/DSH NEXT/home/`，浏览器状态位于所选数据目录的 `electron-user-data/`。不要把数据目录设在应用安装目录里。
- 升级前从桌面设置备份数据，正常退出应用，再替换安装包。不要让多个安装或 CLI 同时修改同一 Profile。
- Profile 分开保存插件依赖、激活列表和补丁；同一个数据目录里的会话、设置与凭据仍共享，Profile 不是账号隔离容器。

## 窗口、设置与 Profile

官方主界面内的 **设置 → 桌面设置** 提供后台运行、数据目录、访问权限、日志和桌面工具。Linux 原生菜单栏默认隐藏，键盘快捷键保留；旧架构的兼容／扩展／增强三模式不适用于本版。

开启后台运行且托盘可用时，关闭主窗口不代表退出；从托盘选择退出才停止 Host。托盘不可用时，关闭主窗口会退出应用。

托盘可新建和切换 Profile，也可打开恢复与诊断工具。切换 Profile 会完整重启应用并中断当前任务；更改端口会重启 Host。浏览器访问开关即时生效。

## 模型和插件

服务商登录、自定义模型和凭据保持原有配置。OpenAI API 与 OpenAI Codex OAuth 目录包含 `gpt-6.1-terra`；是否能调用由账号权限决定，目录更新不会覆盖显式自定义模型列表。

优先在官方**插件**页安装、更新、启停和卸载插件，按页面提示重载。市场、AA 远控和 Computer Use 在列表顶部有各自入口；远控和电脑操作默认关闭。选择一个市场会停用另一个，但不删除已安装的插件。

LiveShare、Ralph、会话搜索和 OAR 子智能体是可选功能。OAR 使用本机已安装并登录的 Codex/Claude Code CLI，权限按其插件设置生效；不是所有可选工具都随包附带外部 CLI。

升级 DSH 内核后，为其他版本安装的官方 Codex/Claude Code 子智能体或官方 Computer Use 可能被移除并重新显示为未安装；在插件页重新开启即可安装匹配版本，不需要删除会话。官方按需 Computer Use 仅适用于 macOS；Linux 使用 Computer Use（Next）。

## Linux 命令行

Linux 当前没有托盘“打开终端”功能。在系统终端中通过应用程序的 `dsh` 子命令使用内置 CLI，例如便携版：

```sh
./dsh-desktop-next dsh --version
./dsh-desktop-next dsh plugin --profile desktop add <plugin>
./dsh-desktop-next dsh plugin --profile desktop remove <plugin>
```

deb 安装后可将 `./dsh-desktop-next` 换成 `dsh-desktop-next`；AppImage 使用对应文件路径。显式指定目标 Profile，执行前停止会修改同一 Profile 的其他操作。此入口不会打开桌面窗口，不要求系统全局安装 `dsh` 或修改 shell 配置。

## 浏览器访问与远控

浏览器访问默认关闭。本机访问启用后提供认证链接；局域网访问单独启用 HTTPS/WSS 入口，Host 仍绑定 `127.0.0.1`。请只向可信设备提供登录链接，并核对局域网 CA 指纹；访问 token 不应进入截图或问题报告。

AA 远控通过插件页独立开启，不等于开放普通浏览器访问。切换 Profile、退出或重启应用都会停止原 Host 及其连接。电脑操作授权也不因开启远控而自动获得。

## 更新

Linux 的 `-linux.N` 版本查询本仓库 GitHub Stable/latest Release，不查询上游 Next 更新服务，不发送安装 UUID。托盘和桌面设置可检查更新；发现新版本后前往发布页，校验下载，再手动替换 AppImage/便携包或执行 `sudo apt install ./<文件名>.deb`。

自动检查不会自动下载或安装，也不会原地修改已经发布的同版本资产。旧架构不再发布新版本。

## 排障与恢复

先从托盘或桌面设置导出诊断。当前诊断是有大小限制的 JSON，包含版本、运行状态、日志及近期证据，不是旧版 ZIP；不主动遍历会话和凭据文件。日志仍可能含本机路径与插件输出，公开分享前应检查。

恢复助手可以在没有正常 Host 时显示失败原因，提供重试、切换 Profile、安全模式、修复、回滚和诊断：

- **安全模式**使用临时数据，不加载原有凭据；退出后回到原 Profile，临时内容不保留。
- **修复 Profile**先备份配置，再停用额外插件并重置补丁选择；不会删除共享会话或凭据，但之后需重新配置插件。
- **回滚 Profile**恢复最近健康启动的配置，不等于回滚所有插件版本或共享数据。备份在数据目录的 `recovery/` 中。

Host 失败报告、插件操作记录和 OOM 内存快照可帮助定位问题；一次内存大占用不证明发生泄漏。请勿上传未经检查的完整数据目录、凭据或访问链接。

完整功能与技术边界见[工作区参考](../dsh-desktop-next/README.zh.md)、[FAQ](faq.md)和[文档索引](README.md)。旧架构设计见[历史架构说明](architecture.md)，不要据此修改当前 Stable 配置。
