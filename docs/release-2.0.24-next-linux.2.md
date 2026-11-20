# DSH Desktop 2.0.24-next-linux.2 — Linux Stable

- 跟进上游正式发行 `v2.0.24-next`，合并至 `9d851bef94`，运行时升级到 DeepSeek Harness `0.2.2-rc.5`。
- 包含登录 Shell 环境读取修复、Host 与插件健康日志、全屏状态同步和 Unix 打包时保留内置 `uv` 执行权限等上游改进。
- 保留 GPT‑6.2 Astra／Sol、Codex OAuth、DeepSeek API 配置删除、Office ASAR/WASM 修复，以及兼容现有安装的数据目录。

Linux x64 提供 AppImage、签名 Debian 包、便携包、SHA256SUMS 和签名公钥。替换前请退出应用并备份数据。

## 验证

安装包构建自 `d620cd4403`。完整源码检查通过；Linux x64 成品通过 Host、内置 CLI、Office DOCX→PDF 和 GPT‑6.2 模型目录检查。安装后确认 Host 和界面启动、Office 渲染正常，原有桌面 Profile 和凭据未变。
