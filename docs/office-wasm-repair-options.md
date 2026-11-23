# DSH Office WASM：PPTX 静态渲染修复路径

**建议：优先采用 DeepSeek 维护者确认修复的正式版本。** 截至 2026-11-21，官方 npm 的 [Node 适配器][npm-entry]和 [WASM 引擎][npm-wasm]均为 `latest=0.2.3`、`next=0.2.3-rc.4`，没有查到可直接升级的修复版。官方 [GitHub Releases][releases]和 [Tags][tags]均为空；公开 `master` 的[工作区清单][workspace]仍是 `0.1.3`，其文档可用来理解构建流程，但不能把该 checkout 当作 npm `0.2.3` 的完整发布源码。本次只核对公开资料，未验证故障根因。

## 维护选项

1. **正式升级。** 请维护者确认候选版本是否修复 PPTX 静态导出/预览，再按适配器声明的 `ENGINE_VERSIONS` 固定配套引擎和锁文件。`discoverRuntime().version` 标识的是 Node API 版本，不能单独证明装入了哪一份 WASM。`0.2.3` 的[包内 README][entry-readme]也明确说明，转换失败不会切换引擎；本问题与[已记录的 Electron/ASAR 引擎发现修复](release-2.0.23-next-linux.2.md)分开处理。
2. **没有正式候选版时，先复建未改动的基线。** `0.2.3` 的[官方 npm 包][npm-wasm]附带 `sources/`，包含固定源码检出脚本、WASM 构建脚本、shim 和补丁。已核对本地依赖中 [`prebuilds.json`][prebuilds] 列出的 48 个文件 SHA-256，均与清单一致。[构建清单][asset-manifest]和[工具链清单][source-pin]记录 LibreOffice Core `26.8.0.3`（`bce0998afefdbc355585ca324285661a2170ba77`）及 Emscripten `4.0.10`。先在隔离目录使用包内配方验证能否复建；完整上游发布工作区与资格验证脚本不等同于这份对应源码配方。若确认需要修改引擎，应保留源 PPTX 内容和放映、编辑语义；[PresentationML 规范摘录][transition]将过渡定义为从上一页进入当前页的放映行为。
3. **构建和打包。** 按 [LibreOffice headless WASM 文档][lo-build]及 [Kit WASM 配方][kit-wasm]，在独立工作目录准备固定版本的 Core/SDK，校验并应用补丁，配置、重新编译、校验构建凭据，再打包和暂存配套 loader、WASM、资源数据与元数据。源码、shim、补丁或工具链变更需要重新编译；仅资源打包变更才可复用已校验编译结果。不要混用不同构建的产物、手换已安装应用中的 `.wasm`，或借桌面改动修改固定的 Harness 子模块（见[仓库规则](../AGENTS.md)）。本次不构建、不发布。

## 候选版本验收

**当前桌面兼容方案：** 使用现有 WASM 渲染 PPTX 图片或导出 PDF 时，仅在传给引擎的临时副本中移除幻灯片、母版及版式的动画和转场。原文件不改写，其他操作不走这条路径。已用未修改的原模板本地验证 13 页 PNG 和 13 页 PDF；公开 PPTX 的 PNG/PDF 转换及 DOCX 转 PDF 也通过。这不是底层引擎修复。

本地已按原配方重建基线：公开 PPTX 的 PNG/PDF 转换通过，原模板仍失败。诊断构建进一步将故障缩小到 Impress 在 PPTX 导入末尾应用 `Speed` 属性时。最后一条日志只说明当时正在处理该属性，不能证明底层原因。目前没有验证通过的引擎补丁；后续应保留转场设置及其语义，不把删掉转场当作引擎修复。

首次候选改动：PPTX 导入器已有精确转场时长时，只设置 `TransitionDuration`；没有精确时长时仍设置 `Speed`。该构建通过了公开 PPTX 的 PNG/PDF 验证，但未修改的原模板仍在 PNG 测试时报告越界，因此没有采用。候选版崩溃前的最后一条属性日志是 `TransitionDirection`，说明故障并不局限于 `Speed`。下一项诊断区分属性读取和更新页面这两步；在确认前，不改变转场语义或页面变更通知。

本地用原文件验证过故障阶段：在隔离的 WASM worker 中，Office 初始化成功，调用 `dsh_lok_document_load` 时触发 `memory access out of bounds`，尚未进入静态输出。移除转场设置的副本可渲染全部 13 页；这只确定了触发条件，不能证明是哪段 Core 逻辑出错。固定版本的 `SlideFragmentHandler` 会将转场元素交给 `SlideTransitionContext`，但调用边界尚不足以确定实际故障函数。发布配方禁用了符号；未改动基线构建通过后，再用独立的带符号构建定位，避免在未验证时改动转场导入或导出语义。

- 按 [Kit 构建及资格验证要求][kit-build]检查候选包元数据、适配器和打包测试，并在目标 Linux/Electron 上对**最终安装字节**做离线验证：记录源码、工具链、补丁、适配器/引擎版本与哈希、架构和许可证；确认选择内置 WASM，无运行时下载或系统 LibreOffice 回退。产物字节有变更就重新验证。
- 复用[实际桌面成品 Office smoke](../dsh-desktop-next/scripts/packaged-office-smoke.mjs)及[上游公开测试素材][fixtures]做普通 PPTX→PNG 和 DOCX→PDF 检查。对候选版另验 PPTX→PDF 与 PPTX→PNG：只用已知正常、获准的公开素材检查普通过渡设置不影响静态内容，核对页数、顺序、尺寸和可见内容（固定字体与 DPI，不能只验文件头）。既有 smoke 不证明覆盖过渡；若没有安全且适合的素材，就将过渡专项验收标为未完成。不得读取或上传原件、制作崩溃样本或复现漏洞。

[npm-entry]: https://registry.npmjs.org/@deepseek-ai%2Flibreoffice-kit
[npm-wasm]: https://registry.npmjs.org/@deepseek-ai%2Flibreoffice-kit-wasm
[releases]: https://api.github.com/repos/deepseek-ai/dsh-libreoffice-kit/releases
[tags]: https://api.github.com/repos/deepseek-ai/dsh-libreoffice-kit/tags
[workspace]: https://github.com/deepseek-ai/dsh-libreoffice-kit/blob/b19bb73c74ed893b8a5d1716d32df32a113ed31b/package.json
[entry-readme]: https://unpkg.com/@deepseek-ai/libreoffice-kit@0.2.3/README.md
[prebuilds]: https://unpkg.com/@deepseek-ai/libreoffice-kit-wasm@0.2.3/prebuilds.json
[asset-manifest]: https://unpkg.com/@deepseek-ai/libreoffice-kit-wasm@0.2.3/assets/manifest.json
[source-pin]: https://unpkg.com/@deepseek-ai/libreoffice-kit-wasm@0.2.3/sources/engine/wasm-source/source.json
[transition]: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.transition#remarks
[lo-build]: https://github.com/LibreOffice/core/blob/bce0998afefdbc355585ca324285661a2170ba77/static/README.wasm.md#building-headless-libreoffice-as-wasm-for-use-in-another-product
[kit-wasm]: https://github.com/deepseek-ai/dsh-libreoffice-kit/blob/b19bb73c74ed893b8a5d1716d32df32a113ed31b/engine/wasm-source/README.md
[kit-build]: https://github.com/deepseek-ai/dsh-libreoffice-kit/blob/b19bb73c74ed893b8a5d1716d32df32a113ed31b/docs/building.md
[fixtures]: https://github.com/deepseek-ai/dsh-libreoffice-kit/tree/b19bb73c74ed893b8a5d1716d32df32a113ed31b/test/fixtures
