# Build Skill Kind Semantics — Design

## Context

`xirang-build` skill 生成源 `src/core/templates/workflows/build.ts` 在 2026-08 全量重建前未覆盖以下场景：
- Element Kind 被隐性当作层级约束（domain/capability/perspective 各有白名单）
- legacy 内容迁移没有规定方式（程序化映射 vs agent 选择归属）
- 用户介入后 promotion 未区分用户/agent 修改对 review 有效性的影响

## Goals / Non-Goals

**Goals**：
- Element Kind 在 build skill 中明确为语义标签而非层级约束，`parent` 必需、children 由 parents 推导
- legacy/formal 内容迁移：非复制改写必须走 subagent（初始阶段询问模型），内容归属是需 model 理解能力的语义选择
- review 检查 recovered 内容不复活退役语义
- 用户修改视为认可可直接 promote，agent 修改需重新 review

**Non-Goals**：
- 不修改其他 skill（explore、propose、apply、archive 等不在本次范围）
- 不对 Semantic Model 的规范性语义做任何修改

## Decisions

1. **Kind 语义**：kind 是语义标签、不约束层级。项目是否使用 domain/capability/perspective 是用户/项目决策，不写入框架规则。
2. **迁移方式**：非复制迁移必须 subagent，有 subagent 则用，且初始阶段询问用户所用模型。内容归属（Element/层级/Contract Requirement/Scenario）是 model 理解能力的语义选择，不机械映射。
3. **Promotion 处理**：用户手动修改 = 认可 → 重新 validate 后直接 promote；agent 修改 → 重新 review。用户介入预期有返修，多轮 review 是常态。

## Risks / Trade-offs

- 无。本次修改仅改进生成源指令，不改变运行时行为或模型语义。