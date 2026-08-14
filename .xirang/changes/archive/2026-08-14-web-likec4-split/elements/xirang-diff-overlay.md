---
operation: ADDED
entity: element-declaration
identity: xirang-diff-overlay
kind: element
parent: web
title: Xirang Diff Overlay
definition: Xirang Diff Overlay 是 Web 对 LikeC4 的差异呈现改造：在投影节点与关系上以 outline、计数徽标与差异标记分层叠加 Element 级与 Requirement 级语义差异，并在 Element Details 中呈现 Requirement 级 before/after diff。它独立建模以隔离差异视觉表达与投影计算、Contract 投递的边界；不改变 base model 与 runtime projection，不承担浏览编排语义。
---
## ADDED Requirements

### Requirement: 合并呈现 Requirement 差异

Web SHALL 在 Change-derived View 与 Candidate Diff View 的 Element Details 中，将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 或 Candidate Diff View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本

### Requirement: 呈现语义差异视觉表达

diff overlay 激活时，元素节点以 outline 与计数徽标分层表达语义差异：element-declaration 级操作由橙黄 outline 表达——ADDED 节点以 100% 透明度、橙黄点线 outline 呈现，MODIFIED 节点以 100% 透明度、加粗橙黄实线 outline 呈现，REMOVED 节点以 45% ghost 透明度、橙黄虚线 outline 呈现；requirement 级变更由计数徽标表达——节点以绿色 `+N`、琥珀 `~N`、红色 `−N` 徽标分别呈现其新增、修改、移除的 requirement 数量，仅渲染非零项，同一节点 SHALL 可同时渲染多个徽标，徽标 SHALL 保持 100% 透明度；节点不再使用单字符 `+`/`~`/`−` 徽标。changed 关系边保留其 `+`/`~`/`−` 徽标。unchanged 节点与边 SHALL 仅在存在 element-declaration 或 relationship 级 diff 时以 25% 透明度且无 outline、无徽标呈现；Change 仅包含 contract 级变更时节点与边 SHALL 保持默认透明度。Change 面板的 `+N ~N −N` 计数 SHALL 仅统计 element-declaration 与 relationship 级 diff，requirement 级变更 SHALL NOT 计入。

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
- **AND** changed 关系边保留其 `+`/`~`/`−` 徽标且以全透明度呈现

#### Scenario: Requirement 计数徽章

- **GIVEN** diff overlay 激活且一个 Element 的 Contract 包含 requirement 级变更
- **WHEN** 用户查看该 Element 所在 Change-derived View
- **THEN** 该 Element 节点 SHALL 显示绿色 `+N`、琥珀 `~N`、红色 `−N` 计数徽标，仅渲染非零项
- **AND** 同一 Element 存在多类 requirement 变更时，多个计数徽标 SHALL 并排呈现
- **AND** 无 element-declaration 级变更的 Element SHALL NOT 施加 outline，且不因此 dim 其他未变更节点与边

#### Scenario: 无 diff 时默认呈现

- **WHEN** 用户使用 `complete` 模式，或在无 diff 的 Candidate View 中浏览
- **THEN** 节点与关系边保持默认透明度且不施加四态视觉

### Requirement: 固定呈现 Candidate diff-only 差异

Candidate Diff View SHALL 固定呈现 Candidate target 相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 差异，且 SHALL NOT 提供 Full context 切换。

#### Scenario: 审查 Candidate diff

- **WHEN** 当前 Semantic Model 与 active Candidate 可用于比较且用户选择 Candidate Diff View
- **THEN** Browser 显示 Candidate target 以及相对当前 Semantic Model 的 ADDED、MODIFIED、REMOVED 差异，且不提供 Full context 切换
