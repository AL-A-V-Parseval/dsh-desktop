# DSH Desktop 2.0.24-next-linux.3 — Linux Stable

- 合并上游至 `0790398f44`，运行时更新到 DeepSeek Harness `0.2.3-alpha.2`。
- **设置 → 订阅**改用 `dsh-plugin-subscriptions` `0.9.14`，支持 ChatGPT（Codex）、Claude、Grok、GitHub Copilot 和 Google Antigravity。旧凭据和 API Key 保留；新订阅入口需重新登录并选择插件提供的模型。
- 修复 Linux 上 Office 服务误报 LibreOfficeKit 安装残缺。PPTX 静态渲染或导出 PDF 时，只在内存副本中移除动画和转场，保留原文件并继续使用内置 WASM。

提供 Linux x64 AppImage、签名 Debian 包、便携包、SHA256SUMS 和签名公钥。替换安装前请退出应用并备份数据。

## 验证

构建自 `52798ed769ee05bb10e1bb8d6f53c6a2248a59e0`。完整源码检查通过；Linux x64 成品验证了内置订阅插件、PPTX 逐页 PNG/PDF 与 DOCX 转 PDF。未发起真实账号登录或模型请求。
