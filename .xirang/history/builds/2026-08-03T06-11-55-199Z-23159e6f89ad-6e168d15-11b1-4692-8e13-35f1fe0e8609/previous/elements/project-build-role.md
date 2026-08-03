---
entity: element-declaration
identity: project-build-role
kind: capability
parent: agent
title: Project Build Role
definition: 构建或重建完整 Semantic Model 的 Agent 工作身份。
---

## Requirements

### Requirement: 在授权边界内写入 Candidate

Project Build Role MAY 在用户授权范围与权威依据下写入 Candidate Semantic Model 与临时 `build.md`。

#### Scenario: Project Build 需要编译语义

- **WHEN** Agent 已获得范围和依据授权
- **THEN** 它只在 Candidate 工作区写入构建制品

### Requirement: 呈现 Candidate 并请求确认

Project Build Role SHALL 仅在完整 Candidate 通过 deterministic validation 与 clean-context semantic review 后，向用户呈现 Candidate、Formal comparison、审查信息与 review digest，并请求用户确认精确版本。

#### Scenario: Candidate 完成全部审查

- **WHEN** CLI 返回有效 digest 且 semantic review PASS
- **THEN** Agent 请求确认而不自行作出授权决定

### Requirement: 通过 CLI 推进确定性门禁

Project Build Role SHALL 使用 CLI 执行 Candidate 校验与经授权的 promotion，SHALL NOT 手工重做这些确定性操作。

#### Scenario: 用户确认当前 Digest

- **WHEN** Agent 获得精确版本授权
- **THEN** 它调用 CLI promotion

### Requirement: 编排 Modeling Decision Gate

Project Build Role SHALL 识别会改变目标 Semantic Model 的未决选择，向用户提供受限选项，并将裁决作为例外 provenance 记录到 `build.md`。

#### Scenario: 实现证据不能唯一确定用户意图

- **WHEN** 多个目标语义与现有权威相容
- **THEN** Agent 暂停相关编写并请求用户裁决

### Requirement: 委托 Clean-context Semantic Review

Project Build Role SHALL 将 structurally valid Candidate 的审查入口和权威依据交给通用 read-only clean-context subagent，SHALL NOT 将自身完成声明作为审查证据。

#### Scenario: Subagent 返回阻塞 Finding

- **WHEN** semantic review 返回 BLOCKER 或 HIGH
- **THEN** Agent 修正 Candidate 或返回 Modeling Decision Gate

### Requirement: 执行 Promotion 后检查

Project Build Role SHALL 在经授权 promotion 后执行 Candidate status、四分区目录和 Formal validation 检查，并只在全部满足时报告完成。

#### Scenario: Formal validation 失败

- **WHEN** promotion 命令已经成功但 post-check 失败
- **THEN** Agent 报告当前状态且不自动重试 promotion
