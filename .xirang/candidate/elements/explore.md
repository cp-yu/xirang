---
entity: element-declaration
identity: explore
kind: capability
parent: intent-first-path
title: Explore
definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计，并形成不持久化的 Design Summary；当用户选择先处理 Change 的结构定义时，Explore 先进入 Definition Framing，形成 Change Structural Definition。
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

对复杂变更，Explore SHALL 分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks。

#### Scenario: 变更跨越多个设计维度

- **WHEN** 单次确认不足以审查设计
- **THEN** Explore 逐段呈现并确认适用维度

### Requirement: 确认窄变更最低设计集

对窄变更，Explore SHALL 至少确认 problem、impact scope、approach 与 verification method。

#### Scenario: 变更范围有限

- **WHEN** 完整复杂设计分段不适用
- **THEN** Explore 仍确认最低设计集

### Requirement: 不形成完整 Change

Explore SHALL NOT 形成完整 Change。

#### Scenario: Design Summary 已形成

- **WHEN** Explore 到达出口
- **THEN** 完整 Change 仍由 Propose 形成

### Requirement: 澄清 Element Definition 影响

Explore SHALL 在 Change 新增 Element，或改变 Element 的概念身份、包含与排除范围、parent、children 或 siblings 边界时，澄清完整目标 Definition；用户选择 Definition Framing 时，SHALL 将已确认结构持久化为 Change Structural Definition，否则 SHALL 将已确认内容纳入不持久化的 Design Summary。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

#### Scenario: Change 改变 Element 概念边界

- **WHEN** 不同 Definition 边界会产生不同 Semantic Delta
- **THEN** Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译

### Requirement: 支持可选 Definition Framing

Explore SHALL 通过 Design Exploration 推进设计；用户选择先处理 Change 的结构定义时，Explore SHALL 先进入 Definition Framing。Change Structural Definition 发生更新后，Explore SHALL 重新检查依赖原结构的设计结论。

#### Scenario: 用户不选择先处理结构定义

- **WHEN** Explore 直接推进 Design Exploration
- **THEN** Change Structural Definition 不作为完成 Explore 的前提

#### Scenario: 已确认结构发生修订

- **WHEN** Definition Framing 更新 Change Structural Definition
- **THEN** Explore 在继续或完成 Design Exploration 前重新检查受影响决策

### Requirement: 形成不持久化的 Design Summary

Explore SHALL 由 Design Exploration 将已确认设计收成不持久化的 Design Summary。Change Structural Definition 已形成时，它与 Design Summary 共同构成 Change 雏形；未形成时，Design Summary 独立构成 Change 雏形。

#### Scenario: Explore 完成且已有结构定义

- **WHEN** Change Structural Definition 与适用设计内容均已确认
- **THEN** Explore 产出 Design Summary 并保留已确认 Change Structural Definition

#### Scenario: Explore 完成且没有结构定义

- **WHEN** 适用设计内容已确认且用户未选择 Definition Framing
- **THEN** Explore 只以 Design Summary 构成 Change 雏形
