# DSH Desktop 2.0.23-next-linux.3 — Linux Stable

本次 Linux Stable 发行使用 DeepSeek Harness `0.2.2-rc.4`，内置 GPT‑6.2 Astra／Sol，包含 Office ASAR/WASM 修复、DeepSeek API 配置删除功能，并沿用现有数据目录。

Linux x64 提供 AppImage、签名 Debian 包、便携包、SHA256SUMS 和签名公钥。替换安装前请先退出应用并备份数据。

## 验证

构建自 `50bd95d1d7`。Linux x64 成品通过 Host 启动、内置 CLI、Office 默认／覆盖／停用、实际 DOCX→PDF 渲染及附件解码检查。直接读取成品目录，确认 OpenAI API 与 Codex OAuth 均包含两款 GPT‑6.2 模型；未发起在线模型请求。
