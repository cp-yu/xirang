---
entity: element-declaration
identity: collaboration-dimension
kind: perspective
parent: realization
title: 协作结构
definition: 协作结构是 Realization 中从协作角度组织落实主体的 Perspective：它容纳 Participants 与 Interaction Surfaces，表达哪些主体参与落实以及它们通过哪些界面与项目交互。
---

## Requirements

### Requirement: 协作结构维度组织

collaboration-dimension SHALL 从协作角度组织 Realization 的主体与界面：Participants 承担授权、判断与编排，Interaction Surfaces 提供配置、呈现与确定性操作。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

#### Scenario: 协作结构容纳主体与界面

- **WHEN** 浏览 collaboration-dimension 的 descendants
- **THEN** 呈现 Participants（用户、Agents 与 Internal Agents）与 Interaction Surfaces（CLI、Semantic Browser）

#### Scenario: 工作身份描述所承担活动

- **WHEN** Agent 工作身份描述其所承担 Activity 的相关语义
- **THEN** 该跨维度语义覆盖是允许的
- **AND** 推进过程与协作结构两个维度都不作为另一个维度的差量表达
