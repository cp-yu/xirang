---
entity: element-declaration
identity: intent-first-path
kind: domain
parent: change-formation
title: "Intent-first Path"
definition: "从用户意图出发，先澄清和形成 Change 再实现的路径。"
---

## Requirements

### Requirement: 从用户意图出发
Intent-first Path SHALL 以尚待形成 Change 的用户意图为起点，并在项目实现前形成 Change。

#### Scenario: 用户提出新意图
- **WHEN** 目标实现尚未发生
- **THEN** Agent 先进入 Formation

### Requirement: 先由 Explore 形成 Change 雏形
Intent-first Path SHALL 先通过 Explore 澄清意图、范围与影响，并形成 conversation-only Design Summary 作为 Change 雏形。

#### Scenario: 设计需要澄清
- **WHEN** 用户意图尚不能直接编译为 Change
- **THEN** Explore 推进设计确认并形成 Summary

### Requirement: 再由 Propose 形成完整 Change
Intent-first Path SHALL 再通过 Propose 将 Change 雏形收成包含 Semantic Delta 与 Change Plan 的完整 Change。

#### Scenario: Design Summary 已确认
- **WHEN** Propose 接收已确认 Summary
- **THEN** 它将内容编译为完整 Change

### Requirement: Formation 后方可实现
Intent-first Path SHALL 在完整 Change 形成并完成必要审查与确认后方可进入 Change Implementation。

#### Scenario: Change 尚未完整
- **WHEN** Delta、Plan 或确认任一缺失
- **THEN** 项目实现不得开始
