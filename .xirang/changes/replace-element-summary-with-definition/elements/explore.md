---
entity: element-declaration
identity: explore
kind: capability
parent: intent-first-path
title: Explore
definition: 基于模型与项目证据澄清用户意图、范围、影响和设计。
---

## ADDED Requirements

### Requirement: 澄清 Element Definition 影响
Explore SHALL 在 Change 新增 Element，或改变 Element 的概念身份、包含与排除范围、parent、children 或 siblings 边界时，澄清完整目标 Definition 并将已确认内容纳入 conversation-only Design Summary；仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

#### Scenario: Change 改变 Element 概念边界
- **WHEN** 不同 Definition 边界会产生不同 Semantic Delta
- **THEN** Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译
