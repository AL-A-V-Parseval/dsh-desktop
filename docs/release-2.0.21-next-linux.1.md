# DSH Desktop 2.0.21-next-linux.1 — Linux Stable

本版跟随上游 Desktop `117e489913`，Linux Stable 使用 DSH `0.2.1-rc.5`。
保留 `next` 版本标识与数据目录以兼容现有安装；本版不是预发布。

## 更新

- 合入上游 67 个提交，包括 Linux 手动更新提示、hicolor 图标、deb GBM/ALSA 依赖、打包后的 `dsh` CLI、窗口恢复、BOM 配置兼容及 Host 失败诊断。
- 保留 Linux 菜单与快捷键、Sharp WASM 附件处理、单次 Office 组合、Terra 模型和分版本 SDK 修复；OAuth 设置入口适配新运行时。
- fork Linux 版本检查本仓库的 Stable Release，仍需手动下载，不会切换到上游 Next 发行渠道。
- 更新内置 dshmarket 至 `1.73.10`，适配已有 Desktop 自更新与回滚补丁；Agents Anywhere 从官方 main `1f827133d6d6` 构建。

## 下载与验证

仅发布 Linux x64：AppImage、Debian/Ubuntu `.deb` 和便携 `.tar.gz`。
随包提供 `SHA256SUMS` 与发布公钥；`.deb` 有内部 origin 签名，tag 使用同一密钥签名。
GitHub Release 发布后验证 immutable 来源证明及产物摘要，不替换历史版本资产。

升级前退出旧应用并备份数据，随后安装或解压新包。保留既有数据目录、Profile、凭据、会话及附件；无需清空或迁移数据。

## 实际验证

- 刷新发行依赖后重新运行根 `yarn check`：2,798 项通过、23 项跳过，含选定共享 legacy 测试及布局/兼容检查。
- `yarn dist:linux` 成功构建 x64 AppImage 与 deb；成品 Host 默认/Office 覆盖/Office 停用模式、Sharp WASM 有/无 Host 钩子、驱动与 badge、内置 `dsh 0.2.1-rc.5` 检查通过。
- 未执行 ARM64 或 Windows/macOS 打包、真实账号 OAuth 登录及付费模型调用。Beta 的官方 Computer Use 按需安装不属于本 Stable 包。
- 本次只发布，不修改或重启本地已安装应用。

Upstream sync details: [2026-11-04](upstream-sync-2026-11-04.md).
