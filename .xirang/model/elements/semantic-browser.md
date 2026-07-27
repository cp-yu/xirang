---
entity: element-declaration
identity: semantic-browser
kind: capability
parent: interaction-surfaces
title: "Semantic Browser"
summary: "以 Views 可视化浏览 Semantic Model 与 Change-derived information 的界面。"
---

## Requirements

### Requirement: 支持分层语义浏览
Semantic Browser SHALL 使用 Views 呈现不同抽象层级的 Elements、Element Contracts 与 Relationships，并允许用户沿层级下钻理解项目。

#### Scenario: 浏览 Element 详情
- **WHEN** 用户选择一个 Element
- **THEN** Browser 展示其声明、契约、关系和适用的 refinement context

### Requirement: 呈现 Change 目标与差异
Semantic Browser SHALL 对活动 Change 呈现由当前 Semantic Model 与 Semantic Delta 确定性推导的 Expected Semantic Model 和 change-derived diff。

#### Scenario: 审查活动 Change
- **WHEN** 用户切换到一个 Change 视角
- **THEN** Browser 显示目标模型及其相对正式模型的语义差异
