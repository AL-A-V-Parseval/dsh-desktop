# DSH Desktop 2.0.23-next-linux.1 — Linux Stable

合并上游 Desktop 27 个提交至 `b3c0442392`，运行时升级至 DSH `0.2.2-rc.3`。
Linux Stable 发布主线仍为 `dsh-desktop-next`；Next 内部名称和数据目录锚点不变。

## 更新

- 合入聊天导入、账号通知、可配置的 Host 启动限时及插件加载进度、渲染器诊断信息。
- 合入 AppImage 沙箱运行路径、直连网络策略、工作目录已删除时技能列表等修复，以及新鲸尾图标。
- 新增 DeepSeek API 配置删除：确认后移除其本地密钥和用户设置，可重新添加；环境变量、只读或共享密钥不提供删除。DeepSeek 账号登录保持独立。
- 保留 Linux 快捷键、Sharp WASM、Office 单次组合与覆盖/停用选项、OAuth 入口和模型兼容补丁。
- 修复 rc.3 改由官方 Web Profile 挂载 Office 后的停用适配；成品检查直接核对插件激活状态，确保无重复挂载。
- 清理先前版本遗留的 15 个无引用补丁；legacy 仍使用的 pi-ai 1.1.0 保留。
- 内置 dshmarket `1.73.19`；Agents Anywhere 从官方 main `aa12e7a2c181` 重新构建，构建记录和校验信息随源码提交。

## 安装与范围

仅打包 Linux x64：AppImage、内部签名 `.deb`、便携 `.tar.gz`，附校验和与公钥。
升级前正常退出应用并备份数据；本次不会清空 Profile、凭据、会话或附件。
官方按需安装 Computer Use 仍为 macOS 专用，Linux 保留默认关闭的 Computer Use（Next）。

## 验证

根 `yarn check` 通过：Market 328 项、共享 legacy 399 项、Next 全量 1,328 项、Beta 差异测试 791 项，共 **2,846 项通过、19 项跳过**，以及类型、布局、镜像、依赖与 Loader 检查。运行时一致时按现有策略选择 Beta 差异测试，未宣称运行 Beta 或 legacy 全量套件。

真实 Host/Chromium 临时 Profile 验证了 rc.3 下 API 取消、删除和重新添加，其他设置和测试密钥保持不变。Beta 的真实 Electron Node-mode Host 检查通过。

Linux x64 AppImage 和 deb 已构建，便携包已生成。成品验证覆盖 Sharp WASM 有/无 Host 钩子的附件读取与图像解码、内置 `dsh 0.2.2-rc.3`、Host 默认/Office 覆盖/Office 停用模式和诊断导出；Office 两个官方插件均核对了唯一性和实际激活状态。deb 内部签名与 SHA256SUMS 校验通过。

应用代码和依赖来自 `252a1e82cd`；后续发行记录提交仅更新文档，不修改已验证的应用字节。签名 tag、公钥和 SHA256SUMS 随发行提供。
未执行 ARM64、Windows/macOS 原生打包、真实账号 OAuth 登录或付费模型调用。
不会自动替换或重启本机已安装应用。
