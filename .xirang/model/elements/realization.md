---
entity: element-declaration
identity: realization
kind: domain
parent: project.root
title: "Realization"
summary: "由参与者通过交互界面落实 Semantic Model 构建与 Change 演进的过程维。"
---

## Requirements

### Requirement: 通过 Semantic Model Build 构建模型
Realization SHALL 通过 Semantic Model Build 构建或重建 Semantic Model。

#### Scenario: 项目需要建立模型
- **WHEN** 用户授权模型构建范围与依据
- **THEN** Realization 进入 Semantic Model Build

### Requirement: 通过 Change Realization 落实变更
Realization SHALL 通过 Change Realization 将已授权 Change 落实为项目新状态并完成收束。

#### Scenario: Change 获得授权
- **WHEN** 完整 Change 可进入实现
- **THEN** Realization 推进 Change Implementation 与 Closure

### Requirement: Participants 承担协作职责
Realization SHALL 由 Participants 承担授权、判断与编排。

#### Scenario: 推进需要语义判断
- **WHEN** 确定性操作不足以完成决策
- **THEN** 适用 Participant 承担判断

### Requirement: Interaction Surfaces 提供操作支撑
Realization SHALL 由 Interaction Surfaces 提供配置、呈现与确定性操作。

#### Scenario: 推进需要模型操作
- **WHEN** Agent 需要查询、校验或状态转换
- **THEN** 它通过适用 Interaction Surface 完成操作
