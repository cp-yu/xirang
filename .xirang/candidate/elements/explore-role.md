---
entity: element-declaration
identity: explore-role
kind: capability
parent: agent
title: Explore Role
definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，形成不持久化的 Design Summary；用户选择先处理 Change 的结构定义时，它先推进 Definition Framing，并通过 CLI 持久化用户明确确认的 Change Structural Definition。
---

## Requirements

### Requirement: 保持只读工作边界

Explore Role SHALL 保持项目实现、Semantic Model、generated Agent surfaces 与除 Change Structural Definition 外的 active Change artifacts 只读，并 MAY 使用 `xirang framing` 持久化用户明确确认的 Change Structural Definition。

#### Scenario: Definition Framing 获得明确持久化确认

- **WHEN** 用户确认完整结构 payload
- **THEN** Agent 通过 `xirang framing` 写入受控隐藏文件而不直接修改其他项目或 Change 制品

### Requirement: 交付 Design Summary

Explore Role SHALL 将 Explore 形成的不持久化 Design Summary 交付给 Propose；Explore 已形成 Change Structural Definition 时，SHALL 同时保留该可寻址结构来源。

#### Scenario: Explore 活动完成

- **WHEN** 适用设计内容已确认
- **THEN** Agent 将 Design Summary 作为下一活动输入，并在已形成结构定义时同时交付其 identity

### Requirement: 不实现项目

Explore Role SHALL NOT 实现项目。

#### Scenario: 设计方案已确认

- **WHEN** Explore 到达出口
- **THEN** Agent 进入 Propose 而不修改实现
