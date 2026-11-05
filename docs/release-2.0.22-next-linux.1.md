# DSH Desktop 2.0.22-next-linux.1 — Linux Stable

跟随上游 Desktop `v2.0.22-next`，合并至 `a8b98656fd`。
Linux Stable 与 Beta 运行时共同升级至 DSH `0.2.2-rc.1`；本 fork 发布主线仍为 `dsh-desktop-next`。
`next` 名称及数据目录锚点保留以兼容已有安装，不表示预发布。

## 更新

- 合入上游 17 个提交：原生文件上下文菜单操作、图片拖拽、LiveShare owner 登录弹窗及 reader 兼容修复、打包内置 CLI 的 Node 模式修复。
- 更新运行时与插件家族，保留 Terra 模型、OAuth 入口、按 SDK 版本适配、Linux 菜单快捷键、Sharp WASM 和单次 Office 组合。
- 继承上游对其他 DSH 版本的按需安装 bundle 的清理：旧版 Codex/Claude Code 子智能体或官方 Computer Use 可能重新显示为未安装，可在插件页重新启用以安装匹配版本；不删除会话、附件或凭据。
- 内置 dshmarket `1.73.11`；Agents Anywhere 来自官方 main `296f70ed4036`，构建依赖按其 rc.1 源码适配。
- fork Linux 更新入口仍查询本仓库 Stable Release，手动下载；不切换到上游发行渠道。

## 安装与范围

仅发布 Linux x64：AppImage、签名 `.deb` 和便携 `.tar.gz`，附 `SHA256SUMS` 与公钥。
升级前正常退出应用并备份数据；保留已有数据根、Profile、凭据、会话及附件，不清空数据。
官方按需安装 Computer Use 仍仅适用于 macOS；Linux 保留 Computer Use（Next）。

## 验证

根 `yarn check` 通过：Market 320 项、共享 legacy 403 项、Next 全量 1,251 项、Beta 差异测试 681 项，总计 **2,655 项通过、17 项跳过**，并通过类型、布局与兼容检查。运行时一致时按现有规则选择 Beta 差异测试，未宣称执行 Beta 或 legacy 全量套件。

Linux x64 AppImage 和 deb 构建通过。真实成品检查覆盖 Sharp WASM 有/无 Host 钩子的附件读取与图像解码、内置 `dsh 0.2.2-rc.1`、Host 默认/Office 覆盖/Office 停用模式及诊断导出。Beta 的真实 Electron Node-mode Host 也通过插件管理、恢复、Profile 切换和独立 Computer Use 注册检查。

发行依赖与代码来自合并提交 `2cb10449fd`；后续发行记录提交仅补充实际验证结果，不修改应用代码或依赖。

未执行 ARM64、Windows/macOS 原生打包、真实账号 OAuth 登录及付费模型调用。
本次只合并并发布，不替换本地安装，不重启当前应用，也不包含 Tauri 或内存优化改造。
