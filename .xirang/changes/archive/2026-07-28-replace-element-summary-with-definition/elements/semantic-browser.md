---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
---

## ADDED Requirements

### Requirement: 分层呈现 Element Definition
Semantic Browser SHALL 在 Formal Model 与 Change variant 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情
- **WHEN** Browser 呈现一个具有多段 Definition 的 Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 确定性派生 Definition Excerpt
Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 120 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

#### Scenario: Definition 超过显示上限
- **WHEN** 第一段规范化后超过 120 Unicode code points
- **THEN** Browser summary 包含前 120 个 code points 和 `...`，description 保持完整原文

#### Scenario: Definition 不超过显示上限
- **WHEN** 第一段规范化后不超过 120 Unicode code points
- **THEN** Browser summary 原样使用该规范化段落且不追加省略号
