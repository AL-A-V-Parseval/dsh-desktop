# Linux DSH Desktop：PPTX 静态渲染引擎备选

**建议：用原生 LibreOffice 做同源对照，优先评估 ONLYOFFICE Document Builder 和 Aspose.Slides 作为独立离线后端。** 已有自托管服务时可评估 ONLYOFFICE Docs；若不能引入原生运行时，再评估 Spire JavaScript WASM。以下是文档调查，不是渲染实测：格式支持不等于保真，均未验证目标 Linux/Electron 成品或 13 页场景。现有 WASM 的修复路径见[另文](office-wasm-repair-options.md)。

## 原生进程或自托管

| 候选 | 离线与接入 | 许可与取舍 |
| --- | --- | --- |
| 原生 LibreOffice Impress | 本机启动 `soffice`，用独立可写用户配置目录，按[命令行参数]和[转换过滤器]走 PPTX → `impress_pdf_Export` → 按页栅格化 PNG。 | [MPL 2.0 及第三方组件许可][lo-license]；优先用单独安装的系统版本做对照。与[现有 WASM](office-wasm-repair-options.md)同属 LibreOffice，不是独立渲染引擎，不能推定避开同源问题。 |
| ONLYOFFICE Document Builder | [Linux CLI][oo-cli]无需完整编辑器或 Docs 服务；用固定脚本[打开本地 PPTX][oo-pptx]，[保存 PDF 或 PNG 缩略图][oo-save]，可输出全页图片 ZIP。适合由独立进程执行。Desktop Editors [支持本地离线交互][oo-desktop]，但[公开启动参数][oo-flags]未给出受支持的无头批量导出接口。 | [源码 AGPL v3][oo-builder]；[官方免费发行版文档][oo-install]说明生成内容带水印，去掉水印需要商业许可。分别核查源码构建与所选发行物的打包分发条件。 |
| ONLYOFFICE Docs / Document Server | [Linux 自托管][oo-server]，可同机或在私有网络运行，不依赖厂商云；[转换 API][oo-conversion]通过服务可读 URL 取文件，10.0 起也支持[直接向该服务提交文件][oo-file]。[格式表][oo-formats]列出 PPTX → PDF/PNG；[全页缩略图][oo-request]返回 ZIP。自托管仍需运维、鉴权和输入输出生命周期管理，不建议为单桌面实例默认附带整套服务。 | [Community 为 AGPL v3][oo-community]；[Developer 为商业集成选项][oo-developer]。先确认部署、分发和适用的源码义务；不能把自托管等同于可随应用免费分发。 |
| Aspose.Slides for .NET | 通过独立 .NET 进程运行；[跨平台包][aspose-linux]支持 Linux，需核对目标架构、glibc 和字体依赖。官方支持 [PPTX → PDF][aspose-pdf]及[逐页 PNG][aspose-png]；[普通许可证文件可离线验证][aspose-license]，计量许可需联网。 | 商业 SDK，评估版有水印及内容限制。对外分发确认 [OEM 条款][aspose-oem]；若产品向第三方开发者暴露该能力，还需核查[公开 API / SDK 条款][aspose-sdk]，不要假设普通 OEM 即可。 |
| Syncfusion PresentationRenderer | 官方 Linux 指南用 .NET 8+，提供 [PPTX → PDF][sf-pdf]和[逐页图片][sf-img]，需要相应架构的 SkiaSharp/HarfBuzzSharp 原生资产；可作为不依赖云端转换的 .NET 子进程评估。 | 需要有效许可，按[许可模式][sf-license]核对 Community 资格、产品分发和所选版本的离线运行。 |

## Chromium / WASM

- **Spire.Presentation for JavaScript：商业独立 WASM 候选。** 厂商的[浏览器示例][spire-wasm]展示本地 WASM 和虚拟文件系统，[转换指南][spire-convert]列出 PDF 和图片输出。[免费 JS 版][spire-free]只转换前 3 页，不能满足 13 页需求。选型前在打包后的 Electron 本地来源验证 WASM 加载、许可校验和断网运行，并取得明确的[商业分发授权][spire-sale]；购买页本身不是授权证明。厂商另有 [Linux Python SDK][spire-python]，可作为独立进程备选。
- **开源预览：`@extend-ai/react-pptx` 和 `@office-kit/pptx-preview`。** [前者][react-pptx]为 MIT，使用独立 [Duke Office Rust/WASM 解析器][duke]和 React HTML/SVG 渲染，可用本地文件及自定义 WASM 来源；不播放转场或动画，SmartArt 依赖文件内保存的图形，未提供通用 PDF 导出。[后者][officekit-js]为 MIT（附带字体另有许可），浏览器内输出 SVG，Node 可用 resvg 输出 PNG；上游明确标为实验级，记录了 SmartArt、WMF 和 3D 等缺口。可评估离线预览或缩略图；若用 Electron [`capturePage` / `printToPDF`][electron-capture]，捕获的是已渲染网页，不会补齐 PPTX 兼容性。保持[渲染器沙箱和上下文隔离][electron-security]，不开放 Node 权限或外部资源访问。

**微软云端（仅参考）：** [Microsoft Graph][graph]可在有相应权限时将 OneDrive/SharePoint 的 PPTX `driveItem` 下载为 PDF，不是离线本地后端。Microsoft [不支持无人值守的 Office 自动化][ms-automation]；不建议把它作为 Linux 桌面的后备路径。

## DSH 接入与验收

- [OfficeKit 契约][dsh-contract]包括 `renderImages`、`convert`、`convertTo` 与电子表格 `recalculate`。PPTX 专用后端仅用于显式选择的静态渲染/导出，不替换全服务，也不在失败后自动切换。子进程无头不等于沙箱：只授予所需输入和临时目录权限，限制联网、时间、内存和输出大小。
- 暂不判断哪个引擎保真更高。获准验证时，用正常的公开或获授权多页素材，在最终 Linux 包上断网核对 PDF/PNG 的页数、顺序、尺寸及可见内容。固定字体和 DPI，覆盖中西文换行、图表、SmartArt、母版和普通放映转场；与 PowerPoint 的静态参考输出比对。同步核对发布许可及目标架构依赖。本次未安装、运行渲染器或上传任何文档。

[命令行参数]: https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html
[转换过滤器]: https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html
[lo-license]: https://libreoffice.org/licenses
[oo-cli]: https://api.onlyoffice.com/docs/document-builder/using-cli/overview
[oo-pptx]: https://api.onlyoffice.com/docs/office-api/usage-api/presentation-api#opening-an-existing-presentation
[oo-save]: https://api.onlyoffice.com/docs/document-builder/builder-framework/CDocBuilder/SaveFile
[oo-desktop]: https://github.com/ONLYOFFICE/DesktopEditors
[oo-flags]: https://api.onlyoffice.com/docs/desktop-editors/usage-api/command-line-flags
[oo-builder]: https://github.com/ONLYOFFICE/DocumentBuilder
[oo-install]: https://api.onlyoffice.com/docs/document-builder/get-started/installing
[oo-server]: https://helpcenter.onlyoffice.com/docs/installation/community/docker/installing/install
[oo-conversion]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/
[oo-file]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/request-from-file
[oo-formats]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/conversion-tables#presentation-file-formats
[oo-request]: https://api.onlyoffice.com/docs/docs-api/additional-api/conversion-api/request
[oo-community]: https://helpcenter.onlyoffice.com/docs/installation/community/faq
[oo-developer]: https://helpcenter.onlyoffice.com/docs/installation/developer/faq
[aspose-linux]: https://docs.aspose.com/slides/net/system-requirements/
[aspose-pdf]: https://docs.aspose.com/slides/net/convert-powerpoint-to-pdf/
[aspose-png]: https://docs.aspose.com/slides/net/convert-powerpoint-to-png/
[aspose-license]: https://docs.aspose.com/slides/net/licensing/
[aspose-oem]: https://purchase.aspose.com/policies/license-types
[aspose-sdk]: https://purchase.aspose.com/policies/use-within-public-sdk-or-api
[sf-pdf]: https://help.syncfusion.com/document-processing/powerpoint/conversions/powerpoint-to-pdf/net/convert-powerpoint-to-pdf-in-linux
[sf-img]: https://help.syncfusion.com/document-processing/powerpoint/conversions/powerpoint-to-image/net/convert-powerpoint-to-image-in-linux
[sf-license]: https://syncfusion.com/legal/licensing-model
[spire-wasm]: https://www.e-iceblue.com/Tutorials/JavaScript/Spire.Presentation-for-JavaScript/React/Conversion/convert-powerpoint-to-markdown-in-react.html
[spire-convert]: https://cdn.e-iceblue.com/Spire.Presentation-for-Javascript/Program-Guide/Conversion.html
[spire-free]: https://www.e-iceblue.com/Introduce/free-presentation-for-javascript.html
[spire-sale]: https://cdn.e-iceblue.com/Buy/Spire.Presentation-JavaScript.html
[spire-python]: https://cdn.e-iceblue.com/Knowledgebase/Python/Spire.Presentation-for-Python/Getting-Started.html
[react-pptx]: https://github.com/extend-hq/react-pptx#rendering-boundaries
[duke]: https://github.com/extend-hq/duke-office/tree/main/crates/duke-slides-wasm
[officekit-js]: https://github.com/office-kit/pptx/tree/main/packages/preview
[electron-capture]: https://www.electronjs.org/docs/latest/api/web-contents
[electron-security]: https://www.electronjs.org/docs/latest/tutorial/security
[graph]: https://learn.microsoft.com/en-us/graph/api/driveitem-get-content-format?view=graph-rest-1.0
[ms-automation]: https://support.microsoft.com/en-us/visio/considerations-for-server-side-automation-of-office
[dsh-contract]: ../deepseek-harness/docs/subsystems/office-kit.md#requests-and-results
