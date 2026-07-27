---
entity: element-declaration
identity: interaction-surfaces
kind: domain
parent: realization
title: "Interaction Surfaces"
summary: "供用户与 Agents 配置、理解和操作息壤的界面体系。"
---

## Requirements

### Requirement: 由 CLI 与 Semantic Browser 组成
Interaction Surfaces SHALL 由 CLI 与 Semantic Browser 两类界面共同支撑 Realization。

#### Scenario: 选择交互界面
- **WHEN** 用户或 Agent 需要操作或理解息壤
- **THEN** 使用 CLI 或 Semantic Browser

### Requirement: 维护项目与工具集成
Interaction Surfaces SHALL 建立和维护息壤项目、项目配置与 Agent 工具集成。

#### Scenario: 配置项目
- **WHEN** 用户建立或更新息壤项目
- **THEN** 界面维护项目与所选 Agent 工具的配置

### Requirement: 提供确定性操作
Interaction Surfaces SHALL 为 Realization 提供确定性操作。

#### Scenario: 重复相同有效操作
- **WHEN** CLI 接收相同有效输入
- **THEN** 操作产生一致结果

### Requirement: 通过 Views 呈现语义信息
Interaction Surfaces SHALL 以 Views 呈现 Semantic Model 与 Change-derived information。

#### Scenario: 用户浏览 Change
- **WHEN** 用户选择一个活动 Change
- **THEN** 界面使用适用 View 呈现模型和差异

### Requirement: 不构成语义来源
Interaction Surfaces SHALL NOT 构成新的规范性语义来源。

#### Scenario: 界面显示派生信息
- **WHEN** 界面组织或布局模型信息
- **THEN** 规范语义仍由 Semantic Model、Change 与用户决策决定
