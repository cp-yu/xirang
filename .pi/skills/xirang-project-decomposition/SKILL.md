---
name: xirang-project-decomposition
description: 使用本项目 Perspective 维度与 MECE 精化树纪律形成 Xirang Semantic Model hierarchy。
---

# Xirang Project Decomposition

本方法在共享 semantic-authoring 所定义的父子精化、同层 MECE 与广度优先框架内，依据项目的 Perspective 维度组织息壤 Semantic Model；用户确认与 Agent 的局部组织权限始终遵循当前 workflow 的决策与授权规则。

## 顶层边界

Project Root 的直接 children SHALL 区分两个项目定义维度：

- `semantic-objects`：项目持久表达和演进的语义对象，包括 Semantic Model 与 Change。
- `realization`：Agent 与用户如何构建、落实、验证和收束这些语义对象。

不得把 CLI、代码模块、文件目录或单次 workflow 步骤提升为第三个顶层维度。

## Realization Perspectives

`realization` SHALL 通过两个互补 Perspective 继续分解：

- `realization-process`：只按推进过程拆分，表达 Semantic Model Build、Change Formation、Change Implementation 与 Change Closure 等阶段及其细化活动。
- `collaboration-structure`：只按协作结构拆分，表达 Participants、Agents、Internal Agents 与 Interaction Surfaces 等职责和交互边界。

Perspective 是观察同一 Realization 的分解角度，不是重复 ownership。跨 Perspective 的调用、产出、约束、验证或职责协作 SHALL 使用类型化 Relationships 表达，不得通过复制 Element 或混合 sibling 维度表达。

Perspective 是 kind 为 `perspective` 的树内 Element，承载规范性语义（Declaration 与 Contract）；它不是 View/呈现投影层，也不以颜色、形状或布局定义语义。
