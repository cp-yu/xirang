---
entity: element-declaration
identity: change-artifacts
kind: element
parent: change-plan
title: Change Artifacts
definition: Change Artifacts 定义 Change 制品集合的结构化语义：proposal/design/tasks 作为 compilation scaffolding，四分区 Semantic Delta 作为 behavior/architecture source；effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不存在持久化 review artifact；Validation commands 保持只读，generated write behavior 由显式 workflow command 持有。
---

## REMOVED Requirements

### Requirement: Definition-first authoring

## ADDED Requirements

### Requirement: 制品定义先行写作

Artifact instructions SHALL 按制品定义先行顺序投影 inputs；通用 artifact instruction SHALL 不编排 validate、diff write、sync 或 archive workflow。

#### Scenario: Instructions JSON 返回 definition 与 current state

- **WHEN** Agent 请求 artifact instructions
- **THEN** JSON SHALL 分别返回 definition、instruction、template、dependencies、outputPath、currentState 与 configProjection

#### Scenario: Blocked artifact 仍可理解

- **WHEN** dependencies 未完成
- **THEN** instructions SHALL 仍返回 definition 与 current state

#### Scenario: 通用 guidance 不编排派生操作

- **WHEN** Agent 获取语义制品 instruction
- **THEN** SHALL 禁止 operation labels 并要求完整目标 Requirements
- **AND** MUST NOT 调用独立 metadata command

#### Scenario: 文本输出按制品定义先行顺序展示

- **WHEN** Agent 请求文本 instructions
- **THEN** definition SHALL 位于 artifact-specific instruction 与 template 前

#### Scenario: Instructions JSON 包含 definition

- **WHEN** 用户执行 `xirang instructions specs --change <id> --json`
- **THEN** 输出 SHALL 匹配扩展后的 `ArtifactInstructions` interface
- **AND** `definition` SHALL 与当前内置 Schema 的 specs artifact definition 一致

#### Scenario: Definition 不受 config rules 覆盖

- **WHEN** project config 为 artifact 提供 context、rules 或 prose projection
- **THEN** 这些字段 SHALL 与 definition 分开返回
- **AND** MUST NOT 改变 file purpose、compilation role、content boundary 或 write policy
