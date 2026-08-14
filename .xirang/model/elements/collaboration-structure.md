---
entity: element-declaration
identity: collaboration-structure
kind: perspective
parent: realization
title: 协作结构
definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
---

## Requirements

### Requirement: 协作结构维度组织

collaboration-structure SHALL 从协作角度组织 Realization 的主体与界面：Participants 承担授权、判断与编排，Interaction Surfaces 提供配置、呈现与确定性操作。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

#### Scenario: 协作结构容纳主体与界面

- **WHEN** 浏览 collaboration-structure 的 descendants
- **THEN** 呈现 Participants（用户、Agents 与 Internal Agents）与 Interaction Surfaces（CLI、Web）

#### Scenario: 工作身份描述所承担活动

- **WHEN** Agent 工作身份描述其所承担 Activity 的相关语义
- **THEN** 该跨维度语义覆盖是允许的
- **AND** 推进过程与协作结构两个维度都不作为另一个维度的差量表达
