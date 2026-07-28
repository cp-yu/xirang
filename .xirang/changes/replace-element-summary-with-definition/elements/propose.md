---
entity: element-declaration
identity: propose
kind: capability
parent: intent-first-path
title: Propose
definition: 把已确认设计收成完整 Change 的 Formation 活动。
---

## ADDED Requirements

### Requirement: 编写完整 Definition 目标态
Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

#### Scenario: Design Summary 已确认概念边界
- **WHEN** Propose 编译受影响 Declaration
- **THEN** Delta 携带变化后完整 Definition，而非只描述本次新增或修改的部分

#### Scenario: Definition 边界仍未确认
- **WHEN** 现有证据不能唯一确定目标概念身份或边界
- **THEN** Propose 返回 Explore 或一次询问一个用户决策，且不猜测 Declaration 目标态
