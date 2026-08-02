---
entity: element-declaration
identity: reviewer
kind: capability
parent: internal-agents
title: Reviewer
definition: Reviewer 评估当前项目状态是否完整、正确且一致地实现 Expected Semantic Model。它独立读取 Semantic Model、Change、项目状态与证据，先证据、后结论；阻塞问题形成 Required Corrections 返回 Apply。Review 通过时，当前状态才有资格成为 Checkpoint；Reviewer 不创建或恢复 Checkpoint，不修改项目。
---

## Requirements

### Requirement: 独立取得 Review 证据
Reviewer SHALL 自主读取 Review 所需的 Semantic Model、Change、项目状态与证据，不依赖 Apply 的完成声明。

#### Scenario: Reviewer 接受评估任务
- **WHEN** Review 开始
- **THEN** Reviewer 从当前状态独立取得依据

### Requirement: 保持只读且不管理 Checkpoint
Reviewer SHALL NOT 修改项目、创建 Checkpoint 或恢复 Checkpoint。

#### Scenario: Reviewer 发现问题
- **WHEN** 当前状态需要修正
- **THEN** Reviewer 返回结论而不改变被评估状态

### Requirement: 交付结构化 Review 结论
Reviewer SHALL 将通过结论、Required Corrections 或证据缺口作为结构化结果交付给 Agent。

#### Scenario: Review 完成
- **WHEN** Reviewer 已完成证据判断
- **THEN** Agent 获得用于下一步编排的结论
