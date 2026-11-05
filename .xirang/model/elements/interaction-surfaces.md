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

CLI、Web 与 Neovim 对 Text Presentation 和 Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。CLI 与 Neovim 可支持 Text Presentation，Web 支持 Visual Presentation。

- 用户通过 Neovim 查看 Change 的模型前后文本差异时，界面以人类可读文本传达 Change-derived information。
- 交互界面之间的呈现方式不改变 Semantic Model 或 Change 的规范性语义。

### Section: 由 CLI、Web 与 Neovim 组成

Interaction Surfaces SHALL 由 CLI、Web 与 Neovim 三类交互界面共同支撑 Realization，各自提供确定性操作或语义呈现能力。

- 用户或 Agent 需要配置、操作或理解息壤时，可使用 CLI、Web 或 Neovim 中适用的界面。
- CLI 提供确定性操作与结构化数据；Web 提供浏览器可视化浏览；Neovim 提供 Change 文件级文本审阅。
