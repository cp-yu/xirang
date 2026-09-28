---
entity: element-declaration
identity: interaction-surfaces
kind: element
parent: collaboration-structure
title: Interaction Surfaces
definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Web 支持 Visual Presentation。
---

## Specification

### Section: 维护项目与工具集成

Interaction Surfaces SHALL 建立和维护息壤项目、项目配置与 Agent 工具集成。

- **配置项目**

  - 用户建立或更新息壤项目
  - 界面维护项目与所选 Agent 工具的配置

### Section: 提供确定性操作

Interaction Surfaces SHALL 为 Realization 提供确定性操作。

- **重复相同有效操作**

  - CLI 接收相同有效输入
  - 操作产生一致结果

### Section: 通过 Views 呈现语义信息

Interaction Surfaces SHALL 以 Views 呈现 Semantic Model 与 Change-derived information。

- **用户浏览 Change**

  - 用户选择一个活动 Change
  - 界面使用适用 View 呈现模型和差异

### Section: 不构成语义来源

Interaction Surfaces SHALL NOT 构成新的规范性语义来源。

- **界面显示派生信息**

  - 界面组织或布局模型信息
  - 规范语义仍由 Semantic Model、Change 与用户决策决定

### Section: 保持呈现方法非独占

CLI 与 Web 对 Text/Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。

- **CLI 输出文本 View**

  - CLI 以人类可读文本呈现模型信息
  - 该文本呈现不因 CLI 存在而转归 Web 所有

### Section: 由 CLI 与 Web 组成

Interaction Surfaces SHALL 由 CLI 与 Web 两类界面共同支撑 Realization。

- **选择交互界面**

  - 用户或 Agent 需要操作或理解息壤
  - 使用 CLI 或 Web
