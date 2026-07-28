---
entity: element-declaration
identity: explore
kind: capability
parent: intent-first-path
title: "Explore"
definition: "基于模型与项目证据澄清用户意图、范围、影响和设计。"
---

## Requirements

### Requirement: 识别语义影响面
Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。

#### Scenario: 分析潜在变更
- **WHEN** 用户意图可能影响现有项目语义
- **THEN** Explore 联合模型与项目证据确定相关范围

### Requirement: 一次一问并比较方案
Explore SHALL 通过一次一问与方案比较推进设计。

#### Scenario: 存在多个合理方案
- **WHEN** 不同方案具有不同权衡
- **THEN** Explore 比较方案并一次请求一个用户决策

### Requirement: 分段确认复杂变更设计
对复杂变更，Explore SHALL 分段确认适用的 architecture、components、data flow、technology、testing 与 risks。

#### Scenario: 变更跨越多个设计维度
- **WHEN** 单次确认不足以审查设计
- **THEN** Explore 逐段呈现并确认适用维度

### Requirement: 确认窄变更最低设计集
对窄变更，Explore SHALL 至少确认 problem、impact scope、approach 与 verification method。

#### Scenario: 变更范围有限
- **WHEN** 完整复杂设计分段不适用
- **THEN** Explore 仍确认最低设计集

### Requirement: 形成 Conversation-only Design Summary
Explore SHALL 将已确认内容收成 conversation-only Design Summary，作为交给 Propose 的 Change 雏形。

#### Scenario: Explore 完成
- **WHEN** 适用设计内容均已确认
- **THEN** Explore 产出 Design Summary

### Requirement: 不形成完整 Change
Explore SHALL NOT 形成完整 Change。

#### Scenario: Design Summary 已形成
- **WHEN** Explore 到达出口
- **THEN** 完整 Change 仍由 Propose 形成
