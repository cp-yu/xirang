---
entity: element-declaration
identity: realization
kind: perspective
parent: project.root
title: Realization
definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从推进过程与协作结构两个互补角度组织 Semantic Model 构建和 Change 演进。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。
---

## Specification

### Section: 通过 Semantic Model Build 构建模型

Realization SHALL 通过 Semantic Model Build 构建或重建 Semantic Model。

- **项目需要建立模型**

  - 用户授权模型构建范围与依据
  - Realization 进入 Semantic Model Build

### Section: 通过 Change Realization 落实变更

Realization SHALL 通过 Change Realization 将已授权 Change 落实为项目新状态并完成收束。

- **Change 获得授权**

  - 完整 Change 可进入实现
  - Realization 推进 Change Implementation 与 Closure

### Section: Participants 承担协作职责

Realization SHALL 由 Participants 承担授权、判断与编排。

- **推进需要语义判断**

  - 确定性操作不足以完成决策
  - 适用 Participant 承担判断

### Section: Interaction Surfaces 提供操作支撑

Realization SHALL 由 Interaction Surfaces 提供配置、呈现与确定性操作。

- **推进需要模型操作**

  - Agent 需要查询、校验或状态转换
  - 它通过适用 Interaction Surface 完成操作

### Section: 以两个维度完整描述落实

Realization SHALL 由推进过程完整描述 Activity 或 Stage 的入口、推进、约束与结果，并由协作结构完整描述 Participant 或 Agent 工作身份的授权、责任、判断、操作、协调与交付。

- **理解同一落实工作**

  - 用户或 Agent 查看一个 Realization 工作
  - 推进过程说明工作如何成立且协作结构说明主体承担什么职责

### Section: 允许跨维度语义覆盖

推进过程与协作结构 MAY 在各自维度表达相互覆盖的规范语义，且任一维度 SHALL NOT 被表达为另一维度的差量。

- **Role 承担 Activity**

  - Agent 工作身份描述其承担 Activity 的相关职责
  - Activity 与 Role Contracts 分别保持各自维度的完整语义
