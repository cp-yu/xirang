---
operation: MODIFIED
entity: element-declaration
identity: interaction-surfaces
kind: element
parent: collaboration-structure
title: Interaction Surfaces
definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Web 支持 Visual Presentation。
---

## ADDED Requirements

### Requirement: 由 CLI 与 Web 组成

Interaction Surfaces SHALL 由 CLI 与 Web 两类界面共同支撑 Realization。

#### Scenario: 选择交互界面

- **WHEN** 用户或 Agent 需要操作或理解息壤
- **THEN** 使用 CLI 或 Web

## MODIFIED Requirements

### Requirement: 保持呈现方法非独占

CLI 与 Web 对 Text/Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。

#### Scenario: CLI 输出文本 View

- **WHEN** CLI 以人类可读文本呈现模型信息
- **THEN** 该文本呈现不因 CLI 存在而转归 Web 所有

## REMOVED Requirements

### Requirement: 由 CLI 与 Semantic Browser 组成
