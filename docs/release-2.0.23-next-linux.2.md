# DSH Desktop 2.0.23-next-linux.2 — Linux Stable

修复 Linux Office 渲染误报 `libreoffice-kit-linux-x64-glibc` 不完整的问题。
内部 Next 名称、数据目录和 Profile 兼容标识保持不变。

## Office 修复

Electron 对 ASAR 内不存在的路径，`lstatSync(..., { throwIfNoEntry: false })`
返回 `null`，而普通 Node 返回 `undefined`。LibreOfficeKit 0.2.3 原来只排除
`undefined`，把未安装的可选原生引擎误判为“已安装但损坏”，阻止正常选择包内 WASM 引擎。

- 通过版本限定的 Yarn 补丁修正 API、CLI 和编辑器三个入口，同时识别 `null` 和 `undefined`。
- 真正存在但残缺的原生包仍然报错；不吞掉异常，不切换到系统 LibreOffice，也不下载备用引擎。
- 新增真实 Electron/ASAR 回归测试和成品 DOCX→PDF 渲染检查，避免只验证插件注册与 Host 启动。

## 同步内容

包含上一发行之后合并的 11 个上游提交，截止 `3bee0528fb`：Linux 双语菜单、
Windows/macOS 更新流程修复和退役兼容代码清理。源内核仍为 DSH `0.2.2-rc.3`。
按上游锁定修复过的 pi-ai `1.3.0`，保留既有模型目录、OAuth 和 API 删除功能。
内置 dshmarket `1.73.20`；AA 从官方 main `98dd0e6e5ddc` 重新构建。

## 安装与验证范围

发布 Linux x64 AppImage、内部签名 deb、便携 tar.gz、校验和与公钥，不覆盖旧不可变发行。
使用临时文档进行验证，不读取或改写用户文档。

根 `yarn check` 通过：2,900 项工作区测试通过、19 项跳过，另有 179 项根脚本测试通过；
包含真实 Electron/ASAR 下“缺失可选引擎”和“残缺已安装引擎”两种情形。
在旧安装版中仅做内存级差异验证后，临时 DOCX 已成功渲染为一页 PDF。
AppImage、deb 和便携包已构建。正式成品在没有任何诊断注入的情况下成功发现包内 WASM，
并把临时 DOCX 渲染为一页 PDF（18,671 字节）。Office 默认/覆盖/停用、Sharp WASM、
内置 CLI 和诊断导出检查均通过；deb 内部签名和 SHA256SUMS 已核对。

应用代码及依赖来自 `60b4290d4c`。后续发行记录提交只更新文档，不改变已验证的应用字节。
未执行 ARM64、Windows/macOS 原生打包、真实账号 OAuth 登录或付费模型调用。
