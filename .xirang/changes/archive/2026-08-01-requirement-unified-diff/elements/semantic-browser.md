---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: Semantic Browser
definition: 以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。
---

## ADDED Requirements

### Requirement: 合并呈现 Requirement 差异

Semantic Browser SHALL 在 Change-derived View 的 Element Details 中将每个存在差异的 Requirement 连同其全部 Scenario 呈现为单个 diff：该 diff 的 before 与 after 包含 Requirement 正文及全部 Scenario 文本，且不单独为 Scenario 呈现独立 diff。

#### Scenario: 查看新增 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 ADDED Requirement
- **THEN** Browser 呈现单个 diff，其 after 包含该 Requirement 正文与全部 Scenario 文本

#### Scenario: 查看修改 Requirement 的合并 diff

- **WHEN** 用户在 Change-derived View 中查看一个 MODIFIED Requirement
- **THEN** Browser 呈现单个 diff，其 before 与 after 均包含该 Requirement 正文与全部 Scenario 文本
