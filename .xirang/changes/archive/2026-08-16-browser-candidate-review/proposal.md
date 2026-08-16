## Why

Edera 的 build Candidate 修改了 685 处语义（其中 Metamodel 48 条），Browser 的 Candidate 审查体验失效：Change 面板整宽横跨画布、Metamodel 条目逐条平铺无法定位；Candidate View 无条件全展开 84 个节点且禁用下钻/展开交互；同可见端点对的多条 Relationships 被拆成几何完全重叠的独立边，diff 徽标互相叠压。需要让 Candidate 审查回到"汇总 → 点开看细节"的可浏览形态。

## What Changes

- Change 面板改为收缩宽度，Metamodel 差异条目按 `element-kind` / `relationship-kind` / `authored-view` 三组折叠呈现（条目总数超过 6 时折叠为带 `+N ~N −N` 计数的汇总行，点开平铺条目；不超过 6 时保持平铺）。
- Candidate View 改为与 Model View 一致的折叠基线：以 Candidate Project Root 为默认 focus，逐层下钻、就地展开，完整层级经逐层浏览可达；Candidate Diff View 画布只投影 changed Elements、必要 ancestors、changed Relationship endpoints 与 removed ghosts。
- 映射到相同可见 source/target 的多个 Relationships 合并为单条 visual edge（LikeC4 多关系聚合 label），不再渲染重叠独立边；合并边的 diff 徽标聚合为 `+N` / `~N` / `−N` 计数徽标，单条 changed Relationship 的边保留单字符徽标。

## Source Impact

### Behavior Source

#### New Specs

- `xirang-diff-overlay`: 新增 Metamodel 差异条目的分组折叠呈现要求（阈值、三个分组、计数汇总、展开与条目 diff 详情）。

#### Modified Specs

- `xirang-projection-service`: 聚合当前层 Relationships——同可见端点对的 Relationships 合并为单条 visual edge，不再为每个 Relationship 渲染独立重叠边。
- `xirang-diff-overlay`: 呈现语义差异视觉表达——合并边上多条 changed Relationships 的 diff 徽标聚合为计数徽标，单条 changed Relationship 仍保留单字符徽标。
- `candidate-derived-view`: 提供完整 Candidate 目标模型——Candidate View 以折叠基线与 Model View 一致的 focus、下钻、breadcrumb、就地展开交互呈现目标层级。
- `candidate-diff-derived-view`: 呈现 Candidate 语义差异——diff-only 画布只投影差异相关 Elements 与必要上下文。

### Architecture Source

None

## Impact

- `likec4/packages/diagram/`：Change 面板与 Metamodel 分组、关系边合并与徽标聚合、Candidate 来源交互与 breadcrumb。
- `likec4/packages/vite-plugin/`：Candidate 与 Candidate Diff 的 runtime projection 基线计算。
- `src/core/view.ts`：为 Candidate Diff 生成 before-after union sources（`diffArchitecture`、`diffLikec4Sources`、`diffLikec4ElementPaths`、`diffSourceFingerprint`），支撑 removed ghosts 的差异投影。
- `test/e2e/semantic-browser-candidate-views.spec.ts`：Candidate 两条用例按新基线语义更新。
- `test/fixtures/contract-browser/.xirang/candidate/`：为 e2e 补多关系对与 Metamodel 分组数据（metamodel 新增 layer/module/references/service/system 五种 Kind，relationships 新增 references.yaml 并修改 invokes.yaml）。
- 受影响运行面：`xirang view` 的 Semantic Browser（Model、Candidate、Candidate Diff、Change-derived Views）。
