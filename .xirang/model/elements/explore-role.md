---
entity: element-declaration
identity: explore-role
kind: capability
parent: agent
title: "Explore Role"
summary: "在 Intent-first Path 中澄清和确认设计的 Agent 工作身份。"
---

## Requirements

### Requirement: 保持只读工作边界
Explore Role SHALL 保持项目与 Change 制品只读。

#### Scenario: Explore 需要更多证据
- **WHEN** Agent 查询模型或项目状态
- **THEN** 它读取证据而不修改项目或完整 Change

### Requirement: 交付 Design Summary
Explore Role SHALL 将 Explore 形成的 conversation-only Design Summary 交付给 Propose。

#### Scenario: Explore 活动完成
- **WHEN** 设计内容已确认
- **THEN** Agent 将 Summary 作为下一活动输入

### Requirement: 不实现项目
Explore Role SHALL NOT 实现项目。

#### Scenario: 设计方案已确认
- **WHEN** Explore 到达出口
- **THEN** Agent 进入 Propose 而不修改实现
