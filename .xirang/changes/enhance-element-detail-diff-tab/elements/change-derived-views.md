---
operation: MODIFIED
entity: element-declaration
identity: change-derived-views
kind: capability
parent: derived-views
title: Change-derived Views
definition: 由当前 Semantic Model 与一个活动 Change 的 Semantic Delta 确定性推导、用于呈现目标模型及语义差异的 View。它按 Change 独立建模以支持对一次演进意图的理解与审查；包含目标模型的层级浏览和 diff，不包含当前 Semantic Model 的默认浏览或 Authored View 视角。
---

## ADDED Requirements

### Requirement: 支持 Element 级别的变更差异审查

Change-derived View SHALL 支持在 Element Details 面板中查看单个 Element 的 declaration 和 contract 的 before/after diff。

#### Scenario: 查看 Element 变更差异

- **WHEN** 用户查看一个活动 Change 中某个 Element 的详情
- **THEN** Element Details 面板展示该 Element 的 declaration 和 contract 的 before/after diff