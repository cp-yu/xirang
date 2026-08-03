---
entity: element-declaration
identity: project-build-role
kind: element
parent: agent
title: Project Build Role
definition: Project Build 是 Agent 构建或重建 Semantic Model 的工作身份。它在用户授权的探索范围与声明的权威依据下，编写完整的 Candidate Semantic Model，使用 CLI 做只读校验，向用户呈现 valid Candidate 与 review digest；仅在用户确认后，由 CLI 将 Candidate 原子提升为 Semantic Model。
---

## ADDED Requirements

### Requirement: 初始阶段检测 subagent 可用性并询问模型

Project Build Role SHALL 在初始询问阶段（与探索范围选择同时）检测当前环境是否可用 subagent，可用时询问用户 subagent 应使用什么模型。

#### Scenario: 检测 subagent 可用性

- **WHEN** Build 启动且用户已选择探索范围
- **THEN** Agent SHALL 检测当前环境是否提供 subagent 能力
- **AND** 可用时 SHALL 询问用户后续 subagent 使用什么模型

#### Scenario: Subagent 不可用

- **WHEN** 当前环境无法提供 subagent
- **THEN** Agent SHALL 继续使用自身模型完成迁移工作
- **AND** 非复制改写仍应由 Agent 选择内容归属

### Requirement: 审查已恢复内容不复活退役语义

Project Build Role SHALL 在委托 clean-context semantic review 时，要求 subagent 检查 recovered legacy/formal 内容是否匹配当前行为且不复活退役词汇或已记录排除项。

#### Scenario: Review 发现已恢复内容包含退役行为

- **WHEN** subagent 发现 recovered 内容正向使用已排除的语义（如 Spec store、architecture-delta.c4 持久化、impact-sweeper）
- **THEN** review 返回 BLOCKER 或 HIGH finding
- **AND** Agent 修正 Candidate 后重新审查

### Requirement: 区分用户与 Agent 修改后的 promotion 处理

Project Build Role SHALL 在 promotion 前重跑 `candidate validate --json` 并呈现新 digest。若 digest 自上次审查后变化：由用户手动修改的视为用户对当前内容认可，可直接 promote；由 Agent 修改的使 review 结论失效，需重新审查。

#### Scenario: 用户手动修改后 digest 变化

- **WHEN** 用户直接在 Candidate 中编辑文件
- **AND** 重新 validate 后 digest 与上次审查不同
- **THEN** Agent SHALL 视为用户已认可当前内容
- **AND** 可不经重新审查直接 promote

#### Scenario: Agent 修改后 digest 变化

- **WHEN** Agent 因修正 review finding 或用户要求修改 Candidate
- **AND** 重新 validate 后 digest 与上次审查不同
- **THEN** Agent SHALL 启动新的 clean-context review
- **AND** SHALL NOT 跳过审查直接 promote

#### Scenario: 用户介入通常意味着返修

- **WHEN** 用户参与 Build 过程中手动修改或要求更改
- **THEN** Agent SHALL 将多次 review 轮次与重新验证视为预期流程
- **AND** SHALL NOT 视为失败
