## Why

Realization 当前混列推进过程与协作结构，Views 也未区分视角组成与呈现方法；同时独立 `xirang diff` 与持久化差异报告重复了 Validate 和 Semantic Browser 已提供的派生呈现，并使 Archive 在 Sync 后重算出失真的零差异结果。

## What Changes

- 在 Realization 下分别建立推进过程与协作结构两个分组，并将现有 Elements 归入对应维度。
- 在 Views 下建立 View Composition 与 View Presentation 两个正交维度，并定义 Visual Presentation 与 Text Presentation。
- 以 `supports-presentation` relationships 表达 CLI 与 Semantic Browser 支持的呈现方法。
- **BREAKING** 删除独立 `xirang diff` CLI 及其 `--write` 持久化报告能力，不提供兼容别名。
- 保留 `xirang validate --change` 的只读文本与 JSON 差异预览，并保留 `xirang view` 的交互式 Change-derived View。
- Archive 原样移动已有 Change 制品，不创建、重算或要求 View 呈现产物；历史 Archive 内容保持不变。

## Source Impact

### Behavior Source

#### New Specs

- `view-composition`: 定义 Authored 与 Derived 两种互斥且与呈现方法独立的 View 组成方式。
- `view-presentation`: 定义 View 可采用一种或多种呈现方法且不同方法表达同一视角。
- `visual-presentation`: 定义图形、空间、视觉编码与交互只承担呈现职责。
- `text-presentation`: 定义人类可读文本呈现及其与程序化结构数据的边界。

#### Modified Specs

- `views`: 增加 View Composition 与 View Presentation 两个独立维度。
- `derived-views`: 明确 Derived Views 不形成 Semantic Model 或 Change 的 durable artifact，仅允许可重建运行表示。
- `deterministic-operations`: 将 Change 的 CLI 差异呈现收敛到 `xirang validate --change`，移除独立 Diff command 与持久化报告。
- `change-closure`: 明确 Archive 原样移动 Change，且不生成或修改 View 呈现结果。

### Architecture Source

#### Added Elements

- `realization-process`: 按推进维度组织 Semantic Model Build 与 Change Realization。
- `collaboration-structure`: 按协作维度组织 Participants 与 Interaction Surfaces。
- `view-composition`: 按视角形成方式组织 Authored Views 与 Derived Views。
- `view-presentation`: 按信息传达方式组织 Visual Presentation 与 Text Presentation。
- `visual-presentation`: 表达 View 的可视化呈现方法。
- `text-presentation`: 表达 View 的文本呈现方法。

#### Modified Elements

- `semantic-model-build`: 移入 `realization-process`。
- `change-realization`: 移入 `realization-process`。
- `participants`: 移入 `collaboration-structure`。
- `interaction-surfaces`: 移入 `collaboration-structure`。
- `authored-views`: 移入 `view-composition`。
- `derived-views`: 移入 `view-composition`。

#### Removed Elements

None

#### Architecture Relations

- 新增 `supports-presentation` Relationship Kind。
- 新增 `cli -> text-presentation` 与 `semantic-browser -> visual-presentation` relationships。

## Impact

- 影响 CLI command registry、Change validation 输出、Archive 流程与差异 renderer。
- 影响 Propose、Snack workflow templates、生成后的 Agent Skills 及其测试。
- 影响 Semantic Model hierarchy、LikeC4 派生导航与 View presentation relationships。
- 不修改历史 Archive 中已有的 `effective-change.md`。
