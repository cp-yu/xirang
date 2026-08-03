---
entity: element-declaration
identity: realization-process
kind: perspective
parent: realization
title: 推进过程
definition: 推进过程是按落实工作如何发生的过程角度组织 Semantic Model Build 与 Change Realization 的 Perspective。它包含各阶段和活动的入口、顺序、约束与结果，不包含承担这些工作的 Participants、Agent 工作身份或 Interaction Surfaces。
---

## Requirements

### Requirement: 推进过程维度组织

realization-process SHALL 从过程推进角度组织 Realization 的落实活动：Semantic Model Build 构建或重建 Semantic Model，Change Realization 将已授权 Change 落实为项目新状态并收束。

#### Scenario: 推进过程容纳两类落实活动

- **WHEN** 浏览 realization-process 的 descendants
- **THEN** 呈现 Semantic Model Build 与 Change Realization 及其细化阶段

#### Scenario: 过程维度不定义语义来源

- **WHEN** 用户或 Agent 依据推进过程推进项目
- **THEN** 过程维度自身不构成新的语义来源
- **AND** 规范性语义仍由 Semantic Model 与 Change 表达
