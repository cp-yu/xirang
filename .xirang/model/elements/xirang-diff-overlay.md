---
entity: element-declaration
identity: xirang-diff-overlay
kind: browser-specification
parent: web
title: Xirang Diff Overlay
definition: Xirang Diff Overlay 是 Web 对非 baseline Model 语义差异的呈现与审阅层。它独立建模以隔离差异呈现和投影计算的边界，包含节点与关系操作标记、差异概览与导航、Metamodel 条目折叠，以及 Declaration 与 Section 文本差异；不负责差异基准选择、base model 或 projection 计算、Contract 内容投递。
---

## Specification

### Section: Scope and Non-goals

Xirang Diff Overlay SHALL 为非 baseline Model 提供可识别的画布差异标记、变化概览与定位和完整文本审阅；不计算 projection 的语义选择边界，不修改 Semantic Model 或 Change。

### Section: Business Logic

Xirang Diff Overlay SHALL 在非 baseline Model（活动 Change 或 Candidate）的 Presentation Mode 为 `complete-with-diff` 或 `diff-only` 时，以 outline 颜色、diff badge 与 dim 透明度标记可见节点与边的 ADDED、MODIFIED、REMOVED operation。`complete-with-diff` projection SHALL 使用该 Model 的 target-only sources 并叠加差异标记；`diff-only` projection SHALL 使用 baseline 与该 Model 的 union sources 并仅投影 changed elements 与必要上下文。baseline 与任何 Model 的 `complete` Mode SHALL NOT 激活该 overlay。单字符 diff badge glyph 为 `+`（U+002B PLUS SIGN）、`~`（U+007E TILDE）、`−`（U+2212 MINUS SIGN），分别表示 ADDED、MODIFIED、REMOVED。

差异审阅 SHALL 按实体类型区分计数，将 Section 变化归并到其宿主对象提供列表与定位，并在当前 View 边界和 mode 内打开详情。文本审阅 SHALL 突出变化字段与片段，使每个 Section 的 before/after 包含正文及全部 Acceptance Cases，且不为 Acceptance Case 创建独立 diff。

#### Metamodel 条目折叠

Web SHALL 在 Change 面板中按 `element-kind`、`relationship-kind`、`authored-view` 三个分组呈现 Metamodel 差异条目。当 Metamodel 差异条目总数超过 6 时，面板 SHALL 折叠为每个非空分组一个汇总行，汇总行分别显示该组 ADDED、MODIFIED、REMOVED 条目计数（`+N ~N −N`），空分组 SHALL NOT 显示；用户点击汇总行 SHALL 就地展开该分组的完整条目列表。当条目总数不超过 6 时，面板 SHALL 直接平铺全部条目且不显示汇总行。点击任一条目 SHALL 打开该条目的 before/after diff。

### Section: Edge Cases and Exception Handling

baseline 或任何 Model 的 `complete` mode SHALL 不激活画布差异 overlay。定位目标在当前 mode 隐藏或超出 View 边界时 SHALL 报告原因，不切换 mode 或扩大 View 范围。文本过长时 SHALL 保持末尾内容可滚动访问，空计数分组 SHALL 不显示。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 呈现语义差异视觉表达：Change complete-with-diff

- 用户选择活动 Change 且 Mode 为 `complete-with-diff`
- Browser 呈现 Change target projection
- 可见节点与边以 outline 与 badge 标记其 operation

#### Acceptance Case: 呈现语义差异视觉表达：Change diff-only

- 用户选择活动 Change 且 Mode 为 `diff-only`
- Browser 仅投影 changed elements、ancestors 与 relationship endpoints
- 差异标记与 complete-with-diff 一致

#### Acceptance Case: 呈现语义差异视觉表达：Candidate complete-with-diff

- 用户选择 `model=candidate&mode=complete-with-diff`
- Browser 呈现 Candidate target projection 并叠加差异标记
- 差异标记与 Change complete-with-diff 一致

#### Acceptance Case: 呈现语义差异视觉表达：Candidate diff-only

- 用户选择 `model=candidate&mode=diff-only`
- Browser 仅投影 Candidate changed elements 与必要上下文
- 差异标记与 Change diff-only 一致

#### Acceptance Case: 呈现语义差异视觉表达：Candidate complete 不叠加 overlay

- 用户选择 `model=candidate` 且 Mode 为 `complete`
- Browser 不叠加 outline、badge 或 dim 差异标记

#### Acceptance Case: 呈现语义差异视觉表达：新增节点及两个 Sections

- 可见节点的 Declaration 为 ADDED，并有两个 ADDED Section entries
- 节点具有绿色 dotted 描边、独立 `+` 徽章及 `+2` Section 徽章
- 定位高亮后操作颜色保持绿色

#### Acceptance Case: 呈现语义差异视觉表达：仅修改 Contract

- 节点只有一个 MODIFIED Section entry，无 Declaration entry
- 节点显示 `~1` Section 徽章，不显示 Declaration operation 徽章

#### Acceptance Case: 呈现语义差异视觉表达：上下文与 removed ghost

- diff-only 中同时存在未变化叶子节点和 REMOVED ghost
- 主体不透明度分别为 58% 与 45%，计数及操作徽章保持不透明

#### Acceptance Case: 折叠呈现 Metamodel 差异条目：Metamodel 条目较多时折叠

- 一个 Change 或 Candidate diff 的 Metamodel 差异条目总数超过 6
- 面板按 `element-kind`、`relationship-kind`、`authored-view` 三个分组折叠为汇总行
- 每个非空汇总行显示该组 ADDED、MODIFIED、REMOVED 条目计数（`+N ~N −N`）
- 空分组不显示

#### Acceptance Case: 折叠呈现 Metamodel 差异条目：展开分组查看条目

- 用户点击一个 Metamodel 汇总行
- 面板就地展开该分组并平铺其全部条目
- 点击任一条目打开该条目的 before/after diff

#### Acceptance Case: 折叠呈现 Metamodel 差异条目：Metamodel 条目较少时平铺

- Metamodel 差异条目总数不超过 6
- 面板直接平铺全部条目
- 不显示分组汇总行

#### Acceptance Case: 查看新增 Section 的合并 diff

- 用户在非 baseline Model 中查看一个 ADDED Section
- Browser 呈现单个 diff，其 after 包含该 Section 正文与全部 Acceptance Case 文本

#### Acceptance Case: 查看修改 Section 的合并 diff

- 用户在非 baseline Model 中查看一个 MODIFIED Section
- Browser 呈现单个 diff，其 before 与 after 均包含该 Section 正文与全部 Acceptance Case 文本

### Section: 节点差异标记

节点 ADDED、MODIFIED、REMOVED 描边颜色 SHALL 分别为绿色 `#2f9e44`、橙色 `#ff9f0a`、红色 `#e03131`，描边形态 SHALL 分别为 dotted、solid、dashed，基础宽度分别为 3px、5px、3px。选中、键盘焦点或定位高亮 SHALL NOT 覆盖操作描边颜色。Element Declaration operation SHALL 具有独立单字符操作徽章；Section entries SHALL 在宿主节点按操作汇总为非零 `+N`、`~N`、`−N` 计数徽章，并通过 tooltip 与可访问文本说明操作或 Section 数量。只有 Section 变化时 SHALL 不制造 Declaration operation 徽章。

在差异模式中，存在 Element Declaration 或 Relationship entry 时 SHALL 启用主体淡化：无 Declaration operation 的叶子节点不透明度 SHALL 为 58%，ADDED 与 MODIFIED 为 100%，REMOVED ghost 为 45%；只有 Section、Kind 或 Authored View entries 时 SHALL 不额外启用主体淡化。容器填充 SHALL 不使用该主体淡化规则。徽章 SHALL 独立于主体保持不透明。描边及徽章 SHALL 使用 `min(4, max(1, 0.667 / zoom))` 的反向缩放系数，其中 zoom 为量化后的缩放值，在总览中增强可见性。
