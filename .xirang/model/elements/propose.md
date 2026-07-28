---
entity: element-declaration
identity: propose
kind: capability
parent: intent-first-path
title: Propose
definition: 把已确认设计收成完整 Change 的 Formation 活动。
---

## Requirements

### Requirement: 复用已确认 Design Summary

Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary。

#### Scenario: Design Summary 已存在

- **WHEN** Propose 接收完整 Summary
- **THEN** Agent 忠实编译已确认决策

### Requirement: 补足最低语义就绪条件

缺少 Design Summary 时，Propose SHALL 先确认 problem、impact scope、approach 与 verification method 足够清晰。

#### Scenario: 用户直接进入 Propose

- **WHEN** 对话中没有完整 Summary
- **THEN** Agent 在编写 Change 前确认最低设计集

### Requirement: 编写完整 Semantic Delta

Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

#### Scenario: 目标设计已明确

- **WHEN** Agent 编译目标状态
- **THEN** Delta 完整表达新增、修改或移除的语义

### Requirement: 编写完整 Change Plan

Propose SHALL 以 Change Plan 解释意图与实现路径。

#### Scenario: Change 需要审查与执行

- **WHEN** Agent 形成 Plan
- **THEN** Plan 提供适用的意图、决策和执行安排

### Requirement: 完成 Formation 审查与确认

Propose SHALL 在 Change Formation 内完成必要审查与确认。

#### Scenario: Change 仍有未决内容

- **WHEN** 目标语义或实现路径尚未确认
- **THEN** Propose 不得完成

### Requirement: 不实现项目

Propose SHALL NOT 实现项目。

#### Scenario: Change 已完整形成

- **WHEN** Propose 到达出口
- **THEN** 项目实现仍由后续 Apply 落实

### Requirement: 不更新或关闭 Change 状态

Propose SHALL NOT 将 Semantic Delta 同步到 Semantic Model，也 SHALL NOT 关闭 Change。

#### Scenario: Delta 校验通过

- **WHEN** 完整 Change 可进入 Change Implementation
- **THEN** 正式模型与活动 Change 状态保持未收束

### Requirement: 遵循共享 Contract 语义

Propose SHALL 按共享 Element Contract、Requirement 与 Scenario 语义编写 Contract Delta，并以 Requirement 的独立演进边界确定 Entries。

#### Scenario: 编写多个 Contract 义务

- **WHEN** 已确认设计包含可独立变化的规范承诺
- **THEN** Propose 将其表达为独立 Requirement Entries，并仅以 Scenarios 具体化各自宿主 Requirement
