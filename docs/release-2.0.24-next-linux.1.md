# DSH Desktop 2.0.24-next-linux.1 — Linux Stable

- 合并 24 个上游提交至 `e66243ece4`，运行时升级至 DSH `0.2.2-rc.4`。包含桌面设置分组、经典图标选项、诊断改进，以及 ARM64 Linux 重连修复。本次发行产物仅限 Linux x64。
- OpenAI Responses API 和 Codex OAuth 的内置模型目录新增 GPT‑6.2 Astra（`gpt-6.2-astra`）与 Sol（`gpt-6.2-sol`），保留 GPT‑6.1 Terra。实际使用取决于账号权限，不更改默认模型或凭据。
- 保留 Office ASAR/WASM 修复、DeepSeek API 配置删除、Linux 菜单快捷键及现有数据目录。内置 dshmarket `1.73.20` 和从官方 main `76f97145facf` 构建的 Agents Anywhere。

## 升级

提供 AppImage、内部签名的 Debian 包、便携包、SHA256SUMS 和签名公钥。升级前退出应用并备份数据；默认沿用 `~/.dsh` 或已选数据目录。旧发行资产不会被覆盖。

## 验证

应用构建自 `77e72ea467`。根 `yarn check` 通过：3,041 项工作区测试和 184 项脚本测试通过，19 项跳过。
Linux x64 成品通过内置 CLI 版本、Host 和诊断导出、Office 默认／覆盖／停用、WASM DOCX→PDF 和 Sharp 附件解码检查。直接从成品读取模型目录，确认 OpenAI API 与 Codex OAuth 各包含两款 GPT‑6.2 模型。未发起在线模型请求。
