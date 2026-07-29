---
operation: ADDED
entity: element-declaration
identity: design-exploration
kind: capability
parent: explore
title: Design Exploration
definition: Explore 中基于 Semantic Model、项目证据与可用的已确认结构澄清和确认设计的阶段。
---

## ADDED Requirements

### Requirement: 使用可用的当前完整结构定义
Change Structural Definition 存在时，Design Exploration SHALL 在开始或恢复时读取其完整 payload，并将其中已确认的 identities、Kinds、hierarchy 与 Relationships 作为设计依据；Change Structural Definition 不存在时，Design Exploration SHALL 直接基于 Semantic Model 与项目证据推进设计。

#### Scenario: 恢复中断且已有结构定义的 Explore
- **WHEN** Change Structural Definition 已存在
- **THEN** Agent 在继续设计前读取完整 payload 而不只依赖最近对话

#### Scenario: 未先处理结构定义
- **WHEN** Change Structural Definition 不存在
- **THEN** Design Exploration 不以运行 Definition Framing 为前提

### Requirement: 处理确定性影响
Design Exploration SHALL 将可用的 `xirang framing` Contract、View 与其他范围外 impacts 纳入适用设计 section。

#### Scenario: 新 Element Kind 要求 Contract
- **WHEN** framing validation 报告新 Element 需要 Contract
- **THEN** Design Exploration 确认对应行为语义与验证方式

### Requirement: 确认适用设计
Design Exploration SHALL 通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。

#### Scenario: 多个实现方案符合目标语义
- **WHEN** 多个方案具有不同权衡
- **THEN** Design Exploration 比较方案并请求用户选择

### Requirement: 形成不持久化的 Design Summary
Design Exploration SHALL 将已确认设计收成不持久化的 Design Summary，作为 Propose 的 Change Formation 输入。

#### Scenario: Design Exploration 完成
- **WHEN** 适用设计内容与 framing impacts 均已处理
- **THEN** Agent 呈现 Design Summary 并等待用户触发 Propose
