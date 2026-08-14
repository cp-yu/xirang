---
entity: element-declaration
identity: xirang-diff-overlay
kind: element
parent: web
title: Xirang Diff Overlay
definition: Xirang Diff Overlay 是 Web 对 LikeC4 的差异呈现改造：在投影节点与关系上以 outline、计数徽标与差异标记分层叠加 Element 级与 Requirement 级语义差异，并在 Element Details 中呈现 Requirement 级 before/after diff。它独立建模以隔离差异视觉表达与投影计算、Contract 投递的边界；不改变 base model 与 runtime projection，不承担浏览编排语义。
---

## MODIFIED Requirements

### Requirement: 呈现语义差异视觉表达

diff overlay 激活时，元素节点以 outline 与计数徽标分层表达语义差异：element-declaration 级操作由橙黄 outline 表达——ADDED 节点以 100% 透明度、橙黄点线 outline 呈现，MODIFIED 节点以 100% 透明度、加粗橙黄实线 outline 呈现，REMOVED 节点以 45% ghost 透明度、橙黄虚线 outline 呈现；requirement 级变更由计数徽标表达——节点以绿色 `+N`、琥珀 `~N`、红色 `−N` 徽标分别呈现其新增、修改、移除的 requirement 数量，仅渲染非零项，同一节点 SHALL 可同时渲染多个徽标，徽标 SHALL 保持 100% 透明度；节点不再使用单字符 `+`/`~`/`−` 徽标。relationship 级变更由关系边徽标表达——仅携带一条 changed Relationship 的 edge 保留单字符 `+`/`~`/`−` 徽标，合并多条 changed Relationships 的 edge 以绿色 `+N`、琥珀 `~N`、红色 `−N` 计数徽标并排呈现其新增、修改、移除的 relationship 数量，仅渲染非零项。unchanged 节点与边 SHALL 仅在存在 element-declaration 或 relationship 级 diff 时以 25% 透明度且无 outline、无徽标呈现；Change 仅包含 contract 级变更时节点与边 SHALL 保持默认透明度。Change 面板的 `+N ~N −N` 计数 SHALL 仅统计 element-declaration 与 relationship 级 diff，requirement 级变更 SHALL NOT 计入。

#### Scenario: 四态节点视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 ADDED、MODIFIED、REMOVED 与 unchanged 元素
- **THEN** unchanged 元素以 25% 透明度且无 outline、无徽标呈现
- **AND** ADDED 元素以 100% 透明度、橙黄点线 outline 呈现
- **AND** MODIFIED 元素以 100% 透明度、加粗橙黄实线 outline 呈现，其 outline 宽于 ADDED
- **AND** REMOVED 元素以 45% ghost 透明度、橙黄虚线 outline 呈现
- **AND** 存在 requirement 级变更的元素额外显示对应计数徽标

#### Scenario: 关系边视觉区分

- **WHEN** diff overlay 激活且 View 同时包含 changed 与 unchanged 关系
- **THEN** unchanged 关系边以 25% 透明度呈现
- **AND** 仅携带一条 changed Relationship 的边保留其 `+`/`~`/`−` 单字符徽标且以全透明度呈现
- **AND** 合并多条 changed Relationships 的边以对应 `+N`/`~N`/`−N` 计数徽标并排呈现且以全透明度呈现

#### Scenario: Requirement 计数徽章

- **GIVEN** diff overlay 激活且一个 Element 的 Contract 包含 requirement 级变更
- **WHEN** 用户查看该 Element 所在 Change-derived View
- **THEN** 该 Element 节点 SHALL 显示绿色 `+N`、琥珀 `~N`、红色 `−N` 计数徽标，仅渲染非零项
- **AND** 同一 Element 存在多类 requirement 变更时，多个计数徽标 SHALL 并排呈现
- **AND** 无 element-declaration 级变更的 Element SHALL NOT 施加 outline，且不因此 dim 其他未变更节点与边

#### Scenario: 无 diff 时默认呈现

- **WHEN** 用户使用 `complete` 模式，或在无 diff 的 Candidate View 中浏览
- **THEN** 节点与关系边保持默认透明度且不施加四态视觉

## ADDED Requirements

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
