---
entity: element-declaration
identity: artifact-pipeline
kind: element
parent: agent-workbench-projection
title: Artifact Pipeline
definition: Artifact Pipeline 定义生成 skill artifacts 的 canonical workflow manifest、Tool Profile Registry、ordered transform pipeline、shared artifact sync engine 与 fidelity guardrails。
---

## Requirements

### Requirement: Canonical Workflow Manifest
canonical workflow manifest SHALL 是生成 skill artifacts 的唯一 source of truth，并 SHALL 包含六个 user workflows：propose、explore、apply、archive、build 和 snack。

#### Scenario: 仅注册一次 Project Build
- **WHEN** 生成 Project Build workflow
- **THEN** manifest entry SHALL 使用 workflow ID `build`、skill name `xirang-build` 与 skill directory `xirang-build`
- **AND** 所有 tool projections SHALL 从该 entry 派生
- **AND** manifest SHALL NOT 包含退役的 build 工作流名称

### Requirement: Tool Profile Registry

系统 SHALL 定义捕获每个工具 skill generation capabilities 的 tool profile registry。

#### Scenario: Resolve tool capabilities

- **WHEN** 为所选工具生成 artifacts
- **THEN** 系统 SHALL 解析声明 skill path capability 与 transform set 的 tool profile
- **AND** 支持 skills 的工具 SHALL 被显式处理而不使用 command adapter fallback

#### Scenario: Capability consistency validation

- **WHEN** 运行 validation checks
- **THEN** 系统 SHALL 检测 configured tools 与 profile definitions 之间的不匹配
- **AND** 在 development/CI 中以可操作错误失败

### Requirement: Ordered Transform Pipeline

系统 SHALL 支持带显式 scope 语义的 ordered artifact transforms，并 SHALL 通过 shared artifact sync engine 应用于 skill generation paths。

#### Scenario: Apply tool-specific rewrites declaratively

- **WHEN** 某工具需要 instruction rewrites
- **THEN** 这些 rewrites SHALL 实现为带显式 applicability predicates 的 registered transforms
- **AND** generation entry points SHALL NOT 实现 ad-hoc rewrite logic

#### Scenario: Skills path uses transform pipeline

- **WHEN** skill generation 通过 ArtifactSyncEngine 生成 skill artifacts
- **THEN** 每个 skill 的 instructions SHALL 以 `artifactType: 'skill'` 经 transform pipeline 处理
#### Scenario: Execute pre-adapter and post-adapter transforms
- **WHEN** generating a skill artifact
- **THEN** matching skill transforms SHALL execute in deterministic order based on phase and priority
- **AND** command adapter phases SHALL NOT be required for skill artifact generation
#### Scenario: Command path uses transform pipeline
- **WHEN** workflow artifacts are generated
- **THEN** command artifact transform paths SHALL NOT run
- **AND** command adapters SHALL NOT be invoked
### Requirement: Shared Artifact Sync Engine
Setup 和 update SHALL 使用 shared artifact sync engine 生成 `xirang-build` 及相关 managed artifacts，并 SHALL NOT 生成第二套 command surface。

#### Scenario: Setup/update 保持 parity
- **WHEN** setup 或 update 写入 workflow skills
- **THEN** 两者 SHALL 使用同一个 manifest-derived engine
- **AND** generated output SHALL 收敛到六个 fixed workflow set

### Requirement: Fidelity Guardrails

系统 SHALL 执行防止重构期间 output drift 的 guardrails。

#### Scenario: Projection parity checks

- **WHEN** CI 运行 template generation tests
- **THEN** 它 SHALL 验证 manifest-derived projections 对 workflows 与 skill directories 保持一致
- **AND** 检测 missing exports 或 missing workflow registration

#### Scenario: Output parity checks

- **WHEN** 运行代表性 workflow/tool 组合的 parity tests
- **THEN** 生成的 skill artifacts SHALL 与已批准基线行为等价，除非有意改变
- **AND** 有意改变 SHALL 在显式 spec/proposal updates 中记录
