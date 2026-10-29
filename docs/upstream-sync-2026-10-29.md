# 上游合并记录 / Upstream merge record

## 范围 / Scope

从已发布源码 `60f2bede46` 合并上游 `origin/master` 快照 `e7d0170dde2cee5942bc85e00b018d55c1c404ad`，共 14 个新提交。当前 Linux 源码为 `2.0.21-next-linux.1`，未发布；现有 Stable/latest `v2.0.20-next-linux.2` 的签名标签、安装包与证明均保持不变。

Merged 14 upstream commits through `e7d0170dde` into the source after `60f2bede46`. Source is now `2.0.21-next-linux.1`, unreleased. Published Stable `v2.0.20-next-linux.2` and its immutable assets are unchanged.

## 运行时家族 / Runtime families

| 工作区 / Workspace | 上游元数据 channel | DSH | pi-ai | 用途 / Role |
| --- | --- | --- | --- | --- |
| `dsh-desktop-next` | `next` | `0.2.1-rc.4` | `1.1.0` | Linux Stable 源码 / Linux Stable source |
| `dsh-plugin-desktop-beta` | `beta` | `0.2.2-alpha.2` | `1.4.0` | 开发与回归 / Development and regression |
| `dsh-plugin-desktop` | `stable` | `0.2.1-rc.3` | `1.1.0` | 旧架构保留，不再发版 / Retained legacy, no new Linux releases |

`deepseek-harness` 子模块按上游更新到 Beta pin `f3803c96974ad4a94195fb97e5c637e9c2a3afe3`；Next 的源码 pin 为 `504a01a9578abc2c6f1fb896b1dc322c9fe24f66`。桌面消费各频道的 vendored 分发包，不把 Beta checkout 当作所有频道的同版源码，也不修改该子模块内容。

The submodule follows upstream's active Beta pin; Next keeps its separately recorded source and vendored distribution. The submodule itself remains unmodified.

## 新增上游行为 / Incoming behavior

- 独立 Next runtime channel、运行时与 API 差异边界 / Separate Next channel and bounded API differences.
- 按上游 release 命名的官方插件索引、官方插件管理器驱动的社区插件更新 / Release-aligned official indexes and manager-owned community updates.
- 裸 `dsh-session:` 文本不再导致回合失败 / Bare session-link text handling.
- 渲染进程 OOM 的内存证据与可读 Host 退出诊断 / Renderer-OOM memory evidence and readable Host exits.
- macOS 应用内重启保留 Local Network 访问的上游修复 / Upstream macOS Local Network restart fix; native macOS acceptance remains platform-specific.

## 保留的 fork 行为 / Retained fork behavior

- Linux Stable 默认命令、旧架构发版退休与 Next 数据标识 / Stable routing, legacy retirement and data anchors.
- Linux 菜单隐藏与真实快捷键 / Linux menu hiding and real accelerators.
- 上游 Sharp WASM；旧 subprocess bridge 和全局覆盖不恢复 / Upstream Sharp WASM without the retired bridge.
- 单一 Office 挂载，运行时覆盖与空值禁用 / Single Office composition with override and opt-out.
- OAuth 设置挂载补丁迁移到 `0.2.1-rc.4` 和 `0.2.2-alpha.2` / OAuth settings mounts on both incoming runtimes.
- Terra 目录补全与 streaming JSON 修复分别覆盖 pi-ai `1.1.0` 和 `1.4.0`，各有来源与 hash / Version-scoped model and streaming patches with provenance.

## 合并时修复的打包问题 / Packaging integration fix

Community Market 的开发依赖随 Beta 升级，而其 peer 合同允许多个运行时。原打包器从 workspace 的开发目录解析 peer，误将不完整的 Beta SDK 图收进 Next 成品，出现 `dsh-scope required by dsh-agent is not installed`。现在 workspace 的 peer 优先使用消费应用提供且满足 semver 合同的版本；硬依赖和不兼容 peer 仍按原安装树解析，缺依赖仍失败。新增兼容／不兼容 peer 两个回归，保留并细化错误定位。

Workspace peer resolution now follows the compatible consuming application instead of a different development SDK. The original failing payload command passes. The Linux Stable closure contains 303 DSH packages at `0.2.1-rc.4` and one Cordis `4.0.5`, with no Beta DSH graph.

## 验证 / Validation

- Root headless gate: Market 320 tests; Next 803; Beta 803. Legacy regression: 1,886. **3,812 workspace tests passed, 22 skipped.**
- Three vendored runtime families checked; 284 shared variant files aligned while preserving declared family differences.
- 54 bilingual records / 108 documents verified; working-tree and staged diff whitespace checks passed.
- Linux directory package built successfully. Real packaged Host default/override/Office-disabled modes passed, as did native driver/badge and Sharp WASM attachment checks.
- Next and Beta both verify `gpt-6.1-terra`, OAuth settings mounts, catalog manifest hashes and the streaming-patch hunks. Required final-event parsing is retained.
- Beta's real Electron Node-mode Host smoke passed on `0.2.2-alpha.2`, including exclusive market selection, official-manager installation/removal, offline dshmarket operations, origin gating, recovery and Profile switching.
- The new Stable archive itself reports `2.0.21-next-linux.1` / DSH `0.2.1-rc.4`, 1,715 model entries, Terra on both OpenAI routes and the OAuth settings mount.

## 文档与边界 / Documentation and boundaries

中英文根 README、Next/Beta 说明、FAQ、用户指南入口、文档索引和贡献指南同步区分当前源码、已发布版本与历史三模式说明。删除当前使用说明中的系统 Node/旧 Sharp 桥接要求、过期安装包名与被禁止的 `pinned` 构建命令；双语 README hash 同步更新。

No new Release, installer replacement, GUI restart, real-account OAuth flow or paid model request is part of this merge. A catalog entry does not guarantee account entitlement. Linux packaged checks do not replace native Windows/macOS acceptance.
