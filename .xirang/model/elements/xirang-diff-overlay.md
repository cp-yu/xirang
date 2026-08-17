---
entity: element-declaration
identity: xirang-diff-overlay
kind: element
parent: web
title: Xirang Diff Overlay
definition: Xirang Diff Overlay 是 Web 在 LikeC4 DiagramView 上的语义差异视觉表达层，将 Change 或 Candidate 的 Semantic Delta 以 outline 颜色、diff badge 与 dim 透明度叠加在可见节点与边上，使差异信息不通过投影计算就能可视化。它独立建模以隔离差异呈现与投影计算的边界；包含 complete-with-diff 与 diff-only 两种 Mode 的差异视觉呈现与 Metamodel diff 折叠，不包含投影基准选择、base model 生成与 Contract 投递。
---

## Requirements

### Requirement: 合并呈现 Requirement 差异

Web SHALL 在 Change-derived View 的 Element Details 中，将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本

### Requirement: 呈现语义差异视觉表达

Xirang Diff Overlay SHALL 在 Presentation Mode 为 `complete-with-diff` 或 `diff-only` 时，以 outline 颜色、diff badge 与 dim 透明度标记可见节点与边的 ADDED、MODIFIED、REMOVED operation；`complete-with-diff` projection 使用 change-only 或 candidate-only target sources 并叠加差异标记，`diff-only` projection 使用 formal+change 或 formal+candidate union sources 并仅投影 changed elements 与必要上下文；该视觉表达逻辑 SHALL 统一适用于活动 Change 与 Candidate，不因 Change Selection 为 `candidate` reserved identifier 而差异化。单字符 diff badge glyph 为 `+`（U+002B PLUS SIGN）、`~`（U+007E TILDE）、`−`（U+2212 MINUS SIGN），分别表示 ADDED、MODIFIED、REMOVED。

#### Scenario: Change complete-with-diff

- **WHEN** 用户选择活动 Change 且 Mode 为 `complete-with-diff`
- **THEN** Browser 呈现 Change target projection
- **AND** 可见节点与边以 outline 与 badge 标记其 operation

#### Scenario: Candidate complete-with-diff

- **WHEN** 用户选择 `change=candidate&mode=complete-with-diff`
- **THEN** Browser 呈现 Candidate target projection
- **AND** 可见节点与边的差异标记逻辑与 Change 完全一致

#### Scenario: Change diff-only

- **WHEN** 用户选择活动 Change 且 Mode 为 `diff-only`
- **THEN** Browser 仅投影 changed elements、ancestors 与 relationship endpoints
- **AND** 差异标记与 complete-with-diff 一致

#### Scenario: Candidate diff-only

- **WHEN** 用户选择 `change=candidate&mode=diff-only`
- **THEN** Browser 仅投影 Candidate changed elements 与必要上下文
- **AND** 差异标记与 Change diff-only 一致

### Requirement: 折叠呈现 Metamodel 差异条目

Web SHALL 在 Change 面板中按 `element-kind`、`relationship-kind`、`authored-view` 三个分组呈现 Metamodel 差异条目。当 Metamodel 差异条目总数超过 6 时，面板 SHALL 折叠为每个非空分组一个汇总行，汇总行分别显示该组 ADDED、MODIFIED、REMOVED 条目计数（`+N ~N −N`），空分组 SHALL NOT 显示；用户点击汇总行 SHALL 就地展开该分组的完整条目列表。当条目总数不超过 6 时，面板 SHALL 直接平铺全部条目且不显示汇总行。点击任一条目 SHALL 打开该条目的 before/after diff。

#### Scenario: Metamodel 条目较多时折叠

- **WHEN** 一个 Change 或 Candidate diff 的 Metamodel 差异条目总数超过 6
- **THEN** 面板按 `element-kind`、`relationship-kind`、`authored-view` 三个分组折叠为汇总行
- **AND** 每个非空汇总行显示该组 ADDED、MODIFIED、REMOVED 条目计数（`+N ~N −N`）
- **AND** 空分组不显示

#### Scenario: 展开分组查看条目

- **WHEN** 用户点击一个 Metamodel 汇总行
- **THEN** 面板就地展开该分组并平铺其全部条目
- **AND** 点击任一条目打开该条目的 before/after diff

#### Scenario: Metamodel 条目较少时平铺

- **WHEN** Metamodel 差异条目总数不超过 6
- **THEN** 面板直接平铺全部条目
- **AND** 不显示分组汇总行
