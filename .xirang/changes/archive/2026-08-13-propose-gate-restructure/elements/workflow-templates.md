---
operation: MODIFIED
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、verify 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## REMOVED Requirements

### Requirement: Agent definition-first authoring

## ADDED Requirements

### Requirement: Agent 制品定义先行写作

编写 Project Build source 的 workflow template SHALL 消费 Candidate contract 与 CLI command surface，且 SHALL NOT 重新引入 phase-specific bootstrap instructions。

#### Scenario: Build skill authoring

- **WHEN** 生成 `xirang-build`
- **THEN** SHALL 指导 Agent 询问 exploration scope 与 build starting point
- **AND** SHALL 指导 Agent 编写 `build.md` 与四分区 Candidate
- **AND** SHALL 指导 Agent 使用 `xirang candidate validate` diagnostics
- **AND** SHALL NOT 要求退役的 bootstrap instructions、scan/map files 或固定 subagent roles

## MODIFIED Requirements

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以共享 Xirang Philosophy 开头；具体 authoring、canonical syntax 与 gate 规则 SHALL 由对应 workflow surface 声明，不得重新扩写项目哲学。Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中。

#### Scenario: Explore skill 的 instructions 结构

- **WHEN** explore skill 被生成
- **THEN** instructions SHALL 包含 Xirang Philosophy、只读 workflow stage、Required References、Hard Rules、Required Context、Semantic Impact 与唯一 Brainstorming Checklist
- **AND** SHALL NOT 重复完整 brainstorming flow

#### Scenario: Apply skill 的 instructions 结构

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 以 Xirang Philosophy 开头，后接制品定义先行写作规则、Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `.xirang/references/xirang-apply-step-<N>-<name>.md` 文件
