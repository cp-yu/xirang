---
entity: element-declaration
identity: propose
kind: capability
parent: intent-first-path
title: "Propose"
summary: "把已确认设计收成完整 Change 的 Formation 活动。"
---

## ADDED Requirements

### Requirement: 遵循共享 Contract 语义
Propose SHALL 按共享 Element Contract、Requirement 与 Scenario 语义编写 Contract Delta，并以 Requirement 的独立演进边界确定 Entries。

#### Scenario: 编写多个 Contract 义务
- **WHEN** 已确认设计包含可独立变化的规范承诺
- **THEN** Propose 将其表达为独立 Requirement Entries，并仅以 Scenarios 具体化各自宿主 Requirement
