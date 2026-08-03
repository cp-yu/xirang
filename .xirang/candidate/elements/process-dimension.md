---
entity: element-declaration
identity: process-dimension
kind: perspective
parent: realization
title: 推进过程
definition: 推进过程是 Realization 中从过程推进角度组织落实活动的 Perspective：它容纳 Semantic Model Build 与 Change Realization，表达项目如何通过构建模型与落实 Change 持续演进。
---

## Requirements

### Requirement: 推进过程维度组织

process-dimension SHALL 从过程推进角度组织 Realization 的落实活动：Semantic Model Build 构建或重建 Semantic Model，Change Realization 将已授权 Change 落实为项目新状态并收束。

#### Scenario: 推进过程容纳两类落实活动

- **WHEN** 浏览 process-dimension 的 descendants
- **THEN** 呈现 Semantic Model Build 与 Change Realization 及其细化阶段

#### Scenario: 过程维度不定义语义来源

- **WHEN** 用户或 Agent 依据推进过程推进项目
- **THEN** 过程维度自身不构成新的语义来源
- **AND** 规范性语义仍由 Semantic Model 与 Change 表达
