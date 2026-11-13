---
entity: element-declaration
identity: text-diff-presentation
kind: browser-specification
parent: xirang-diff-overlay
title: 文本差异呈现
definition: 文本差异呈现是 Xirang Diff Overlay 中将对象 before/after 内容组织为可读文本差异的审阅能力。它独立建模以维护字段、词语及 Section 的阅读边界，包含 Declaration 字段折叠、短值表达、Inline/Split 和 Section 连同全部 Acceptance Cases 的合并呈现；不负责差异条目计算、对象导航或 Contract 内容投递。
---

## Specification

### Section: Scope and Non-goals

文本差异呈现 SHALL 负责非 baseline Model 的字段与 Section before/after 阅读，保持 Section 正文及全部 Acceptance Cases 的完整性；不产生独立 Acceptance Case diff 或改变目标语义。

### Section: Business Logic

Web SHALL 在 Element Details 的 Diff tab 中完整显示变化的 Declaration 字段，并将未变化字段折叠为可展开的汇总；kind、parent、title 等短值 SHALL 使用紧凑的 before→after 表达。长文本与 Section 差异 SHALL 按段落及行组织，MODIFIED 默认使用 Inline 呈现并提供 Split 切换，在修改行内按中英文词语突出实际插入与删除片段；插入和删除 SHALL 具有可辨识样式，删除内容使用删除线。

每个 Section 的 diff SHALL 保持其正文与全部 Acceptance Cases 为一个整体；Acceptance Case 标题 SHALL 显示为子标题，代码式文本使用等宽字体。

### Section: Edge Cases and Exception Handling

ADDED 或 REMOVED 文本 SHALL 仅显示实际存在的一侧，不保留空白对照列。长内容 SHALL 可滚动到最后一个 Section 与 Acceptance Case，且桌面与移动视口均保持详情卡片 containment。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 查看局部文本修改

- 一个 Declaration 的 definition 中只有部分中文或英文词语变化，kind 与 parent 未变化
- Diff tab 突出 definition 内实际变化片段，将 kind 与 parent 放入可展开汇总
- MODIFIED 长文本默认 Inline，用户可切换 Split

#### Acceptance Case: 新增包含验收案例的 Section

- 一个 ADDED Section 有三个 Acceptance Cases
- diff 只呈现 after 一栏，包含正文与全部三个案例
- 案例标题作为子标题，长内容可滚动至末尾

#### Acceptance Case: 查看新增 Section 的合并 diff

- 用户在非 baseline Model 中查看一个 ADDED Section
- Browser 呈现单个 diff，其 after 包含该 Section 正文与全部 Acceptance Case 文本

#### Acceptance Case: 查看修改 Section 的合并 diff

- 用户在非 baseline Model 中查看一个 MODIFIED Section
- Browser 呈现单个 diff，其 before 与 after 均包含该 Section 正文与全部 Acceptance Case 文本
