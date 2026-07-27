## Why

Semantic Browser 的 spec 数据源建立在「element → 多个 `.xirang/specs/<specId>/spec.md` 路径」这一映射上。目标语义已将 Element Contract 迁入 `elements/` 单元正文（`xirang-contract.md:72`），一个 Element 至多一份 Contract（`xirang-definition.md:99`），该映射层随之消失：`specId` 不再存在，spec 文件路径不再是可寻址实体，`spec-registry` 概念整体消亡。

Browser 侧因此有两处会静默产生错误结果，而非报错：

1. `architectureView.ts:141,145` 以 `element.fqn` 在 formal DiagramView 与 change variant 之间对齐节点。契约明确派生局部名只在单次生成内有效、不要求跨版本稳定（`xirang-contract.md:132`）。`.c4` 整体重生成后 fqn 可变，对齐失败表现为全部节点被当作新建、布局继承丢失，且无任何诊断。
2. `SpecsTab.tsx:190,193` 从 `specPath` 正则提取 `specId` 并以 `${specId}#` 前缀过滤 diff 条目，同时依赖 `entry.scope === 'specs'`。契约已定 Requirement identity 为宿主 Element identity 与 `<name>` 复合（`xirang-contract.md:93`），且差异输出不再携带存储分区信息（`:200`）。两个判据同时失效后过滤恒为空，结构化 diff 静默不显示。

`xirang-spec-handler.ts` 的路径逃逸防护完全建立在 `.xirang/specs/` 前缀白名单（`:4,140`）与 `specsRoot` realpath 包含检查（`:83-95`）之上。数据源改变时若简单移除 `path` 参数校验，将引入任意文件读取。

## What Changes

- **spec 数据源退化为 element identity 寻址**：`XirangSpecLoader.list()` 与 `path` 参数取消，`load(project, element, variant)` 直接返回该 Element 的 Contract markdown。`XirangSpecIndexController`、`normalizeSpecPaths`、`getSpecsTabModel.showSelector`、多路径选择器一并移除。
- **安全边界重建**：`readXirangSpec` 改为按 element identity 定位 `elements/` 单元，保留等价的 identity 字符集校验、单元根 realpath 包含检查与扩展名约束；watcher 目录改为 `.xirang/model/elements/`。
- **`architectureView.ts` 对齐键改为 identity**：`formalNodes` 索引与节点 id 改用 element identity；fqn 仅用于向 formal DiagramView 取既有布局，且必须容忍 miss。
- **diff 过滤对齐**：`getStructuredSpecDiff` 改按 element identity 前缀过滤，移除 `entry.scope` 判据。
- **`--xirang-spec-registry` flag 删除**：`options.ts:138`、`serve.ts:75,96,126`、`config-app.ts:38,108`、`plugin.ts:103,204,427-428` 透传链一并移除。
- **`view.ts` 的 Browser 侧退化**：`launchEmbeddedLikeC4` 的 likec4 源目录改为生成产物目录 `.xirang/.cache-likec4/`；`projectContracts` 的虚拟 spec 路径投影改为 element identity 键；`writeSpecRegistrySnapshot` 与 `--xirang-spec-registry` 参数删除。

## 目标语义依据

| 断言 | 依据 |
|---|---|
| Element Contract 位于 element 单元正文，一 Element 至多一份 | `xirang-contract.md:72`、`xirang-definition.md:99` |
| Requirement identity = 宿主 Element identity + `<name>`，全局寻址写 `<element identity>#<name>` | `xirang-contract.md:93` |
| 差异输出以 entity type 与 identity 为键，不携带存储分区信息 | `xirang-contract.md:200` |
| 派生局部名只在单次生成内有效，不跨版本稳定 | `xirang-contract.md:132` |
| 生成产物落于 `.xirang/.cache-likec4/`，不纳入版本控制 | `xirang-contract.md:130` |
| identity 字符集 `[A-Za-z0-9._-]+`，不含路径分隔符 | `xirang-contract.md:97` |

identity 字符集约束是安全边界重建的关键前提：identity 不含 `/` 与 `\`，因此可在拼接文件路径前以字符集校验拒绝全部路径穿越输入，无需依赖前缀白名单。

## Impact

**改动面**

| 层 | 文件 |
|---|---|
| 数据源协议 | `likec4/packages/diagram/src/xirang/SpecLoaderContext.tsx` |
| SPA 客户端 | `likec4/packages/likec4-spa/src/xirang/HttpSpecLoader.ts` |
| 服务端中间件 | `likec4/packages/vite-plugin/src/plugin.ts` |
| 服务端读取与安全 | `likec4/packages/vite-plugin/src/xirang/xirang-spec-handler.ts` |
| UI | `likec4/packages/diagram/src/overlays/element-details/SpecsTab.tsx`、`ElementDetailsCard.tsx` |
| 视图合成 | `likec4/packages/diagram/src/xirang/architectureView.ts` |
| CLI flag 链 | `likec4/packages/likec4/src/cli/options.ts`、`cli/serve/serve.ts`、`vite/config-app.ts` |
| 主仓库接缝 | `src/core/view.ts` |

**测试面**：`likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`（238 行，多路径与 diff 过滤用例需重写）、`likec4/packages/diagram/src/xirang/architectureView.spec.ts`（128 行，对齐键用例需重写）、`test/core/view.test.ts`（208 行，registry 快照相关用例删除）。

**不属于本 Change**

- CLI 命令面重写与旧栈删除（`view.ts` 的命令注册、四分区 watcher、`spec-registry.ts` 删除）——归属 CLI 切换 Change。
- `.c4` 生成器实现与 fork grammar 回退——归属生成器 Change。本 Change 只消费其产出目录 `.xirang/.cache-likec4/`。
- workflow 与 Internal Agent 模板——归属模板 Change。

**依赖**：本 Change 依赖生成器 Change 产出 `.xirang/.cache-likec4/`，以及模型内核 Change 的 `ModelElement` IR 与 `parseSemanticModel`。中间态不要求项目可构建，最终状态需与 `xirang-definition.md`、`xirang-contract.md` 一致。

**残留风险**：`.c4` 生成目录变更后 likec4 CLI 的 project 发现、watcher 与 HMR 行为未经验证，需在 Task 6 实测。
