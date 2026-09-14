# 参与贡献

感谢你愿意为 **DSH Desktop for Linux** 做出贡献。本仓库是 [anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop) 的社区 fork，聚焦让 DSH Desktop 在 Linux 上稳定可用；无论你是普通用户、插件作者还是开发者，都有适合你的贡献方式。

> 与上游桌面版必要功能无关的 PR、以及其他插件收录相关的 PR，可能不会被接受。本仓库主要接受 **Linux 适配与修复** 相关的改动。

## 普通用户：使用、反馈与传播

- 遇到问题或异常，[提 issue](https://github.com/Jic2007/dsh-desktop/issues)：说明你的发行版、应用版本、安装方式（.deb / tar.gz）和复现步骤。
- 有功能想法或改进建议，也欢迎提 issue 讨论。
- 写使用教程、体验文章，或帮助完善和翻译文档。

> 本 fork 不设独立社群，讨论请在本仓库 issue 进行；上游 Windows / macOS 相关问题请到[上游仓库](https://github.com/anywhere-labs/dsh-desktop/issues)。

## 插件作者：扩展生态

DSH 的核心是插件。如果你写插件，请先阅读：

- [插件开发](docs/plugin-development.md)：如何编写普通 DSH 插件和 Desktop 插件。
- [DSH 插件生态倡议书](docs/plugin-ecosystem.md)：开放、可组合、可持续的生态愿景，以及组合优先、声明清晰、兼容优先三条原则。
- [DSH Community Fabric Draft](dsh-community-fabric/README.zh.md)：参与 Manifest、Capability、Host Descriptor 和事件 contract 的公开讨论。
- [Community Market 设计](dsh-community-market/docs/market-shell.zh.md)：未来市场如何发现插件，以及为什么收录不等于安全审核。

遵循倡议书的插件更容易与其他插件共存，也会在未来上线时更容易在插件市场中被发现和信任。

## 开发者：贡献代码

### 开发环境

```sh
git submodule update --init --recursive
corepack yarn install --immutable
corepack yarn check   # 完整 headless gate：构建、类型检查、测试与冒烟
corepack yarn dev     # 有图形环境时启动应用
```

构建 Linux 未打包应用与安装包：

```sh
DSH_AA_SOURCE_REF=pinned corepack yarn package:dir   # 产物：dsh-plugin-desktop/dist/linux-unpacked/
```

本仓库的 `.deb` 使用 `ar` + `xz` 手工打包（不依赖 `dpkg-deb`），脚本与产物说明见根目录 `README.md` 与 Release。

### 仓库边界（开始前务必了解）

- `deepseek-harness/` 是固定版本的上游子模块，**桌面开发不修改其中的任何文件**；上游内容更新走独立的 pin 提交。
- 桌面代码位于 `dsh-plugin-desktop/`；`dsh-community-fabric/` 保存社区标准 Draft，`dsh-community-market/` 保存市场壳设计。两个社区 package 当前都只有文档、尚不可加载，三个自有 package 共用外层 Yarn workspace。
- 上游第三方运行时通过 `patches/` 与 `.yarn/patches/` 打补丁；修改这些补丁时，同时更新根 `package.json` 的 `resolutions` 与 `yarn.lock`。
- 构建、类型检查、单元测试和冒烟检查必须保持 headless-safe。

### 提交与 PR

- 提交信息使用 conventional commits 风格（例如 `fix(linux): ...`、`docs: ...`）。
- 提交前运行 `yarn check` 并保证全绿；改动打包相关代码时，另运行一次 `package:dir` 确认 smoke 通过。
- 变更生产依赖后，运行 `yarn workspace dsh-plugin-desktop verify:notices` 刷新第三方许可清单，并提交更新后的 `dsh-plugin-desktop/THIRD_PARTY_NOTICES.md`。
- 文档改动请中英同步；README 改动后需更新 `README.i18n.yaml` 的双语 hash 记录（`node scripts/verify-bilingual-docs.mjs` 会校验）。
- PR 描述说明改动内容、动机和验证方式；CI 通过后再合并。

## 行为准则

请保持友善与尊重，就事论事。我们希望这是一个欢迎新人的社区。完整的[参与者公约](CODE_OF_CONDUCT.md)适用于所有项目空间。
