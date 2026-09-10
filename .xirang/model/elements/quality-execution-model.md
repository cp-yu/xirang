---
entity: element-declaration
identity: quality-execution-model
kind: element
parent: quality
title: Quality Execution Model
definition: Quality Execution Model 定义 quality 与 archive 复用的固定 subagent-orchestrated 执行模型：所有工具使用同一模板骨架，顶层 agent 只负责输入收集、subagent orchestration、write-back 应用、checkpoint 管理与结果持久化，且不存在 reread fallback。它不定义 reviewer 与 optimizer 自身的判断标准，也不定义命令面的输入形状。
---

## Requirements

### Requirement: Quality 模板选择遵循执行模型

系统 SHALL 使用 subagent-orchestrated quality 模板骨架，而不是按工具选择 execution model。

#### Scenario: 所有工具使用 subagent 骨架

- **WHEN** 系统生成 quality 工作流 skill
- **THEN** 系统 SHALL 选择 subagent-orchestrated quality 模板骨架
- **AND** 该骨架中的顶层 agent SHALL 只负责输入收集、subagent orchestration、write-back 应用、checkpoint 管理与结果持久化
- **AND** 顶层模板 SHALL NOT 内嵌 completeness、correctness 或 coherence 的直接判断步骤

#### Scenario: 不存在 reread fallback

- **WHEN** 系统为任一受支持工具生成 quality 工作流 skill
- **THEN** 系统 SHALL NOT 选择 current-agent-reread 模板骨架
- **AND** SHALL 使用 subagent-orchestrated 模板骨架

#### Scenario: 选择逻辑使用显式 lookup

- **WHEN** 系统解析 quality 模板骨架
- **THEN** 系统 SHALL 返回 subagent-orchestrated execution model
- **AND** SHALL NOT 通过工具查找、字符串模式匹配、路径模式匹配或隐式约定推断 subagent 支持能力

### Requirement: Archive 重跑复用同一执行模型骨架

系统 SHALL 在 archive 需要重跑 full quality 流程时，复用与 standalone quality 相同的 subagent-orchestrated orchestration 合约。

#### Scenario: archive 复用 subagent 骨架

- **WHEN** archive 因 Review 记录缺失或状态为 `dirty` 而需要执行 full quality 流程
- **THEN** 系统 SHALL 复用与 standalone quality 相同的 subagent-orchestrated 模板骨架
- **AND** SHALL NOT 维护另一套 archive-only Review skeleton

#### Scenario: archive 不存在 reread fallback

- **WHEN** archive 因 Review 记录缺失或状态为 `dirty` 而需要执行 full quality 流程
- **THEN** 系统 SHALL NOT 使用 current-agent-reread skeleton
- **AND** SHALL 保持与 standalone quality 一致的 Optimization eligibility 语义
